
import React, { useMemo, useState, useRef } from 'react';
import { AppState, IRM, Course } from '../types';
import { TRANSLATIONS } from '../constants';
import { BarChart3, Download, PieChart, ListChecks, Grid3X3, Filter, Book, Star, Plus, Layers, Search, ChevronDown, ChevronUp, Save, X } from 'lucide-react';
import AILoader from '../components/AILoader';

// Sub-Modules
import MappingCourseListModule from './mapping/MappingCourseListModule';
import MappingSOMatrixModule from './mapping/MappingSOMatrixModule';
import MappingPIMatrixModule from './mapping/MappingPIMatrixModule';
import MappingCourseBlockModule from './mapping/MappingCourseBlockModule';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const AREA_HEX_COLORS: Record<string, string> = {
  'blue': '#3b82f6', 'indigo': '#6366f1', 'purple': '#a855f7', 'green': '#22c55e',
  'slate': '#64748b', 'red': '#ef4444', 'orange': '#f97316', 'yellow': '#eab308'
};

const MappingModule: React.FC<Props> = ({ state, updateState }) => {
  const { courses, sos, courseSoMap, coursePiMap, language, knowledgeAreas, generalInfo } = state;
  const t = TRANSLATIONS[language];
  
  const [activeTab, setActiveTab] = useState<'catalog' | 'so' | 'pi' | 'areas'>('catalog');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterEssential, setFilterEssential] = useState<boolean>(false); 
  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [statsScope, setStatsScope] = useState<'all' | 'abet'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tableVersion, setTableVersion] = useState(0);

  // Add Course Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCourseData, setNewCourseData] = useState<Partial<Course>>({
      code: '', name: { vi: '', en: '' }, credits: 3, semester: 1, 
      knowledgeAreaId: knowledgeAreas[0]?.id || 'other', type: 'REQUIRED', 
      isEssential: false, isAbet: false
  });

  // --- Optimization Lookups ---
  const soMappingLookup = useMemo(() => {
      const map = new Map<string, IRM>();
      (courseSoMap || []).forEach(m => map.set(`${m.courseId}-${m.soId}`, m.level));
      return map;
  }, [courseSoMap]);

  const courseMappedSoLookup = useMemo(() => {
      const map = new Map<string, Set<string>>();
      (courseSoMap || []).forEach(m => {
          if (m.level !== IRM.NONE) {
              if (!map.has(m.courseId)) map.set(m.courseId, new Set());
              map.get(m.courseId)!.add(m.soId);
          }
      });
      return map;
  }, [courseSoMap]);

  const piMappingLookup = useMemo(() => {
      const set = new Set<string>();
      (coursePiMap || []).forEach(m => set.add(`${m.courseId}-${m.piId}`));
      return set;
  }, [coursePiMap]);

  const courseMap = useMemo(() => new Map(courses.map(c => [c.id, c])), [courses]);

  // --- Filter Logic ---
  const filteredCourses = useMemo(() => {
      let result = courses;
      if (statsScope === 'abet') result = result.filter(c => c.isAbet);
      if (filterArea !== 'all') result = result.filter(c => c.knowledgeAreaId === filterArea);
      if (filterEssential) result = result.filter(c => c.isEssential);
      if (searchQuery) {
          const lower = searchQuery.toLowerCase();
          result = result.filter(c => (c.code || '').toLowerCase().includes(lower) || (c.name[language] || '').toLowerCase().includes(lower));
      }
      return result.sort((a, b) => {
          if (a.semester !== b.semester) return a.semester - b.semester;
          return a.code.localeCompare(b.code);
      });
  }, [courses, filterArea, filterEssential, searchQuery, language, statsScope]);

  const triggerRefresh = (callback: () => void) => {
      setIsRefreshing(true);
      setTimeout(() => { callback(); setTableVersion(prev => prev + 1); setIsRefreshing(false); }, 300);
  };

  // --- Stats Logic ---
  const stats = useMemo(() => {
    // USE filteredCourses instead of calculating fresh based on scope
    const targetCourses = filteredCourses;
    const targetCourseIds = new Set(targetCourses.map(c => c.id));
    
    const areaMap = new Map<string, number>();
    const semesterMap = new Map<number, { total: number, areas: Record<string, number> }>();
    let totalCredits = 0;
    
    knowledgeAreas.forEach(k => areaMap.set(k.id, 0));

    // 1. Identify courses that belong to Elective Blocks
    const coursesInElectiveBlocks = new Set<string>();
    (generalInfo.moetInfo.subBlocks || []).forEach(sb => {
        if (sb.type !== 'COMPULSORY') {
            sb.courseIds.forEach(id => coursesInElectiveBlocks.add(id));
        }
    });

    // 2. Process Courses (excluding elective block members from semester calc)
    targetCourses.forEach(c => {
        // Area total always includes all filtered courses
        const areaId = c.knowledgeAreaId;
        areaMap.set(areaId, (areaMap.get(areaId) || 0) + c.credits);
        totalCredits += c.credits;

        // Semester calculation: Skip if course is part of an elective block (handled by block logic below)
        if (!coursesInElectiveBlocks.has(c.id)) {
            if (!semesterMap.has(c.semester)) semesterMap.set(c.semester, { total: 0, areas: {} });
            const semData = semesterMap.get(c.semester)!;
            semData.total += c.credits;
            semData.areas[areaId] = (semData.areas[areaId] || 0) + c.credits;
        }
    });

    // 3. Process Elective Blocks for Semester Stats
    (generalInfo.moetInfo.subBlocks || []).forEach(sb => {
        if (sb.type !== 'COMPULSORY' && sb.preferredSemester && sb.preferredSemester > 0) {
            // Check if any course in this block is currently visible in the filtered list
            // This ensures we don't show block credits if the user filtered out all courses in that block (e.g., via Area or Essential filter)
            const hasVisibleCourses = sb.courseIds.some(id => targetCourseIds.has(id));

            if (hasVisibleCourses) {
                const sem = sb.preferredSemester;
                if (!semesterMap.has(sem)) semesterMap.set(sem, { total: 0, areas: {} });
                
                const semData = semesterMap.get(sem)!;
                semData.total += sb.minCredits;

                // Determine Knowledge Area for this block (Heuristic: use first course's area or 'other')
                let blockAreaId = 'other';
                if (sb.courseIds.length > 0) {
                    const firstCourse = courses.find(c => c.id === sb.courseIds[0]);
                    if (firstCourse) blockAreaId = firstCourse.knowledgeAreaId;
                }
                
                semData.areas[blockAreaId] = (semData.areas[blockAreaId] || 0) + sb.minCredits;
            }
        }
    });

    const areaData = knowledgeAreas.map(k => ({ id: k.id, name: k.name, color: k.color, value: areaMap.get(k.id) || 0, percentage: totalCredits > 0 ? ((areaMap.get(k.id) || 0) / totalCredits) * 100 : 0 })).sort((a, b) => b.value - a.value);
    const semesterData = Array.from(semesterMap.entries()).map(([semester, data]) => ({ semester, ...data })).sort((a, b) => a.semester - b.semester);
    const maxSemCredits = Math.max(...semesterData.map(d => d.total), 0);
    const soCoverage = sos.map(so => {
        const mappings = courseSoMap.filter(m => m.soId === so.id && m.level !== IRM.NONE && targetCourseIds.has(m.courseId));
        return { id: so.id, code: so.code, count: mappings.length, credits: mappings.reduce((sum, m) => sum + (courseMap.get(m.courseId)?.credits || 0), 0) };
    });

    return { totalCredits, areaData, semesterData, maxSemCredits, soCoverage };
  }, [filteredCourses, courses, knowledgeAreas, sos, courseSoMap, courseMap, generalInfo.moetInfo.subBlocks]); // Depend on filteredCourses

  // --- Actions ---
  const handleSaveNewCourse = () => {
      if (!newCourseData.code || !newCourseData.name?.vi) {
          alert(language === 'vi' ? 'Vui lòng nhập Mã môn và Tên môn học' : 'Please enter Course Code and Name');
          return;
      }
      const newCourse: Course = {
        id: `CID-${Date.now()}`, code: newCourseData.code, name: newCourseData.name || { vi: '', en: '' }, credits: newCourseData.credits || 3,
        isEssential: newCourseData.isEssential || false, isAbet: newCourseData.isAbet || false, type: newCourseData.type || 'REQUIRED',
        knowledgeAreaId: newCourseData.knowledgeAreaId || 'other', semester: newCourseData.semester || 1, colIndex: 0, prerequisites: [], coRequisites: [],
        description: { vi: '', en: '' }, textbooks: [], clos: { vi: [], en: [] }, topics: [], assessmentPlan: [], instructorIds: [], instructorDetails: {}, cloMap: []
      };
      updateState(prev => ({ ...prev, courses: [...prev.courses, newCourse] }));
      setIsAddModalOpen(false);
      setNewCourseData({ code: '', name: { vi: '', en: '' }, credits: 3, semester: 1, knowledgeAreaId: knowledgeAreas[0]?.id || 'other', type: 'REQUIRED', isEssential: false, isAbet: false });
  };

  const deleteCourse = (id: string) => {
    if(confirm(language === 'vi' ? 'Xóa môn học này?' : 'Delete this course?')) {
        triggerRefresh(() => {
            updateState(prev => ({ ...prev, courses: prev.courses.filter(c => c.id !== id) }));
        });
    }
  };

  const updateCourse = (id: string, field: keyof Course, value: any) => {
    updateState(prev => ({
        ...prev, courses: prev.courses.map(c => {
            if (c.id === id) {
                const updates: any = { [field]: value };
                if (field === 'isEssential' && value === true) updates.isAbet = true;
                return { ...c, ...updates };
            }
            return c;
        })
    }));
  };

  const exportMatrixCSV = () => {
      let headers: string[] = [], rows: string[][] = [], filename = '', footer = '';
      if (activeTab === 'so') {
          headers = ['Course Code', 'Course Name', ...sos.map(s => s.code)];
          rows = filteredCourses.map(c => [c.code, `"${c.name[language]}"`, ...sos.map(so => soMappingLookup.get(`${c.id}-${so.id}`) || '')]);
          filename = `curriculum_matrix_SO_${language}.csv`;
          footer = '\n\n"Legend / Chú thích:"\n"I","Introduce / Giới thiệu"\n"R","Reinforce / Củng cố"\n"M","Master / Thuần thục"';
      } else if (activeTab === 'pi') {
          const allPis = sos.flatMap(s => s.pis);
          headers = ['Course Code', 'Course Name', ...allPis.map(p => p.code)];
          rows = filteredCourses.map(c => [c.code, `"${c.name[language]}"`, ...allPis.map(pi => piMappingLookup.has(`${c.id}-${pi.id}`) ? 'X' : '')]);
          filename = `curriculum_matrix_PI_${language}.csv`;
      } else return;
      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n') + footer;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
      link.download = filename;
      link.click();
  };

  return (
    <div className="space-y-6 pb-12 relative h-full flex flex-col">
        <AILoader isVisible={isTranslating || isRefreshing} message={isRefreshing ? 'Refreshing...' : 'Translating...'} />
        
        {/* Stats Panel */}
        {showStats ? (
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative animate-in slide-in-from-top-2 fade-in duration-300 shrink-0">
                <div className="absolute top-2 right-2"><button onClick={() => setShowStats(false)} className="text-slate-300 hover:text-slate-500 p-1"><ChevronUp size={16} /></button></div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                    <div className="flex items-center gap-6 border-b xl:border-b-0 xl:border-r border-slate-100 pb-4 xl:pb-0 xl:pr-6">
                        <div className="relative w-28 h-28 shrink-0">
                            <svg width={120} height={120} viewBox="0 0 120 120" className="transform -rotate-90">
                                <circle cx={60} cy={60} r={52.5} fill="none" stroke="#f1f5f9" strokeWidth={15} />
                                {(() => { let offset = 0; const circ = 2 * Math.PI * 52.5; return stats.areaData.map(item => { const dash = (item.percentage / 100) * circ; const seg = <circle key={item.id} cx={60} cy={60} r={52.5} fill="none" stroke={AREA_HEX_COLORS[item.color] || '#94a3b8'} strokeWidth={15} strokeDasharray={`${dash} ${circ}`} strokeDashoffset={-offset} />; offset += dash; return seg; }); })()}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-xl font-black text-slate-800">{stats.totalCredits}</span><span className="text-[8px] uppercase font-bold text-slate-400">Total TC</span></div>
                        </div>
                        <div className="pl-2 flex-1 w-full">{stats.areaData.map(item => <div key={item.id} className="flex items-center gap-2 mb-1.5"><div className={`w-2 h-2 rounded-full shrink-0`} style={{ backgroundColor: AREA_HEX_COLORS[item.color] || '#94a3b8' }} /><div className="flex justify-between w-full"><div className="text-[10px] font-bold text-slate-700 leading-tight truncate">{item.name[language]}</div><div className="text-[10px] text-slate-500 ml-2 whitespace-nowrap">{item.value} ({item.percentage.toFixed(0)}%)</div></div></div>)}</div>
                    </div>
                    <div className="border-b xl:border-b-0 xl:border-r border-slate-100 pb-4 xl:pb-0 xl:pr-6">
                        <div className="flex items-center gap-2 mb-2"><BarChart3 size={14} className="text-slate-400" /><h3 className="text-xs font-bold text-slate-700">{language === 'vi' ? 'Tín chỉ theo Học kỳ (bao gồm Tự chọn)' : 'Credits / Semester (incl. Electives)'}</h3></div>
                        <div className="w-full overflow-x-auto"><div style={{ minWidth: stats.semesterData.length * 30 }}><svg width="100%" height={155} viewBox={`0 0 ${Math.max(300, stats.semesterData.length * 30)} 155`}>{stats.semesterData.map((d, i) => { let yStack = 135; const x = i * 30 + 10; return <g key={d.semester}>{Object.entries(d.areas).map(([areaId, cred]) => { const h = (Number(cred) / Math.max(stats.maxSemCredits, 20)) * 120; yStack -= h; return <rect key={areaId} x={x} y={yStack} width={18} height={h} fill={AREA_HEX_COLORS[knowledgeAreas.find(a => a.id === areaId)?.color || 'slate'] || '#94a3b8'} />; })}<text x={x + 9} y={yStack - 3} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#64748b">{d.total}</text><text x={x + 9} y={147} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#334155">S{d.semester}</text></g>; })}</svg></div></div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-4"><Grid3X3 size={14} className="text-slate-400" /><h3 className="text-xs font-bold text-slate-700">{language === 'vi' ? 'Độ phủ SO' : 'SO Coverage'}</h3></div>
                        <div className="space-y-4 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">{stats.soCoverage.map(so => (<div key={so.id} className="flex gap-3 items-center"><div className="w-6 shrink-0 flex flex-col justify-center items-center"><span className="text-[10px] font-black text-slate-400">{so.code.replace('SO-', '')}</span></div><div className="flex-1 space-y-1.5"><div className="flex items-center gap-2"><div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(so.count / Math.max(...stats.soCoverage.map(s => s.count), 1)) * 100}%` }}/></div><span className="text-[9px] font-bold text-indigo-600 w-10 text-right">{so.count} crs</span></div></div></div>))}</div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex justify-center cursor-pointer hover:bg-slate-50 transition-colors shrink-0" onClick={() => setShowStats(true)}><div className="flex items-center gap-2 text-xs font-bold text-slate-500"><PieChart size={14} /> Show Stats <ChevronDown size={14} /></div></div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col xl:flex-row justify-between items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm gap-4 shrink-0">
             <div className="flex p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto w-full xl:w-auto">
                <button onClick={() => setActiveTab('catalog')} className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'catalog' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Book size={14} /> {t.catalog}</button>
                <button onClick={() => setActiveTab('so')} className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'so' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Grid3X3 size={14} /> {t.soMatrix}</button>
                <button onClick={() => setActiveTab('pi')} className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'pi' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><ListChecks size={14} /> {t.piMatrix}</button>
                <button onClick={() => setActiveTab('areas')} className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'areas' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Layers size={14} /> {t.knowledgeAreaTable}</button>
             </div>
             <div className="flex items-center gap-4 px-2 w-full xl:w-auto justify-end overflow-x-auto">
                 <div className="relative min-w-[180px]"><Search className="absolute left-3 top-2.5 text-slate-400" size={14} /><input className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={language === 'vi' ? "Tìm môn học..." : "Search courses..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                 <div className="flex bg-slate-100 p-0.5 rounded-lg shrink-0">
                    <button onClick={() => setStatsScope('abet')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${statsScope === 'abet' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>ABET</button>
                    <button onClick={() => setStatsScope('all')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${statsScope === 'all' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>ALL</button>
                 </div>
                 <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition shrink-0"><input type="checkbox" checked={filterEssential} onChange={(e) => { const checked = e.target.checked; triggerRefresh(() => setFilterEssential(checked)); }} className="rounded text-indigo-600 focus:ring-0 w-3.5 h-3.5" /><span className="text-xs font-bold text-slate-700 select-none flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" /> {t.filterEssential}</span></label>
                 <div className="flex items-center gap-2 shrink-0"><Filter size={14} className="text-slate-400" /><select className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[120px]" value={filterArea} onChange={(e) => setFilterArea(e.target.value)}><option value="all">{t.allCategories}</option>{knowledgeAreas.map(k => <option key={k.id} value={k.id}>{k.name[language]}</option>)}</select></div>
                 {activeTab === 'catalog' && <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm ml-2"><Plus size={12} /> {t.addCourse}</button>}
                 {activeTab !== 'catalog' && activeTab !== 'areas' && <button onClick={exportMatrixCSV} className="bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-900 transition shadow-sm shrink-0"><Download size={14} /> CSV</button>}
             </div>
        </div>

        {/* Modules Content */}
        <div key={tableVersion} className="flex-1 min-h-0 relative">
            {activeTab === 'catalog' && (
                <MappingCourseListModule 
                    state={state} filteredCourses={filteredCourses} updateState={updateState} 
                    onEditCourse={updateCourse} onDeleteCourse={deleteCourse} onRefresh={triggerRefresh}
                    isTranslating={isTranslating} setIsTranslating={setIsTranslating}
                />
            )}
            {activeTab === 'so' && (
                <MappingSOMatrixModule 
                    filteredCourses={filteredCourses} sos={sos} language={language} 
                    knowledgeAreas={knowledgeAreas} soMappingLookup={soMappingLookup} updateState={updateState} 
                />
            )}
            {activeTab === 'pi' && (
                <MappingPIMatrixModule 
                    filteredCourses={filteredCourses} sos={sos} language={language} 
                    knowledgeAreas={knowledgeAreas} piMappingLookup={piMappingLookup} 
                    courseMappedSoLookup={courseMappedSoLookup} updateState={updateState} 
                />
            )}
            {activeTab === 'areas' && (
                <MappingCourseBlockModule 
                    knowledgeAreas={knowledgeAreas} language={language} 
                    courses={courses}
                    updateState={updateState} onRefresh={triggerRefresh} 
                />
            )}
        </div>

        {/* Add Course Modal */}
        {isAddModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-lg">{language === 'vi' ? 'Thêm Môn học Mới' : 'Add New Course'}</h3>
                        <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{language === 'vi' ? 'Mã môn' : 'Course Code'}</label><input className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={newCourseData.code} onChange={e => setNewCourseData({...newCourseData, code: e.target.value})} placeholder="e.g. ENG 101" autoFocus /></div>
                        <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tên (VI)</label><input className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newCourseData.name?.vi} onChange={e => setNewCourseData({...newCourseData, name: { ...newCourseData.name!, vi: e.target.value }})} placeholder="Tên tiếng Việt" /></div><div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Name (EN)</label><input className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newCourseData.name?.en} onChange={e => setNewCourseData({...newCourseData, name: { ...newCourseData.name!, en: e.target.value }})} placeholder="English Name" /></div></div>
                        <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t.credits}</label><input type="number" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={newCourseData.credits} onChange={e => setNewCourseData({...newCourseData, credits: parseInt(e.target.value) || 0})} /></div><div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t.semester}</label><input type="number" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={newCourseData.semester} onChange={e => setNewCourseData({...newCourseData, semester: parseInt(e.target.value) || 1})} /></div></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{language === 'vi' ? 'Loại môn học' : 'Course Type'}</label><select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" value={newCourseData.type} onChange={e => setNewCourseData({...newCourseData, type: e.target.value as any})}><option value="REQUIRED">{language === 'vi' ? 'Bắt buộc' : 'Required'}</option><option value="SELECTED_ELECTIVE">{language === 'vi' ? 'TC Định hướng' : 'Selected Elective'}</option><option value="ELECTIVE">{language === 'vi' ? 'Tự chọn' : 'Free Elective'}</option></select></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t.knowledgeArea}</label><select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" value={newCourseData.knowledgeAreaId} onChange={e => setNewCourseData({...newCourseData, knowledgeAreaId: e.target.value})}>{knowledgeAreas.map(k => <option key={k.id} value={k.id}>{k.name[language]}</option>)}</select></div>
                        <div className="flex gap-4 pt-2"><label className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50 flex-1"><input type="checkbox" className="rounded text-indigo-600 focus:ring-0" checked={newCourseData.isEssential} onChange={e => setNewCourseData({...newCourseData, isEssential: e.target.checked, isAbet: e.target.checked ? true : newCourseData.isAbet})} /><span className="text-xs font-bold text-slate-700">{t.essential}</span></label><label className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50 flex-1"><input type="checkbox" className="rounded text-orange-500 focus:ring-0" checked={newCourseData.isAbet} onChange={e => setNewCourseData({...newCourseData, isAbet: e.target.checked})} /><span className="text-xs font-bold text-slate-700">ABET</span></label></div>
                    </div>
                    <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                        <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
                        <button onClick={handleSaveNewCourse} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 flex items-center gap-2"><Save size={14}/> {language === 'vi' ? 'Lưu môn học' : 'Save Course'}</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default MappingModule;

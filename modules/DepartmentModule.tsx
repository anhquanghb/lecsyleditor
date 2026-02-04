
import React, { useState, useMemo } from 'react';
import { AppState, Department, Course, AcademicFaculty, AcademicSchool } from '../types';
import { TRANSLATIONS } from '../constants';
import { Plus, Trash2, Edit2, Check, X, Search, Briefcase, BookOpen, Layers, Building, Landmark, AlertCircle, ChevronRight, ChevronDown, FolderOpen } from 'lucide-react';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const DepartmentModule: React.FC<Props> = ({ state, updateState }) => {
  const { departments, academicFaculties, academicSchools, courses, language } = state;
  const t = TRANSLATIONS[language];

  // UI State
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  
  // Tree Expansion State
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [isEditingSchool, setIsEditingSchool] = useState(false);
  const [schoolEditForm, setSchoolEditForm] = useState<Partial<AcademicSchool>>({});

  const [isEditingFaculty, setIsEditingFaculty] = useState(false);
  const [facultyEditForm, setFacultyEditForm] = useState<Partial<AcademicFaculty>>({});
  
  const [isEditingDept, setIsEditingDept] = useState(false);
  const [deptEditForm, setDeptEditForm] = useState<Partial<Department>>({});
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Assign Course Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');

  // --- Derived Data ---
  const selectedSchool = academicSchools.find(s => s.id === selectedSchoolId);
  const selectedFaculty = academicFaculties.find(f => f.id === selectedFacultyId);
  const selectedDept = departments.find(d => d.id === selectedDeptId);
  const deptCourses = courses.filter(c => c.departmentId === selectedDeptId);

  // --- Tree Logic ---
  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  // Filter logic applied to the tree
  const matchesSearch = (name: string, code: string) => {
      if (!searchQuery) return true;
      const lowerQ = searchQuery.toLowerCase();
      return name.toLowerCase().includes(lowerQ) || code.toLowerCase().includes(lowerQ);
  };

  // --- School Actions ---
  const handleAddSchool = () => {
    const newSchool: AcademicSchool = {
        id: `sch-${Date.now()}`,
        code: 'NEW',
        name: { vi: 'Trường Mới', en: 'New School' },
        description: { vi: '', en: '' }
    };
    updateState(prev => ({ ...prev, academicSchools: [...(prev.academicSchools || []), newSchool] }));
    // Auto select and expand
    setSelectedSchoolId(newSchool.id);
    setSelectedFacultyId(null);
    setSelectedDeptId(null);
    setSchoolEditForm(newSchool);
    setIsEditingSchool(true);
  };

  const handleEditSchool = (sch: AcademicSchool) => {
      setSchoolEditForm({ ...sch });
      setIsEditingSchool(true);
  };

  const handleSaveSchool = () => {
      if (!selectedSchoolId) return;
      updateState(prev => ({
          ...prev,
          academicSchools: (prev.academicSchools || []).map(s => s.id === selectedSchoolId ? { ...s, ...schoolEditForm } as AcademicSchool : s)
      }));
      setIsEditingSchool(false);
  };

  const handleDeleteSchool = (id: string) => {
      if (confirm(language === 'vi' ? 'Xóa Trường này? Các Khoa sẽ mất liên kết.' : 'Delete this School? Faculties will be unlinked.')) {
          updateState(prev => ({
              ...prev,
              academicSchools: (prev.academicSchools || []).filter(s => s.id !== id),
              academicFaculties: (prev.academicFaculties || []).map(f => f.schoolId === id ? { ...f, schoolId: undefined } : f)
          }));
          if (selectedSchoolId === id) setSelectedSchoolId(null);
      }
  };

  // --- Faculty Actions ---
  const handleAddFaculty = (targetSchoolId?: string) => {
    const newFac: AcademicFaculty = {
      id: `fac-${Date.now()}`,
      code: 'NEW',
      name: { vi: 'Khoa Mới', en: 'New Faculty' },
      description: { vi: '', en: '' },
      schoolId: targetSchoolId || selectedSchoolId || undefined
    };
    updateState(prev => ({ ...prev, academicFaculties: [...(prev.academicFaculties || []), newFac] }));
    
    // Expand parent school if needed
    if (targetSchoolId) {
        const nextExp = new Set(expandedIds);
        nextExp.add(targetSchoolId);
        setExpandedIds(nextExp);
    }

    setSelectedFacultyId(newFac.id);
    setSelectedDeptId(null);
    setFacultyEditForm(newFac);
    setIsEditingFaculty(true);
  };

  const handleEditFaculty = (fac: AcademicFaculty) => {
    setFacultyEditForm({ ...fac });
    setIsEditingFaculty(true);
  };

  const handleSaveFaculty = () => {
    if (!selectedFacultyId) return;
    updateState(prev => ({
      ...prev,
      academicFaculties: (prev.academicFaculties || []).map(f => f.id === selectedFacultyId ? { ...f, ...facultyEditForm } as AcademicFaculty : f)
    }));
    setIsEditingFaculty(false);
  };

  const handleDeleteFaculty = (id: string) => {
    if (confirm(language === 'vi' ? 'Xóa Khoa này? Các Bộ môn sẽ mất liên kết.' : 'Delete this Faculty? Departments will be unlinked.')) {
      updateState(prev => ({
        ...prev,
        academicFaculties: (prev.academicFaculties || []).filter(f => f.id !== id),
        departments: prev.departments.map(d => d.academicFacultyId === id ? { ...d, academicFacultyId: undefined } : d)
      }));
      if (selectedFacultyId === id) setSelectedFacultyId(null);
    }
  };

  // --- Department Actions ---
  const handleAddDepartment = (targetFacultyId?: string) => {
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      code: 'NEW',
      name: { vi: 'Bộ môn Mới', en: 'New Department' },
      description: { vi: '', en: '' },
      academicFacultyId: targetFacultyId || selectedFacultyId || undefined
    };
    updateState(prev => ({ ...prev, departments: [...prev.departments, newDept] }));
    
    // Expand parent faculty if needed
    if (targetFacultyId) {
        const nextExp = new Set(expandedIds);
        nextExp.add(targetFacultyId);
        setExpandedIds(nextExp);
    }

    setSelectedDeptId(newDept.id);
    setDeptEditForm(newDept);
    setIsEditingDept(true);
  };

  const handleEditDepartment = (dept: Department) => {
    setDeptEditForm({ ...dept });
    setIsEditingDept(true);
  };

  const handleSaveDepartment = () => {
    if (!selectedDeptId) return;
    updateState(prev => ({
      ...prev,
      departments: prev.departments.map(d => d.id === selectedDeptId ? { ...d, ...deptEditForm } as Department : d)
    }));
    setIsEditingDept(false);
  };

  const handleDeleteDepartment = (id: string) => {
    if (confirm(language === 'vi' ? 'Xóa bộ môn này? Các môn học sẽ bị hủy gán.' : 'Delete this department? Courses will be unassigned.')) {
      updateState(prev => ({
        ...prev,
        departments: prev.departments.filter(d => d.id !== id),
        courses: prev.courses.map(c => c.departmentId === id ? { ...c, departmentId: undefined } : c)
      }));
      if (selectedDeptId === id) setSelectedDeptId(null);
    }
  };

  // --- Course Assignment Actions ---
  const handleAssignCourse = (courseId: string) => {
    if (!selectedDeptId) return;
    updateState(prev => ({
      ...prev,
      courses: prev.courses.map(c => c.id === courseId ? { ...c, departmentId: selectedDeptId } : c)
    }));
  };

  const handleUnassignCourse = (courseId: string) => {
    updateState(prev => ({
      ...prev,
      courses: prev.courses.map(c => c.id === courseId ? { ...c, departmentId: undefined } : c)
    }));
  };

  // --- Render Sidebar ---
  const renderSidebar = () => {
    // 1. Unassigned Faculties (No School)
    const unassignedFaculties = (academicFaculties || []).filter(f => !f.schoolId && matchesSearch(f.name[language], f.code));
    
    // 2. Unassigned Departments (No Faculty)
    const unassignedDepartments = departments.filter(d => !d.academicFacultyId && matchesSearch(d.name[language], d.code));

    return (
    <div className="w-1/3 border-r border-slate-200 bg-white flex flex-col">
      <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-slate-800 flex items-center gap-2"><Briefcase size={20} className="text-indigo-600"/> {t.manageDepartments}</h2>
          <div className="flex gap-1">
             <button onClick={handleAddSchool} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold hover:bg-purple-200 transition-colors" title={t.addSchool}>+ {language === 'vi' ? 'Trường' : 'Sch'}</button>
             <button onClick={() => handleAddFaculty()} className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold hover:bg-indigo-200 transition-colors" title={t.addFaculty}>+ {language === 'vi' ? 'Khoa' : 'Fac'}</button>
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input 
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={language === 'vi' ? "Tìm kiếm..." : "Search..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        
        {/* HIERARCHY TREE */}
        {(academicSchools || []).filter(s => matchesSearch(s.name[language], s.code)).map(sch => {
            const isExpanded = expandedIds.has(sch.id);
            const isSelected = selectedSchoolId === sch.id;
            const schoolFaculties = (academicFaculties || []).filter(f => f.schoolId === sch.id);

            return (
                <div key={sch.id} className="mb-1">
                    {/* School Row */}
                    <div 
                        className={`flex items-center p-2 rounded-lg cursor-pointer border transition-colors group ${isSelected ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
                        onClick={() => {
                            setSelectedSchoolId(sch.id);
                            setSelectedFacultyId(null);
                            setSelectedDeptId(null);
                            setIsEditingSchool(false);
                            setIsEditingFaculty(false);
                            setIsEditingDept(false);
                            toggleExpand(sch.id);
                        }}
                    >
                        <button 
                            className={`p-1 mr-1 rounded hover:bg-black/5 ${isExpanded ? 'text-purple-600' : 'text-slate-400'}`}
                            onClick={(e) => { e.stopPropagation(); toggleExpand(sch.id); }}
                        >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <Landmark size={16} className={`mr-2 ${isSelected ? 'text-purple-600' : 'text-slate-400'}`}/>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                                <span className={`text-xs font-bold truncate ${isSelected ? 'text-purple-700' : 'text-slate-700'}`}>{sch.name[language]}</span>
                                <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 rounded ml-2">{schoolFaculties.length}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{sch.code}</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleAddFaculty(sch.id); }} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-indigo-100 text-indigo-600 rounded ml-1 transition-opacity" title="Add Faculty to this School">
                            <Plus size={14}/>
                        </button>
                    </div>

                    {/* Nested Faculties */}
                    {isExpanded && (
                        <div className="ml-4 pl-2 border-l border-slate-200 mt-1 space-y-1">
                            {schoolFaculties.map(fac => {
                                const isFacExpanded = expandedIds.has(fac.id);
                                const isFacSelected = selectedFacultyId === fac.id;
                                const facDepts = departments.filter(d => d.academicFacultyId === fac.id);

                                return (
                                    <div key={fac.id}>
                                        {/* Faculty Row */}
                                        <div 
                                            className={`flex items-center p-2 rounded-lg cursor-pointer border transition-colors group ${isFacSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
                                            onClick={() => {
                                                setSelectedFacultyId(fac.id);
                                                setSelectedDeptId(null);
                                                setIsEditingFaculty(false);
                                                setIsEditingDept(false);
                                                toggleExpand(fac.id);
                                            }}
                                        >
                                            <button 
                                                className={`p-1 mr-1 rounded hover:bg-black/5 ${isFacExpanded ? 'text-indigo-600' : 'text-slate-400'}`}
                                                onClick={(e) => { e.stopPropagation(); toggleExpand(fac.id); }}
                                            >
                                                {isFacExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </button>
                                            <Building size={14} className={`mr-2 ${isFacSelected ? 'text-indigo-600' : 'text-slate-400'}`}/>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-xs font-bold truncate ${isFacSelected ? 'text-indigo-700' : 'text-slate-700'}`}>{fac.name[language]}</span>
                                                    <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 rounded ml-2">{facDepts.length}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono">{fac.code}</div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); handleAddDepartment(fac.id); }} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-emerald-100 text-emerald-600 rounded ml-1 transition-opacity" title="Add Department to this Faculty">
                                                <Plus size={14}/>
                                            </button>
                                        </div>

                                        {/* Nested Departments */}
                                        {isFacExpanded && (
                                            <div className="ml-4 pl-2 border-l border-slate-200 mt-1 space-y-1">
                                                {facDepts.map(dept => {
                                                    const isDeptSelected = selectedDeptId === dept.id;
                                                    return (
                                                        <div 
                                                            key={dept.id}
                                                            className={`flex items-center p-2 rounded-lg cursor-pointer border transition-colors ${isDeptSelected ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
                                                            onClick={() => {
                                                                setSelectedDeptId(dept.id);
                                                                setIsEditingDept(false);
                                                            }}
                                                        >
                                                            <div className="w-4 mr-1"></div> {/* Spacer for indent */}
                                                            <Layers size={14} className={`mr-2 ${isDeptSelected ? 'text-emerald-600' : 'text-slate-400'}`}/>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs font-bold truncate text-slate-700">{dept.name[language]}</div>
                                                                <div className="text-[10px] text-slate-400 font-mono">{dept.code}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {facDepts.length === 0 && <div className="text-[10px] text-slate-400 italic pl-6 py-1">Empty</div>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {schoolFaculties.length === 0 && <div className="text-[10px] text-slate-400 italic pl-6 py-1">No Faculties</div>}
                        </div>
                    )}
                </div>
            );
        })}

        {/* --- ORPHANS SECTION --- */}
        {(unassignedFaculties.length > 0 || unassignedDepartments.length > 0) && (
            <>
                <div className="my-4 border-t border-slate-200"></div>
                <div className="px-2 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <AlertCircle size={10} /> {language === 'vi' ? 'Chưa phân loại' : 'Unassigned'}
                    </span>
                </div>
            </>
        )}

        {/* Unassigned Faculties */}
        {unassignedFaculties.map(fac => {
            const isExpanded = expandedIds.has(fac.id);
            const isSelected = selectedFacultyId === fac.id;
            const facDepts = departments.filter(d => d.academicFacultyId === fac.id);

            return (
                <div key={fac.id} className="mb-1">
                    <div 
                        className={`flex items-center p-2 rounded-lg cursor-pointer border border-dashed transition-colors group ${isSelected ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200 hover:border-amber-300'}`}
                        onClick={() => {
                            setSelectedFacultyId(fac.id);
                            setSelectedDeptId(null);
                            setSelectedSchoolId(null);
                            setIsEditingFaculty(false);
                            toggleExpand(fac.id);
                        }}
                    >
                        <button className="p-1 mr-1 text-slate-400" onClick={(e) => { e.stopPropagation(); toggleExpand(fac.id); }}>
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <Building size={14} className="mr-2 text-amber-500"/>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold truncate text-slate-700">{fac.name[language]}</div>
                            <div className="text-[9px] text-amber-600 flex items-center gap-1"><AlertCircle size={8}/> No School</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleAddDepartment(fac.id); }} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-emerald-100 text-emerald-600 rounded ml-1 transition-opacity">
                            <Plus size={14}/>
                        </button>
                    </div>
                    
                    {isExpanded && (
                        <div className="ml-4 pl-2 border-l border-slate-200 mt-1 space-y-1 border-dashed">
                            {facDepts.map(dept => {
                                const isDeptSelected = selectedDeptId === dept.id;
                                return (
                                    <div 
                                        key={dept.id}
                                        className={`flex items-center p-2 rounded-lg cursor-pointer border transition-colors ${isDeptSelected ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-transparent hover:bg-slate-50'}`}
                                        onClick={() => setSelectedDeptId(dept.id)}
                                    >
                                        <div className="w-4 mr-1"></div>
                                        <Layers size={14} className="mr-2 text-slate-400"/>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold truncate text-slate-700">{dept.name[language]}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{dept.code}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        })}

        {/* Unassigned Departments */}
        {unassignedDepartments.map(dept => {
            const isSelected = selectedDeptId === dept.id;
            return (
                <div 
                    key={dept.id} 
                    className={`flex items-center p-2 rounded-lg cursor-pointer border border-dashed transition-colors mb-1 ${isSelected ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200 hover:border-amber-300'}`}
                    onClick={() => {
                        setSelectedDeptId(dept.id);
                        setSelectedFacultyId(null);
                        setSelectedSchoolId(null);
                        setIsEditingDept(false);
                    }}
                >
                    <div className="w-6 mr-1 flex justify-center"><AlertCircle size={14} className="text-amber-500"/></div>
                    <Layers size={14} className="mr-2 text-slate-400"/>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate text-slate-700">{dept.name[language]}</div>
                        <div className="text-[9px] text-amber-600">No Faculty</div>
                    </div>
                </div>
            );
        })}

      </div>
    </div>
    );
  };

  const renderContent = () => {
    if (selectedDeptId && selectedDept) {
        // --- DEPARTMENT VIEW ---
        return (
            <div className="flex-1 flex flex-col bg-slate-50 h-full overflow-hidden">
              <div className="p-6 bg-white border-b border-slate-200 shadow-sm shrink-0">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    {isEditingDept ? (
                      <div className="space-y-3 w-96">
                        <div className="flex gap-2">
                          <input className="w-24 p-2 border border-slate-200 rounded text-sm font-bold uppercase" value={deptEditForm.code} onChange={e => setDeptEditForm({...deptEditForm, code: e.target.value})} placeholder="Code" />
                          <input className="flex-1 p-2 border border-slate-200 rounded text-sm font-bold" value={deptEditForm.name?.vi} onChange={e => setDeptEditForm({...deptEditForm, name: {...deptEditForm.name!, vi: e.target.value}})} placeholder="Name (VI)" />
                        </div>
                        <input className="w-full p-2 border border-slate-200 rounded text-sm" value={deptEditForm.name?.en} onChange={e => setDeptEditForm({...deptEditForm, name: {...deptEditForm.name!, en: e.target.value}})} placeholder="Name (EN)" />
                        <select 
                            className={`w-full p-2 border border-slate-200 rounded text-sm ${!deptEditForm.academicFacultyId ? 'border-amber-300 bg-amber-50 text-amber-700 font-bold' : ''}`}
                            value={deptEditForm.academicFacultyId || ''}
                            onChange={e => setDeptEditForm({...deptEditForm, academicFacultyId: e.target.value})}
                        >
                            <option value="">-- {language === 'vi' ? 'Chọn Khoa quản lý' : 'Select Managing Faculty'} --</option>
                            {(academicFaculties || []).map(f => <option key={f.id} value={f.id}>{f.name[language]} ({f.code})</option>)}
                        </select>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setIsEditingDept(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
                          <button onClick={handleSaveDepartment} className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700">Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-black">{selectedDept.code}</span>
                          <h2 className="text-2xl font-bold text-slate-800">{selectedDept.name[language]}</h2>
                        </div>
                        <p className="text-slate-500 text-sm mt-1 ml-1">{selectedDept.name[language === 'vi' ? 'en' : 'vi']}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                            <Building size={12}/> {language === 'vi' ? 'Thuộc khoa:' : 'Faculty:'} 
                            {selectedDept.academicFacultyId ? (
                                <span className="font-bold text-slate-600">{academicFaculties.find(f => f.id === selectedDept.academicFacultyId)?.name[language]}</span>
                            ) : (
                                <span className="font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1"><AlertCircle size={10}/> Unassigned</span>
                            )}
                        </div>
                      </>
                    )}
                  </div>
                  {!isEditingDept && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEditDepartment(selectedDept)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><Edit2 size={18}/></button>
                      <button onClick={() => handleDeleteDepartment(selectedDept.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4 text-xs font-bold text-slate-500">
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg"><BookOpen size={14}/> {deptCourses.length} {language === 'vi' ? 'Môn học' : 'Courses'}</div>
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg"><Layers size={14}/> {deptCourses.reduce((sum, c) => sum + c.credits, 0)} {language === 'vi' ? 'Tín chỉ' : 'Credits'}</div>
                </div>
              </div>
      
              {/* Courses Table */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wide"><BookOpen size={16} className="text-emerald-600"/> {language === 'vi' ? 'Danh sách môn học thuộc bộ môn' : 'Assigned Courses'}</h3>
                    <button onClick={() => setIsAssignModalOpen(true)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-emerald-700 transition"><Plus size={14}/> {t.assignCourses}</button>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white border-b border-slate-100 text-xs text-slate-500 uppercase">
                      <tr>
                        <th className="p-3 font-bold w-24">Code</th>
                        <th className="p-3 font-bold">Name</th>
                        <th className="p-3 font-bold text-center w-16">Credits</th>
                        <th className="p-3 font-bold text-right w-24">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {deptCourses.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-emerald-600">{c.code}</td>
                          <td className="p-3 font-medium text-slate-700">{c.name[language]}</td>
                          <td className="p-3 text-center bg-slate-50 font-bold text-slate-600">{c.credits}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => handleUnassignCourse(c.id)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={16}/></button>
                          </td>
                        </tr>
                      ))}
                      {deptCourses.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">{language === 'vi' ? 'Chưa có môn học nào được gán.' : 'No courses assigned.'}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
    } 
    
    if (selectedFacultyId && selectedFaculty) {
        // --- FACULTY VIEW ---
        return (
            <div className="flex-1 flex flex-col bg-slate-50 h-full overflow-hidden">
                <div className="p-6 bg-white border-b border-slate-200 shadow-sm shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                        {isEditingFaculty ? (
                            <div className="space-y-3 w-96">
                            <div className="flex gap-2">
                                <input className="w-24 p-2 border border-slate-200 rounded text-sm font-bold uppercase" value={facultyEditForm.code} onChange={e => setFacultyEditForm({...facultyEditForm, code: e.target.value})} placeholder="Code" />
                                <input className="flex-1 p-2 border border-slate-200 rounded text-sm font-bold" value={facultyEditForm.name?.vi} onChange={e => setFacultyEditForm({...facultyEditForm, name: {...facultyEditForm.name!, vi: e.target.value}})} placeholder="Name (VI)" />
                            </div>
                            <input className="w-full p-2 border border-slate-200 rounded text-sm" value={facultyEditForm.name?.en} onChange={e => setFacultyEditForm({...facultyEditForm, name: {...facultyEditForm.name!, en: e.target.value}})} placeholder="Name (EN)" />
                            
                            <select 
                                className="w-full p-2 border border-slate-200 rounded text-sm"
                                value={facultyEditForm.schoolId || ''}
                                onChange={e => setFacultyEditForm({...facultyEditForm, schoolId: e.target.value})}
                            >
                                <option value="">-- Select School --</option>
                                {(academicSchools || []).map(s => <option key={s.id} value={s.id}>{s.name[language]}</option>)}
                            </select>

                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setIsEditingFaculty(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
                                <button onClick={handleSaveFaculty} className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
                            </div>
                            </div>
                        ) : (
                            <>
                            <div className="flex items-center gap-3">
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-black">{selectedFaculty.code}</span>
                                <h2 className="text-2xl font-bold text-slate-800">{selectedFaculty.name[language]}</h2>
                            </div>
                            <p className="text-slate-500 text-sm mt-1 ml-1">{selectedFaculty.name[language === 'vi' ? 'en' : 'vi']}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                <Landmark size={12}/> Thuộc trường: <span className="font-bold text-slate-600">{academicSchools.find(s => s.id === selectedFaculty.schoolId)?.name[language] || 'N/A'}</span>
                            </div>
                            </>
                        )}
                        </div>
                        {!isEditingFaculty && (
                        <div className="flex gap-2">
                            <button onClick={() => handleEditFaculty(selectedFaculty)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={18}/></button>
                            <button onClick={() => handleDeleteFaculty(selectedFaculty.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                        </div>
                        )}
                    </div>
                </div>
                
                <div className="flex-1 flex items-center justify-center p-6 text-slate-400">
                    <div className="text-center">
                        <Building size={48} className="mx-auto mb-4 opacity-20"/>
                        <p className="italic">{language === 'vi' ? 'Chọn hoặc tạo Bộ môn để quản lý chi tiết.' : 'Select or create a Department to manage details.'}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (selectedSchoolId && selectedSchool) {
        // --- SCHOOL VIEW ---
        return (
            <div className="flex-1 flex flex-col bg-slate-50 h-full overflow-hidden">
                <div className="p-6 bg-white border-b border-slate-200 shadow-sm shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                        {isEditingSchool ? (
                            <div className="space-y-3 w-96">
                            <div className="flex gap-2">
                                <input className="w-24 p-2 border border-slate-200 rounded text-sm font-bold uppercase" value={schoolEditForm.code} onChange={e => setSchoolEditForm({...schoolEditForm, code: e.target.value})} placeholder="Code" />
                                <input className="flex-1 p-2 border border-slate-200 rounded text-sm font-bold" value={schoolEditForm.name?.vi} onChange={e => setSchoolEditForm({...schoolEditForm, name: {...schoolEditForm.name!, vi: e.target.value}})} placeholder="Name (VI)" />
                            </div>
                            <input className="w-full p-2 border border-slate-200 rounded text-sm" value={schoolEditForm.name?.en} onChange={e => setSchoolEditForm({...schoolEditForm, name: {...schoolEditForm.name!, en: e.target.value}})} placeholder="Name (EN)" />
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setIsEditingSchool(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
                                <button onClick={handleSaveSchool} className="px-3 py-1.5 text-xs font-bold bg-purple-600 text-white rounded hover:bg-purple-700">Save</button>
                            </div>
                            </div>
                        ) : (
                            <>
                            <div className="flex items-center gap-3">
                                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-black">{selectedSchool.code}</span>
                                <h2 className="text-2xl font-bold text-slate-800">{selectedSchool.name[language]}</h2>
                            </div>
                            <p className="text-slate-500 text-sm mt-1 ml-1">{selectedSchool.name[language === 'vi' ? 'en' : 'vi']}</p>
                            </>
                        )}
                        </div>
                        {!isEditingSchool && (
                        <div className="flex gap-2">
                            <button onClick={() => handleEditSchool(selectedSchool)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"><Edit2 size={18}/></button>
                            <button onClick={() => handleDeleteSchool(selectedSchool.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                        </div>
                        )}
                    </div>
                </div>
                
                <div className="flex-1 flex items-center justify-center p-6 text-slate-400">
                    <div className="text-center">
                        <Landmark size={48} className="mx-auto mb-4 opacity-20"/>
                        <p className="italic">{language === 'vi' ? 'Chọn hoặc tạo Khoa để quản lý chi tiết.' : 'Select or create a Faculty to manage details.'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return <div className="flex-1 flex items-center justify-center text-slate-400 italic">{language === 'vi' ? 'Chọn Trường/Khoa/Bộ môn để xem chi tiết' : 'Select School/Faculty/Department to view details'}</div>;
  };

  // Assign Modal
  const renderAssignModal = () => {
    if (!isAssignModalOpen || !selectedDept) return null;
    
    // Filter courses NOT in this department
    const availableCourses = courses.filter(c => 
      c.departmentId !== selectedDept.id &&
      (c.code.toLowerCase().includes(assignSearch.toLowerCase()) || c.name[language].toLowerCase().includes(assignSearch.toLowerCase()))
    ).sort((a,b) => a.code.localeCompare(b.code));

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800">{language === 'vi' ? 'Gán môn học vào' : 'Assign Courses to'} <span className="text-indigo-600">{selectedDept.code}</span></h3>
            <button onClick={() => setIsAssignModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
          </div>
          
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input 
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={language === 'vi' ? "Tìm môn học để thêm..." : "Search courses to add..."}
                value={assignSearch}
                onChange={e => setAssignSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
            {availableCourses.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 hover:bg-indigo-50 rounded-lg group border border-transparent hover:border-indigo-100 cursor-pointer" onClick={() => handleAssignCourse(c.id)}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-700 text-sm">{c.code}</span>
                    {c.departmentId && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded" title="Currently in another dept">
                        Moving from {departments.find(d => d.id === c.departmentId)?.code || 'Unknown'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-1">{c.name[language]}</div>
                </div>
                <Plus size={16} className="text-indigo-400 group-hover:text-indigo-600"/>
              </div>
            ))}
            {availableCourses.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs italic">No matching courses found.</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
      {renderSidebar()}
      {renderContent()}
      {renderAssignModal()}
    </div>
  );
};

export default DepartmentModule;

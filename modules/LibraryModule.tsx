
import React, { useState, useMemo } from 'react';
import { AppState, LibraryResource } from '../types';
import { TRANSLATIONS } from '../constants';
import { Search, Plus, Trash2, Edit2, BookOpen, Download, Link as LinkIcon, Check, X, Filter, Save, ScanSearch, ArrowRight, CopyPlus, AlertCircle, Calendar, Table as TableIcon } from 'lucide-react';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const LibraryModule: React.FC<Props> = ({ state, updateState }) => {
  const { library, courses, language } = state;
  const t = TRANSLATIONS[language];
  
  // View State
  const [viewMode, setViewMode] = useState<'library' | 'stats'>('library');

  // Library Management State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'textbook' | 'reference'>('all');
  const [minAge, setMinAge] = useState<number>(0); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LibraryResource>>({});

  // Stats State
  const [statsSearch, setStatsSearch] = useState('');

  // Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any[] | null>(null);
  const [selectedScanItems, setSelectedScanItems] = useState<Set<string>>(new Set());

  const currentYear = new Date().getFullYear();

  // --- Library Management Logic ---
  // Compute usage of each resource in courses
  const resourceUsage = useMemo(() => {
      const usage = new Map<string, { textbooks: string[], references: string[] }>();
      library.forEach(lib => {
          usage.set(lib.id, { textbooks: [], references: [] });
      });

      courses.forEach(c => {
          c.textbooks.forEach(tb => {
              if (usage.has(tb.resourceId)) {
                  if (tb.type === 'textbook') {
                      usage.get(tb.resourceId)?.textbooks.push(c.code);
                  } else {
                      usage.get(tb.resourceId)?.references.push(c.code);
                  }
              }
          });
      });
      return usage;
  }, [library, courses]);

  const filteredLibrary = library.filter(item => {
      const matchesSearch = (item.title + item.author + item.publisher).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      const itemYear = parseInt(item.year);
      const age = !isNaN(itemYear) ? currentYear - itemYear : 0;
      const matchesAge = minAge === 0 || age >= minAge;

      return matchesSearch && matchesType && matchesAge;
  });

  // --- Stats Logic ---
  const statsData = useMemo(() => {
      const rows: any[] = [];
      let stt = 1;
      
      const sortedCourses = [...courses].sort((a, b) => a.code.localeCompare(b.code));

      sortedCourses.forEach(c => {
          // Filter by Course
          const matchCourse = (c.code || '').toLowerCase().includes(statsSearch.toLowerCase()) || 
                              (c.name[language] || '').toLowerCase().includes(statsSearch.toLowerCase());
          
          if (matchCourse) {
              if (c.textbooks.length > 0) {
                  c.textbooks.forEach(tb => {
                      rows.push({
                          stt: stt++,
                          courseCode: c.code,
                          courseName: c.name[language],
                          bookTitle: tb.title,
                          author: tb.author,
                          publisher: tb.publisher,
                          year: tb.year,
                          type: tb.type === 'textbook' ? 'GTC' : 'TLTK'
                      });
                  });
              } else {
                  // Optional: Include course even if no books? 
                  // For now, let's only list books as it is "Catalog Stats".
                  // Uncomment below to show courses with no books
                  /*
                  rows.push({
                      stt: stt++,
                      courseCode: c.code,
                      courseName: c.name[language],
                      bookTitle: '(None)',
                      author: '-',
                      publisher: '-',
                      year: '-',
                      type: '-'
                  });
                  */
              }
          }
      });
      return rows;
  }, [courses, statsSearch, language]);

  // --- Actions ---
  const handleAdd = () => {
      const newItem: LibraryResource = {
          id: `lib-${Date.now()}`,
          title: '',
          author: '',
          publisher: '',
          year: new Date().getFullYear().toString(),
          type: 'textbook',
          isEbook: false,
          isPrinted: true,
          url: ''
      };
      updateState(prev => ({ ...prev, library: [newItem, ...prev.library] }));
      setEditingId(newItem.id);
      setEditForm(newItem);
  };

  const handleSave = () => {
      if (editingId && editForm.title) {
          updateState(prev => ({
              ...prev,
              library: prev.library.map(l => l.id === editingId ? { ...l, ...editForm } as LibraryResource : l)
          }));
          setEditingId(null);
          setEditForm({});
      }
  };

  const handleDelete = (id: string) => {
      if (confirm(language === 'vi' ? "Xóa tài liệu này?" : "Delete this resource?")) {
          updateState(prev => ({
              ...prev,
              library: prev.library.filter(l => l.id !== id),
              courses: prev.courses.map(c => ({
                  ...c,
                  textbooks: c.textbooks.filter(tb => tb.resourceId !== id)
              }))
          }));
      }
  };

  const startEdit = (item: LibraryResource) => {
      setEditingId(item.id);
      setEditForm({ ...item });
  };

  const handleExportCSV = () => {
      const headers = ['ID', 'Title', 'Author', 'Publisher', 'Year', 'Type', 'URL', 'Is Ebook', 'Is Printed', 'Usage'];
      const rows = library.map(item => {
          const usage = resourceUsage.get(item.id);
          const usageList: string[] = [];
          if (usage) {
              usage.textbooks.forEach(code => usageList.push(`${code} [Txt]`));
              usage.references.forEach(code => usageList.push(`${code} [Ref]`));
          }

          return [
              item.id,
              `"${item.title.replace(/"/g, '""')}"`,
              `"${item.author.replace(/"/g, '""')}"`,
              `"${item.publisher.replace(/"/g, '""')}"`,
              item.year,
              item.type,
              item.url || '',
              item.isEbook ? 'Yes' : 'No',
              item.isPrinted ? 'Yes' : 'No',
              `"${usageList.join(', ')}"`
          ];
      });

      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Library_Export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
  };

  const handleExportStatsCSV = () => {
      const headers = ['STT', 'Mã môn', 'Tên môn', 'Tên sách', 'Tác giả', 'Nhà xuất bản', 'Năm xuất bản', 'Loại tài liệu'];
      const rows = statsData.map(d => [
          d.stt,
          d.courseCode,
          `"${d.courseName.replace(/"/g, '""')}"`,
          `"${d.bookTitle.replace(/"/g, '""')}"`,
          `"${d.author.replace(/"/g, '""')}"`,
          `"${d.publisher.replace(/"/g, '""')}"`,
          d.year,
          d.type
      ]);

      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Course_Book_Stats_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
  };

  // --- Scan Functionality ---
  const handleScanSyllabi = () => {
      setIsScanning(true);
      setTimeout(() => {
          const existingIds = new Set(library.map(l => l.id));
          const candidates: any[] = [];
          const candidateMap = new Map<string, any>();

          courses.forEach(c => {
              c.textbooks.forEach(tb => {
                  if (!existingIds.has(tb.resourceId)) {
                      const key = `${tb.title.trim().toLowerCase()}|${tb.author.trim().toLowerCase()}`;
                      
                      if (!candidateMap.has(key)) {
                          const newCandidate = {
                              tempId: `temp-${Date.now()}-${Math.random()}`,
                              title: tb.title,
                              author: tb.author,
                              publisher: tb.publisher,
                              year: tb.year,
                              type: tb.type,
                              sources: []
                          };
                          candidateMap.set(key, newCandidate);
                          candidates.push(newCandidate);
                      }
                      
                      const candidate = candidateMap.get(key);
                      candidate.sources.push({ 
                          courseId: c.id, 
                          courseCode: c.code, 
                          oldResourceId: tb.resourceId 
                      });
                  }
              });
          });

          setScanResults(candidates);
          setSelectedScanItems(new Set(candidates.map(c => c.tempId)));
          setIsScanning(false);
      }, 600);
  };

  const handleImportScan = () => {
      if (!scanResults) return;
      const toImport = scanResults.filter(c => selectedScanItems.has(c.tempId));
      if (toImport.length === 0) return;

      updateState(prev => {
          const newLibraryItems: LibraryResource[] = [];
          const courseUpdates = new Map<string, { oldId: string, newId: string }[]>();

          toImport.forEach(item => {
              const newId = `lib-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
              newLibraryItems.push({
                  id: newId,
                  title: item.title,
                  author: item.author,
                  publisher: item.publisher,
                  year: item.year,
                  type: item.type,
                  isEbook: false,
                  isPrinted: true,
                  url: ''
              });

              item.sources.forEach((src: any) => {
                  if (!courseUpdates.has(src.courseId)) {
                      courseUpdates.set(src.courseId, []);
                  }
                  courseUpdates.get(src.courseId)?.push({ oldId: src.oldResourceId, newId: newId });
              });
          });

          const updatedCourses = prev.courses.map(c => {
              if (courseUpdates.has(c.id)) {
                  const replacements = courseUpdates.get(c.id) || [];
                  const newTextbooks = c.textbooks.map(tb => {
                      const rep = replacements.find(r => r.oldId === tb.resourceId);
                      return rep ? { ...tb, resourceId: rep.newId } : tb;
                  });
                  return { ...c, textbooks: newTextbooks };
              }
              return c;
          });

          return {
              ...prev,
              library: [...prev.library, ...newLibraryItems],
              courses: updatedCourses
          };
      });

      setScanResults(null);
      alert(language === 'vi' ? `Đã nhập ${toImport.length} tài liệu và cập nhật liên kết.` : `Imported ${toImport.length} resources and updated links.`);
  };

  // --- Renderers ---
  const renderStatsTable = () => (
      <div className="flex-1 flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="relative w-72">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={language === 'vi' ? "Lọc theo môn học..." : "Filter by course..."}
                      value={statsSearch}
                      onChange={e => setStatsSearch(e.target.value)}
                  />
              </div>
              <button onClick={handleExportStatsCSV} className="bg-white border border-slate-200 text-emerald-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-50 hover:border-emerald-200 transition shadow-sm">
                  <Download size={16} /> {language === 'vi' ? 'Xuất Thống kê' : 'Export Stats'}
              </button>
          </div>
          <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                          <th className="p-3 font-bold text-slate-600 w-12 text-center">STT</th>
                          <th className="p-3 font-bold text-slate-600 w-24">{language === 'vi' ? 'Mã môn' : 'Code'}</th>
                          <th className="p-3 font-bold text-slate-600 w-48">{language === 'vi' ? 'Tên môn' : 'Course Name'}</th>
                          <th className="p-3 font-bold text-slate-600 w-64">{language === 'vi' ? 'Tên sách' : 'Book Title'}</th>
                          <th className="p-3 font-bold text-slate-600 w-32">{language === 'vi' ? 'Tác giả' : 'Author'}</th>
                          <th className="p-3 font-bold text-slate-600 w-32">{language === 'vi' ? 'NXB' : 'Publisher'}</th>
                          <th className="p-3 font-bold text-slate-600 w-16 text-center">{language === 'vi' ? 'Năm' : 'Year'}</th>
                          <th className="p-3 font-bold text-slate-600 w-20 text-center">{language === 'vi' ? 'Loại' : 'Type'}</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {statsData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 text-center text-slate-500">{row.stt}</td>
                              <td className="p-3 font-mono font-bold text-indigo-700">{row.courseCode}</td>
                              <td className="p-3 font-medium text-slate-700">{row.courseName}</td>
                              <td className="p-3 text-slate-800 font-semibold">{row.bookTitle}</td>
                              <td className="p-3 text-slate-600 text-xs">{row.author}</td>
                              <td className="p-3 text-slate-600 text-xs">{row.publisher}</td>
                              <td className="p-3 text-center text-slate-600 text-xs">{row.year}</td>
                              <td className="p-3 text-center">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${row.type === 'GTC' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                      {row.type}
                                  </span>
                              </td>
                          </tr>
                      ))}
                      {statsData.length === 0 && (
                          <tr><td colSpan={8} className="p-8 text-center text-slate-400 italic">{language === 'vi' ? 'Không có dữ liệu phù hợp.' : 'No matching data.'}</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col relative">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0 gap-4">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BookOpen size={20} className="text-indigo-600"/> {t.library}
            </h1>
            
            {/* View Switcher */}
            <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                <button 
                    onClick={() => setViewMode('library')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'library' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <BookOpen size={14}/> {language === 'vi' ? 'Quản lý Thư viện' : 'Library Mgmt'}
                </button>
                <button 
                    onClick={() => setViewMode('stats')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'stats' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <TableIcon size={14}/> {language === 'vi' ? 'Thống kê danh mục' : 'Catalog Statistics'}
                </button>
            </div>

            {viewMode === 'library' && (
                <div className="flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                            placeholder={language === 'vi' ? "Tìm kiếm..." : "Search resources..."}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filters Group */}
                    <div className="flex items-center gap-2">
                        {/* Category Filter */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button onClick={() => setFilterType('all')} className={`px-2 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'all' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>{t.allCategories}</button>
                            <button onClick={() => setFilterType('textbook')} className={`px-2 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'textbook' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>{t.typeTextbook}</button>
                            <button onClick={() => setFilterType('reference')} className={`px-2 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'reference' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>{t.typeReference}</button>
                        </div>

                        {/* Age Filter Slider */}
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 px-3 rounded-lg group hover:border-indigo-300 transition-colors" title={language === 'vi' ? 'Lọc sách cũ' : 'Filter old books'}>
                            <Calendar size={14} className={`text-slate-400 ${minAge > 0 ? 'text-indigo-500' : ''}`} />
                            <div className="flex flex-col w-20">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Độ cũ' : 'Age'}</span>
                                    <span className={`text-[10px] font-bold ${minAge > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                                        {minAge === 0 ? 'All' : `> ${minAge}y`}
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="20" 
                                    step="1" 
                                    value={minAge} 
                                    onChange={(e) => setMinAge(parseInt(e.target.value))}
                                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

                    <button onClick={handleScanSyllabi} disabled={isScanning} className="bg-amber-50 text-amber-600 border border-amber-200 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-amber-100 transition shadow-sm">
                        <ScanSearch size={16} className={isScanning ? "animate-spin" : ""} /> {language === 'vi' ? 'Quét Đề cương' : 'Scan'}
                    </button>

                    <button onClick={handleExportCSV} className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition shadow-sm">
                        <Download size={16} /> CSV
                    </button>
                    <button onClick={handleAdd} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm">
                        <Plus size={16} /> {t.createResource}
                    </button>
                </div>
            )}
        </div>

        {/* Content based on View Mode */}
        {viewMode === 'library' ? (
            <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase w-1/3">Resource Info</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase w-48">Details</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Usage (Courses)</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredLibrary.map(item => (
                            <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${editingId === item.id ? 'bg-indigo-50/30' : ''}`}>
                                {editingId === item.id ? (
                                    // Editing Mode
                                    <>
                                        <td className="p-4 align-top space-y-2">
                                            <input className="w-full p-2 border border-slate-200 rounded text-sm font-bold" placeholder="Title" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                                            <div className="flex gap-2">
                                                <input className="flex-1 p-2 border border-slate-200 rounded text-xs" placeholder="Author" value={editForm.author || ''} onChange={e => setEditForm({...editForm, author: e.target.value})} />
                                                <input className="w-24 p-2 border border-slate-200 rounded text-xs" placeholder="Year" value={editForm.year || ''} onChange={e => setEditForm({...editForm, year: e.target.value})} />
                                            </div>
                                            <input className="w-full p-2 border border-slate-200 rounded text-xs" placeholder="Publisher" value={editForm.publisher || ''} onChange={e => setEditForm({...editForm, publisher: e.target.value})} />
                                        </td>
                                        <td className="p-4 align-top space-y-2">
                                            <select className="w-full p-2 border border-slate-200 rounded text-xs" value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value as any})}>
                                                <option value="textbook">{t.typeTextbook}</option>
                                                <option value="reference">{t.typeReference}</option>
                                            </select>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={editForm.isEbook} onChange={e => setEditForm({...editForm, isEbook: e.target.checked})} /> Ebook</label>
                                                <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={editForm.isPrinted} onChange={e => setEditForm({...editForm, isPrinted: e.target.checked})} /> Printed</label>
                                            </div>
                                            <input className="w-full p-2 border border-slate-200 rounded text-xs" placeholder="URL (Optional)" value={editForm.url || ''} onChange={e => setEditForm({...editForm, url: e.target.value})} />
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="text-xs text-slate-400 italic">Usage info not editable</div>
                                        </td>
                                        <td className="p-4 align-top text-right space-y-2">
                                            <button onClick={handleSave} className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 w-full flex justify-center"><Check size={16}/></button>
                                            <button onClick={() => setEditingId(null)} className="p-2 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 w-full flex justify-center"><X size={16}/></button>
                                        </td>
                                    </>
                                ) : (
                                    // View Mode
                                    <>
                                        <td className="p-4 align-top">
                                            <div className="font-bold text-slate-800 text-sm">{item.title}</div>
                                            <div className="text-xs text-slate-500 mt-1">{item.author}</div>
                                            <div className="text-xs text-slate-400">{item.publisher} • {item.year}</div>
                                            {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-1"><LinkIcon size={10}/> Link</a>}
                                        </td>
                                        <td className="p-4 align-top">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase mb-1 inline-block ${item.type === 'textbook' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {item.type === 'textbook' ? t.typeTextbook : t.typeReference}
                                            </span>
                                            <div className="flex gap-2 text-[10px] text-slate-500 mt-1">
                                                {item.isEbook && <span className="px-1.5 py-0.5 border rounded">Ebook</span>}
                                                {item.isPrinted && <span className="px-1.5 py-0.5 border rounded">Printed</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            {resourceUsage.get(item.id) && (
                                                <div className="flex flex-wrap gap-1">
                                                    {resourceUsage.get(item.id)?.textbooks.map(code => (
                                                        <span key={code} className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[10px] font-bold">{code} (T)</span>
                                                    ))}
                                                    {resourceUsage.get(item.id)?.references.map(code => (
                                                        <span key={code} className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 text-slate-600 rounded text-[10px]">{code} (R)</span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 align-top text-right">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => startEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><Edit2 size={16}/></button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {filteredLibrary.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">No resources found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        ) : (
            renderStatsTable()
        )}

        {/* Scan Results Modal */}
        {scanResults && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <ScanSearch size={20} className="text-amber-500"/>
                                {language === 'vi' ? 'Nhập tài liệu từ Đề cương' : 'Import Resources from Syllabi'}
                            </h3>
                            <p className="text-xs text-slate-500">{scanResults.length} {language === 'vi' ? 'mục chưa có trong thư viện' : 'items missing from library'}</p>
                        </div>
                        <button onClick={() => setScanResults(null)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50">
                        {scanResults.length > 0 ? (
                            <div className="space-y-3">
                                {scanResults.map((item) => (
                                    <div 
                                        key={item.tempId} 
                                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedScanItems.has(item.tempId) ? 'bg-white border-indigo-300 ring-1 ring-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                                        onClick={() => {
                                            const next = new Set(selectedScanItems);
                                            if (next.has(item.tempId)) next.delete(item.tempId);
                                            else next.add(item.tempId);
                                            setSelectedScanItems(next);
                                        }}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${selectedScanItems.has(item.tempId) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                            {selectedScanItems.has(item.tempId) && <Check size={12} className="text-white"/>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-sm text-slate-800">{item.title}</div>
                                            <div className="text-xs text-slate-500 mt-1">{item.author} • {item.publisher} ({item.year})</div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {item.sources.map((src: any, idx: number) => (
                                                    <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                                                        Used in {src.courseCode}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                                            {item.type}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Check size={48} className="mb-4 text-emerald-500"/>
                                <p className="font-medium">{language === 'vi' ? 'Tất cả tài liệu trong đề cương đã có trong thư viện!' : 'All syllabus resources are present in the library!'}</p>
                            </div>
                        )}
                    </div>

                    <div className="p-5 border-t border-slate-100 bg-white flex justify-between items-center">
                        <div className="text-xs text-slate-500 font-medium">
                            {selectedScanItems.size} {language === 'vi' ? 'đã chọn' : 'selected'}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setScanResults(null)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100">
                                {language === 'vi' ? 'Hủy' : 'Cancel'}
                            </button>
                            <button 
                                onClick={handleImportScan} 
                                disabled={selectedScanItems.size === 0}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                            >
                                <CopyPlus size={16}/> {language === 'vi' ? 'Nhập & Liên kết' : 'Import & Link'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default LibraryModule;

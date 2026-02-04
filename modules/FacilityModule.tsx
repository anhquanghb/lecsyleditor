
import React, { useState } from 'react';
import { AppState, Facility, Course } from '../types';
import { TRANSLATIONS } from '../constants';
import { Plus, Trash2, Edit2, Search, Building, MapPin, Check, X, BookOpen, Globe } from 'lucide-react';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const FacilityModule: React.FC<Props> = ({ state, updateState }) => {
  const { facilities, courses, language } = state;
  const t = TRANSLATIONS[language];

  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Facility>>({});

  // State for course selector modal
  const [isCourseSelectorOpen, setIsCourseSelectorOpen] = useState(false);
  const [selectedFacilityIdForCourses, setSelectedFacilityIdForCourses] = useState<string | null>(null);
  const [tempCourseIds, setTempCourseIds] = useState<string[]>([]);

  // --- Filtering ---
  const filteredFacilities = facilities.filter(item => {
    return (
      (item.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.name[language] || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.[language] || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // --- CRUD Actions ---
  const handleAdd = () => {
    const newItem: Facility = {
      id: `fac-${Date.now()}`,
      code: '',
      name: { vi: '', en: '' },
      description: { vi: '', en: '' },
      courseIds: []
    };
    // Add to top of list
    updateState(prev => ({ ...prev, facilities: [newItem, ...prev.facilities] }));
    
    // Start editing immediately
    setEditingId(newItem.id);
    setEditForm(newItem);
  };

  const startEdit = (item: Facility) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleSave = () => {
    if (editingId) {
      updateState(prev => ({
        ...prev,
        facilities: prev.facilities.map(f => f.id === editingId ? { ...f, ...editForm } as Facility : f)
      }));
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleDelete = (id: string) => {
    if (confirm(language === 'vi' ? "Xóa phòng này?" : "Delete this facility?")) {
      updateState(prev => ({
        ...prev,
        facilities: prev.facilities.filter(f => f.id !== id)
      }));
    }
  };

  // --- Course Selector Actions ---
  const openCourseSelector = (facilityId: string) => {
    const facility = facilities.find(f => f.id === facilityId);
    if (facility) {
      setSelectedFacilityIdForCourses(facilityId);
      setTempCourseIds([...facility.courseIds]);
      setIsCourseSelectorOpen(true);
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    if (tempCourseIds.includes(courseId)) {
      setTempCourseIds(tempCourseIds.filter(id => id !== courseId));
    } else {
      setTempCourseIds([...tempCourseIds, courseId]);
    }
  };

  const saveCourseSelection = () => {
    if (selectedFacilityIdForCourses) {
      updateState(prev => ({
        ...prev,
        facilities: prev.facilities.map(f => 
          f.id === selectedFacilityIdForCourses 
            ? { ...f, courseIds: tempCourseIds } 
            : f
        )
      }));
      setIsCourseSelectorOpen(false);
      setSelectedFacilityIdForCourses(null);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Building size={20} className="text-indigo-600"/> {t.facilities}
        </h1>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              placeholder={language === 'vi' ? "Tìm kiếm..." : "Search facilities..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={handleAdd} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm">
            <Plus size={16} /> {t.addFacility}
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-4 font-bold text-slate-500 uppercase w-16 text-center">{t.contentNo}</th>
              <th className="p-4 font-bold text-slate-500 uppercase w-32">{t.roomCode}</th>
              <th className="p-4 font-bold text-slate-500 uppercase w-72">{t.roomName} & {t.description}</th>
              <th className="p-4 font-bold text-slate-500 uppercase">{t.usage}</th>
              <th className="p-4 font-bold text-slate-500 uppercase text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredFacilities.map((item, idx) => (
              <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${editingId === item.id ? 'bg-indigo-50/30' : ''}`}>
                <td className="p-4 text-center text-slate-500">{idx + 1}</td>
                
                {editingId === item.id ? (
                  // Editing Mode
                  <>
                    <td className="p-4 align-top">
                      <input 
                        className="w-full p-2 border border-slate-200 rounded text-sm font-bold uppercase" 
                        placeholder="Code" 
                        value={editForm.code || ''} 
                        onChange={e => setEditForm({...editForm, code: e.target.value})} 
                        autoFocus
                      />
                    </td>
                    <td className="p-4 align-top space-y-4">
                      {/* Name Inputs */}
                      <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                              <Globe size={12} className="text-slate-400"/>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Tên phòng (Vi / En)' : 'Room Name (Vi / En)'}</span>
                          </div>
                          <input 
                            className="w-full p-2 border border-slate-200 rounded text-sm" 
                            placeholder="Tên Tiếng Việt" 
                            value={editForm.name?.vi || ''} 
                            onChange={e => setEditForm({...editForm, name: { ...editForm.name!, vi: e.target.value }})} 
                          />
                          <input 
                            className="w-full p-2 border border-slate-200 rounded text-sm bg-slate-50" 
                            placeholder="English Name" 
                            value={editForm.name?.en || ''} 
                            onChange={e => setEditForm({...editForm, name: { ...editForm.name!, en: e.target.value }})} 
                          />
                      </div>

                      {/* Description Inputs */}
                      <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                              <BookOpen size={12} className="text-slate-400"/>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Mô tả / Chức năng (Vi / En)' : 'Description / Function (Vi / En)'}</span>
                          </div>
                          <textarea
                            className="w-full p-2 border border-slate-200 rounded text-sm resize-none"
                            placeholder="Mô tả Tiếng Việt"
                            rows={2}
                            value={editForm.description?.vi || ''}
                            onChange={e => setEditForm({...editForm, description: { ...editForm.description!, vi: e.target.value }})}
                          />
                          <textarea
                            className="w-full p-2 border border-slate-200 rounded text-sm bg-slate-50 resize-none"
                            placeholder="English Description"
                            rows={2}
                            value={editForm.description?.en || ''}
                            onChange={e => setEditForm({...editForm, description: { ...editForm.description!, en: e.target.value }})}
                          />
                      </div>
                    </td>
                    <td className="p-4 align-top text-slate-400 italic text-xs">
                        {/* Course selection is separate modal */}
                        <div className="p-3 border border-slate-200 border-dashed rounded bg-white/50 text-center">
                            {language === 'vi' ? 'Lưu thông tin trước khi gán môn học.' : 'Save info before assigning courses.'}
                        </div>
                    </td>
                    <td className="p-4 align-top text-right space-y-2">
                      <button onClick={handleSave} className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 w-full flex justify-center"><Check size={16}/></button>
                      <button onClick={() => { setEditingId(null); if (!item.code) handleDelete(item.id); }} className="p-2 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 w-full flex justify-center"><X size={16}/></button>
                    </td>
                  </>
                ) : (
                  // View Mode
                  <>
                    <td className="p-4 align-top">
                      <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-xs">
                        {item.code || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-slate-800">{item.name[language]}</div>
                      {item.description?.[language] && (
                        <div className="text-xs text-slate-500 mt-1 italic leading-relaxed">{item.description[language]}</div>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-wrap gap-2 items-center">
                        <button 
                          onClick={() => openCourseSelector(item.id)}
                          className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors border border-indigo-100"
                        >
                          <Edit2 size={10} /> {language === 'vi' ? 'Chọn môn học' : 'Select Courses'}
                        </button>
                        
                        {item.courseIds.length > 0 ? (
                          item.courseIds.map(cid => {
                            const course = courses.find(c => c.id === cid);
                            return (
                              <span key={cid} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 font-medium shadow-sm" title={course?.name[language]}>
                                {course ? course.code : cid}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-400 italic">{language === 'vi' ? 'Chưa có môn học' : 'No courses assigned'}</span>
                        )}
                      </div>
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
            {filteredFacilities.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">No facilities found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Course Selector Modal */}
      {isCourseSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-600"/> 
                {language === 'vi' ? 'Chọn môn học cho phòng' : 'Select Courses for Facility'}
              </h3>
              <button onClick={() => setIsCourseSelectorOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[...courses].sort((a,b) => a.code.localeCompare(b.code)).map(c => {
                  const isSelected = tempCourseIds.includes(c.id);
                  return (
                    <div 
                      key={c.id}
                      onClick={() => toggleCourseSelection(c.id)}
                      className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${isSelected ? 'bg-indigo-50 border-indigo-300 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>{c.code}</div>
                        <div className="text-xs text-slate-500 truncate">{c.name[language]}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">{tempCourseIds.length} selected</span>
              <div className="flex gap-2">
                <button onClick={() => setIsCourseSelectorOpen(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
                <button onClick={saveCourseSelection} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-sm transition-colors">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilityModule;


import React, { useState, useEffect } from 'react';
import { AppState, TeachingMethod, AssessmentMethod, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Plus, Trash2, Globe } from 'lucide-react';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const SyllabusConfigModule: React.FC<Props> = ({ state, updateState }) => {
  const { language, teachingMethods, assessmentMethods } = state;
  const t = TRANSLATIONS[language];
  
  const [activeTab, setActiveTab] = useState<'teaching' | 'assessment'>('teaching');
  const [editLanguage, setEditLanguage] = useState<Language>(language);

  // Sync edit language with app language initially if needed, or keep independent
  useEffect(() => {
    setEditLanguage(language);
  }, [language]);

  // --- Teaching Method Actions ---
  const addTeachingMethod = () => {
    const newMethod: TeachingMethod = {
      id: `tm-${Date.now()}`,
      code: 'NEW',
      name: { vi: 'Phương pháp mới', en: 'New Method' },
      description: { vi: '', en: '' },
      hoursPerCredit: 15,
      category: 'THEORY'
    };
    updateState(prev => ({ ...prev, teachingMethods: [...prev.teachingMethods, newMethod] }));
  };

  const updateTeachingMethod = (id: string, field: keyof TeachingMethod | 'name' | 'description', value: any) => {
    updateState(prev => ({
      ...prev,
      teachingMethods: prev.teachingMethods.map(m => {
        if (m.id !== id) return m;
        
        // Handle Localized Strings based on current editLanguage
        if (field === 'name') {
            return { ...m, name: { ...m.name, [editLanguage]: value } };
        }
        if (field === 'description') {
            return { ...m, description: { ...(m.description || { vi: '', en: '' }), [editLanguage]: value } };
        }

        // Handle primitive fields
        return { ...m, [field]: value };
      })
    }));
  };

  const deleteTeachingMethod = (id: string) => {
    if (confirm(language === 'vi' ? 'Xóa phương pháp giảng dạy này?' : 'Delete this teaching method?')) {
      updateState(prev => ({
        ...prev,
        teachingMethods: prev.teachingMethods.filter(m => m.id !== id)
      }));
    }
  };

  // --- Assessment Method Actions ---
  const addAssessmentMethod = () => {
    const newMethod: AssessmentMethod = {
      id: `am-${Date.now()}`,
      name: { vi: 'Hình thức mới', en: 'New Assessment' }
    };
    updateState(prev => ({ ...prev, assessmentMethods: [...prev.assessmentMethods, newMethod] }));
  };

  const updateAssessmentMethod = (id: string, value: string) => {
    updateState(prev => ({
      ...prev,
      assessmentMethods: prev.assessmentMethods.map(m => m.id === id ? { ...m, name: { ...m.name, [editLanguage]: value } } : m)
    }));
  };

  const deleteAssessmentMethod = (id: string) => {
    if (confirm(language === 'vi' ? 'Xóa hình thức đánh giá này?' : 'Delete this assessment method?')) {
      updateState(prev => ({
        ...prev,
        assessmentMethods: prev.assessmentMethods.filter(m => m.id !== id)
      }));
    }
  };

  const LanguageSwitcher = () => (
    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
        <button 
            onClick={() => setEditLanguage('vi')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${editLanguage === 'vi' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
            Tiếng Việt
        </button>
        <button 
            onClick={() => setEditLanguage('en')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${editLanguage === 'en' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
            English
        </button>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-slate-50/50 h-full">
      
      {/* Header Controls */}
      <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
            <button
              onClick={() => setActiveTab('teaching')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'teaching' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.teachingMethodology}
            </button>
            <button
              onClick={() => setActiveTab('assessment')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'assessment' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.assessmentMethods}
            </button>
          </div>

          <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Globe size={14}/> {language === 'vi' ? 'Ngôn ngữ chỉnh sửa:' : 'Editing Language:'}</span>
              <LanguageSwitcher />
          </div>
      </div>

      {activeTab === 'teaching' && (
        <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-700">{t.teachingMethodology}</h3>
            <button onClick={addTeachingMethod} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-indigo-700 shadow-sm"><Plus size={14} /> {language === 'vi' ? 'Thêm phương pháp' : 'Add Method'}</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-3 font-bold text-slate-500 w-24">Code</th>
                  <th className="p-3 font-bold text-slate-500 w-64">{language === 'vi' ? 'Tên phương pháp' : 'Method Name'} ({editLanguage.toUpperCase()})</th>
                  <th className="p-3 font-bold text-slate-500">{t.description} ({editLanguage.toUpperCase()})</th>
                  <th className="p-3 font-bold text-slate-500 w-24 text-center">Hrs/Cr</th>
                  <th className="p-3 font-bold text-slate-500 w-32 text-center">Category</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {teachingMethods.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 align-top group">
                    <td className="p-2">
                        <input 
                            className="w-full p-2 bg-transparent border border-transparent hover:border-slate-200 rounded font-mono font-bold text-indigo-600 outline-none focus:bg-white focus:border-indigo-300" 
                            value={m.code} 
                            onChange={e => updateTeachingMethod(m.id, 'code', e.target.value)} 
                        />
                    </td>
                    <td className="p-2">
                        <div className="relative">
                            <input 
                                className="w-full p-2 bg-transparent border border-transparent hover:border-slate-200 rounded outline-none focus:bg-white focus:border-indigo-300 font-medium" 
                                value={m.name[editLanguage]} 
                                onChange={e => updateTeachingMethod(m.id, 'name', e.target.value)}
                                placeholder={editLanguage === 'vi' ? "Nhập tên..." : "Enter name..."}
                            />
                            {/* Missing Translation Indicator */}
                            {!m.name[editLanguage === 'vi' ? 'en' : 'vi'] && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-400" title="Missing translation in other language"></div>
                            )}
                        </div>
                    </td>
                    <td className="p-2">
                        <div className="relative">
                            <textarea 
                                className="w-full p-2 bg-transparent border border-transparent hover:border-slate-200 rounded outline-none resize-none focus:bg-white focus:border-indigo-300 min-h-[40px]" 
                                rows={1} 
                                value={m.description?.[editLanguage] || ''} 
                                onChange={e => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                    updateTeachingMethod(m.id, 'description', e.target.value);
                                }} 
                                placeholder={editLanguage === 'vi' ? "Mô tả..." : "Description..."}
                            />
                        </div>
                    </td>
                    <td className="p-2">
                        <input 
                            type="number" 
                            className="w-full p-2 text-center bg-transparent border border-transparent hover:border-slate-200 rounded outline-none focus:bg-white focus:border-indigo-300" 
                            value={m.hoursPerCredit} 
                            onChange={e => updateTeachingMethod(m.id, 'hoursPerCredit', parseInt(e.target.value) || 0)} 
                        />
                    </td>
                    <td className="p-2 text-center">
                      <select
                        className={`p-1.5 rounded text-[10px] font-bold outline-none border border-transparent hover:border-slate-200 cursor-pointer w-full focus:bg-white focus:border-indigo-300 ${m.category === 'THEORY' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}
                        value={m.category || 'THEORY'}
                        onChange={e => updateTeachingMethod(m.id, 'category', e.target.value)}
                      >
                        <option value="THEORY">THEORY</option>
                        <option value="PRACTICE">PRACTICE</option>
                      </select>
                    </td>
                    <td className="p-2 text-center pt-3">
                        <button onClick={() => deleteTeachingMethod(m.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'assessment' && (
        <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-700">{t.assessmentMethods}</h3>
            <button onClick={addAssessmentMethod} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-indigo-700 shadow-sm"><Plus size={14} /> {language === 'vi' ? 'Thêm hình thức' : 'Add Assessment'}</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-3 font-bold text-slate-500">{language === 'vi' ? 'Tên hình thức' : 'Assessment Name'} ({editLanguage.toUpperCase()})</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assessmentMethods.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 group">
                    <td className="p-2">
                        <div className="relative">
                            <input 
                                className="w-full p-2 bg-transparent border border-transparent hover:border-slate-200 rounded outline-none focus:bg-white focus:border-indigo-300" 
                                value={m.name[editLanguage]} 
                                onChange={e => updateAssessmentMethod(m.id, e.target.value)} 
                                placeholder={editLanguage === 'vi' ? "Tên hình thức..." : "Assessment name..."}
                            />
                             {!m.name[editLanguage === 'vi' ? 'en' : 'vi'] && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-400" title="Missing translation"></div>
                            )}
                        </div>
                    </td>
                    <td className="p-2 text-center">
                        <button onClick={() => deleteAssessmentMethod(m.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyllabusConfigModule;

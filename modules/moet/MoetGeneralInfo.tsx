
import React from 'react';
import { AppState, GeneralInfo, MoetProgramFaculty } from '../../types';
import { BookOpen, Plus, Trash2, UserCog } from 'lucide-react';
import { InputField } from './MoetShared';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const MoetGeneralInfo: React.FC<Props> = ({ state, updateState }) => {
  const { generalInfo, language } = state;
  const moetInfo = generalInfo.moetInfo;

  const updateMoetField = (field: keyof typeof moetInfo, value: any) => {
    updateState(prev => ({
      ...prev,
      generalInfo: {
        ...prev.generalInfo,
        moetInfo: { ...prev.generalInfo.moetInfo, [field]: value }
      }
    }));
  };

  const updateMoetLangField = (field: keyof typeof moetInfo, value: string) => {
    const currentVal = (moetInfo[field] as any) || { vi: '', en: '' };
    updateMoetField(field, { ...currentVal, [language]: value });
  };

  // Program Faculty Actions
  const addProgramFaculty = () => {
    const newItem: MoetProgramFaculty = {
      id: `pf-${Date.now()}`,
      name: '', position: '', major: '', degree: '', responsibility: '', note: ''
    };
    updateMoetField('programFaculty', [...(moetInfo.programFaculty || []), newItem]);
  };

  const updateProgramFaculty = (id: string, field: keyof MoetProgramFaculty, value: string) => {
    updateMoetField('programFaculty', (moetInfo.programFaculty || []).map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const deleteProgramFaculty = (id: string) => {
    updateMoetField('programFaculty', (moetInfo.programFaculty || []).filter(f => f.id !== id));
  };

  return (
    <div className="space-y-10">
      {/* 1. Basic Info */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50"><h3 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen size={18} className="text-emerald-600"/>{language === 'vi' ? '1. Thông tin chung' : '1. General Information'}</h3></div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InputField label={language === 'vi' ? 'Trình độ đào tạo' : 'Training Level'} value={moetInfo.level[language]} onChange={v => updateMoetLangField('level', v)} placeholder="e.g. Đại học" />
              <InputField label={language === 'vi' ? 'Tên ngành' : 'Major Name'} value={moetInfo.majorName[language]} onChange={v => updateMoetLangField('majorName', v)} placeholder="e.g. Kỹ thuật Điện" />
              <InputField label={language === 'vi' ? 'Mã ngành' : 'Major Code'} value={moetInfo.majorCode} onChange={v => updateMoetField('majorCode', v)} placeholder="e.g. 7520201" />
              <InputField label={language === 'vi' ? 'Tên chuyên ngành' : 'Specialization Name'} value={moetInfo.specializationName[language]} onChange={v => updateMoetLangField('specializationName', v)} placeholder="" />
              <InputField label={language === 'vi' ? 'Mã chuyên ngành' : 'Specialization Code'} value={moetInfo.specializationCode} onChange={v => updateMoetField('specializationCode', v)} placeholder="" />
              <InputField label={language === 'vi' ? 'Hình thức đào tạo' : 'Training Mode'} value={moetInfo.trainingMode[language]} onChange={v => updateMoetLangField('trainingMode', v)} placeholder="e.g. Chính quy" />
              <InputField label={language === 'vi' ? 'Ngôn ngữ đào tạo' : 'Training Language'} value={moetInfo.trainingLanguage[language]} onChange={v => updateMoetLangField('trainingLanguage', v)} placeholder="e.g. Tiếng Việt" />
              <InputField label={language === 'vi' ? 'Thời gian đào tạo' : 'Duration'} value={moetInfo.duration} onChange={v => updateMoetField('duration', v)} placeholder="e.g. 4.5 năm" />
              <InputField label={language === 'vi' ? 'Phương thức đào tạo' : 'Training Type'} value={moetInfo.trainingType[language]} onChange={v => updateMoetLangField('trainingType', v)} placeholder="Tập trung" />
          </div>
      </section>

      {/* 2. Program Faculty */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><UserCog size={18} className="text-emerald-600"/>{language === 'vi' ? 'Danh sách nhân sự phụ trách ngành' : 'List of Program Faculty'}</h3>
              <button onClick={addProgramFaculty} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-2"><Plus size={14}/> Add</button>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                          <th className="p-3 text-xs font-bold text-slate-500">Name</th>
                          <th className="p-3 text-xs font-bold text-slate-500">Degree</th>
                          <th className="p-3 text-xs font-bold text-slate-500">Position</th>
                          <th className="p-3 text-xs font-bold text-slate-500">Major</th>
                          <th className="p-3 text-xs font-bold text-slate-500">Responsibility</th>
                          <th className="p-3 w-10"></th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {(moetInfo.programFaculty || []).map(f => (
                          <tr key={f.id}>
                              <td className="p-2"><input className="w-full bg-transparent outline-none border-b border-transparent focus:border-indigo-300" value={f.name} onChange={e => updateProgramFaculty(f.id, 'name', e.target.value)} /></td>
                              <td className="p-2"><input className="w-full bg-transparent outline-none border-b border-transparent focus:border-indigo-300" value={f.degree} onChange={e => updateProgramFaculty(f.id, 'degree', e.target.value)} /></td>
                              <td className="p-2"><input className="w-full bg-transparent outline-none border-b border-transparent focus:border-indigo-300" value={f.position} onChange={e => updateProgramFaculty(f.id, 'position', e.target.value)} /></td>
                              <td className="p-2"><input className="w-full bg-transparent outline-none border-b border-transparent focus:border-indigo-300" value={f.major} onChange={e => updateProgramFaculty(f.id, 'major', e.target.value)} /></td>
                              <td className="p-2"><input className="w-full bg-transparent outline-none border-b border-transparent focus:border-indigo-300" value={f.responsibility} onChange={e => updateProgramFaculty(f.id, 'responsibility', e.target.value)} /></td>
                              <td className="p-2 text-center"><button onClick={() => deleteProgramFaculty(f.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button></td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </section>
    </div>
  );
};

export default MoetGeneralInfo;

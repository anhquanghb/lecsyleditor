
import React from 'react';
import { AppState, MoetCategory, MoetObjective } from '../../types';
import { Target, Layout, Plus, Trash2, Link2, CheckSquare, BookOpen, GraduationCap, UserCog } from 'lucide-react';
import { RichNarrativeSection } from './MoetShared';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const CATEGORY_ORDER: MoetCategory[] = ['knowledge', 'skills', 'learning'];
const CATEGORY_META: Record<MoetCategory, { vi: string, en: string, color: string, icon: React.ReactNode }> = {
  knowledge: { vi: 'Kiến thức', en: 'Knowledge', color: 'text-blue-600', icon: <BookOpen size={16}/> },
  skills: { vi: 'Kỹ năng', en: 'Skills', color: 'text-green-600', icon: <Target size={16}/> },
  learning: { vi: 'Năng lực tự chủ & Trách nhiệm', en: 'Autonomy & Responsibility', color: 'text-purple-600', icon: <GraduationCap size={16}/> }
};

const MoetObjectives: React.FC<Props> = ({ state, updateState }) => {
  const { generalInfo, language, peos, sos } = state;
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

  // --- Actions ---
  const addMoetSpecificObjective = () => {
    const newObj: MoetObjective = {
        id: `MSO-${Date.now()}`, description: { vi: '', en: '' }, peoIds: []
    };
    updateMoetField('moetSpecificObjectives', [...(moetInfo.moetSpecificObjectives || []), newObj]);
  };

  const updateMoetSpecificObjectiveDesc = (id: string, val: string) => {
    const newObjs = (moetInfo.moetSpecificObjectives || []).map(o => o.id === id ? { ...o, description: { ...o.description, [language]: val } } : o);
    updateMoetField('moetSpecificObjectives', newObjs);
  };

  const toggleMoetSpecificObjectivePeo = (objId: string, peoId: string) => {
    const newObjs = (moetInfo.moetSpecificObjectives || []).map(o => {
        if (o.id !== objId) return o;
        const currentPeos = o.peoIds || [];
        return {
            ...o,
            peoIds: currentPeos.includes(peoId) ? currentPeos.filter(id => id !== peoId) : [...currentPeos, peoId]
        };
    });
    updateMoetField('moetSpecificObjectives', newObjs);
  };

  const deleteMoetSpecificObjective = (id: string) => {
    updateMoetField('moetSpecificObjectives', (moetInfo.moetSpecificObjectives || []).filter(o => o.id !== id));
  };

  const addObjective = (category: MoetCategory) => {
      const newObj: MoetObjective = {
          id: `MO-${Date.now()}`, category: category, description: { vi: '', en: '' }, peoIds: [], soIds: []
      };
      updateMoetField('specificObjectives', [...(moetInfo.specificObjectives || []), newObj]);
  };

  const updateObjectiveDesc = (id: string, val: string) => {
      const newObjs = (moetInfo.specificObjectives || []).map(o => o.id === id ? { ...o, description: { ...o.description, [language]: val } } : o);
      updateMoetField('specificObjectives', newObjs);
  };

  const deleteObjective = (id: string) => {
      updateMoetField('specificObjectives', (moetInfo.specificObjectives || []).filter(o => o.id !== id));
  };

  const toggleObjectiveSo = (objId: string, soId: string) => {
      const newObjs = (moetInfo.specificObjectives || []).map(o => {
          if (o.id !== objId) return o;
          const currentSos = o.soIds || [];
          return {
              ...o,
              soIds: currentSos.includes(soId) ? currentSos.filter(id => id !== soId) : [...currentSos, soId]
          };
      });
      updateMoetField('specificObjectives', newObjs);
  };

  const getObjectiveLabel = (id: string) => {
      const sortedObjectives = [...(moetInfo.specificObjectives || [])].sort((a, b) => {
          const idxA = CATEGORY_ORDER.indexOf(a.category!);
          const idxB = CATEGORY_ORDER.indexOf(b.category!);
          if (idxA !== idxB) return idxA - idxB;
          return 0;
      });
      const index = sortedObjectives.findIndex(o => o.id === id);
      if (index === -1) return '?';
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      if (index < letters.length) return letters[index];
      return letters[index % letters.length] + Math.floor(index / letters.length);
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Target size={18} className="text-emerald-600"/>{language === 'vi' ? '2. Mục tiêu & Chuẩn đầu ra' : '2. Objectives & Outcomes'}</h3></div>
        <div className="p-6 space-y-10">
            {/* 2.1 */}
            <RichNarrativeSection icon={<Target size={20} />} title={language === 'vi' ? '2.1 Mục tiêu chung' : '2.1 General Objectives'} value={moetInfo.generalObjectives[language]} onChange={v => updateMoetLangField('generalObjectives', v)} />
            
            {/* 2.2 */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Layout size={18} className="text-indigo-600"/>{language === 'vi' ? '2.2 Mục tiêu cụ thể (MOET PLO)' : '2.2 Specific Objectives (MOET PLO)'}</label>
                    <button onClick={addMoetSpecificObjective} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-2"><Plus size={14} /> {language === 'vi' ? 'Thêm' : 'Add'}</button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {(moetInfo.moetSpecificObjectives || []).map((obj, idx) => (
                      <div key={obj.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3"><div className="w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center font-black text-[10px]">{idx + 1}</div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'vi' ? 'Mục tiêu cụ thể' : 'Specific Objective'}</span></div>
                              <button onClick={() => deleteMoetSpecificObjective(obj.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                              <div className="lg:col-span-8"><textarea className="w-full min-h-[60px] p-3 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 transition-colors" value={obj.description[language]} onChange={e => updateMoetSpecificObjectiveDesc(obj.id, e.target.value)} placeholder="..." /></div>
                              <div className="lg:col-span-4 space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Link2 size={10}/> Linked PEOs</label><div className="flex flex-wrap gap-1">{peos.map(peo => (<button key={peo.id} onClick={() => toggleMoetSpecificObjectivePeo(obj.id, peo.id)} className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${obj.peoIds?.includes(peo.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300'}`}>{peo.code}</button>))}</div></div>
                          </div>
                      </div>
                  ))}
                </div>
            </div>

            {/* 2.3 */}
            <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><CheckSquare size={18} className="text-blue-600"/>{language === 'vi' ? '2.3 Chuẩn đầu ra (Learning Outcomes)' : '2.3 Learning Outcomes'}</label>
                </div>
                {CATEGORY_ORDER.map(cat => {
                    const meta = CATEGORY_META[cat];
                    const objs = (moetInfo.specificObjectives || []).filter(o => o.category === cat);
                    return (
                        <div key={cat} className="space-y-2">
                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${meta.color}`}>{meta.icon} {language === 'vi' ? meta.vi : meta.en}</span>
                                <button onClick={() => addObjective(cat)} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-500 hover:text-indigo-600 hover:border-indigo-200"><Plus size={12}/></button>
                            </div>
                            {objs.map(o => (
                                <div key={o.id} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col gap-3">
                                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                        <span className="text-xs font-bold text-slate-600">{getObjectiveLabel(o.id)}.</span>
                                        <button onClick={() => deleteObjective(o.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                        <div className="lg:col-span-8">
                                            <textarea 
                                                className="w-full p-3 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 resize-none min-h-[80px]" 
                                                value={o.description[language]} 
                                                onChange={e => updateObjectiveDesc(o.id, e.target.value)} 
                                                placeholder="..."
                                            />
                                        </div>
                                        <div className="lg:col-span-4">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-2">
                                                <Link2 size={10}/> Linked ABET SOs
                                            </label>
                                            <div className="flex flex-wrap gap-1">
                                                {sos.map(so => (
                                                    <button 
                                                        key={so.id} 
                                                        onClick={() => toggleObjectiveSo(o.id, so.id)} 
                                                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${o.soIds?.includes(so.id) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-300'}`}
                                                    >
                                                        {so.code}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    </section>
  );
};

export default MoetObjectives;
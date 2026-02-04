
import React, { useMemo } from 'react';
import { AppState, IRM, MoetCategory } from '../../types';
import { Check, Grid3X3, Info } from 'lucide-react';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const CATEGORY_ORDER: MoetCategory[] = ['knowledge', 'skills', 'learning'];

const MoetMatrix: React.FC<Props> = ({ state, updateState }) => {
  const { generalInfo, language, courses } = state;
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

  const sortedObjectives = useMemo(() => {
      const allObjs = moetInfo.specificObjectives || [];
      return [...allObjs].sort((a, b) => {
          const idxA = CATEGORY_ORDER.indexOf(a.category!);
          const idxB = CATEGORY_ORDER.indexOf(b.category!);
          if (idxA !== idxB) return idxA - idxB;
          return 0;
      });
  }, [moetInfo.specificObjectives]);

  const getObjectiveLabel = (id: string) => {
      const index = sortedObjectives.findIndex(o => o.id === id);
      if (index === -1) return '?';
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      if (index < letters.length) return letters[index];
      return letters[index % letters.length] + Math.floor(index / letters.length);
  };

  const toggleCourseObjective = (courseId: string, objectiveId: string) => {
      const currentMap = moetInfo.courseObjectiveMap || [];
      const key = `${courseId}|${objectiveId}`;
      let newMap: string[];
      if (currentMap.includes(key)) {
          newMap = currentMap.filter(k => k !== key);
      } else {
          newMap = [...currentMap, key];
      }
      updateMoetField('courseObjectiveMap', newMap);
  };

  const impliedCourseObjectiveLinks = useMemo(() => {
      const set = new Set<string>();
      (moetInfo.specificObjectives || []).forEach(obj => {
          (obj.soIds || []).forEach(soId => {
              (state.courseSoMap || []).filter(m => m.soId === soId && m.level !== IRM.NONE).forEach(m => {
                  set.add(`${m.courseId}|${obj.id}`);
              });
          });
      });
      return set;
  }, [moetInfo.specificObjectives, state.courseSoMap]);

  const syllabusImpliedLinks = useMemo(() => {
      const set = new Set<string>();
      courses.forEach(c => {
          c.cloMap?.forEach(m => {
              m.objectiveIds?.forEach(oid => set.add(`${c.id}|${oid}`));
          });
      });
      return set;
  }, [courses]);

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Grid3X3 size={18} className="text-emerald-600"/>{language === 'vi' ? '6. Ma trận Quan hệ CĐR & Học phần' : '6. Outcome-Course Matrix'}</h3>
            <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-600 rounded"></div> {language === 'vi' ? 'Đã chọn' : 'Selected'}</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-300 rounded"></div> {language === 'vi' ? 'Đề cương (CLO)' : 'Syllabus (CLO)'}</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-400 rounded"></div> {language === 'vi' ? 'Gợi ý (ABET SO)' : 'Implied (ABET SO)'}</div>
            </div>
        </div>
        <div className="overflow-auto custom-scrollbar flex-1">
            <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                    <tr>
                        <th className="p-3 border-b border-r border-slate-200 text-left bg-slate-50 min-w-[200px] sticky left-0 z-20">Course</th>
                        {sortedObjectives.map(obj => (
                            <th key={obj.id} className="p-2 border-b border-slate-200 text-center min-w-[40px] text-[10px] font-bold text-slate-600 bg-slate-50 group relative cursor-help">
                                {getObjectiveLabel(obj.id)}
                                <div className="absolute hidden group-hover:block z-50 bottom-full left-1/2 -translate-x-1/2 w-48 p-2 bg-slate-800 text-white rounded shadow-lg font-normal text-left">{obj.description[language]}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {courses.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50">
                            <td className="p-3 border-r border-slate-200 sticky left-0 bg-white z-10">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-700 text-xs">{c.code}</span>
                                    <span className="text-[10px] text-slate-500 font-normal line-clamp-2 leading-tight" title={c.name[language]}>{c.name[language]}</span>
                                </div>
                            </td>
                            {sortedObjectives.map(obj => {
                                const key = `${c.id}|${obj.id}`;
                                const isManual = (moetInfo.courseObjectiveMap || []).includes(key);
                                const isImplied = impliedCourseObjectiveLinks.has(key);
                                const isSyllabus = syllabusImpliedLinks.has(key);
                                
                                let bgClass = 'border border-slate-200';
                                let cellClass = '';

                                if (isManual) {
                                    bgClass = 'bg-indigo-600 text-white shadow-sm scale-110';
                                } else if (isSyllabus) {
                                    bgClass = 'bg-emerald-300 text-white shadow-sm';
                                    cellClass = 'bg-emerald-50/50';
                                } else if (isImplied) {
                                    bgClass = 'bg-amber-400 text-white shadow-sm';
                                    cellClass = 'bg-amber-50/50';
                                }

                                return (
                                    <td key={obj.id} className={`text-center cursor-pointer border-r border-slate-50 ${cellClass} group/cell relative`} onClick={() => toggleCourseObjective(c.id, obj.id)}>
                                        <div className={`w-4 h-4 mx-auto rounded flex items-center justify-center transition-all ${bgClass}`}>
                                            {(isManual || isImplied || isSyllabus) && <Check size={10}/>}
                                        </div>
                                        <div className="absolute hidden group-hover/cell:block z-30 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-white text-[10px] rounded shadow-sm whitespace-nowrap pointer-events-none">
                                            {getObjectiveLabel(obj.id)}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </section>
  );
};

export default MoetMatrix;

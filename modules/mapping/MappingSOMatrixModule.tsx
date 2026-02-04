
import React from 'react';
import { AppState, Course, SO, KnowledgeArea, IRM, Language } from '../../types';
import { Star } from 'lucide-react';

// Reusing HEX colors (ideally move to shared const but duplicating for simplicity as per refactor plan)
const AREA_HEX_COLORS: Record<string, string> = {
  'blue': '#3b82f6', 'indigo': '#6366f1', 'purple': '#a855f7', 'green': '#22c55e',
  'slate': '#64748b', 'red': '#ef4444', 'orange': '#f97316', 'yellow': '#eab308'
};

interface Props {
    filteredCourses: Course[];
    sos: SO[];
    language: Language;
    knowledgeAreas: KnowledgeArea[];
    soMappingLookup: Map<string, IRM>;
    updateState: (updater: (prev: AppState) => AppState) => void;
}

const MappingSOMatrixModule: React.FC<Props> = ({ filteredCourses, sos, language, knowledgeAreas, soMappingLookup, updateState }) => {
    
    const toggleMapping = (courseId: string, soId: string) => {
        updateState(prev => {
            const currentMap = prev.courseSoMap || [];
            const existing = currentMap.find(m => m.courseId === courseId && m.soId === soId);
            let newMap = [...currentMap];
            if (existing) {
                const nextLevel = existing.level === IRM.I ? IRM.R : (existing.level === IRM.R ? IRM.M : IRM.NONE);
                if (nextLevel === IRM.NONE) {
                    newMap = newMap.filter(m => !(m.courseId === courseId && m.soId === soId));
                } else {
                    newMap = newMap.map(m => (m.courseId === courseId && m.soId === soId) ? { ...m, level: nextLevel } : m);
                }
            } else {
                newMap.push({ courseId, soId, level: IRM.I });
            }
            return { ...prev, courseSoMap: newMap };
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden animate-in fade-in">
            <div className="overflow-auto custom-scrollbar flex-1 relative">
                <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-30 shadow-sm">
                        <tr>
                            <th className="sticky left-0 top-0 z-40 bg-white p-4 border-b border-r border-slate-200 text-left min-w-[250px] text-xs font-bold uppercase text-slate-500 shadow-sm">
                                <div className="flex items-center justify-between"><span>{language === 'vi' ? 'Môn học \\ SOs' : 'Course \\ SOs'}</span><span className="text-[10px] font-normal text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">{filteredCourses.length} items</span></div>
                            </th>
                            {sos.map(so => (
                                <th key={so.id} className="p-4 border-b border-slate-200 min-w-[60px] text-center bg-slate-50 group relative">
                                    <span className="font-black text-indigo-600 cursor-help">{so.code}</span>
                                    <div className="absolute hidden group-hover:block z-50 top-full left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-xl font-normal text-left normal-case mt-2">{so.description[language]}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredCourses.map(course => {
                            const hexColor = AREA_HEX_COLORS[knowledgeAreas.find(k => k.id === course.knowledgeAreaId)?.color || 'slate'];
                            return (
                                <tr key={course.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="sticky left-0 bg-white z-20 p-3 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: hexColor }}></div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2"><div className="font-bold text-slate-700 text-sm truncate cursor-help" title={`ID: ${course.id}`}>{course.code}</div>{course.isEssential && <Star size={10} className="text-amber-500 fill-amber-500" />}</div>
                                                <div className="text-[10px] text-slate-400 truncate max-w-[180px]" title={course.name[language]}>{course.name[language]}</div>
                                            </div>
                                        </div>
                                    </td>
                                    {sos.map(so => {
                                        const level = soMappingLookup.get(`${course.id}-${so.id}`) || '';
                                        let bgColor = 'bg-white', textColor = 'text-slate-300';
                                        if (level === IRM.I) { bgColor = 'bg-sky-100'; textColor = 'text-sky-700'; }
                                        else if (level === IRM.R) { bgColor = 'bg-indigo-100'; textColor = 'text-indigo-700'; }
                                        else if (level === IRM.M) { bgColor = 'bg-purple-100'; textColor = 'text-purple-700'; }
                                        return (
                                            <td key={so.id} onClick={() => toggleMapping(course.id, so.id)} className="p-1 text-center cursor-pointer select-none border-r border-slate-50 last:border-r-0">
                                                <div className={`w-8 h-8 mx-auto rounded flex items-center justify-center font-black text-xs transition-all ${bgColor} ${textColor} ${level ? 'shadow-sm scale-105' : 'border border-slate-100 hover:border-indigo-200'}`}>{level}</div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MappingSOMatrixModule;


import React from 'react';
import { AppState, Course, SO, KnowledgeArea, Language } from '../../types';
import { Star, Check } from 'lucide-react';

const AREA_HEX_COLORS: Record<string, string> = {
  'blue': '#3b82f6', 'indigo': '#6366f1', 'purple': '#a855f7', 'green': '#22c55e',
  'slate': '#64748b', 'red': '#ef4444', 'orange': '#f97316', 'yellow': '#eab308'
};

interface Props {
    filteredCourses: Course[];
    sos: SO[];
    language: Language;
    knowledgeAreas: KnowledgeArea[];
    piMappingLookup: Set<string>;
    courseMappedSoLookup: Map<string, Set<string>>;
    updateState: (updater: (prev: AppState) => AppState) => void;
}

const MappingPIMatrixModule: React.FC<Props> = ({ filteredCourses, sos, language, knowledgeAreas, piMappingLookup, courseMappedSoLookup, updateState }) => {
    
    const togglePiMapping = (courseId: string, piId: string) => {
        updateState(prev => {
            const currentMap = prev.coursePiMap || [];
            const exists = currentMap.find(m => m.courseId === courseId && m.piId === piId);
            const newMap = exists ? currentMap.filter(m => !(m.courseId === courseId && m.piId === piId)) : [...currentMap, { courseId, piId }];
            return { ...prev, coursePiMap: newMap };
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden animate-in fade-in">
            <div className="overflow-auto custom-scrollbar flex-1 relative">
                <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-30 shadow-sm">
                        <tr className="bg-slate-50">
                            <th rowSpan={2} className="sticky left-0 top-0 z-40 bg-white p-4 border-b border-r border-slate-200 text-left min-w-[250px] text-xs font-bold uppercase text-slate-500 shadow-sm">
                                <div className="flex items-center justify-between"><span>{language === 'vi' ? 'Môn học \\ PIs' : 'Course \\ PIs'}</span><span className="text-[10px] font-normal text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">{filteredCourses.length} items</span></div>
                            </th>
                            {sos.map(so => <th key={so.id} colSpan={(so.pis || []).length} className="p-2 border-b border-r border-slate-200 text-center text-xs font-bold text-indigo-600 uppercase bg-indigo-50/50">{so.code}</th>)}
                        </tr>
                        <tr className="bg-slate-50">
                            {sos.map(so => (so.pis || []).map(pi => (
                                <th key={pi.id} className="p-3 border-b border-slate-200 min-w-[50px] text-center text-[10px] font-bold text-slate-600 group relative cursor-help hover:bg-slate-100 transition-colors">
                                    {pi.code}
                                    <div className="absolute hidden group-hover:block z-50 top-full left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-xl font-normal text-left normal-case mt-2"><p className="font-bold mb-1 text-indigo-300">{so.code} - PI {pi.code}</p>{pi.description[language]}</div>
                                </th>
                            )))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredCourses.map(course => {
                            const courseMappedSOs = courseMappedSoLookup.get(course.id);
                            return (
                                <tr key={course.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="sticky left-0 bg-white z-20 p-3 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3"><div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: AREA_HEX_COLORS[knowledgeAreas.find(k => k.id === course.knowledgeAreaId)?.color || 'slate'] }}></div><div className="min-w-0"><div className="flex items-center gap-2"><div className="font-bold text-slate-700 text-sm truncate cursor-help" title={`ID: ${course.id}`}>{course.code}</div>{course.isEssential && <Star size={10} className="text-amber-500 fill-amber-500" />}</div><div className="text-[10px] text-slate-400 truncate max-w-[180px]" title={course.name[language]}>{course.name[language]}</div></div></div>
                                    </td>
                                    {sos.map(so => (so.pis || []).map(pi => {
                                        const isMapped = piMappingLookup.has(`${course.id}-${pi.id}`);
                                        const isSoMapped = courseMappedSOs ? courseMappedSOs.has(so.id) : false;
                                        return (
                                            <td key={pi.id} onClick={() => togglePiMapping(course.id, pi.id)} className={`p-1 text-center cursor-pointer select-none border-r border-slate-50 last:border-r-0 ${isSoMapped && !isMapped ? 'bg-amber-50/50 hover:bg-amber-100/50' : ''}`}>
                                                <div className={`w-6 h-6 mx-auto rounded flex items-center justify-center transition-all ${isMapped ? 'bg-emerald-500 text-white shadow-sm scale-110' : (isSoMapped ? 'bg-white border border-amber-200 text-amber-300' : 'bg-white border border-slate-100 text-slate-200 hover:border-emerald-200')}`}>{isMapped && <Check size={14} strokeWidth={3} />}</div>
                                            </td>
                                        );
                                    }))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MappingPIMatrixModule;

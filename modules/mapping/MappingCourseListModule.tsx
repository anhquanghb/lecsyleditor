
import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { AppState, Course, Language, MoetSubBlock } from '../../types';
import { TRANSLATIONS } from '../../constants';
import { Plus, Trash2, Globe, FileSpreadsheet, Download, Check, Search, Star, Circle, Layers, BoxSelect, X, Save, GripVertical } from 'lucide-react';
import { translateCourses } from '../../services/geminiService';

interface Props {
    state: AppState;
    filteredCourses: Course[];
    updateState: (updater: (prev: AppState) => AppState) => void;
    onEditCourse: (id: string, field: keyof Course, value: any) => void;
    onDeleteCourse: (id: string) => void;
    onRefresh: (cb: () => void) => void;
    isTranslating: boolean;
    setIsTranslating: (val: boolean) => void;
}

// Local helper component
const RelationSelector = memo(({ 
    course, type, allCourses, value, onChange, isActive, onToggle, onClose, language
}: {
    course: Course, type: 'prereq' | 'coreq', allCourses: Course[], value: string[],
    onChange: (val: string[]) => void, isActive: boolean, onToggle: () => void, onClose: () => void, language: Language
}) => {
    const [search, setSearch] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const candidates = useMemo(() => allCourses.filter((c: Course) => {
        if (c.id === course.id) return false;
        if (type === 'prereq') return c.semester < course.semester;
        if (type === 'coreq') return c.semester === course.semester;
        return false;
    }).filter((c: Course) => {
        const searchText = search.toLowerCase();
        return (c.code || '').toLowerCase().includes(searchText) || (c.name[language] || '').toLowerCase().includes(searchText);
    }), [allCourses, course, type, search, language]);

    useEffect(() => { if (isActive && inputRef.current) inputRef.current.focus(); }, [isActive]);

    return (
        <div className="relative w-full">
            <div onClick={onToggle} className="min-h-[32px] p-1.5 border-b border-transparent hover:border-indigo-300 cursor-pointer flex flex-wrap gap-1 transition-all text-xs items-center group">
                {value.length === 0 && <span className="text-slate-300 italic opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"><Plus size={10}/> Select</span>}
                {value.map((code: string) => (
                    <span key={code} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-bold text-[10px] flex items-center gap-1">{code}</span>
                ))}
            </div>
            {isActive && (
                <>
                    <div className="fixed inset-0 z-40 cursor-default" onClick={onClose}></div>
                    <div className="absolute top-full left-0 w-72 bg-white border border-slate-200 shadow-xl rounded-lg z-50 p-2 mt-1 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-100">
                        <div className="relative">
                             <Search size={12} className="absolute left-2 top-2 text-slate-400"/>
                             <input ref={inputRef} className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                            {candidates.map((c: Course) => {
                                const isSelected = value.includes(c.code);
                                return (
                                    <div key={c.id} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'}`} onClick={() => { const newValue = isSelected ? value.filter((v: string) => v !== c.code) : [...value, c.code]; onChange(newValue); }}>
                                        <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>{isSelected && <Check size={10} className="text-white" />}</div>
                                        <span className="font-bold w-16 shrink-0">{c.code}</span>
                                        <span className="truncate flex-1 opacity-75">{c.name[language]}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
});

const MappingCourseListModule: React.FC<Props> = ({ state, filteredCourses, updateState, onEditCourse, onDeleteCourse, onRefresh, isTranslating, setIsTranslating }) => {
    const { courses, language, knowledgeAreas, generalInfo, geminiConfig } = state;
    const t = TRANSLATIONS[language];
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeRel, setActiveRel] = useState<{ id: string, type: 'prereq' | 'coreq' } | null>(null);

    // Elective Logic State
    const [electiveModalData, setElectiveModalData] = useState<{ courseId: string; newType: 'SELECTED_ELECTIVE' | 'ELECTIVE'; } | null>(null);
    const [newBlockName, setNewBlockName] = useState({ vi: 'Khối tự chọn mới', en: 'New Elective Block' });
    const [newBlockParent, setNewBlockParent] = useState<'gen' | 'fund' | 'spec'>('spec');

    // Block Editing State
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const [tempBlockName, setTempBlockName] = useState('');
    const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

    // Organize Catalog logic
    const organizedCatalog = useMemo(() => {
        const subBlocks = generalInfo.moetInfo.subBlocks || [];
        const blockMap = new Map<string, string>();
        subBlocks.forEach(sb => sb.courseIds.forEach(id => blockMap.set(id, sb.id)));
        
        const standaloneCourses = filteredCourses.filter(c => !blockMap.has(c.id));
        const blockGroups = subBlocks.map(sb => {
            const innerCourses = courses.filter(c => sb.courseIds.includes(c.id));
            const visibleInnerCourses = innerCourses.filter(c => filteredCourses.some(fc => fc.id === c.id));
            return { block: sb, courses: visibleInnerCourses };
        }).filter(group => group.courses.length > 0);

        // Sorting blocks: Respect order in subBlocks array instead of semester
        // This enables manual drag-and-drop reordering
        // The subBlocks array order IS the order.
        
        return { standaloneCourses, blockGroups };
    }, [filteredCourses, generalInfo.moetInfo.subBlocks, courses]);

    // Handlers
    const handleCourseTypeChange = (courseId: string, newType: string) => {
        const course = courses.find(c => c.id === courseId);
        if (!course) return;
        if (newType === 'REQUIRED') {
            updateState(prev => {
                const nextCourses = prev.courses.map(c => c.id === courseId ? { ...c, type: 'REQUIRED' as const } : c);
                const nextSubBlocks = (prev.generalInfo.moetInfo.subBlocks || []).map(sb => ({ ...sb, courseIds: sb.courseIds.filter(id => id !== courseId) }));
                let parentBlockId: 'gen' | 'fund' | 'spec' = 'spec';
                if (course.knowledgeAreaId === 'gen_ed') parentBlockId = 'gen';
                else if (course.knowledgeAreaId === 'fund_eng' || course.knowledgeAreaId === 'math_sci') parentBlockId = 'fund';
                const currentList = prev.generalInfo.moetInfo.programStructure[parentBlockId] || [];
                const nextList = currentList.includes(courseId) ? currentList : [...currentList, courseId];
                return { ...prev, courses: nextCourses, generalInfo: { ...prev.generalInfo, moetInfo: { ...prev.generalInfo.moetInfo, subBlocks: nextSubBlocks, programStructure: { ...prev.generalInfo.moetInfo.programStructure, [parentBlockId]: nextList } } } };
            });
        } else {
            setElectiveModalData({ courseId, newType: newType as any });
            setNewBlockName({ vi: 'Khối tự chọn mới', en: 'New Elective Block' });
            if (course.knowledgeAreaId === 'gen_ed') setNewBlockParent('gen');
            else if (course.knowledgeAreaId === 'fund_eng' || course.knowledgeAreaId === 'math_sci') setNewBlockParent('fund');
            else setNewBlockParent('spec');
        }
    };

    const confirmAddToBlock = (blockId: string) => {
        if (!electiveModalData) return;
        const { courseId, newType } = electiveModalData;
        updateState(prev => {
            const nextCourses = prev.courses.map(c => c.id === courseId ? { ...c, type: newType } : c);
            const nextSubBlocks = (prev.generalInfo.moetInfo.subBlocks || []).map(sb => {
                const cleanIds = sb.courseIds.filter(id => id !== courseId);
                return sb.id === blockId ? { ...sb, courseIds: [...cleanIds, courseId] } : { ...sb, courseIds: cleanIds };
            });
            const cleanStructure = { ...prev.generalInfo.moetInfo.programStructure };
            (Object.keys(cleanStructure) as Array<keyof typeof cleanStructure>).forEach(key => { cleanStructure[key] = cleanStructure[key].filter(id => id !== courseId); });
            return { ...prev, courses: nextCourses, generalInfo: { ...prev.generalInfo, moetInfo: { ...prev.generalInfo.moetInfo, subBlocks: nextSubBlocks, programStructure: cleanStructure } } };
        });
        setElectiveModalData(null);
    };

    const createAndAddToBlock = () => {
        if (!electiveModalData) return;
        const { courseId, newType } = electiveModalData;
        const newBlock: MoetSubBlock = {
            id: `sb-${Date.now()}`, name: newBlockName, parentBlockId: newBlockParent, minCredits: 3, courseIds: [courseId], note: { vi: '', en: '' }
        };
        updateState(prev => {
            const nextCourses = prev.courses.map(c => c.id === courseId ? { ...c, type: newType } : c);
            const cleanedSubBlocks = (prev.generalInfo.moetInfo.subBlocks || []).map(sb => ({ ...sb, courseIds: sb.courseIds.filter(id => id !== courseId) }));
            const cleanStructure = { ...prev.generalInfo.moetInfo.programStructure };
            (Object.keys(cleanStructure) as Array<keyof typeof cleanStructure>).forEach(key => { cleanStructure[key] = cleanStructure[key].filter(id => id !== courseId); });
            return { ...prev, courses: nextCourses, generalInfo: { ...prev.generalInfo, moetInfo: { ...prev.generalInfo.moetInfo, subBlocks: [...cleanedSubBlocks, newBlock], programStructure: cleanStructure } } };
        });
        setElectiveModalData(null);
    };

    const updateSubBlockMinCredits = (blockId: string, credits: number) => {
        updateState(prev => ({
            ...prev, generalInfo: { ...prev.generalInfo, moetInfo: { ...prev.generalInfo.moetInfo, subBlocks: (prev.generalInfo.moetInfo.subBlocks || []).map(sb => sb.id === blockId ? { ...sb, minCredits: credits } : sb) } }
        }));
    };

    const updateSubBlockSemester = (blockId: string, semester: number) => {
        updateState(prev => ({
            ...prev, generalInfo: { ...prev.generalInfo, moetInfo: { ...prev.generalInfo.moetInfo, subBlocks: (prev.generalInfo.moetInfo.subBlocks || []).map(sb => sb.id === blockId ? { ...sb, preferredSemester: semester } : sb) } }
        }));
    };

    const updateCourseName = (id: string, lang: Language, val: string) => {
        updateState(prev => ({ ...prev, courses: prev.courses.map(c => c.id === id ? { ...c, name: { ...c.name, [lang]: val } } : c) }));
    };

    const handleAutoTranslateCatalog = async () => {
        setIsTranslating(true);
        try {
            const targetLang = language === 'vi' ? 'en' : 'vi';
            const coursesToTranslate = courses.filter(c => !c.name[targetLang]);
            if (coursesToTranslate.length === 0) return;
            const translatedPairs = await translateCourses(coursesToTranslate, targetLang, geminiConfig);
            updateState(prev => ({
                ...prev, courses: prev.courses.map(c => {
                    const translation = translatedPairs.find(p => p.id === c.id);
                    return translation ? { ...c, name: { ...c.name, [targetLang]: translation.name } } : c;
                })
            }));
        } catch (error) { console.error(error); alert("Translation failed."); } finally { setIsTranslating(false); }
    };

    const handleImportCatalog = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            const lines = text.split('\n');
            const newCourses: Course[] = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.trim().replace(/^"|"$/g, ''));
                if (cols.length < 5) continue;
                const [id, code, nameVi, nameEn, credits, semester] = cols;
                // Basic parse logic (simplified for brevity, matching previous module)
                newCourses.push({
                    id: id || `CID-${Date.now()}-${i}`, code: code || 'NEW', name: { vi: nameVi || '', en: nameEn || '' },
                    credits: parseInt(credits) || 0, semester: parseInt(semester) || 1, type: 'REQUIRED',
                    prerequisites: [], coRequisites: [], isEssential: false, isAbet: false, knowledgeAreaId: 'other',
                    colIndex: 0, description: { vi: '', en: '' }, textbooks: [], clos: { vi: [], en: [] }, topics: [], assessmentPlan: [], instructorIds: [], instructorDetails: {}, cloMap: []
                });
            }
            if (newCourses.length > 0 && confirm(`Found ${newCourses.length} courses. Import?`)) {
                onRefresh(() => updateState(prev => ({ ...prev, courses: [...prev.courses, ...newCourses] })));
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleExportCatalog = () => {
        const headers = ['ID', 'Code', 'Name_VI', 'Name_EN', 'Credits', 'Semester', 'Type', 'Prerequisites', 'Co-requisite', 'Essential', 'ABET', 'AreaID'];
        const rows = courses.map(c => [c.id, c.code, `"${c.name.vi}"`, `"${c.name.en}"`, c.credits, c.semester, c.type, `"${c.prerequisites.join(', ')}"`, `"${c.coRequisites.join(', ')}"`, c.isEssential ? 1 : 0, c.isAbet ? 1 : 0, c.knowledgeAreaId]);
        const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
        link.download = `Course_Catalog_${language}.csv`;
        link.click();
    };

    // --- Block Renaming Logic ---
    const startEditingBlock = (block: MoetSubBlock) => {
        setEditingBlockId(block.id);
        setTempBlockName(block.name[language]);
    };

    const saveBlockName = () => {
        if (!editingBlockId) return;
        updateState(prev => ({
            ...prev,
            generalInfo: {
                ...prev.generalInfo,
                moetInfo: {
                    ...prev.generalInfo.moetInfo,
                    subBlocks: (prev.generalInfo.moetInfo.subBlocks || []).map(sb => 
                        sb.id === editingBlockId 
                            ? { ...sb, name: { ...sb.name, [language]: tempBlockName } } 
                            : sb
                    )
                }
            }
        }));
        setEditingBlockId(null);
    };

    // --- Block Drag & Drop Logic ---
    const handleBlockDragStart = (e: React.DragEvent, id: string) => {
        setDraggedBlockId(id);
        e.dataTransfer.effectAllowed = "move";
        // Ghost image hack if needed, otherwise browser default is fine
    };

    const handleBlockDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedBlockId || draggedBlockId === targetId) return;

        updateState(prev => {
            const subBlocks = [...(prev.generalInfo.moetInfo.subBlocks || [])];
            const sourceIndex = subBlocks.findIndex(sb => sb.id === draggedBlockId);
            const targetIndex = subBlocks.findIndex(sb => sb.id === targetId);

            if (sourceIndex === -1 || targetIndex === -1) return prev;

            const [movedBlock] = subBlocks.splice(sourceIndex, 1);
            subBlocks.splice(targetIndex, 0, movedBlock);

            return {
                ...prev,
                generalInfo: {
                    ...prev.generalInfo,
                    moetInfo: {
                        ...prev.generalInfo.moetInfo,
                        subBlocks
                    }
                }
            };
        });
        setDraggedBlockId(null);
    };

    const renderRow = (course: Course, isInner: boolean) => (
        <tr key={course.id} className={`hover:bg-slate-50 transition-colors group ${isInner ? 'bg-slate-50/30' : ''}`}>
            <td className={`px-6 py-3 ${isInner ? 'pl-10' : ''}`}>
                <input className={`font-mono font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full ${isInner ? 'text-xs text-slate-500 italic' : 'text-indigo-600'}`} value={course.code} onChange={(e) => onEditCourse(course.id, 'code', e.target.value)} />
            </td>
            <td className="px-6 py-3">
                <input className={`font-medium bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full ${isInner ? 'text-xs text-slate-500 italic pl-2' : 'text-slate-700'}`} value={course.name[language]} onChange={(e) => updateCourseName(course.id, language, e.target.value)} />
            </td>
            <td className="px-6 py-3 text-center">
                <input type="number" className={`w-12 text-center px-2 py-1 rounded text-sm font-bold border-transparent focus:border-indigo-500 outline-none ${isInner ? 'bg-slate-100/50 text-slate-500' : 'bg-slate-100'}`} value={course.credits} onChange={(e) => onEditCourse(course.id, 'credits', parseInt(e.target.value) || 0)} />
            </td>
            <td className="px-6 py-3 text-center">
                <input type="number" className={`w-12 text-center px-2 py-1 rounded text-sm font-bold border-transparent focus:border-indigo-500 outline-none ${isInner ? 'bg-slate-100/50 text-slate-500' : 'bg-slate-100'}`} value={course.semester} onChange={(e) => onEditCourse(course.id, 'semester', parseInt(e.target.value) || 1)} />
            </td>
            <td className="px-6 py-3">
                <select className={`bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none text-xs font-bold w-full cursor-pointer ${isInner ? 'text-slate-400 italic' : 'text-slate-700'}`} value={course.type} onChange={(e) => handleCourseTypeChange(course.id, e.target.value)}>
                    <option value="REQUIRED">{language === 'vi' ? 'Bắt buộc' : 'Required'}</option>
                    <option value="SELECTED_ELECTIVE">{language === 'vi' ? 'TC Định hướng' : 'Selected Elective'}</option>
                    <option value="ELECTIVE">{language === 'vi' ? 'Tự chọn' : 'Free Elective'}</option>
                </select>
            </td>
            <td className="px-6 py-3">
                <RelationSelector course={course} type="prereq" allCourses={courses} value={course.prerequisites} onChange={val => onEditCourse(course.id, 'prerequisites', val)} isActive={activeRel?.id === course.id && activeRel?.type === 'prereq'} onToggle={() => setActiveRel(activeRel?.id === course.id && activeRel?.type === 'prereq' ? null : { id: course.id, type: 'prereq' })} onClose={() => setActiveRel(null)} language={language} />
            </td>
            <td className="px-6 py-3">
                <RelationSelector course={course} type="coreq" allCourses={courses} value={course.coRequisites} onChange={val => onEditCourse(course.id, 'coRequisites', val)} isActive={activeRel?.id === course.id && activeRel?.type === 'coreq'} onToggle={() => setActiveRel(activeRel?.id === course.id && activeRel?.type === 'coreq' ? null : { id: course.id, type: 'coreq' })} onClose={() => setActiveRel(null)} language={language} />
            </td>
            <td className="px-6 py-3 text-center">
                <button onClick={() => onEditCourse(course.id, 'isEssential', !course.isEssential)} className={`transition-colors ${course.isEssential ? 'text-amber-500 hover:text-amber-600' : 'text-slate-200 hover:text-amber-300'}`}><Star size={18} fill={course.isEssential ? "currentColor" : "none"} /></button>
            </td>
            <td className="px-6 py-3 text-center">
                <button onClick={() => onEditCourse(course.id, 'isAbet', !course.isAbet)} className={`transition-transform hover:scale-110`}><Circle size={18} color={course.isAbet ? "#ff6c2c" : "#cbd5e1"} fill={course.isAbet ? "#ff6c2c" : "none"} strokeWidth={2} /></button>
            </td>
            <td className="px-6 py-3">
                <select className={`text-xs px-2 py-1.5 rounded border-transparent focus:ring-2 focus:ring-indigo-500 outline-none w-full font-bold cursor-pointer ${isInner ? 'bg-slate-100 text-slate-500 italic' : 'bg-indigo-50 text-indigo-700'}`} value={course.knowledgeAreaId} onChange={(e) => onEditCourse(course.id, 'knowledgeAreaId', e.target.value)}>
                    {knowledgeAreas.map(k => <option key={k.id} value={k.id}>{k.name[language]}</option>)}
                </select>
            </td>
            <td className="px-6 py-3 text-center space-x-3"><button onClick={() => onDeleteCourse(course.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button></td>
        </tr>
    );

    return (
        <div className="flex flex-col h-full">
            {electiveModalData && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><BoxSelect size={18} className="text-indigo-600"/>{language === 'vi' ? 'Chọn Khối tự chọn' : 'Select Elective Block'}</h3>
                            <button onClick={() => setElectiveModalData(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{language === 'vi' ? 'Thêm vào khối có sẵn' : 'Add to Existing Block'}</label>
                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                    {(generalInfo.moetInfo.subBlocks || []).map(sb => (
                                        <button key={sb.id} onClick={() => confirmAddToBlock(sb.id)} className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-sm font-medium flex justify-between items-center group">
                                            <span>{sb.name[language]}</span><span className="text-[10px] text-slate-400 bg-white px-2 py-1 rounded border border-slate-100 group-hover:border-indigo-200">{sb.minCredits} cr</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-3 block flex items-center gap-2"><Plus size={12}/> {language === 'vi' ? 'Tạo khối mới' : 'Create New Block'}</label>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <input className="w-full p-2 border border-slate-200 rounded text-sm outline-none" placeholder="Tên Tiếng Việt" value={newBlockName.vi} onChange={e => setNewBlockName({ ...newBlockName, vi: e.target.value })} />
                                        <input className="w-full p-2 border border-slate-200 rounded text-sm outline-none" placeholder="English Name" value={newBlockName.en} onChange={e => setNewBlockName({ ...newBlockName, en: e.target.value })} />
                                    </div>
                                    <select className="w-full p-2 border border-slate-200 rounded text-sm outline-none" value={newBlockParent} onChange={e => setNewBlockParent(e.target.value as any)}>
                                        <option value="spec">Specialized</option><option value="fund">Fundamental</option><option value="gen">General</option>
                                    </select>
                                    <button onClick={createAndAddToBlock} disabled={!newBlockName.vi} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm flex justify-center items-center gap-2"><Plus size={14}/> {language === 'vi' ? 'Tạo và Thêm' : 'Create & Add'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-2 animate-in fade-in slide-in-from-top-2 mb-2">
                <button onClick={handleAutoTranslateCatalog} disabled={isTranslating} className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 transition shadow-sm disabled:opacity-50">
                    <Globe size={12} className={isTranslating ? "animate-spin" : ""} /> {isTranslating ? (language === 'vi' ? 'Đang dịch...' : 'Translating...') : (language === 'vi' ? 'Dịch tự động' : 'Auto Translate')}
                </button>
                <div className="h-6 w-px bg-slate-300 mx-1"></div>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCatalog} />
                <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-emerald-100 transition shadow-sm"><FileSpreadsheet size={12} /> Import</button>
                <button onClick={handleExportCatalog} className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-slate-200 transition shadow-sm"><Download size={12} /> Export</button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
                <div className="overflow-auto custom-scrollbar flex-1 relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-30 bg-slate-50 border-b border-slate-200 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-32">Code</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Name ({language.toUpperCase()})</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center w-24">{t.credits}</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center w-24">{t.semester}</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-40">{language === 'vi' ? 'Loại' : 'Type'}</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-48">{t.prerequisites}</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-48">{t.coRequisites}</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center w-24">{t.essential}</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center w-24">ABET</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-48">{t.knowledgeArea}</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {organizedCatalog.standaloneCourses.map(c => renderRow(c, false))}
                            {organizedCatalog.blockGroups.map(group => {
                                const totalBlockCredits = group.courses.reduce((sum, c) => sum + c.credits, 0);
                                const isCompulsory = group.block.type === 'COMPULSORY';
                                
                                return (
                                <React.Fragment key={group.block.id}>
                                    <tr 
                                        draggable
                                        onDragStart={(e) => handleBlockDragStart(e, group.block.id)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => handleBlockDrop(e, group.block.id)}
                                        className="bg-indigo-50/60 border-b border-indigo-100 cursor-move group/blockheader hover:bg-indigo-100/50"
                                    >
                                        <td className="px-6 py-3 flex items-center justify-center text-indigo-400 cursor-grab active:cursor-grabbing">
                                            <GripVertical size={18} className="opacity-50 group-hover/blockheader:opacity-100"/>
                                        </td>
                                        <td className="px-6 py-3">
                                            {editingBlockId === group.block.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        className="font-bold text-indigo-800 text-sm bg-white border border-indigo-300 rounded px-2 py-1 outline-none w-full shadow-sm"
                                                        value={tempBlockName}
                                                        onChange={(e) => setTempBlockName(e.target.value)}
                                                        onKeyDown={(e) => { if(e.key === 'Enter') saveBlockName(); }}
                                                        autoFocus
                                                        onBlur={saveBlockName}
                                                    />
                                                </div>
                                            ) : (
                                                <div 
                                                    className="font-bold text-indigo-800 text-sm cursor-text hover:underline decoration-indigo-300 decoration-dashed underline-offset-4"
                                                    onDoubleClick={() => startEditingBlock(group.block)}
                                                    title="Double click to rename"
                                                >
                                                    {group.block.name[language]}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            {isCompulsory ? (
                                                <div className="flex items-center justify-center gap-1 bg-white px-2 py-1.5 rounded-lg border border-indigo-100 shadow-sm w-fit mx-auto">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase select-none">Total</span>
                                                    <span className="text-xs font-bold text-indigo-700">{totalBlockCredits}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="flex items-center justify-center gap-1 bg-white px-2 py-1.5 rounded-lg border border-indigo-100 shadow-sm">
                                                        <span className="text-[10px] font-bold text-indigo-400 uppercase select-none">Min</span>
                                                        <input type="number" className="w-10 text-center text-xs font-bold text-indigo-700 outline-none bg-transparent" value={group.block.minCredits} onChange={(e) => updateSubBlockMinCredits(group.block.id, parseInt(e.target.value) || 0)} />
                                                    </div>                                                    
                                                </div>
                                            )}
                                        </td>
                                        <td colSpan={1} className="px-6 py-3 text-center">
                                            {isCompulsory ? (
                                                <div className="flex items-center justify-center gap-2">--</div>
                                            ):(
                                                <div className="flex items-center justify-center gap-1 bg-white px-2 py-1.5 rounded-lg border border-indigo-100 shadow-sm">
                                                    <span className="text-[10px] font-bold text-indigo-400 uppercase select-none">Sem</span>
                                                    <input type="number" className="w-10 text-center text-xs font-bold text-indigo-700 outline-none bg-transparent" placeholder="-" value={group.block.preferredSemester || ''} onChange={(e) => updateSubBlockSemester(group.block.id, parseInt(e.target.value) || 0)} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isCompulsory ? 'text-slate-600' : 'text-indigo-600'}`}>
                                                {isCompulsory 
                                                    ? (language === 'vi' ? 'Khối Bắt buộc' : 'Compulsory Block')
                                                    : (language === 'vi' ? 'Khối Tự chọn' : 'Elective Block')
                                                }
                                            </span>
                                        </td>
                                        <td colSpan={6} className="px-6 py-3"></td>
                                    </tr>
                                    {group.courses.map(c => renderRow(c, true))}
                                </React.Fragment>
                            )})}
                            {filteredCourses.length === 0 && <tr><td colSpan={11} className="text-center py-10 text-slate-400 italic">No courses found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MappingCourseListModule;

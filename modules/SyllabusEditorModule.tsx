
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AppState, Course, CourseTopic, AssessmentItem, LibraryResource, CloMapping, CoverageLevel, SO, Faculty, AssessmentMethod } from '../types';
import { TRANSLATIONS } from '../constants';
import { 
  Search, BookOpen, FileText, Upload, Sparkles, Plus, Trash2, 
  Download, Info, Check, Library, 
  Clock, Settings2, Star, FileJson, FileType,
  ChevronDown, Target, CheckSquare, Square, X, Percent, Bot,
  Layers, AlertCircle, Hash
} from 'lucide-react';
import { translateSyllabus } from '../services/geminiService';
import { downloadSingleSyllabus } from '../services/MoetSyllabus';
import AILoader from '../components/AILoader';
import SyllabusConfigModule from './SyllabusConfigModule';

interface EditorProps {
    course: Course;
    state: AppState;
    updateState: (updater: (prev: AppState) => AppState) => void;
}

// --- Helper Component: Hierarchical SO/PI Selector ---
const SoPiSelector = ({ 
    sos, 
    selectedSoIds, 
    selectedPiIds, 
    onUpdate, 
    globalMappedSoIds, 
    globalMappedPiIds, 
    language 
}: { 
    sos: SO[], 
    selectedSoIds: string[], 
    selectedPiIds: string[], 
    onUpdate: (soIds: string[], piIds: string[]) => void,
    globalMappedSoIds: Set<string>,
    globalMappedPiIds: Set<string>,
    language: 'vi' | 'en'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleSo = (soId: string) => {
        const newSoIds = selectedSoIds.includes(soId) 
            ? selectedSoIds.filter(id => id !== soId)
            : [...selectedSoIds, soId];
        onUpdate(newSoIds, selectedPiIds);
    };

    const togglePi = (piId: string) => {
        const newPiIds = selectedPiIds.includes(piId)
            ? selectedPiIds.filter(id => id !== piId)
            : [...selectedPiIds, piId];
        onUpdate(selectedSoIds, newPiIds);
    };

    const displayBadges = selectedSoIds.map(sid => {
        const so = sos.find(s => s.id === sid);
        if (!so) return null;
        const myPis = (so.pis || []).filter(p => selectedPiIds.includes(p.id));
        return {
            code: so.code.replace('SO-', ''),
            piCodes: myPis.map(p => p.code)
        };
    }).filter(Boolean);

    return (
        <div className="relative" ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)} 
                className="min-h-[32px] p-1 border border-slate-200 rounded-lg bg-white hover:border-indigo-300 cursor-pointer flex flex-wrap gap-1 items-center transition-all shadow-sm"
            >
                {displayBadges.length === 0 && <span className="text-[10px] text-slate-300 px-2 italic flex items-center gap-1"><Plus size={10}/> Select</span>}
                
                {displayBadges.map((item: any, idx) => (
                    <div key={idx} className="flex items-center bg-indigo-50 border border-indigo-100 rounded overflow-hidden">
                        <span className="px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">{item.code}</span>
                        {item.piCodes.length > 0 && (
                            <span className="px-1.5 py-0.5 text-[9px] bg-white text-slate-500 border-l border-indigo-100 flex gap-0.5">
                                {item.piCodes.map((pc: string) => <span key={pc}>{pc}</span>)}
                            </span>
                        )}
                    </div>
                ))}
                
                <div className="ml-auto pr-1 text-slate-300">
                    <ChevronDown size={12} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 z-50 w-72 bg-white border border-slate-200 shadow-xl rounded-xl mt-2 p-1 max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                    {sos.map(so => {
                        const isSoSelected = selectedSoIds.includes(so.id);
                        const isGlobalSo = globalMappedSoIds.has(so.id);
                        const hasPis = so.pis && so.pis.length > 0;

                        return (
                            <div key={so.id} className="mb-1 last:mb-0">
                                <div className={`flex items-center p-2 rounded-lg transition-colors group ${isSoSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'} ${isGlobalSo ? 'border border-amber-200 bg-amber-50/30' : ''}`}>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleSo(so.id); }}
                                        className={`mr-2 transition-colors ${isSoSelected ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-400'}`}
                                    >
                                        {isSoSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                    </button>
                                    
                                    <div className="flex-1 cursor-default">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-bold ${isSoSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                {so.code}
                                            </span>
                                            {isGlobalSo && (
                                                <span className="text-[9px] text-amber-600 bg-amber-100 px-1.5 rounded flex items-center gap-1" title="Required by Curriculum Matrix">
                                                    <Target size={8} /> Matrix
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[9px] text-slate-400 line-clamp-1 leading-tight mt-0.5" title={so.description[language]}>
                                            {so.description[language]}
                                        </div>
                                    </div>
                                </div>

                                {hasPis && isSoSelected && (
                                    <div className="ml-4 pl-3 border-l-2 border-slate-100 mt-1 space-y-1">
                                        {so.pis.map(pi => {
                                            const isPiSelected = selectedPiIds.includes(pi.id);
                                            const isGlobalPi = globalMappedPiIds.has(pi.id);
                                            return (
                                                <div 
                                                    key={pi.id} 
                                                    onClick={() => togglePi(pi.id)}
                                                    className={`flex items-center p-1.5 rounded cursor-pointer transition-colors ${isPiSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'} ${isGlobalPi ? 'ring-1 ring-amber-100' : ''}`}
                                                >
                                                    <div className={`mr-2 ${isPiSelected ? 'text-indigo-500' : 'text-slate-300'}`}>
                                                        {isPiSelected ? <CheckSquare size={12} /> : <Square size={12} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold text-slate-600">{pi.code}</span>
                                                            {isGlobalPi && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Matrix Requirement"></div>}
                                                        </div>
                                                        <div className="text-[9px] text-slate-400 line-clamp-1">{pi.description[language]}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// --- Helper Component: MOET Objective Selector ---
const ObjectiveSelector = ({
    objectives,
    selectedIds,
    highlightedIds,
    onUpdate,
    language
}: {
    objectives: { id: string, label: string, description: string }[],
    selectedIds: string[],
    highlightedIds: Set<string>,
    onUpdate: (ids: string[]) => void,
    language: 'vi' | 'en'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleObj = (id: string) => {
        const newIds = selectedIds.includes(id) 
            ? selectedIds.filter(x => x !== id)
            : [...selectedIds, id];
        onUpdate(newIds);
    };

    const displayBadges = selectedIds.map(sid => {
        const obj = objectives.find(o => o.id === sid);
        return obj ? obj.label : null;
    }).filter(Boolean);

    return (
        <div className="relative" ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)} 
                className="min-h-[32px] p-1 border border-slate-200 rounded-lg bg-white hover:border-emerald-300 cursor-pointer flex flex-wrap gap-1 items-center transition-all shadow-sm"
            >
                {displayBadges.length === 0 && <span className="text-[10px] text-slate-300 px-2 italic flex items-center gap-1"><Plus size={10}/> Select</span>}
                
                {displayBadges.map((label: any, idx) => (
                    <div key={idx} className="flex items-center bg-emerald-50 border border-emerald-100 rounded overflow-hidden">
                        <span className="px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">{label}</span>
                    </div>
                ))}
                
                <div className="ml-auto pr-1 text-slate-300">
                    <ChevronDown size={12} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-full right-0 z-50 w-72 bg-white border border-slate-200 shadow-xl rounded-xl mt-2 p-1 max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                    {objectives.map(obj => {
                        const isSelected = selectedIds.includes(obj.id);
                        const isGlobal = highlightedIds.has(obj.id);

                        return (
                            <div key={obj.id} className="mb-1 last:mb-0">
                                <div 
                                    className={`flex items-center p-2 rounded-lg transition-colors cursor-pointer group ${isSelected ? 'bg-emerald-50' : 'hover:bg-slate-50'} ${isGlobal ? 'border border-amber-200 bg-amber-50/30' : ''}`}
                                    onClick={() => toggleObj(obj.id)}
                                >
                                    <div className={`mr-2 transition-colors ${isSelected ? 'text-emerald-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                    </div>
                                    
                                    <div className="flex-1 cursor-default">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-bold ${isSelected ? 'text-emerald-700' : 'text-slate-700'}`}>
                                                {obj.label}
                                            </span>
                                            {isGlobal && (
                                                <span className="text-[9px] text-amber-600 bg-amber-100 px-1.5 rounded flex items-center gap-1" title="Connected in MOET Matrix">
                                                    <Target size={8} /> Matrix
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[9px] text-slate-400 line-clamp-2 leading-tight mt-0.5">
                                            {obj.description}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const SyllabusEditorModule: React.FC<EditorProps> = ({ course, state, updateState }) => {
    const { language, geminiConfig, library, teachingMethods, assessmentMethods, faculties, sos, courseSoMap, coursePiMap, generalInfo, departments, academicFaculties, academicSchools } = state;
    const t = TRANSLATIONS[language];
    
    // UI State
    const [tab, setTab] = useState<'syllabus' | 'library' | 'config'>('syllabus');
    
    // Editors State
    const [editingTopicTime, setEditingTopicTime] = useState<string | null>(null);
    const [editingTopicReadings, setEditingTopicReadings] = useState<string | null>(null);
    
    // Material State
    const [isAddingMaterial, setIsAddingMaterial] = useState(false);
    const [materialMode, setMaterialMode] = useState<'search' | 'create'>('search');
    const [materialSearch, setMaterialSearch] = useState('');
    const [newMaterial, setNewMaterial] = useState<LibraryResource>({ 
        id: '', title: '', author: '', publisher: '', year: new Date().getFullYear().toString(), 
        type: 'textbook', isEbook: false, isPrinted: true, url: '' 
    });

    // Process State
    const [isTranslating, setIsTranslating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    
    // AI / JSON Modal State
    const [showAiModal, setShowAiModal] = useState(false);
    const [jsonText, setJsonText] = useState<string>('');

    // Global Matrix Expectations for this course (ABET)
    const globalMatrixExpectations = useMemo(() => {
        const soIds = new Set<string>();
        (courseSoMap || []).filter(m => m.courseId === course.id && m.level !== '').forEach(m => soIds.add(m.soId));
        const piIds = new Set<string>();
        (coursePiMap || []).filter(m => m.courseId === course.id).forEach(m => piIds.add(m.piId));
        return { soIds, piIds };
    }, [course.id, courseSoMap, coursePiMap]);

    // Global Matrix Expectations for this course (MOET)
    const sortedObjectivesData = useMemo(() => {
        const CATEGORY_ORDER = ['knowledge', 'skills', 'learning'];
        const all = generalInfo.moetInfo.specificObjectives || [];
        const sorted = [...all].sort((a, b) => {
             const idxA = CATEGORY_ORDER.indexOf(a.category as any);
             const idxB = CATEGORY_ORDER.indexOf(b.category as any);
             return idxA - idxB;
        });
        
        return sorted.map((o, idx) => {
            const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const label = letters[idx % letters.length] + (Math.floor(idx / letters.length) || '');
            return {
                id: o.id,
                label,
                description: o.description[language]
            };
        });
    }, [generalInfo.moetInfo.specificObjectives, language]);

    const courseMoetHighlights = useMemo(() => {
        const highlights = new Set<string>();
        
        // 1. Manual mapping in Module 10 (MoetMatrix)
        (generalInfo.moetInfo.courseObjectiveMap || []).forEach(k => {
            const [cid, oid] = k.split('|');
            if(cid === course.id) highlights.add(oid);
        });

        // 2. Implied mapping via SOs
        const activeSoIds = new Set(courseSoMap.filter(m => m.courseId === course.id && m.level !== '').map(m => m.soId));
        (generalInfo.moetInfo.specificObjectives || []).forEach(obj => {
            if(obj.soIds?.some(soId => activeSoIds.has(soId))) {
                highlights.add(obj.id);
            }
        });

        return highlights;
    }, [course.id, generalInfo.moetInfo, courseSoMap]);

    // --- Helper Functions ---
    const updateCourse = (updates: Partial<Course>) => {
        updateState(prev => ({
            ...prev,
            courses: prev.courses.map(c => c.id === course.id ? { ...c, ...updates } : c)
        }));
    };

    const updateTopic = (id: string, field: keyof CourseTopic, value: any) => {
        updateCourse({ topics: course.topics.map(t => t.id === id ? { ...t, [field]: value } : t) });
    };

    const updateTopicLang = (id: string, value: string) => {
        updateCourse({
            topics: course.topics.map(t => 
                t.id === id ? { ...t, topic: { ...t.topic, [language]: value } } : t
            )
        });
    };

    const updateAssessment = (idx: number, field: keyof AssessmentItem, value: any) => {
        const next = [...course.assessmentPlan];
        next[idx] = { ...next[idx], [field]: value };
        // If updating methodId, optionally sync default name if empty
        if (field === 'methodId') {
            const method = assessmentMethods.find(m => m.id === value);
            if (method && (!next[idx].type.vi || next[idx].type.vi === '')) {
                next[idx].type = method.name;
            }
        }
        updateCourse({ assessmentPlan: next });
    };

    const updateCloMap = (cloIdx: number, updates: Partial<CloMapping>) => {
        const currentMaps = course.cloMap || [];
        const existingIdx = currentMaps.findIndex(m => m.cloIndex === cloIdx);
        let newMaps = [...currentMaps];
        if (existingIdx >= 0) {
            newMaps[existingIdx] = { ...newMaps[existingIdx], ...updates };
        } else {
            newMaps.push({ 
                cloIndex: cloIdx, topicIds: [], teachingMethodIds: [], assessmentMethodIds: [], 
                coverageLevel: CoverageLevel.NONE, soIds: [], piIds: [], objectiveIds: [], ...updates 
            });
        }
        updateCourse({ cloMap: newMaps });
    };

    // --- CLO Management ---
    const handleAddClo = () => {
        const newClos = {
            vi: [...(course.clos.vi || []), ''],
            en: [...(course.clos.en || []), '']
        };
        updateCourse({ clos: newClos });
    };

    const handleUpdateClo = (index: number, value: string) => {
        const newClos = { ...course.clos };
        // Ensure array exists for current language
        if (!newClos[language]) newClos[language] = [];
        
        const newList = [...newClos[language]];
        newList[index] = value;
        newClos[language] = newList;
        
        updateCourse({ clos: newClos });
    };

    const handleDeleteClo = (index: number) => {
        if (!confirm(language === 'vi' ? 'Xóa CLO này?' : 'Delete this CLO?')) return;
        
        // Remove from both lists
        const newClos = {
            vi: (course.clos.vi || []).filter((_, i) => i !== index),
            en: (course.clos.en || []).filter((_, i) => i !== index)
        };

        // Update CLO Map indices
        const newCloMap = (course.cloMap || [])
            .filter(m => m.cloIndex !== index)
            .map(m => m.cloIndex > index ? { ...m, cloIndex: m.cloIndex - 1 } : m);

        updateCourse({ clos: newClos, cloMap: newCloMap });
    };

    // --- Import / Export Handlers ---
    const handleExportSyllabus = async (type: 'ABET' | 'MOET') => {
        setIsExporting(true);
        try {
            // Using logic derived from MoetSyllabus.ts (1-indexed based on list position, here just 1)
            await downloadSingleSyllabus(
                type,
                course, 
                1,
                assessmentMethods,
                language,
                generalInfo,
                faculties,
                teachingMethods,
                sos,
                departments,
                academicFaculties,
                academicSchools
            );
        } catch (err: any) {
            console.error(err);
            alert("Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    const handleAutoTranslate = async () => {
        setIsTranslating(true);
        try {
            const translated = await translateSyllabus(course, language, geminiConfig);
            if (translated) updateCourse(translated);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleOpenAiAssistant = () => {
        window.open("https://gemini.google.com/gem/1ERPKel5BS-NhyaEfdUbi1DRfJ92hDKBE?usp=sharing", "_blank");
        setShowAiModal(true);
    };

    const handleJsonPasteImport = () => {
        try {
            // Explicitly cast jsonText to string to avoid unknown type errors
            const textToParse = typeof jsonText === 'string' ? jsonText : String((jsonText as unknown) || "");
            if (!textToParse) throw new Error("Input is empty");
            
            const data: any = JSON.parse(textToParse);
            const updates: Partial<Course> = {};

            // Syllabus Content Only - Protect Catalog Data
            if (data.description) updates.description = {
                vi: `${data.description?.vi || ''}`,
                en: `${data.description?.en || ''}`
            };
            
            if (data.clos) {
                 updates.clos = {
                    vi: Array.isArray(data.clos?.vi) ? (data.clos.vi as string[]) : (course.clos?.vi || []),
                    en: Array.isArray(data.clos?.en) ? (data.clos.en as string[]) : (course.clos?.en || [])
                };
            }
    
            if (Array.isArray(data.textbooks)) {
                updates.textbooks = data.textbooks.map((tb: any) => ({
                    resourceId: `${tb.resourceId || `lib-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`}`,
                    title: String(tb.title || ''),
                    author: String(tb.author || ''),
                    publisher: String(tb.publisher || ''),
                    year: String(tb.year || ''),
                    type: (tb.type === 'textbook' ? 'textbook' : 'reference'),
                    url: String(tb.url || ''),
                    isEbook: !!tb.isEbook,
                    isPrinted: tb.isPrinted !== false // Default true
                }));
            }
    
            if (Array.isArray(data.topics)) {
                 updates.topics = data.topics.map((t: any, idx: number) => {
                     // Try to map activities to existing teaching methods
                     const activities = Array.isArray(t.activities) ? t.activities.map((act: any) => {
                        const typeStr = `${act.type || ''}`;
                        const matchedMethod = teachingMethods.find(tm => 
                            (typeStr && (tm.code.toLowerCase() === typeStr.toLowerCase() || tm.name.en.toLowerCase().includes(typeStr.toLowerCase())))
                        );
                        return {
                            methodId: matchedMethod ? matchedMethod.id : (teachingMethods[0]?.id || ''),
                            hours: typeof act.hours === 'number' ? act.hours : 0
                        };
                    }) : [];

                     return {
                         id: `${t.id || `t-${Date.now()}-${idx}`}`,
                         no: `${t.no || `${idx + 1}`}`,
                         topic: (t.topic && typeof t.topic === 'object') ? t.topic : { vi: '', en: '' },
                         activities: activities,
                         readingRefs: t.readingRefs || []
                     };
                 });
            }
    
            if (Array.isArray(data.assessmentPlan)) {
                updates.assessmentPlan = data.assessmentPlan.map((a: any, idx: number) => {
                     const matchedMethod = assessmentMethods.find((am: AssessmentMethod) => {
                        const typeVi = a?.type?.vi ? String(a.type.vi) : '';
                        const typeEn = a?.type?.en ? String(a.type.en) : '';
                        
                        const amVi = `${am.name.vi || ''}`;
                        const amEn = `${am.name.en || ''}`;

                        return (typeVi && amVi.toLowerCase().includes(typeVi.toLowerCase())) ||
                               (typeEn && amEn.toLowerCase().includes(typeEn.toLowerCase()));
                    });

                     const defaultMethodId = assessmentMethods.length > 0 ? assessmentMethods[0].id : '';

                     return {
                         id: `${a.id || `a-${Date.now()}-${idx}`}`,
                         methodId: matchedMethod ? matchedMethod.id : defaultMethodId,
                         type: a.type || { vi: '', en: '' },
                         percentile: typeof a.percentile === 'number' ? a.percentile : 0
                     }
                });
            }
    
            updateCourse(updates);
            setShowAiModal(false);
            setJsonText('');
            alert(language === 'vi' ? "Cập nhật dữ liệu từ AI thành công!" : "Successfully updated syllabus from AI!");
    
        } catch (error: any) {
            console.error(error);
            const msg = error instanceof Error ? error.message : String(error);
            alert(`Invalid JSON format. Please check your input. ${msg}`);
        }
    };

    // --- Renderers ---
    const renderSyllabus = () => {
        const creditSummary = teachingMethods.map(tm => {
            const totalHours = course.topics.reduce((sum, t) => sum + (t.activities.find(a => a.methodId === tm.id)?.hours || 0), 0) || 0;
            if (totalHours === 0) return null;
            const factor = tm.hoursPerCredit || 15;
            const credits = totalHours / factor;
            return { 
                code: tm.code, 
                credits: credits, 
                totalHours, 
                category: tm.category,
                factor
            };
        }).filter(Boolean);
        
        let totalTheory = 0;
        let totalPractice = 0;
        
        creditSummary?.forEach((item: any) => {
            if (item.category === 'THEORY') totalTheory += item.credits;
            if (item.category === 'PRACTICE') totalPractice += item.credits;
        });

        // Round summary for display
        const formatCredit = (n: number) => parseFloat(n.toFixed(2));
        const displayTotalTheory = formatCredit(totalTheory);
        const displayTotalPractice = formatCredit(totalPractice);
        const totalComputed = formatCredit(totalTheory + totalPractice);
        const diff = formatCredit((course.credits || 0) - totalComputed);

        const mappedInSyllabusSoIds = new Set<string>();
        course.cloMap?.forEach(m => m.soIds.forEach(id => mappedInSyllabusSoIds.add(id)));
        const missingSoCoverage = Array.from(globalMatrixExpectations.soIds).filter(id => !mappedInSyllabusSoIds.has(id));

        return (
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {/* Simplified Export & Tools Section */}
                <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex justify-between items-center gap-8">
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-1">{language === 'vi' ? 'Công cụ Đề cương' : 'Syllabus Tools'}</h4>
                        <div className="flex gap-2">
                            <button onClick={handleAutoTranslate} disabled={isTranslating} className="bg-white border border-slate-200 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-50 disabled:opacity-50">
                                <Sparkles size={14} /> {t.autoTranslate}
                            </button>
                            <button onClick={handleOpenAiAssistant} className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-amber-600 shadow-sm shadow-amber-200">
                                <Bot size={14} /> {language === 'vi' ? 'Trợ lý AI' : 'AI Assistant'}
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'vi' ? 'Xuất tài liệu' : 'Export Documents'}</h4>
                        <div className="flex gap-2">
                            <button onClick={() => handleExportSyllabus('ABET')} disabled={isExporting} className="bg-white border border-slate-200 text-orange-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-orange-50 hover:border-orange-200 transition shadow-sm">
                                <Download size={16} /> Syllabus (ABET)
                            </button>
                            <button onClick={() => handleExportSyllabus('MOET')} disabled={isExporting} className="bg-white border border-slate-200 text-emerald-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-emerald-50 hover:border-emerald-200 transition shadow-sm">
                                <Download size={16} /> Syllabus (BGD/MOET)
                            </button>
                        </div>
                    </div>
                </section>

                {/* Description */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest border-b pb-2"><Info size={16} /> Course Description</div>
                    <textarea className="w-full min-h-[100px] p-4 text-sm leading-relaxed bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={course.description[language] || ''} onChange={(e) => updateCourse({ description: { ...course.description, [language]: e.target.value } })} />
                </section>

                {/* NEW: Course Learning Outcomes (CLOs) */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                            <Target size={16} /> {t.clos || 'Course Learning Outcomes (CLOs)'}
                        </div>
                        <button onClick={handleAddClo} className="text-indigo-600 hover:text-indigo-700 p-1 rounded hover:bg-indigo-50 transition-colors">
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {(course.clos[language] || []).map((clo, idx) => (
                            <div key={idx} className="flex gap-3 items-start group">
                                <span className="text-xs font-bold text-slate-400 mt-2.5 w-12 text-right">CLO.{idx + 1}</span>
                                <textarea 
                                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                                    rows={2}
                                    value={clo}
                                    onChange={(e) => handleUpdateClo(idx, e.target.value)}
                                    placeholder={`Enter CLO content in ${language.toUpperCase()}...`}
                                />
                                <button 
                                    onClick={() => handleDeleteClo(idx)} 
                                    className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {(course.clos[language] || []).length === 0 && (
                            <div className="text-center text-slate-400 italic py-4 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                {language === 'vi' ? 'Chưa có CLO nào. Nhấn + để thêm.' : 'No CLOs defined. Click + to add.'}
                            </div>
                        )}
                    </div>
                </section>

                {/* Textbooks & Materials */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest"><BookOpen size={16} /> {t.textbook} & {t.typeReference}</div>
                        <button onClick={() => setIsAddingMaterial(true)} className="text-indigo-600 hover:text-indigo-700"><Plus size={18} /></button>
                    </div>
                    <div className="space-y-2">
                        {course.textbooks.map((tb, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                                <div>
                                    <div className="text-sm font-bold text-slate-800">{tb.title}</div>
                                    <div className="text-xs text-slate-500">{tb.author} • {tb.publisher} ({tb.year})</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => {
                                            const nextTextbooks = [...course.textbooks];
                                            nextTextbooks[idx] = { 
                                                ...nextTextbooks[idx], 
                                                type: nextTextbooks[idx].type === 'textbook' ? 'reference' : 'textbook' 
                                            };
                                            updateCourse({ textbooks: nextTextbooks });
                                        }}
                                        className={`px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border cursor-pointer select-none min-w-[80px] text-center ${
                                            tb.type === 'textbook' 
                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100' 
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                        title={language === 'vi' ? 'Nhấn để đổi loại' : 'Click to toggle type'}
                                    >
                                        {tb.type === 'textbook' ? t.typeTextbook : t.typeReference}
                                    </button>
                                    <button onClick={() => updateCourse({ textbooks: course.textbooks.filter((_, i) => i !== idx) })} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                        {course.textbooks.length === 0 && <div className="text-center text-slate-400 italic py-4 text-xs">No materials added.</div>}
                    </div>
                </section>

                {/* Assessment Plan */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest"><Percent size={16} /> {t.assessment}</div>
                        <button onClick={() => updateCourse({ assessmentPlan: [...course.assessmentPlan, { id: Date.now().toString(), methodId: assessmentMethods[0].id, type: { vi: '', en: '' }, percentile: 0 }] })} className="text-indigo-600 hover:text-indigo-700"><Plus size={18} /></button>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-3 font-bold text-slate-500 uppercase">{t.assessmentType}</th>
                                    <th className="p-3 font-bold text-slate-500 uppercase">{t.description} ({language})</th>
                                    <th className="p-3 font-bold text-slate-500 uppercase w-24 text-center">{t.percentile}</th>
                                    <th className="p-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {course.assessmentPlan.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="p-2">
                                            <select 
                                                className="w-full p-2 bg-transparent border border-transparent hover:border-slate-200 rounded outline-none cursor-pointer"
                                                value={item.methodId}
                                                onChange={e => updateAssessment(idx, 'methodId', e.target.value)}
                                            >
                                                {assessmentMethods.map(m => <option key={m.id} value={m.id}>{m.name[language]}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2"><input className="w-full p-2 bg-transparent border border-transparent hover:border-slate-200 rounded outline-none" value={item.type[language]} onChange={e => updateAssessment(idx, 'type', { ...item.type, [language]: e.target.value })} placeholder="Custom name..." /></td>
                                        <td className="p-2"><input type="number" className="w-full p-2 text-center bg-transparent border border-transparent hover:border-slate-200 rounded outline-none font-bold" value={item.percentile} onChange={e => updateAssessment(idx, 'percentile', parseInt(e.target.value) || 0)} /></td>
                                        <td className="p-2 text-center"><button onClick={() => updateCourse({ assessmentPlan: course.assessmentPlan.filter((_, i) => i !== idx) })} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Topics & Schedule */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest"><Layers size={16} /> {t.courseTopicsSchedule}</div>
                        {creditSummary && creditSummary.length > 0 && (
                            <div className="flex flex-col items-end gap-1.5">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end border-r border-slate-200 pr-4 mr-2">
                                        <span className={`text-xs font-black ${Math.abs((course.credits || 0) - (creditSummary.reduce((a,b) => a + (b ? b.credits : 0), 0))) < 0.01 ? 'text-green-600' : 'text-red-500'}`}>Total: {parseFloat((creditSummary.reduce((a,b) => a + (b ? b.credits : 0), 0)).toFixed(2))}/{course.credits} TC</span>
                                        {Math.abs((course.credits || 0) - (creditSummary.reduce((a,b) => a + (b ? b.credits : 0), 0))) >= 0.01 && <span className="text-[9px] text-amber-500 font-bold flex items-center gap-1"><AlertCircle size={8} /> Diff: {Math.abs((course.credits || 0) - (creditSummary.reduce((a,b) => a + (b ? b.credits : 0), 0))).toFixed(2)} TC</span>}
                                    </div>
                                    <div className="flex gap-2">
                                        {creditSummary.filter(i => i && i.category === 'THEORY').reduce((a,b) => a + (b ? b.credits : 0), 0) > 0 && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                                                {language === 'vi' ? 'Lý thuyết' : 'Theory'}: {parseFloat(creditSummary.filter(i => i && i.category === 'THEORY').reduce((a,b) => a + (b ? b.credits : 0), 0).toFixed(2))}
                                            </span>
                                        )}
                                        {creditSummary.filter(i => i && i.category === 'PRACTICE').reduce((a,b) => a + (b ? b.credits : 0), 0) > 0 && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                                {language === 'vi' ? 'Thực hành' : 'Practice'}: {parseFloat(creditSummary.filter(i => i && i.category === 'PRACTICE').reduce((a,b) => a + (b ? b.credits : 0), 0).toFixed(2))}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end flex-wrap">
                                    {creditSummary.map((s: any) => s && (
                                        <div key={s.code} className="flex flex-col items-end">
                                            <span 
                                                className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-200 whitespace-nowrap"
                                                title={`${s.category} - ${s.totalHours}h (Factor: ${s.factor})`}
                                            >
                                                {s.code}: {s.credits.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <button onClick={() => {
                            const next: CourseTopic = { id: `t-${Date.now()}`, no: `CONT ${course.topics.length + 1}`, topic: { vi: '', en: '' }, activities: [], readingRefs: [] };
                            updateCourse({ topics: [...course.topics, next] });
                        }} className="text-indigo-600 hover:text-indigo-700 ml-4"><Plus size={18} /></button>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 border-b">
                                <tr><th className="p-3 font-bold text-slate-500 uppercase w-20">{t.contentNo}</th><th className="p-3 font-bold text-slate-500 uppercase w-48">{t.amountOfTime}</th><th className="p-3 font-bold text-slate-500 uppercase">Course Topic</th><th className="p-3 font-bold text-slate-500 uppercase w-64">Readings</th><th className="p-3 w-10"></th></tr>
                            </thead>
                            <tbody className="divide-y">
                                {course.topics.map((topic: CourseTopic) => {
                                    const totalHours = (topic.activities || []).reduce((s, a) => s + a.hours, 0);
                                    const methodsStr = (topic.activities || []).map(a => `${teachingMethods.find(m => m.id === a.methodId)?.code}: ${a.hours}`).join(', ');
                                    return (
                                        <tr key={topic.id} className="hover:bg-slate-50 align-top">
                                            <td className="p-2"><input className="w-full bg-transparent p-1 outline-none font-bold" value={topic.no} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTopic(topic.id, 'no', e.target.value)} /></td>
                                            <td className="p-2">
                                                <button onClick={() => setEditingTopicTime(topic.id)} className="w-full text-left p-1 rounded hover:bg-slate-100 group relative">
                                                    <div className="flex items-center justify-between"><div className="font-bold text-indigo-700 text-sm">{totalHours} {t.hours}</div><div className="text-slate-300 group-hover:text-indigo-500 transition-colors"><Plus size={14}/></div></div>
                                                    {methodsStr && <div className="text-[10px] text-slate-500 mt-1 font-medium bg-slate-100 inline-block px-1.5 py-0.5 rounded border border-slate-200">{methodsStr}</div>}
                                                </button>
                                            </td>
                                            <td className="p-2"><textarea className="w-full bg-transparent p-1 outline-none italic resize-none h-full" rows={2} value={topic.topic[language] || ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateTopicLang(topic.id, e.target.value)} /></td>
                                            <td className="p-2">
                                                <button onClick={() => setEditingTopicReadings(topic.id)} className="w-full text-left p-1 rounded hover:bg-slate-100 group min-h-[40px]">
                                                    {(topic.readingRefs || []).length === 0 && <span className="text-[10px] text-slate-300">+ Add Readings</span>}
                                                    {(topic.readingRefs || []).map((ref, i) => { const tb = course.textbooks.find(b => b.resourceId === ref.resourceId); return (<div key={i} className="text-[10px] text-slate-600 mb-1"><span className="font-bold">{tb ? tb.title : 'Unknown'}</span>{ref.pageRange && <span className="text-slate-400 ml-1">({ref.pageRange})</span>}</div>); })}
                                                </button>
                                            </td>
                                            <td className="p-2 text-center pt-3"><button onClick={() => updateCourse({ topics: course.topics.filter(t => t.id !== topic.id) })} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Matrix & CLO Relation */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest border-b pb-2"><Hash size={16} /> {t.cloRelationship}</div>
                    {missingSoCoverage.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-4">
                            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="text-sm font-bold text-amber-800 mb-1">{language === 'vi' ? 'Cảnh báo độ phủ Ma trận' : 'Curriculum Matrix Coverage Warning'}</h4>
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    {language === 'vi' ? `Cần đóng góp vào các chuẩn đầu ra sau: ` : `Missing required mappings for: `}
                                    <span className="font-bold">{missingSoCoverage.map(id => sos.find(s => s.id === id)?.code).join(', ')}</span>
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm pb-10">
                        <table className="w-full text-left text-xs min-w-[1200px]">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-3 font-bold text-slate-500 w-20">CLO</th>
                                    <th className="p-3 font-bold text-slate-500 w-48">Related Topics</th>
                                    <th className="p-3 font-bold text-slate-500 w-48">{t.teachingMethodology}</th>
                                    <th className="p-3 font-bold text-slate-500 w-48">{t.assessmentType}</th>
                                    <th className="p-3 font-bold text-slate-500 text-center w-24">{t.levelOfCoverage}</th>
                                    <th className="p-3 font-bold text-slate-500 w-64">SOs / PIs (ABET)</th>
                                    <th className="p-3 font-bold text-slate-500 w-48">MOET Obj</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {(course.clos[language] || []).map((cloText, idx) => {
                                    const mapping = course.cloMap?.find(m => m.cloIndex === idx) || { cloIndex: idx, topicIds: [], teachingMethodIds: [], assessmentMethodIds: [], coverageLevel: CoverageLevel.NONE, soIds: [], piIds: [], objectiveIds: [] };
                                    const availableTeachingMethods = teachingMethods.filter(tm => course.topics.some(t => t.activities.some(a => a.methodId === tm.id)));
                                    const availableAssessmentMethods = assessmentMethods.filter(am => course.assessmentPlan.some(a => a.methodId === am.id));
                                    
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50 align-top">
                                            <td className="p-3 font-bold text-indigo-700 bg-slate-50/50">CLO.{idx + 1}</td>
                                            <td className="p-3"><div className="flex flex-wrap gap-1">{course.topics.map(t => (<button key={t.id} onClick={() => updateCloMap(idx, { topicIds: mapping.topicIds.includes(t.id) ? mapping.topicIds.filter(i => i !== t.id) : [...mapping.topicIds, t.id] })} className={`px-1.5 py-0.5 border rounded text-[10px] ${mapping.topicIds.includes(t.id) ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-400'}`}>{t.no}</button>))}</div></td>
                                            <td className="p-3">
                                                <div className="flex flex-wrap gap-1">{availableTeachingMethods.map(tm => (
                                                    <button key={tm.id} onClick={() => updateCloMap(idx, { teachingMethodIds: mapping.teachingMethodIds.includes(tm.id) ? mapping.teachingMethodIds.filter(i => i !== tm.id) : [...mapping.teachingMethodIds, tm.id] })} className={`px-1.5 py-0.5 border rounded text-[10px] ${mapping.teachingMethodIds.includes(tm.id) ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-400'}`}>{tm.code}</button>
                                                ))}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-col gap-1">{availableAssessmentMethods.map(am => (
                                                    <div key={am.id} className="flex items-center gap-2" onClick={() => updateCloMap(idx, { assessmentMethodIds: mapping.assessmentMethodIds.includes(am.id) ? mapping.assessmentMethodIds.filter(i => i !== am.id) : [...mapping.assessmentMethodIds, am.id] })}>
                                                        <div className={`w-3 h-3 border rounded cursor-pointer ${mapping.assessmentMethodIds.includes(am.id) ? 'bg-emerald-500 border-emerald-600' : 'bg-white border-slate-200'}`}></div>
                                                        <span className="cursor-pointer text-slate-500">{am.name[language]}</span>
                                                    </div>
                                                ))}</div>
                                            </td>
                                            <td className="p-3 text-center"><button onClick={() => {
                                                const order = [CoverageLevel.NONE, CoverageLevel.L, CoverageLevel.M, CoverageLevel.H];
                                                updateCloMap(idx, { coverageLevel: order[(order.indexOf(mapping.coverageLevel as CoverageLevel) + 1) % 4] });
                                            }} className="w-8 h-8 rounded border border-slate-300 font-black flex items-center justify-center mx-auto hover:bg-slate-100 transition-colors">{mapping.coverageLevel || '-'}</button></td>
                                            <td className="p-3">
                                                <SoPiSelector sos={sos} selectedSoIds={mapping.soIds || []} selectedPiIds={mapping.piIds || []} globalMappedSoIds={globalMatrixExpectations.soIds} globalMappedPiIds={globalMatrixExpectations.piIds} language={language} onUpdate={(soIds, piIds) => updateCloMap(idx, { soIds, piIds })} />
                                            </td>
                                            <td className="p-3">
                                                <ObjectiveSelector 
                                                    objectives={sortedObjectivesData} 
                                                    selectedIds={mapping.objectiveIds || []} 
                                                    highlightedIds={courseMoetHighlights} 
                                                    onUpdate={(ids) => updateCloMap(idx, { objectiveIds: ids })} 
                                                    language={language}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col relative">
            <AILoader isVisible={isExporting} message={language === 'vi' ? 'Đang xuất tài liệu...' : 'Exporting...'} />
            
            {showAiModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col h-[80vh]">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Paste JSON from Gemini</h3>
                            <button onClick={() => setShowAiModal(false)}><X size={20}/></button>
                        </div>
                        <div className="flex-1 p-4 bg-slate-50">
                            <textarea 
                                className="w-full h-full p-4 font-mono text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                placeholder='Paste the JSON output here...'
                                value={jsonText}
                                onChange={e => setJsonText(e.target.value)}
                            />
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                            <button onClick={() => setShowAiModal(false)} className="px-4 py-2 text-slate-500 font-bold text-xs">Cancel</button>
                            <button onClick={handleJsonPasteImport} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs">Import</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popups for Editing Time/Readings */}
            {editingTopicTime && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm" onClick={() => setEditingTopicTime(null)}><div className="bg-white p-4 rounded-xl shadow-xl border border-slate-200 w-80" onClick={e => e.stopPropagation()}><h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Clock size={16} /> Edit Time</h4><div className="space-y-2 mb-4">{course.topics.find(t => t.id === editingTopicTime)?.activities.map((act, idx) => (<div key={idx} className="flex gap-2 items-center"><select className="text-xs font-bold border border-slate-200 rounded p-1 flex-1" value={act.methodId} onChange={e => { const t = course.topics.find(x => x.id === editingTopicTime)!; const next = [...t.activities]; next[idx].methodId = e.target.value; updateTopic(t.id, 'activities', next); }}>{teachingMethods.map(tm => <option key={tm.id} value={tm.id}>{tm.code} ({tm.category})</option>)}</select><input type="number" className="w-16 text-xs font-bold border border-slate-200 rounded p-1 text-center" value={act.hours} onChange={e => { const t = course.topics.find(x => x.id === editingTopicTime)!; const next = [...t.activities]; next[idx].hours = Number(e.target.value); updateTopic(t.id, 'activities', next); }} /><button onClick={() => { const t = course.topics.find(x => x.id === editingTopicTime)!; updateTopic(t.id, 'activities', t.activities.filter((_, i) => i !== idx)); }} className="text-slate-400 hover:text-red-500"><X size={14}/></button></div>))} <button onClick={() => { const t = course.topics.find(x => x.id === editingTopicTime)!; updateTopic(t.id, 'activities', [...t.activities, { methodId: teachingMethods[0].id, hours: 0 }]); }} className="w-full py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100">+ Add</button></div><div className="pt-2 border-t border-slate-100 flex justify-end"><button onClick={() => setEditingTopicTime(null)} className="px-3 py-1 bg-slate-800 text-white text-xs rounded font-bold">Done</button></div></div></div>
            )}
            {editingTopicReadings && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm" onClick={() => setEditingTopicReadings(null)}><div className="bg-white p-4 rounded-xl shadow-xl border border-slate-200 w-96" onClick={e => e.stopPropagation()}><h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Library size={16} /> Edit Readings</h4><div className="space-y-2 mb-4">{course.topics.find(t => t.id === editingTopicReadings)?.readingRefs.map((ref, idx) => (<div key={idx} className="flex gap-2 items-start bg-slate-50 p-2 rounded"><div className="flex-1 space-y-1"><select className="w-full text-xs font-bold border border-slate-200 rounded p-1" value={ref.resourceId} onChange={e => { const t = course.topics.find(x => x.id === editingTopicReadings)!; const next = [...t.readingRefs]; next[idx].resourceId = e.target.value; updateTopic(t.id, 'readingRefs', next); }}><option value="" disabled>Select...</option>{course.textbooks.map(tb => (<option key={tb.resourceId} value={tb.resourceId}>{tb.title}</option>))}</select><input className="w-full text-[10px] border border-slate-200 rounded p-1" placeholder="Pages" value={ref.pageRange} onChange={e => { const t = course.topics.find(x => x.id === editingTopicReadings)!; const next = [...t.readingRefs]; next[idx].pageRange = e.target.value; updateTopic(t.id, 'readingRefs', next); }} /></div><button onClick={() => { const t = course.topics.find(x => x.id === editingTopicReadings)!; updateTopic(t.id, 'readingRefs', t.readingRefs.filter((_, i) => i !== idx)); }} className="text-slate-400 hover:text-red-500 mt-1"><X size={14}/></button></div>))} <button onClick={() => { const t = course.topics.find(x => x.id === editingTopicReadings)!; updateTopic(t.id, 'readingRefs', [...t.readingRefs, { resourceId: '', pageRange: '' }]); }} className="w-full py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100">+ Add</button></div><div className="pt-2 border-t border-slate-100 flex justify-end"><button onClick={() => setEditingTopicReadings(null)} className="px-3 py-1 bg-slate-800 text-white text-xs rounded font-bold">Done</button></div></div></div>
            )}
            {isAddingMaterial && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsAddingMaterial(false)}><div className="bg-white rounded-xl shadow-2xl w-[600px] flex flex-col max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}><div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen size={18}/> Add Material</h3><button onClick={() => setIsAddingMaterial(false)}><X size={18} className="text-slate-400" /></button></div><div className="p-4 border-b border-slate-100 flex gap-4"><button onClick={() => setMaterialMode('search')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${materialMode === 'search' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>{t.searchLibrary}</button><button onClick={() => setMaterialMode('create')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${materialMode === 'create' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>{t.createResource}</button></div><div className="p-6 overflow-y-auto flex-1">{materialMode === 'search' ? (<div className="space-y-4"><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" placeholder="Search..." value={materialSearch} onChange={e => setMaterialSearch(e.target.value)} /><div className="space-y-2">{library.filter(l => l.title.toLowerCase().includes(materialSearch.toLowerCase())).map(lib => (<div key={lib.id} className="p-3 border rounded flex justify-between items-center"><div><div className="font-bold text-sm">{lib.title}</div><div className="text-xs text-slate-500">{lib.author}</div></div><button onClick={() => { updateCourse({ textbooks: [...course.textbooks, { resourceId: lib.id, title: lib.title, author: lib.author, publisher: lib.publisher, year: lib.year, type: 'textbook' }] }); setIsAddingMaterial(false); }} className="px-3 py-1 bg-indigo-600 text-white text-xs rounded">{t.addToCourse}</button></div>))}</div></div>) : (<div className="space-y-3"><input className="w-full p-2 border rounded" placeholder="Title" value={newMaterial.title} onChange={e => setNewMaterial({...newMaterial, title: e.target.value})} /><button onClick={() => { const id = `lib-${Date.now()}`; const res = { ...newMaterial, id, type: 'textbook' as const }; updateState(prev => ({ ...prev, library: [...prev.library, res] })); updateCourse({ textbooks: [...course.textbooks, { resourceId: id, title: res.title, author: res.author, publisher: res.publisher, year: res.year, type: 'textbook' }] }); setIsAddingMaterial(false); }} className="w-full py-2 bg-indigo-600 text-white rounded text-sm font-bold">Create & Add</button></div>)}</div></div></div>
            )}

            {/* Header Tabs */}
            <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
                <button onClick={() => setTab('syllabus')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${tab === 'syllabus' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <FileText size={16}/> {t.syllabusTab}
                </button>
                <button onClick={() => setTab('config')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${tab === 'config' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <Settings2 size={16}/> {t.configSyllabus}
                </button>
            </div>

            {/* Content Area */}
            {tab === 'syllabus' && renderSyllabus()}
            {tab === 'config' && <SyllabusConfigModule state={state} updateState={updateState} />}
        </div>
    );
};

export default SyllabusEditorModule;

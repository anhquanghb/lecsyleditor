
import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List as ListIcon, ListOrdered, Plus, Search, X, Check, Edit2 } from 'lucide-react';
import { Course, Language } from '../../types';

// --- Rich Text Editor ---
export const RichTextEditor: React.FC<{ value: string; onChange: (val: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow shadow-sm">
      <div className="flex items-center gap-1 p-1 bg-slate-50 border-b border-slate-100 flex-wrap">
        <button onClick={() => execCommand('bold')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Bold"><Bold size={16} /></button>
        <button onClick={() => execCommand('italic')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Italic"><Italic size={16} /></button>
        <button onClick={() => execCommand('underline')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Underline"><Underline size={16} /></button>
        <div className="w-px h-4 bg-slate-300 mx-1"></div>
        <button onClick={() => execCommand('insertUnorderedList')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Bullet List"><ListIcon size={16} /></button>
        <button onClick={() => execCommand('insertOrderedList')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Numbered List"><ListOrdered size={16} /></button>
      </div>
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 min-h-[150px] max-h-[400px] overflow-y-auto outline-none text-sm leading-relaxed text-slate-700 prose prose-sm max-w-none"
        data-placeholder={placeholder}
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          font-style: italic;
        }
        [contenteditable] ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        [contenteditable] ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        [contenteditable] li {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
};

// --- Input Field Helper ---
export const InputField = ({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</label>
    <input 
      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

// --- Rich Narrative Section Helper ---
export const RichNarrativeSection = ({ icon, title, value, onChange }: { icon: React.ReactNode, title: string, value: string, onChange: (v: string) => void }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
    </div>
    <RichTextEditor value={value} onChange={onChange} />
  </div>
);

// --- Relation Editor ---
export const RelationEditor = ({ 
    course, 
    type, 
    allCourses, 
    value, 
    onChange, 
    language 
}: {
    course: Course,
    type: 'prereq' | 'coreq',
    allCourses: Course[],
    value: string[],
    onChange: (val: string[]) => void,
    language: Language
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = allCourses.filter(c => 
        c.id !== course.id && // Not self
        ((c.code || '').toLowerCase().includes(search.toLowerCase()) || (c.name[language] || '').toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex flex-wrap gap-1 min-h-[24px] items-center">
                {value.length === 0 && (
                    <button onClick={() => setIsOpen(true)} className="text-[10px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 italic border border-dashed border-slate-300 px-1.5 rounded hover:border-indigo-300">
                        <Plus size={10}/> Add
                    </button>
                )}
                {value.map(code => (
                    <span key={code} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700 border border-slate-200">
                        {code}
                        <button onClick={() => onChange(value.filter(v => v !== code))} className="hover:text-red-500"><X size={10}/></button>
                    </span>
                ))}
                {value.length > 0 && <button onClick={() => setIsOpen(true)} className="text-slate-400 hover:text-indigo-600 ml-1"><Edit2 size={10}/></button>}
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 shadow-xl rounded-lg z-50 p-2 animate-in fade-in zoom-in-95">
                    <div className="mb-2">
                        <input 
                            className="w-full text-xs p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                            placeholder="Search..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                        {filtered.map(c => {
                            const isSelected = value.includes(c.code);
                            return (
                                <div 
                                    key={c.id} 
                                    onClick={() => {
                                        const newValue = isSelected ? value.filter(v => v !== c.code) : [...value, c.code];
                                        onChange(newValue);
                                    }}
                                    className={`flex items-center justify-between p-1.5 rounded cursor-pointer text-xs ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}`}
                                >
                                    <span className="font-bold">{c.code}</span>
                                    {isSelected && <Check size={12}/>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Course Picker ---
export const CoursePicker = ({ courses, onSelect, language, excludeIds = [] }: { courses: Course[], onSelect: (id: string) => void, language: Language, excludeIds?: string[] }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const filtered = courses.filter(c => 
        !excludeIds.includes(c.id) &&
        ((c.code || '').toLowerCase().includes(search.toLowerCase()) || 
         (c.name[language] || '').toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="relative inline-block" ref={containerRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1 text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                <Plus size={14}/> {language === 'vi' ? 'Thêm môn học' : 'Add Course'}
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 shadow-xl rounded-lg z-50 p-2 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-2 mb-2 bg-slate-50 p-1.5 rounded border border-slate-100">
                        <Search size={14} className="text-slate-400"/>
                        <input className="flex-1 text-xs outline-none bg-transparent" autoFocus placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                        <button onClick={() => setIsOpen(false)}><X size={14} className="text-slate-400 hover:text-slate-600"/></button>
                    </div>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                        {filtered.map(c => (
                            <div key={c.id} onClick={() => { onSelect(c.id); setIsOpen(false); }} className="text-xs p-2 hover:bg-indigo-50 hover:text-indigo-700 rounded cursor-pointer truncate flex justify-between items-center group">
                                <div>
                                    <span className="font-bold block">{c.code}</span>
                                    <span className="text-[10px] text-slate-500 group-hover:text-indigo-500">{c.name[language]}</span>
                                </div>
                                <Plus size={12} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                            </div>
                        ))}
                        {filtered.length === 0 && <div className="text-xs text-slate-400 text-center py-4 italic">No results</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Structure Table ---
export const StructureTable = ({ 
    courseIds, 
    courses, 
    language, 
    onRemove, 
    onAdd,
    onTypeChange,
    onRelationUpdate,
    excludeIds,
    theme = 'slate'
}: {
    courseIds: string[],
    courses: Course[],
    language: Language,
    onRemove: (id: string) => void,
    onAdd: (id: string) => void,
    onTypeChange: (id: string, type: 'REQUIRED' | 'ELECTIVE' | 'SELECTED_ELECTIVE') => void,
    onRelationUpdate: (id: string, field: 'prerequisites' | 'coRequisites', value: string[]) => void,
    excludeIds: string[],
    theme?: 'slate' | 'amber'
}) => {
    const borderColor = theme === 'amber' ? 'border-amber-200' : 'border-slate-200';
    const headerBg = theme === 'amber' ? 'bg-amber-100/50' : 'bg-slate-50';
    
    return (
        <div className={`overflow-x-auto rounded-lg border ${borderColor} bg-white shadow-sm`}>
            <table className="w-full text-left text-sm">
                <thead className={`${headerBg} border-b ${borderColor} text-xs font-bold text-slate-500 uppercase`}>
                    <tr>
                        <th className="p-3 w-16">Code</th>
                        <th className="p-3 min-w-[150px]">Course Name</th>
                        <th className="p-3 w-12 text-center">Cr</th>
                        <th className="p-3 w-32">Type</th>
                        <th className="p-3 w-40">Prerequisites</th>
                        <th className="p-3 w-40">Co-requisites</th>
                        <th className="p-3 w-10 text-center">Action</th>
                    </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'amber' ? 'divide-amber-50' : 'divide-slate-100'}`}>
                    {courseIds.map(cid => {
                        const c = courses.find(x => x.id === cid);
                        if (!c) return null;
                        return (
                            <tr key={cid} className={`group hover:${theme === 'amber' ? 'bg-amber-50/30' : 'bg-slate-50'}`}>
                                <td className="p-3 font-bold text-slate-700">{c.code}</td>
                                <td className="p-3">
                                    <div className="font-medium text-slate-800">{c.name[language]}</div>
                                </td>
                                <td className="p-3 text-center">{c.credits}</td>
                                <td className="p-3">
                                    <select 
                                        className="w-full text-xs p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                                        value={c.type}
                                        onChange={(e) => onTypeChange(c.id, e.target.value as any)}
                                    >
                                        <option value="REQUIRED">{language === 'vi' ? 'Bắt buộc' : 'Compulsory'}</option>
                                        <option value="SELECTED_ELECTIVE">{language === 'vi' ? 'TC Định hướng' : 'Selected Elective'}</option>
                                        <option value="ELECTIVE">{language === 'vi' ? 'Tự chọn' : 'Free Elective'}</option>
                                    </select>
                                </td>
                                <td className="p-3">
                                    <RelationEditor 
                                        course={c} type="prereq" allCourses={courses} language={language}
                                        value={c.prerequisites} 
                                        onChange={val => onRelationUpdate(c.id, 'prerequisites', val)} 
                                    />
                                </td>
                                <td className="p-3">
                                    <RelationEditor 
                                        course={c} type="coreq" allCourses={courses} language={language}
                                        value={c.coRequisites} 
                                        onChange={val => onRelationUpdate(c.id, 'coRequisites', val)} 
                                    />
                                </td>
                                <td className="p-3 text-center">
                                    <button 
                                        onClick={() => onRemove(c.id)}
                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <X size={16}/>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    <tr>
                        <td colSpan={7} className={`p-2 ${theme === 'amber' ? 'bg-amber-50/20' : 'bg-slate-50/50'}`}>
                            <CoursePicker 
                                courses={courses} 
                                onSelect={onAdd} 
                                language={language} 
                                excludeIds={excludeIds} 
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

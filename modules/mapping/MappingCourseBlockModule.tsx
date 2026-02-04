
import React, { useState } from 'react';
import { AppState, KnowledgeArea, Language, Course } from '../../types';
import { TRANSLATIONS } from '../../constants';
import { Layers, Plus, Trash2, Check, X } from 'lucide-react';

const AREA_HEX_COLORS: Record<string, string> = {
  'blue': '#3b82f6', 'indigo': '#6366f1', 'purple': '#a855f7', 'green': '#22c55e',
  'slate': '#64748b', 'red': '#ef4444', 'orange': '#f97316', 'yellow': '#eab308'
};

interface Props {
    knowledgeAreas: KnowledgeArea[];
    courses: Course[]; // Added courses to update references
    language: Language;
    updateState: (updater: (prev: AppState) => AppState) => void;
    onRefresh: (cb: () => void) => void;
}

const MappingCourseBlockModule: React.FC<Props> = ({ knowledgeAreas, courses, language, updateState, onRefresh }) => {
    const t = TRANSLATIONS[language];
    
    // State for ID Editing
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempIdValue, setTempIdValue] = useState('');

    const addArea = () => {
        const newId = `KA-${Date.now()}`;
        onRefresh(() => updateState(prev => ({ ...prev, knowledgeAreas: [...prev.knowledgeAreas, { id: newId, name: { vi: 'Khối mới', en: 'New Area' }, color: 'slate' }] })));
    };

    const updateArea = (id: string, field: 'name_vi' | 'name_en' | 'color', value: string) => {
        updateState(prev => ({
            ...prev,
            knowledgeAreas: prev.knowledgeAreas.map(a => {
                if (a.id !== id) return a;
                if (field === 'name_vi') return { ...a, name: { ...a.name, vi: value } };
                if (field === 'name_en') return { ...a, name: { ...a.name, en: value } };
                return { ...a, color: value };
            })
        }));
    };

    const startEditingId = (area: KnowledgeArea) => {
        setEditingId(area.id);
        setTempIdValue(area.id);
    };

    const handleSaveId = () => {
        if (!editingId) return;
        const newId = tempIdValue.trim();
        
        if (!newId) {
            alert(language === 'vi' ? 'ID không được để trống!' : 'ID cannot be empty!');
            return;
        }

        if (newId === editingId) {
            setEditingId(null);
            return;
        }

        if (knowledgeAreas.some(ka => ka.id === newId)) {
            alert(language === 'vi' ? 'ID này đã tồn tại!' : 'ID already exists!');
            return;
        }

        if (!confirm(language === 'vi' 
            ? `Bạn có chắc chắn đổi ID từ "${editingId}" sang "${newId}"? Hệ thống sẽ tự động cập nhật ${courses.filter(c => c.knowledgeAreaId === editingId).length} môn học liên quan.` 
            : `Change ID from "${editingId}" to "${newId}"? System will update ${courses.filter(c => c.knowledgeAreaId === editingId).length} related courses.`)) {
            return;
        }

        onRefresh(() => updateState(prev => {
            // 1. Update Knowledge Areas
            const newAreas = prev.knowledgeAreas.map(ka => 
                ka.id === editingId ? { ...ka, id: newId } : ka
            );

            // 2. Update Courses referencing this Area
            const newCourses = prev.courses.map(c => 
                c.knowledgeAreaId === editingId ? { ...c, knowledgeAreaId: newId } : c
            );

            return {
                ...prev,
                knowledgeAreas: newAreas,
                courses: newCourses
            };
        }));

        setEditingId(null);
    };

    const deleteArea = (id: string) => {
        // Check if used
        const usedCount = courses.filter(c => c.knowledgeAreaId === id).length;
        if (usedCount > 0) {
            alert(language === 'vi' ? `Không thể xóa: Có ${usedCount} môn học đang thuộc khối này.` : `Cannot delete: ${usedCount} courses are using this area.`);
            return;
        }

        if(confirm('Delete this area?')) {
            onRefresh(() => updateState(prev => ({ ...prev, knowledgeAreas: prev.knowledgeAreas.filter(a => a.id !== id) })));
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full animate-in fade-in">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2"><Layers size={16} className="text-indigo-600"/> {t.knowledgeAreaTable}</h3>
                <button onClick={addArea} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-700"><Plus size={14} /> {t.addArea}</button>
            </div>
            <div className="overflow-auto p-6 flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
                    {knowledgeAreas.map((area) => (
                        <div key={area.id} className="flex gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200 group hover:border-indigo-300 transition-colors">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: AREA_HEX_COLORS[area.color] || '#cbd5e1' }}><Layers size={20} className="text-white" /></div>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ID (Double-click to edit)</label>
                                    {editingId === area.id ? (
                                        <div className="flex gap-1">
                                            <input 
                                                className="w-full text-xs font-mono font-bold bg-white text-indigo-700 border border-indigo-500 rounded px-2 py-1.5 focus:outline-none" 
                                                value={tempIdValue} 
                                                onChange={e => setTempIdValue(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleSaveId()}
                                                autoFocus
                                            />
                                            <button onClick={handleSaveId} className="bg-emerald-500 text-white p-1 rounded hover:bg-emerald-600"><Check size={12}/></button>
                                            <button onClick={() => setEditingId(null)} className="bg-slate-300 text-slate-600 p-1 rounded hover:bg-slate-400"><X size={12}/></button>
                                        </div>
                                    ) : (
                                        <div 
                                            className="w-full text-xs font-mono font-bold bg-slate-200 text-slate-600 border border-transparent rounded px-2 py-1.5 cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
                                            onDoubleClick={() => startEditingId(area)}
                                            title="Double click to rename ID"
                                        >
                                            {area.id}
                                        </div>
                                    )}
                                </div>
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Name (VI)</label><input className="w-full text-sm font-bold bg-white border border-slate-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none" value={area.name.vi} onChange={(e) => updateArea(area.id, 'name_vi', e.target.value)} /></div>
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Name (EN)</label><input className="w-full text-sm font-bold bg-white border border-slate-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none" value={area.name.en} onChange={(e) => updateArea(area.id, 'name_en', e.target.value)} /></div>
                            </div>
                            <div className="w-32"><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Color</label><select className="w-full text-xs font-bold bg-white border border-slate-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" value={area.color} onChange={(e) => updateArea(area.id, 'color', e.target.value)}>{Object.keys(AREA_HEX_COLORS).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                            <button onClick={() => deleteArea(area.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MappingCourseBlockModule;

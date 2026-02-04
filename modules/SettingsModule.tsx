
import React, { useState } from 'react';
import { AppState } from '../types';
import { TRANSLATIONS } from '../constants';
import { 
  Save, Key, Check, AlertTriangle, RefreshCw, Trash2, MessageSquare, ChevronDown, 
  ChevronUp, Shield, ShieldOff, Info, Wrench
} from 'lucide-react';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  onRepair: () => void;
}

const SettingsModule: React.FC<Props> = ({ state, updateState, onRepair }) => {
  const { language, geminiConfig, authEnabled } = state;
  const t = TRANSLATIONS[language];
  
  // Basic Config State
  const [model, setModel] = useState(geminiConfig.model);
  const [apiKey, setApiKey] = useState(geminiConfig.apiKey || '');
  const [prompts, setPrompts] = useState(geminiConfig.prompts);
  const [showPrompts, setShowPrompts] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const saveConfig = () => {
    updateState(prev => ({
      ...prev,
      geminiConfig: {
        ...prev.geminiConfig,
        model,
        apiKey: apiKey.trim() || undefined,
        prompts
      }
    }));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const toggleAuthRequirement = () => {
    const newValue = !authEnabled;
    const confirmMsg = language === 'vi' 
      ? (newValue ? "Bật yêu cầu đăng nhập bằng Google?" : "Tắt yêu cầu đăng nhập? Bất kỳ ai có liên kết đều có thể truy cập hệ thống.") 
      : (newValue ? "Enable Google Sign-In requirement?" : "Disable login requirement? Anyone with the link can access the system.");

    if (confirm(confirmMsg)) {
        updateState(prev => ({ ...prev, authEnabled: newValue }));
    }
  };

  const clearData = () => {
      const msg = language === 'vi' 
        ? 'CẢNH BÁO: Thao tác này sẽ xóa TOÀN BỘ dữ liệu thiết kế (Môn học, Giảng viên, PEOs, SOs, Sứ mạng, Thư viện và các Ma trận liên kết). Bạn có chắc chắn muốn thực hiện?' 
        : 'WARNING: This will clear ALL design data (Courses, Faculty, PEOs, SOs, Mission, Library, and all Mapping Matrices). Are you sure?';

      if (confirm(msg)) {
          updateState(prev => ({
              ...prev,
              // Clear Curriculum Design Core
              courses: [],
              faculties: [],
              facilities: [],
              library: [],
              peos: [],
              sos: [],
              mission: {
                  text: { vi: '', en: '' },
                  constituents: []
              },
              // Clear All Mapping Matrices
              courseSoMap: [],
              coursePiMap: [],
              coursePeoMap: [],
              peoSoMap: [],
              peoConstituentMap: [],
              // Reset Program Specifications
              generalInfo: {
                  ...prev.generalInfo,
                  history: { vi: '', en: '' },
                  contact: { vi: '', en: '' },
                  deliveryModes: { vi: '', en: '' },
                  locations: { vi: '', en: '' },
                  previousEvaluations: {
                      weaknesses: { vi: '', en: '' },
                      actions: { vi: '', en: '' },
                      status: { vi: '', en: '' }
                  },
                  moetInfo: {
                      ...prev.generalInfo.moetInfo,
                      generalObjectives: { vi: '', en: '' },
                      specificObjectives: [],
                      programStructure: { gen: [], phys: [], fund: [], spec: [], grad: [] },
                      courseObjectiveMap: []
                  }
              }
          }));
          alert(language === 'vi' ? "Dữ liệu đã được xóa sạch." : "Data has been cleared.");
      }
  };

  const normalizeData = () => {
    const confirmMsg = language === 'vi' 
        ? "Thao tác này sẽ:\n1. Chuẩn hóa ID cho Môn học và Giảng viên.\n2. Xóa các liên kết mapping bị lỗi.\n3. Xoá bỏ môn học thừa trong Cấu trúc chương trình (Module 8) không tồn tại trong danh mục.\n\nTiếp tục?" 
        : "This will:\n1. Standardize IDs for Courses and Faculty.\n2. Remove broken mapping links.\n3. Remove orphaned courses in Program Structure (Module 8) that do not exist in the catalog.\n\nContinue?";

    if (!confirm(confirmMsg)) return;

    updateState(prev => {
        const idMap = {
            courses: new Map<string, string>(),
            faculty: new Map<string, string>(),
        };

        const genId = (prefix: string, seed: string | number) => `${prefix}-${seed}`;

        const newFaculties = prev.faculties.map((f, i) => {
            const safeName = f.name[prev.language].normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 10);
            const newId = genId('fac', `${safeName}_${i}`);
            idMap.faculty.set(f.id, newId);
            return { ...f, id: newId };
        });

        const newCourses = prev.courses.map((c, i) => {
            let baseId = c.code.trim().toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
            if (!baseId || baseId.length < 2) baseId = genId('CID', i);
            if (Array.from(idMap.courses.values()).includes(baseId)) baseId = `${baseId}_${i}`;
            idMap.courses.set(c.id, baseId);
            
            const newInstructorIds = c.instructorIds.map(fid => idMap.faculty.get(fid) || fid).filter(id => newFaculties.some(f => f.id === id));
            const newInstructorDetails: any = {};
            Object.keys(c.instructorDetails || {}).forEach(oldFid => {
                const newFid = idMap.faculty.get(oldFid);
                if (newFid && newFaculties.some(f => f.id === newFid)) {
                    newInstructorDetails[newFid] = c.instructorDetails![oldFid];
                }
            });

            return { ...c, id: baseId, instructorIds: newInstructorIds, instructorDetails: newInstructorDetails };
        });

        const newCourseSoMap = prev.courseSoMap.map(m => ({ ...m, courseId: idMap.courses.get(m.courseId) || m.courseId })).filter(m => newCourses.some(c => c.id === m.courseId));
        const newCoursePiMap = prev.coursePiMap.map(m => ({ ...m, courseId: idMap.courses.get(m.courseId) || m.courseId })).filter(m => newCourses.some(c => c.id === m.courseId));
        const newCoursePeoMap = prev.coursePeoMap.map(m => ({ ...m, courseId: idMap.courses.get(m.courseId) || m.courseId })).filter(m => newCourses.some(c => c.id === m.courseId));

        const cleanStructureList = (list: string[] = []) => list.map(id => idMap.courses.get(id) || id).filter(id => newCourses.some(c => c.id === id));

        const newProgramStructure = {
            gen: cleanStructureList(prev.generalInfo.moetInfo.programStructure.gen),
            phys: cleanStructureList(prev.generalInfo.moetInfo.programStructure.phys || []),
            fund: cleanStructureList(prev.generalInfo.moetInfo.programStructure.fund),
            spec: cleanStructureList(prev.generalInfo.moetInfo.programStructure.spec),
            grad: cleanStructureList(prev.generalInfo.moetInfo.programStructure.grad),
        };

        const newCourseObjectiveMap = (prev.generalInfo.moetInfo.courseObjectiveMap || []).map(str => {
            const [cid, oid] = str.split('|');
            const newCid = idMap.courses.get(cid) || cid;
            return newCourses.some(c => c.id === newCid) ? `${newCid}|${oid}` : null;
        }).filter(Boolean) as string[];

        return {
            ...prev,
            courses: newCourses, faculties: newFaculties, courseSoMap: newCourseSoMap, coursePiMap: newCoursePiMap, coursePeoMap: newCoursePeoMap,
            generalInfo: { ...prev.generalInfo, moetInfo: { ...prev.generalInfo.moetInfo, programStructure: newProgramStructure, courseObjectiveMap: newCourseObjectiveMap } }
        };
    });
    alert(language === 'vi' ? "Dữ liệu đã được chuẩn hóa và làm sạch!" : "Data normalized and cleaned!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 p-8 animate-in fade-in">
      {/* Security & Access Settings */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-600">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Shield className="text-indigo-600" size={20}/> {t.security}
            </h2>
            <div 
              onClick={toggleAuthRequirement}
              className={`w-14 h-7 rounded-full flex items-center p-1 cursor-pointer transition-all duration-300 ${authEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${authEnabled ? 'translate-x-7' : 'translate-x-0'} flex items-center justify-center`}>
                {authEnabled ? <Shield size={12} className="text-indigo-600"/> : <ShieldOff size={12} className="text-slate-400"/>}
              </div>
            </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl flex items-start gap-4">
            <div className={`p-2 rounded-lg ${authEnabled ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                {authEnabled ? <Shield size={20}/> : <AlertTriangle size={20}/>}
            </div>
            <div>
                <p className="text-sm font-bold text-slate-800">
                    {authEnabled ? t.authRequirement + ": ENABLED" : t.authRequirement + ": DISABLED"}
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {authEnabled ? t.authEnabledDesc : t.authDisabledDesc}
                </p>
            </div>
        </div>
      </section>

      {/* AI Configuration */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Key className="text-indigo-600" size={20}/> AI Configuration (Gemini)
        </h2>
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Model</label>
                    <select 
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={model}
                        onChange={e => setModel(e.target.value)}
                    >
                        <option value="gemini-3-flash-preview">Gemini 3 Flash (Fast)</option>
                        <option value="gemini-3-pro-preview">Gemini 3 Pro (High Quality)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">API Key (Optional)</label>
                    <input 
                        type="password"
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="System default if empty..."
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                    />
                </div>
                <div className="md:col-span-2">
                    <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2">
                      <Info size={14} className="inline mt-0.5 text-indigo-500 shrink-0" />
                      <span>
                        {language === 'vi' 
                          ? 'Nếu bạn nhập API Key ở đây, nó sẽ được ưu tiên sử dụng thay cho biến môi trường hệ thống. Key này chỉ lưu trong trình duyệt của bạn và KHÔNG được xuất ra khi bạn "Xuất dữ liệu".' 
                          : 'If you enter an API Key here, it will be used instead of the system environment variable. This key is stored locally in your browser and is NOT exported when you use "Export Data".'}
                      </span>
                    </p>
                </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-2">
                <button 
                    onClick={() => setShowPrompts(!showPrompts)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                    <MessageSquare size={14} /> 
                    {language === 'vi' ? 'Tùy chỉnh Prompts nâng cao' : 'Advanced Prompt Customization'}
                    {showPrompts ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                </button>
                {showPrompts && (
                    <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
                        {Object.entries(prompts).map(([key, value]) => (
                            <div key={key}>
                                <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-wider">{key}</label>
                                <textarea 
                                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-mono bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-y"
                                    value={value}
                                    onChange={e => setPrompts(prev => ({ ...prev, [key]: e.target.value }))}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button 
                onClick={saveConfig}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
                {showSuccess ? <Check size={16}/> : <Save size={16}/>} {language === 'vi' ? 'Lưu thay đổi' : 'Save Configuration'}
            </button>
        </div>
      </section>
      
      {/* Advanced Tools */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
         <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20}/> {language === 'vi' ? 'Công cụ hệ thống nâng cao' : 'Advanced System Tools'}
        </h2>
        <div className="space-y-4">
            <p className="text-sm text-slate-600 font-medium">
                {language === 'vi' ? 'Sử dụng các công cụ này để làm sạch và sửa lỗi dữ liệu. Hãy sao lưu dữ liệu trước khi thực hiện.' : 'Use these tools to fix data inconsistencies. Backup your data before proceeding.'}
            </p>
            <div className="flex flex-wrap gap-4">
                <button 
                    onClick={normalizeData}
                    className="bg-amber-100 text-amber-700 px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-amber-200 border border-amber-200 transition-all shadow-sm"
                >
                    <RefreshCw size={16}/> {language === 'vi' ? 'Chuẩn hóa ID & Làm sạch' : 'Normalize & Clean'}
                </button>
                <button 
                    onClick={onRepair}
                    className="bg-sky-100 text-sky-700 px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-sky-200 border border-sky-200 transition-all shadow-sm"
                >
                    <Wrench size={16}/> {language === 'vi' ? 'Sửa chữa & Đồng bộ' : 'Repair & Sync'}
                </button>
                <button 
                    onClick={clearData}
                    className="bg-red-50 text-red-600 px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-100 border border-red-200 transition-all shadow-sm"
                >
                    <Trash2 size={16}/> {language === 'vi' ? 'Xóa toàn bộ' : 'Clear All Data'}
                </button>
            </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsModule;

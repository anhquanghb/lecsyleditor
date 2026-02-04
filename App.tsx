
import React, { useState, useEffect } from 'react';
import { AppState, MoetSubBlock } from './types';
import { INITIAL_STATE, CODE_VERSION } from './constants';
import Layout from './components/Layout';
import StrategyModule from './modules/StrategyModule';
import OutcomesModule from './modules/OutcomesModule';
import MappingModule from './modules/MappingModule';
import FlowchartModule from './modules/FlowchartModule';
import SyllabusModule from './modules/SyllabusModule';
import LibraryModule from './modules/LibraryModule';
import FacultyModule from './modules/FacultyModule';
import FacilityModule from './modules/FacilityModule';
import DepartmentModule from './modules/DepartmentModule'; 
import AnalyticsModule from './modules/AnalyticsModule';
import GeneralInfoModule from './modules/GeneralInfoModule';
import TransformationModule from './modules/TransformationModule';
import SettingsModule from './modules/SettingsModule';
import UserManagementModule from './modules/UserManagementModule';
import JSONInputModule from './modules/JSONInputModule';
import CoverPage from './components/CoverPage'; // Import CoverPage
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

// Mock Login Component
const LoginScreen = ({ onLogin }: { onLogin: () => void }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-slate-100">
    <div className="bg-white p-8 rounded-xl shadow-xl text-center">
      <h1 className="text-2xl font-bold mb-4 text-indigo-700">DTU Lec-Editor</h1>
      <p className="mb-6 text-slate-600">Please sign in to access the curriculum system.</p>
      <button onClick={onLogin} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
        Sign In with Google
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  // Load state from localStorage or use INITIAL_STATE
  const [state, setState] = useState<AppState>(() => {
    try {
        const saved = localStorage.getItem('appState');
        return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch (e) {
        console.error("Failed to load state", e);
        return INITIAL_STATE;
    }
  });

  const [currentModule, setCurrentModule] = useState('strategy');
  // For SyllabusModule coordination
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  
  // Version Check State
  const [showVersionModal, setShowVersionModal] = useState(false);

  // Cover Page State - Default true to show on load
  const [showCoverPage, setShowCoverPage] = useState(true);

  useEffect(() => {
    localStorage.setItem('appState', JSON.stringify(state));
  }, [state]);

  // Version Check on Mount
  useEffect(() => {
      // Check if version is missing or outdated
      if (!state.version || state.version !== CODE_VERSION) {
          setShowVersionModal(true);
      }
  }, []);

  const updateState = (updater: (prev: AppState) => AppState) => {
    setState(prev => updater(prev));
  };

  const handleLogin = () => {
    // Mock login logic - typically handled via OAuth
    updateState(prev => ({
        ...prev,
        currentUser: prev.users[0] // Login as Admin 'u1' for demo
    }));
  };

  const handleLogout = () => {
    updateState(prev => ({ ...prev, currentUser: null }));
  };

  const handleExport = () => {
    const date = new Date().toISOString().split('T')[0];
    
    // Filter out hardcoded admin 'u1' for export to keep data clean if needed
    // AND STRIP API KEY
    const exportState = {
        ...state,
        version: CODE_VERSION, // Ensure export has current code version
        users: state.users.filter(u => u.id !== 'u1'),
        geminiConfig: {
            ...state.geminiConfig,
            apiKey: undefined // Ensure API key is NOT exported
        }
    };

    const majorCode = state.generalInfo.moetInfo.majorCode || 'UnknownCode';
    const specNameRaw = state.generalInfo.moetInfo.specializationName['en'] || 
                        state.generalInfo.moetInfo.specializationName[state.language] || 
                        'General';
    
    const sanitize = (str: string) => str.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
    const specName = sanitize(specNameRaw);
    const safeMajorCode = sanitize(majorCode);

    const filename = `PROG_Data_${safeMajorCode}_${specName}_${date}_v${CODE_VERSION}.json`;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportState, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const parsed = JSON.parse(evt.target?.result as string);
              if (confirm("Restore state from file? This will overwrite current data.")) {
                  setState(prev => ({ 
                      ...parsed, 
                      currentUser: prev.currentUser || parsed.currentUser,
                      // Preserve existing API key if present in current state, ignore import key
                      geminiConfig: {
                          ...parsed.geminiConfig,
                          apiKey: prev.geminiConfig?.apiKey
                      }
                  })); 
              }
          } catch(e) {
              alert("Import failed. Invalid JSON.");
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  // --- REPAIR DATA LOGIC (Moved from Settings to be available globally) ---
  const handleRepairData = () => {
    // 1. Repair Faculty Titles (Standardize)
    const newFacultyTitles = {
        ranks: state.facultyTitles?.ranks || INITIAL_STATE.facultyTitles.ranks,
        degrees: state.facultyTitles?.degrees || INITIAL_STATE.facultyTitles.degrees,
        academicTitles: state.facultyTitles?.academicTitles || INITIAL_STATE.facultyTitles.academicTitles,
        positions: state.facultyTitles?.positions || INITIAL_STATE.facultyTitles.positions,
    };

    // 2. Repair Configs
    const newTeachingMethods = (state.teachingMethods && state.teachingMethods.length > 0)
        ? state.teachingMethods
        : INITIAL_STATE.teachingMethods;

    const newAssessmentMethods = (state.assessmentMethods && state.assessmentMethods.length > 0)
        ? state.assessmentMethods
        : INITIAL_STATE.assessmentMethods;

    // 3. Repair Organization (Schools, Faculties, Departments)
    const newSchools = Array.isArray(state.academicSchools) ? state.academicSchools : (INITIAL_STATE.academicSchools || []);
    const newAcademicFaculties = Array.isArray(state.academicFaculties) ? state.academicFaculties : (INITIAL_STATE.academicFaculties || []);
    const newDepartments = Array.isArray(state.departments) ? state.departments : (INITIAL_STATE.departments || []);

    // 4. Repair Courses (Add CLOs, Department links, etc.)
    const newCourses = (state.courses || []).map(c => ({
        ...c,
        isEssential: c.isEssential ?? false,
        isAbet: c.isAbet !== undefined ? c.isAbet : (c.isEssential ?? false),
        knowledgeAreaId: c.knowledgeAreaId || 'other',
        type: c.type || 'REQUIRED',
        // Ensure new fields exist
        departmentId: c.departmentId || undefined,
        instructorIds: c.instructorIds || [],
        instructorDetails: c.instructorDetails || {},
        textbooks: c.textbooks || [],
        topics: c.topics || [],
        assessmentPlan: c.assessmentPlan || [],
        // Critical for Syllabus Module
        clos: c.clos && Array.isArray(c.clos.vi) && Array.isArray(c.clos.en) ? c.clos : { vi: [], en: [] },
        cloMap: Array.isArray(c.cloMap) ? c.cloMap : [],
        coRequisites: c.coRequisites || []
    }));

    // 5. Repair Faculties
    const newFaculties = (state.faculties || []).map(f => ({
        ...f,
        departmentId: f.departmentId || undefined, // Add Dept Link
        certificationsList: f.certificationsList || [],
        membershipsList: f.membershipsList || [],
        honorsList: f.honorsList || [],
        serviceActivitiesList: f.serviceActivitiesList || [],
        professionalDevelopmentList: f.professionalDevelopmentList || []
    }));

    // 6. Repair General Info & MOET
    let subBlocks: MoetSubBlock[] = (state.generalInfo.moetInfo?.subBlocks || []).map(sb => ({
        ...sb,
        type: sb.type || 'ELECTIVE'
    }));

    // Ensure 'phys' is present in programStructure
    const rawStructure = (state.generalInfo.moetInfo?.programStructure || {}) as any;
    const structure = {
        gen: rawStructure.gen || [],
        phys: rawStructure.phys || [], // Add Physical Education if missing
        fund: rawStructure.fund || [],
        spec: rawStructure.spec || [],
        grad: rawStructure.grad || []
    };

    // Migration logic for flat lists -> compulsory blocks
    (['gen', 'phys', 'fund', 'spec', 'grad'] as const).forEach(key => {
        const ids = structure[key] || [];
        if (ids.length > 0) {
            const hasCompulsory = subBlocks.some(sb => sb.parentBlockId === key && sb.type === 'COMPULSORY');
            if (!hasCompulsory) {
                const newBlock: MoetSubBlock = {
                    id: `sb-migrated-${key}-${Date.now()}`,
                    name: { vi: 'Các học phần bắt buộc', en: 'Compulsory Courses' },
                    parentBlockId: key,
                    type: 'COMPULSORY',
                    minCredits: 0,
                    courseIds: [...ids],
                    note: { vi: 'Tự động tạo từ dữ liệu cũ', en: 'Auto-migrated from legacy data' }
                };
                subBlocks.push(newBlock);
            }
        }
    });

    const newMoetInfo = {
        ...state.generalInfo.moetInfo,
        subBlocks: subBlocks,
        programStructure: structure,
        moetSpecificObjectives: state.generalInfo.moetInfo?.moetSpecificObjectives || [],
        programFaculty: state.generalInfo.moetInfo?.programFaculty || [] // Ensure this exists
    };

    // 7. Repair Others
    const newLibrary = (state.library || []).map(l => ({ ...l, isEbook: l.isEbook ?? false, isPrinted: l.isPrinted ?? true }));
    const newFacilities = state.facilities || [];

    updateState(prev => ({
        ...prev,
        version: CODE_VERSION, // Update version to match code
        authEnabled: prev.authEnabled ?? false,
        geminiConfig: {
            ...prev.geminiConfig,
            prompts: prev.geminiConfig?.prompts || INITIAL_STATE.geminiConfig.prompts
        },
        academicSchools: newSchools,
        academicFaculties: newAcademicFaculties,
        departments: newDepartments, 
        facultyTitles: newFacultyTitles,
        teachingMethods: newTeachingMethods,
        assessmentMethods: newAssessmentMethods,
        courses: newCourses,
        faculties: newFaculties,
        facilities: newFacilities,
        library: newLibrary,
        generalInfo: {
            ...prev.generalInfo,
            moetInfo: newMoetInfo
        }
    }));

    setShowVersionModal(false);
    alert(state.language === 'vi' ? "Đã sửa chữa, đồng bộ dữ liệu và cập nhật phiên bản!" : "Data repaired, synced, and version updated!");
  };

  // Auth Guard
  if (state.authEnabled && !state.currentUser) {
      return <LoginScreen onLogin={handleLogin} />;
  }

  // Cover Page Guard
  if (showCoverPage) {
      return <CoverPage onStart={() => {
          setShowCoverPage(false);
          setCurrentModule('json-input');
      }} language={state.language} />;
  }

  const renderModule = () => {
    switch (currentModule) {
      case 'strategy': return <StrategyModule state={state} updateState={updateState} />;
      case 'outcomes': return <OutcomesModule state={state} updateState={updateState} />;
      case 'mapping': return <MappingModule state={state} updateState={updateState} />;
      case 'flowchart': return <FlowchartModule state={state} updateState={updateState} onCourseNavigate={(id) => { setSelectedCourseId(id); setCurrentModule('syllabus'); }} />;
      case 'departments': return <DepartmentModule state={state} updateState={updateState} />; // NEW CASE
      case 'syllabus': return <SyllabusModule state={state} updateState={updateState} selectedCourseId={selectedCourseId} setSelectedCourseId={setSelectedCourseId} />;
      case 'library': return <LibraryModule state={state} updateState={updateState} />;
      case 'faculty': return <FacultyModule state={state} updateState={updateState} />;
      case 'facilities': return <FacilityModule state={state} updateState={updateState} />;
      case 'analytics': return <AnalyticsModule state={state} updateState={updateState} />;
      case 'general': return <GeneralInfoModule state={state} updateState={updateState} />;
      case 'transformation': return <TransformationModule state={state} updateState={updateState} />;
      case 'settings': return <SettingsModule state={state} updateState={updateState} onRepair={handleRepairData} />;
      case 'users': return <UserManagementModule state={state} updateState={updateState} />;
      case 'json-input': return <JSONInputModule state={state} updateState={updateState} onExport={handleExport} />;
      default: return <StrategyModule state={state} updateState={updateState} />;
    }
  };

  return (
    <>
      <Layout 
        state={state} 
        setLanguage={(lang) => updateState(prev => ({ ...prev, language: lang }))}
        currentModule={currentModule}
        setCurrentModule={setCurrentModule}
        onExport={handleExport}
        onImport={handleImport}
        onLogout={handleLogout}
      >
        {renderModule()}
      </Layout>

      {/* Version Mismatch Modal */}
      {showVersionModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-amber-300">
                  <div className="p-6 bg-amber-50 border-b border-amber-100 flex items-start gap-4">
                      <div className="p-3 bg-amber-100 rounded-full text-amber-600 shrink-0">
                          <AlertTriangle size={32} />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-amber-900 mb-1">
                              {state.language === 'vi' ? 'Cảnh báo Phiên bản Dữ liệu' : 'Data Version Warning'}
                          </h3>
                          <p className="text-sm text-amber-700">
                              {state.language === 'vi' 
                                  ? `Dữ liệu hiện tại (v${state.version || 'unknown'}) cũ hơn phiên bản mã nguồn (v${CODE_VERSION}). Điều này có thể gây lỗi hiển thị.` 
                                  : `Current data (v${state.version || 'unknown'}) is older than source code (v${CODE_VERSION}). This may cause display errors.`}
                          </p>
                      </div>
                  </div>
                  <div className="p-6 space-y-4">
                      <p className="text-sm text-slate-600 leading-relaxed">
                          {state.language === 'vi'
                              ? 'Hệ thống cần chạy quy trình "Sửa chữa & Đồng bộ" để cập nhật cấu trúc dữ liệu mới nhất (thêm trường thiếu, chuẩn hóa ID, v.v.). Dữ liệu của bạn sẽ không bị mất.'
                              : 'The system needs to run "Repair & Sync" to update data structure (add missing fields, normalize IDs, etc.). Your data will not be lost.'}
                      </p>
                      <div className="flex gap-3 pt-2">
                          <button 
                              onClick={() => setShowVersionModal(false)}
                              className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm"
                          >
                              {state.language === 'vi' ? 'Bỏ qua (Rủi ro)' : 'Ignore (Risky)'}
                          </button>
                          <button 
                              onClick={handleRepairData}
                              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 text-sm flex items-center justify-center gap-2"
                          >
                              <RefreshCw size={16}/>
                              {state.language === 'vi' ? 'Cập nhật ngay' : 'Update Now'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </>
  );
};

export default App;

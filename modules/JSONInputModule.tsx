
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppState, Faculty, Course, LibraryResource, GeneralInfo } from '../types';
import { FileJson, Upload, X, AlertTriangle, Check, Copy, Plus, BookOpen, Merge, RefreshCw, Trash2, ArrowRight, Search, Info, ExternalLink, Sparkles, Database, Download, CheckCircle2, ListFilter, BrainCircuit, MessageSquare, Layout, Eye, Code, HelpCircle, Play, Send, FileInput, Building, Archive, Loader2 } from 'lucide-react';
import { INITIAL_STATE, TRANSLATIONS } from '../constants';
import { getGeminiResponse } from '../services/geminiService';
import JSZip from 'jszip';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  onExport: () => void;
}

// --- Similarity Logic ---
const normalizeStr = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
};

const getLevenshteinDistance = (a: string, b: string) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const calculateSimilarity = (s1: string, s2: string) => {
  const n1 = normalizeStr(s1);
  const n2 = normalizeStr(s2);
  if (!n1 && !n2) return 1;
  if (!n1 || !n2) return 0;
  if (n1 === n2) return 1;
  
  const longer = n1.length > n2.length ? n1 : n2;
  const dist = getLevenshteinDistance(n1, n2);
  return (longer.length - dist) / longer.length;
};

// --- Import Options Type ---
type ImportSection = 'general' | 'strategy' | 'courses' | 'faculty' | 'matrices' | 'settings';

const JSONInputModule: React.FC<Props> = ({ state, updateState, onExport }) => {
  const { language, library, courses, geminiConfig, peos, sos, faculties, currentUser } = state;
  const t = TRANSLATIONS[language];
  
  // Modal State
  const [activeModal, setActiveModal] = useState<'cv' | 'syllabus' | 'library_dedupe' | null>(null);
  
  // Specific Import State
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Export State
  const [isZipping, setIsZipping] = useState(false);

  // Conflict Data State: Updated to support "New" items (existingItem: null, isNew: true)
  const [conflictData, setConflictData] = useState<{ 
      item: Faculty | Course, 
      existingItem: Faculty | Course | null, 
      type: 'cv' | 'syllabus', 
      matchReason: 'id' | 'name' | 'none',
      isNew: boolean 
  } | null>(null);

  // Full System Import State
  const jsonImportRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<AppState | null>(null);
  const [importOptions, setImportOptions] = useState<Record<ImportSection, boolean>>({
      general: true,
      strategy: true,
      courses: true,
      faculty: true,
      matrices: true,
      settings: true
  });

  // Library Dedupe State
  const [duplicateGroups, setDuplicateGroups] = useState<LibraryResource[][]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const [targetResourceId, setTargetResourceId] = useState<string | null>(null);

  // AI Canvas Chat State
  const [canvasMessages, setCanvasMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [canvasInput, setCanvasInput] = useState('');
  const [isCanvasLoading, setIsCanvasLoading] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);
  const canvasScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasScrollRef.current) {
        canvasScrollRef.current.scrollTop = canvasScrollRef.current.scrollHeight;
    }
  }, [canvasMessages]);

  const handleOpenModal = (type: 'cv' | 'syllabus' | 'library_dedupe') => {
    setActiveModal(type);
    setJsonInput('');
    setError(null);
    setConflictData(null);
    setDuplicateGroups([]);
    setSelectedGroupIndex(null);
    setTargetResourceId(null);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setConflictData(null);
  };

  // --- Logic: Individual Files ZIP Export ---
  const handleSmartZipExport = async () => {
      setIsZipping(true);
      try {
          const zip = new JSZip();
          const dateStr = new Date().toISOString().split('T')[0];
          
          // Determine if we are exporting for a specific Lecturer or Full System
          const linkedFaculty = faculties.find(f => f.email === currentUser?.email);
          
          let rootFolderName = `DTU_Data_Export_${dateStr}`;
          let targetFaculties = faculties;
          
          // If a lecturer is logged in (and matches a faculty profile), filter scope
          if (linkedFaculty) {
              // 1. Rename ZIP to Lecturer Name (No Accents, snake_case)
              const rawName = linkedFaculty.name[language] || linkedFaculty.name['en'] || 'Lecturer';
              const normalizedName = rawName
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "") // Remove accents
                  .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special chars
                  .trim()
                  .replace(/\s+/g, '_'); // Replace spaces with underscore
              
              rootFolderName = normalizedName;
              targetFaculties = [linkedFaculty]; // Only process this faculty
          }

          const rootFolder = zip.folder(rootFolderName);
          if (!rootFolder) throw new Error("Failed to create zip folder");

          // 1. Export Faculties and their related Courses
          targetFaculties.forEach(f => {
              const safeName = (f.name[language] || 'Unknown').replace(/[^a-z0-9\u00C0-\u017F\s]/gi, '_').trim();
              
              // A. Export CV
              // Structure: If single lecturer, put CV directly in root or neatly organized
              // For consistency, let's keep files in root for single export
              rootFolder.file(`CV_${safeName}.json`, JSON.stringify(f, null, 2));

              // B. Find Related Courses
              const relatedCourses = courses.filter(c => c.instructorIds.includes(f.id));
              
              if (relatedCourses.length > 0) {
                  const syllabusFolder = rootFolder.folder("Syllabus");
                  relatedCourses.forEach(c => {
                      const safeCode = c.code.replace(/[^a-z0-9]/gi, '_');
                      syllabusFolder?.file(`Syllabus_${safeCode}.json`, JSON.stringify(c, null, 2));
                  });
              }
          });

          // 3. Generate ZIP
          const blob = await zip.generateAsync({ type: 'blob' });
          
          // Trigger Download
          const downloadAnchorNode = document.createElement('a');
          const url = URL.createObjectURL(blob);
          downloadAnchorNode.setAttribute("href", url);
          downloadAnchorNode.setAttribute("download", `${rootFolderName}.zip`);
          document.body.appendChild(downloadAnchorNode);
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
          URL.revokeObjectURL(url);

      } catch (err) {
          console.error(err);
          alert(language === 'vi' ? 'Lỗi khi tạo file nén.' : 'Error creating zip file.');
      } finally {
          setIsZipping(false);
      }
  };

  // --- Logic: Full JSON Export (Backup) ---
  const handleFullJsonExport = () => {
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `DTU_Full_Backup_${dateStr}.json`;
      
      // Clean sensitive data before export
      const exportState = { 
          ...state, 
          currentUser: null,
          geminiConfig: {
              ...state.geminiConfig,
              apiKey: undefined // Don't export API keys
          }
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportState, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", filename);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  // --- Logic: Import CV/Syllabus (Existing) ---
  const processImport = () => {
    setError(null);
    try {
      const data = JSON.parse(jsonInput);
      const items = Array.isArray(data) ? data : [data];
      
      if (items.length === 0) {
        setError("Empty data.");
        return;
      }

      if (activeModal === 'cv') {
        const item = items[0] as Faculty;
        if (!item.name || !item.email) throw new Error("Invalid Faculty JSON format (Missing name or email)");
        
        // 1. Check ID Match
        let existing = state.faculties.find(f => f.id === item.id);
        let matchReason: 'id' | 'name' | 'none' = 'id';

        // 2. If no ID match, Check Name Match (Fuzzy-ish exact match on normalized string)
        if (!existing) {
            const cleanInputVi = normalizeStr(item.name.vi || '');
            const cleanInputEn = normalizeStr(item.name.en || '');
            
            existing = state.faculties.find(f => {
                const fVi = normalizeStr(f.name.vi || '');
                const fEn = normalizeStr(f.name.en || '');
                return (cleanInputVi && fVi === cleanInputVi) || (cleanInputEn && fEn === cleanInputEn);
            });
            if (existing) matchReason = 'name';
        }

        if (existing) {
          setConflictData({ item, existingItem: existing, type: 'cv', matchReason: matchReason as 'id' | 'name', isNew: false });
        } else {
          // No conflict, but confirm as new import
          setConflictData({ item, existingItem: null, type: 'cv', matchReason: 'none', isNew: true });
        }
        setActiveModal(null); // Close input modal, but keep conflictData to show confirmation

      } else if (activeModal === 'syllabus') {
        const item = items[0] as Course;
        if (!item.code || !item.name) throw new Error("Invalid Course JSON format (Missing code or name)");
        
        const existing = state.courses.find(c => c.id === item.id);
        
        if (existing) {
          setConflictData({ item, existingItem: existing, type: 'syllabus', matchReason: 'id', isNew: false });
        } else {
          // No conflict, but confirm as new import
          setConflictData({ item, existingItem: null, type: 'syllabus', matchReason: 'none', isNew: true });
        }
        setActiveModal(null); // Close input modal, but keep conflictData to show confirmation
      }

    } catch (err) {
      setError(language === 'vi' ? "Lỗi JSON: " + (err as Error).message : "JSON Error: " + (err as Error).message);
    }
  };

  const handleOverwrite = () => {
    if (!conflictData || !conflictData.existingItem) return;
    const { item, existingItem, type } = conflictData;

    if (type === 'cv') {
        // IMPORTANT: When overwriting, we MUST preserve the EXISTING ID to maintain relationships (courses, etc.)
        // We take the new data (item) but force the id to be existingItem.id
        const mergedItem = { ...item, id: existingItem.id };

        updateState(prev => ({
            ...prev,
            faculties: prev.faculties.map(f => f.id === existingItem.id ? (mergedItem as Faculty) : f)
        }));
    } else {
        // For courses: Preserve Catalog/Administrative Metadata AND INSTRUCTORS, only overwrite Syllabus Content
        const exC = existingItem as Course;
        const newC = item as Course;

        const mergedItem: Course = {
            ...newC, // Take new content (Description, Textbooks, Topics, Assessment, CLOs, etc.)
            id: exC.id, // Preserve ID
            // Preserve Catalog Metadata
            code: exC.code,
            name: exC.name,
            credits: exC.credits,
            semester: exC.semester,
            type: exC.type,
            prerequisites: exC.prerequisites,
            coRequisites: exC.coRequisites,
            isEssential: exC.isEssential,
            isAbet: exC.isAbet,
            knowledgeAreaId: exC.knowledgeAreaId,
            departmentId: exC.departmentId, // Preserve Dept Link
            // Preserve Instructor Assignments
            instructorIds: exC.instructorIds,
            instructorDetails: exC.instructorDetails
        };

        updateState(prev => ({
            ...prev,
            courses: prev.courses.map(c => c.id === exC.id ? mergedItem : c)
        }));
    }
    
    alert(language === 'vi' ? "Đã ghi đè dữ liệu (Giữ nguyên thông tin khung chương trình & Giảng viên)!" : "Data overwritten (Preserved catalog & instructor metadata)!");
    setConflictData(null);
  };

  const handleCreateNew = () => {
    if (!conflictData) return;
    const { item, type } = conflictData;
    
    // Force generate new ID to avoid conflict
    const newId = `${type === 'cv' ? 'fac' : 'CID'}-${Date.now()}`;
    const newItem = { ...item, id: newId };

    if (type === 'cv') {
      updateState(prev => ({ ...prev, faculties: [...prev.faculties, newItem as Faculty] }));
    } else {
      updateState(prev => ({ ...prev, courses: [...prev.courses, newItem as Course] }));
    }
    alert(language === 'vi' ? "Đã thêm mới dữ liệu (Sinh ID mới)!" : "Added as new record (Generated new ID)!");
    setConflictData(null);
  };

  const handleConfirmNew = () => {
      if (!conflictData) return;
      const { item, type } = conflictData;
      
      // Use the item AS IS (preserving ID from JSON if valid and non-conflicting)
      if (type === 'cv') {
          updateState(prev => ({ ...prev, faculties: [...prev.faculties, item as Faculty] }));
      } else {
          updateState(prev => ({ ...prev, courses: [...prev.courses, item as Course] }));
      }
      
      alert(language === 'vi' ? "Đã nhập dữ liệu mới thành công!" : "New data imported successfully!");
      setConflictData(null);
  };

  // --- Logic: Library Deduplication ---
  const scanLibrary = () => {
    setIsScanning(true);
    setTimeout(() => {
      const visited = new Set<string>();
      const groups: LibraryResource[][] = [];
      const threshold = 0.7;

      // Sort by length desc to match longer titles first (better anchor)
      const sortedLib = [...library].sort((a, b) => b.title.length - a.title.length);

      for (let i = 0; i < sortedLib.length; i++) {
        if (visited.has(sortedLib[i].id)) continue;
        
        const currentGroup = [sortedLib[i]];
        visited.add(sortedLib[i].id);

        for (let j = i + 1; j < sortedLib.length; j++) {
          if (visited.has(sortedLib[j].id)) continue;
          
          const sim = calculateSimilarity(sortedLib[i].title, sortedLib[j].title);
          
          // Also check author similarity if titles are close
          let authorMatch = true;
          if (sim > threshold && sortedLib[i].author && sortedLib[j].author) {
             const authorSim = calculateSimilarity(sortedLib[i].author, sortedLib[j].author);
             if (authorSim < 0.5) authorMatch = false; // Different authors -> Different books usually
          }

          if (sim > threshold && authorMatch) {
            currentGroup.push(sortedLib[j]);
            visited.add(sortedLib[j].id);
          }
        }

        if (currentGroup.length > 1) {
          groups.push(currentGroup);
        }
      }

      setDuplicateGroups(groups);
      setIsScanning(false);
    }, 100); // Async to let UI render loader
  };

  const mergeLibraryGroup = () => {
    if (selectedGroupIndex === null || !targetResourceId) return;
    const group = duplicateGroups[selectedGroupIndex];
    if (!group) return;

    // IDs to remove (all except target)
    const removeIds = group.filter(item => item.id !== targetResourceId).map(item => item.id);
    
    // Update State
    updateState(prev => {
        // 1. Update Courses (Remap IDs)
        const newCourses = prev.courses.map(course => {
            let changed = false;
            const newTextbooks = course.textbooks.map(tb => {
                if (removeIds.includes(tb.resourceId)) {
                    changed = true;
                    return { ...tb, resourceId: targetResourceId };
                }
                return tb;
            });

            if (!changed) return course;

            // Deduplicate textbooks within the course
            const uniqueTextbooks: typeof newTextbooks = [];
            const seenIds = new Set<string>();
            newTextbooks.forEach(tb => {
                if (!seenIds.has(tb.resourceId)) {
                    seenIds.add(tb.resourceId);
                    uniqueTextbooks.push(tb);
                }
            });

            return { ...course, textbooks: uniqueTextbooks };
        });

        // 2. Update Library (Remove Merged Items)
        const newLibrary = prev.library.filter(lib => !removeIds.includes(lib.id));

        return {
            ...prev,
            courses: newCourses,
            library: newLibrary
        };
    });

    // Update Local State (Remove group from UI)
    const newGroups = [...duplicateGroups];
    newGroups.splice(selectedGroupIndex, 1);
    setDuplicateGroups(newGroups);
    setSelectedGroupIndex(null);
    setTargetResourceId(null);
    
    alert(language === 'vi' ? 'Đã gộp thành công!' : 'Merged successfully!');
  };

  const calculateUsage = (resId: string) => {
      let count = 0;
      courses.forEach(c => {
          if (c.textbooks.some(t => t.resourceId === resId)) count++;
      });
      return count;
  };

  // --- Logic: Full System Import/Export (Moved from Settings) ---
  const normalizeIncomingData = (data: any): AppState => {
      // 1. Start with Initial State as baseline to ensure structure
      const base: AppState = JSON.parse(JSON.stringify(INITIAL_STATE));

      // 2. Normalize General Info (Deep Merge)
      const mergedGeneralInfo: GeneralInfo = {
          ...base.generalInfo,
          ...(data.generalInfo || {}),
          previousEvaluations: { ...base.generalInfo.previousEvaluations, ...(data.generalInfo?.previousEvaluations || {}) },
          moetInfo: {
              ...base.generalInfo.moetInfo,
              ...(data.generalInfo?.moetInfo || {}),
              programStructure: { ...base.generalInfo.moetInfo.programStructure, ...(data.generalInfo?.moetInfo?.programStructure || {}) }
          }
      };

      // 3. Normalize Courses (Ensure Arrays)
      const normalizedCourses = Array.isArray(data.courses) ? data.courses.map((c: any) => ({
          ...c,
          // Ensure critical fields exist or have defaults
          credits: typeof c.credits === 'number' ? c.credits : 0,
          isEssential: !!c.isEssential,
          isAbet: c.isAbet !== undefined ? c.isAbet : !!c.isEssential, // Legacy support
          departmentId: c.departmentId, // Maintain department link
          instructorDetails: c.instructorDetails || {},
          cloMap: Array.isArray(c.cloMap) ? c.cloMap.map((cm: any) => ({ ...cm, piIds: Array.isArray(cm.piIds) ? cm.piIds : [] })) : [],
          textbooks: Array.isArray(c.textbooks) ? c.textbooks : [],
          topics: Array.isArray(c.topics) ? c.topics : [],
          assessmentPlan: Array.isArray(c.assessmentPlan) ? c.assessmentPlan : []
      })) : [];

      // 4. Normalize Faculty
      const normalizedFaculty = Array.isArray(data.faculties) ? data.faculties : [];

      // 5. Normalize Organizational Entities
      const normalizedDepartments = Array.isArray(data.departments) ? data.departments : base.departments;
      const normalizedSchools = Array.isArray(data.academicSchools) ? data.academicSchools : base.academicSchools;
      const normalizedAcFaculties = Array.isArray(data.academicFaculties) ? data.academicFaculties : base.academicFaculties;

      // 6. Normalize Facilities
      const normalizedFacilities = Array.isArray(data.facilities) ? data.facilities : [];

      // 7. Return fully normalized state
      return {
          ...base,
          language: data.language || 'en', // Keep import language or default
          authEnabled: data.authEnabled !== undefined ? data.authEnabled : base.authEnabled,
          currentUser: base.currentUser, // Do not overwrite current user session
          users: Array.isArray(data.users) ? data.users : base.users,
          mission: data.mission || base.mission,
          peos: Array.isArray(data.peos) ? data.peos : [],
          sos: Array.isArray(data.sos) ? data.sos : [],
          courses: normalizedCourses,
          faculties: normalizedFaculty,
          academicSchools: normalizedSchools,
          academicFaculties: normalizedAcFaculties,
          departments: normalizedDepartments,
          facilities: normalizedFacilities,
          knowledgeAreas: Array.isArray(data.knowledgeAreas) ? data.knowledgeAreas : base.knowledgeAreas,
          teachingMethods: Array.isArray(data.teachingMethods) ? data.teachingMethods : base.teachingMethods,
          assessmentMethods: Array.isArray(data.assessmentMethods) ? data.assessmentMethods : base.assessmentMethods,
          facultyTitles: data.facultyTitles || base.facultyTitles,
          geminiConfig: { ...base.geminiConfig, ...(data.geminiConfig || {}) },
          generalInfo: mergedGeneralInfo,
          library: Array.isArray(data.library) ? data.library : [],
          courseSoMap: Array.isArray(data.courseSoMap) ? data.courseSoMap : [],
          coursePiMap: Array.isArray(data.coursePiMap) ? data.coursePiMap : [],
          coursePeoMap: Array.isArray(data.coursePeoMap) ? data.coursePeoMap : [],
          peoSoMap: Array.isArray(data.peoSoMap) ? data.peoSoMap : [],
          peoConstituentMap: Array.isArray(data.peoConstituentMap) ? data.peoConstituentMap : [],
      };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const rawData = JSON.parse(event.target?.result as string);
              const normalized = normalizeIncomingData(rawData);
              setPendingImport(normalized);
              e.target.value = ''; // Reset input
          } catch (err) {
              alert(language === 'vi' ? "Lỗi: File JSON không hợp lệ." : "Error: Invalid JSON file.");
          }
      };
      reader.readAsText(file);
  };

  const confirmImport = () => {
      if (!pendingImport) return;

      updateState(prev => {
          const nextState = { ...prev };

          if (importOptions.general) {
              nextState.generalInfo = pendingImport.generalInfo;
              nextState.mission = pendingImport.mission;
              nextState.library = pendingImport.library;
              // Organizational structure is grouped with General for simplicity in import
              nextState.academicSchools = pendingImport.academicSchools;
              nextState.academicFaculties = pendingImport.academicFaculties;
              nextState.departments = pendingImport.departments;
              nextState.facilities = pendingImport.facilities; // Include Facilities in General
          }
          if (importOptions.strategy) {
              nextState.peos = pendingImport.peos;
              nextState.sos = pendingImport.sos;
          }
          if (importOptions.courses) {
              nextState.courses = pendingImport.courses;
              nextState.knowledgeAreas = pendingImport.knowledgeAreas;
              nextState.teachingMethods = pendingImport.teachingMethods;
              nextState.assessmentMethods = pendingImport.assessmentMethods;
          }
          if (importOptions.faculty) {
              nextState.faculties = pendingImport.faculties;
              nextState.facultyTitles = pendingImport.facultyTitles;
          }
          if (importOptions.matrices) {
              nextState.courseSoMap = pendingImport.courseSoMap;
              nextState.coursePiMap = pendingImport.coursePiMap;
              nextState.coursePeoMap = pendingImport.coursePeoMap;
              nextState.peoSoMap = pendingImport.peoSoMap;
              nextState.peoConstituentMap = pendingImport.peoConstituentMap;
          }
          if (importOptions.settings) {
              // Crucial: Preserve the User's Local API Key
              const currentApiKey = prev.geminiConfig?.apiKey;
              nextState.geminiConfig = {
                  ...pendingImport.geminiConfig,
                  apiKey: currentApiKey // Retain current local key, do not overwrite with null or imported key
              };
              nextState.users = pendingImport.users;
              nextState.authEnabled = pendingImport.authEnabled;
          }

          return nextState;
      });

      setPendingImport(null);
      alert(language === 'vi' ? "Nhập dữ liệu thành công!" : "Data imported successfully!");
  };

  const OptionCheckbox = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
      <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
          <div className={`w-5 h-5 rounded flex items-center justify-center border ${checked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
              {checked && <Check size={14} className="text-white"/>}
          </div>
          <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
          <span className={`text-xs font-bold ${checked ? 'text-indigo-700' : 'text-slate-600'}`}>{label}</span>
      </label>
  );

  // --- Logic: AI Canvas Chat ---
  const handleCanvasChat = async () => {
    if (!canvasInput.trim() || isCanvasLoading) return;

    const userText = canvasInput;
    setCanvasMessages(prev => [...prev, { role: 'user', text: userText }]);
    setCanvasInput('');
    setIsCanvasLoading(true);

    try {
        const schemaContext = `
            You are the "AI Data Architect" for the ABET Master system.
            SYSTEM SCHEMA:
            - Course: { code: string, name: {vi, en}, credits: number, semester: number, type: 'REQUIRED'|'ELECTIVE'|'SELECTED_ELECTIVE', knowledgeAreaId: string, prerequisites: string[] }
            - PEO: { code: string, title: {vi, en}, description: {vi, en} }
            - SO: { number: number, code: string, description: {vi, en}, pis: {code, description: {vi, en}}[] }

            KNOWLEDGE AREAS: ${state.knowledgeAreas.map(ka => `${ka.id} (${ka.name.vi})`).join(', ')}

            RULES:
            1. If the user asks to create or update data, respond with a text message AND a JSON block.
            2. The JSON block must have this structure: {"type": "COURSE_BULK" | "PEO_BULK" | "SO_BULK", "data": [...array of objects fitting schema...]}
            3. CRITICAL: If mandatory fields (like credits or knowledgeAreaId) are missing from user prompt, use common sense defaults but notify the user in text.
            4. If data is incomplete, ask the user to provide the missing parts.
            5. Current counts: ${courses.length} courses, ${peos.length} PEOs, ${sos.length} SOs.
            6. Respond in ${language === 'vi' ? 'Vietnamese' : 'English'}.
        `;

        const response = await getGeminiResponse(`${schemaContext}\nUser Request: ${userText}`, geminiConfig);
        
        // Extract JSON if present
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const extracted = JSON.parse(jsonMatch[0]);
                setDraftData(extracted);
                // Clean the response text for display
                const cleanText = response.replace(/```json[\s\S]*```/g, '').replace(/\{[\s\S]*\}/g, '').trim();
                setCanvasMessages(prev => [...prev, { role: 'ai', text: cleanText || (language === 'vi' ? "Tôi đã chuẩn bị dữ liệu trong Canvas bên phải." : "I have prepared the data in the Canvas on the right.") }]);
            } catch (e) {
                setCanvasMessages(prev => [...prev, { role: 'ai', text: response }]);
            }
        } else {
            setCanvasMessages(prev => [...prev, { role: 'ai', text: response }]);
        }
    } catch (err) {
        setCanvasMessages(prev => [...prev, { role: 'ai', text: "Error communicating with AI. Please check settings." }]);
    } finally {
        setIsCanvasLoading(false);
    }
  };

  const commitDraftData = () => {
      if (!draftData) return;
      
      updateState(prev => {
          const next = { ...prev };
          if (draftData.type === 'COURSE_BULK') {
              const newCourses = draftData.data.map((c: any) => ({
                  ...c,
                  id: c.id || `CID-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  isEssential: c.isEssential ?? false,
                  type: c.type || 'REQUIRED',
                  knowledgeAreaId: c.knowledgeAreaId || 'other',
                  colIndex: 0,
                  prerequisites: c.prerequisites || [],
                  coRequisites: c.coRequisites || [],
                  description: c.description || { vi: '', en: '' },
                  textbooks: [],
                  clos: { vi: [], en: [] },
                  topics: [],
                  assessmentPlan: [],
                  instructorIds: [],
                  instructorDetails: {},
                  cloMap: []
              }));
              next.courses = [...next.courses, ...newCourses];
          } else if (draftData.type === 'PEO_BULK') {
              const newPeos = draftData.data.map((p: any) => ({
                  ...p,
                  id: `PEO-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
              }));
              next.peos = [...next.peos, ...newPeos];
          } else if (draftData.type === 'SO_BULK') {
              const newSos = draftData.data.map((s: any) => ({
                  ...s,
                  id: `SO-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  pis: (s.pis || []).map((pi: any) => ({ ...pi, id: `PI-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` }))
              }));
              next.sos = [...next.sos, ...newSos];
          }
          return next;
      });

      alert(language === 'vi' ? "Đã cập nhật dữ liệu thành công!" : "Data updated successfully!");
      setDraftData(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      
      {/* Import Preview Modal (Full System) */}
      {pendingImport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                              <RefreshCw size={24}/>
                          </div>
                          <div>
                              <h3 className="text-lg font-black text-slate-800">{language === 'vi' ? 'Chuẩn hóa & Nhập dữ liệu' : 'Normalize & Import Data'}</h3>
                              <p className="text-xs text-slate-500 font-medium">{language === 'vi' ? 'Dữ liệu đã được chuẩn hóa lên phiên bản mới nhất.' : 'Data has been normalized to the latest schema version.'}</p>
                          </div>
                      </div>
                      <button onClick={() => setPendingImport(null)} className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                              <div className="text-2xl font-black text-slate-700">{pendingImport.courses.length}</div>
                              <div className="text-[10px] uppercase font-bold text-slate-400">{language === 'vi' ? 'Môn học' : 'Courses'}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                              <div className="text-2xl font-black text-slate-700">{pendingImport.faculties.length}</div>
                              <div className="text-[10px] uppercase font-bold text-slate-400">{language === 'vi' ? 'Giảng viên' : 'Faculty'}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                              <div className="text-2xl font-black text-slate-700">{pendingImport.peos.length + pendingImport.sos.length}</div>
                              <div className="text-[10px] uppercase font-bold text-slate-400">PEOs + SOs</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                              <div className="text-2xl font-black text-slate-700">{pendingImport.courseSoMap.length}</div>
                              <div className="text-[10px] uppercase font-bold text-slate-400">Mappings</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                              <div className="text-2xl font-black text-slate-700">{pendingImport.facilities.length}</div>
                              <div className="text-[10px] uppercase font-bold text-slate-400">{language === 'vi' ? 'Phòng/CSVC' : 'Facilities'}</div>
                          </div>
                      </div>

                      {/* Import Options */}
                      <div className="space-y-3">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ListFilter size={12}/> {language === 'vi' ? 'Tùy chọn nhập liệu' : 'Import Options'}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <OptionCheckbox label={language === 'vi' ? 'Thông tin chung, Thư viện & CSVC' : 'General Info, Library & Facilities'} checked={importOptions.general} onChange={v => setImportOptions({...importOptions, general: v})} />
                              <OptionCheckbox label={language === 'vi' ? 'Mục tiêu & Chuẩn đầu ra (PEOs/SOs)' : 'Strategy & Outcomes'} checked={importOptions.strategy} onChange={v => setImportOptions({...importOptions, strategy: v})} />
                              <OptionCheckbox label={language === 'vi' ? 'Môn học & Khối kiến thức' : 'Courses & Knowledge Areas'} checked={importOptions.courses} onChange={v => setImportOptions({...importOptions, courses: v})} />
                              <OptionCheckbox label={language === 'vi' ? 'Danh sách Giảng viên' : 'Faculty List'} checked={importOptions.faculty} onChange={v => setImportOptions({...importOptions, faculty: v})} />
                              <OptionCheckbox label={language === 'vi' ? 'Các Ma trận (Mapping Matrices)' : 'Mapping Matrices'} checked={importOptions.matrices} onChange={v => setImportOptions({...importOptions, matrices: v})} />
                              <OptionCheckbox label={language === 'vi' ? 'Cấu hình & Tài khoản' : 'Config & Accounts'} checked={importOptions.settings} onChange={v => setImportOptions({...importOptions, settings: v})} />
                          </div>
                      </div>

                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex gap-3 items-start">
                          <Info size={16} className="text-amber-500 shrink-0 mt-0.5"/>
                          <p className="text-xs text-amber-700 leading-relaxed">
                              {language === 'vi' ? 'Lưu ý: Dữ liệu hiện tại sẽ bị ghi đè dựa trên các mục bạn đã chọn. Các mục không chọn sẽ giữ nguyên dữ liệu cũ.' : 'Note: Current data will be overwritten based on your selection. Unselected sections will retain existing data.'}
                          </p>
                      </div>
                  </div>

                  <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                      <button onClick={() => setPendingImport(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
                      <button onClick={confirmImport} className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center gap-2">
                          <CheckCircle2 size={14}/> {language === 'vi' ? 'Xác nhận Nhập' : 'Confirm Import'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Input Modal for CV/Syllabus */}
      {(activeModal === 'cv' || activeModal === 'syllabus') && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 flex flex-col max-h-[80vh]">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                          <FileJson size={20} className="text-indigo-600"/>
                          {activeModal === 'cv' ? (language === 'vi' ? 'Nhập JSON Giảng viên' : 'Import Faculty JSON') : (language === 'vi' ? 'Nhập JSON Đề cương' : 'Import Syllabus JSON')}
                      </h3>
                      <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-4">
                      {error && (
                          <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 text-sm flex items-center gap-2">
                              <AlertTriangle size={16}/> {error}
                          </div>
                      )}
                      <textarea 
                          className="flex-1 w-full p-4 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                          placeholder={language === 'vi' ? "Dán mã JSON vào đây..." : "Paste JSON here..."}
                          value={jsonInput}
                          onChange={e => setJsonInput(e.target.value)}
                      />
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-2">
                      <button onClick={handleCloseModal} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                          {language === 'vi' ? 'Hủy' : 'Cancel'}
                      </button>
                      <button onClick={processImport} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md flex items-center gap-2">
                          <Check size={16}/> {language === 'vi' ? 'Xử lý' : 'Process'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Conflict / Confirmation Modal */}
      {conflictData && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
                  <div className={`p-5 border-b flex justify-between items-center ${conflictData.isNew ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                      <h3 className={`font-bold text-lg flex items-center gap-2 ${conflictData.isNew ? 'text-emerald-800' : 'text-amber-800'}`}>
                          {conflictData.isNew 
                              ? (language === 'vi' ? <><Plus size={20}/> Xác nhận nhập mới</> : <><Plus size={20}/> Confirm New Import</>)
                              : (language === 'vi' ? <><Merge size={20}/> Phát hiện trùng lặp</> : <><Merge size={20}/> Conflict Detected</>)
                          }
                      </h3>
                      <button onClick={() => setConflictData(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      {conflictData.isNew ? (
                          <div className="text-sm text-slate-600">
                              {language === 'vi' 
                                  ? 'Dữ liệu này chưa tồn tại trong hệ thống. Bạn có muốn thêm mới không?' 
                                  : 'This item does not exist in the system. Do you want to import it as new?'}
                          </div>
                      ) : (
                          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-sm text-amber-800">
                              {language === 'vi' 
                                  ? `Đã tìm thấy mục tương tự (Trùng ${conflictData.matchReason === 'id' ? 'ID' : 'Tên'}). Bạn muốn ghi đè hay tạo mới?` 
                                  : `Found existing item (Matched by ${conflictData.matchReason}). Overwrite or create new?`}
                          </div>
                      )}

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Incoming Data Preview</h4>
                          <div className="text-xs font-mono text-slate-700 bg-white p-2 rounded border border-slate-100 max-h-40 overflow-y-auto">
                              {conflictData.type === 'cv' 
                                  ? (conflictData.item as Faculty).name[language] || (conflictData.item as Faculty).name['en']
                                  : (conflictData.item as Course).code + ' - ' + ((conflictData.item as Course).name[language] || '')
                              }
                              <br/>
                              <span className="text-slate-400">ID: {(conflictData.item as any).id}</span>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 flex-wrap">
                      <button onClick={() => setConflictData(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors">
                          {language === 'vi' ? 'Hủy' : 'Cancel'}
                      </button>
                      
                      {conflictData.isNew ? (
                          <button onClick={handleConfirmNew} className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-200 flex items-center gap-2">
                              <Plus size={14}/> {language === 'vi' ? 'Nhập dữ liệu' : 'Import Data'}
                          </button>
                      ) : (
                          <>
                              <button onClick={handleCreateNew} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm flex items-center gap-2">
                                  <Copy size={14}/> {language === 'vi' ? 'Tạo mới (ID mới)' : 'Create New (New ID)'}
                              </button>
                              <button onClick={handleOverwrite} className="px-6 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 shadow-md shadow-amber-200 flex items-center gap-2">
                                  <RefreshCw size={14}/> {language === 'vi' ? 'Ghi đè (Giữ ID)' : 'Overwrite (Keep ID)'}
                              </button>
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Main Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-2">
                  <FileJson className="text-indigo-600" size={28} />
                  {language === 'vi' ? 'Nhập liệu & Công cụ' : 'Data Import & Tools'}
                </h1>
                <p className="text-slate-600 max-w-2xl">
                  {language === 'vi' 
                    ? 'Quản lý toàn bộ dữ liệu hệ thống, nhập từ JSON hoặc sử dụng công cụ AI.'
                    : 'Manage full system data, import from JSON, or use AI tools.'}
                </p>
            </div>
            <a 
                href="https://gemini.google.com/gem/1ERPKel5BS-NhyaEfdUbi1DRfJ92hDKBE?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:shadow-md transition-all group shrink-0"
            >
                <Sparkles size={16} className="text-purple-500 group-hover:animate-pulse"/>
                <span>{language === 'vi' ? 'Công cụ tạo JSON' : 'JSON Creator Bot'}</span>
                <ExternalLink size={14} className="opacity-50"/>
            </a>
        </div>

        {/* Section 1: Full System Operations */}
        <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Database size={16} /> {language === 'vi' ? 'Dữ liệu toàn hệ thống' : 'Full System Data'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={handleSmartZipExport} disabled={isZipping} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 hover:shadow-md transition-all flex items-center gap-4 group text-left disabled:opacity-70 disabled:cursor-not-allowed">
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        {isZipping ? <Loader2 size={20} className="animate-spin"/> : <Archive size={20}/>}
                    </div>
                    <div>
                        <span className="font-bold text-slate-800 block">{language === 'vi' ? 'Xuất ZIP (Files)' : 'Export ZIP (Files)'}</span>
                        <span className="text-[10px] text-slate-400">
                            {isZipping 
                                ? 'Zipping...' 
                                : (currentUser?.role !== 'ADMIN' && faculties.find(f => f.email === currentUser?.email) 
                                    ? (language === 'vi' ? 'Hồ sơ cá nhân' : 'Personal Profile') 
                                    : (language === 'vi' ? 'Thư mục ZIP chứa từng file riêng lẻ để gửi cho trưởng bộ môn (Sau khi chỉnh sửa xong đề cương và CV)' : 'Individual JSON Files'))
                            }
                        </span>
                    </div>
                </button>

                <button onClick={handleFullJsonExport} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-amber-300 hover:shadow-md transition-all flex items-center gap-4 group text-left">
                    <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                        <FileJson size={20}/>
                    </div>
                    <div>
                        <span className="font-bold text-slate-800 block">{language === 'vi' ? 'Sao lưu (Full JSON)' : 'Full Backup (JSON)'}</span>
                        <span className="text-[10px] text-slate-400">{language === 'vi' ? 'Dùng để chuyển dữ liệu sang máy tính khác hoặc sao lưu phiên làm việc' : 'Use for machine transfer'}</span>
                    </div>
                </button>
                
                <label className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-4 group cursor-pointer text-left">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        <Upload size={20}/>
                    </div>
                    <div>
                        <span className="font-bold text-slate-800 block">{language === 'vi' ? 'Nhập toàn bộ dữ liệu để bắt đầu thao tác' : 'Import Full System'}</span>
                        <span className="text-[10px] text-slate-400">JSON Format (Restore)</span>
                    </div>
                    <input type="file" ref={jsonImportRef} className="hidden" accept=".json" onChange={handleFileSelect} />
                </label>
            </div>
        </div>

        {/* Section 2: Specific Tools */}
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ListFilter size={16} /> {language === 'vi' ? 'Công cụ cụ thể' : 'Specific Tools'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: CV Import */}
          <button 
            onClick={() => handleOpenModal('cv')}
            className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-md transition-all group h-full"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Upload size={24} className="text-indigo-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">
              {language === 'vi' ? 'Nhập JSON Giảng viên' : 'Import Faculty JSON'}
            </h3>
          </button>

          {/* Card 2: Syllabus Import */}
          <button 
            onClick={() => handleOpenModal('syllabus')}
            className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-md transition-all group h-full"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Upload size={24} className="text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 group-hover:text-emerald-700">
              {language === 'vi' ? 'Nhập JSON Đề cương' : 'Import Syllabus JSON'}
            </h3>
          </button>

          {/* Card 3: Library Tools */}
          <button 
            onClick={() => handleOpenModal('library_dedupe')}
            className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-amber-500 hover:shadow-md transition-all group h-full"
          >
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BookOpen size={24} className="text-amber-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 group-hover:text-amber-700">
              {language === 'vi' ? 'Kiểm tra Thư viện' : 'Library Deduplication'}
            </h3>
          </button>
        </div>
      </div>

      {/* AI Data Architect (Canvas) - Moved Here */}
      <section className="bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-800 relative min-h-[600px] flex flex-col">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
        
        {/* Header */}
        <div className="p-8 border-b border-slate-800 bg-slate-950/60 backdrop-blur-xl flex justify-between items-center z-10">
            <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 rotate-3">
                    <BrainCircuit className="text-white" size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white tracking-tight uppercase">AI Data Architect</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-[0.2em]">{language === 'vi' ? 'Nhập liệu thông minh kiểu Canvas' : 'Smart Canvas Data Entry'}</p>
                    </div>
                </div>
            </div>
            <div className="flex gap-4">
                <button 
                    onClick={() => { setCanvasMessages([]); setDraftData(null); }} 
                    className="p-3 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700" 
                    title="Clear All"
                >
                    <RefreshCw size={20}/>
                </button>
            </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0 z-10">
            {/* Chat Pane */}
            <div className="flex-1 flex flex-col border-r border-slate-800/50 p-8">
                <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar mb-6 pr-4" ref={canvasScrollRef}>
                    {canvasMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-60 max-w-sm mx-auto">
                            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6">
                                <MessageSquare size={40} className="text-indigo-400" />
                            </div>
                            <h4 className="text-white font-bold mb-2">{language === 'vi' ? 'Bắt đầu thiết kế dữ liệu' : 'Start Architecting Data'}</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                {language === 'vi' 
                                    ? "Yêu cầu AI tạo hàng loạt môn học, chuẩn đầu ra hoặc mục tiêu. AI sẽ đảm bảo dữ liệu đúng chuẩn và hỏi thêm nếu thiếu thông tin."
                                    : "Ask AI to generate bulk courses, SOs, or PEOs. AI will ensure schema compliance and ask for clarification if info is missing."}
                            </p>
                            <div className="grid grid-cols-1 gap-2 mt-8 w-full">
                                <button onClick={() => setCanvasInput(language === 'vi' ? "Tạo giúp tôi 5 môn học cơ sở ngành về Khoa học dữ liệu." : "Create 5 fundamental courses for Data Science.")} className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-lg hover:bg-indigo-500/20 transition-all text-left">
                                    "Create 5 Data Science courses..."
                                </button>
                                <button onClick={() => setCanvasInput(language === 'vi' ? "Đề xuất danh sách 7 Student Outcomes (SOs) cho ngành Kỹ thuật Điện." : "Suggest 7 Student Outcomes (SOs) for Electrical Engineering.")} className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-2 rounded-lg hover:bg-purple-500/20 transition-all text-left">
                                    "Suggest 7 SOs for Electrical Eng..."
                                </button>
                            </div>
                        </div>
                    )}
                    {canvasMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xl ${
                                msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none ring-1 ring-white/5'
                            }`}>
                                <div className="whitespace-pre-wrap">{msg.text}</div>
                                {msg.role === 'ai' && draftData && i === canvasMessages.length - 1 && (
                                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-[10px] font-bold text-indigo-400">
                                        <Info size={12}/> {language === 'vi' ? 'Dữ liệu thô đã sẵn sàng bên phải' : 'Raw data ready in the canvas'}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isCanvasLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 rounded-2xl rounded-tl-none p-4 border border-slate-700 flex gap-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-25 group-focus-within:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative flex items-center bg-slate-900 rounded-xl border border-slate-700">
                        <textarea 
                            value={canvasInput}
                            onChange={(e) => setCanvasInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleCanvasChat();
                                }
                            }}
                            placeholder={language === 'vi' ? "Nhập yêu cầu tại đây..." : "Type your request here..."}
                            className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:ring-0 resize-none h-[50px] custom-scrollbar text-sm"
                        />
                        <button 
                            onClick={handleCanvasChat}
                            disabled={!canvasInput.trim() || isCanvasLoading}
                            className="p-3 text-indigo-400 hover:text-white transition-colors disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Canvas / Preview Pane */}
            <div className="w-1/3 bg-slate-950/50 p-6 overflow-hidden flex flex-col relative">
                <div className="absolute top-0 right-0 p-4 z-10 pointer-events-none">
                    <div className="bg-slate-800/80 backdrop-blur text-slate-400 text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-white/5">
                        JSON Canvas
                    </div>
                </div>
                {draftData ? (
                    <div className="flex-1 flex flex-col h-full">
                        <div className="flex-1 overflow-auto custom-scrollbar bg-slate-900 rounded-xl p-4 border border-slate-800 text-xs font-mono text-emerald-400 shadow-inner">
                            <pre>{JSON.stringify(draftData, null, 2)}</pre>
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button onClick={() => setDraftData(null)} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors">{language === 'vi' ? 'Hủy bỏ' : 'Discard'}</button>
                            <button onClick={commitDraftData} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-900/50 flex items-center gap-2 transition-all hover:scale-105">
                                <Check size={14}/> {language === 'vi' ? 'Chấp nhận & Lưu' : 'Commit to System'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-50">
                        <Code size={48} className="mb-4"/>
                        <p className="text-xs uppercase font-bold tracking-widest">{language === 'vi' ? 'Trống' : 'Empty'}</p>
                    </div>
                )}
            </div>
        </div>
      </section>
    </div>
  );
};

export default JSONInputModule;

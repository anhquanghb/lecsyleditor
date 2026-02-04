
import React, { useState } from 'react';
import { AppState, MoetInfo } from '../types';
import { translateContent } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';
import AILoader from '../components/AILoader';
import { Layout, Sparkles, Download, FileType, BookOpen, Target, FileText, BoxSelect, Grid3X3, List } from 'lucide-react';

// Import sub-modules
import MoetGeneralInfo from './moet/MoetGeneralInfo';
import MoetObjectives from './moet/MoetObjectives';
import MoetDetails from './moet/MoetDetails';
import MoetStructure from './moet/MoetStructure';
import MoetMatrix from './moet/MoetMatrix';
import MoetSyllabi from './moet/MoetSyllabi';
import MoetExport from './moet/MoetExport';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const TransformationModule: React.FC<Props> = ({ state, updateState }) => {
  const { generalInfo, courses, language, geminiConfig, faculties, teachingMethods, assessmentMethods, sos } = state;
  const moetInfo = generalInfo.moetInfo;
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'objectives' | 'details' | 'structure' | 'matrix' | 'syllabi' | 'export'>('info');

  const tStrings = TRANSLATIONS[language];

  const handleAutoTranslate = async () => {
      setIsTranslating(true);
      try {
          const otherLang = language === 'vi' ? 'en' : 'vi';
          const targetLangName = language === 'vi' ? 'Vietnamese' : 'English';
          
          const structuralConfig = {
              ...geminiConfig,
              prompts: {
                  ...geminiConfig.prompts,
                  translation: `Translate the following educational content to ${targetLangName}.
CRITICAL INSTRUCTIONS:
1. **Preserve Structure**: Keep all HTML tags (<ul>, <li>, <p>, <b>, <i>), bullet points, and line breaks exactly as they are in the source. Do not flatten lists.
2. **Academic Tone**: Use formal, professional academic language suitable for University Program Specifications (MOET standards).
3. **Accuracy**: Translate the meaning accurately. Do not summarize.
4. **Output**: Return ONLY the translated string.

Content to translate: {text}`
              }
          };

          const fields: (keyof MoetInfo)[] = ['level', 'majorName', 'specializationName', 'trainingMode', 'trainingType','trainingLanguage', 'admissionTarget', 'admissionReq', 'graduationReq', 'gradingScale', 'implementationGuideline', 'referencedPrograms', 'generalObjectives'];
          const newMoet = { ...moetInfo };
          
          for (const f of fields) {
              const val = newMoet[f] as any;
              if (val && !val[language] && val[otherLang]) {
                  const trans = await translateContent(val[otherLang], language, structuralConfig);
                  if (trans) val[language] = trans;
              }
          }
          if (newMoet.specificObjectives) {
              for (const obj of newMoet.specificObjectives) {
                  if (!obj.description[language] && obj.description[otherLang]) {
                      const trans = await translateContent(obj.description[otherLang], language, structuralConfig);
                      if (trans) obj.description[language] = trans;
                  }
              }
          }
          if (newMoet.moetSpecificObjectives) {
              for (const obj of newMoet.moetSpecificObjectives) {
                  if (!obj.description[language] && obj.description[otherLang]) {
                      const trans = await translateContent(obj.description[otherLang], language, structuralConfig);
                      if (trans) obj.description[language] = trans;
                  }
              }
          }
          updateState(prev => ({ ...prev, generalInfo: { ...prev.generalInfo, moetInfo: newMoet } }));
      } catch (e) {
          alert("Translation failed.");
      } finally { setIsTranslating(false); }
  };

  const tabs = [
      { id: 'info', label: language === 'vi' ? 'Thông tin chung' : 'General Info', icon: BookOpen },
      { id: 'objectives', label: language === 'vi' ? 'Mục tiêu & CĐR' : 'Objectives', icon: Target },
      { id: 'details', label: language === 'vi' ? 'Thông tin chi tiết' : 'Details', icon: FileText },
      { id: 'structure', label: language === 'vi' ? 'Cấu trúc CT' : 'Structure', icon: BoxSelect },
      { id: 'matrix', label: language === 'vi' ? 'Ma trận' : 'Matrix', icon: Grid3X3 },
      { id: 'syllabi', label: language === 'vi' ? 'Học phần' : 'Courses', icon: List },
      { id: 'export', label: language === 'vi' ? 'Xuất bản' : 'Export', icon: Download },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <AILoader isVisible={isTranslating} message={isTranslating ? (language === 'vi' ? 'Đang dịch...' : 'Translating...') : ''} />
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2 rounded-lg text-white"><Layout size={20} /></div>
              <div>
                  <h2 className="text-lg font-bold text-slate-800">{language === 'vi' ? 'Chương trình đào tạo (MOET)' : 'Program Specification (MOET)'}</h2>
                  <p className="text-xs text-slate-500">{language === 'vi' ? 'Chuyển đổi dữ liệu sang định dạng Bộ GD&ĐT' : 'Transform data to Ministry of Education format'}</p>
              </div>
          </div>
          <div className="flex gap-2">
              <button onClick={handleAutoTranslate} disabled={isTranslating} className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-100 transition shadow-sm disabled:opacity-50">
                  <Sparkles size={16} /> {tStrings.autoTranslate}
              </button>
          </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 flex items-center gap-1 overflow-x-auto shrink-0">
          {tabs.map(tab => (
              <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                  <tab.icon size={14}/> {tab.label}
              </button>
          ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-300 h-full">
              {activeTab === 'info' && <MoetGeneralInfo state={state} updateState={updateState} />}
              {activeTab === 'objectives' && <MoetObjectives state={state} updateState={updateState} />}
              {activeTab === 'details' && <MoetDetails state={state} updateState={updateState} />}
              {activeTab === 'structure' && <MoetStructure state={state} updateState={updateState} />}
              {activeTab === 'matrix' && <MoetMatrix state={state} updateState={updateState} />}
              {activeTab === 'syllabi' && <MoetSyllabi state={state} />}
              {activeTab === 'export' && <MoetExport state={state} />}
          </div>
      </div>
    </div>
  );
};

export default TransformationModule;

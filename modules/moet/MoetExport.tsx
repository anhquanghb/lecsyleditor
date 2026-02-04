
import React, { useState, useMemo } from 'react';
import { AppState, MoetCategory } from '../../types';
import { exportMoetDocx } from '../../services/MoetProgramExportDOC';
import { exportMoetPdf } from '../../services/MoetProgramExportPDF';
import { exportMoetP1 } from '../../services/MoetP1';
import { exportMoetP2 } from '../../services/MoetP2';
import { exportMoetP3 } from '../../services/MoetP3';
import { exportMoetP4 } from '../../services/MoetP4';
import { exportMoetEndSectionFile } from '../../services/MoetEndSection';
import { exportMoetSyllabus } from '../../services/MoetSyllabus';
import { FileType, Download, FileText, File, Grid3X3, BookOpen } from 'lucide-react';
import AILoader from '../../components/AILoader';

interface Props {
  state: AppState;
}

const MoetExport: React.FC<Props> = ({ state }) => {
  const { generalInfo, courses, language, faculties, teachingMethods, assessmentMethods, sos, facultyTitles, courseSoMap, facilities, departments, academicFaculties, academicSchools } = state;
  const moetInfo = generalInfo.moetInfo;
  const [isExporting, setIsExporting] = useState(false);

  // Helper for matrix sorting needed for export
  const sortedObjectives = useMemo(() => {
      const CATEGORY_ORDER: MoetCategory[] = ['knowledge', 'skills', 'learning'];
      const allObjs = moetInfo.specificObjectives || [];
      return [...allObjs].sort((a, b) => {
          const idxA = CATEGORY_ORDER.indexOf(a.category!);
          const idxB = CATEGORY_ORDER.indexOf(b.category!);
          if (idxA !== idxB) return idxA - idxB;
          return 0;
      });
  }, [moetInfo.specificObjectives]);

  const impliedCourseObjectiveLinks = useMemo(() => {
      const set = new Set<string>();
      (moetInfo.specificObjectives || []).forEach(obj => {
          (obj.soIds || []).forEach(soId => {
              (state.courseSoMap || []).filter(m => m.soId === soId && m.level !== '').forEach(m => {
                  set.add(`${m.courseId}|${obj.id}`);
              });
          });
      });
      return set;
  }, [moetInfo.specificObjectives, state.courseSoMap]);

  const handleExportDOCX = async () => {
    setIsExporting(true);
    try {
        await exportMoetDocx(
            generalInfo, 
            moetInfo, 
            courses, 
            faculties, 
            language, 
            teachingMethods, 
            assessmentMethods, 
            sos, 
            facultyTitles, 
            courseSoMap, 
            facilities, 
            departments, 
            academicFaculties, 
            academicSchools
        );
    } catch(e) {
        console.error(e);
        alert("Export failed.");
    } finally { setIsExporting(false); }
  };

  const handleExportSyllabus = async () => {
      setIsExporting(true);
      try {
          await exportMoetSyllabus(generalInfo, courses, assessmentMethods, teachingMethods, faculties, sos, language, departments, academicFaculties, academicSchools);
      } catch (e) {
          console.error(e);
          alert("Export Syllabus failed.");
      } finally { setIsExporting(false); }
  };

  const handleExportPage1 = async () => {
      setIsExporting(true);
      try {
          await exportMoetP1(generalInfo, moetInfo, courses, language);
      } catch (e) {
          console.error(e);
          alert("Export P1 failed.");
      } finally { setIsExporting(false); }
  };

  const handleExportPage2 = async () => {
      setIsExporting(true);
      try {
          await exportMoetP2(generalInfo, moetInfo, courses, teachingMethods, faculties, language);
      } catch (e) {
          console.error(e);
          alert("Export P2 failed.");
      } finally { setIsExporting(false); }
  };

  const handleExportPage3 = async () => {
      setIsExporting(true);
      try {
          await exportMoetP3(generalInfo, moetInfo, courses, faculties, facultyTitles, language);
      } catch (e) {
          console.error(e);
          alert("Export P3 failed.");
      } finally { setIsExporting(false); }
  };

  const handleExportPage4 = async () => {
      setIsExporting(true);
      try {
          await exportMoetP4(generalInfo, courses, courseSoMap, language);
      } catch (e) {
          console.error(e);
          alert("Export P4 failed.");
      } finally { setIsExporting(false); }
  };

  const handleExportEndSection = async () => {
      setIsExporting(true);
      try {
          await exportMoetEndSectionFile(generalInfo, facilities, teachingMethods, courses, language);
      } catch (e) {
          console.error(e);
          alert("Export End Section failed.");
      } finally { setIsExporting(false); }
  };

  return (
    <div className="h-full flex flex-col relative">
        <AILoader isVisible={isExporting} message={language === 'vi' ? 'Đang xuất tài liệu...' : 'Exporting documents...'} />
        
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Download size={18} className="text-emerald-600"/>
                    {language === 'vi' ? '14. Xuất bản Tài liệu' : '14. Export Documents'}
                </h3>
            </div>
            
            <div className="p-8 flex flex-col gap-6 items-center justify-center flex-1 bg-slate-50/30">
                <div className="text-center max-w-md space-y-2 mb-4">
                    <h4 className="font-bold text-slate-800 text-lg">
                        {language === 'vi' ? 'Chọn định dạng xuất bản' : 'Select Export Format'}
                    </h4>
                    <p className="text-sm text-slate-500">
                        {language === 'vi' 
                            ? 'Tạo tài liệu chương trình đào tạo hoàn chỉnh theo mẫu quy định của Bộ GD&ĐT.' 
                            : 'Generate the complete program specification document according to MOET regulations.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 w-full max-w-6xl">
                    <button 
                        onClick={handleExportDOCX} 
                        disabled={isExporting}
                        className="flex flex-col items-center justify-center gap-4 p-8 bg-blue-50 border-2 border-blue-100 rounded-2xl hover:bg-blue-100 hover:border-blue-300 transition-all group disabled:opacity-50 shadow-sm hover:shadow-md md:col-span-3"
                    >
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <FileType size={32} className="text-blue-600"/>
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-blue-900 text-lg">Full Docx</span>
                            <span className="text-xs font-medium text-blue-600">Complete Program</span>
                        </div>
                    </button>

                    <button 
                        onClick={handleExportSyllabus} 
                        disabled={isExporting}
                        className="flex flex-col items-center justify-center gap-4 p-8 bg-emerald-50 border-2 border-emerald-100 rounded-2xl hover:bg-emerald-100 hover:border-emerald-300 transition-all group disabled:opacity-50 shadow-sm hover:shadow-md md:col-span-2"
                    >
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <FileText size={32} className="text-emerald-600"/>
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-emerald-900 text-lg">Full Syllabus (Docx)</span>
                            <span className="text-xs font-medium text-emerald-600">All Syllabi with TOC</span>
                        </div>
                    </button>

                    <button 
                        onClick={handleExportPage1} 
                        disabled={isExporting}
                        className="flex flex-col items-center justify-center gap-4 p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl hover:bg-slate-100 hover:border-slate-300 transition-all group disabled:opacity-50 shadow-sm hover:shadow-md"
                    >
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <File size={24} className="text-slate-600"/>
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-slate-900 text-sm">Part 1</span>
                            <span className="text-[10px] font-medium text-slate-600">Sec 1-7</span>
                        </div>
                    </button>

                    <button 
                        onClick={handleExportPage2} 
                        disabled={isExporting}
                        className="flex flex-col items-center justify-center gap-4 p-6 bg-purple-50 border-2 border-purple-100 rounded-2xl hover:bg-purple-100 hover:border-purple-300 transition-all group disabled:opacity-50 shadow-sm hover:shadow-md"
                    >
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <File size={24} className="text-purple-600"/>
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-purple-900 text-sm">Part 2</span>
                            <span className="text-[10px] font-medium text-purple-600">Sec 8</span>
                        </div>
                    </button>

                    <button 
                        onClick={handleExportPage3} 
                        disabled={isExporting}
                        className="flex flex-col items-center justify-center gap-4 p-6 bg-amber-50 border-2 border-amber-100 rounded-2xl hover:bg-amber-100 hover:border-amber-300 transition-all group disabled:opacity-50 shadow-sm hover:shadow-md"
                    >
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <File size={24} className="text-amber-600"/>
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-amber-900 text-sm">Part 3</span>
                            <span className="text-[10px] font-medium text-amber-600">Sec 9</span>
                        </div>
                    </button>

                    <button 
                        onClick={handleExportPage4} 
                        disabled={isExporting}
                        className="flex flex-col items-center justify-center gap-4 p-6 bg-indigo-50 border-2 border-indigo-100 rounded-2xl hover:bg-indigo-100 hover:border-indigo-300 transition-all group disabled:opacity-50 shadow-sm hover:shadow-md"
                    >
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Grid3X3 size={24} className="text-indigo-600"/>
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-indigo-900 text-sm">Part 4</span>
                            <span className="text-[10px] font-medium text-indigo-600">Sec 10</span>
                        </div>
                    </button>

                    <button 
                        onClick={handleExportEndSection} 
                        disabled={isExporting}
                        className="flex flex-col items-center justify-center gap-4 p-6 bg-teal-50 border-2 border-teal-100 rounded-2xl hover:bg-teal-100 hover:border-teal-300 transition-all group disabled:opacity-50 shadow-sm hover:shadow-md"
                    >
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <BookOpen size={24} className="text-teal-600"/>
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-teal-900 text-sm">Part 5</span>
                            <span className="text-[10px] font-medium text-teal-600">Sec 11-13</span>
                        </div>
                    </button>
                </div>
            </div>
        </section>
    </div>
  );
};

export default MoetExport;

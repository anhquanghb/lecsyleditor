
import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { TRANSLATIONS } from '../constants';
import { Search, BookOpen, UserCheck, ShieldAlert, ArrowLeft, Users, Calendar } from 'lucide-react';
import SyllabusEditorModule from './SyllabusEditorModule';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
  selectedCourseId: string | null;
  setSelectedCourseId: (id: string | null) => void;
}

const SyllabusModule: React.FC<Props> = ({ state, updateState, selectedCourseId, setSelectedCourseId }) => {
  const { courses, language, currentUser, faculties, academicSchools, academicFaculties } = state;
  const t = TRANSLATIONS[language];
  const [courseSearch, setCourseSearch] = useState('');

  // --- Filtering Logic ---
  const filteredCourses = useMemo(() => {
    let result = courses.filter(c => c.instructorIds && c.instructorIds.length > 0);

    // Filter by Current User (Lecturer Assignment)
    // Only apply if user is logged in and NOT an Admin (Admins see everything)
    if (currentUser && currentUser.role !== 'ADMIN') {
        const linkedFaculty = faculties.find(f => f.email === currentUser.email);
        
        if (linkedFaculty) {
            // Show courses where this faculty is in the instructor list
            // Check both Main and supporting instructors
            result = result.filter(c => c.instructorIds.includes(linkedFaculty.id));
        } else {
            // User logged in but no Faculty profile matches their email -> Show nothing
            result = [];
        }
    }

    if (courseSearch) {
      const lower = courseSearch.toLowerCase().trim();
      result = result.filter(c => 
        (c.code || '').toLowerCase().includes(lower) || 
        (c.name?.vi || '').toLowerCase().includes(lower) ||
        (c.name?.en || '').toLowerCase().includes(lower)
      );
    }
    return result.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  }, [courses, courseSearch, currentUser, faculties]);

  const selectedCourse = useMemo(() => courses.find(c => c.id === selectedCourseId), [courses, selectedCourseId]);

  // Determine label for the list header
  const listHeaderLabel = useMemo(() => {
      if (currentUser?.role === 'ADMIN') return language === 'vi' ? 'Tất cả Đề cương' : 'All Syllabi';
      return language === 'vi' ? 'Lớp học phần của tôi' : 'My Course Sections';
  }, [currentUser, language]);

  // --- EDITOR MODE ---
  if (selectedCourse) {
      return (
          <div className="h-full flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Editor Header with Back Button */}
              <div className="flex items-center gap-4 p-4 border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
                  <button 
                      onClick={() => setSelectedCourseId(null)}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800"
                      title={language === 'vi' ? "Quay lại danh sách" : "Back to list"}
                  >
                      <ArrowLeft size={20} />
                  </button>
                  <div>
                      <h2 className="font-black text-lg text-slate-800 flex items-center gap-2">
                          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-sm font-bold">{selectedCourse.code}</span>
                          {selectedCourse.name[language]}
                      </h2>
                  </div>
              </div>
              
              {/* Editor Content */}
              <div className="flex-1 overflow-hidden relative">
                  <SyllabusEditorModule 
                      course={selectedCourse} 
                      state={state} 
                      updateState={updateState} 
                  />
              </div>
          </div>
      );
  }

  // --- GRID MODE ---
  return (
    <div className="flex flex-col h-full space-y-6 p-1 animate-in fade-in duration-500">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
              <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  <BookOpen className="text-indigo-600" size={28} />
                  {listHeaderLabel}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                  {language === 'vi' 
                      ? 'Chọn một học phần để biên soạn đề cương chi tiết.' 
                      : 'Select a course section to edit the detailed syllabus.'}
              </p>
          </div>
          
          <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-white" 
                    placeholder={language === 'vi' ? "Tìm kiếm môn học..." : "Search courses..."} 
                    value={courseSearch} 
                    onChange={(e) => setCourseSearch(e.target.value)} 
                />
          </div>
      </div>

      {/* Course Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
                {filteredCourses.map(c => {
                    const mainInstructorId = c.instructorIds.find(id => c.instructorDetails[id]?.isMain) || c.instructorIds[0];
                    const mainFaculty = faculties.find(f => f.id === mainInstructorId);
                    
                    return (
                        <button 
                            key={c.id} 
                            onClick={() => setSelectedCourseId(c.id)} 
                            className="group flex flex-col bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                            
                            <div className="relative z-10 mb-4 flex justify-between items-start">
                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-black shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    {c.code}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 bg-white/80 px-2 py-1 rounded-full border border-slate-100">
                                    {c.credits} TC
                                </span>
                            </div>

                            <h3 className="relative z-10 font-bold text-slate-800 text-lg leading-tight mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                                {c.name[language]}
                            </h3>

                            <div className="mt-auto pt-4 border-t border-slate-100 w-full relative z-10">
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                    <Users size={14} className="text-emerald-500" />
                                    <span className="truncate font-medium">
                                        {mainFaculty ? mainFaculty.name[language] : (language === 'vi' ? 'Chưa cập nhật' : 'Unknown')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <Calendar size={12}/>
                                    <span>Sem {c.semester}</span>
                                    <span>•</span>
                                    <span>{c.instructorIds.length} {language === 'vi' ? 'GV' : 'Instructors'}</span>
                                </div>
                            </div>
                        </button>
                    );
                })}
          </div>

          {filteredCourses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                      <BookOpen size={40} className="text-slate-400"/>
                  </div>
                  {currentUser?.role !== 'ADMIN' && !faculties.find(f => f.email === currentUser?.email) ? (
                      <div className="max-w-md">
                          <h3 className="text-xl font-bold text-slate-700 mb-2 flex items-center justify-center gap-2">
                              <ShieldAlert className="text-amber-500"/>
                              {language === 'vi' ? 'Chưa liên kết hồ sơ!' : 'No Profile Linked!'}
                          </h3>
                          <p className="text-sm text-slate-500 leading-relaxed">
                              {language === 'vi' 
                                  ? 'Email tài khoản của bạn chưa trùng khớp với bất kỳ Giảng viên nào trong hệ thống. Vui lòng liên hệ quản trị viên.' 
                                  : 'Your account email does not match any Faculty in the system. Please contact an administrator.'}
                          </p>
                      </div>
                  ) : (
                      <div className="max-w-md">
                          <h3 className="text-lg font-bold text-slate-700 mb-2">
                              {language === 'vi' ? 'Không tìm thấy môn học' : 'No Courses Found'}
                          </h3>
                          <p className="text-sm text-slate-500">
                              {language === 'vi' 
                                  ? 'Không có môn học nào được phân công cho bạn hoặc khớp với từ khóa tìm kiếm.' 
                                  : 'No courses are assigned to you or match your search query.'}
                          </p>
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};

export default SyllabusModule;

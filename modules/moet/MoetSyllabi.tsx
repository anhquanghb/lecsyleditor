
import React from 'react';
import { AppState } from '../../types';
import { FileText, BookOpen } from 'lucide-react';

interface Props {
  state: AppState;
}

const MoetSyllabi: React.FC<Props> = ({ state }) => {
  const { courses, language } = state;
  const sortedCourses = [...courses].sort((a,b) => a.semester - b.semester || a.code.localeCompare(b.code));

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-emerald-600"/>
                {language === 'vi' ? '11. Danh sách Đề cương chi tiết' : '11. Detailed Syllabi List'}
            </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
            <p className="text-sm text-slate-500 italic mb-4">
                {language === 'vi' 
                    ? 'Phần này hiển thị danh sách các học phần sẽ được xuất trong báo cáo. Nội dung chi tiết được quản lý tại module Đề cương.'
                    : 'This section lists courses included in the report. Detailed content is managed in the Syllabus module.'}
            </p>
            {sortedCourses.map((c, idx) => (
                <div key={c.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-slate-400 w-8">#{idx + 1}</span>
                            <div>
                                <h4 className="font-bold text-indigo-700 text-sm">{c.code} - {c.name[language]}</h4>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{c.credits} Credits</span>
                                    <span className="flex items-center gap-1"><BookOpen size={10}/> Sem {c.semester}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            {c.type}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </section>
  );
};

export default MoetSyllabi;

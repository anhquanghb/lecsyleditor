
import React from 'react';
import { ArrowRight, FileJson, UserCog, Archive, ShieldCheck, Play, AlertTriangle, Bot, ExternalLink, MousePointer2 } from 'lucide-react';
import { Language } from '../types';

interface Props {
    onStart: () => void;
    onNavigate: (module: string) => void;
    language: Language;
}

const CoverPage: React.FC<Props> = ({ onStart, onNavigate, language }) => {
    const steps = [
        {
            icon: <FileJson size={32} className="text-blue-500" />,
            title: language === 'vi' ? "Bước 1: Nhập dữ liệu" : "Step 1: Import Data",
            desc: language === 'vi' 
                ? "Nhập toàn bộ dữ liệu JSON do trưởng bộ môn gửi (trong phần Nhập xuất JSON)."
                : "Import the full JSON data sent by the Head of Department (in the JSON Input/Output section).",
            targetModule: 'json-input'
        },
        {
            icon: <UserCog size={32} className="text-purple-500" />,
            title: language === 'vi' ? "Bước 2: Cập nhật" : "Step 2: Update",
            desc: language === 'vi'
                ? "Sửa đề cương và CV giảng viên."
                : "Edit the syllabus and Faculty CV.",
            targetModule: 'syllabus'
        },
        {
            icon: <Archive size={32} className="text-emerald-500" />,
            title: language === 'vi' ? "Bước 3: Xuất & Gửi lại" : "Step 3: Export & Return",
            desc: language === 'vi'
                ? "Xuất toàn bộ dữ liệu và gửi lại cho trưởng bộ môn."
                : "Export all data and send it back to the Head of Department.",
            targetModule: 'json-input'
        }
    ];

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900 text-white flex flex-col items-center justify-center p-4 overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 max-w-5xl w-full flex flex-col items-center">
                {/* Header */}
                <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-full px-4 py-1.5 mb-6 backdrop-blur-md">
                        <ShieldCheck size={16} className="text-emerald-400" />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">DTU Accreditation System</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                        DTU Lec-Editor
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        {language === 'vi' 
                            ? "Hệ thống biên soạn Đề cương & Hồ sơ giảng viên đồng bộ."
                            : "Unified Course Syllabus & Faculty Profile Editing System."}
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10">
                    {steps.map((step, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => onNavigate(step.targetModule)}
                            className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl hover:bg-slate-800/60 transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer relative overflow-hidden"
                            style={{ animationDelay: `${idx * 150}ms` }}
                        >
                            <div className="bg-slate-900/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-700 group-hover:border-slate-600 transition-colors">
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-white transition-colors flex items-center gap-2">
                                {step.title}
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {step.desc}
                            </p>
                            
                            {/* Hover Indicator */}
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 text-slate-500 bg-slate-900/50 p-2 rounded-full border border-slate-700">
                                <ArrowRight size={16} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Local Storage Warning */}
                <div className="bg-amber-900/20 border border-amber-700/30 p-4 rounded-xl max-w-2xl mb-8 flex items-start gap-3 text-amber-200/80 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300">
                    <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-400" />
                    <p className="text-xs leading-relaxed">
                        <strong className="text-amber-300 block mb-1">
                            {language === 'vi' ? 'Lưu ý quan trọng:' : 'Important Note:'}
                        </strong>
                        {language === 'vi' 
                            ? 'Dữ liệu được lưu trữ trực tiếp trên trình duyệt của máy tính này, không có ở trên máy chủ. Vui lòng Xuất dữ liệu (Sao lưu Full JSON) mỗi phiên làm việc và lưu ở thư mục riêng của quý thầy cô, mỗi file là một phiên bản để quý thầy cô tìm lại dữ liệu cũ khi cần. Nếu quý thầy cô chuyển sang dùng máy tính khác, hãy mang file này theo để nhập lại.'
                            : 'Data is stored locally in this browser (Local Storage). If you switch computers, please EXPORT all data (JSON/ZIP) and take it with you to import on the new machine.'}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in duration-1000 delay-500">
                    <button 
                        onClick={onStart}
                        className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-900/20 hover:shadow-indigo-600/40 flex items-center gap-3"
                    >
                        <span>{language === 'vi' ? "Bắt đầu làm việc" : "Start Working"}</span>
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        
                        {/* Button Glow Effect */}
                        <div className="absolute inset-0 rounded-xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></div>
                    </button>

                    <a 
                        href="https://gemini.google.com/gem/1p4fb_7cYFFi0ryyr0IyMyVbdNSH0lXsu?usp=sharing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 rounded-xl font-bold text-lg transition-all border border-slate-700 hover:border-indigo-500/50 flex items-center gap-3 backdrop-blur-md"
                    >
                        <Bot size={24} />
                        <span>{language === 'vi' ? "Trợ lý ảo AI" : "AI Assistant"}</span>
                        <ExternalLink size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                    </a>
                </div>

                <div className="mt-8 text-slate-600 text-xs font-mono">
                    v1.3.0 • Powered by DTU & Gemini AI
                </div>
            </div>
        </div>
    );
};

export default CoverPage;

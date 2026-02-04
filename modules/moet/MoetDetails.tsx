
import React from 'react';
import { AppState } from '../../types';
import { FileText, Users, GraduationCap, Scale, Globe, BookOpen } from 'lucide-react';
import { RichNarrativeSection, RichTextEditor } from './MoetShared';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const MoetDetails: React.FC<Props> = ({ state, updateState }) => {
  const { generalInfo, language } = state;
  const moetInfo = generalInfo.moetInfo;

  const updateMoetField = (field: keyof typeof moetInfo, value: any) => {
    updateState(prev => ({
      ...prev,
      generalInfo: {
        ...prev.generalInfo,
        moetInfo: { ...prev.generalInfo.moetInfo, [field]: value }
      }
    }));
  };

  const updateMoetLangField = (field: keyof typeof moetInfo, value: string) => {
    const currentVal = (moetInfo[field] as any) || { vi: '', en: '' };
    updateMoetField(field, { ...currentVal, [language]: value });
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50"><h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-emerald-600"/>{language === 'vi' ? '3. Thông tin chi tiết' : '3. Detailed Information'}</h3></div>
        <div className="p-6 space-y-8">
            {/* Section 5: Admission */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                        <Users size={20} />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                        {language === 'vi' ? '5. Đối tượng tuyển sinh, Chuẩn đầu vào' : '5. Admission Target & Requirements'}
                    </h3>
                </div>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-slate-700 ml-12">
                            {language === 'vi' ? '5.1. Đối tượng tuyển sinh' : '5.1. Admission Target'}
                        </h4>
                        <RichTextEditor 
                            value={moetInfo.admissionTarget[language]} 
                            onChange={v => updateMoetLangField('admissionTarget', v)} 
                        />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-slate-700 ml-12">
                            {language === 'vi' ? '5.2. Chuẩn đầu vào' : '5.2. Admission Requirements'}
                        </h4>
                        <RichTextEditor 
                            value={moetInfo.admissionReq[language]} 
                            onChange={v => updateMoetLangField('admissionReq', v)} 
                        />
                    </div>
                </div>
            </div>

            <RichNarrativeSection icon={<GraduationCap size={20} />} title={language === 'vi' ? '6. Điều kiện tốt nghiệp' : '6. Graduation Requirements'} value={moetInfo.graduationReq[language]} onChange={v => updateMoetLangField('graduationReq', v)} />
            <RichNarrativeSection icon={<Scale size={20} />} title={language === 'vi' ? '7. Thang điểm' : '7. Grading Scale'} value={moetInfo.gradingScale[language]} onChange={v => updateMoetLangField('gradingScale', v)} />
            <RichNarrativeSection icon={<Globe size={20} />} title={language === 'vi' ? '12. Các chương trình tham khảo' : '12. Referenced Programs'} value={moetInfo.referencedPrograms[language]} onChange={v => updateMoetLangField('referencedPrograms', v)} />
            
            {/* Section 13: Implementation Guidelines */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                        <BookOpen size={20} />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                        {language === 'vi' ? '13. Hướng dẫn thực hiện chương trình' : '13. Implementation Guidelines'}
                    </h3>
                </div>
                
                <div className="space-y-6">
                    {/* 13.1 Facilities */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-slate-700 ml-12">
                            {language === 'vi' ? '13.1. Sử dụng cơ sở vật chất trong quá trình đào tạo' : '13.1. Facilities Usage'}
                        </h4>
                        <RichTextEditor 
                            value={moetInfo.guidelineFacilities?.[language] || ''} 
                            onChange={v => updateMoetLangField('guidelineFacilities', v)} 
                        />
                    </div>
                    
                    {/* 13.2 Class Forms */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-slate-700 ml-12">
                            {language === 'vi' ? '13.2. Các hình thức lớp học' : '13.2. Class Forms'}
                        </h4>
                        <RichTextEditor 
                            value={moetInfo.guidelineClassForms?.[language] || ''} 
                            onChange={v => updateMoetLangField('guidelineClassForms', v)} 
                        />
                    </div>

                    {/* 13.3 Other Guidelines */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-slate-700 ml-12">
                            {language === 'vi' ? '13.3. Các hướng dẫn khác' : '13.3. Other Guidelines'}
                        </h4>
                        <RichTextEditor 
                            value={moetInfo.guidelineCreditConversion?.[language] || ''} 
                            onChange={v => updateMoetLangField('guidelineCreditConversion', v)} 
                        />
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
};

export default MoetDetails;

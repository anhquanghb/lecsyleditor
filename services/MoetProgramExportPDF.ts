
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Course, Faculty, GeneralInfo, Language, MoetInfo, MoetObjective, TeachingMethod, AssessmentMethod, SO, MoetCategory } from '../types';

const CATEGORY_ORDER: MoetCategory[] = ['knowledge', 'skills', 'learning'];
const CATEGORY_LABELS = {
  knowledge: { vi: 'Kiến thức', en: 'Knowledge' },
  skills: { vi: 'Kỹ năng', en: 'Skills' },
  learning: { vi: 'Năng lực tự chủ & Trách nhiệm', en: 'Autonomy & Responsibility' }
};

const htmlToPdfText = (html: string) => {
    if (!html) return "";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const ulItems = tempDiv.querySelectorAll("ul li");
    ulItems.forEach(li => { li.textContent = "• " + li.textContent + "\n"; });
    const olItems = tempDiv.querySelectorAll("ol");
    olItems.forEach(ol => {
      const liItems = ol.querySelectorAll("li");
      liItems.forEach((li, idx) => { li.textContent = `${idx + 1}. ` + li.textContent + "\n"; });
    });
    const blocks = tempDiv.querySelectorAll("p, div, br");
    blocks.forEach((block) => {
        if (block.tagName === "BR") { block.replaceWith("\n"); } 
        else { block.textContent = `${block.textContent}\n`; }
    });
    let text = tempDiv.textContent || "";
    return text.replace(/\n\s*\n/g, "\n\n").trim();
};

export const exportMoetPdf = async (
    generalInfo: GeneralInfo,
    moetInfo: MoetInfo,
    courses: Course[],
    faculties: Faculty[],
    language: Language,
    sortedObjectives: MoetObjective[],
    impliedCourseObjectiveLinks: Set<string>,
    teachingMethods: TeachingMethod[],
    assessmentMethods: AssessmentMethod[],
    sos: SO[]
) => {
    try {
          const doc = new jsPDF();
          const fontUrlRegular = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
          const fontUrlBold = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf';
          
          const [bufferRegular, bufferBold] = await Promise.all([
              fetch(fontUrlRegular).then(res => res.arrayBuffer()),
              fetch(fontUrlBold).then(res => res.arrayBuffer())
          ]);
          
          const arrayBufferToBinaryString = (buffer: ArrayBuffer) => {
              const bytes = new Uint8Array(buffer);
              let binary = '';
              const len = bytes.byteLength;
              for (let i = 0; i < len; i++) {
                  binary += String.fromCharCode(bytes[i]);
              }
              return binary;
          };
          
          doc.addFileToVFS('Roboto-Regular.ttf', btoa(arrayBufferToBinaryString(bufferRegular)));
          doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal', 'Identity-H');
          doc.addFileToVFS('Roboto-Bold.ttf', btoa(arrayBufferToBinaryString(bufferBold)));
          doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold', 'Identity-H');
          
          doc.setFont('Roboto'); 
          
          const centerText = (text: string, y: number, size: number = 13, font: 'bold' | 'normal' = 'normal') => {
              doc.setFontSize(size); doc.setFont('Roboto', font);
              doc.text(text, 105, y, { align: 'center' });
          };
          let y = 20;
          doc.setFontSize(13); doc.setFont('Roboto', 'bold');
          doc.text("BỘ GIÁO DỤC VÀ ĐÀO TẠO", 40, y, { align: 'center' });
          doc.text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", 160, y, { align: 'center' });
          y += 6;
          doc.text(generalInfo.university[language].toUpperCase(), 40, y, { align: 'center' });
          doc.setFont('Roboto', 'normal'); 
          doc.text("Độc lập - Tự do - Hạnh phúc", 160, y, { align: 'center' });
          y += 2; doc.setLineWidth(0.5); doc.line(25, y, 55, y); doc.line(145, y, 175, y); y += 25;
          centerText("CHƯƠNG TRÌNH ĐÀO TẠO", y, 16, 'bold');
          y += 10; centerText(`(Ban hành theo Quyết định số.................... ngày.... tháng.... năm....`, y, 13, 'normal');
          y += 6; centerText(`của Giám đốc ${generalInfo.university[language]})`, y, 13, 'normal'); y += 20;
          const infoXLabel = 40; const infoXVal = 90;
          const addInfoRow = (label: string, value: string) => {
              doc.setFont('Roboto', 'normal'); doc.setFontSize(13); doc.text(label, infoXLabel, y);
              doc.setFont('Roboto', 'bold'); doc.text(value || "", infoXVal, y); y += 8;
          };
          addInfoRow("Trình độ đào tạo:", moetInfo.level[language]);
          addInfoRow("Ngành đào tạo:", moetInfo.majorName[language]);
          addInfoRow("Mã ngành:", moetInfo.majorCode);
          addInfoRow("Chuyên ngành:", moetInfo.specializationName[language] || "N/A");
          addInfoRow("Mã chuyên ngành:", moetInfo.specializationCode || "N/A");
          addInfoRow("Hình thức đào tạo:", moetInfo.trainingMode[language]);
          addInfoRow("Phương thức đào tạo:", moetInfo.trainingType[language]);
          addInfoRow("Ngôn ngữ đào tạo:", moetInfo.trainingLanguage[language]);
          y += 10;
          const printSectionHeader = (title: string) => {
              if (y > 275) { doc.addPage(); y = 20; }
              doc.setFont('Roboto', 'bold'); doc.setFontSize(13); doc.text(title, 14, y); y += 7;
          };
          const printSectionContent = (content: string) => {
              doc.setFont('Roboto', 'normal'); doc.setFontSize(13);
              const clean = htmlToPdfText(content);
              const split = doc.splitTextToSize(clean || "", 180);
              // Line-by-line printing to handle page breaks naturally
              const lineHeight = 6;
              for (let i = 0; i < split.length; i++) {
                  if (y > 275) { doc.addPage(); y = 20; }
                  doc.text(split[i], 14, y); 
                  y += lineHeight;
              }
              y += 2;
          };
          printSectionHeader("1. Mục tiêu đào tạo");
          printSectionHeader("1.1. Mục tiêu chung");
          printSectionContent(moetInfo.generalObjectives[language]);
          
          printSectionHeader("1.2. Mục tiêu cụ thể");
          (moetInfo.moetSpecificObjectives || []).forEach((obj, idx) => {
              const text = `${idx + 1}. ${obj.description[language]}`;
              const split = doc.splitTextToSize(text, 170); 
              if (y + split.length * 6 > 275) { doc.addPage(); y = 20; }
              doc.text(split, 20, y); 
              y += split.length * 6 + 2;
          });

          y += 5;
          printSectionHeader("2. Chuẩn đầu ra");
          CATEGORY_ORDER.forEach(cat => {
              const meta = CATEGORY_LABELS[cat];
              const objs = sortedObjectives.filter(o => o.category === cat);
              if (objs.length > 0) {
                  if (y > 270) { doc.addPage(); y = 20; }
                  doc.setFont('Roboto', 'bold'); doc.text(`• ${language === 'vi' ? meta.vi : meta.en}`, 14, y); y += 6;
                  doc.setFont('Roboto', 'normal');
                  objs.forEach(o => {
                      const getObjectiveLabel = (id: string) => {
                          const index = sortedObjectives.findIndex(ob => ob.id === id);
                          if (index === -1) return '?';
                          const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                          if (index < letters.length) return letters[index];
                          return letters[index % letters.length] + Math.floor(index / letters.length);
                      };
                      const label = getObjectiveLabel(o.id); const text = `${label}. ${o.description[language]}`;
                      const split = doc.splitTextToSize(text, 170); 
                      if (y + split.length * 6 > 275) { doc.addPage(); y = 20; }
                      doc.text(split, 20, y); 
                      y += split.length * 6 + 2;
                  });
                  y += 4;
              }
          });
          printSectionHeader(`3. Thời gian đào tạo: ${moetInfo.duration}`);
          
          // Calculate total credits based on Program Structure (Module 9)
          const calculateStructureCredits = () => {
              let total = 0;
              const structure = moetInfo.programStructure || { gen: [], phys: [], fund: [], spec: [], grad: [] };
              
              // 1. Compulsory Courses in main blocks
              ['gen', 'phys', 'fund', 'spec', 'grad'].forEach(blockKey => {
                  const ids = structure[blockKey as keyof typeof structure] || [];
                  ids.forEach(id => {
                      const c = courses.find(x => x.id === id);
                      if (c) total += c.credits;
                  });
              });

              // 2. Elective Sub-blocks (count minCredits)
              (moetInfo.subBlocks || []).forEach(sb => {
                  total += (sb.minCredits || 0);
              });

              return total;
          };
          
          const totalCreditsCount = calculateStructureCredits();
          printSectionHeader(`4. Khối lượng kiến thức toàn khóa: ${totalCreditsCount} tín chỉ`);
          y += 5;
          printSectionHeader("5. Đối tượng tuyển sinh và chuẩn đầu vào:");
          printSectionContent(moetInfo.admissionTarget[language]);
          printSectionHeader("6. Điều kiện tốt nghiệp:");
          printSectionContent(moetInfo.graduationReq[language]);
          printSectionHeader("7. Thang điểm:");
          printSectionContent(moetInfo.gradingScale[language]);
          if (y > 250) { doc.addPage(); y = 20; }
          
          // --- SECTION 8: PROGRAM CONTENT ---
          printSectionHeader("8. Nội dung chương trình");
          const renderStructureTable = (blockTitle: string, blockIndex: string, idList: string[], parentBlockId: string) => {
              if (y > 250) { doc.addPage(); y = 20; }
              // Main Block Header
              doc.setFont('Roboto', 'bold'); doc.setFontSize(13); doc.text(`${blockIndex}. ${blockTitle}`, 14, y); y += 7;
              
              // 8.x.1. Compulsory Courses
              if (idList) {
                  const subTitle = `${blockIndex}.1. ${language === 'vi' ? 'Học phần bắt buộc' : 'Compulsory Courses'}`;
                  doc.setFont('Roboto', 'bold'); doc.setFontSize(13); doc.text(subTitle, 14, y); y += 6;

                  const directBody = idList.map(id => {
                      const c = courses.find(x => x.id === id);
                      return c ? [c.code || "", c.name[language] || "", c.credits.toString() || "0", "LEC: " + c.credits] : ["", "", "", ""];
                  });

                  // If empty, show one empty row
                  if(directBody.length === 0) directBody.push(["", "", "", ""]);

                  autoTable(doc, {
                      startY: y, head: [['Mã môn', 'Tên môn học', 'Số TC', 'Cụ thể']], body: directBody, theme: 'grid',
                      styles: { font: 'Roboto', fontSize: 11, cellPadding: 3, valign: 'middle' },
                      headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold', halign: 'center' },
                      columnStyles: { 0: { cellWidth: 30 }, 2: { halign: 'center' }, 3: { halign: 'center' } },
                      margin: { left: 14, right: 14 }
                  });
                  y = (doc as any).lastAutoTable.finalY + 10;
              }

              // 8.x.2. Elective Courses (Sub-blocks)
              const relevantSubBlocks = (moetInfo.subBlocks || []).filter(sb => sb.parentBlockId === parentBlockId);
              if (relevantSubBlocks.length > 0) {
                  if (y > 250) { doc.addPage(); y = 20; }
                  const subTitle = `${blockIndex}.2. ${language === 'vi' ? 'Học phần tự chọn' : 'Elective Courses'}`;
                  doc.setFont('Roboto', 'bold'); doc.setFontSize(13); doc.text(subTitle, 14, y); y += 6;

                  let subBlockBody: any[][] = [];
                  relevantSubBlocks.forEach(sb => {
                      // Sub-block Header Row
                      subBlockBody.push([{ content: `${sb.name[language] || ""} (Min ${sb.minCredits || 0} cr)`, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [240, 248, 255] } }]);
                      // Courses in Sub-block
                      sb.courseIds.forEach(cid => {
                          const c = courses.find(x => x.id === cid);
                          if(c) {
                              subBlockBody.push([c.code || "", c.name[language] || "", c.credits.toString() || "0", "LEC: " + c.credits]);
                          }
                      });
                  });

                  autoTable(doc, {
                      startY: y, head: [['Mã môn', 'Tên môn học', 'Số TC', 'Cụ thể']], body: subBlockBody, theme: 'grid',
                      styles: { font: 'Roboto', fontSize: 11, cellPadding: 3, valign: 'middle' },
                      headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold', halign: 'center' },
                      columnStyles: { 0: { cellWidth: 30 }, 2: { halign: 'center' }, 3: { halign: 'center' } },
                      margin: { left: 14, right: 14 }
                  });
                  y = (doc as any).lastAutoTable.finalY + 10;
              }
          };

          renderStructureTable(language === 'vi' ? 'Kiến thức giáo dục đại cương' : 'General Education', '8.1', moetInfo.programStructure.gen, 'gen');
          renderStructureTable(language === 'vi' ? 'Giáo dục thể chất' : 'Physical Education', '8.2', moetInfo.programStructure.phys || [], 'phys');
          renderStructureTable(language === 'vi' ? 'Kiến thức cơ sở ngành' : 'Fundamental Engineering', '8.3', moetInfo.programStructure.fund, 'fund');
          renderStructureTable(language === 'vi' ? 'Kiến thức chuyên ngành' : 'Specialized Engineering', '8.4', moetInfo.programStructure.spec, 'spec');
          renderStructureTable(language === 'vi' ? 'Tốt nghiệp cuối khóa' : 'Graduation & Internship', '8.5', moetInfo.programStructure.grad, 'grad');
          
          if (y > 250) { doc.addPage(); y = 20; }
          // Section 9
          printSectionHeader("9. Kế hoạch đào tạo");
          printSectionHeader("9.1. Danh sách giảng viên thực hiện chương trình");
          const facultyTableBody = (moetInfo.programFaculty || []).map((f, idx) => [
            (idx + 1).toString(), f.name || "", f.position || "", f.major || "", f.degree || "", f.responsibility || "", f.note || ""
          ]);
          autoTable(doc, {
              startY: y, 
              head: [['STT', 'Họ Và Tên', 'Chức vụ', 'Ngành', 'Trình độ', 'Chức trách', 'Ghi chú']], 
              body: facultyTableBody, 
              theme: 'grid',
              styles: { font: 'Roboto', fontSize: 11, cellPadding: 3 },
              headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold', halign: 'center' },
              margin: { left: 14, right: 14 }
          });
          y = (doc as any).lastAutoTable.finalY + 10;
          
          if (y > 250) { doc.addPage(); y = 20; }
          printSectionHeader("9.2. Kế hoạch");
          const sortedCourses = [...courses].sort((a,b) => a.semester - b.semester || a.code.localeCompare(b.code));
          const planBody = sortedCourses.map(c => [ c.code || "", c.name[language] || "", c.credits.toString() || "0", c.semester.toString() || "", "" ]);
          autoTable(doc, {
              startY: y, head: [['Mã Môn', 'Tên Môn', 'Số TC', 'Học kỳ', 'Giảng viên']], body: planBody, theme: 'grid',
              styles: { font: 'Roboto', fontSize: 11, cellPadding: 3 },
              headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold', halign: 'center' },
              columnStyles: { 2: { halign: 'center', cellWidth: 30 }, 3: { halign: 'center', cellWidth: 30 } },
              margin: { left: 14, right: 14 }
          });
          y = (doc as any).lastAutoTable.finalY + 10;

          if (y > 250) { doc.addPage(); y = 20; }
          printSectionHeader("10. Mối quan hệ giữa chuẩn đầu ra và các học phần");
          const getObjectiveLabel = (id: string) => {
              const index = sortedObjectives.findIndex(ob => ob.id === id);
              if (index === -1) return '?';
              const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
              if (index < letters.length) return letters[index];
              return letters[index % letters.length] + Math.floor(index / letters.length);
          };
          const objectiveLabels = sortedObjectives.map(o => getObjectiveLabel(o.id));
          const matrixHead = [['Mã HP', 'Tên học phần', 'TC', ...objectiveLabels]];
          const matrixBody = sortedCourses.map(c => {
              const row = [c.code || "", c.name[language] || "", c.credits.toString() || "0"];
              sortedObjectives.forEach(obj => {
                  const key = `${c.id}|${obj.id}`;
                  const isImplied = impliedCourseObjectiveLinks.has(key);
                  const isManual = (moetInfo.courseObjectiveMap || []).includes(key);
                  row.push(isImplied || isManual ? "X" : "");
              });
              return row;
          });
          doc.setFontSize(11); doc.text("Chuẩn đầu ra", 150, y + 5);
          autoTable(doc, {
              startY: y, head: matrixHead, body: matrixBody, theme: 'grid',
              styles: { font: 'Roboto', fontSize: 10, cellPadding: 2, halign: 'center' },
              columnStyles: { 1: { halign: 'left' } },
              headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
              margin: { left: 14, right: 14 }
          });
          y = (doc as any).lastAutoTable.finalY + 10;
          
          if (y > 250) { doc.addPage(); y = 20; }
          printSectionHeader("11. Đề cương chi tiết các học phần");
          
          // ... (Course syllabus export - Same logic as MoetProgramExportDOC but for PDF)
          // Simplified placeholder for now as full syllabus export logic is duplicated in SyllabusExportPDF
          doc.setFontSize(11); doc.setFont('Roboto', 'italic');
          doc.text("Xem phần xuất chi tiết tại Module Đề cương.", 14, y);
          y += 10;

          if (y > 250) { doc.addPage(); y = 20; }
          printSectionHeader("12. Các chương trình đào tạo được tham khảo");
          printSectionContent(moetInfo.referencedPrograms[language]);
          
          // SECTION 13: GUIDELINES
          printSectionHeader("13. Hướng dẫn thực hiện chương trình");
          
          printSectionHeader("13.1. Sử dụng cơ sở vật chất trong quá trình đào tạo");
          printSectionContent(moetInfo.guidelineFacilities?.[language] || '');
          
          printSectionHeader("13.2. Các hình thức lớp học");
          printSectionContent(moetInfo.guidelineClassForms?.[language] || '');
          
          printSectionHeader(language === 'vi' ? "13.3. Các hướng dẫn khác" : "13.3. Other Guidelines");
          printSectionContent(moetInfo.guidelineCreditConversion?.[language] || '');

          if (y > 240) { doc.addPage(); y = 20; }
          y += 20; doc.setFont('Roboto', 'bold'); doc.setFontSize(13); doc.text(generalInfo.university[language] || "", 150, y, { align: 'center' });
          y += 6; doc.text(language === 'vi' ? "GIÁM ĐỐC" : "PROVOST", 150, y, { align: 'center' });
          doc.save(`MOET_Program_Spec_${(generalInfo.programName[language] || "Program").replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Error generating PDF. Please check internet connection for font loading.");
    }
};

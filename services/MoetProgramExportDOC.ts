
import { Document, Packer, Paragraph, PageBreak, Footer, TextRun, AlignmentType, PageNumber, TableOfContents, StyleLevel, NumberFormat } from "docx";
import { Course, Faculty, GeneralInfo, Language, MoetInfo, TeachingMethod, AssessmentMethod, SO, Department, AcademicFaculty, AcademicSchool, FacultyTitles, IRM, Facility } from '../types';
import { generateMoetPart1 } from './MoetP1';
import { generateMoetPart2 } from './MoetP2';
import { generateMoetPart3 } from './MoetP3';
import { generateMoetPart4 } from './MoetP4';
import { generateMoetEndSection } from './MoetEndSection';
import { generateSingleSyllabusContent } from './MoetSyllabus';

export const exportMoetDocx = async (
    generalInfo: GeneralInfo,
    moetInfo: MoetInfo,
    courses: Course[],
    faculties: Faculty[],
    language: Language,
    teachingMethods: TeachingMethod[],
    assessmentMethods: AssessmentMethod[],
    sos: SO[],
    facultyTitles: FacultyTitles,
    courseSoMap: { courseId: string; soId: string; level: IRM }[],
    facilities: Facility[],
    departments: Department[],
    academicFaculties: AcademicFaculty[],
    academicSchools: AcademicSchool[]
) => {
    try {
        // --- SECTION 1: MAIN CONTENT (Part 1 - Part 5) ---
        const mainSectionChildren: any[] = [];

        // Part 1
        const part1 = generateMoetPart1(generalInfo, moetInfo, courses, language);
        mainSectionChildren.push(...part1);
        mainSectionChildren.push(new Paragraph({ children: [new PageBreak()] }));

        // Part 2
        const part2 = generateMoetPart2(generalInfo, moetInfo, courses, teachingMethods, faculties, language);
        mainSectionChildren.push(...part2);
        mainSectionChildren.push(new Paragraph({ children: [new PageBreak()] }));

        // Part 3
        const part3 = generateMoetPart3(generalInfo, moetInfo, courses, faculties, facultyTitles, language);
        mainSectionChildren.push(...part3);
        mainSectionChildren.push(new Paragraph({ children: [new PageBreak()] }));

        // Part 4 (Matrix)
        const part4 = generateMoetPart4(generalInfo, courses, courseSoMap, language);
        mainSectionChildren.push(...part4);
        mainSectionChildren.push(new Paragraph({ children: [new PageBreak()] }));

        // Part 5 (End Section)
        const part5 = generateMoetEndSection(generalInfo, facilities, teachingMethods, courses, language);
        mainSectionChildren.push(...part5);
        // Note: Do NOT add a PageBreak here manually, the new Section will handle the break.

        // --- SECTION 2: APPENDIX (Syllabus) ---
        const appendixSectionChildren: any[] = [];

        // Appendix Header: Normal Style, Uppercase, Bold, Black, Center
        const appendixTitleText = language === 'vi' ? "PHỤ LỤC: ĐỀ CƯƠNG CHI TIẾT CÁC HỌC PHẦN" : "APPENDIX: DETAILED SYLLABI";
        appendixSectionChildren.push(
            new Paragraph({
                children: [
                    new TextRun({ 
                        text: appendixTitleText, 
                        font: "Times New Roman", 
                        size: 26, // 13pt
                        bold: true,
                        color: "000000"
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400, before: 400 }
            })
        );

        // Table of Contents (Summary)
        appendixSectionChildren.push(new TableOfContents("Summary", {
            hyperlink: true,
            headingStyleRange: "1-1",
            stylesWithLevels: [new StyleLevel("Heading1", 1)]
        }));

        // Page Break after TOC before first syllabus
        appendixSectionChildren.push(new Paragraph({ children: [new PageBreak()] }));

        // Full Syllabus Content
        // Filter out Phys Ed
        const physIds = new Set<string>();
        (moetInfo.programStructure.phys || []).forEach(id => physIds.add(id));
        (moetInfo.subBlocks || []).forEach(sb => {
            if (sb.parentBlockId === 'phys') {
                sb.courseIds.forEach(id => physIds.add(id));
            }
        });

        const sortedCourses = [...courses]
            .filter(c => !physIds.has(c.id))
            .sort((a,b) => a.semester - b.semester || a.code.localeCompare(b.code));

        sortedCourses.forEach((course, index) => {
            const syllabusContent = generateSingleSyllabusContent(
                course, 
                index + 1,
                assessmentMethods,
                language,
                generalInfo,
                faculties,
                teachingMethods,
                sos,
                departments,
                academicFaculties,
                academicSchools
            );
            appendixSectionChildren.push(...syllabusContent);
            if (index < sortedCourses.length - 1) {
                appendixSectionChildren.push(new Paragraph({ children: [new PageBreak()] }));
            }
        });

        // Construct Document with 2 Sections
        const doc = new Document({
            sections: [
                // SECTION 1: Parts 1-5 (Normal Page Numbering)
                {
                    properties: {
                        page: {
                            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
                        }
                    },
                    footers: {
                        default: new Footer({
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ children: [PageNumber.CURRENT] })]
                                })
                            ]
                        })
                    },
                    children: mainSectionChildren
                },
                // SECTION 2: Appendix (Reset Page Numbering, Format p-1)
                {
                    properties: {
                        page: {
                            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
                            pageNumbers: {
                                start: 1,
                                formatType: NumberFormat.DECIMAL
                            }
                        }
                    },
                    footers: {
                        default: new Footer({
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun("p-"),
                                        new TextRun({ children: [PageNumber.CURRENT] })
                                    ]
                                })
                            ]
                        })
                    },
                    children: appendixSectionChildren
                }
            ]
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `MOET_Full_Program_Doc_${generalInfo.programName[language].replace(/\s+/g, '_')}.docx`;
        link.click();
    } catch (e) {
        console.error(e);
        alert("Error creating Full MOET Docx");
    }
};

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, VerticalAlign } from "docx";
import { GeneralInfo, Language, MoetInfo, Course, Faculty, FacultyTitles, FacultyTitle } from '../types';

// Constants for formatting (Font 11pt = 22 half-points)
const FONT_FAMILY = "Times New Roman";
const FONT_SIZE_H1 = 26; // 13pt
const FONT_SIZE_BODY = 22; // 11pt (Requested)
const TABLE_FONT_SIZE = 22; // 11pt (Requested)

const styles = {
    h1: { font: FONT_FAMILY, size: FONT_SIZE_H1, bold: true },
    h2: { font: FONT_FAMILY, size: FONT_SIZE_BODY, bold: true, italics: true },
    body: { font: FONT_FAMILY, size: FONT_SIZE_BODY },
    tableHeader: { font: FONT_FAMILY, size: TABLE_FONT_SIZE, bold: true },
    tableBody: { font: FONT_FAMILY, size: TABLE_FONT_SIZE },
};

// Helper to create paragraphs
const createPara = (text: string, style: any, align: any = AlignmentType.LEFT) => {
    return new Paragraph({
        children: [new TextRun({ text, ...style })],
        alignment: align,
        spacing: { after: 120, line: 276 },
    });
};

const createTableCell = (text: string, style: any, align: any = AlignmentType.LEFT) => {
    // Split by newline to create separate runs or paragraphs if needed
    const lines = text.split('\n');
    const runs: any[] = [];
    lines.forEach((line, i) => {
        runs.push(new TextRun({ text: line, ...style }));
        if (i < lines.length - 1) {
            runs.push(new TextRun({ break: 1 }));
        }
    });

    return new TableCell({
        children: [new Paragraph({ children: runs, alignment: align, spacing: { after: 120 } })],
        verticalAlign: VerticalAlign.CENTER,
    });
};

// Helper to split course code
const splitCourseCode = (code: string) => {
    const cleanCode = code ? code.trim() : "";
    if (cleanCode.length <= 3) return { letters: cleanCode, numbers: "" };
    
    // Take the last 3 characters as numbers
    const numbers = cleanCode.slice(-3);
    // Take the rest as letters and trim
    const letters = cleanCode.slice(0, -3).trim();
    
    return { letters, numbers };
};

export const generateMoetPart3 = (
    generalInfo: GeneralInfo, 
    moetInfo: MoetInfo, 
    courses: Course[], 
    faculties: Faculty[],
    facultyTitles: FacultyTitles,
    language: Language
) => {
    const sections: any[] = [];

    // Helper to find abbreviation
    const getAbbreviation = (fullText: string, list: FacultyTitle[]) => {
        const found = list.find(item => item.name[language] === fullText || item.name['en'] === fullText || item.name['vi'] === fullText);
        // Prioritize current language abbreviation, then EN, then VI, then fallback to full text
        if (found && found.abbreviation) {
            return found.abbreviation[language] || found.abbreviation['en'] || found.abbreviation['vi'] || fullText;
        }
        return fullText;
    };

    // Main Header
    sections.push(createPara("9. Kế hoạch đào tạo", styles.h1));

    // 9.1 Danh sách nhân sự phụ trách ngành
    sections.push(createPara("9.1. Danh sách nhân sự phụ trách ngành", styles.h2));

    const facultyHeader = [
        "TT", "Họ và tên", "Học hàm, học vị", "Ngành/Chuyên ngành được đào tạo", "Chức trách", "Ghi chú"
    ];

    const facultyRows = (moetInfo.programFaculty || []).map((f, idx) => [
        (idx + 1).toString(),
        f.name || "",
        f.degree || "", // Assuming degree field stores "Học hàm, học vị"
        f.major || "",
        f.responsibility || "",
        f.note || ""
    ]);

    // Ensure at least one empty row if no data
    if (facultyRows.length === 0) {
        facultyRows.push(["", "", "", "", "", ""]);
    }

    sections.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
            new TableRow({
                children: facultyHeader.map(h => new TableCell({
                    children: [createPara(h, styles.tableHeader, AlignmentType.CENTER)],
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { fill: "F2F2F2" }
                })),
                tableHeader: true
            }),
            ...facultyRows.map(row => new TableRow({
                children: row.map((text, i) => createTableCell(text, styles.tableBody, i === 0 ? AlignmentType.CENTER : AlignmentType.LEFT))
            }))
        ]
    }));

    sections.push(createPara("", styles.body)); // Spacer

    // 9.2 Khung kế hoạch đào tạo
    sections.push(createPara("9.2. Khung kế hoạch đào tạo", styles.h2));

    const planHeader = [
        "TT", "Mã chữ", "Mã số", "Tên môn", "Số TC", "Học kỳ", "Giảng viên giảng dạy", "Học hàm, học vị"
    ];

    // Filter out Physical Education courses (block 'phys' and its sub-blocks)
    const physBlockIds = new Set<string>();
    (moetInfo.programStructure.phys || []).forEach(id => physBlockIds.add(id));
    (moetInfo.subBlocks || []).forEach(sb => {
        if (sb.parentBlockId === 'phys') {
            sb.courseIds.forEach(id => physBlockIds.add(id));
        }
    });

    const validCourses = courses.filter(c => !physBlockIds.has(c.id));

    // Sort courses: Semester asc, then Code asc
    const sortedCourses = [...validCourses].sort((a, b) => {
        if (a.semester !== b.semester) return a.semester - b.semester;
        return a.code.localeCompare(b.code);
    });

    const planRows = sortedCourses.map((c, idx) => {
        // Resolve Instructor(s)
        const instructorIds = c.instructorIds || [];
        
        // Sort: Main first (isMain=true), then others
        const sortedInstructorIds = [...instructorIds].sort((a, b) => {
            const isMainA = c.instructorDetails?.[a]?.isMain ? 1 : 0;
            const isMainB = c.instructorDetails?.[b]?.isMain ? 1 : 0;
            return isMainB - isMainA;
        });

        // 1. Instructor Names (Separate Lines)
        const instructorNames = sortedInstructorIds.map(fid => {
            const f = faculties.find(fac => fac.id === fid);
            return f ? f.name[language] : "";
        }).filter(Boolean).join("\n");

        // 2. Instructor Degrees/Titles (Separate Lines, Abbreviated)
        const instructorDegrees = sortedInstructorIds.map(fid => {
            const f = faculties.find(fac => fac.id === fid);
            if (!f) return "";
            
            // Get raw strings
            const rawDegree = f.degree[language];
            const rawAcademicTitle = f.academicTitle[language];

            // Convert to Abbreviations
            const degreeAbbr = getAbbreviation(rawDegree, facultyTitles.degrees);
            let combined = degreeAbbr;

            // Prepend Academic Title if valid (not None/Không)
            if (rawAcademicTitle && rawAcademicTitle !== 'Không' && rawAcademicTitle !== 'None') {
                const titleAbbr = getAbbreviation(rawAcademicTitle, facultyTitles.academicTitles);
                combined = `${titleAbbr} ${degreeAbbr}`;
            }
            
            return combined.trim();
        }).filter(Boolean).join("\n");

        const { letters, numbers } = splitCourseCode(c.code);

        return [
            (idx + 1).toString(),
            letters,
            numbers,
            c.name[language],
            c.credits.toString(),
            c.semester.toString(),
            instructorNames,
            instructorDegrees
        ];
    });

    sections.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
            new TableRow({
                children: planHeader.map((h, i) => {
                    let widthOptions = undefined;
                    // Name is index 3
                    if (i === 3) widthOptions = { size: 25, type: WidthType.PERCENTAGE };
                    // Degree/Title is index 7
                    if (i === 7) widthOptions = { size: 10, type: WidthType.PERCENTAGE };

                    return new TableCell({
                        children: [createPara(h, styles.tableHeader, AlignmentType.CENTER)],
                        verticalAlign: VerticalAlign.CENTER,
                        shading: { fill: "F2F2F2" },
                        width: widthOptions
                    });
                }),
                tableHeader: true
            }),
            ...planRows.map(row => new TableRow({
                children: row.map((text, i) => createTableCell(
                    text, 
                    styles.tableBody, 
                    // Center: TT(0), Letters(1), Numbers(2), Credits(4), Sem(5)
                    (i === 0 || i === 1 || i === 2 || i === 4 || i === 5) ? AlignmentType.CENTER : AlignmentType.LEFT
                ))
            }))
        ]
    }));

    return sections;
};

export const exportMoetP3 = async (
    generalInfo: GeneralInfo, 
    moetInfo: MoetInfo, 
    courses: Course[], 
    faculties: Faculty[],
    facultyTitles: FacultyTitles,
    language: Language
) => {
    try {
        const children = generateMoetPart3(generalInfo, moetInfo, courses, faculties, facultyTitles, language);
        
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440, // 1 inch
                            bottom: 1440,
                            left: 1440,
                            right: 1440
                        }
                    }
                },
                children: children
            }]
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `MOET_Part3_${generalInfo.programName[language].replace(/\s+/g, '_')}.docx`;
        link.click();
    } catch (e) {
        console.error(e);
        alert("Error creating Page 3 DOCX");
    }
};
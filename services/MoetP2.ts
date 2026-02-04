import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, VerticalAlign } from "docx";
import { GeneralInfo, Language, MoetInfo, Course, TeachingMethod, MoetCategory, Faculty } from '../types';

// Constants for formatting
const FONT_FAMILY = "Times New Roman";
const FONT_SIZE_H1 = 26; // 13pt
const FONT_SIZE_BODY = 24; // 12pt
const TABLE_FONT_SIZE = 22; // 11pt

const styles = {
    h1: { font: FONT_FAMILY, size: FONT_SIZE_H1, bold: true },
    h2: { font: FONT_FAMILY, size: FONT_SIZE_BODY, bold: true, italics: true }, // 8.1, 8.2
    h3: { font: FONT_FAMILY, size: FONT_SIZE_BODY, italics: true }, // 8.1.1
    body: { font: FONT_FAMILY, size: FONT_SIZE_BODY },
    tableHeader: { font: FONT_FAMILY, size: TABLE_FONT_SIZE, bold: true },
    tableBody: { font: FONT_FAMILY, size: TABLE_FONT_SIZE },
};

// Helper to calculate "Cụ thể" (LT/TH) string
const calculateCreditDetails = (course: Course, methods: TeachingMethod[]): string => {
    let theoryCredits = 0;
    let practiceCredits = 0;

    course.topics.forEach(topic => {
        topic.activities.forEach(act => {
            const method = methods.find(m => m.id === act.methodId);
            if (method) {
                const credits = act.hours / (method.hoursPerCredit || 15);
                if (method.category === 'THEORY') {
                    theoryCredits += credits;
                } else {
                    practiceCredits += credits;
                }
            }
        });
    });

    // Round to reasonable decimals (usually 0.5 or 1)
    const t = Math.round(theoryCredits * 100) / 100;
    const p = Math.round(practiceCredits * 100) / 100;

    const parts = [];
    if (t > 0) parts.push(`${t} LT`);
    if (p > 0) parts.push(`${p} TH`);

    return parts.join(" + ");
};

// Helper to create paragraphs
const createPara = (text: string, style: any, align: any = AlignmentType.LEFT, indentLevel: number = 0) => {
    return new Paragraph({
        children: [new TextRun({ text, ...style })],
        alignment: align,
        spacing: { after: 120, line: 276 },
        indent: { left: indentLevel * 400 }
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

// Helper to create course table
const createCourseTable = (courses: Course[], methods: TeachingMethod[], language: Language, startIndex: number = 1) => {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
            // Header
            new TableRow({
                children: [
                    { text: "TT", width: 5 },
                    { text: "Mã chữ", width: 10 },
                    { text: "Mã số", width: 10 },
                    { text: "Tên môn học", width: 50 },
                    { text: "Số TC", width: 10 },
                    { text: "Cụ thể", width: 15 },
                ].map(col => new TableCell({
                    children: [createPara(col.text, styles.tableHeader, AlignmentType.CENTER)],
                    width: { size: col.width, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { fill: "F2F2F2" }
                })),
                tableHeader: true
            }),
            // Body
            ...courses.map((c, idx) => {
                const creditDetails = calculateCreditDetails(c, methods);
                const { letters, numbers } = splitCourseCode(c.code);

                return new TableRow({
                    children: [
                        new TableCell({ children: [createPara((startIndex + idx).toString(), styles.tableBody, AlignmentType.CENTER)], verticalAlign: VerticalAlign.CENTER }),
                        new TableCell({ children: [createPara(letters, styles.tableBody, AlignmentType.CENTER)], verticalAlign: VerticalAlign.CENTER }),
                        new TableCell({ children: [createPara(numbers, styles.tableBody, AlignmentType.CENTER)], verticalAlign: VerticalAlign.CENTER }),
                        new TableCell({ children: [createPara(c.name[language], styles.tableBody, AlignmentType.LEFT)], verticalAlign: VerticalAlign.CENTER }),
                        new TableCell({ children: [createPara(c.credits.toString(), styles.tableBody, AlignmentType.CENTER)], verticalAlign: VerticalAlign.CENTER }),
                        new TableCell({ children: [createPara(creditDetails, styles.tableBody, AlignmentType.CENTER)], verticalAlign: VerticalAlign.CENTER }),
                    ]
                });
            })
        ]
    });
};

export const generateMoetPart2 = (
    generalInfo: GeneralInfo, 
    moetInfo: MoetInfo, 
    courses: Course[], 
    methods: TeachingMethod[],
    faculties: Faculty[],
    language: Language
) => {
    const sections: any[] = [];

    // Main Header
    sections.push(createPara("8. Nội dung chương trình", styles.h1));

    // Define Blocks (Removed 'phys' / Physical Education)
    const blocks = [
        { key: 'gen', label: language === 'vi' ? 'Kiến thức giáo dục đại cương' : 'General Education' },
        // { key: 'phys', label: language === 'vi' ? 'Giáo dục thể chất' : 'Physical Education' }, // REMOVED
        { key: 'fund', label: language === 'vi' ? 'Kiến thức cơ sở ngành' : 'Fundamental Engineering' },
        { key: 'spec', label: language === 'vi' ? 'Kiến thức chuyên ngành' : 'Specialized Engineering' },
        { key: 'grad', label: language === 'vi' ? 'Tốt nghiệp cuối khóa' : 'Graduation' },
    ];

    let globalCourseIndex = 1;

    blocks.forEach((block, index) => {
        const blockNum = `8.${index + 1}`;
        const blockKey = block.key as keyof typeof moetInfo.programStructure;
        
        // --- 1. Calculate Data & Credits ---
        
        // A. Root Compulsory (Directly in list)
        const rootCompIds = moetInfo.programStructure[blockKey] || [];
        const rootCompCourses = rootCompIds.map(id => courses.find(c => c.id === id)).filter(Boolean) as Course[];
        const rootCredits = rootCompCourses.reduce((sum, c) => sum + c.credits, 0);

        // B. Compulsory Sub-blocks
        const compSubBlocks = (moetInfo.subBlocks || []).filter(sb => sb.parentBlockId === blockKey && sb.type === 'COMPULSORY');
        let compBlockCreditsTotal = 0;
        const compBlockData = compSubBlocks.map(sb => {
            const blockCourses = sb.courseIds.map(id => courses.find(c => c.id === id)).filter(Boolean) as Course[];
            const blockCredits = blockCourses.reduce((s, c) => s + c.credits, 0);
            compBlockCreditsTotal += blockCredits;
            return { sb, courses: blockCourses, credits: blockCredits };
        });

        // C. Elective Sub-blocks
        const elecSubBlocks = (moetInfo.subBlocks || []).filter(sb => sb.parentBlockId === blockKey && sb.type !== 'COMPULSORY');
        const elecCredits = elecSubBlocks.reduce((sum, sb) => sum + sb.minCredits, 0);

        const totalSectionCredits = rootCredits + compBlockCreditsTotal + elecCredits;
        const totalCompulsoryCredits = rootCredits + compBlockCreditsTotal;

        // --- 2. Render Header ---
        // e.g., 8.1. Kiến thức giáo dục đại cương (53 tín chỉ)
        sections.push(createPara(`${blockNum}. ${block.label} (${totalSectionCredits} ${language === 'vi' ? 'tín chỉ' : 'credits'})`, styles.h2));

        // --- 3. Render Compulsory Section (8.x.1) ---
        const compHeader = `${blockNum}.1. ${language === 'vi' ? 'Học phần bắt buộc' : 'Compulsory courses'} (${totalCompulsoryCredits} ${language === 'vi' ? 'tín chỉ' : 'credits'})`;
        sections.push(createPara(compHeader, styles.h3, AlignmentType.LEFT));

        let hasCompulsoryContent = false;

        // 3a. Root Compulsory Courses
        if (rootCompCourses.length > 0) {
            sections.push(createCourseTable(rootCompCourses, methods, language, globalCourseIndex));
            globalCourseIndex += rootCompCourses.length;
            sections.push(new Paragraph({ text: "", spacing: { after: 200 } })); // Spacer
            hasCompulsoryContent = true;
        }

        // 3b. Compulsory Sub-blocks
        if (compBlockData.length > 0) {
            compBlockData.forEach(item => {
                // Render Block Header: "Name (X credits)"
                const headerText = `${item.sb.name[language]} (${item.credits} ${language === 'vi' ? 'tín chỉ' : 'credits'})`;
                
                // Format similar to Elective blocks (Normal case, Underlined)
                sections.push(createPara(headerText, { ...styles.body, underline: { type: "single" } }, AlignmentType.LEFT));
                
                if (item.courses.length > 0) {
                    sections.push(createCourseTable(item.courses, methods, language, globalCourseIndex));
                    globalCourseIndex += item.courses.length;
                    sections.push(new Paragraph({ text: "", spacing: { after: 200 } })); // Spacer
                }
            });
            hasCompulsoryContent = true;
        }

        if (!hasCompulsoryContent) {
            sections.push(createPara(language === 'vi' ? "(Không có)" : "(None)", styles.body, AlignmentType.LEFT, 1));
        }

        // --- 4. Render Elective Section (8.x.2) ---
        if (elecSubBlocks.length > 0) {
            const elecHeader = `${blockNum}.2. ${language === 'vi' ? 'Học phần tự chọn' : 'Elective courses'} (${elecCredits} ${language === 'vi' ? 'tín chỉ' : 'credits'})`;
            sections.push(createPara(elecHeader, styles.h3, AlignmentType.LEFT));

            elecSubBlocks.forEach(sb => {
                const creditLabel = language === 'vi' 
                    ? `(Chọn tối thiểu ${sb.minCredits} tín chỉ)` 
                    : `(Select min ${sb.minCredits} credits)`;
                
                sections.push(createPara(`${sb.name[language]} ${creditLabel}`, { ...styles.body, underline: { type: "single" } }, AlignmentType.LEFT));
                
                const sbCourses = sb.courseIds.map(id => courses.find(c => c.id === id)).filter(Boolean) as Course[];
                if (sbCourses.length > 0) {
                    sections.push(createCourseTable(sbCourses, methods, language, globalCourseIndex));
                    globalCourseIndex += sbCourses.length;
                    sections.push(new Paragraph({ text: "", spacing: { after: 200 } })); // Spacer
                }
            });
        }
    });

    return sections;
};

export const exportMoetP2 = async (
    generalInfo: GeneralInfo, 
    moetInfo: MoetInfo, 
    courses: Course[], 
    methods: TeachingMethod[], 
    faculties: Faculty[],
    language: Language
) => {
    try {
        const children = generateMoetPart2(generalInfo, moetInfo, courses, methods, faculties, language);
        
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
        link.download = `MOET_Part2_${generalInfo.programName[language].replace(/\s+/g, '_')}.docx`;
        link.click();
    } catch (e) {
        console.error(e);
        alert("Error creating Page 2 DOCX");
    }
};
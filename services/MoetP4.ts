import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, VerticalAlign, HeightRule } from "docx";
import { GeneralInfo, Language, MoetInfo, Course, IRM, MoetCategory } from '../types';

// Constants for formatting
const FONT_FAMILY = "Times New Roman";
const FONT_SIZE_H1 = 26; // 13pt
const TABLE_FONT_SIZE = 16; // 8pt (Requested)

const styles = {
    h1: { font: FONT_FAMILY, size: FONT_SIZE_H1, bold: true },
    tableHeader: { font: FONT_FAMILY, size: TABLE_FONT_SIZE, bold: true },
    tableBody: { font: FONT_FAMILY, size: TABLE_FONT_SIZE },
};

// Category Order for sorting PLOs
const CATEGORY_ORDER: MoetCategory[] = ['knowledge', 'skills', 'learning'];

// Helper to create paragraphs
const createPara = (text: string, style: any, align: any = AlignmentType.LEFT) => {
    return new Paragraph({
        children: [new TextRun({ text, ...style })],
        alignment: align,
        spacing: { after: 60, before: 60 }, // Compact spacing for matrix
    });
};

const createTableCell = (
    content: Paragraph | Paragraph[], 
    widthPercent: number | undefined, 
    shadingFill: string | undefined = undefined,
    rowSpan: number = 1,
    colSpan: number = 1,
    verticalAlign: any = VerticalAlign.CENTER
) => {
    return new TableCell({
        children: Array.isArray(content) ? content : [content],
        width: widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined,
        verticalAlign: verticalAlign,
        shading: shadingFill ? { fill: shadingFill } : undefined,
        rowSpan: rowSpan,
        columnSpan: colSpan,
    });
};

// Helper to split course code
const splitCourseCode = (code: string) => {
    const cleanCode = code ? code.trim() : "";
    const match = cleanCode.match(/^([A-Za-z\s\-\/]+)(\d+)$/);
    if (match) {
        return { letters: match[1].trim(), numbers: match[2].trim() };
    }
    
    if (cleanCode.includes(' ')) {
        const parts = cleanCode.split(' ');
        const num = parts.pop() || "";
        const lettr = parts.join(' ');
        return { letters: lettr, numbers: num };
    }

    return { letters: cleanCode, numbers: "" };
};

export const generateMoetPart4 = (
    generalInfo: GeneralInfo, 
    courses: Course[], 
    courseSoMap: { courseId: string; soId: string; level: IRM }[],
    language: Language
) => {
    const moetInfo = generalInfo.moetInfo;
    const sections: any[] = [];

    // Main Header
    sections.push(createPara("10. Mối quan hệ giữa chuẩn đầu ra và các học phần", styles.h1));

    // 1. Sort MOET Objectives (PLOs) by Category
    const sortedObjectives = [...(moetInfo.specificObjectives || [])].sort((a, b) => {
        const idxA = CATEGORY_ORDER.indexOf(a.category!);
        const idxB = CATEGORY_ORDER.indexOf(b.category!);
        if (idxA !== idxB) return idxA - idxB;
        return 0; // Maintain original order within category
    });

    // 2. Calculate Implied Links (Course -> ABET SO -> MOET PLO)
    const impliedLinks = new Set<string>(); // Format: "courseId|ploId"
    sortedObjectives.forEach(obj => {
        (obj.soIds || []).forEach(soId => {
            // Find all courses mapped to this ABET SO with a valid level
            courseSoMap.filter(m => m.soId === soId && m.level !== '').forEach(m => {
                impliedLinks.add(`${m.courseId}|${obj.id}`);
            });
        });
    });

    // 3. Prepare Courses (Filter out Physical Education)
    const physBlockIds = new Set<string>();
    if (moetInfo.programStructure && moetInfo.programStructure.phys) {
        moetInfo.programStructure.phys.forEach(id => physBlockIds.add(id));
    }
    if (moetInfo.subBlocks) {
        moetInfo.subBlocks.forEach(sb => {
            if (sb.parentBlockId === 'phys') {
                sb.courseIds.forEach(id => physBlockIds.add(id));
            }
        });
    }

    const validCourses = courses.filter(c => !physBlockIds.has(c.id));

    const sortedCourses = [...validCourses].sort((a, b) => {
        if (a.semester !== b.semester) return a.semester - b.semester;
        return a.code.localeCompare(b.code);
    });

    // 4. Helper to get PLO Label (A, B, C...)
    const getObjectiveLabel = (idx: number) => {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return letters[idx % 26] + (Math.floor(idx / 26) || "");
    };

    const rows: TableRow[] = [];

    // --- Header Row 1 ---
    const headerRow1Cells = [
        createTableCell(createPara("TT", styles.tableHeader, AlignmentType.CENTER), 5, "F2F2F2", 2, 1),
        createTableCell(createPara("Mã môn", styles.tableHeader, AlignmentType.CENTER), 15, "F2F2F2", 1, 2),
        createTableCell(createPara("Tên môn", styles.tableHeader, AlignmentType.CENTER), 30, "F2F2F2", 2, 1),
        createTableCell(createPara("Số\ntín\nchỉ", styles.tableHeader, AlignmentType.CENTER), 5, "F2F2F2", 2, 1),
        createTableCell(createPara(`Chuẩn đầu ra (SOs)`, styles.tableHeader, AlignmentType.CENTER), undefined, "F2F2F2", 1, sortedObjectives.length),
    ];
    rows.push(new TableRow({ children: headerRow1Cells, tableHeader: true }));

    // --- Header Row 2 ---
    const headerRow2Cells = [
        createTableCell(createPara("Chữ", styles.tableHeader, AlignmentType.CENTER), 7, "F2F2F2"),
        createTableCell(createPara("Số", styles.tableHeader, AlignmentType.CENTER), 8, "F2F2F2"),
        // MOET PLO Columns (A, B, C...)
        ...sortedObjectives.map((_, idx) => 
            createTableCell(createPara(getObjectiveLabel(idx), styles.tableHeader, AlignmentType.CENTER), undefined, "F2F2F2")
        )
    ];
    rows.push(new TableRow({ children: headerRow2Cells, tableHeader: true }));

    // --- Data Rows ---
    let totalCredits = 0;

    sortedCourses.forEach((c, idx) => {
        const { letters, numbers } = splitCourseCode(c.code);
        totalCredits += c.credits;

        const ploCells = sortedObjectives.map(obj => {
            const key = `${c.id}|${obj.id}`;
            // Check Direct Manual Mapping OR Implied Mapping
            const isManual = (moetInfo.courseObjectiveMap || []).includes(key);
            const isImplied = impliedLinks.has(key);
            
            return createTableCell(
                createPara((isManual || isImplied) ? "x" : "", styles.tableBody, AlignmentType.CENTER), 
                undefined, 
                undefined
            );
        });

        const rowCells = [
            createTableCell(createPara((idx + 1).toString(), styles.tableBody, AlignmentType.CENTER), 5),
            createTableCell(createPara(letters, styles.tableBody, AlignmentType.LEFT), 7),
            createTableCell(createPara(numbers, styles.tableBody, AlignmentType.CENTER), 8),
            createTableCell(createPara(c.name[language], styles.tableBody, AlignmentType.LEFT), 30),
            createTableCell(createPara(c.credits.toString(), styles.tableBody, AlignmentType.CENTER), 5),
            ...ploCells
        ];

        rows.push(new TableRow({ children: rowCells }));
    });

    // --- Total Row ---
    const totalRowCells = [
        createTableCell(createPara("Tổng", { ...styles.tableHeader, size: TABLE_FONT_SIZE }, AlignmentType.CENTER), undefined, undefined, 1, 4),
        createTableCell(createPara(totalCredits.toString(), { ...styles.tableHeader, size: TABLE_FONT_SIZE }, AlignmentType.CENTER), 5),
        // Empty cells for PLOs
        ...sortedObjectives.map(() => createTableCell(createPara("", styles.tableBody), undefined))
    ];
    rows.push(new TableRow({ children: totalRowCells }));

    // Create Table
    sections.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: rows
    }));

    return sections;
};

export const exportMoetP4 = async (
    generalInfo: GeneralInfo, 
    courses: Course[], 
    courseSoMap: { courseId: string; soId: string; level: IRM }[],
    language: Language
) => {
    try {
        const children = generateMoetPart4(generalInfo, courses, courseSoMap, language);
        
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
        link.download = `MOET_Part10_Matrix_${generalInfo.programName[language].replace(/\s+/g, '_')}.docx`;
        link.click();
    } catch (e) {
        console.error(e);
        alert("Error creating Part 10 DOCX");
    }
};
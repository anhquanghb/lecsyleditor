
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, VerticalAlign } from "docx";
import { GeneralInfo, Language, MoetInfo, Facility, TeachingMethod, Course } from '../types';

// Constants for formatting
const FONT_FAMILY = "Times New Roman";
const FONT_SIZE_H1 = 26; // 13pt
const FONT_SIZE_H2 = 24; // 12pt
const FONT_SIZE_BODY = 24; // 12pt
const TABLE_FONT_SIZE = 22; // 11pt

const styles = {
    h1: { font: FONT_FAMILY, size: FONT_SIZE_H1, bold: true },
    h2: { font: FONT_FAMILY, size: FONT_SIZE_H2, bold: true, italics: true },
    body: { font: FONT_FAMILY, size: FONT_SIZE_BODY },
    tableHeader: { font: FONT_FAMILY, size: TABLE_FONT_SIZE, bold: true },
    tableBody: { font: FONT_FAMILY, size: TABLE_FONT_SIZE },
};

// Helper to create paragraphs
const createPara = (text: string, style: any, align: any = AlignmentType.LEFT, italic: boolean = false) => {
    return new Paragraph({
        children: [new TextRun({ text, ...style, italics: italic })],
        alignment: align,
        spacing: { after: 120, line: 276 },
    });
};

const createTableCell = (text: string, style: any, align: any = AlignmentType.LEFT) => {
    return new TableCell({
        children: [new Paragraph({ 
            children: [new TextRun({ text: text || "", ...style })], 
            alignment: align,
            spacing: { after: 60, before: 60 }
        })],
        verticalAlign: VerticalAlign.CENTER,
    });
};

// Helper to convert HTML to DOCX Paragraphs (Simplified)
const htmlToDocxParagraphs = (html: string, style: any): Paragraph[] => {
    if (!html) return [new Paragraph({})];
    
    // Very basic stripper, in a real app use a full parser or recursive function like in MoetP1
    const text = html.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n').trim();
    return text.split('\n').map(line => new Paragraph({
        children: [new TextRun({ text: line.trim(), ...style })],
        spacing: { after: 120, line: 276 }
    }));
};

export const generateMoetEndSection = (
    generalInfo: GeneralInfo, 
    facilities: Facility[],
    teachingMethods: TeachingMethod[],
    courses: Course[],
    language: Language
) => {
    const moetInfo = generalInfo.moetInfo;
    const sections: any[] = [];

    // --- 11. Đề cương chi tiết ---
    sections.push(createPara("11. Đề cương chi tiết các học phần", styles.h1));
    sections.push(createPara("(Được trình bày vào cuối Chương trình đào tạo)", styles.body, AlignmentType.LEFT, true));
    sections.push(new Paragraph({ text: "", spacing: { after: 200 } }));

    // --- 12. Chương trình tham khảo ---
    sections.push(createPara("12. Các chương trình đào tạo được tham khảo", styles.h1));
    sections.push(...htmlToDocxParagraphs(moetInfo.referencedPrograms[language], styles.body));
    sections.push(new Paragraph({ text: "", spacing: { after: 200 } }));

    // --- 13. Hướng dẫn thực hiện ---
    sections.push(createPara("13. Hướng dẫn thực hiện chương trình", styles.h1));

    // 13.1 Facilities
    sections.push(createPara("13.1. Sử dụng cơ sở vật chất trong quá trình đào tạo", styles.h2));
    sections.push(...htmlToDocxParagraphs(moetInfo.guidelineFacilities?.[language] || '', styles.body));
    sections.push(new Paragraph({ text: "", spacing: { after: 100 } }));

    // Table: Facilities
    if (facilities.length > 0) {
        const facHeader = [
            "TT", "MÃ PHÒNG", "TÊN PHÒNG", "CHỨC NĂNG GIẢNG DẠY MÔN HỌC"
        ];
        
        sections.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            alignment: AlignmentType.CENTER,
            rows: [
                // Header Row
                new TableRow({
                    children: facHeader.map((h, i) => new TableCell({
                        children: [createPara(h, styles.tableHeader, AlignmentType.CENTER)],
                        verticalAlign: VerticalAlign.CENTER,
                        shading: { fill: "F2F2F2" },
                        width: i === 0 ? { size: 5, type: WidthType.PERCENTAGE } : 
                               i === 1 ? { size: 15, type: WidthType.PERCENTAGE } : 
                               { size: 40, type: WidthType.PERCENTAGE } // 40% for Name and Usage
                    })),
                    tableHeader: true
                }),
                // Data Rows
                ...facilities.map((fac, idx) => {
                    // Column 3: Name + Description (Italic)
                    const nameDescPara = new Paragraph({
                        children: [
                            new TextRun({ text: fac.name[language] || "", ...styles.tableBody, bold: true }),
                            new TextRun({ text: ": ", ...styles.tableBody }),
                            new TextRun({ text: fac.description[language] || "", ...styles.tableBody, italics: true })
                        ],
                        alignment: AlignmentType.LEFT,
                        spacing: { after: 60, before: 60 }
                    });

                    // Column 4: List of Courses
                    const assignedCourses = fac.courseIds
                        .map(cid => courses.find(c => c.id === cid))
                        .filter(c => c !== undefined) as Course[];

                    const courseParas: Paragraph[] = [];
                    if (assignedCourses.length > 0) {
                        assignedCourses.forEach(c => {
                            courseParas.push(new Paragraph({
                                children: [new TextRun({ text: `- ${c.code}: ${c.name[language]}`, ...styles.tableBody })],
                                alignment: AlignmentType.LEFT,
                                spacing: { after: 40 }
                            }));
                        });
                    } else {
                        courseParas.push(new Paragraph({ children: [] })); // Empty cell placeholder
                    }

                    return new TableRow({
                        children: [
                            createTableCell((idx + 1).toString(), styles.tableBody, AlignmentType.CENTER), // TT
                            createTableCell(fac.code || "", styles.tableBody, AlignmentType.CENTER),       // Ma Phong
                            new TableCell({ children: [nameDescPara], verticalAlign: VerticalAlign.CENTER }), // Ten Phong + Mo ta
                            new TableCell({ children: courseParas, verticalAlign: VerticalAlign.CENTER })     // Chuc nang giang day (Courses)
                        ]
                    });
                })
            ]
        }));
        sections.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    }

    // 13.2 Teaching Methods
    sections.push(createPara("13.2. Các hình thức lớp học:", styles.h2));
    sections.push(...htmlToDocxParagraphs(moetInfo.guidelineClassForms?.[language] || '', styles.body));
    sections.push(new Paragraph({ text: "", spacing: { after: 100 } }));

    // Table: Teaching Methods
    if (teachingMethods.length > 0) {
        const methodHeader = [
            "TT", "Mã hình thức lớp", "Hình thức Lớp (tiếng Anh)", "Hình thức Lớp (tiếng Việt)", "Mô Tả", "Số giờ"
        ];

        const methodRows = teachingMethods.map((tm, idx) => [
            (idx + 1).toString(),
            tm.code,
            tm.name.en,
            tm.name.vi,
            tm.description?.[language] || "",
            tm.hoursPerCredit ? `${tm.hoursPerCredit}h` : ""
        ]);

        sections.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            alignment: AlignmentType.CENTER,
            rows: [
                new TableRow({
                    children: methodHeader.map(h => new TableCell({
                        children: [createPara(h, styles.tableHeader, AlignmentType.CENTER)],
                        verticalAlign: VerticalAlign.CENTER,
                        shading: { fill: "F2F2F2" }
                    })),
                    tableHeader: true
                }),
                ...methodRows.map(row => new TableRow({
                    children: [
                        createTableCell(row[0], styles.tableBody, AlignmentType.CENTER),
                        createTableCell(row[1], styles.tableBody, AlignmentType.CENTER),
                        createTableCell(row[2], styles.tableBody, AlignmentType.LEFT),
                        createTableCell(row[3], styles.tableBody, AlignmentType.LEFT),
                        createTableCell(row[4], styles.tableBody, AlignmentType.LEFT),
                        createTableCell(row[5], styles.tableBody, AlignmentType.CENTER),
                    ]
                }))
            ]
        }));
        sections.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    }

    // 13.3 Other Guidelines
    const header13_3 = language === 'vi' ? "13.3. Các hướng dẫn khác" : "13.3. Other Guidelines";
    sections.push(createPara(header13_3, styles.h2));
    sections.push(...htmlToDocxParagraphs(moetInfo.guidelineCreditConversion?.[language] || '', styles.body));
    sections.push(new Paragraph({ text: "", spacing: { after: 400 } }));

    // --- Signature ---
    const directorTitle = language === 'vi' ? "GIÁM ĐỐC" : "DIRECTOR";
    
    sections.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [], // Empty left column
                        width: { size: 50, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [new TextRun({ text: directorTitle, ...styles.h1 })],
                                alignment: AlignmentType.CENTER
                            }),
                            new Paragraph({ text: "", spacing: { after: 800 } }), // Space for signature
                            new Paragraph({
                                children: [new TextRun({ text: "TS. Lê Nguyên Bảo", ...styles.h1, size: 24 })],
                                alignment: AlignmentType.CENTER
                            })
                        ],
                        width: { size: 50, type: WidthType.PERCENTAGE }
                    })
                ]
            })
        ]
    }));

    return sections;
};

export const exportMoetEndSectionFile = async (
    generalInfo: GeneralInfo, 
    facilities: Facility[],
    teachingMethods: TeachingMethod[],
    courses: Course[],
    language: Language
) => {
    try {
        const children = generateMoetEndSection(generalInfo, facilities, teachingMethods, courses, language);
        
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
        link.download = `MOET_Part5_End_${generalInfo.programName[language].replace(/\s+/g, '_')}.docx`;
        link.click();
    } catch (e) {
        console.error(e);
        alert("Error creating End Section DOCX");
    }
};

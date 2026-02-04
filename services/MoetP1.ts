
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, VerticalAlign } from "docx";
import { GeneralInfo, Language, MoetInfo, Course, MoetCategory } from '../types';

// Helper to convert HTML to DOCX Paragraphs
const htmlToDocxParagraphs = (html: string, textStyle: any, paragraphOptions: any): Paragraph[] => {
    if (!html) return [new Paragraph({ ...paragraphOptions })];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const paragraphs: Paragraph[] = [];

    const processNodes = (nodes: NodeListOf<ChildNode>, currentTextStyle: any): TextRun[] => {
        const runs: TextRun[] = [];
        nodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.textContent) {
                    runs.push(new TextRun({
                        text: node.textContent,
                        ...currentTextStyle
                    }));
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                const tagName = el.tagName.toLowerCase();
                const newTextStyle = { ...currentTextStyle };
                
                if (tagName === 'b' || tagName === 'strong') newTextStyle.bold = true;
                if (tagName === 'i' || tagName === 'em') newTextStyle.italics = true;
                if (tagName === 'u') newTextStyle.underline = { type: "single" };
                if (tagName === 'br') {
                    runs.push(new TextRun({ break: 1 }));
                    return; 
                }

                runs.push(...processNodes(el.childNodes, newTextStyle));
            }
        });
        return runs;
    };

    const processBlocks = (nodes: NodeListOf<ChildNode>) => {
        nodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                const tagName = el.tagName.toLowerCase();

                if (tagName === 'ul' || tagName === 'ol') {
                    el.childNodes.forEach(li => {
                        if (li.nodeName.toLowerCase() === 'li') {
                            const liEl = li as HTMLElement;
                            paragraphs.push(new Paragraph({
                                children: processNodes(liEl.childNodes, textStyle),
                                ...paragraphOptions,
                                bullet: { level: 0 } 
                            }));
                        }
                    });
                } else {
                    // Paragraphs, divs, headings, etc.
                    paragraphs.push(new Paragraph({
                        children: processNodes(el.childNodes, textStyle),
                        ...paragraphOptions
                    }));
                }
            } else if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent?.trim();
                if (text) {
                    paragraphs.push(new Paragraph({
                        children: [new TextRun({ text, ...textStyle })],
                        ...paragraphOptions
                    }));
                }
            }
        });
    };

    processBlocks(doc.body.childNodes);
    return paragraphs.length > 0 ? paragraphs : [new Paragraph({ ...paragraphOptions })];
};

// Helper to calculate credits for a block
const calculateBlockCredits = (
    blockKey: 'gen' | 'phys' | 'fund' | 'spec' | 'grad', 
    moetInfo: MoetInfo, 
    courses: Course[]
) => {
    // 1. Compulsory: Sum credits of courses in the main list
    const compulsoryIds = moetInfo.programStructure[blockKey] || [];
    const compulsory = compulsoryIds.reduce((sum, id) => {
        const c = courses.find(x => x.id === id);
        return sum + (c ? c.credits : 0);
    }, 0);

    // 2. Elective: Sum minCredits of sub-blocks belonging to this parent block
    const subBlocks = (moetInfo.subBlocks || []).filter(sb => sb.parentBlockId === blockKey && sb.type !== 'COMPULSORY');
    const elective = subBlocks.reduce((sum, sb) => sum + sb.minCredits, 0);

    return { compulsory, elective, total: compulsory + elective };
};

export const generateMoetPart1 = (generalInfo: GeneralInfo, moetInfo: MoetInfo, courses: Course[], language: Language) => {
    // Formatting Constants
    const FONT_FAMILY = "Times New Roman";
    const FONT_SIZE = 26; // 13pt
    const INDENT_FIRST_LINE = 446; // 0.31 inch (1 inch = 1440 twips)
    const SPACING_AFTER = 120; // 6pt
    const LINE_SPACING = 276; // 1.15 lines

    const baseTextStyle = {
        font: FONT_FAMILY,
        size: FONT_SIZE,
        color: "000000",
    };

    // Normal Text: Indent 0.31", Left 0, Right 0
    const paraOptions = {
        indent: { firstLine: INDENT_FIRST_LINE, left: 0, right: 0 },
        spacing: { after: SPACING_AFTER, line: LINE_SPACING, lineRule: "auto" as const },
        alignment: AlignmentType.JUSTIFIED
    };

    // Headings (1, 2...): Indent 0, Left 0, Right 0, Black
    const headingParaOptions = {
        indent: { firstLine: 0, left: 0, right: 0 },
        spacing: { after: SPACING_AFTER, line: LINE_SPACING, lineRule: "auto" as const },
        alignment: AlignmentType.JUSTIFIED
    };

    // Table Content: Indent 0, Left 0, Right 0, Spacing After 0
    const tableParaOptions = {
        indent: { firstLine: 0, left: 0, right: 0 },
        spacing: { after: 0, line: LINE_SPACING, lineRule: "auto" as const },
        alignment: AlignmentType.LEFT // Usually left or center in tables
    };

    // Style Helpers
    const headerStyle = { ...baseTextStyle, bold: true };
    const h2Style = { ...baseTextStyle, bold: true, italics: true }; 
    const normalStyle = { ...baseTextStyle, bold: false };

    // Generic Helper
    const createPara = (text: string, style: any, overrideOptions: any = {}) => new Paragraph({ 
        children: [new TextRun({ text, ...style })], 
        ...paraOptions,
        ...overrideOptions 
    });

    // Specific Helper for Headings (No First Line Indent)
    const createSectionHeader = (text: string) => new Paragraph({
        children: [new TextRun({ text, ...headerStyle })],
        ...headingParaOptions,
        spacing: { before: 240, after: 120 }
    });

    const createSubSectionHeader = (text: string) => new Paragraph({
        children: [new TextRun({ text, ...h2Style })],
        ...headingParaOptions
    });

    // Specific Helper for Table Cells (No Indent, No Spacing After)
    const createTablePara = (text: string, style: any, align: any = AlignmentType.LEFT) => new Paragraph({
        children: [new TextRun({ text, ...style })],
        ...tableParaOptions,
        alignment: align
    });

    // --- Content Generation ---

    // 1. Header Section (Ministry & University)
    const headerTable = new Table({
        width: { size: 110, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
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
                        children: [
                            new Paragraph({
                                children: [new TextRun({ text: "BỘ GIÁO DỤC VÀ ĐÀO TẠO", ...baseTextStyle, size: 24 })],
                                ...tableParaOptions,
                                alignment: AlignmentType.CENTER
                            }),
                            new Paragraph({
                                children: [new TextRun({ text: generalInfo.university[language].toUpperCase(), ...baseTextStyle, size: 26, bold: true })],
                                ...tableParaOptions,
                                alignment: AlignmentType.CENTER
                            })
                        ],
                        width: { size: 40, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", ...baseTextStyle, size: 24, bold: true })],
                                ...tableParaOptions,
                                alignment: AlignmentType.CENTER
                            }),
                            new Paragraph({
                                children: [new TextRun({ text: "Độc lập – Tự do – Hạnh phúc", ...baseTextStyle, size: 26, bold: true })],
                                ...tableParaOptions,
                                alignment: AlignmentType.CENTER
                            }),
                            new Paragraph({
                                children: [new TextRun({ text: "_________________________", ...baseTextStyle, size: 18, bold: true })],
                                ...tableParaOptions,
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 0, after: 0 }
                            })
                        ],
                        width: { size: 60, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.TOP
                    })
                ]
            })
        ]
    });

    // 2. Title & Decision
    const titleSection = [
        new Paragraph({ text: "", spacing: { after: 400 } }),
        new Paragraph({ 
            children: [new TextRun({ text: "CHƯƠNG TRÌNH ĐÀO TẠO", ...baseTextStyle, size: 32, bold: true })], 
            ...headingParaOptions,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        }),
        new Paragraph({ 
            children: [new TextRun({ text: "(Ban hành theo Quyết định số....................... ngày...... tháng...... năm......", ...baseTextStyle, italics: true })], 
            ...headingParaOptions,
            alignment: AlignmentType.CENTER 
        }),
        new Paragraph({ 
            children: [new TextRun({ text: `của Giám đốc ${generalInfo.university[language]})`, ...baseTextStyle, italics: true })], 
            ...headingParaOptions,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        }),
    ];

    // 3. General Info Table
    const infoFields = [
        { label: "Trình độ đào tạo:", value: moetInfo.level[language] },
        { label: "Ngành đào tạo:", value: moetInfo.majorName[language] },
        { label: "Mã ngành:", value: moetInfo.majorCode },
        { label: "Chuyên ngành:", value: moetInfo.specializationName[language] },
        { label: "Mã chuyên ngành:", value: moetInfo.specializationCode },
        { label: "Hình thức đào tạo:", value: moetInfo.trainingMode[language] },
        { label: "Ngôn ngữ đào tạo:", value: moetInfo.trainingLanguage[language] },
    ];

    const infoTable = new Table({
        width: { size: 90, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
        },
        rows: infoFields.map(field => new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text: field.label, ...baseTextStyle })],
                        ...tableParaOptions,
                        alignment: AlignmentType.RIGHT,
                        spacing: { after: 120 }
                    })],
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER
                }),
                new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text: "\t" + (field.value || ""), ...baseTextStyle, bold: true })],
                        ...tableParaOptions,
                        alignment: AlignmentType.LEFT,
                        spacing: { after: 120 },
                        tabStops: [{ type: "left", position: 200 }]
                    })],
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER
                })
            ]
        }))
    });

    // 4. Content Sections 1-7
    
    // Section 1
    const section1 = [
        new Paragraph({ text: "", spacing: { after: 400 } }),
        createSectionHeader("1. Mục tiêu đào tạo"),
        createSubSectionHeader("1.1. Mục tiêu chung"),
        ...htmlToDocxParagraphs(moetInfo.generalObjectives[language], normalStyle, paraOptions),
        createSubSectionHeader("1.2. Mục tiêu cụ thể"),
        ...(moetInfo.moetSpecificObjectives || []).map(obj => 
            createPara(`- ${obj.description[language]}`, normalStyle)
        ),
    ];

    // Section 2: Chuẩn đầu ra (SOs)
    const section2 = [
        createSectionHeader("2. Chuẩn đầu ra (SOs)"),
        createPara(`Ngay khi hoàn thành chương trình đào tạo “${moetInfo.majorName[language]}”, sinh viên có khả năng:`, normalStyle)
    ];

    // Structure SOs by Category with continuous ABC numbering
    const categories: { key: MoetCategory, label: string }[] = [
        { key: 'knowledge', label: 'Về kiến thức' },
        { key: 'skills', label: 'Về kỹ năng' },
        { key: 'learning', label: 'Về năng lực tự chủ và trách nhiệm' }
    ];

    let charIndex = 0; // A, B, C...

    categories.forEach(cat => {
        const objs = (moetInfo.specificObjectives || []).filter(o => o.category === cat.key);
        if (objs.length > 0) {
            // Category Header (bold, no indent)
            section2.push(new Paragraph({
                children: [new TextRun({ text: cat.label, ...headerStyle })],
                ...headingParaOptions, // Fistline 0
                spacing: { before: 120, after: 120 }
            }));

            // Objectives
            objs.forEach(obj => {
                const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                // Handle overflow like AA, AB if needed, though rare for SOs
                const label = letters[charIndex % 26] + (Math.floor(charIndex / 26) || "");
                
                section2.push(
                    createPara(`${label}. ${obj.description[language]}`, normalStyle)
                );
                charIndex++;
            });
        }
    });

    // Section 3
    const section3 = [
        createSectionHeader(`3. Thời gian đào tạo: ${moetInfo.duration} năm`)
    ];

    // Section 4: Calculation
    const genStats = calculateBlockCredits('gen', moetInfo, courses);
    const physStats = calculateBlockCredits('phys', moetInfo, courses);
    const fundStats = calculateBlockCredits('fund', moetInfo, courses);
    const specStats = calculateBlockCredits('spec', moetInfo, courses);
    const gradStats = calculateBlockCredits('grad', moetInfo, courses);

    const totalCredits = genStats.total + physStats.total + fundStats.total + specStats.total + gradStats.total;
    const totalComp = genStats.compulsory + physStats.compulsory + fundStats.compulsory + specStats.compulsory + gradStats.compulsory;
    const totalElec = genStats.elective + physStats.elective + fundStats.elective + specStats.elective + gradStats.elective;

    const volumeTableRows = [
        { id: 1, name: "Kiến thức toàn khoá", comp: totalComp, elec: totalElec, total: totalCredits, bold: true },
        { id: 2, name: "Kiến thức đại cương (không kể học phần GDTC)", comp: genStats.compulsory, elec: genStats.elective, total: genStats.total, bold: false },
        { id: 3, name: "Kiến thức cơ sở ngành", comp: fundStats.compulsory, elec: fundStats.elective, total: fundStats.total, bold: false },
        { id: 4, name: "Kiến thức chuyên ngành", comp: specStats.compulsory, elec: specStats.elective, total: specStats.total, bold: false },
        { id: 5, name: "Tốt nghiệp", comp: gradStats.compulsory, elec: gradStats.elective, total: gradStats.total, bold: false },
    ];

    const volumeTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
            new TableRow({
                children: ["TT", "Nội dung khối kiến thức", "Bắt buộc\n(Tín chỉ)", "Tự chọn\n(Tín chỉ)", "Tổng\n(Tín chỉ)"].map(text => 
                    new TableCell({
                        children: [createTablePara(text, { ...baseTextStyle, bold: true, size: 24 }, AlignmentType.CENTER)],
                        verticalAlign: VerticalAlign.CENTER,
                        shading: { fill: "F2F2F2" }
                    })
                ),
                tableHeader: true
            }),
            ...volumeTableRows.map(row => new TableRow({
                children: [
                    new TableCell({ children: [createTablePara(row.id.toString(), baseTextStyle, AlignmentType.CENTER)] }),
                    new TableCell({ children: [createTablePara(row.name, row.bold ? headerStyle : baseTextStyle)] }),
                    new TableCell({ children: [createTablePara(row.comp.toString(), baseTextStyle, AlignmentType.CENTER)] }),
                    new TableCell({ children: [createTablePara(row.elec.toString(), baseTextStyle, AlignmentType.CENTER)] }),
                    new TableCell({ children: [createTablePara(row.total.toString(), { ...baseTextStyle, bold: true }, AlignmentType.CENTER)] }),
                ]
            }))
        ]
    });

    const section4 = [
        createSectionHeader(`4. Khối lượng kiến thức toàn khóa: ${totalCredits} Tín chỉ (không bao gồm Khối kiến thức GDTC và QP)`),
        volumeTable
    ];

    // Section 5
    const section5 = [
        createSectionHeader("5. Đối tượng tuyển sinh, Chuẩn đầu vào"),
        createSubSectionHeader("5.1. Đối tượng tuyển sinh"),
        ...htmlToDocxParagraphs(moetInfo.admissionTarget[language], normalStyle, paraOptions),
        createSubSectionHeader("5.2. Chuẩn đầu vào"),
        ...htmlToDocxParagraphs(moetInfo.admissionReq[language], normalStyle, paraOptions),
    ];

    // Section 6
    const section6 = [
        createSectionHeader("6. Quy trình đào tạo và điều kiện tốt nghiệp"),
        ...htmlToDocxParagraphs(moetInfo.graduationReq[language], normalStyle, paraOptions),
    ];

    // Section 7
    const section7 = [
        createSectionHeader("7. Thang điểm:"),
        ...htmlToDocxParagraphs(moetInfo.gradingScale[language], normalStyle, paraOptions),
    ];

    return [
        headerTable,
        ...titleSection,
        infoTable,
        ...section1,
        ...section2,
        ...section3,
        ...section4,
        ...section5,
        ...section6,
        ...section7
    ];
};

export const exportMoetP1 = async (generalInfo: GeneralInfo, moetInfo: MoetInfo, courses: Course[], language: Language) => {
    try {
        const children = generateMoetPart1(generalInfo, moetInfo, courses, language);
        
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
        link.download = `MOET_Part1_${generalInfo.programName[language].replace(/\s+/g, '_')}.docx`;
        link.click();
    } catch (e) {
        console.error(e);
        alert("Error creating Page 1 DOCX");
    }
};

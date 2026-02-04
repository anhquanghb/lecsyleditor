
import { AppState } from './types';

export const CODE_VERSION = "1.2.0";

export const TRANSLATIONS = {
  vi: {
    strategy: 'Sứ mạng và Mục tiêu',
    outcomes: 'Chuẩn đầu ra',
    mapping: 'Môn học - SO - PIs',
    flowchart: 'Sơ đồ',
    syllabus: 'Đề cương',
    faculty: 'Giảng viên',
    facilities: 'Cơ sở vật chất',
    analytics: 'Phân tích chương trình',
    general: 'Thông tin chung',
    transformation: 'Chuyển đổi CTĐT MOET',
    departments: 'Tổ chức (Trường/Khoa)',
    settings: 'Cài đặt',
    users: 'Người dùng',
    logout: 'Đăng xuất',
    welcomeBack: 'Chào mừng trở lại',
    authDescription: 'Vui lòng đăng nhập bằng tài khoản Google của tổ chức để tiếp tục.',
    autoTranslate: 'Dịch tự động',
    mission: 'Sứ mạng',
    alignmentPeoMission: 'Thích ứng PEO - Sứ mạng',
    mappingPeoCourse: 'Ma trận PEO - Môn học',
    addCourse: 'Thêm môn học',
    credits: 'Số TC',
    semester: 'Học kỳ',
    prerequisites: 'Tiên quyết',
    coRequisites: 'Song hành',
    essential: 'Cốt lõi',
    knowledgeArea: 'Khối kiến thức',
    knowledgeAreaTable: 'Bảng Khối kiến thức',
    addArea: 'Thêm Khối',
    filterEssential: 'Lọc môn cốt lõi',
    allCategories: 'Tất cả danh mục',
    clickToCycle: 'Nhấp để xoay vòng mức độ (L -> M -> H)',
    export: 'Xuất',
    soMatrix: 'Ma trận SO',
    piMatrix: 'Ma trận PI',
    catalog: 'Danh mục',
    exportImage: 'Xuất ảnh',
    legendR: 'Bắt buộc',
    legendSE: 'Tự chọn định hướng',
    legendE: 'Tự chọn tự do',
    prereqLegend: 'Tiên quyết',
    postreqLegend: 'Học sau',
    employmentType: 'Loại hình',
    classesTaught: 'Các lớp giảng dạy',
    fullTime: 'Cơ hữu',
    partTime: 'Thỉnh giảng',
    instructorSelect: 'Chọn giảng viên',
    textbook: 'Giáo trình',
    typeTextbook: 'Giáo trình',
    typeReference: 'Tham khảo',
    assessment: 'Đánh giá',
    assessmentMethods: 'Phương pháp đánh giá',
    totalWeight: 'Tổng trọng số',
    clos: 'Chuẩn đầu ra học phần (CLOs)',
    cloRelationship: 'Quan hệ CLO',
    teachingMethodology: 'Phương pháp giảng dạy',
    assessmentType: 'Hình thức',
    levelOfCoverage: 'Mức độ',
    syllabusTab: 'Đề cương',
    library: 'Thư viện',
    libraryTab: 'Thư viện',
    configSyllabus: 'Cấu hình',
    searchLibrary: 'Tìm kiếm thư viện',
    createResource: 'Tạo tài liệu',
    addToCourse: 'Thêm vào môn',
    amountOfTime: 'Thời lượng',
    contentNo: 'STT',
    hours: 'giờ',
    courseTopicsSchedule: 'Nội dung & Thời khóa',
    missingHours: 'Thiếu',
    conversionFactor: 'Hệ số quy đổi',
    teachingMethods: 'Phương pháp giảng dạy',
    security: 'Bảo mật',
    authRequirement: 'Yêu cầu xác thực',
    authEnabledDesc: 'Người dùng phải đăng nhập bằng tài khoản Google (Email trong Whitelist) để truy cập.',
    authDisabledDesc: 'Bất kỳ ai có liên kết đều có thể truy cập và chỉnh sửa dữ liệu.',
    userManagement: 'Quản lý người dùng',
    userName: 'Tên người dùng',
    userRole: 'Vai trò',
    lastActive: 'Hoạt động cuối',
    demoteToUser: 'Hạ xuống User',
    promoteToAdmin: 'Thăng lên Admin',
    deleteUser: 'Xóa người dùng',
    peoSoMatrix: 'Ma trận PEO - SO',
    percentile: 'Tỷ lệ',
    description: 'Mô tả',
    aiPdfImport: 'Nhập AI PDF',
    roomCode: 'Mã phòng',
    roomName: 'Tên phòng',
    usage: 'Chức năng giảng dạy',
    addFacility: 'Thêm phòng',
    addDepartment: 'Thêm Bộ môn',
    addFaculty: 'Thêm Khoa',
    addSchool: 'Thêm Trường',
    departmentCode: 'Mã bộ môn',
    departmentName: 'Tên bộ môn',
    assignCourses: 'Gán môn học',
    manageDepartments: 'Cơ cấu Tổ chức',
    schoolEntity: 'Trường (School)',
    facultyEntity: 'Khoa (Faculty)',
    departmentEntity: 'Bộ môn (Dept)'
  },
  en: {
    strategy: 'Strategy',
    outcomes: 'Outcomes',
    mapping: 'Mapping',
    flowchart: 'Flowchart',
    syllabus: 'Syllabus',
    faculty: 'Faculty',
    facilities: 'Facilities',
    analytics: 'Analytics',
    general: 'General Info',
    transformation: 'MOET Transform',
    departments: 'Organization',
    settings: 'Settings',
    users: 'Users',
    logout: 'Logout',
    welcomeBack: 'Welcome Back',
    authDescription: 'Please sign in with your organizational Google account to continue.',
    autoTranslate: 'Auto Translate',
    mission: 'Mission',
    alignmentPeoMission: 'PEO - Mission Alignment',
    mappingPeoCourse: 'PEO - Course Mapping',
    addCourse: 'Add Course',
    credits: 'Credits',
    semester: 'Semester',
    prerequisites: 'Prerequisites',
    coRequisites: 'Co-requisites',
    essential: 'Essential',
    knowledgeArea: 'Knowledge Area',
    knowledgeAreaTable: 'Knowledge Areas',
    addArea: 'Add Area',
    filterEssential: 'Filter Essential',
    allCategories: 'All Categories',
    clickToCycle: 'Click to cycle (L -> M -> H)',
    export: 'Export',
    soMatrix: 'SO Matrix',
    piMatrix: 'PI Matrix',
    catalog: 'Catalog',
    exportImage: 'Export Image',
    legendR: 'Required',
    legendSE: 'Selected Elective',
    legendE: 'Elective',
    prereqLegend: 'Prerequisite',
    postreqLegend: 'Post-requisite',
    employmentType: 'Employment Type',
    classesTaught: 'Classes Taught',
    fullTime: 'Full Time',
    partTime: 'Part Time',
    instructorSelect: 'Select Instructor',
    textbook: 'Textbook',
    typeTextbook: 'Textbook',
    typeReference: 'Reference',
    assessment: 'Assessment',
    assessmentMethods: 'Assessment Methods',
    totalWeight: 'Total Weight',
    clos: 'Course Learning Outcomes (CLOs)',
    cloRelationship: 'CLO Relationship',
    teachingMethodology: 'Teaching Methodology',
    assessmentType: 'Type',
    levelOfCoverage: 'Level',
    syllabusTab: 'Syllabus',
    library: 'Library',
    libraryTab: 'Library',
    configSyllabus: 'Configuration',
    searchLibrary: 'Search Library',
    createResource: 'Create Resource',
    addToCourse: 'Add to Course',
    amountOfTime: 'Amount of Time',
    contentNo: 'No.',
    hours: 'hours',
    courseTopicsSchedule: 'Course Topics & Schedule',
    missingHours: 'Missing',
    conversionFactor: 'Conversion Factor',
    teachingMethods: 'Teaching Methods',
    security: 'Security',
    authRequirement: 'Authentication Requirement',
    authEnabledDesc: 'Users must sign in with a Google account (Whitelisted Email) to access.',
    authDisabledDesc: 'Anyone with the link can access and edit the data.',
    userManagement: 'User Management',
    userName: 'User Name',
    userRole: 'Role',
    lastActive: 'Last Active',
    demoteToUser: 'Demote to User',
    promoteToAdmin: 'Promote to Admin',
    deleteUser: 'Delete User',
    peoSoMatrix: 'PEO - SO Matrix',
    percentile: 'Percentile',
    description: 'Description',
    aiPdfImport: 'AI PDF Import',
    roomCode: 'Room Code',
    roomName: 'Room Name',
    usage: 'Usage / Teaching Function',
    addFacility: 'Add Facility',
    addDepartment: 'Add Department',
    addFaculty: 'Add Faculty',
    addSchool: 'Add School',
    departmentCode: 'Dept. Code',
    departmentName: 'Department Name',
    assignCourses: 'Assign Courses',
    manageDepartments: 'Organization Structure',
    schoolEntity: 'School',
    facultyEntity: 'Faculty',
    departmentEntity: 'Department'
  }
};

export const INITIAL_STATE: AppState = {
  version: CODE_VERSION,
  language: 'vi',
  authEnabled: false,
  currentUser: null,
  users: [
    {
      id: "u1",
      email: "anhquanghb@gmail.com",
      name: "Anh Quang (Admin)",
      role: "ADMIN",
      lastLogin: "2026-01-09T06:37:49.724Z",
      avatar: "https://lh3.googleusercontent.com/a/ACg8ocIPzY3X5gyCVtmlXNYtIRGyzwAWZgQX1lOq2IyZF_LXXYMTYNH2nw=s96-c"
    },
    {
      id: "u2",
      email: "lecturer@university.edu.vn",
      name: "Giảng viên Mẫu",
      role: "USER",
      lastLogin: "2026-01-06T06:05:04.093Z",
      avatar: "https://ui-avatars.com/api/?name=Lecturer&background=10b981&color=fff"
    }
  ],
  geminiConfig: {
    model: 'gemini-3-flash-preview',
    prompts: {
      translation: 'Translate this text to {targetLanguage}: {text}',
      courseTranslation: 'Translate these course names to {targetLanguage}: {items}',
      audit: 'Audit the curriculum matrix for gaps: {data}',
      consistency: 'Check consistency between CLOs and SOs: {data}',
      syllabusAnalysis: 'Analyze this syllabus PDF and extract structured data: {structure}',
      courseCatalogAnalysis: 'Analyze this course catalog PDF and extract courses: {structure}',
      programAnalysis: 'Analyze this program specification PDF and extract general info, mission, PEOs, SOs, etc.'
    }
  },
  teachingMethods: [
    { "id": "tm1", "code": "LEC", "name": { "vi": "Giảng lý thuyết", "en": "Lecture" }, "description": { "vi": "Giảng viên trình bày các khái niệm lý thuyết.", "en": "Instructor presents theoretical concepts." }, "hoursPerCredit": 15, "category": "THEORY", "hoursConfig": { "study": 15, "review": 1, "exam": "1~2" } },
    { "id": "tm2", "code": "LAB", "name": { "vi": "Thực hành/Thí nghiệm", "en": "Laboratory" }, "description": { "vi": "Sinh viên thực hiện thí nghiệm hoặc thực hành.", "en": "Students perform experiments or practical tasks." }, "hoursPerCredit": 30, "category": "PRACTICE", "hoursConfig": { "study": 30, "review": 2, "exam": "1~2" } },
    { "id": "tm3", "code": "DIS", "name": { "vi": "Thảo luận", "en": "Discussion" }, "description": { "vi": "Trao đổi, thảo luận nhóm về chủ đề.", "en": "Group exchange and discussion on topics." }, "hoursPerCredit": 15, "category": "THEORY", "hoursConfig": { "study": 15, "review": 1, "exam": "1~2" } },
    { "id": "tm4", "code": "INT", "name": { "vi": "Thực tập", "en": "Internship" }, "description": { "vi": "Làm việc thực tế tại doanh nghiệp.", "en": "Practical work at an enterprise." }, "hoursPerCredit": 45, "category": "PRACTICE", "hoursConfig": { "study": 45, "review": 3, "exam": "1~2" } },
    { "id": "tm5", "code": "PRJ", "name": { "vi": "Đồ án", "en": "Project" }, "description": { "vi": "Thực hiện dự án môn học.", "en": "Execution of a course project." }, "hoursPerCredit": 45, "category": "PRACTICE", "hoursConfig": { "study": 45, "review": 3, "exam": "1~2" } },
    { "id": "tm6", "code": "REC", "name": { "vi": "Ôn tập", "en": "Recitation" }, "description": { "vi": "Ôn tập và củng cố kiến thức.", "en": "Review and consolidation of knowledge." }, "hoursPerCredit": 15, "category": "THEORY", "hoursConfig": { "study": 16, "review": 0, "exam": 0 } },
    { "id": "tm7", "code": "PLD", "name": { "vi": "Dã ngoại/Thực địa", "en": "Field Trip" }, "description": { "vi": "Tham quan thực tế, đi thực địa.", "en": "Field visits and practical observation." }, "hoursPerCredit": 30, "category": "PRACTICE", "hoursConfig": { "study": 45, "review": 3, "exam": "1~2" } },
    { "id": "tm8", "code": "WOR", "name": { "vi": "Workshop", "en": "Workshop" }, "description": { "vi": "Hội thảo chuyên đề.", "en": "Thematic workshop." }, "hoursPerCredit": 30, "category": "PRACTICE", "hoursConfig": { "study": 30, "review": 2, "exam": "1~2" } },
    { "id": "tm9", "code": "CLC", "name": { "vi": "Lâm sàng", "en": "Clinic" }, "description": { "vi": "Thực tập/thực hành trực tiếp với bệnh nhân.", "en": "Direct internship/practice with patients." }, "hoursPerCredit": 45, "category": "PRACTICE", "hoursConfig": { "study": 45, "review": 3, "exam": "1~2" } },
    { "id": "tm10", "code": "COL", "name": { "vi": "Hội thảo chuyên đề", "en": "Colloquium" }, "description": { "vi": "Hội họp với sự góp mặt của nhiều giảng viên hay những người có nhiều kinh nghiệm thực tế.", "en": "Meetings with many instructors or experienced practitioners." }, "hoursPerCredit": 15, "category": "THEORY", "hoursConfig": { "study": 15, "review": 1, "exam": "1~2" } },
    { "id": "tm11", "code": "CON", "name": { "vi": "Đối thoại", "en": "Conversation" }, "description": { "vi": "Thực hành đối thoại ngôn ngữ/ngoại ngữ.", "en": "Language or foreign language conversation practice." }, "hoursPerCredit": 30, "category": "PRACTICE", "hoursConfig": { "study": 30, "review": 2, "exam": "1~2" } },
    { "id": "tm12", "code": "DEM", "name": { "vi": "Biểu diễn", "en": "Demonstration" }, "description": { "vi": "Học qua quan sát biểu diễn hay mô phỏng của giảng viên.", "en": "Learning by observing demonstrations or simulations." }, "hoursPerCredit": 15, "category": "THEORY", "hoursConfig": { "study": 15, "review": 1, "exam": "1~2" } },
    { "id": "tm13", "code": "GRP", "name": { "vi": "Học nhóm", "en": "Group study" }, "description": { "vi": "Học nhóm theo hướng dẫn của giảng viên.", "en": "Group study under the guidance of an instructor." }, "hoursPerCredit": 45, "category": "PRACTICE", "hoursConfig": { "study": 45, "review": 3, "exam": "1~2" } },
    { "id": "tm14", "code": "IND", "name": { "vi": "Tự nghiên cứu", "en": "Independent study" }, "description": { "vi": "Tự nghiên cứu và phát triển.", "en": "Self-study and personal development." }, "hoursPerCredit": 36, "category": "PRACTICE", "hoursConfig": { "study": 36, "review": 0, "exam": 0 } },
    { "id": "tm15", "code": "REA", "name": { "vi": "Đọc", "en": "Reading" }, "description": { "vi": "Học qua tự đọc hay đọc theo hướng dẫn.", "en": "Learning through self-reading or guided reading." }, "hoursPerCredit": 48, "category": "THEORY", "hoursConfig": { "study": 48, "review": 0, "exam": 0 } },
    { "id": "tm16", "code": "SEM", "name": { "vi": "Seminar", "en": "Seminar" }, "description": { "vi": "Hội họp thảo luận chuyên sâu.", "en": "Deep-dive discussion meetings." }, "hoursPerCredit": 15, "category": "THEORY", "hoursConfig": { "study": 15, "review": 1, "exam": "1~2" } },
    { "id": "tm17", "code": "SES", "name": { "vi": "Trình bày / Thảo luận", "en": "Session" }, "description": { "vi": "Trình bày nội dung và ngay sau đó, thảo luận về nội dung đó.", "en": "Presentation followed immediately by discussion." }, "hoursPerCredit": 15, "category": "THEORY", "hoursConfig": { "study": 15, "review": 1, "exam": "1~2" } },
    { "id": "tm18", "code": "SLF", "name": { "vi": "Tự học", "en": "Self-study" }, "description": { "vi": "Tự học theo những yêu cầu cụ thể.", "en": "Self-study based on specific requirements." }, "hoursPerCredit": 32, "category": "PRACTICE", "hoursConfig": { "study": 32, "review": 0, "exam": 0 } },
    { "id": "tm19", "code": "STD", "name": { "vi": "Studio", "en": "Studio" }, "description": { "vi": "Thực hành hoặc làm đồ án trong Studio(s).", "en": "Practice or project work in a Studio environment." }, "hoursPerCredit": 30, "category": "PRACTICE", "hoursConfig": { "study": 30, "review": 2, "exam": "1~2" } },
    { "id": "tm20", "code": "SUP", "name": { "vi": "Bổ trợ", "en": "Supplement" }, "description": { "vi": "Học thêm hoặc ôn tập thêm.", "en": "Additional learning or extra review." }, "hoursPerCredit": 15, "category": "THEORY", "hoursConfig": { "study": 15, "review": 1, "exam": "1~2" } },
    { "id": "tm21", "code": "TUT", "name": { "vi": "Phụ đạo", "en": "Tutoring" }, "description": { "vi": "Một người phụ đạo cho một hoặc một số người khác.", "en": "Tutoring for individuals or small groups." }, "hoursPerCredit": 15, "category": "THEORY", "hoursConfig": { "study": 15, "review": 1, "exam": "1~2" } },
    { "id": "tm22", "code": "VOL", "name": { "vi": "Tình nguyện", "en": "Voluntary work" }, "description": { "vi": "Tự nguyện tham gia.", "en": "Voluntarily participating in activities." }, "hoursPerCredit": 45, "category": "PRACTICE", "hoursConfig": { "study": 45, "review": 3, "exam": "1~2" } }
  ],
  assessmentMethods: [
    { id: 'am1', name: { vi: 'Chuyên cần', en: 'Attendance' } },
    { id: 'am2', name: { vi: 'Phát biểu', en: 'Participation' } },
    { id: 'am3', name: { vi: 'Bài tập', en: 'Assignment' } },
    { id: 'am4', name: { vi: 'Thực hành', en: 'Practical' } },
    { id: 'am8', name: { vi: 'Kiểm tra thường kỳ', en: 'Regular Exam' } },
    { id: 'am5', name: { vi: 'Kiểm tra giữa kỳ', en: 'Midterm Exam' } },
    { id: 'am6', name: { vi: 'Thi kết thúc học phần', en: 'Final Exam' } },
    { id: 'am7', name: { vi: 'Đồ án', en: 'Project' } }
  ],
  mission: {
    text: {
      vi: "Sứ mạng của Trường Kỹ thuật và Công nghệ thuộc Đại học Duy Tân là cam kết cung cấp cho người học những kiến thức, kỹ năng và khả năng thích ứng cần thiết cho công việc chuyên môn và nghiên cứu trong lĩnh vực kỹ thuật và công nghệ, qua đó đáp ứng nhu cầu nhân lực của địa phương và toàn cầu.",
      en: "The mission of the School of Engineering and Technology at Duy Tan University is to commit to providing graduates with the necessary knowledge, skills, and adaptability for professional and research works in the field of engineering and technology, thereby fulfilling both global and local workforce demands."
    },
    constituents: [
      { id: 'mc1', description: { vi: "Kiến thức chuyên môn", en: "Professional knowledge" } },
      { id: 'mc2', description: { vi: "Kỹ năng thực hành", en: "Practical skills" } },
      { id: 'mc3', description: { vi: "Khả năng thích ứng", en: "Adaptability" } },
      { id: 'mc4', description: { vi: "Nghiên cứu kỹ thuật", en: "Engineering research" } }
    ]
  },
  knowledgeAreas: [
    { id: 'math_sci', name: { vi: 'Toán & KHTN', en: 'Math & Basic Sciences' }, color: 'blue' },
    { id: 'fund_eng', name: { vi: 'Cơ sở ngành Kỹ thuật', en: 'Fundamental Engineering' }, color: 'indigo' },
    { id: 'adv_eng', name: { vi: 'Chuyên ngành Kỹ thuật', en: 'Advanced Engineering' }, color: 'purple' },
    { id: 'gen_ed', name: { vi: 'Giáo dục Đại cương', en: 'General Education' }, color: 'green' },
    { id: 'other', name: { vi: 'Khác', en: 'Other' }, color: 'slate' }
  ],
  facultyTitles: {
    ranks: [
      { id: 'r1', name: { vi: 'Giảng viên', en: 'Lecturer' } },
      { id: 'r2', name: { vi: 'Giảng viên cao cấp', en: 'Senior Lecturer' } },
      { id: 'r3', name: { vi: 'Trợ giảng', en: 'Teaching Assistant' } }
    ],
    degrees: [
      { id: 'd1', name: { vi: 'Tiến sĩ', en: 'Ph.D' } },
      { id: 'd2', name: { vi: 'Thạc sĩ', en: 'Master' } },
      { id: 'd3', name: { vi: 'Kỹ sư', en: 'Engineer' } },
      { id: 'd4', name: { vi: 'Cử nhân', en: 'Bachelor' } }
    ],
    academicTitles: [
      { id: 'at1', name: { vi: 'Không', en: 'None' } },
      { id: 'at2', name: { vi: 'Giáo sư', en: 'Professor' } },
      { id: 'at3', name: { vi: 'Phó giáo sư', en: 'Associate Professor' } }
    ],
    positions: [
      { id: 'p1', name: { vi: 'Giảng viên', en: 'Faculty Member' } },
      { id: 'p2', name: { vi: 'Trưởng khoa', en: 'Dean' } },
      { id: 'p3', name: { vi: 'Phó trưởng khoa', en: 'Vice Dean' } },
      { id: 'p4', name: { vi: 'Trưởng bộ môn', en: 'Head of Department' } }
    ]
  },
  academicSchools: [
    { id: 'sch_set', code: 'SET', name: { vi: 'Trường Kỹ thuật & Công nghệ', en: 'School of Engineering & Technology' } }
  ],
  academicFaculties: [
    { id: 'fac_eee', code: 'FEEE', name: { vi: 'Khoa Điện - Điện tử', en: 'Faculty of Electrical - Electronic Engineering' }, schoolId: 'sch_set' },
    { id: 'fac_it', code: 'FIT', name: { vi: 'Khoa Công nghệ Thông tin', en: 'Faculty of Information Technology' }, schoolId: 'sch_set' }
  ],
  departments: [
    { id: 'dept_ee', code: 'EE', name: { vi: 'Bộ môn Điện - Điện tử', en: 'Department of Electrical & Electronics' }, academicFacultyId: 'fac_eee' },
    { id: 'dept_it', code: 'IT', name: { vi: 'Bộ môn Công nghệ Thông tin', en: 'Department of Information Technology' }, academicFacultyId: 'fac_it' },
    { id: 'dept_bs', code: 'BS', name: { vi: 'Bộ môn Khoa học Cơ bản', en: 'Department of Basic Sciences' }, academicFacultyId: 'fac_eee' }
  ],
  peos: [
    { id: 'peo1', code: 'PEO-1', title: { en: 'Dynamic & Creative Solutions', vi: 'Giải pháp Năng động & Sáng tạo' }, description: { en: 'Apply dynamic and creative approaches to solve engineering problems.', vi: 'Áp dụng các cách tiếp cận năng động và sáng tạo để giải quyết vấn đề kỹ thuật.' } },
    { id: 'peo2', code: 'PEO-2', title: { en: 'Effective & Ethical Contribution', vi: 'Đóng góp Hiệu quả & Đạo đức' }, description: { en: 'Contribute effectively and ethically to society.', vi: 'Đóng góp hiệu quả và có đạo đức cho xã hội.' } },
    { id: 'peo3', code: 'PEO-3', title: { en: 'Lifelong Learning & Innovation', vi: 'Học tập suốt đời & Đổi mới' }, description: { en: 'Lead innovation through lifelong learning.', vi: 'Dẫn đầu sự đổi mới thông qua học tập suốt đời.' } },
    { id: 'peo4', code: 'PEO-4', title: { en: 'Global Citizenship', vi: 'Công dân Toàn cầu' }, description: { en: 'Act as a responsible global citizen.', vi: 'Đóng góp tích cực và có trách nhiệm như một công dân toàn cầu.' } },
  ],
  sos: [
    { id: 'so1', number: 1, code: 'SO-1', description: { en: 'An ability to identify, formulate, and solve complex engineering problems by applying principles of engineering, science, and mathematics.', vi: 'Khả năng xác định, diễn đạt và giải quyết các vấn đề kỹ thuật phức tạp bằng cách áp dụng các nguyên lý kỹ thuật, khoa học và toán học.' }, pis: [
      { id: 'pi1.1', code: '1.1', description: { en: 'Ability to identify a complex engineering problem by using scientific principles.', vi: 'Khả năng xác định vấn đề kỹ thuật phức tạp bằng cách sử dụng các nguyên lý khoa học.' } },
      { id: 'pi1.2', code: '1.2', description: { en: 'Ability to develop a hardware/software/math model for a complex engineering problem.', vi: 'Khả năng phát triển mô hình phần cứng/phần mềm/toán học cho một vấn đề kỹ thuật phức tạp.' } }
    ] },
    { id: 'so2', number: 2, code: 'SO-2', description: { en: 'An ability to apply engineering design to produce solutions that meet specified needs with consideration of public health, safety, and welfare, as well as global, cultural, social, environmental, and economic factors.', vi: 'Khả năng áp dụng thiết kế kỹ thuật để tạo ra các giải pháp đáp ứng nhu cầu cụ thể với sự cân nhắc đến sức khỏe cộng đồng, an toàn, và phúc lợi, cũng như các yếu tố toàn cầu, văn hóa, xã hội, môi trường và kinh tế.' }, pis: [
      { id: 'pi2.1', code: '2.1', description: { en: 'Ability to recognize and distinguish important real-world constraints for a particular design or design component.', vi: 'Khả năng nhận biết và phân biệt các ràng buộc thực tế quan trọng cho một thiết kế hoặc thành phần thiết kế cụ thể.' } },
      { id: 'pi2.2', code: '2.2', description: { en: 'Ability to translate practical quantitative constraints to appropriate design parameters.', vi: 'Khả năng chuyển đổi các ràng buộc định lượng thực tế thành các thông số thiết kế phù hợp.' } }
    ] },
    { id: 'so3', number: 3, code: 'SO-3', description: { vi: 'Khả năng giao tiếp hiệu quả.', en: 'Effective communication ability.' }, pis: [] },
    { id: 'so4', number: 4, code: 'SO-4', description: { vi: 'Khả năng nhận biết trách nhiệm đạo đức.', en: 'Ethical responsibility awareness.' }, pis: [] },
    { id: 'so5', number: 5, code: 'SO-5', description: { vi: 'Khả năng làm việc nhóm.', en: 'Teamwork ability.' }, pis: [] },
    { id: 'so6', number: 6, code: 'SO-6', description: { vi: 'Khả năng thực nghiệm.', en: 'Experimental ability.' }, pis: [] },
    { id: 'so7', number: 7, code: 'SO-7', description: { vi: 'Khả năng học tập suốt đời.', en: 'Lifelong learning ability.' }, pis: [] }
  ],
  courses: [
    { 
      id: '346', 
      code: 'EE 346', 
      name: { vi: 'Thực tập nhận thức', en: 'Awareness Internship' }, 
      credits: 2, 
      isEssential: true, 
      type: 'REQUIRED', 
      knowledgeAreaId: 'adv_eng', 
      departmentId: 'dept_ee', // Assigned to EE
      semester: 1, 
      colIndex: 0, 
      prerequisites: [], 
      coRequisites: [],
      description: { 
        vi: 'Khóa học là một hoạt động quan trọng đối với sinh viên Kỹ thuật Điện và Điện tử. Nó được thiết kế để mang lại cho họ cái nhìn toàn diện và thực tế về môi trường làm việc và các lĩnh vực ứng dụng khác nhau trong lĩnh vực của họ.', 
        en: 'The course is a crucial activity for Electrical and Electronic Engineering students. It\'s designed to give them a comprehensive and practical insight into the working environment and the various application areas of their field.' 
      }, 
      textbooks: [
        { resourceId: 'lib1', title: 'Internship Guidelines', author: 'Faculty of EEE', publisher: 'DTU', year: '2024', type: 'reference', url: '' }
      ], 
      clos: { 
        vi: [
          'Mô tả các trách nhiệm đạo đức và chuyên môn cần thiết trong môi trường làm việc Kỹ thuật Điện và Điện tử.',
          'Xác định và mô tả các công nghệ, thiết bị, sản phẩm và giải pháp tiêu biểu hiện đang được áp dụng trong lĩnh vực thực tế.',
          'Áp dụng kiến thức và kinh nghiệm thực tế để đánh giá yêu cầu công việc, từ đó định hình các mục tiêu nghề nghiệp và lộ trình phát triển trong tương lai.',
          'So sánh các kỹ thuật, công nghệ hoặc quy trình sản xuất khác nhau được quan sát trong kỳ thực tập.',
          'Trình bày rõ ràng và mạch lạc những kiến thức và kinh nghiệm thu được từ kỳ thực tập, sử dụng các công cụ hỗ trợ phù hợp.'
        ], 
        en: [
          'Describe the ethical and professional responsibilities required in the Electrical and Electronic Engineering work environment.',
          'Identify and describe typical technologies, equipment, products, and solutions currently applied in the practical field of Electrical and Electronic Engineering.',
          'Apply practical knowledge and experience to assess job requirements, thereby shaping personal career goals and development paths for the future.',
          'Compare different techniques, technologies, or production processes observed during the internship, and evaluate the advantages and disadvantages of each method.',
          'Clearly and coherently present the knowledge and experience gained from the internship, utilizing appropriate supporting tools.'
        ] 
      }, 
      topics: [
        { 
          id: 't1', 
          no: 'CONT.1', 
          topic: { vi: 'Tham quan và tìm hiểu về cơ cấu tổ chức...', en: 'Visit and learn about the organizational structure...' },
          activities: [
            { methodId: 'tm4', hours: 10 }
          ],
          readingRefs: []
        },
        { 
          id: 't2', 
          no: 'CONT.2', 
          topic: { vi: 'Tương tác với các kỹ sư...', en: 'Interact with engineers...' },
          activities: [
            { methodId: 'tm4', hours: 10 }
          ],
          readingRefs: []
        }
      ],
      assessmentPlan: [
        { id: 'a1', methodId: 'am1', type: { vi: 'Chuyên cần', en: 'Attendance' }, percentile: 30 },
        { id: 'a2', methodId: 'am7', type: { vi: 'Đồ án cá nhân', en: 'Individual Project' }, percentile: 70 }
      ],
      instructorIds: ['f1'],
      instructorDetails: {
        'f1': { classInfo: '', isMain: true }
      },
      cloMap: []
    },
    { 
      id: '200', 
      code: 'EE 200', 
      name: { vi: 'Mạch điện I', en: 'Electric Circuits I' }, 
      credits: 3, 
      isEssential: true, 
      type: 'REQUIRED', 
      knowledgeAreaId: 'fund_eng', 
      departmentId: 'dept_ee', // Assigned to EE
      semester: 3, 
      colIndex: 0, 
      prerequisites: [], 
      coRequisites: [],
      description: { 
        vi: 'Khóa học giới thiệu các khái niệm cơ bản về mạch điện, định luật Kirchhoff, các phương pháp phân tích mạch DC và AC cơ bản.', 
        en: 'This course introduces basic concepts of electric circuits, Kirchhoff\'s laws, and fundamental methods of DC and AC circuit analysis.' 
      }, 
      textbooks: [], 
      clos: { vi: [], en: [] }, 
      topics: [],
      assessmentPlan: [],
      instructorIds: [],
      instructorDetails: {},
      cloMap: []
    },
    { 
      id: '252', 
      code: 'EE 252', 
      name: { vi: 'Mạch điện II', en: 'Electric Circuits II' }, 
      credits: 3, 
      isEssential: true, 
      type: 'REQUIRED', 
      knowledgeAreaId: 'fund_eng', 
      departmentId: 'dept_ee', // Assigned to EE
      semester: 4, 
      colIndex: 0, 
      prerequisites: ['EE 200'], 
      coRequisites: [],
      description: { 
        vi: 'Khóa học nâng cao về phân tích mạch điện, bao gồm mạch ba pha, mạng hai cổng, và đáp ứng tần số.', 
        en: 'Advanced course on electric circuit analysis, including three-phase circuits, two-port networks, and frequency response.' 
      }, 
      textbooks: [], 
      clos: { vi: [], en: [] }, 
      topics: [],
      assessmentPlan: [],
      instructorIds: [],
      instructorDetails: {},
      cloMap: []
    }
  ],
  library: [
    { id: 'lib1', title: 'Internship Guidelines', author: 'Faculty of EEE', publisher: 'DTU', year: '2024', type: 'reference', isEbook: true, isPrinted: true, url: '' }
  ],
  faculties: [],
  facilities: [],
  generalInfo: {
    university: { vi: 'Đại học Duy Tân', en: 'Duy Tan University' },
    school: { vi: 'Trường Kỹ thuật & Công nghệ', en: 'School of Engineering & Technology' },
    programName: { vi: 'Kỹ thuật Điện - Điện tử', en: 'Electrical & Electronic Engineering' },
    contact: { vi: '', en: '' },
    history: { vi: '', en: '' },
    deliveryModes: { vi: '', en: '' },
    locations: { vi: '', en: '' },
    academicYear: '2024',
    defaultSubjectCode: 'EE',
    defaultSubjectName: { vi: 'Môn học mới', en: 'New Subject' },
    defaultCredits: 3,
    publicDisclosure: { vi: '', en: '' },
    previousEvaluations: {
        weaknesses: { vi: '', en: '' },
        actions: { vi: '', en: '' },
        status: { vi: '', en: '' }
    },
    moetInfo: {
        level: { vi: 'Đại học', en: 'Undergraduate' },
        majorName: { vi: 'Kỹ thuật Điện - Điện tử', en: 'Electrical & Electronic Engineering' },
        majorCode: '7520201',
        specializationName: { vi: '', en: '' },
        specializationCode: '',
        trainingMode: { vi: 'Chính quy', en: 'Full-time' },
        trainingType: { vi: 'Tập trung', en: 'On-campus' },
        trainingLanguage: { vi: 'Tiếng Việt', en: 'Vietnamese' },
        duration: '4.5 years',
        admissionTarget: { vi: '', en: '' },
        admissionReq: { vi: '', en: '' },
        graduationReq: { vi: '', en: '' },
        gradingScale: { vi: '', en: '' },
        implementationGuideline: { vi: '', en: '' },
        guidelineFacilities: { vi: '', en: '' },
        guidelineClassForms: { vi: '', en: '' },
        guidelineCreditConversion: { vi: '', en: '' },
        referencedPrograms: { vi: '', en: '' },
        generalObjectives: { vi: '', en: '' },
        specificObjectives: [],
        programStructure: { gen: [], phys: [], fund: [], spec: [], grad: [] },
        courseObjectiveMap: [],
        programFaculty: []
    }
  },
  courseSoMap: [],
  coursePiMap: [],
  coursePeoMap: [],
  peoSoMap: [],
  peoConstituentMap: []
};

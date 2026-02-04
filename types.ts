
export type Language = 'vi' | 'en';
export type Role = 'ADMIN' | 'USER';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: Role;
  lastLogin: string;
}

export type LocalizedString = {
  [key in Language]: string;
};

export interface MissionConstituent {
  id: string;
  description: LocalizedString;
}

export interface Mission {
  text: LocalizedString;
  constituents: MissionConstituent[];
}

export interface PEO {
  id: string;
  code: string;
  title: LocalizedString;
  description: LocalizedString;
}

export interface PI {
  id: string;
  code: string;
  description: LocalizedString;
}

export interface SO {
  id: string;
  number: number;
  code: string;
  description: LocalizedString;
  pis: PI[];
}

export interface KnowledgeArea {
  id: string;
  name: LocalizedString;
  color: string;
}

export interface AcademicSchool {
  id: string;
  code: string;
  name: LocalizedString;
  description?: LocalizedString;
}

export interface AcademicFaculty {
  id: string;
  code: string;
  name: LocalizedString;
  description?: LocalizedString;
  schoolId?: string; // Link to AcademicSchool (Trường)
}

export interface Department {
  id: string;
  code: string;
  name: LocalizedString;
  description?: LocalizedString;
  headIds?: string[]; // IDs of Faculty who are heads
  academicFacultyId?: string; // Link to AcademicFaculty (Khoa)
}

export interface Textbook {
  resourceId: string;
  title: string;
  author: string;
  publisher: string;
  year: string;
  type: 'textbook' | 'reference';
  url?: string;
}

export interface TopicActivity {
  methodId: string;
  hours: number;
}

export interface TopicReading {
  resourceId: string;
  pageRange: string;
}

export interface CourseTopic {
  id: string;
  no: string;
  topic: LocalizedString;
  activities: TopicActivity[];
  readingRefs: TopicReading[];
}

export interface AssessmentItem {
  id: string;
  methodId: string;
  type: LocalizedString;
  percentile: number;
}

export enum CoverageLevel {
  NONE = '',
  L = 'L',
  M = 'M',
  H = 'H'
}

export interface CloMapping {
  cloIndex: number;
  topicIds: string[];
  teachingMethodIds: string[];
  assessmentMethodIds: string[];
  coverageLevel: CoverageLevel;
  soIds: string[];
  piIds?: string[]; // Added to support granular PI mapping
  objectiveIds?: string[]; // Added to support MOET objective mapping
}

export interface Course {
  id: string;
  code: string;
  name: LocalizedString;
  credits: number;
  isEssential: boolean;
  isAbet?: boolean;
  type: 'REQUIRED' | 'SELECTED_ELECTIVE' | 'ELECTIVE';
  knowledgeAreaId: string;
  departmentId?: string; // Link to Department
  semester: number;
  colIndex: number;
  prerequisites: string[];
  coRequisites: string[];
  description: LocalizedString;
  textbooks: Textbook[];
  clos: { vi: string[]; en: string[] };
  topics: CourseTopic[];
  assessmentPlan: AssessmentItem[];
  instructorIds: string[];
  instructorDetails: Record<string, { classInfo: string; isMain?: boolean }>;
  cloMap: CloMapping[];
}

export interface EducationItem {
  id: string;
  degree: LocalizedString;
  discipline: LocalizedString;
  institution: LocalizedString;
  year: string;
}

export interface AcademicExperienceItem {
  id: string;
  institution: LocalizedString;
  rank: LocalizedString;
  title: LocalizedString;
  period: string;
  isFullTime: boolean;
}

export interface NonAcademicExperienceItem {
  id: string;
  company: LocalizedString;
  title: LocalizedString;
  description: LocalizedString;
  period: string;
  isFullTime: boolean;
}

export interface PublicationItem {
  id: string;
  text: LocalizedString;
}

export interface FacultyListItem {
  id: string;
  content: LocalizedString;
}

export interface Faculty {
  id: string;
  name: LocalizedString;
  rank: LocalizedString;
  degree: LocalizedString;
  academicTitle: LocalizedString;
  position: LocalizedString;
  experience: LocalizedString;
  careerStartYear?: number; // Added for automatic calculation
  workload: number;
  employmentType?: 'FT' | 'PT';
  departmentId?: string; // Link to Department
  dob?: string;
  office?: string;
  officeHours?: string;
  tel?: string;
  cell?: string;
  email?: string;
  educationList: EducationItem[];
  academicExperienceList: AcademicExperienceItem[];
  nonAcademicExperienceList: NonAcademicExperienceItem[];
  publicationsList: PublicationItem[];
  // New list-based structures
  certificationsList: FacultyListItem[];
  membershipsList: FacultyListItem[];
  honorsList: FacultyListItem[];
  serviceActivitiesList: FacultyListItem[];
  professionalDevelopmentList: FacultyListItem[];
}

export interface FacultyTitle {
  id: string;
  name: LocalizedString;
  abbreviation?: LocalizedString; // Added abbreviation
}

export interface FacultyTitles {
  ranks: FacultyTitle[];
  degrees: FacultyTitle[];
  academicTitles: FacultyTitle[];
  positions: FacultyTitle[];
}

export type TeachingMethodCategory = 'THEORY' | 'PRACTICE';

export interface TeachingMethod {
  id: string;
  code: string;
  name: LocalizedString;
  description?: LocalizedString; // Added description field
  hoursPerCredit: number;
  category: TeachingMethodCategory;
  hoursConfig?: {
    study: number;
    review: number;
    exam: string | number;
  };
}

export interface AssessmentMethod {
  id: string;
  name: LocalizedString;
}

export type MoetCategory = 'knowledge' | 'skills' | 'learning';

export interface MoetObjective {
  id: string;
  category?: MoetCategory;
  description: LocalizedString;
  peoIds?: string[];
  soIds?: string[];
}

export interface MoetProgramFaculty {
  id: string;
  name: string;
  position: string;
  major: string;
  degree: string;
  responsibility: string;
  note: string;
}

export interface MoetSubBlock {
  id: string;
  name: LocalizedString;
  parentBlockId: 'gen' | 'phys' | 'fund' | 'spec' | 'grad';
  type?: 'COMPULSORY' | 'ELECTIVE'; // Added to distinguish block types
  minCredits: number;
  courseIds: string[];
  note?: LocalizedString;
  uiPosition?: { x: number; y: number }; // Added for Flowchart DnD
  preferredSemester?: number; // Semester priority for elective blocks
}

export interface MoetInfo {
  level: LocalizedString;
  majorName: LocalizedString;
  majorCode: string;
  specializationName: LocalizedString;
  specializationCode: string;
  trainingMode: LocalizedString;
  trainingType: LocalizedString;
  trainingLanguage: LocalizedString;
  duration: string;
  admissionTarget: LocalizedString;
  admissionReq: LocalizedString;
  graduationReq: LocalizedString;
  graduationNote?: LocalizedString;
  gradingScale: LocalizedString;
  implementationGuideline: LocalizedString;
  guidelineFacilities?: LocalizedString; // 13.1
  guidelineClassForms?: LocalizedString; // 13.2
  guidelineCreditConversion?: LocalizedString; // 13.3
  referencedPrograms: LocalizedString;
  generalObjectives: LocalizedString;
  moetSpecificObjectives?: MoetObjective[];
  specificObjectives: MoetObjective[];
  programStructure: {
    gen: string[];
    phys: string[];
    fund: string[];
    spec: string[];
    grad: string[];
  };
  subBlocks?: MoetSubBlock[]; 
  courseObjectiveMap?: string[];
  programFaculty?: MoetProgramFaculty[];
}

export interface GeneralInfo {
  university: LocalizedString;
  school: LocalizedString;
  programName: LocalizedString;
  contact: LocalizedString;
  history: LocalizedString;
  deliveryModes: LocalizedString;
  locations: LocalizedString;
  academicYear: string;
  defaultSubjectCode: string;
  defaultSubjectName: LocalizedString;
  defaultCredits: number;
  publicDisclosure: LocalizedString;
  previousEvaluations: {
    weaknesses: LocalizedString;
    actions: LocalizedString;
    status: LocalizedString;
  };
  moetInfo: MoetInfo;
}

export interface LibraryResource {
  id: string;
  title: string;
  author: string;
  publisher: string;
  year: string;
  type: 'textbook' | 'reference';
  isEbook: boolean;
  isPrinted: boolean;
  url?: string;
}

export interface GeminiConfig {
  model: string;
  apiKey?: string;
  prompts: Record<string, string>;
}

export enum IRM {
  I = 'I',
  R = 'R',
  M = 'M',
  NONE = ''
}

export interface Facility {
  id: string;
  code: string;
  name: LocalizedString;
  description: LocalizedString;
  courseIds: string[];
}

export interface AppState {
  version?: string; // App Version tracking
  language: Language;
  authEnabled: boolean;
  currentUser: UserAccount | null;
  users: UserAccount[];
  mission: Mission;
  peos: PEO[];
  sos: SO[];
  academicSchools: AcademicSchool[]; // New: Trường
  academicFaculties: AcademicFaculty[]; // Khoa (linked to School)
  departments: Department[]; // Bộ môn (linked to Faculty)
  courses: Course[];
  faculties: Faculty[];
  facilities: Facility[];
  knowledgeAreas: KnowledgeArea[];
  teachingMethods: TeachingMethod[];
  assessmentMethods: AssessmentMethod[];
  facultyTitles: FacultyTitles;
  geminiConfig: GeminiConfig;
  generalInfo: GeneralInfo;
  library: LibraryResource[];
  courseSoMap: { courseId: string; soId: string; level: IRM }[];
  coursePiMap: { courseId: string; piId: string }[];
  coursePeoMap: { courseId: string; peoId: string }[];
  peoSoMap: { peoId: string; soId: string }[];
  peoConstituentMap: { peoId: string; constituentId: string }[];
}

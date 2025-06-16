export interface ExcelRow {
  ClassName: string;
  SchoolYearCode: string;
  EducationalSystemName: string;
  GradeLevelCode: string;
  HomeroomTeacherEmails: string;
  StudentCodes: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
} 
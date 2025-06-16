import type { SchoolYear, EducationalSystem, GradeLevel } from './school.types';
import type { Teacher, Student } from './user.types';
import type { BaseEntity } from './common.types';

export interface Class extends BaseEntity {
  className: string;
  schoolYear: SchoolYear;
  educationalSystem: EducationalSystem;
  gradeLevel: GradeLevel;
  homeroomTeachers: Teacher[];
  students: Student[];
  classImage?: string; // Đường dẫn đến ảnh lớp
} 
import type { EducationalSystem, School, GradeLevel } from './school.types';
import type { Room } from './room.types';
import type { BaseEntity } from './common.types';

export interface Subject extends BaseEntity {
  name: string;
  code: string;
  school: School;
  gradeLevels: GradeLevel[];
  needFunctionRoom: boolean;
  rooms: Room[];
  curriculums: Array<{
    curriculum: {
      _id: string;
      name: string;
    };
  }>;
  isParentSubject: boolean;
  parentSubject?: {
    _id: string;
    name: string;
    code: string;
  };
  subSubjects: Array<{
    _id: string;
    name: string;
    code: string;
  }>;
  description?: string;
}

export interface CurriculumSubject {
  subject: Subject;
  periodsPerWeek: number;
}

export interface Curriculum extends BaseEntity {
  name: string;
  educationalSystem: EducationalSystem;
  gradeLevel?: string;  
  subjects: CurriculumSubject[];
  description?: string;
}

export interface CurriculumFormData {
  name: string;
  educationalSystem: string;
  gradeLevel?: string;
  description?: string;
}

export interface SubjectFormData {
  name: string;
  code: string;
  school: string;
  gradeLevels: string[];
  needFunctionRoom: boolean;
  rooms: string[];
  isParentSubject: boolean;
  parentSubject?: string;
  description?: string;
} 
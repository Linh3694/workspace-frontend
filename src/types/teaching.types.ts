import type { Subject, Curriculum } from './curriculum.types';
import type { GradeLevel } from './school.types';
import type { Teacher as BaseTeacher } from './user.types';

// Extended GradeLevel với subjects
export interface GradeLevelWithSubjects extends GradeLevel {
  subjects: {
    _id: string;
    name: string;
    code: string;
  }[];
}

// Extended Teacher cho teaching management
export interface TeacherExtended extends Omit<BaseTeacher, 'user'> {
  user?: {
    avatarUrl?: string;
  };
  jobTitle: string;
  school: {
    _id: string;
    name: string;
    code: string;
    type: string;
  };
  gradeLevels: GradeLevelWithSubjects[];
  subjects: Subject[];
  curriculums: Curriculum[];
  educationalSystem?: {
    _id: string;
    name: string;
  };
  classes?: TeachingClass[];
  teachingAssignments?: {
    class: { _id: string; className: string };
    subjects: { _id: string; name: string }[];
  }[];
}

// Teaching Class interface
export interface TeachingClass {
  _id: string;
  className: string;
  gradeLevel: {
    _id: string;
    name: string;
    code: string;
    order: number;
  };
}

// Class Subject Assignment interface
export interface ClassSubjectAssignment {
  classId: string;
  subjectIds: string[];
}

// Form data types
export interface TeacherFormData {
  fullname: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  school: string;
  gradeLevels?: string[];
  subjects?: string[];
  curriculum?: string;
  classes?: string[];
} 
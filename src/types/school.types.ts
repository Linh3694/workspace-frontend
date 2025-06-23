import type { BaseEntity } from './common.types';

export interface School extends BaseEntity {
  name: string;
  code: string;
  type: string;
  description?: string;
  gradeLevels?: string[];
  educationalSystems?: string[];
  curriculums?: string[];
}

export interface SchoolYear extends BaseEntity {
  code: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface EducationalSystem extends BaseEntity {
  name: string;
  description?: string;
  school: School;
}

export type Quality = "Level 1" | "Level 2" | "Level 3" | "Level 4";

export interface GradeLevel extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  order: number;
  qualities: Quality[];
  school: School;
}

// Form data types
export interface SchoolYearFormData {
  code: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface EducationalSystemFormData {
  name: string;
  description?: string;
  school: string;
}

export interface SchoolFormData {
  name: string;
  code: string;
  type?: string;
  description?: string;
}

export interface GradeLevelFormData {
  name: string;
  description?: string;
  schoolId: string;
  qualities: Quality[];
} 
import type { BaseEntity } from './common.types';
import type { Class } from './class.types';
import type { SchoolYear } from './school.types';

export interface SubAward {
  type: 'year' | 'semester' | 'month' | 'schoolYear' | 'custom' | 'custom_with_description';
  label: string;
  labelEng?: string;
  priority?: number;
  schoolYear?: string;
  semester?: number;
  month?: number;
  description?: string;
  descriptionEng?: string;
}

export type RecipientType = 'student' | 'class';

export interface AwardCategory extends BaseEntity {
  name: string;
  nameEng: string;
  description: string;
  descriptionEng: string;
  coverImage?: string;
  recipientType: RecipientType;
  subAwards: SubAward[];
}

export interface Photo {
  _id: string;
  student: string;
  schoolYear: string;
  url: string;
}

export interface StudentData {
  student: {
    _id: string;
    name: string;
    studentCode: string;
    fullname?: string;
  };
  exam?: string;
  score?: number | string;
  photo?: Photo;
  currentClass?: Class;
  activity?: string[];
  activityEng?: string[];
  note?: string;
  noteEng?: string;
}

export interface ClassData {
  class: string;
  note?: string;
  noteEng?: string;
  classInfo?: {
    _id: string;
    className: string;
    classCode?: string;
  };
}

export interface AwardRecord extends BaseEntity {
  awardCategory: AwardCategory;
  subAward: {
    type: string;
    label: string;
    labelEng?: string;
    schoolYear: string;
    semester?: number;
    month?: number;
    priority?: number;
  };
  students: StudentData[];
  awardClasses: ClassData[];
}

// Extended SchoolYear for HallOfHonor
export interface SchoolYearExtended extends SchoolYear {
  displayName?: string;
}

// Form data types
export interface AwardCategoryFormData {
  name: string;
  nameEng: string;
  description: string;
  descriptionEng: string;
  coverImage?: string;
  recipientType: RecipientType;
}

export interface SubAwardFormData {
  type: 'custom' | 'custom_with_description';
  label: string;
  labelEng?: string;
  description?: string;
  descriptionEng?: string;
  schoolYear: string;
  priority: number;
}

export interface AwardRecordFormData {
  students: StudentData[];
  awardClasses: ClassData[];
} 
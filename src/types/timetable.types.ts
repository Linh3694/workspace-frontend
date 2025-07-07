import type { BaseEntity } from './common.types';
import type { SchoolYear } from './school.types';
import type { Subject } from './curriculum.types';
import type { Teacher } from './user.types';
import type { Room } from './room.types';

export interface TimetableEntry extends BaseEntity {
  subject: Subject | string;
  teachers: Teacher[] | string[] | string;
  room: Room | string;
  dayOfWeek: string;
  period: number;
  timeSlot?: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  };
}

export interface TimetableGrid {
  [day: string]: {
    [period: string]: TimetableEntry | null;
  };
}

export interface PeriodDefinition extends BaseEntity {
  periodNumber: number;
  startTime: string;
  endTime: string;
  label?: string;
  type: PeriodType;
  schoolYear: SchoolYear | string;
  school?: string; // Add school field
}

export type PeriodType = "regular" | "morning" | "lunch" | "nap" | "snack" | "dismissal";

export interface PeriodMeta {
  number: number;
  label: string;
  time?: string;
  type: string;
  start: string;
}

export interface TimetableSlot {
  day: string;
  period: number;
  entry: TimetableEntry | null;
}

export interface TimetableImportRecord {
  dayOfWeek: string;
  periodNumber: number;
  classCode: string;
  subject: string;
  teachers: string[];
  room: string | "Homeroom";
  scheduleId?: string;
}

export interface TimetableImportPayload {
  schoolYear: string;
  records: TimetableImportRecord[];
}

// Form data types
export interface PeriodFormData {
  periodNumber: number;
  startTime: string;
  endTime: string;
  type: PeriodType;
  label?: string;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Constants
export const DAY_OF_WEEK_LABELS = {
  "Monday": "Thứ Hai",
  "Tuesday": "Thứ Ba", 
  "Wednesday": "Thứ Tư",
  "Thursday": "Thứ Năm",
  "Friday": "Thứ Sáu",
  "Saturday": "Thứ Bảy",
  "Sunday": "Chủ Nhật"
} as const;

export const PERIOD_TYPE_LABELS = {
  "regular": "Tiết học thông thường",
  "morning": "Đón học sinh, ăn sáng",
  "lunch": "Ăn trưa",
  "nap": "Ngủ trưa", 
  "snack": "Ăn nhẹ",
  "dismissal": "Dặn dò, xếp hàng ra về"
} as const; 
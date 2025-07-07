import type { BaseEntity } from './common.types';

// School Year Event Types
export interface SchoolYearEvent extends BaseEntity {
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  type: 'holiday' | 'event' | 'exam';
  schoolYear: string;
}

// School Year Types
export interface SchoolYear extends BaseEntity {
  code: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// Calendar Event Types
export interface CalendarEvent {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  type: 'holiday' | 'event' | 'exam';
}

// Event Type Labels
export const EVENT_TYPE_LABELS: Record<CalendarEvent['type'], string> = {
  holiday: 'Nghỉ lễ',
  event: 'Sự kiện',
  exam: 'Thi'
};

// Event Type Colors
export const EVENT_TYPE_COLORS: Record<CalendarEvent['type'], string> = {
  holiday: 'bg-[#F05023]',
  event: 'bg-[#00687F]',
  exam: 'bg-[#002855]'
};

// Form Data Types
export interface SchoolYearEventFormData {
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  type: 'holiday' | 'event' | 'exam';
  schoolYear: string;
}

// Calendar Props Types
export interface CalendarProps {
  events: CalendarEvent[];
  currentDate: Date;
  onDateClick: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  selectedDate?: Date;
} 
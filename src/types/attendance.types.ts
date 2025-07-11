import type { BaseEntity } from './common.types';

export interface Parent {
    fullname: string;
    phone: string;
    relationship: string;
}

export interface Family extends BaseEntity {
    familyCode: string;
    parents: { parent: Parent; relationship: string }[];
    students: { _id: string; name: string }[];
    address: string;
}

export interface AttendanceStudent extends BaseEntity {
    name: string;
    studentCode: string;
    avatarUrl?: string;
    parents?: Parent[];
}

export interface AttendanceTeacher extends BaseEntity {
    fullname: string;
    teachingAssignments?: {
        class: { _id: string; className: string };
        subjects: { _id: string; name: string }[];
    }[];
}

export interface AttendanceClass extends BaseEntity {
    className: string;
    homeroomTeachers?: AttendanceTeacher[];
}

// ✅ THÊM: Interface cho tiết học
export interface Period {
    periodNumber: number;
    startTime: string;
    endTime: string;
    label?: string;
    type: 'regular' | 'morning' | 'lunch' | 'nap' | 'snack' | 'dismissal';
}

// ✅ THÊM: Interface cho timetable slot
export interface TimetableSlot {
    _id: string;
    subject: { _id: string; name: string };
    teachers: { _id: string; fullname: string }[];
    room: { _id: string; name: string };
    timeSlot: {
        dayOfWeek: string;
        startTime: string;
        endTime: string;
    };
}

// ✅ THÊM: Interface cho môn học
export interface Subject {
    _id: string;
    name: string;
    teachers: { _id: string; fullname: string }[];
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Attendance extends BaseEntity {
    status: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    student: AttendanceStudent;
    class: AttendanceClass;
    teacher: AttendanceTeacher;
    date: string;
    note: string;
    // ✅ THÊM: Thông tin tiết học
    periodNumber: number;
    periodStartTime: string;
    periodEndTime: string;
    subject?: { _id: string; name: string };
    timetableSlot?: string;
}

// ✅ THÊM: Interface cho attendance theo period
export interface PeriodAttendance {
    periodNumber: number;
    periodStartTime: string;
    periodEndTime: string;
    subject?: { _id: string; name: string };
    attendances: Attendance[];
    isCompleted: boolean;
}

// ✅ THÊM: Interface cho attendance data khi tạo mới
export interface AttendanceData {
    studentId: string;
    status: AttendanceStatus;
    note?: string;
    checkIn?: string;
    checkOut?: string;
}

export interface PendingAttendance {
    status: string;
    note: string;
}

export interface StudentParentsMap {
    [studentId: string]: Parent[];
}

export interface PendingAttendancesMap {
    [studentId: string]: PendingAttendance;
} 
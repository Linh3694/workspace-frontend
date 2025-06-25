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
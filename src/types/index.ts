// Authentication types
export type { User, UserRole, RolePermissions, MenuItem, MenuSection } from './auth';

// School types  
export type { School, SchoolYear, EducationalSystem, GradeLevel, Quality, SchoolYearFormData, EducationalSystemFormData, SchoolFormData, GradeLevelFormData } from './school.types';

// Curriculum types
export type { Subject, CurriculumSubject, Curriculum, CurriculumFormData, SubjectFormData } from './curriculum.types';

// Class types
export type { Class } from './class.types';

// User types
export type { Teacher, Student } from './user.types';

// Room types
export type { Room } from './room.types';

// Attendance types
export type { 
    Parent, 
    Family, 
    AttendanceStudent, 
    AttendanceTeacher, 
    AttendanceClass, 
    AttendanceStatus, 
    Attendance, 
    PendingAttendance, 
    StudentParentsMap, 
    PendingAttendancesMap 
} from './attendance.types';

// Common types
export type { ComboboxOption, BaseEntity } from './common.types';

// Timetable types
export type { 
    TimetableEntry, 
    TimetableGrid, 
    PeriodDefinition, 
    PeriodType, 
    PeriodMeta, 
    TimetableSlot, 
    TimetableImportRecord, 
    TimetableImportPayload, 
    PeriodFormData, 
    ApiResponse,
    DAY_OF_WEEK_LABELS,
    PERIOD_TYPE_LABELS
} from './timetable.types';

// Teaching types
export type { 
    GradeLevelWithSubjects, 
    TeacherExtended, 
    TeachingClass, 
    ClassSubjectAssignment, 
    TeacherFormData 
} from './teaching.types';

// Library types
export type { 
    DocumentType, 
    SeriesName, 
    SpecialCode, 
    Author, 
    Library, 
    Book, 
    LibraryWithBooks, 
    BookItem, 
    CartItem, 
    StudentInfo, 
    StudentSuggestion, 
    BorrowPayload 
} from './library';

// Import types
export type { ExcelRow, ImportResult } from './import.types';

// Admission types
export type { AdmissionFormData, ParentFormData, EntranceTestRecord } from './admission'; 
export const API_URL = import.meta.env.VITE_API_URL || "https://api-dev.wellspring.edu.vn/api";
export const UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL || "https://api-dev.wellspring.edu.vn/uploads";
export const BASE_URL = import.meta.env.VITE_URL || "https://api-dev.wellspring.edu.vn";
export const CDN_URL = import.meta.env.VITE_CDN;

// Các endpoint API
export const API_ENDPOINTS = {
  // User endpoints
  USERS: `${API_URL}/users`,
  USER: (id: string) => `${API_URL}/users/${id}`,
  USER_PASSWORD: (id: string) => `${API_URL}/users/${id}/password`,
  USER_RESET_PASSWORD: (id: string) => `${API_URL}/users/${id}/reset-password`,

  // Auth endpoints
  LOGIN: `${API_URL}/auth/login`,
  MICROSOFT_LOGIN: `${API_URL}/auth/microsoft/login`,
  LOGOUT: `${API_URL}/auth/logout`,
  REFRESH_TOKEN: `${API_URL}/auth/refresh-token`,
  CURRENT_USER: `${API_URL}/users/me`,
  CURRENT_TEACHER: `${API_URL}/auth/me/teacher`,

  // School year endpoints
  SCHOOL_YEARS: `${API_URL}/school-years`,
  SCHOOL_YEAR: (id: string) => `${API_URL}/school-years/${id}`,
  SCHOOL_YEAR_EVENTS: `${API_URL}/school-year-events`,
  SCHOOL_YEAR_EVENT: (id: string) => `${API_URL}/school-year-events/${id}`,
  SCHOOL_YEAR_EVENTS_BY_SCHOOL_YEAR: (schoolYearId: string) => `${API_URL}/school-year-events/school-year/${schoolYearId}`,
  SCHOOL_YEAR_EVENTS_BY_TYPE: (type: string) => `${API_URL}/school-year-events/type/${type}`,
  SCHOOL_YEAR_EVENTS_BY_MONTH: (year: number, month: number) => `${API_URL}/school-year-events/month/${year}/${month}`,
  SCHOOL_YEAR_EVENTS_BY_DATE_RANGE: `${API_URL}/school-year-events/date-range`,
  // Class endpoints
  CLASSES: `${API_URL}/classes`,
  CLASS: (id: string) => `${API_URL}/classes/${id}`,
  // Student endpoints
  STUDENTS: `${API_URL}/students`,
  STUDENT: (id: string) => `${API_URL}/students/${id}`,
  STUDENTS_SEARCH: `${API_URL}/students/search`,
  // Teacher endpoints
  TEACHERS: `${API_URL}/teachers`,
  TEACHER: (id: string) => `${API_URL}/teachers/${id}`,
  // Parent endpoints
  PARENTS: `${API_URL}/parents`,
  PARENT: (id: string) => `${API_URL}/parents/${id}`,
  // Subject endpoints
  SUBJECTS: `${API_URL}/subjects`,
  SUBJECT: (id: string) => `${API_URL}/subjects/${id}`,
  // Curriculum endpoints
  CURRICULUMS: `${API_URL}/curriculums`,
  CURRICULUM: (id: string) => `${API_URL}/curriculums/${id}`,
  CURRICULUM_SUBJECTS: (id: string) => `${API_URL}/curriculums/${id}/subjects`,
  // Educational System endpoints
  EDUCATIONAL_SYSTEMS: `${API_URL}/educational-systems`,
  EDUCATIONAL_SYSTEM: (id: string) => `${API_URL}/educational-systems/${id}`,
  // Grade endpoints
  GRADES: `${API_URL}/grades`,
  GRADE: (id: string) => `${API_URL}/grades/${id}`,
  // Attendance endpoints
  ATTENDANCES: `${API_URL}/attendances`,
  ATTENDANCE: (id: string) => `${API_URL}/attendances/${id}`,
  STUDENTS_BY_CLASS: `${API_URL}/attendances/students-by-class`,
  TIME_ATTENDANCE_BY_DATE: `${API_URL}/attendances/time-attendance-by-date`,
  // Report endpoints
  REPORTS: `${API_URL}/reports`,
  REPORT: (id: string) => `${API_URL}/reports/${id}`,
  // Upload endpoints
  UPLOAD: `${UPLOAD_URL}`,
  UPLOAD_FILE: (filename: string) => `${UPLOAD_URL}/${filename}`,
  AVATAR: (filename: string) => `${UPLOAD_URL}/Avatar/${filename}`,
  // Admission endpoints
  ADMISSIONS: `${API_URL}/admissions`,
  ADMISSION: (id: string) => `${API_URL}/admissions/${id}`,
  ADMISSION_NEXT_STAGE: (id: string) => `${API_URL}/admissions/${id}/nextStage`,
  // Room endpoints
  ROOMS: `${API_URL}/rooms`,
  ROOM: (id: string) => `${API_URL}/rooms/${id}`,
  // Timetable endpoints
  TIMETABLES: `${API_URL}/timetables`,
  TIMETABLE: (id: string) => `${API_URL}/timetables/${id}`,
  TIMETABLES_CLASS_ALL: `${API_URL}/timetables/class/all`,
  TIMETABLES_GRID: (schoolYearId: string, classId: string) =>
    `${API_URL}/timetables/grid/${schoolYearId}/${classId}`,
  TIMETABLES_GENERATE_SCHOOL: (schoolYearId: string, schoolId: string) =>
    `${API_URL}/timetables/generate-school/${schoolYearId}/${schoolId}`,
  TIMETABLES_DRAFT: (schoolYearId: string, classId: string) =>
    `${API_URL}/timetables/draft/${schoolYearId}/${classId}`,
  TEACHER_TIMETABLE: (teacherId: string, schoolYearId: string) => `${API_URL}/timetables/teacher/${teacherId}/${schoolYearId}`,
  TIMETABLES_TEACHERS: `${API_URL}/timetables/teachers`,

  // Timetable Schedule endpoints
  TIMETABLE_SCHEDULES: `${API_URL}/timetable-schedules`,
  TIMETABLE_SCHEDULE: (id: string) => `${API_URL}/timetable-schedules/${id}`,
  TIMETABLE_SCHEDULE_UPLOAD: (id: string) => `${API_URL}/timetable-schedules/${id}/upload`,

  // Period definition endpoints
  PERIOD_DEFINITIONS: (schoolYearId: string) => `${API_URL}/timetables/period-definitions/${schoolYearId}`,
  PERIOD_DEFINITION: (id: string) => `${API_URL}/timetables/period-definitions/${id}`,

  // Grade levels endpoints
  GRADE_LEVELS: `${API_URL}/grade-levels`,
  GRADE_LEVEL: (id: string) => `${API_URL}/grade-levels/${id}`,
  GRADE_LEVELS_BY_SYSTEM: (systemId: string) => `${API_URL}/grade-levels/${systemId}`,

  // Schools endpoints
  SCHOOLS: `${API_URL}/schools`,
  SCHOOL: (id: string) => `${API_URL}/schools/${id}`,

  // User bulk upload endpoint
  USERS_BULK_UPLOAD: `${API_URL}/users/bulk-upload`,

  // Family endpoints
  FAMILIES: `${API_URL}/families`,
  FAMILY: (id: string) => `${API_URL}/families/${id}`,

  // Enrollment endpoints
  ENROLLMENTS: `${API_URL}/enrollments`,
  ENROLLMENT: (id: string) => `${API_URL}/enrollments/${id}`,

  // Recruitment endpoints
  JOBS: `${API_URL}/jobs`,
  JOB: (id: string) => `${API_URL}/jobs/${id}`,
  JOB_TOGGLE_ACTIVE: (id: string) => `${API_URL}/jobs/toggle-active/${id}`,
  APPLICATIONS: `${API_URL}/applications`,
  APPLICATION: (id: string) => `${API_URL}/applications/${id}`,
  APPLICATIONS_BY_JOB: (jobId: string) => `${API_URL}/applications/job/${jobId}`,

  // Hall of Honor endpoints
  AWARD_CATEGORIES: `${API_URL}/award-categories`,
  AWARD_CATEGORY: (id: string) => `${API_URL}/award-categories/${id}`,
  AWARD_RECORDS: `${API_URL}/award-records`,
  AWARD_RECORD: (id: string) => `${API_URL}/award-records/${id}`,

  // Leave Request endpoints
  LEAVE_REQUESTS: `${API_URL}/leave-requests`,
  LEAVE_REQUEST: (id: string) => `${API_URL}/leave-requests/${id}`,
  LEAVE_REQUESTS_BY_PARENT: (parentId: string) => `${API_URL}/leave-requests/parent/${parentId}`,
  LEAVE_REQUESTS_BY_STUDENT: (studentId: string) => `${API_URL}/leave-requests/student/${studentId}`,
} as const; 
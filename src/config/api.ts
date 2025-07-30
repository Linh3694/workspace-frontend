// Legacy API URLs (old backend)
export const API_URL = import.meta.env.VITE_API_URL || "https://api-dev.wellspring.edu.vn/api";
export const UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL || "https://api-dev.wellspring.edu.vn/uploads";
export const BASE_URL = import.meta.env.VITE_URL || "https://api-dev.wellspring.edu.vn";
export const CDN_URL = import.meta.env.VITE_CDN;

// Frappe API URLs (new backend)
export const FRAPPE_API_URL = import.meta.env.VITE_FRAPPE_API_URL || "http://localhost:8000";
export const FRAPPE_UPLOAD_URL = import.meta.env.VITE_FRAPPE_UPLOAD_URL || "http://localhost:8000/files";

// Flag to switch between old and new backend
export const USE_FRAPPE_API = import.meta.env.VITE_USE_FRAPPE_API === 'true' || false;

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
  PARENTS_WITH_ACCOUNT: `${API_URL}/parents/with-account`,
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
  TIMETABLES_IMPORT: `${API_URL}/timetables/import`,

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
  AWARD_CATEGORY_UPLOAD: `${API_URL}/award-categories/upload`,
  AWARD_RECORDS: `${API_URL}/award-records`,
  AWARD_RECORD: (id: string) => `${API_URL}/award-records/${id}`,

  // Legacy Inventory endpoints (old backend)
  LAPTOPS: `${API_URL}/laptops`,
  LAPTOP: (id: string) => `${API_URL}/laptops/${id}`,
  LAPTOPS_FILTER_OPTIONS: `${API_URL}/laptops/filter-options`,
  MONITORS: `${API_URL}/monitors`,
  MONITOR: (id: string) => `${API_URL}/monitors/${id}`,
  MONITORS_FILTER_OPTIONS: `${API_URL}/monitors/filter-options`,
  PRINTERS: `${API_URL}/printers`,
  PRINTER: (id: string) => `${API_URL}/printers/${id}`,
  PRINTERS_FILTER_OPTIONS: `${API_URL}/printers/filter-options`,
  PROJECTORS: `${API_URL}/projectors`,
  PROJECTOR: (id: string) => `${API_URL}/projectors/${id}`,
  PROJECTORS_FILTER_OPTIONS: `${API_URL}/projectors/filter-options`,
  PHONES: `${API_URL}/phones`,
  PHONE: (id: string) => `${API_URL}/phones/${id}`,
  PHONES_FILTER_OPTIONS: `${API_URL}/phones/filter-options`,
  TOOLS: `${API_URL}/tools`,
  TOOL: (id: string) => `${API_URL}/tools/${id}`,
  TOOLS_FILTER_OPTIONS: `${API_URL}/tools/filter-options`,

  // Leave Request endpoints
  LEAVE_REQUESTS: `${API_URL}/leave-requests`,
  LEAVE_REQUEST: (id: string) => `${API_URL}/leave-requests/${id}`,
  LEAVE_REQUESTS_BY_PARENT: (parentId: string) => `${API_URL}/leave-requests/parent/${parentId}`,
  LEAVE_REQUESTS_BY_STUDENT: (studentId: string) => `${API_URL}/leave-requests/student/${studentId}`,
} as const;

// Frappe API endpoints (new backend)
export const FRAPPE_API_ENDPOINTS = {
  // Base method endpoint
  METHOD: (method: string) => `${FRAPPE_API_URL}/api/method/${method}`,
  
  // Device endpoints
  DEVICES: {
    LIST: 'erp.inventory.api.device.get_devices',
    GET: 'erp.inventory.api.device.get_device',
    CREATE: 'erp.inventory.api.device.create_device',
    UPDATE: 'erp.inventory.api.device.update_device',
    DELETE: 'erp.inventory.api.device.delete_device',
    ASSIGN: 'erp.inventory.api.device.assign_device',
    REVOKE: 'erp.inventory.api.device.revoke_device',
    UPDATE_STATUS: 'erp.inventory.api.device.update_device_status',
    FILTER_OPTIONS: 'erp.inventory.api.device.get_device_filter_options',
    BULK_UPLOAD: 'erp.inventory.api.device.bulk_upload_devices',
    STATS: 'erp.inventory.api.device.get_device_stats'
  },
  
  // Laptop endpoints
  LAPTOPS: {
    LIST: 'erp.inventory.api.laptop.get_laptops',
    GET: 'erp.inventory.api.laptop.get_laptop_by_id',
    CREATE: 'erp.inventory.api.laptop.create_laptop',
    UPDATE: 'erp.inventory.api.laptop.update_laptop',
    DELETE: 'erp.inventory.api.laptop.delete_laptop',
    ASSIGN: 'erp.inventory.api.laptop.assign_laptop',
    REVOKE: 'erp.inventory.api.laptop.revoke_laptop',
    UPDATE_STATUS: 'erp.inventory.api.laptop.update_laptop_status',
    UPDATE_SPECS: 'erp.inventory.api.laptop.update_laptop_specs',
    FILTER_OPTIONS: 'erp.inventory.api.laptop.get_laptop_filter_options',
    BULK_UPLOAD: 'erp.inventory.api.laptop.bulk_upload_laptops'
  },
  
  // Monitor endpoints
  MONITORS: {
    LIST: 'erp.inventory.api.monitor.get_monitors',
    CREATE: 'erp.inventory.api.monitor.create_monitor',
    UPDATE: 'erp.inventory.api.monitor.update_monitor',
    DELETE: 'erp.inventory.api.monitor.delete_monitor',
    ASSIGN: 'erp.inventory.api.monitor.assign_monitor',
    REVOKE: 'erp.inventory.api.monitor.revoke_monitor'
  },
  
  // Phone endpoints
  PHONES: {
    LIST: 'erp.inventory.api.phone.get_phones',
    CREATE: 'erp.inventory.api.phone.create_phone',
    UPDATE: 'erp.inventory.api.phone.update_phone',
    DELETE: 'erp.inventory.api.phone.delete_phone',
    ASSIGN: 'erp.inventory.api.phone.assign_phone',
    REVOKE: 'erp.inventory.api.phone.revoke_phone'
  },
  
  // Printer endpoints
  PRINTERS: {
    LIST: 'erp.inventory.api.printer.get_printers',
    CREATE: 'erp.inventory.api.printer.create_printer',
    UPDATE: 'erp.inventory.api.printer.update_printer',
    DELETE: 'erp.inventory.api.printer.delete_printer',
    ASSIGN: 'erp.inventory.api.printer.assign_printer',
    REVOKE: 'erp.inventory.api.printer.revoke_printer'
  },
  
  // Projector endpoints
  PROJECTORS: {
    LIST: 'erp.inventory.api.projector.get_projectors',
    CREATE: 'erp.inventory.api.projector.create_projector',
    UPDATE: 'erp.inventory.api.projector.update_projector',
    DELETE: 'erp.inventory.api.projector.delete_projector',
    ASSIGN: 'erp.inventory.api.projector.assign_projector',
    REVOKE: 'erp.inventory.api.projector.revoke_projector'
  },
  
  // Tool endpoints
  TOOLS: {
    LIST: 'erp.inventory.api.tool.get_tools',
    CREATE: 'erp.inventory.api.tool.create_tool',
    UPDATE: 'erp.inventory.api.tool.update_tool',
    DELETE: 'erp.inventory.api.tool.delete_tool',
    ASSIGN: 'erp.inventory.api.tool.assign_tool',
    REVOKE: 'erp.inventory.api.tool.revoke_tool'
  },
  
  // Activity endpoints
  ACTIVITIES: {
    LIST: 'erp.inventory.api.activity.get_activities',
    CREATE: 'erp.inventory.api.activity.add_activity',
    UPDATE: 'erp.inventory.api.activity.update_activity',
    DELETE: 'erp.inventory.api.activity.delete_activity',
    STATS: 'erp.inventory.api.activity.get_activity_stats',
    ENTITY_SUMMARY: 'erp.inventory.api.activity.get_entity_activity_summary'
  },
  
  // Inspection endpoints
  INSPECTIONS: {
    LIST: 'erp.inventory.api.inspect.get_inspections',
    GET: 'erp.inventory.api.inspect.get_inspection',
    CREATE: 'erp.inventory.api.inspect.create_inspection',
    UPDATE: 'erp.inventory.api.inspect.update_inspection',
    DELETE: 'erp.inventory.api.inspect.delete_inspection',
    DEVICE_HISTORY: 'erp.inventory.api.inspect.get_device_inspections',
    LATEST: 'erp.inventory.api.inspect.get_latest_inspection',
    UPLOAD_REPORT: 'erp.inventory.api.inspect.upload_inspection_report',
    GET_REPORT: 'erp.inventory.api.inspect.get_inspection_report',
    STATS: 'erp.inventory.api.inspect.get_inspection_stats',
    DASHBOARD: 'erp.inventory.api.inspect.get_inspection_dashboard'
  },
  
  // File upload
  UPLOAD_FILE: 'upload_file'
} as const; 
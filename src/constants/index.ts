// Application constants
export const APP_CONFIG = {
  name: 'Wellspring Inventory System',
  version: '2.0.0',
  description: 'Hệ thống quản lý thiết bị IT',
} as const;

// Device types
export const DEVICE_TYPES = {
  LAPTOP: 'laptop',
  MONITOR: 'monitor',
  PRINTER: 'printer',
  PROJECTOR: 'projector',
  PHONE: 'phone',
  TOOL: 'tool',
} as const;

export const DEVICE_TYPE_LABELS = {
  [DEVICE_TYPES.LAPTOP]: 'Laptop',
  [DEVICE_TYPES.MONITOR]: 'Monitor',
  [DEVICE_TYPES.PRINTER]: 'Printer',
  [DEVICE_TYPES.PROJECTOR]: 'Projector',
  [DEVICE_TYPES.PHONE]: 'Điện thoại',
  [DEVICE_TYPES.TOOL]: 'Công cụ',
} as const;

// Device status
export const DEVICE_STATUS = {
  ACTIVE: 'active',
  STANDBY: 'standby',
  BROKEN: 'broken',
  PENDING_DOCUMENTATION: 'pendingdocumentation',
} as const;

export const DEVICE_STATUS_LABELS = {
  [DEVICE_STATUS.ACTIVE]: 'Đang sử dụng',
  [DEVICE_STATUS.STANDBY]: 'Chờ cấp phát',
  [DEVICE_STATUS.BROKEN]: 'Hỏng',
  [DEVICE_STATUS.PENDING_DOCUMENTATION]: 'Chờ tài liệu',
} as const;

export const DEVICE_STATUS_COLORS = {
  [DEVICE_STATUS.ACTIVE]: 'green',
  [DEVICE_STATUS.STANDBY]: 'blue',
  [DEVICE_STATUS.BROKEN]: 'red',
  [DEVICE_STATUS.PENDING_DOCUMENTATION]: 'orange',
} as const;

// Activity types
export const ACTIVITY_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  ASSIGN: 'assign',
  REVOKE: 'revoke',
  REPAIR: 'repair',
} as const;

export const ACTIVITY_TYPE_LABELS = {
  [ACTIVITY_TYPES.CREATE]: 'Tạo mới',
  [ACTIVITY_TYPES.UPDATE]: 'Cập nhật',
  [ACTIVITY_TYPES.DELETE]: 'Xóa',
  [ACTIVITY_TYPES.ASSIGN]: 'Bàn giao',
  [ACTIVITY_TYPES.REVOKE]: 'Thu hồi',
  [ACTIVITY_TYPES.REPAIR]: 'Sửa chữa',
} as const;

// Inspection status
export const INSPECTION_STATUS = {
  GOOD: 'tốt',
  AVERAGE: 'trung bình',
  POOR: 'kém',
  NORMAL: 'bình thường',
} as const;

export const INSPECTION_STATUS_LABELS = {
  [INSPECTION_STATUS.GOOD]: 'Tốt',
  [INSPECTION_STATUS.AVERAGE]: 'Trung bình',
  [INSPECTION_STATUS.POOR]: 'Kém',  
  [INSPECTION_STATUS.NORMAL]: 'Bình thường',
} as const;

export const INSPECTION_STATUS_COLORS = {
  [INSPECTION_STATUS.GOOD]: 'green',
  [INSPECTION_STATUS.AVERAGE]: 'orange',
  [INSPECTION_STATUS.POOR]: 'red',
  [INSPECTION_STATUS.NORMAL]: 'blue',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  FRAPPE_TOKEN: 'frappe_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// API timeouts
export const API_TIMEOUTS = {
  DEFAULT: 10000, // 10 seconds
  UPLOAD: 30000,  // 30 seconds
  LONG_RUNNING: 60000, // 1 minute
} as const;

// File upload
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  ALLOWED_TYPES: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
  CHUNK_SIZE: 1024 * 1024, // 1MB
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  INVENTORY: '/inventory',
  LAPTOPS: '/inventory/laptops',
  MONITORS: '/inventory/monitors',
  PRINTERS: '/inventory/printers',
  PROJECTORS: '/inventory/projectors',
  PHONES: '/inventory/phones',
  TOOLS: '/inventory/tools',
  ACTIVITIES: '/activities',
  INSPECTIONS: '/inspections',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  LOGIN: '/login',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối.',
  AUTH_ERROR: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  PERMISSION_ERROR: 'Bạn không có quyền thực hiện thao tác này.',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ.',
  UNKNOWN_ERROR: 'Đã xảy ra lỗi không xác định.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  DEVICE_CREATED: 'Thiết bị đã được tạo thành công',
  DEVICE_UPDATED: 'Thiết bị đã được cập nhật thành công',
  DEVICE_DELETED: 'Thiết bị đã được xóa thành công',
  DEVICE_ASSIGNED: 'Thiết bị đã được bàn giao thành công',
  DEVICE_REVOKED: 'Thiết bị đã được thu hồi thành công',
  INSPECTION_CREATED: 'Báo cáo kiểm tra đã được tạo thành công',
  FILE_UPLOADED: 'File đã được tải lên thành công',
} as const;
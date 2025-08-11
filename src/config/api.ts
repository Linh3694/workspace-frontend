// Frappe API URLs
export const FRAPPE_API_URL = import.meta.env.VITE_FRAPPE_API_URL || "https://admin.sis.wellspring.edu.vn";
export const FRAPPE_UPLOAD_URL = import.meta.env.VITE_FRAPPE_UPLOAD_URL || "https://admin.sis.wellspring.edu.vn/files";

// Base URLs for compatibility
export const BASE_URL = FRAPPE_API_URL;
export const UPLOAD_URL = FRAPPE_UPLOAD_URL;
export const CDN_URL = import.meta.env.VITE_CDN;

// Legacy API URLs - temporary compatibility (to be removed when all files are updated)
export const API_URL = FRAPPE_API_URL;

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  // Base method endpoint
  METHOD: (method: string) => `${FRAPPE_API_URL}/api/method/${method}`,
  
  // Auth methods
  LOGIN: 'erp.api.erp_common_user.auth.login',
  MICROSOFT_LOGIN: 'erp.api.erp_common_user.microsoft_auth.microsoft_callback',
  MICROSOFT_REDIRECT: 'erp.api.erp_common_user.microsoft_auth.microsoft_login_redirect',
  LOGOUT: 'erp.api.erp_common_user.auth.logout',
  REFRESH_TOKEN: 'erp.api.erp_common_user.auth.refresh_token',
  CURRENT_USER: 'erp.api.erp_common_user.auth.get_current_user',
  RESET_PASSWORD: 'erp.api.erp_common_user.auth.reset_password',
  CHANGE_PASSWORD: 'erp.api.erp_common_user.auth.change_password',
  UPDATE_PROFILE: 'erp.api.erp_common_user.auth.update_profile',

  // Upload endpoints
  UPLOAD: `${FRAPPE_UPLOAD_URL}`,
  UPLOAD_FILE: (filename: string) => `${FRAPPE_UPLOAD_URL}/${filename}`,
  AVATAR: (filename: string) => `${FRAPPE_UPLOAD_URL}/Avatar/${filename}`,
} as const;

// Frappe API endpoints for inventory and other modules
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

// User Management endpoints for Frappe
export const USER_MANAGEMENT_ENDPOINTS = {
  // Base method endpoint
  METHOD: (method: string) => `${FRAPPE_API_URL}/api/method/${method}`,
  
  // User management methods
  USERS: 'erp.api.erp_common_user.user_management.get_users',
  USER_BY_ID: 'erp.api.erp_common_user.user_management.get_user_by_id', 
  CREATE_USER: 'erp.api.erp_common_user.user_management.create_user',
  UPDATE_USER: 'erp.api.erp_common_user.user_management.update_user',
  DELETE_USER: 'erp.api.erp_common_user.user_management.delete_user',
  ENABLE_DISABLE_USER: 'erp.api.erp_common_user.user_management.enable_disable_user',
  RESET_PASSWORD: 'erp.api.erp_common_user.user_management.reset_user_password',
  USER_ROLES: 'erp.api.erp_common_user.user_management.get_user_roles',
  USER_STATS: 'erp.api.erp_common_user.user_management.get_user_dashboard_stats',
  
  // Frappe built-in methods
  ALL_ROLES: 'frappe.core.doctype.user.user.get_all_roles',
  
  // Batch operations
  BATCH_CREATE_USERS: 'erp.api.erp_common_user.user_management.batch_create_users',
} as const;

// Legacy API endpoints - keeping for backward compatibility
export const API_ENDPOINTS = AUTH_ENDPOINTS; 

// Ticket-service API (via same domain, path-based per Nginx)
export const TICKETS_API_URL = `${FRAPPE_API_URL}/api/tickets`;
// Backward alias
export const TICKET_API_URL = TICKETS_API_URL;
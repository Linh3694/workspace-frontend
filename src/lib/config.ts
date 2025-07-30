// Compatibility wrapper - re-export everything from new config structure
// This file exists to maintain backward compatibility during migration

export * from '../config/api';

// Legacy exports for backward compatibility
export { 
  API_URL as LEGACY_API_URL,
  UPLOAD_URL as LEGACY_UPLOAD_URL,
  BASE_URL as LEGACY_BASE_URL,
  CDN_URL as LEGACY_CDN_URL,
  FRAPPE_API_URL,
  FRAPPE_UPLOAD_URL,
  USE_FRAPPE_API,
  API_ENDPOINTS,
  FRAPPE_API_ENDPOINTS
} from '../config/api';
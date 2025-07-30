// Export base API service
export { frappeApi, FrappeApiService } from './base';
export type { ApiResponse, PaginationInfo, FrappeResponse } from './base';

// Export inventory API service
export { inventoryApi } from './inventory';
export type { 
  DeviceListParams, 
  DeviceListResponse, 
  DeviceResponse, 
  AssignRevokeRequest, 
  UpdateStatusRequest,
  FilterOptions,
  DeviceStats
} from './inventory';

// Export activity API service
export { activityApi } from './activity';
export type {
  Activity,
  ActivityListParams,
  ActivityListResponse,
  CreateActivityRequest,
  UpdateActivityRequest,
  ActivityStatsParams,
  ActivityStats,
  EntityActivitySummary,
  ActivityResponse
} from './activity';

// Export inspect API service
export { inspectApi } from './inspect';
export type {
  Inspection,
  InspectionListParams,
  InspectionListResponse,
  CreateInspectionRequest,
  InspectionResponse,
  InspectionStats,
  InspectionDashboard,
  InspectionReportData
} from './inspect';

// Convenience re-exports for backward compatibility
export const api = {
  inventory: inventoryApi,
  activity: activityApi,
  inspect: inspectApi
};

// Helper functions for common operations
export const apiHelpers = {
  // Format device type for display
  formatDeviceType: (type: string): string => {
    const typeMap: Record<string, string> = {
      'laptop': 'Laptop',
      'desktop': 'Desktop',
      'monitor': 'Monitor', 
      'phone': 'Phone',
      'printer': 'Printer',
      'projector': 'Projector',
      'tool': 'Tool'
    };
    return typeMap[type.toLowerCase()] || type;
  },

  // Format status for display  
  formatStatus: (status: string): string => {
    const statusMap: Record<string, string> = {
      'active': 'Đang sử dụng',
      'standby': 'Chờ cấp phát',
      'broken': 'Hỏng',
      'pendingdocumentation': 'Chờ tài liệu'
    };
    return statusMap[status.toLowerCase()] || status;
  },

  // Format activity type for display
  formatActivityType: (type: string): string => {
    const typeMap: Record<string, string> = {
      'repair': 'Sửa chữa',
      'update': 'Cập nhật',
      'assign': 'Bàn giao',
      'revoke': 'Thu hồi',
      'create': 'Tạo mới',
      'delete': 'Xóa'
    };
    return typeMap[type.toLowerCase()] || type;
  },

  // Format condition for display
  formatCondition: (condition: string): string => {
    const conditionMap: Record<string, string> = {
      'tốt': 'Tốt',
      'bình thường': 'Bình thường', 
      'kém': 'Kém',
      'trung bình': 'Trung bình'
    };
    return conditionMap[condition.toLowerCase()] || condition;
  },

  // Validate required fields for device creation
  validateDeviceData: (data: any): string[] => {
    const errors: string[] = [];
    
    if (!data.device_name?.trim()) {
      errors.push('Tên thiết bị là bắt buộc');
    }
    
    if (!data.serial_number?.trim()) {
      errors.push('Số serial là bắt buộc');
    }
    
    if (!data.device_type?.trim()) {
      errors.push('Loại thiết bị là bắt buộc');
    }
    
    return errors;
  },

  // Parse pagination info
  parsePagination: (data: any) => {
    if (!data.pagination) {
      return {
        current_page: 1,
        total_pages: 1,
        total_items: Array.isArray(data) ? data.length : 0,
        items_per_page: Array.isArray(data) ? data.length : 0,
        has_next: false,
        has_prev: false
      };
    }
    return data.pagination;
  },

  // Handle API errors consistently
  handleApiError: (error: any): string => {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error.message) {
      return error.message;
    }
    
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    return 'Đã xảy ra lỗi không xác định';
  }
};
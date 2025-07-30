import { ERROR_MESSAGES } from '../constants';

/**
 * API utility functions
 */

/**
 * Handle API errors consistently
 */
export const handleApiError = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.data?.exc) {
    return error.response.data.exc;
  }

  if (error.response?.status) {
    switch (error.response.status) {
      case 400:
        return 'Dữ liệu không hợp lệ';
      case 401:
        return ERROR_MESSAGES.AUTH_ERROR;
      case 403:
        return ERROR_MESSAGES.PERMISSION_ERROR;
      case 404:
        return 'Không tìm thấy dữ liệu';
      case 422:
        return ERROR_MESSAGES.VALIDATION_ERROR;
      case 500:
        return 'Lỗi server nội bộ';
      case 502:
      case 503:
      case 504:
        return 'Server không khả dụng, vui lòng thử lại sau';
      default:
        return `HTTP Error: ${error.response.status}`;
    }
  }
  
  if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Parse pagination info from API response
 */
export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export const parsePagination = (data: any): PaginationInfo => {
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
};

/**
 * Build query string from parameters
 */
export const buildQueryString = (params: Record<string, any>): string => {
  const filteredParams = Object.entries(params)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => [key, String(value)]);
  
  if (filteredParams.length === 0) {
    return '';
  }
  
  const searchParams = new URLSearchParams(filteredParams);
  return `?${searchParams.toString()}`;
};

/**
 * Parse query string to object
 */
export const parseQueryString = (queryString: string): Record<string, string> => {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  
  for (const [key, value] of params) {
    result[key] = value;
  }
  
  return result;
};

/**
 * Create request headers
 */
export const createHeaders = (options: {
  contentType?: string;
  authToken?: string;
  additionalHeaders?: Record<string, string>;
} = {}): Headers => {
  const headers = new Headers();
  
  // Default content type
  if (options.contentType !== false) {
    headers.set('Content-Type', options.contentType || 'application/json');
  }
  
  // Accept header
  headers.set('Accept', 'application/json');
  
  // Auth token
  if (options.authToken) {
    headers.set('Authorization', `token ${options.authToken}`);
  }
  
  // Additional headers
  if (options.additionalHeaders) {
    Object.entries(options.additionalHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }
  
  return headers;
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Check if response is successful
 */
export const isSuccessResponse = (response: any): boolean => {
  if (response.status === 'success') {
    return true;
  }
  
  if (response.ok !== undefined) {
    return response.ok;
  }
  
  if (response.status >= 200 && response.status < 300) {
    return true;
  }
  
  return false;
};

/**
 * Transform API response to standard format
 */
export const transformApiResponse = <T>(response: any): {
  data: T;
  success: boolean;
  message?: string;
  pagination?: PaginationInfo;
} => {
  return {
    data: response.data || response.message || response,
    success: isSuccessResponse(response),
    message: response.message,
    pagination: response.pagination ? parsePagination(response) : undefined
  };
};

/**
 * Create abort controller with timeout
 */
export const createAbortController = (timeoutMs?: number): AbortController => {
  const controller = new AbortController();
  
  if (timeoutMs) {
    setTimeout(() => controller.abort(), timeoutMs);
  }
  
  return controller;
};

/**
 * Format error message for display
 */
export const formatErrorMessage = (error: any): string => {
  const message = handleApiError(error);
  
  // Remove technical details for end users
  return message
    .replace(/^Error:\s*/, '')
    .replace(/\s*\[.*\]$/, '')
    .trim();
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: any): boolean => {
  if (error.code === 'NETWORK_ERROR') {
    return true;
  }
  
  if (error.response?.status) {
    const status = error.response.status;
    return status === 408 || status === 429 || (status >= 500 && status < 600);
  }
  
  return false;
};

/**
 * Create request timeout
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Request timeout'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    })
  ]);
};
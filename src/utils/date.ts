/**
 * Date utility functions
 */

/**
 * Format date to Vietnamese locale
 */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  };

  return dateObj.toLocaleDateString('vi-VN', defaultOptions);
};

/**
 * Format datetime to Vietnamese locale
 */
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format time only
 */
export const formatTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get relative time (e.g., "2 giờ trước")
 */
export const getRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'vừa xong';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} tuần trước`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} tháng trước`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} năm trước`;
};

/**
 * Check if date is today
 */
export const isToday = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return dateObj.toDateString() === today.toDateString();
};

/**
 * Check if date is yesterday
 */
export const isYesterday = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return dateObj.toDateString() === yesterday.toDateString();
};

/**
 * Check if date is this week
 */
export const isThisWeek = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return dateObj >= startOfWeek && dateObj <= endOfWeek;
};

/**
 * Get start of day
 */
export const getStartOfDay = (date: string | Date): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
};

/**
 * Get end of day
 */
export const getEndOfDay = (date: string | Date): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
};

/**
 * Add days to date
 */
export const addDays = (date: string | Date, days: number): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
};

/**
 * Subtract days from date
 */
export const subtractDays = (date: string | Date, days: number): Date => {
  return addDays(date, -days);
};

/**
 * Get date range for filters
 */
export const getDateRange = (period: 'today' | 'yesterday' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'custom', customStart?: Date, customEnd?: Date): { start: Date; end: Date } => {
  const today = new Date();
  let start: Date;
  let end: Date;

  switch (period) {
    case 'today':
      start = getStartOfDay(today);
      end = getEndOfDay(today);
      break;
      
    case 'yesterday':
      start = getStartOfDay(subtractDays(today, 1));
      end = getEndOfDay(subtractDays(today, 1));
      break;
      
    case 'this-week':
      start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      start = getStartOfDay(start);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end = getEndOfDay(end);
      break;
      
    case 'last-week':
      start = new Date(today);
      start.setDate(today.getDate() - today.getDay() - 7);
      start = getStartOfDay(start);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end = getEndOfDay(end);
      break;
      
    case 'this-month':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      start = getStartOfDay(start);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end = getEndOfDay(end);
      break;
      
    case 'last-month':
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      start = getStartOfDay(start);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
      end = getEndOfDay(end);
      break;
      
    case 'custom':
      start = customStart ? getStartOfDay(customStart) : getStartOfDay(today);
      end = customEnd ? getEndOfDay(customEnd) : getEndOfDay(today);
      break;
      
    default:
      start = getStartOfDay(today);
      end = getEndOfDay(today);
  }

  return { start, end };
};

/**
 * Format date for API (ISO string)
 */
export const formatDateForAPI = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString();
};

/**
 * Parse date from API response
 */
export const parseDateFromAPI = (dateString: string): Date => {
  return new Date(dateString);
};
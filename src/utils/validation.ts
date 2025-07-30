import { FILE_UPLOAD } from '../constants';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Vietnamese phone number
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+84|84|0)(3|5|7|8|9)([0-9]{8})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate serial number format
 */
export const validateSerialNumber = (serial: string): boolean => {
  // Serial number should be at least 3 characters, alphanumeric with dashes/underscores
  const serialRegex = /^[A-Za-z0-9_-]{3,}$/;
  return serialRegex.test(serial);
};

/**
 * Validate device data
 */
export const validateDeviceData = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Required fields
  if (!data.device_name?.trim()) {
    errors.push('Tên thiết bị là bắt buộc');
  }

  if (!data.serial_number?.trim()) {
    errors.push('Số serial là bắt buộc');
  } else if (!validateSerialNumber(data.serial_number)) {
    errors.push('Số serial không hợp lệ (ít nhất 3 ký tự, chỉ chứa chữ, số, dấu gạch ngang và gạch dưới)');
  }

  if (!data.device_type?.trim()) {
    errors.push('Loại thiết bị là bắt buộc');
  }

  if (!data.manufacturer?.trim()) {
    errors.push('Nhà sản xuất là bắt buộc');
  }

  // Optional validations
  if (data.release_year && (data.release_year < 1990 || data.release_year > new Date().getFullYear() + 1)) {
    errors.push('Năm sản xuất không hợp lệ');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate inspection data
 */
export const validateInspectionData = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.device_id?.trim()) {
    errors.push('ID thiết bị là bắt buộc');
  }

  if (!data.inspector_id?.trim()) {
    errors.push('Người kiểm tra là bắt buộc');
  }

  if (!data.overall_assessment?.trim()) {
    errors.push('Đánh giá tổng quan là bắt buộc');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate activity data
 */
export const validateActivityData = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.entity_type?.trim()) {
    errors.push('Loại thực thể là bắt buộc');
  }

  if (!data.entity_id?.trim()) {
    errors.push('ID thực thể là bắt buộc');
  }

  if (!data.activity_type?.trim()) {
    errors.push('Loại hoạt động là bắt buộc');
  }

  if (!data.description?.trim()) {
    errors.push('Mô tả hoạt động là bắt buộc');
  }

  return {
    isValid:errors.length === 0,
    errors
  };
};

/**
 * Validate file upload
 */
export const validateFileUpload = (file: File): ValidationResult => {
  const errors: string[] = [];

  // Check file size
  const maxSizeBytes = FILE_UPLOAD.MAX_SIZE_MB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    errors.push(`Kích thước file không được vượt quá ${FILE_UPLOAD.MAX_SIZE_MB}MB`);
  }

  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (fileExtension && !FILE_UPLOAD.ALLOWED_TYPES.includes(fileExtension)) {
    errors.push(`Loại file không được hỗ trợ. Chỉ chấp nhận: ${FILE_UPLOAD.ALLOWED_TYPES.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate assignment data
 */
export const validateAssignmentData = (data: any): ValidationResult => {
  const errors: string[] = [];

  if (!data.device_id?.trim()) {
    errors.push('ID thiết bị là bắt buộc');
  }

  if (!data.user_id?.trim()) {
    errors.push('ID người dùng là bắt buộc');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ cái viết hoa');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ cái viết thường');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ số');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 ký tự đặc biệt');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate required fields
 */
export const validateRequired = (fields: Record<string, any>): ValidationResult => {
  const errors: string[] = [];

  Object.entries(fields).forEach(([fieldName, value]) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      errors.push(`${fieldName} là bắt buộc`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Clean and validate form data
 */
export const cleanFormData = (data: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      cleaned[key] = value.trim();
    } else {
      cleaned[key] = value;
    }
  });

  return cleaned;
};
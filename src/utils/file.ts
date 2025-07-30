import { FILE_UPLOAD } from '../constants';

/**
 * File utility functions
 */

/**
 * Get file extension
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Get file name without extension
 */
export const getFileNameWithoutExtension = (filename: string): string => {
  return filename.replace(/\.[^/.]+$/, '');
};

/**
 * Check if file type is allowed
 */
export const isFileTypeAllowed = (filename: string): boolean => {
  const extension = getFileExtension(filename);
  return FILE_UPLOAD.ALLOWED_TYPES.includes(extension);
};

/**
 * Check if file size is within limit
 */
export const isFileSizeAllowed = (fileSize: number): boolean => {
  const maxSizeBytes = FILE_UPLOAD.MAX_SIZE_MB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get MIME type from file extension
 */
export const getMimeType = (filename: string): string => {
  const extension = getFileExtension(filename);
  
  const mimeTypes: Record<string, string> = {
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    
    // Text
    'txt': 'text/plain',
    'csv': 'text/csv',
    
    // Archive
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};

/**
 * Check if file is an image
 */
export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
  const extension = getFileExtension(filename);
  return imageExtensions.includes(extension);
};

/**
 * Check if file is a document
 */
export const isDocumentFile = (filename: string): boolean => {
  const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
  const extension = getFileExtension(filename);
  return documentExtensions.includes(extension);
};

/**
 * Generate unique filename
 */
export const generateUniqueFilename = (originalFilename: string): string => {
  const extension = getFileExtension(originalFilename);
  const nameWithoutExtension = getFileNameWithoutExtension(originalFilename);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  return `${nameWithoutExtension}_${timestamp}_${random}.${extension}`;
};

/**
 * Convert file to base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Convert base64 to file
 */
export const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || '';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};

/**
 * Download file from URL
 */
export const downloadFile = (url: string, filename?: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download file from blob
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  downloadFile(url, filename);
  URL.revokeObjectURL(url);
};

/**
 * Read file as text
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Validate file before upload
 */
export const validateFile = (file: File): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!isFileTypeAllowed(file.name)) {
    errors.push(`Loại file không được hỗ trợ. Chỉ chấp nhận: ${FILE_UPLOAD.ALLOWED_TYPES.join(', ')}`);
  }
  
  if (!isFileSizeAllowed(file.size)) {
    errors.push(`Kích thước file không được vượt quá ${FILE_UPLOAD.MAX_SIZE_MB}MB`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Create file input element
 */
export const createFileInput = (options: {
  accept?: string;
  multiple?: boolean;
  onSelect: (files: FileList) => void;
}): HTMLInputElement => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = options.accept || FILE_UPLOAD.ALLOWED_TYPES.map(ext => `.${ext}`).join(',');
  input.multiple = options.multiple || false;
  input.style.display = 'none';
  
  input.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      options.onSelect(target.files);
    }
  });
  
  return input;
};

/**
 * Open file picker
 */
export const openFilePicker = (options: {
  accept?: string;
  multiple?: boolean;
}): Promise<FileList> => {
  return new Promise((resolve, reject) => {
    const input = createFileInput({
      ...options,
      onSelect: (files) => {
        resolve(files);
        document.body.removeChild(input);
      }
    });
    
    document.body.appendChild(input);
    input.click();
    
    // Cleanup if user cancels
    setTimeout(() => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
        reject(new Error('File selection cancelled'));
      }
    }, 60000); // 1 minute timeout
  });
};
import { STORAGE_KEYS } from '../constants';

/**
 * Local storage utility functions
 */

/**
 * Get item from localStorage
 */
export const getStorageItem = <T = string>(key: string, defaultValue?: T): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue || null;
    }
    
    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(item);
    } catch {
      return item as unknown as T;
    }
  } catch (error) {
    console.warn(`Error reading from localStorage key "${key}":`, error);
    return defaultValue || null;
  }
};

/**
 * Set item in localStorage
 */
export const setStorageItem = <T>(key: string, value: T): boolean => {
  try {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.warn(`Error writing to localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Remove item from localStorage
 */
export const removeStorageItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing from localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Clear all items from localStorage
 */
export const clearStorage = (): boolean => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.warn('Error clearing localStorage:', error);
    return false;
  }
};

/**
 * Check if localStorage is available
 */
export const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get auth token
 */
export const getAuthToken = (): string | null => {
  return getStorageItem(STORAGE_KEYS.FRAPPE_TOKEN) || getStorageItem(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Set auth token
 */
export const setAuthToken = (token: string): boolean => {
  return setStorageItem(STORAGE_KEYS.FRAPPE_TOKEN, token);
};

/**
 * Remove auth token
 */
export const removeAuthToken = (): boolean => {
  removeStorageItem(STORAGE_KEYS.FRAPPE_TOKEN);
  removeStorageItem(STORAGE_KEYS.AUTH_TOKEN);
  return true;
};

/**
 * Get user preferences
 */
export const getUserPreferences = (): Record<string, any> => {
  return getStorageItem(STORAGE_KEYS.USER_PREFERENCES, {});
};

/**
 * Set user preferences
 */
export const setUserPreferences = (preferences: Record<string, any>): boolean => {
  const currentPreferences = getUserPreferences();
  const updatedPreferences = { ...currentPreferences, ...preferences };
  return setStorageItem(STORAGE_KEYS.USER_PREFERENCES, updatedPreferences);
};

/**
 * Get user preference
 */
export const getUserPreference = <T>(key: string, defaultValue?: T): T => {
  const preferences = getUserPreferences();
  return preferences[key] !== undefined ? preferences[key] : defaultValue;
};

/**
 * Set user preference
 */
export const setUserPreference = (key: string, value: any): boolean => {
  return setUserPreferences({ [key]: value });
};

/**
 * Get theme
 */
export const getTheme = (): 'light' | 'dark' | 'system' => {
  return getStorageItem(STORAGE_KEYS.THEME, 'system');
};

/**
 * Set theme
 */
export const setTheme = (theme: 'light' | 'dark' | 'system'): boolean => {
  return setStorageItem(STORAGE_KEYS.THEME, theme);
};

/**
 * Get language
 */
export const getLanguage = (): string => {
  return getStorageItem(STORAGE_KEYS.LANGUAGE, 'vi');
};

/**
 * Set language
 */
export const setLanguage = (language: string): boolean => {
  return setStorageItem(STORAGE_KEYS.LANGUAGE, language);
};

/**
 * Session storage utilities
 */
export const sessionStorage = {
  getItem: <T = string>(key: string, defaultValue?: T): T | null => {
    try {
      const item = window.sessionStorage.getItem(key);
      if (item === null) {
        return defaultValue || null;
      }
      
      try {
        return JSON.parse(item);
      } catch {
        return item as unknown as T;
      }
    } catch (error) {
      console.warn(`Error reading from sessionStorage key "${key}":`, error);
      return defaultValue || null;
    }
  },

  setItem: <T>(key: string, value: T): boolean => {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      window.sessionStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      console.warn(`Error writing to sessionStorage key "${key}":`, error);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    try {
      window.sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing from sessionStorage key "${key}":`, error);
      return false;
    }
  },

  clear: (): boolean => {
    try {
      window.sessionStorage.clear();
      return true;
    } catch (error) {
      console.warn('Error clearing sessionStorage:', error);
      return false;
    }
  }
};

/**
 * Storage event handling
 */
export const onStorageChange = (callback: (e: StorageEvent) => void): (() => void) => {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};

/**
 * Cache with expiration
 */
export const cache = {
  set: (key: string, value: any, ttlSeconds: number): boolean => {
    const expiry = Date.now() + (ttlSeconds * 1000);
    const cacheData = { value, expiry };
    return setStorageItem(`cache_${key}`, cacheData);
  },

  get: <T>(key: string): T | null => {
    const cacheData = getStorageItem<{ value: T; expiry: number }>(`cache_${key}`);
    
    if (!cacheData) {
      return null;
    }

    if (Date.now() > cacheData.expiry) {
      removeStorageItem(`cache_${key}`);
      return null;
    }

    return cacheData.value;
  },

  remove: (key: string): boolean => {
    return removeStorageItem(`cache_${key}`);
  },

  clear: (): boolean => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.warn('Error clearing cache:', error);
      return false;
    }
  }
};
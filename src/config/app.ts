import { APP_CONFIG, PAGINATION, API_TIMEOUTS } from '../constants';

/**
 * Application configuration
 */

export const appConfig = {
  // App metadata
  ...APP_CONFIG,
  
  // Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Feature flags
  features: {
    darkMode: true,
    multiLanguage: false,
    notifications: true,
    realTimeUpdates: false,
    bulkOperations: true,
    advancedFilters: true,
    exportData: true,
    importData: true,
    auditLogs: true,
    fileUploads: true,
  },
  
  // UI Configuration
  ui: {
    pagination: PAGINATION,
    itemsPerPageOptions: PAGINATION.PAGE_SIZE_OPTIONS,
    defaultPageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    maxPageSize: PAGINATION.MAX_PAGE_SIZE,
    
    // Table configuration
    table: {
      defaultSortOrder: 'desc',
      defaultSortField: 'modified',
      stickyHeader: true,
      showRowNumbers: false,
      selectable: true,
    },
    
    // Form configuration
    form: {
      autoSave: false,
      autoSaveInterval: 30000, // 30 seconds
      showRequiredIndicator: true,
      validationTrigger: 'onBlur',
    },
    
    // Layout
    layout: {
      sidebarCollapsible: true,
      sidebarWidth: 250,
      sidebarCollapsedWidth: 60,
      headerHeight: 64,
      footerHeight: 40,
    },
    
    // Animation
    animation: {
      duration: 200,
      easing: 'ease-in-out',
      disabled: false,
    },
  },
  
  // API Configuration
  api: {
    timeout: API_TIMEOUTS.DEFAULT,
    uploadTimeout: API_TIMEOUTS.UPLOAD,
    longRunningTimeout: API_TIMEOUTS.LONG_RUNNING,
    retryAttempts: 3,
    retryDelay: 1000,
    caching: {
      enabled: true,
      defaultTTL: 300, // 5 minutes
      maxAge: 3600, // 1 hour
    },
  },
  
  // Search configuration
  search: {
    minQueryLength: 2,
    debounceDelay: 300,
    maxResults: 50,
    highlightMatches: true,
  },
  
  // Date/Time configuration
  dateTime: {
    locale: 'vi-VN',
    timezone: 'Asia/Ho_Chi_Minh',
    formats: {
      date: 'dd/MM/yyyy',
      dateTime: 'dd/MM/yyyy HH:mm',
      time: 'HH:mm',
      shortDate: 'dd/MM',
      longDate: 'EEEE, dd MMMM yyyy',
    },
  },
  
  // Notification configuration
  notifications: {
    position: 'top-right',
    duration: 5000,
    maxVisible: 5,
    showProgress: true,
    pauseOnHover: true,
  },
  
  // Security configuration
  security: {
    sessionTimeout: 3600000, // 1 hour
    tokenRefreshThreshold: 300000, // 5 minutes
    maxLoginAttempts: 5,
    lockoutDuration: 300000, // 5 minutes
  },
  
  // Performance configuration
  performance: {
    virtualScrolling: {
      enabled: true,
      itemHeight: 60,
      bufferSize: 10,
    },
    lazyLoading: {
      enabled: true,
      threshold: 100,
    },
    imageOptimization: {
      enabled: true,
      quality: 80,
      maxWidth: 1200,
      maxHeight: 800,
    },
  },
  
  // Debug configuration
  debug: {
    enabled: import.meta.env.DEV,
    logLevel: import.meta.env.DEV ? 'debug' : 'error',
    showApiCalls: import.meta.env.DEV,
    showRenderTime: false,
  },
} as const;

// Environment-specific overrides
if (appConfig.isDevelopment) {
  // Development overrides
  appConfig.api.timeout = 30000; // Longer timeout for development
  appConfig.debug.showApiCalls = true;
}

if (appConfig.isProduction) {
  // Production overrides
  appConfig.debug.enabled = false;
  appConfig.debug.logLevel = 'error';
}

export default appConfig;
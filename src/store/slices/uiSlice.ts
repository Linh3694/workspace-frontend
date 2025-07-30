import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  timestamp: number;
}

interface UiState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Layout
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  
  // Loading states
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;
  
  // Notifications
  notifications: Notification[];
  
  // Modals
  modals: Record<string, boolean>;
  
  // Search
  globalSearch: string;
  searchResults: any[];
  
  // Pagination
  defaultPageSize: number;
  
  // Filters
  activeFilters: Record<string, any>;
  
  // Preferences
  userPreferences: Record<string, any>;
}

const initialState: UiState = {
  theme: 'system',
  sidebarCollapsed: false,
  sidebarWidth: 250,
  globalLoading: false,
  loadingStates: {},
  notifications: [],
  modals: {},
  globalSearch: '',
  searchResults: [],
  defaultPageSize: 20,
  activeFilters: {},
  userPreferences: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme actions
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    
    // Sidebar actions
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setSidebarWidth: (state, action: PayloadAction<number>) => {
      state.sidebarWidth = action.payload;
    },
    
    // Loading actions
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      const { key, loading } = action.payload;
      if (loading) {
        state.loadingStates[key] = true;
      } else {
        delete state.loadingStates[key];
      }
    },
    clearAllLoading: (state) => {
      state.loadingStates = {};
      state.globalLoading = false;
    },
    
    // Notification actions
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substring(2),
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Modal actions
    openModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      state.modals = {};
    },
    
    // Search actions
    setGlobalSearch: (state, action: PayloadAction<string>) => {
      state.globalSearch = action.payload;
    },
    setSearchResults: (state, action: PayloadAction<any[]>) => {
      state.searchResults = action.payload;
    },
    clearSearch: (state) => {
      state.globalSearch = '';
      state.searchResults = [];
    },
    
    // Pagination actions
    setDefaultPageSize: (state, action: PayloadAction<number>) => {
      state.defaultPageSize = action.payload;
    },
    
    // Filter actions
    setFilter: (state, action: PayloadAction<{ key: string; value: any }>) => {
      const { key, value } = action.payload;
      if (value === null || value === undefined || value === '') {
        delete state.activeFilters[key];
      } else {
        state.activeFilters[key] = value;
      }
    },
    clearFilters: (state) => {
      state.activeFilters = {};
    },
    clearFilter: (state, action: PayloadAction<string>) => {
      delete state.activeFilters[action.payload];
    },
    
    // Preferences actions
    setUserPreference: (state, action: PayloadAction<{ key: string; value: any }>) => {
      const { key, value } = action.payload;
      state.userPreferences[key] = value;
    },
    setUserPreferences: (state, action: PayloadAction<Record<string, any>>) => {
      state.userPreferences = { ...state.userPreferences, ...action.payload };
    },
    clearUserPreferences: (state) => {
      state.userPreferences = {};
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  setSidebarWidth,
  setGlobalLoading,
  setLoading,
  clearAllLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  closeAllModals,
  setGlobalSearch,
  setSearchResults,
  clearSearch,
  setDefaultPageSize,
  setFilter,
  clearFilters,
  clearFilter,
  setUserPreference,
  setUserPreferences,
  clearUserPreferences,
} = uiSlice.actions;

export default uiSlice.reducer;
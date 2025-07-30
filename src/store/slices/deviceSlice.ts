import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Device {
  name: string;
  device_name: string;
  device_type: string;
  manufacturer: string;
  serial_number: string;
  release_year?: number;
  status: string;
  broken_reason?: string;
  specs?: Record<string, any>;
  current_assignment?: any[];
  assignment_history?: any[];
  room?: string;
  creation: string;
  modified: string;
}

interface DeviceState {
  // Current device list
  devices: Device[];
  selectedDevices: string[];
  currentDevice: Device | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  
  // Loading states
  loading: boolean;
  loadingDeviceDetail: boolean;
  loadingCreate: boolean;
  loadingUpdate: boolean;
  loadingDelete: boolean;
  loadingAssignment: boolean;
  
  // Errors
  error: string | null;
  
  // View preferences
  viewMode: 'list' | 'grid' | 'card';
  sortField: string;
  sortOrder: 'asc' | 'desc';
  
  // Quick access
  recentDevices: Device[];
  favoriteDevices: string[];
  
  // Stats cache
  deviceStats: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    assigned: number;
    available: number;
    broken: number;
    lastUpdated?: number;
  } | null;
}

const initialState: DeviceState = {
  devices: [],
  selectedDevices: [],
  currentDevice: null,
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 20,
  hasNext: false,
  hasPrev: false,
  loading: false,
  loadingDeviceDetail: false,
  loadingCreate: false,
  loadingUpdate: false,
  loadingDelete: false,
  loadingAssignment: false,
  error: null,
  viewMode: 'list',
  sortField: 'modified',
  sortOrder: 'desc',
  recentDevices: [],
  favoriteDevices: [],
  deviceStats: null,
};

const deviceSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    // Loading actions
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setLoadingDeviceDetail: (state, action: PayloadAction<boolean>) => {
      state.loadingDeviceDetail = action.payload;
    },
    setLoadingCreate: (state, action: PayloadAction<boolean>) => {
      state.loadingCreate = action.payload;
    },
    setLoadingUpdate: (state, action: PayloadAction<boolean>) => {
      state.loadingUpdate = action.payload;
    },
    setLoadingDelete: (state, action: PayloadAction<boolean>) => {
      state.loadingDelete = action.payload;
    },
    setLoadingAssignment: (state, action: PayloadAction<boolean>) => {
      state.loadingAssignment = action.payload;
    },
    
    // Error actions
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    
    // Device list actions
    setDevices: (state, action: PayloadAction<{ devices: Device[]; pagination?: any }>) => {
      const { devices, pagination } = action.payload;
      state.devices = devices;
      state.loading = false;
      state.error = null;
      
      if (pagination) {
        state.currentPage = pagination.current_page || 1;
        state.totalPages = pagination.total_pages || 1;
        state.totalItems = pagination.total_items || devices.length;
        state.itemsPerPage = pagination.items_per_page || 20;
        state.hasNext = pagination.has_next || false;
        state.hasPrev = pagination.has_prev || false;
      }
    },
    addDevice: (state, action: PayloadAction<Device>) => {
      state.devices.unshift(action.payload);
      state.totalItems += 1;
    },
    updateDevice: (state, action: PayloadAction<Device>) => {
      const index = state.devices.findIndex(d => d.name === action.payload.name);
      if (index !== -1) {
        state.devices[index] = action.payload;
      }
      
      // Update current device if it's the same
      if (state.currentDevice?.name === action.payload.name) {
        state.currentDevice = action.payload;
      }
    },
    removeDevice: (state, action: PayloadAction<string>) => {
      state.devices = state.devices.filter(d => d.name !== action.payload);
      state.totalItems = Math.max(0, state.totalItems - 1);
      
      // Clear current device if it's the deleted one
      if (state.currentDevice?.name === action.payload) {
        state.currentDevice = null;
      }
      
      // Remove from selected devices
      state.selectedDevices = state.selectedDevices.filter(id => id !== action.payload);
    },
    
    // Current device actions
    setCurrentDevice: (state, action: PayloadAction<Device | null>) => {
      state.currentDevice = action.payload;
      state.loadingDeviceDetail = false;
      
      // Add to recent devices if setting a device
      if (action.payload) {
        const recentIndex = state.recentDevices.findIndex(d => d.name === action.payload.name);
        if (recentIndex !== -1) {
          state.recentDevices.splice(recentIndex, 1);
        }
        state.recentDevices.unshift(action.payload);
        state.recentDevices = state.recentDevices.slice(0, 10); // Keep only 10 recent devices
      }
    },
    clearCurrentDevice: (state) => {
      state.currentDevice = null;
    },
    
    // Selection actions
    selectDevice: (state, action: PayloadAction<string>) => {
      if (!state.selectedDevices.includes(action.payload)) {
        state.selectedDevices.push(action.payload);
      }
    },
    deselectDevice: (state, action: PayloadAction<string>) => {
      state.selectedDevices = state.selectedDevices.filter(id => id !== action.payload);
    },
    toggleDeviceSelection: (state, action: PayloadAction<string>) => {
      const index = state.selectedDevices.indexOf(action.payload);
      if (index !== -1) {
        state.selectedDevices.splice(index, 1);
      } else {
        state.selectedDevices.push(action.payload);
      }
    },
    selectAllDevices: (state) => {
      state.selectedDevices = state.devices.map(d => d.name);
    },
    clearSelection: (state) => {
      state.selectedDevices = [];
    },
    
    // View preference actions
    setViewMode: (state, action: PayloadAction<'list' | 'grid' | 'card'>) => {
      state.viewMode = action.payload;
    },
    setSorting: (state, action: PayloadAction<{ field: string; order: 'asc' | 'desc' }>) => {
      state.sortField = action.payload.field;
      state.sortOrder = action.payload.order;
    },
    
    // Pagination actions
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setItemsPerPage: (state, action: PayloadAction<number>) => {
      state.itemsPerPage = action.payload;
    },
    
    // Favorites actions
    addToFavorites: (state, action: PayloadAction<string>) => {
      if (!state.favoriteDevices.includes(action.payload)) {
        state.favoriteDevices.push(action.payload);
      }
    },
    removeFromFavorites: (state, action: PayloadAction<string>) => {
      state.favoriteDevices = state.favoriteDevices.filter(id => id !== action.payload);
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const index = state.favoriteDevices.indexOf(action.payload);
      if (index !== -1) {
        state.favoriteDevices.splice(index, 1);
      } else {
        state.favoriteDevices.push(action.payload);
      }
    },
    
    // Stats actions
    setDeviceStats: (state, action: PayloadAction<DeviceState['deviceStats']>) => {
      state.deviceStats = action.payload;
    },
    updateDeviceStats: (state, action: PayloadAction<Partial<NonNullable<DeviceState['deviceStats']>>>) => {
      if (state.deviceStats) {
        state.deviceStats = { ...state.deviceStats, ...action.payload };
      }
    },
    
    // Reset actions
    resetDeviceState: (state) => {
      Object.assign(state, initialState);
    },
    resetDeviceList: (state) => {
      state.devices = [];
      state.currentPage = 1;
      state.totalPages = 1;
      state.totalItems = 0;
      state.hasNext = false;
      state.hasPrev = false;
      state.selectedDevices = [];
    },
  },
});

export const {
  setLoading,
  setLoadingDeviceDetail,
  setLoadingCreate,
  setLoadingUpdate,
  setLoadingDelete,
  setLoadingAssignment,
  setError,
  clearError,
  setDevices,
  addDevice,
  updateDevice,
  removeDevice,
  setCurrentDevice,
  clearCurrentDevice,
  selectDevice,
  deselectDevice,
  toggleDeviceSelection,
  selectAllDevices,
  clearSelection,
  setViewMode,
  setSorting,
  setCurrentPage,
  setItemsPerPage,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  setDeviceStats,
  updateDeviceStats,
  resetDeviceState,
  resetDeviceList,
} = deviceSlice.actions;

export default deviceSlice.reducer;
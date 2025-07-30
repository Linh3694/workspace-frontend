import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FilterState {
  // Device filters
  deviceType: string;
  status: string;
  manufacturer: string;
  assignedUser: string;
  room: string;
  releaseYear: string;
  search: string;
  
  // Date range filters
  dateFrom: string;
  dateTo: string;
  
  // Advanced filters
  hasDocuments: boolean | null;
  needsInspection: boolean | null;
  isOldDevice: boolean | null;
  
  // Filter options (loaded from API)
  availableManufacturers: string[];
  availableDeviceTypes: string[];
  availableRooms: string[];
  availableUsers: string[];
  availableReleaseYears: number[];
  availableStatuses: string[];
  
  // Quick filters (saved filter sets)
  quickFilters: Array<{
    id: string;
    name: string;
    filters: Record<string, any>;
    isDefault?: boolean;
  }>;
  activeQuickFilter: string | null;
  
  // UI state
  filtersVisible: boolean;
  advancedFiltersVisible: boolean;
  
  // Loading state
  loadingFilterOptions: boolean;
}

const initialState: FilterState = {
  // Device filters
  deviceType: '',
  status: '',
  manufacturer: '',
  assignedUser: '',
  room: '',
  releaseYear: '',
  search: '',
  
  // Date range filters
  dateFrom: '',
  dateTo: '',
  
  // Advanced filters
  hasDocuments: null,
  needsInspection: null,
  isOldDevice: null,
  
  // Filter options
  availableManufacturers: [],
  availableDeviceTypes: ['laptop', 'monitor', 'printer', 'projector', 'phone', 'tool'],
  availableRooms: [],
  availableUsers: [],
  availableReleaseYears: [],
  availableStatuses: ['active', 'standby', 'broken', 'pendingdocumentation'],
  
  // Quick filters
  quickFilters: [
    {
      id: 'all',
      name: 'Tất cả thiết bị',
      filters: {},
      isDefault: true,
    },
    {
      id: 'active',
      name: 'Đang sử dụng',
      filters: { status: 'active' },
    },
    {
      id: 'available',
      name: 'Chờ cấp phát',
      filters: { status: 'standby' },
    },
    {
      id: 'broken',
      name: 'Hỏng',
      filters: { status: 'broken' },
    },
    {
      id: 'laptops',
      name: 'Laptop',
      filters: { deviceType: 'laptop' },
    },
    {
      id: 'monitors',
      name: 'Monitor',
      filters: { deviceType: 'monitor' },
    },
  ],
  activeQuickFilter: 'all',
  
  // UI state
  filtersVisible: false,
  advancedFiltersVisible: false,
  
  // Loading state
  loadingFilterOptions: false,
};

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    // Basic filter actions
    setDeviceType: (state, action: PayloadAction<string>) => {
      state.deviceType = action.payload;
      state.activeQuickFilter = null;
    },
    setStatus: (state, action: PayloadAction<string>) => {
      state.status = action.payload;
      state.activeQuickFilter = null;
    },
    setManufacturer: (state, action: PayloadAction<string>) => {
      state.manufacturer = action.payload;
      state.activeQuickFilter = null;
    },
    setAssignedUser: (state, action: PayloadAction<string>) => {
      state.assignedUser = action.payload;
      state.activeQuickFilter = null;
    },
    setRoom: (state, action: PayloadAction<string>) => {
      state.room = action.payload;
      state.activeQuickFilter = null;
    },
    setReleaseYear: (state, action: PayloadAction<string>) => {
      state.releaseYear = action.payload;
      state.activeQuickFilter = null;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.activeQuickFilter = null;
    },
    
    // Date range filters
    setDateFrom: (state, action: PayloadAction<string>) => {
      state.dateFrom = action.payload;
      state.activeQuickFilter = null;
    },
    setDateTo: (state, action: PayloadAction<string>) => {
      state.dateTo = action.payload;
      state.activeQuickFilter = null;
    },
    setDateRange: (state, action: PayloadAction<{ from: string; to: string }>) => {
      state.dateFrom = action.payload.from;
      state.dateTo = action.payload.to;
      state.activeQuickFilter = null;
    },
    
    // Advanced filters
    setHasDocuments: (state, action: PayloadAction<boolean | null>) => {
      state.hasDocuments = action.payload;
      state.activeQuickFilter = null;
    },
    setNeedsInspection: (state, action: PayloadAction<boolean | null>) => {
      state.needsInspection = action.payload;
      state.activeQuickFilter = null;
    },
    setIsOldDevice: (state, action: PayloadAction<boolean | null>) => {
      state.isOldDevice = action.payload;
      state.activeQuickFilter = null;
    },
    
    // Bulk filter updates
    setFilters: (state, action: PayloadAction<Partial<FilterState>>) => {
      Object.assign(state, action.payload);
      state.activeQuickFilter = null;
    },
    updateFilters: (state, action: PayloadAction<Record<string, any>>) => {
      Object.entries(action.payload).forEach(([key, value]) => {
        if (key in state) {
          (state as any)[key] = value;
        }
      });
      state.activeQuickFilter = null;
    },
    
    // Clear filters
    clearAllFilters: (state) => {
      state.deviceType = '';
      state.status = '';
      state.manufacturer = '';
      state.assignedUser = '';
      state.room = '';
      state.releaseYear = '';
      state.search = '';
      state.dateFrom = '';
      state.dateTo = '';
      state.hasDocuments = null;
      state.needsInspection = null;
      state.isOldDevice = null;
      state.activeQuickFilter = 'all';
    },
    clearBasicFilters: (state) => {
      state.deviceType = '';
      state.status = '';
      state.manufacturer = '';
      state.assignedUser = '';
      state.room = '';
      state.releaseYear = '';
      state.search = '';
      state.activeQuickFilter = null;
    },
    clearAdvancedFilters: (state) => {
      state.dateFrom = '';
      state.dateTo = '';
      state.hasDocuments = null;
      state.needsInspection = null;
      state.isOldDevice = null;
      state.activeQuickFilter = null;
    },
    
    // Filter options
    setFilterOptions: (state, action: PayloadAction<{
      manufacturers?: string[];
      deviceTypes?: string[];
      rooms?: string[];
      users?: string[];
      releaseYears?: number[];
      statuses?: string[];
    }>) => {
      const {
        manufacturers,
        deviceTypes,
        rooms,
        users,
        releaseYears,
        statuses,
      } = action.payload;
      
      if (manufacturers) state.availableManufacturers = manufacturers;
      if (deviceTypes) state.availableDeviceTypes = deviceTypes;
      if (rooms) state.availableRooms = rooms;
      if (users) state.availableUsers = users;
      if (releaseYears) state.availableReleaseYears = releaseYears;
      if (statuses) state.availableStatuses = statuses;
      
      state.loadingFilterOptions = false;
    },
    setLoadingFilterOptions: (state, action: PayloadAction<boolean>) => {
      state.loadingFilterOptions = action.payload;
    },
    
    // Quick filters
    applyQuickFilter: (state, action: PayloadAction<string>) => {
      const quickFilter = state.quickFilters.find(f => f.id === action.payload);
      if (quickFilter) {
        // Clear current filters
        state.deviceType = '';
        state.status = '';
        state.manufacturer = '';
        state.assignedUser = '';
        state.room = '';
        state.releaseYear = '';
        state.search = '';
        state.dateFrom = '';
        state.dateTo = '';
        state.hasDocuments = null;
        state.needsInspection = null;
        state.isOldDevice = null;
        
        // Apply quick filter
        Object.entries(quickFilter.filters).forEach(([key, value]) => {
          if (key in state) {
            (state as any)[key] = value;
          }
        });
        
        state.activeQuickFilter = action.payload;
      }
    },
    addQuickFilter: (state, action: PayloadAction<{
      name: string;
      filters: Record<string, any>;
    }>) => {
      const { name, filters } = action.payload;
      const id = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
      
      state.quickFilters.push({
        id,
        name,
        filters,
      });
    },
    removeQuickFilter: (state, action: PayloadAction<string>) => {
      state.quickFilters = state.quickFilters.filter(
        f => f.id !== action.payload && !f.isDefault
      );
      
      if (state.activeQuickFilter === action.payload) {
        state.activeQuickFilter = 'all';
      }
    },
    updateQuickFilter: (state, action: PayloadAction<{
      id: string;
      name?: string;
      filters?: Record<string, any>;
    }>) => {
      const { id, name, filters } = action.payload;
      const index = state.quickFilters.findIndex(f => f.id === id);
      
      if (index !== -1) {
        if (name) state.quickFilters[index].name = name;
        if (filters) state.quickFilters[index].filters = filters;
      }
    },
    
    // UI state
    setFiltersVisible: (state, action: PayloadAction<boolean>) => {
      state.filtersVisible = action.payload;
    },
    toggleFiltersVisible: (state) => {
      state.filtersVisible = !state.filtersVisible;
    },
    setAdvancedFiltersVisible: (state, action: PayloadAction<boolean>) => {
      state.advancedFiltersVisible = action.payload;
    },
    toggleAdvancedFiltersVisible: (state) => {
      state.advancedFiltersVisible = !state.advancedFiltersVisible;
    },
    
    // Helper actions
    hasActiveFilters: (state) => {
      return !!(
        state.deviceType ||
        state.status ||
        state.manufacturer ||
        state.assignedUser ||
        state.room ||
        state.releaseYear ||
        state.search ||
        state.dateFrom ||
        state.dateTo ||
        state.hasDocuments !== null ||
        state.needsInspection !== null ||
        state.isOldDevice !== null
      );
    },
    
    getActiveFiltersCount: (state) => {
      let count = 0;
      if (state.deviceType) count++;
      if (state.status) count++;
      if (state.manufacturer) count++;
      if (state.assignedUser) count++;
      if (state.room) count++;
      if (state.releaseYear) count++;
      if (state.search) count++;
      if (state.dateFrom) count++;
      if (state.dateTo) count++;
      if (state.hasDocuments !== null) count++;
      if (state.needsInspection !== null) count++;
      if (state.isOldDevice !== null) count++;
      return count;
    },
  },
});

export const {
  setDeviceType,
  setStatus,
  setManufacturer,
  setAssignedUser,
  setRoom,
  setReleaseYear,
  setSearch,
  setDateFrom,
  setDateTo,
  setDateRange,
  setHasDocuments,
  setNeedsInspection,
  setIsOldDevice,
  setFilters,
  updateFilters,
  clearAllFilters,
  clearBasicFilters,
  clearAdvancedFilters,
  setFilterOptions,
  setLoadingFilterOptions,
  applyQuickFilter,
  addQuickFilter,
  removeQuickFilter,
  updateQuickFilter,
  setFiltersVisible,
  toggleFiltersVisible,
  setAdvancedFiltersVisible,
  toggleAdvancedFiltersVisible,
} = filterSlice.actions;

export default filterSlice.reducer;
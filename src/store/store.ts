import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Import slices
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import deviceSlice from './slices/deviceSlice';
import filterSlice from './slices/filterSlice';

// Import API slices
import { inventoryApi } from './api/inventoryApi';
import { activityApi } from './api/activityApi';
import { inspectApi } from './api/inspectApi';

export const store = configureStore({
  reducer: {
    // Feature slices
    auth: authSlice,
    ui: uiSlice,
    devices: deviceSlice,
    filters: filterSlice,
    
    // API slices
    [inventoryApi.reducerPath]: inventoryApi.reducer,
    [activityApi.reducerPath]: activityApi.reducer,
    [inspectApi.reducerPath]: inspectApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          // Ignore these action types
          'persist/PERSIST',
          'persist/REHYDRATE',
        ],
        ignoredPaths: [
          // Ignore these paths in the state
          'ui.notifications',
        ],
      },
    })
      .concat(inventoryApi.middleware)
      .concat(activityApi.middleware)
      .concat(inspectApi.middleware),
  
  devTools: process.env.NODE_ENV !== 'production',
});

// Enable listener behavior for the store
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
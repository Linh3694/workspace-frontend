import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Custom hooks for common state selections
export const useAuth = () => {
  return useAppSelector((state) => state.auth);
};

export const useUI = () => {
  return useAppSelector((state) => state.ui);
};

export const useDevices = () => {
  return useAppSelector((state) => state.devices);
};

export const useFilters = () => {
  return useAppSelector((state) => state.filters);
};

// Typed hooks for API slices
export { 
  useGetDevicesQuery,
  useGetDeviceQuery,
  useCreateDeviceMutation,
  useUpdateDeviceMutation,
  useDeleteDeviceMutation,
  useAssignDeviceMutation,
  useRevokeDeviceMutation,
} from './api/inventoryApi';

export {
  useGetActivitiesQuery,
  useAddActivityMutation,
  useUpdateActivityMutation,
  useDeleteActivityMutation,
} from './api/activityApi';

export {
  useGetInspectionsQuery,
  useGetInspectionQuery,
  useCreateInspectionMutation,
  useUpdateInspectionMutation,
  useDeleteInspectionMutation,
} from './api/inspectApi';
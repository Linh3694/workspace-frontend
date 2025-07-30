import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { USE_FRAPPE_API, FRAPPE_API_URL, API_URL } from '../../config/api';

// Types
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

interface DeviceListResponse {
  devices: Device[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

interface DeviceListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  manufacturer?: string;
  device_type?: string;
  release_year?: number;
}

interface CreateDeviceRequest {
  device_name: string;
  device_type: string;
  manufacturer: string;
  serial_number: string;
  release_year?: number;
  status?: string;
  specs?: Record<string, any>;
  room?: string;
}

export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
  baseQuery: fetchBaseQuery({
    baseUrl: USE_FRAPPE_API ? `${FRAPPE_API_URL}/api/method` : API_URL,
    prepareHeaders: (headers, { getState }) => {
      // Get token from localStorage or auth state
      const token = localStorage.getItem('frappe_token') || localStorage.getItem('token');
      if (token) {
        if (USE_FRAPPE_API) {
          headers.set('Authorization', `token ${token}`);
        } else {
          headers.set('Authorization', `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ['Device', 'DeviceStats', 'FilterOptions'],
  endpoints: (builder) => ({
    // Get devices list
    getDevices: builder.query<DeviceListResponse, DeviceListParams>({
      query: (params = {}) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.device.get_devices',
            method: 'GET',
            params,
          };
        } else {
          return {
            url: '/devices',
            params,
          };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.devices.map(({ name }) => ({ type: 'Device' as const, id: name })),
              { type: 'Device', id: 'LIST' },
            ]
          : [{ type: 'Device', id: 'LIST' }],
    }),

    // Get single device
    getDevice: builder.query<Device, string>({
      query: (deviceId) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.device.get_device',
            method: 'GET',
            params: { device_id: deviceId },
          };
        } else {
          return `/devices/${deviceId}`;
        }
      },
      providesTags: (result, error, id) => [{ type: 'Device', id }],
    }),

    // Create device
    createDevice: builder.mutation<{ device_id: string }, CreateDeviceRequest>({
      query: (deviceData) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.device.create_device',
            method: 'POST',
            body: deviceData,
          };
        } else {
          return {
            url: '/devices',
            method: 'POST',
            body: deviceData,
          };
        }
      },
      invalidatesTags: [{ type: 'Device', id: 'LIST' }, 'DeviceStats'],
    }),

    // Update device
    updateDevice: builder.mutation<Device, { deviceId: string; updates: Partial<CreateDeviceRequest> }>({
      query: ({ deviceId, updates }) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.device.update_device',
            method: 'PUT',
            body: { device_id: deviceId, ...updates },
          };
        } else {
          return {
            url: `/devices/${deviceId}`,
            method: 'PUT',
            body: updates,
          };
        }
      },
      invalidatesTags: (result, error, { deviceId }) => [
        { type: 'Device', id: deviceId },
        { type: 'Device', id: 'LIST' },
        'DeviceStats',
      ],
    }),

    // Delete device
    deleteDevice: builder.mutation<{ success: boolean }, string>({
      query: (deviceId) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.device.delete_device',
            method: 'DELETE',
            body: { device_id: deviceId },
          };
        } else {
          return {
            url: `/devices/${deviceId}`,
            method: 'DELETE',
          };
        }
      },
      invalidatesTags: (result, error, deviceId) => [
        { type: 'Device', id: deviceId },
        { type: 'Device', id: 'LIST' },
        'DeviceStats',
      ],
    }),

    // Assign device
    assignDevice: builder.mutation<{ success: boolean }, { deviceId: string; userId: string; notes?: string }>({
      query: ({ deviceId, userId, notes }) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.device.assign_device',
            method: 'POST',
            body: { device_id: deviceId, user_id: userId, notes },
          };
        } else {
          return {
            url: `/devices/${deviceId}/assign`,
            method: 'POST',
            body: { user_id: userId, notes },
          };
        }
      },
      invalidatesTags: (result, error, { deviceId }) => [
        { type: 'Device', id: deviceId },
        { type: 'Device', id: 'LIST' },
        'DeviceStats',
      ],
    }),

    // Revoke device
    revokeDevice: builder.mutation<{ success: boolean }, { deviceId: string; userId: string; reason?: string }>({
      query: ({ deviceId, userId, reason }) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.device.revoke_device',
            method: 'POST',
            body: { device_id: deviceId, user_id: userId, reason },
          };
        } else {
          return {
            url: `/devices/${deviceId}/revoke`,
            method: 'POST',
            body: { user_id: userId, reason },
          };
        }
      },
      invalidatesTags: (result, error, { deviceId }) => [
        { type: 'Device', id: deviceId },
        { type: 'Device', id: 'LIST' },
        'DeviceStats',
      ],
    }),

    // Get device statistics
    getDeviceStats: builder.query<{
      total: number;
      by_type: Record<string, number>;
      by_status: Record<string, number>;
      assigned: number;
      available: number;
      broken: number;
    }, void>({
      query: () => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.device.get_device_stats',
            method: 'GET',
          };
        } else {
          return '/devices/stats';
        }
      },
      providesTags: ['DeviceStats'],
    }),

    // Get filter options
    getFilterOptions: builder.query<{
      manufacturers: string[];
      device_types: string[];
      release_years: number[];
      status_options: string[];
    }, void>({
      query: () => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.device.get_device_filter_options',
            method: 'GET',
          };
        } else {
          return '/devices/filter-options';
        }
      },
      providesTags: ['FilterOptions'],
    }),

    // Device type specific endpoints
    // Laptops
    getLaptops: builder.query<DeviceListResponse, DeviceListParams>({
      query: (params = {}) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.laptop.get_laptops',
            method: 'GET',
            params,
          };
        } else {
          return {
            url: '/laptops',
            params,
          };
        }
      },
      providesTags: [{ type: 'Device', id: 'LAPTOP_LIST' }],
    }),

    // Monitors
    getMonitors: builder.query<DeviceListResponse, DeviceListParams>({
      query: (params = {}) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.monitor.get_monitors',
            method: 'GET',
            params,
          };
        } else {
          return {
            url: '/monitors',
            params,
          };
        }
      },
      providesTags: [{ type: 'Device', id: 'MONITOR_LIST' }],
    }),

    // Phones
    getPhones: builder.query<DeviceListResponse, DeviceListParams>({
      query: (params = {}) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.phone.get_phones',
            method: 'GET',
            params,
          };
        } else {
          return {
            url: '/phones',
            params,
          };
        }
      },
      providesTags: [{ type: 'Device', id: 'PHONE_LIST' }],
    }),

    // Printers
    getPrinters: builder.query<DeviceListResponse, DeviceListParams>({
      query: (params = {}) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.printer.get_printers',
            method: 'GET',
            params,
          };
        } else {
          return {
            url: '/printers',
            params,
          };
        }
      },
      providesTags: [{ type: 'Device', id: 'PRINTER_LIST' }],
    }),

    // Projectors
    getProjectors: builder.query<DeviceListResponse, DeviceListParams>({
      query: (params = {}) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.projector.get_projectors',
            method: 'GET',
            params,
          };
        } else {
          return {
            url: '/projectors',
            params,
          };
        }
      },
      providesTags: [{ type: 'Device', id: 'PROJECTOR_LIST' }],
    }),

    // Tools
    getTools: builder.query<DeviceListResponse, DeviceListParams>({
      query: (params = {}) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.tool.get_tools',
            method: 'GET',
            params,
          };
        } else {
          return {
            url: '/tools',
            params,
          };
        }
      },
      providesTags: [{ type: 'Device', id: 'TOOL_LIST' }],
    }),

    // Bulk upload
    bulkUploadDevices: builder.mutation<{ success: boolean; errors?: string[] }, { deviceType: string; devices: any[] }>({
      query: ({ deviceType, devices }) => {
        if (USE_FRAPPE_API) {
          return {
            url: `erp.inventory.api.${deviceType}.bulk_upload_${deviceType}s`,
            method: 'POST',
            body: { [`${deviceType}s_data`]: devices },
          };
        } else {
          return {
            url: `/${deviceType}s/bulk-upload`,
            method: 'POST',
            body: { devices },
          };
        }
      },
      invalidatesTags: [{ type: 'Device', id: 'LIST' }, 'DeviceStats'],
    }),
  }),
});

export const {
  useGetDevicesQuery,
  useGetDeviceQuery,
  useCreateDeviceMutation,
  useUpdateDeviceMutation,
  useDeleteDeviceMutation,
  useAssignDeviceMutation,
  useRevokeDeviceMutation,
  useGetDeviceStatsQuery,
  useGetFilterOptionsQuery,
  useGetLaptopsQuery,
  useGetMonitorsQuery,
  useGetPhonesQuery,
  useGetPrintersQuery,
  useGetProjectorsQuery,
  useGetToolsQuery,
  useBulkUploadDevicesMutation,
} = inventoryApi;
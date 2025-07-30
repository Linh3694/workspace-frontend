import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { USE_FRAPPE_API, FRAPPE_API_URL, API_URL } from '../../config/api';

// Types
interface Inspection {
  name: string;
  device_id: string;
  device_name?: string;
  device_type: string;
  inspector_id: string;
  inspector_name?: string;
  inspection_date: string;
  overall_assessment: 'Tốt' | 'Trung Bình' | 'Kém' | '';
  passed: boolean;
  recommendations?: string;
  technical_conclusion?: string;
  follow_up_recommendation?: string;
  
  // Inspection results
  external_condition_overall?: 'Tốt' | 'Bình thường' | 'Kém' | '';
  external_condition_notes?: string;
  
  cpu_performance?: string;
  cpu_temperature?: string;
  cpu_overall_condition?: 'Tốt' | 'Bình thường' | 'Kém' | '';
  cpu_notes?: string;
  
  ram_consumption?: string;
  ram_overall_condition?: 'Tốt' | 'Bình thường' | 'Kém' | '';
  ram_notes?: string;
  
  storage_remaining_capacity?: string;
  storage_overall_condition?: 'Tốt' | 'Bình thường' | 'Kém' | '';
  storage_notes?: string;
  
  battery_capacity?: string;
  battery_performance?: string;
  battery_charge_cycles?: string;
  battery_overall_condition?: 'Tốt' | 'Bình thường' | 'Kém' | '';
  battery_notes?: string;
  
  display_color_brightness?: string;
  display_overall_condition?: 'Tốt' | 'Bình thường' | 'Kém' | '';
  display_notes?: string;
  
  connectivity_overall_condition?: 'Tốt' | 'Bình thường' | 'Kém' | '';
  connectivity_notes?: string;
  
  software_overall_condition?: 'Tốt' | 'Bình thường' | 'Kém' | '';
  software_notes?: string;
  
  report_file?: string;
  report_file_path?: string;
}

interface InspectionListResponse {
  inspections: Inspection[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

interface InspectionListParams {
  page?: number;
  limit?: number;
  device_id?: string;
  inspector_id?: string;
  start_date?: string;
  end_date?: string;
  passed?: boolean;
  overall_assessment?: string;
}

interface CreateInspectionRequest {
  device_id: string;
  inspector_id?: string;
  overall_assessment?: 'Tốt' | 'Trung Bình' | 'Kém' | '';
  passed?: boolean;
  recommendations?: string;
  technical_conclusion?: string;
  follow_up_recommendation?: string;
  
  // Inspection results
  external_condition_overall?: 'Tốt' | 'Bình thường' | 'Kém' | '';
  external_condition_notes?: string;
  
  cpu_performance?: string;
  cpu_temperature?: string;
  cpu_overall_condition?: 'Tốt' | 'Bình thường' | 'Kém' | '';
  cpu_notes?: string;
  
  ram_consumption?: string;
  ram_overall_condition?: 'Tốt' | 'Bình thường' | 'Kém' | '';
  ram_notes?: string;
  
  storage_remaining_capacity?: string;
  storage_overall_condition?: 'Tốt' | 'Bình thường' | 'Kém' | '';
  storage_notes?: string;
  
  battery_capacity?: string;
  battery_performance?: string;
  battery_charge_cycles?: string;
  battery_overall_condition?: 'Tốt' | 'Bình thường' | 'Kém' | '';
  battery_notes?: string;
  
  display_color_brightness?: string;
  display_overall_condition?: 'Tốt' | 'Bình thường' | 'Kém' | '';
  display_notes?: string;
  
  connectivity_overall_condition?: 'Tốt' | 'Bình thường' | 'Kém' | '';
  connectivity_notes?: string;
  
  software_overall_condition?: 'Tốt' | 'Bình thường' | 'Kém' | '';
  software_notes?: string;
}

interface InspectionStats {
  total_inspections: number;
  passed: number;
  failed: number;
  by_assessment: Record<string, number>;
  recent_inspections: number;
}

interface InspectionDashboard {
  stats: InspectionStats;
  devices_needing_inspection: Array<{
    name: string;
    device_name: string;
    device_type: string;
    status: string;
  }>;
  failed_inspections: Array<{
    name: string;
    device_id: string;
    device_name?: string;
    inspection_date: string;
    overall_assessment: string;
    inspector_id: string;
    inspector_name?: string;
    recommendations?: string;
  }>;
}

export const inspectApi = createApi({
  reducerPath: 'inspectApi',
  baseQuery: fetchBaseQuery({
    baseUrl: USE_FRAPPE_API ? `${FRAPPE_API_URL}/api/method` : API_URL,
    prepareHeaders: (headers, { getState }) => {
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
  tagTypes: ['Inspection', 'InspectionStats', 'InspectionDashboard'],
  endpoints: (builder) => ({
    // Get inspections list
    getInspections: builder.query<InspectionListResponse, InspectionListParams>({
      query: (params = {}) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.inspect.get_inspections',
            method: 'GET',
            params,
          };
        } else {
          return {
            url: '/inspections',
            params,
          };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.inspections.map(({ name }) => ({ type: 'Inspection' as const, id: name })),
              { type: 'Inspection', id: 'LIST' },
            ]
          : [{ type: 'Inspection', id: 'LIST' }],
    }),

    // Get single inspection
    getInspection: builder.query<Inspection, string>({
      query: (inspectionId) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.inspect.get_inspection',
            method: 'GET',
            params: { inspection_id: inspectionId },
          };
        } else {
          return `/inspections/${inspectionId}`;
        }
      },
      providesTags: (result, error, id) => [{ type: 'Inspection', id }],
    }),

    // Create inspection
    createInspection: builder.mutation<{ inspection_id: string }, CreateInspectionRequest>({
      query: (inspectionData) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.inspect.create_inspection',
            method: 'POST',
            body: inspectionData,
          };
        } else {
          return {
            url: '/inspections',
            method: 'POST',
            body: inspectionData,
          };
        }
      },
      invalidatesTags: [
        { type: 'Inspection', id: 'LIST' },
        'InspectionStats',
        'InspectionDashboard',
      ],
    }),

    // Update inspection
    updateInspection: builder.mutation<Inspection, { inspectionId: string; updates: Partial<CreateInspectionRequest> }>({
      query: ({ inspectionId, updates }) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.inspect.update_inspection',
            method: 'PUT',
            body: { inspection_id: inspectionId, ...updates },
          };
        } else {
          return {
            url: `/inspections/${inspectionId}`,
            method: 'PUT',
            body: updates,
          };
        }
      },
      invalidatesTags: (result, error, { inspectionId }) => [
        { type: 'Inspection', id: inspectionId },
        { type: 'Inspection', id: 'LIST' },
        'InspectionStats',
        'InspectionDashboard',
      ],
    }),

    // Delete inspection
    deleteInspection: builder.mutation<{ success: boolean }, string>({
      query: (inspectionId) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.inspect.delete_inspection',
            method: 'DELETE',
            body: { inspection_id: inspectionId },
          };
        } else {
          return {
            url: `/inspections/${inspectionId}`,
            method: 'DELETE',
          };
        }
      },
      invalidatesTags: (result, error, inspectionId) => [
        { type: 'Inspection', id: inspectionId },
        { type: 'Inspection', id: 'LIST' },
        'InspectionStats',
        'InspectionDashboard',
      ],
    }),

    // Get device inspections
    getDeviceInspections: builder.query<Inspection[], { deviceId: string; limit?: number }>({
      query: ({ deviceId, limit = 10 }) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.inspect.get_device_inspections',
            method: 'GET',
            params: { device_id: deviceId, limit },
          };
        } else {
          return {
            url: '/inspections',
            params: { device_id: deviceId, limit },
          };
        }
      },
      transformResponse: (response: InspectionListResponse) => response.inspections,
      providesTags: (result, error, { deviceId }) => [
        { type: 'Inspection', id: `DEVICE_${deviceId}` },
      ],
    }),

    // Get latest inspection for device
    getLatestInspection: builder.query<Inspection | null, string>({
      query: (deviceId) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.inspect.get_latest_inspection',
            method: 'GET',
            params: { device_id: deviceId },
          };
        } else {
          return `/inspections/latest?device_id=${deviceId}`;
        }
      },
      providesTags: (result, error, deviceId) => [
        { type: 'Inspection', id: `LATEST_${deviceId}` },
      ],
    }),

    // Upload inspection report
    uploadInspectionReport: builder.mutation<{ success: boolean }, { inspectionId: string; fileUrl: string }>({
      query: ({ inspectionId, fileUrl }) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.inspect.upload_inspection_report',
            method: 'POST',
            body: { inspection_id: inspectionId, file_url: fileUrl },
          };
        } else {
          return {
            url: `/inspections/${inspectionId}/report`,
            method: 'POST',
            body: { file_url: fileUrl },
          };
        }
      },
      invalidatesTags: (result, error, { inspectionId }) => [
        { type: 'Inspection', id: inspectionId },
      ],
    }),

    // Get inspection report data
    getInspectionReport: builder.query<{
      device_name: string;
      device_type: string;
      serial_number: string;
      inspection_date: string;
      inspector: string;
      overall_assessment: string;
      passed: boolean;
      recommendations?: string;
      technical_conclusion?: string;
      follow_up_recommendation?: string;
      inspection_results: Record<string, any>;
    }, string>({
      query: (inspectionId) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.inspect.get_inspection_report',
            method: 'GET',
            params: { inspection_id: inspectionId },
          };
        } else {
          return `/inspections/${inspectionId}/report`;
        }
      },
      providesTags: (result, error, id) => [{ type: 'Inspection', id: `REPORT_${id}` }],
    }),

    // Get inspection statistics
    getInspectionStats: builder.query<InspectionStats, void>({
      query: () => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.inspect.get_inspection_stats',
            method: 'GET',
          };
        } else {
          return '/inspections/stats';
        }
      },
      providesTags: ['InspectionStats'],
    }),

    // Get inspection dashboard
    getInspectionDashboard: builder.query<InspectionDashboard, void>({
      query: () => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.inspect.get_inspection_dashboard',
            method: 'GET',
          };
        } else {
          return '/inspections/dashboard';
        }
      },
      providesTags: ['InspectionDashboard'],
    }),

    // Get devices needing inspection
    getDevicesNeedingInspection: builder.query<Array<{
      name: string;
      device_name: string;
      device_type: string;
      status: string;
      last_inspection_date?: string;
    }>, { limit?: number }>({
      query: ({ limit = 20 } = {}) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.inspect.get_devices_needing_inspection',
            method: 'GET',
            params: { limit },
          };
        } else {
          return {
            url: '/inspections/devices-needing',
            params: { limit },
          };
        }
      },
      providesTags: [{ type: 'Inspection', id: 'DEVICES_NEEDING' }],
    }),

    // Bulk create inspections
    bulkCreateInspections: builder.mutation<{ success: boolean; created: number; errors?: string[] }, CreateInspectionRequest[]>({
      query: (inspections) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.inspect.bulk_create_inspections',
            method: 'POST',
            body: { inspections },
          };
        } else {
          return {
            url: '/inspections/bulk',
            method: 'POST',
            body: { inspections },
          };
        }
      },
      invalidatesTags: [
        { type: 'Inspection', id: 'LIST' },
        'InspectionStats',
        'InspectionDashboard',
      ],
    }),
  }),
});

export const {
  useGetInspectionsQuery,
  useGetInspectionQuery,
  useCreateInspectionMutation,
  useUpdateInspectionMutation,
  useDeleteInspectionMutation,
  useGetDeviceInspectionsQuery,
  useGetLatestInspectionQuery,
  useUploadInspectionReportMutation,
  useGetInspectionReportQuery,
  useGetInspectionStatsQuery,
  useGetInspectionDashboardQuery,
  useGetDevicesNeedingInspectionQuery,
  useBulkCreateInspectionsMutation,
} = inspectApi;
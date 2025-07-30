import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { USE_FRAPPE_API, FRAPPE_API_URL, API_URL } from '../../config/api';

// Types
interface Activity {
  name: string;
  entity_type: string;
  entity_id: string;
  activity_type: 'repair' | 'update' | 'assign' | 'revoke' | 'create' | 'delete';
  description: string;
  details?: string;
  activity_date: string;
  updated_by: string;
  updated_by_name?: string;
}

interface ActivityListResponse {
  activities: Activity[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

interface ActivityListParams {
  entity_type?: string;
  entity_id?: string;
  page?: number;
  limit?: number;
  activity_type?: string;
  start_date?: string;
  end_date?: string;
}

interface CreateActivityRequest {
  entity_type: string;
  entity_id: string;
  activity_type: 'repair' | 'update' | 'assign' | 'revoke' | 'create' | 'delete';
  description: string;
  details?: string;
}

interface UpdateActivityRequest {
  activity_id: string;
  description?: string;
  details?: string;
  activity_date?: string;
}

interface ActivityStats {
  total_activities: number;
  by_type: Record<string, number>;
  recent_activities: Activity[];
  period_days: number;
}

export const activityApi = createApi({
  reducerPath: 'activityApi',
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
  tagTypes: ['Activity', 'ActivityStats'],
  endpoints: (builder) => ({
    // Get activities list
    getActivities: builder.query<ActivityListResponse, ActivityListParams>({
      query: (params = {}) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.activity.get_activities',
            method: 'GET',
            params,
          };
        } else {
          return {
            url: '/activities',
            params,
          };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.activities.map(({ name }) => ({ type: 'Activity' as const, id: name })),
              { type: 'Activity', id: 'LIST' },
            ]
          : [{ type: 'Activity', id: 'LIST' }],
    }),

    // Get single activity
    getActivity: builder.query<Activity, string>({
      query: (activityId) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.activity.get_activity',
            method: 'GET',
            params: { activity_id: activityId },
          };
        } else {
          return `/activities/${activityId}`;
        }
      },
      providesTags: (result, error, id) => [{ type: 'Activity', id }],
    }),

    // Create activity
    addActivity: builder.mutation<{ activity_id: string }, CreateActivityRequest>({
      query: (activityData) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.activity.add_activity',
            method: 'POST',
            body: activityData,
          };
        } else {
          return {
            url: '/activities',
            method: 'POST',
            body: activityData,
          };
        }
      },
      invalidatesTags: [{ type: 'Activity', id: 'LIST' }, 'ActivityStats'],
    }),

    // Update activity
    updateActivity: builder.mutation<Activity, UpdateActivityRequest>({
      query: ({ activity_id, ...updates }) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.activity.update_activity',
            method: 'PUT',
            body: { activity_id, ...updates },
          };
        } else {
          return {
            url: `/activities/${activity_id}`,
            method: 'PUT',
            body: updates,
          };
        }
      },
      invalidatesTags: (result, error, { activity_id }) => [
        { type: 'Activity', id: activity_id },
        { type: 'Activity', id: 'LIST' },
        'ActivityStats',
      ],
    }),

    // Delete activity
    deleteActivity: builder.mutation<{ success: boolean }, string>({
      query: (activityId) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.activity.delete_activity',
            method: 'DELETE',
            body: { activity_id: activityId },
          };
        } else {
          return {
            url: `/activities/${activityId}`,
            method: 'DELETE',
          };
        }
      },
      invalidatesTags: (result, error, activityId) => [
        { type: 'Activity', id: activityId },
        { type: 'Activity', id: 'LIST' },
        'ActivityStats',
      ],
    }),

    // Get entity activities
    getEntityActivities: builder.query<ActivityListResponse, { entityType: string; entityId: string; page?: number; limit?: number }>({
      query: ({ entityType, entityId, page = 1, limit = 20 }) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.activity.get_activities',
            method: 'GET',
            params: {
              entity_type: entityType,
              entity_id: entityId,
              page,
              limit,
            },
          };
        } else {
          return {
            url: '/activities',
            params: {
              entity_type: entityType,
              entity_id: entityId,
              page,
              limit,
            },
          };
        }
      },
      providesTags: (result, error, { entityType, entityId }) => [
        { type: 'Activity', id: `${entityType}_${entityId}` },
        { type: 'Activity', id: 'LIST' },
      ],
    }),

    // Get activity statistics
    getActivityStats: builder.query<ActivityStats, { entityType?: string; days?: number }>({
      query: ({ entityType, days = 30 } = {}) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.activity.get_activity_stats',
            method: 'GET',
            params: { entity_type: entityType, days },
          };
        } else {
          return {
            url: '/activities/stats',
            params: { entity_type: entityType, days },
          };
        }
      },
      providesTags: ['ActivityStats'],
    }),

    // Get entity activity summary
    getEntityActivitySummary: builder.query<{
      total_activities: number;
      by_type: Record<string, number>;
      latest_activity: Activity | null;
    }, { entityType: string; entityId: string }>({
      query: ({ entityType, entityId }) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.activity.get_entity_activity_summary',
            method: 'GET',
            params: {
              entity_type: entityType,
              entity_id: entityId,
            },
          };
        } else {
          return {
            url: `/activities/summary`,
            params: {
              entity_type: entityType,
              entity_id: entityId,
            },
          };
        }
      },
      providesTags: (result, error, { entityType, entityId }) => [
        { type: 'Activity', id: `${entityType}_${entityId}_SUMMARY` },
      ],
    }),

    // Get recent activities
    getRecentActivities: builder.query<Activity[], { limit?: number }>({
      query: ({ limit = 10 } = {}) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.activity.get_activities',
            method: 'GET',
            params: { limit, page: 1 },
          };
        } else {
          return {
            url: '/activities/recent',
            params: { limit },
          };
        }
      },
      transformResponse: (response: ActivityListResponse) => response.activities,
      providesTags: [{ type: 'Activity', id: 'RECENT' }],
    }),

    // Bulk create activities
    bulkCreateActivities: builder.mutation<{ success: boolean; created: number; errors?: string[] }, CreateActivityRequest[]>({
      query: (activities) => {
        if (USE_FRAPPE_API) {
          return {
            url: 'erp.inventory.api.activity.bulk_create_activities',
            method: 'POST',
            body: { activities },
          };
        } else {
          return {
            url: '/activities/bulk',
            method: 'POST',
            body: { activities },
          };
        }
      },
      invalidatesTags: [{ type: 'Activity', id: 'LIST' }, 'ActivityStats'],
    }),
  }),
});

export const {
  useGetActivitiesQuery,
  useGetActivityQuery,
  useAddActivityMutation,
  useUpdateActivityMutation,
  useDeleteActivityMutation,
  useGetEntityActivitiesQuery,
  useGetActivityStatsQuery,
  useGetEntityActivitySummaryQuery,
  useGetRecentActivitiesQuery,
  useBulkCreateActivitiesMutation,
} = activityApi;
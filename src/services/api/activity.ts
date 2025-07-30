import { frappeApi, PaginationInfo } from './base';

// Activity interfaces
interface Activity {
  name: string;
  activity_type: 'repair' | 'update' | 'assign' | 'revoke' | 'create' | 'delete';
  description: string;
  details?: string;
  activity_date: string;
  updated_by: string;
  updated_by_name?: string;
}

interface ActivityListParams {
  entity_type: string;
  entity_id: string;
  page?: number;
  limit?: number;
}

interface ActivityListResponse {
  activities: Activity[];
  pagination: PaginationInfo;
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

interface ActivityStatsParams {
  entity_type?: string;
  days?: number;
}

interface ActivityStats {
  total_activities: number;
  by_type: Record<string, number>;
  recent_activities: Activity[];
  period_days: number;
}

interface EntityActivitySummary {
  total_activities: number;
  by_type: Record<string, number>;
  latest_activity: Activity | null;
}

interface ActivityResponse {
  status: string;
  message: string;
  activity?: Activity;
}

class ActivityApiService {
  // Get activities for a specific entity
  async getActivities(entityType: string, entityId: string, page = 1, limit = 20): Promise<ActivityListResponse> {
    return await frappeApi.callMethod('erp.inventory.api.activity.get_activities', {
      entity_type: entityType,
      entity_id: entityId,
      page,
      limit
    }, 'GET');
  }

  // Add new activity
  async addActivity(request: CreateActivityRequest): Promise<ActivityResponse> {
    return await frappeApi.callMethod('erp.inventory.api.activity.add_activity', request);
  }

  // Update existing activity
  async updateActivity(activityId: string, updates: Omit<UpdateActivityRequest, 'activity_id'>): Promise<ActivityResponse> {
    return await frappeApi.callMethod('erp.inventory.api.activity.update_activity', {
      activity_id: activityId,
      ...updates
    });
  }

  // Delete activity
  async deleteActivity(activityId: string): Promise<ActivityResponse> {
    return await frappeApi.callMethod('erp.inventory.api.activity.delete_activity', {
      activity_id: activityId
    }, 'DELETE');
  }

  // Get activity statistics
  async getActivityStats(entityType?: string, days = 30): Promise<ActivityStats> {
    return await frappeApi.callMethod('erp.inventory.api.activity.get_activity_stats', {
      entity_type: entityType,
      days
    }, 'GET');
  }

  // Get activity summary for a specific entity
  async getEntityActivitySummary(entityType: string, entityId: string): Promise<EntityActivitySummary> {
    return await frappeApi.callMethod('erp.inventory.api.activity.get_entity_activity_summary', {
      entity_type: entityType,
      entity_id: entityId
    }, 'GET');
  }
}

// Export singleton instance
export const activityApi = new ActivityApiService();

// Export types
export type {
  Activity,
  ActivityListParams,
  ActivityListResponse,
  CreateActivityRequest,
  UpdateActivityRequest,
  ActivityStatsParams,
  ActivityStats,
  EntityActivitySummary,
  ActivityResponse
};
import { USE_FRAPPE_API } from '../config/api';
import { 
  inventoryApi, 
  activityApi, 
  inspectApi,
  apiHelpers,
  type DeviceListParams,
  type DeviceListResponse,
  type DeviceResponse,
  type FilterOptions,
  type DeviceStats
} from './api';

// Import legacy service types
import type { 
  LaptopResponse, 
  MonitorResponse, 
  PrinterResponse, 
  ToolResponse,
  ProjectorResponse,
  PhoneResponse,
  DeviceType,
  CreateDeviceData
} from '../types/inventory';

// Legacy service import (fallback)
const legacyInventoryService = USE_FRAPPE_API ? null : require('./inventoryService');

/**
 * New Inventory Service that supports both legacy and Frappe backends
 * This service acts as a compatibility layer between old and new APIs
 */
class InventoryService {
  // Device type mapping for legacy compatibility
  private readonly deviceTypeEndpointMap = {
    laptop: 'laptops',
    monitor: 'monitors', 
    printer: 'printers',
    projector: 'projectors',
    phone: 'phones',
    tool: 'tools',
  };

  // Generic device methods
  async getDevices(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    manufacturer?: string;
    device_type?: string;
    release_year?: number;
  } = {}) {
    if (USE_FRAPPE_API) {
      try {
        const result = await inventoryApi.getDevices(params);
        return {
          populatedLaptops: result.devices, // Keep legacy property name for compatibility
          devices: result.devices,
          pagination: result.pagination
        };
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      // Fallback to legacy service
      return legacyInventoryService?.getDevices?.(params) || { devices: [], pagination: {} };
    }
  }

  async getDevice(deviceId: string) {
    if (USE_FRAPPE_API) {
      try {
        return await inventoryApi.getDevice(deviceId);
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      // Legacy fallback would need device type - this is a limitation of the old system
      throw new Error('Legacy API requires device type for single device lookup');
    }
  }

  async createDevice(deviceType: DeviceType, deviceData: CreateDeviceData) {
    if (USE_FRAPPE_API) {
      try {
        const data = {
          ...deviceData,
          device_type: apiHelpers.formatDeviceType(deviceType)
        };
        return await inventoryApi.createDevice(data);
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.createDevice?.(deviceType, deviceData);
    }
  }

  async updateDevice(deviceType: DeviceType, deviceId: string, updateData: any) {
    if (USE_FRAPPE_API) {
      try {
        return await inventoryApi.updateDevice(deviceId, updateData);
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.updateDevice?.(deviceType, deviceId, updateData);
    }
  }

  async deleteDevice(deviceType: DeviceType, deviceId: string) {
    if (USE_FRAPPE_API) {
      try {
        return await inventoryApi.deleteDevice(deviceId);
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.deleteDevice?.(deviceType, deviceId);
    }
  }

  // Laptop-specific methods
  async getLaptops(params: any = {}) {
    if (USE_FRAPPE_API) {
      try {
        const result = await inventoryApi.getLaptops(params);
        return {
          populatedLaptops: result.devices,
          devices: result.devices,
          pagination: result.pagination
        };
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.getLaptops?.(params) || { devices: [], pagination: {} };
    }
  }

  async createLaptop(laptopData: CreateDeviceData) {
    if (USE_FRAPPE_API) {
      try {
        return await inventoryApi.createLaptop(laptopData);
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.createDevice?.('laptop', laptopData);
    }
  }

  async updateLaptop(laptopId: string, updateData: any) {
    if (USE_FRAPPE_API) {
      try {
        return await inventoryApi.updateLaptop(laptopId, updateData);
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.updateDevice?.('laptop', laptopId, updateData);
    }
  }

  async deleteLaptop(laptopId: string) {
    if (USE_FRAPPE_API) {
      try {
        return await inventoryApi.deleteLaptop(laptopId);
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.deleteDevice?.('laptop', laptopId);
    }
  }

  async getLaptopById(laptopId: string) {
    if (USE_FRAPPE_API) {
      try {
        return await inventoryApi.getLaptopById(laptopId);
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.getLaptopById?.(laptopId);
    }
  }

  async assignLaptop(laptopId: string, userId: string, notes?: string) {
    if (USE_FRAPPE_API) {
      try {
        return await inventoryApi.assignLaptop(laptopId, userId, notes);
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.assignDevice?.('laptop', laptopId, { userId, notes });
    }
  }

  async revokeLaptop(laptopId: string, userId: string, reason?: string) {
    if (USE_FRAPPE_API) {
      try {
        return await inventoryApi.revokeLaptop(laptopId, userId, reason);
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.revokeDevice?.('laptop', laptopId, { userId, reason });
    }
  }

  async updateLaptopStatus(laptopId: string, status: string, brokenReason?: string) {
    if (USE_FRAPPE_API) {
      try {
        return await inventoryApi.updateLaptopStatus(laptopId, status, brokenReason);
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.updateDevice?.('laptop', laptopId, { status, brokenReason });
    }
  }

  async updateLaptopSpecs(laptopId: string, specs: any) {
    if (USE_FRAPPE_API) {
      try {
        return await inventoryApi.updateLaptopSpecs(laptopId, specs);
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.updateDevice?.('laptop', laptopId, { specs });
    }
  }

  async getLaptopFilterOptions() {
    if (USE_FRAPPE_API) {
      try {
        return await inventoryApi.getLaptopFilterOptions();
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.getFilterOptions?.('laptop') || { manufacturers: [], device_types: [], release_years: [], status_options: [] };
    }
  }

  async bulkUploadLaptops(laptopsData: any[]) {
    if (USE_FRAPPE_API) {
      try {
        return await inventoryApi.bulkUploadLaptops(laptopsData);
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.bulkUpload?.('laptop', laptopsData);
    }
  }

  // Monitor methods
  async getMonitors(params: any = {}) {
    if (USE_FRAPPE_API) {
      try {
        const result = await inventoryApi.getMonitors(params);
        return {
          populatedLaptops: result.devices, // Keep legacy property name
          devices: result.devices,
          pagination: result.pagination
        };
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.getMonitors?.(params) || { devices: [], pagination: {} };
    }
  }

  // Activity methods
  async getActivities(entityType: string, entityId: string, page = 1, limit = 20) {
    if (USE_FRAPPE_API) {
      try {
        return await activityApi.getActivities(entityType, entityId, page, limit);
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.getActivities?.({
        entityType,
        entityId,
        page,
        limit
      }) || { activities: [], pagination: {} };
    }
  }

  async addActivity(entityType: string, entityId: string, activityType: string, description: string, details?: string) {
    if (USE_FRAPPE_API) {
      try {
        return await activityApi.addActivity({
          entity_type: entityType,
          entity_id: entityId,
          activity_type: activityType as any,
          description,
          details
        });
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.addActivity?.({
        entityType,
        entityId,
        type: activityType,
        description,
        details
      });
    }
  }

  // Inspection methods
  async getInspections(params: any = {}) {
    if (USE_FRAPPE_API) {
      try {
        return await inspectApi.getInspections(params);
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.getInspections?.(params) || { inspections: [], pagination: {} };
    }
  }

  async createInspection(inspectionData: any) {
    if (USE_FRAPPE_API) {
      try {
        return await inspectApi.createInspection(inspectionData);
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.createInspection?.(inspectionData);
    }
  }

  async getLatestInspection(deviceId: string) {
    if (USE_FRAPPE_API) {
      try {
        return await inspectApi.getLatestInspection(deviceId);
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.getLatestInspectionByDeviceId?.(deviceId);
    }
  }

  // Stats and dashboard
  async getDeviceStats() {
    if (USE_FRAPPE_API) {
      try {
        return await inventoryApi.getDeviceStats();
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.getStats?.() || { total: 0, by_type: {}, by_status: {} };
    }
  }

  async getInspectionDashboard() {
    if (USE_FRAPPE_API) {
      try {
        return await inspectApi.getInspectionDashboard();
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.getInspectionDashboard?.() || { stats: {}, devices_needing_inspection: [], failed_inspections: [] };
    }
  }

  // File upload
  async uploadFile(file: File) {
    if (USE_FRAPPE_API) {
      try {
        const { frappeApi } = await import('./api');
        return await frappeApi.uploadFile(file);
      } catch (error) {
        throw new Error(apiHelpers.handleApiError(error));
      }
    } else {
      return legacyInventoryService?.uploadFile?.(file);
    }
  }

  // Utility methods
  isUsingFrappeApi() {
    return USE_FRAPPE_API;
  }

  getApiBackend() {
    return USE_FRAPPE_API ? 'frappe' : 'legacy';
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();

// Export class for testing
export { InventoryService };

// Re-export types for convenience
export type {
  DeviceType,
  CreateDeviceData,
  LaptopResponse,
  MonitorResponse,
  PrinterResponse,
  ToolResponse,
  ProjectorResponse,
  PhoneResponse,
  DeviceListParams,
  DeviceListResponse,
  DeviceResponse,
  FilterOptions,
  DeviceStats
};
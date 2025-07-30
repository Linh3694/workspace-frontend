import { frappeApi, ApiResponse, PaginationInfo } from './base';
import type { 
  LaptopResponse, 
  MonitorResponse, 
  PrinterResponse, 
  ToolResponse,
  ProjectorResponse,
  PhoneResponse,
  DeviceType,
  CreateDeviceData
} from '../../types/inventory';

// Device interfaces
interface DeviceListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  manufacturer?: string;
  device_type?: string;
  release_year?: number;
}

interface DeviceListResponse<T = any> {
  devices: T[];
  pagination: PaginationInfo;
}

interface DeviceResponse {
  status: string;
  message: string;
  device_id?: string;
}

interface AssignRevokeRequest {
  device_id: string;
  user_id: string;
  notes?: string;
  reason?: string;
}

interface UpdateStatusRequest {
  device_id: string;
  status: string;
  broken_reason?: string;
}

interface FilterOptions {
  manufacturers: string[];
  device_types: string[];
  release_years: number[];
  status_options: string[];
}

interface DeviceStats {
  total: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
}

class InventoryApiService {
  // Generic device methods
  async getDevices(params: DeviceListParams = {}): Promise<DeviceListResponse> {
    return await frappeApi.callMethod('erp.inventory.api.device.get_devices', params, 'GET');
  }

  async getDevice(deviceId: string): Promise<any> {
    return await frappeApi.callMethod('erp.inventory.api.device.get_device', { device_id: deviceId }, 'GET');
  }

  async createDevice(deviceData: CreateDeviceData & { device_type: string }): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.device.create_device', deviceData);
  }

  async updateDevice(deviceId: string, updateData: any): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.device.update_device', {
      device_id: deviceId,
      ...updateData
    });
  }

  async deleteDevice(deviceId: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.device.delete_device', { device_id: deviceId }, 'DELETE');
  }

  async assignDevice(deviceId: string, userId: string, notes?: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.device.assign_device', {
      device_id: deviceId,
      user_id: userId,
      notes
    });
  }

  async revokeDevice(deviceId: string, userId: string, reason?: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.device.revoke_device', {
      device_id: deviceId,
      user_id: userId,
      reason
    });
  }

  async updateDeviceStatus(deviceId: string, status: string, brokenReason?: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.device.update_device_status', {
      device_id: deviceId,
      status,
      broken_reason: brokenReason
    });
  }

  async getDeviceFilterOptions(): Promise<FilterOptions> {
    return await frappeApi.callMethod('erp.inventory.api.device.get_device_filter_options', {}, 'GET');
  }

  async bulkUploadDevices(devicesData: any[]): Promise<any> {
    return await frappeApi.callMethod('erp.inventory.api.device.bulk_upload_devices', {
      devices_data: devicesData
    });
  }

  async getDeviceStats(): Promise<DeviceStats> {
    return await frappeApi.callMethod('erp.inventory.api.device.get_device_stats', {}, 'GET');
  }

  // Laptop-specific methods
  async getLaptops(params: DeviceListParams = {}): Promise<DeviceListResponse<LaptopResponse>> {
    return await frappeApi.callMethod('erp.inventory.api.laptop.get_laptops', params, 'GET');
  }

  async createLaptop(laptopData: CreateDeviceData): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.laptop.create_laptop', laptopData);
  }

  async updateLaptop(laptopId: string, updateData: any): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.laptop.update_laptop', {
      laptop_id: laptopId,
      ...updateData
    });
  }

  async deleteLaptop(laptopId: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.laptop.delete_laptop', { laptop_id: laptopId }, 'DELETE');
  }

  async getLaptopById(laptopId: string): Promise<LaptopResponse> {
    return await frappeApi.callMethod('erp.inventory.api.laptop.get_laptop_by_id', { laptop_id: laptopId }, 'GET');
  }

  async assignLaptop(laptopId: string, userId: string, notes?: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.laptop.assign_laptop', {
      laptop_id: laptopId,
      user_id: userId,
      notes
    });
  }

  async revokeLaptop(laptopId: string, userId: string, reason?: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.laptop.revoke_laptop', {
      laptop_id: laptopId,
      user_id: userId,
      reason
    });
  }

  async updateLaptopStatus(laptopId: string, status: string, brokenReason?: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.laptop.update_laptop_status', {
      laptop_id: laptopId,
      status,
      broken_reason: brokenReason
    });
  }

  async updateLaptopSpecs(laptopId: string, specs: any): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.laptop.update_laptop_specs', {
      laptop_id: laptopId,
      ...specs
    });
  }

  async getLaptopFilterOptions(): Promise<FilterOptions> {
    return await frappeApi.callMethod('erp.inventory.api.laptop.get_laptop_filter_options', {}, 'GET');
  }

  async bulkUploadLaptops(laptopsData: any[]): Promise<any> {
    return await frappeApi.callMethod('erp.inventory.api.laptop.bulk_upload_laptops', {
      laptops_data: laptopsData
    });
  }

  // Monitor-specific methods
  async getMonitors(params: DeviceListParams = {}): Promise<DeviceListResponse<MonitorResponse>> {
    return await frappeApi.callMethod('erp.inventory.api.monitor.get_monitors', params, 'GET');
  }

  async createMonitor(monitorData: CreateDeviceData): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.monitor.create_monitor', monitorData);
  }

  async updateMonitor(monitorId: string, updateData: any): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.monitor.update_monitor', {
      monitor_id: monitorId,
      ...updateData
    });
  }

  async deleteMonitor(monitorId: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.monitor.delete_monitor', { monitor_id: monitorId }, 'DELETE');
  }

  async assignMonitor(monitorId: string, userId: string, notes?: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.monitor.assign_monitor', {
      monitor_id: monitorId,
      user_id: userId,
      notes
    });
  }

  async revokeMonitor(monitorId: string, userId: string, reason?: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.monitor.revoke_monitor', {
      monitor_id: monitorId,
      user_id: userId,
      reason
    });
  }

  // Phone-specific methods
  async getPhones(params: DeviceListParams = {}): Promise<DeviceListResponse<PhoneResponse>> {
    return await frappeApi.callMethod('erp.inventory.api.phone.get_phones', params, 'GET');
  }

  async createPhone(phoneData: CreateDeviceData): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.phone.create_phone', phoneData);
  }

  async updatePhone(phoneId: string, updateData: any): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.phone.update_phone', {
      phone_id: phoneId,
      ...updateData
    });
  }

  async deletePhone(phoneId: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.phone.delete_phone', { phone_id: phoneId }, 'DELETE');
  }

  async assignPhone(phoneId: string, userId: string, notes?: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.phone.assign_phone', {
      phone_id: phoneId,
      user_id: userId,
      notes
    });
  }

  async revokePhone(phoneId: string, userId: string, reason?: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.phone.revoke_phone', {
      phone_id: phoneId,
      user_id: userId,
      reason
    });
  }

  // Printer-specific methods
  async getPrinters(params: DeviceListParams = {}): Promise<DeviceListResponse<PrinterResponse>> {
    return await frappeApi.callMethod('erp.inventory.api.printer.get_printers', params, 'GET');
  }

  async createPrinter(printerData: CreateDeviceData): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.printer.create_printer', printerData);
  }

  async updatePrinter(printerId: string, updateData: any): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.printer.update_printer', {
      printer_id: printerId,
      ...updateData
    });
  }

  async deletePrinter(printerId: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.printer.delete_printer', { printer_id: printerId }, 'DELETE');
  }

  async assignPrinter(printerId: string, userId: string, notes?: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.printer.assign_printer', {
      printer_id: printerId,
      user_id: userId,
      notes
    });
  }

  async revokePrinter(printerId: string, userId: string, reason?: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.printer.revoke_printer', {
      printer_id: printerId,
      user_id: userId,
      reason
    });
  }

  // Projector-specific methods
  async getProjectors(params: DeviceListParams = {}): Promise<DeviceListResponse<ProjectorResponse>> {
    return await frappeApi.callMethod('erp.inventory.api.projector.get_projectors', params, 'GET');
  }

  async createProjector(projectorData: CreateDeviceData): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.projector.create_projector', projectorData);
  }

  async updateProjector(projectorId: string, updateData: any): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.projector.update_projector', {
      projector_id: projectorId,
      ...updateData
    });
  }

  async deleteProjector(projectorId: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.projector.delete_projector', { projector_id: projectorId }, 'DELETE');
  }

  async assignProjector(projectorId: string, userId: string, notes?: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.projector.assign_projector', {
      projector_id: projectorId,
      user_id: userId,
      notes
    });
  }

  async revokeProjector(projectorId: string, userId: string, reason?: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.projector.revoke_projector', {
      projector_id: projectorId,
      user_id: userId,
      reason
    });
  }

  // Tool-specific methods
  async getTools(params: DeviceListParams = {}): Promise<DeviceListResponse<ToolResponse>> {
    return await frappeApi.callMethod('erp.inventory.api.tool.get_tools', params, 'GET');
  }

  async createTool(toolData: CreateDeviceData): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.tool.create_tool', toolData);
  }

  async updateTool(toolId: string, updateData: any): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.tool.update_tool', {
      tool_id: toolId,
      ...updateData
    });
  }

  async deleteTool(toolId: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.tool.delete_tool', { tool_id: toolId }, 'DELETE');
  }

  async assignTool(toolId: string, userId: string, notes?: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.tool.assign_tool', {
      tool_id: toolId,
      user_id: userId,
      notes
    });
  }

  async revokeTool(toolId: string, userId: string, reason?: string): Promise<DeviceResponse> {
    return await frappeApi.callMethod('erp.inventory.api.tool.revoke_tool', {
      tool_id: toolId,
      user_id: userId,
      reason
    });
  }
}

// Export singleton instance
export const inventoryApi = new InventoryApiService();

// Export types
export type { 
  DeviceListParams, 
  DeviceListResponse, 
  DeviceResponse, 
  AssignRevokeRequest, 
  UpdateStatusRequest,
  FilterOptions,
  DeviceStats
};
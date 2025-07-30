import { frappeApi, PaginationInfo } from './base';

// Inspection interfaces
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

interface InspectionListParams {
  page?: number;
  limit?: number;
  device_id?: string;
  inspector_id?: string;
  start_date?: string;
  end_date?: string;
}

interface InspectionListResponse {
  inspections: Inspection[];
  pagination: PaginationInfo;
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

interface InspectionResponse {
  status: string;
  message: string;
  inspection_id?: string;
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

interface InspectionReportData {
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
}

class InspectApiService {
  // Get list of inspections
  async getInspections(params: InspectionListParams = {}): Promise<InspectionListResponse> {
    return await frappeApi.callMethod('erp.inventory.api.inspect.get_inspections', params, 'GET');
  }

  // Get single inspection details
  async getInspection(inspectionId: string): Promise<Inspection> {
    return await frappeApi.callMethod('erp.inventory.api.inspect.get_inspection', {
      inspection_id: inspectionId
    }, 'GET');
  }

  // Create new inspection
  async createInspection(inspectionData: CreateInspectionRequest): Promise<InspectionResponse> {
    return await frappeApi.callMethod('erp.inventory.api.inspect.create_inspection', inspectionData);
  }

  // Update existing inspection
  async updateInspection(inspectionId: string, updateData: Partial<CreateInspectionRequest>): Promise<InspectionResponse> {
    return await frappeApi.callMethod('erp.inventory.api.inspect.update_inspection', {
      inspection_id: inspectionId,
      ...updateData
    });
  }

  // Delete inspection
  async deleteInspection(inspectionId: string): Promise<InspectionResponse> {
    return await frappeApi.callMethod('erp.inventory.api.inspect.delete_inspection', {
      inspection_id: inspectionId
    }, 'DELETE');
  }

  // Get device inspection history
  async getDeviceInspections(deviceId: string, limit = 10): Promise<Inspection[]> {
    return await frappeApi.callMethod('erp.inventory.api.inspect.get_device_inspections', {
      device_id: deviceId,
      limit
    }, 'GET');
  }

  // Get latest inspection for a device
  async getLatestInspection(deviceId: string): Promise<Inspection | null> {
    return await frappeApi.callMethod('erp.inventory.api.inspect.get_latest_inspection', {
      device_id: deviceId
    }, 'GET');
  }

  // Upload inspection report file
  async uploadInspectionReport(inspectionId: string, fileUrl: string): Promise<InspectionResponse> {
    return await frappeApi.callMethod('erp.inventory.api.inspect.upload_inspection_report', {
      inspection_id: inspectionId,
      file_url: fileUrl
    });
  }

  // Generate inspection report data
  async getInspectionReport(inspectionId: string): Promise<InspectionReportData> {
    return await frappeApi.callMethod('erp.inventory.api.inspect.get_inspection_report', {
      inspection_id: inspectionId
    }, 'GET');
  }

  // Get inspection statistics
  async getInspectionStats(): Promise<InspectionStats> {
    return await frappeApi.callMethod('erp.inventory.api.inspect.get_inspection_stats', {}, 'GET');
  }

  // Get inspection dashboard data
  async getInspectionDashboard(): Promise<InspectionDashboard> {
    return await frappeApi.callMethod('erp.inventory.api.inspect.get_inspection_dashboard', {}, 'GET');
  }

  // Upload inspection report file via file upload
  async uploadReportFile(inspectionId: string, file: File): Promise<InspectionResponse> {
    try {
      // First upload the file
      const fileUrl = await frappeApi.uploadFile(file, 'report_file');
      
      // Then associate it with the inspection
      return await this.uploadInspectionReport(inspectionId, fileUrl);
    } catch (error) {
      throw new Error(`Failed to upload inspection report: ${error}`);
    }
  }
}

// Export singleton instance
export const inspectApi = new InspectApiService();

// Export types
export type {
  Inspection,
  InspectionListParams,
  InspectionListResponse,
  CreateInspectionRequest,
  InspectionResponse,
  InspectionStats,
  InspectionDashboard,
  InspectionReportData
};
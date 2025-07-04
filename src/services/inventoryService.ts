import axios from 'axios';
import type { 
  LaptopResponse, 
  MonitorResponse, 
  PrinterResponse, 
  ToolResponse,
  ProjectorResponse,
  DeviceType,
  CreateDeviceData
} from '../types/inventory';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,

});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add timestamp to prevent caching
  if (config.method === 'get') {
    const separator = config.url?.includes('?') ? '&' : '?';
    config.url = `${config.url}${separator}_t=${Date.now()}`;
  }
  
  return config;
});

// Room interface
interface Room {
  _id: string;
  name: string;
  type?: string;
  capacity?: number;
  location?: Array<{
    building: string;
    floor: string;
  }>;
}

// Search and filter params interface
interface SearchFilterParams {
  search?: string;
  status?: string;
  manufacturer?: string;
  type?: string;
  assignedUser?: string;
  room?: string;
  releaseYear?: string;
}

// API params interface
interface ApiParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  manufacturer?: string;
  type?: string;
  assignedUser?: string;
  room?: string;
  releaseYear?: string;
}

// Create device function
const createDevice = async (deviceType: DeviceType, deviceData: CreateDeviceData) => {
  const endpoints = {
    laptop: '/laptops',
    monitor: '/monitors',
    printer: '/printers',
    projector: '/projectors',
    tool: '/tools',
  };

  // Get authorization token (adjust this based on your auth system)
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoints[deviceType]}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(deviceData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create device');
  }

  return response.json();
};

// Update device data interface
interface UpdateDeviceData {
  room?: string | null;
  name?: string;
  manufacturer?: string;
  serial?: string;
  status?: string;
  type?: string;
  releaseYear?: number;
  specs?: Record<string, string>;
  assigned?: string[];
  assignmentHistory?: Array<Record<string, unknown>>;
}

// Update device function
const updateDevice = async (deviceType: DeviceType, deviceId: string, updateData: UpdateDeviceData) => {
  const endpoints = {
    laptop: '/laptops',
    monitor: '/monitors',
    printer: '/printers',
    projector: '/projectors',
    tool: '/tools',
  };

  const response = await api.put(`${endpoints[deviceType]}/${deviceId}`, updateData);
  return response.data;
};

// Delete device function
const deleteDevice = async (deviceType: DeviceType, deviceId: string) => {
  const endpoints = {
    laptop: '/laptops',
    monitor: '/monitors',
    printer: '/printers',
    projector: '/projectors',
    tool: '/tools',
  };

  const response = await api.delete(`${endpoints[deviceType]}/${deviceId}`);
  return response.data;
};

export const inventoryService = {
  // Room APIs
  getAllRooms: async (): Promise<Room[]> => {
    const response = await api.get('/rooms');
    return response.data.rooms || response.data.data || [];
  },

  createRoom: async (roomData: Partial<Room>) => {
    const response = await api.post('/rooms', roomData);
    return response.data;
  },

  updateRoom: async (roomId: string, roomData: Partial<Room>) => {
    const response = await api.put(`/rooms/${roomId}`, roomData);
    return response.data;
  },

  deleteRoom: async (roomId: string) => {
    const response = await api.delete(`/rooms/${roomId}`);
    return response.data;
  },

  // Laptop APIs
  getLaptops: async (page = 1, limit = 20, filters?: SearchFilterParams): Promise<LaptopResponse> => {
    const params: ApiParams = { page, limit };
    if (filters?.search) params.search = filters.search;
    if (filters?.status) params.status = filters.status;
    if (filters?.manufacturer) params.manufacturer = filters.manufacturer;
    if (filters?.type) params.type = filters.type;
    if (filters?.releaseYear) params.releaseYear = filters.releaseYear;
    
    const response = await api.get(`/laptops`, { params });
    return response.data;
  },

  // Monitor APIs  
  getMonitors: async (page = 1, limit = 20, filters?: SearchFilterParams): Promise<MonitorResponse> => {
    const params: ApiParams = { page, limit };
    if (filters?.search) params.search = filters.search;
    if (filters?.status) params.status = filters.status;
    if (filters?.manufacturer) params.manufacturer = filters.manufacturer;
    if (filters?.type) params.type = filters.type;
    if (filters?.releaseYear) params.releaseYear = filters.releaseYear;
    
    const response = await api.get(`/monitors`, { params });
    return response.data;
  },

  // Printer APIs
  getPrinters: async (page = 1, limit = 20, filters?: SearchFilterParams): Promise<PrinterResponse> => {
    const params: ApiParams = { page, limit };
    if (filters?.search) params.search = filters.search;
    if (filters?.status) params.status = filters.status;
    if (filters?.manufacturer) params.manufacturer = filters.manufacturer;
    if (filters?.type) params.type = filters.type;
    if (filters?.releaseYear) params.releaseYear = filters.releaseYear;
    
    const response = await api.get(`/printers`, { params });
    return response.data;
  },

  // Tool APIs (no pagination)
  getTools: async (filters?: SearchFilterParams): Promise<ToolResponse> => {
    const params: ApiParams = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.status) params.status = filters.status;
    if (filters?.manufacturer) params.manufacturer = filters.manufacturer;
    if (filters?.type) params.type = filters.type;
    if (filters?.releaseYear) params.releaseYear = filters.releaseYear;
    
    const response = await api.get(`/tools`, { params });
    return response.data;
  },

  // Projector APIs
  getProjectors: async (page = 1, limit = 20, filters?: SearchFilterParams): Promise<ProjectorResponse> => {
    const params: ApiParams = { page, limit };
    if (filters?.search) params.search = filters.search;
    if (filters?.status) params.status = filters.status;
    if (filters?.manufacturer) params.manufacturer = filters.manufacturer;
    if (filters?.type) params.type = filters.type;
    if (filters?.releaseYear) params.releaseYear = filters.releaseYear;
    
    const response = await api.get(`/projectors`, { params });
    return response.data;
  },

  // Get filter options for each device type
  getFilterOptions: async (type: DeviceType) => {
    const response = await api.get(`/${type}s/filter-options`);
    return response.data;
  },

  // Generic method to get devices by type
  getDevicesByType: async (type: DeviceType, page = 1, limit = 20, filters?: SearchFilterParams) => {
    switch (type) {
      case 'laptop':
        return inventoryService.getLaptops(page, limit, filters);
      case 'monitor':
        return inventoryService.getMonitors(page, limit, filters);
      case 'printer':
        return inventoryService.getPrinters(page, limit, filters);
      case 'tool':
        return inventoryService.getTools(filters);
      case 'projector':
        return inventoryService.getProjectors(page, limit, filters);
      default:
        throw new Error(`Unknown device type: ${type}`);
    }
  },

  createDevice,

  // Get device detail by ID
  getDeviceById: async (type: DeviceType, id: string) => {
    const response = await api.get(`/${type}s/${id}`);
    return response.data;
  },

  // Update device
  updateDevice,

  // Delete device
  deleteDevice,

  // Assign device to room
  assignDeviceToRoom: async (type: DeviceType, deviceId: string, roomId: string) => {
    return updateDevice(type, deviceId, { room: roomId });
  },

  // Update device status with broken reason
  updateDeviceStatus: async (type: DeviceType, deviceId: string, status: string, brokenReason?: string) => {
    const response = await api.put(`/${type}s/${deviceId}/status`, {
      status,
      brokenReason
    });
    return response.data;
  },

  // Assign device to user
  assignDevice: async (type: DeviceType, deviceId: string, newUserId: string, notes?: string) => {
    const response = await api.post(`/${type}s/${deviceId}/assign`, {
      newUserId,
      notes
    });
    return response.data;
  },

  // Revoke device from user
  revokeDevice: async (type: DeviceType, deviceId: string, reasons: string[], status: string = 'Standby') => {
    const response = await api.post(`/${type}s/${deviceId}/revoke`, {
      reasons,
      status
    });
    return response.data;
  },

  // Generate handover document using template
  generateHandoverDocument: async (device: Record<string, unknown>, deviceType: DeviceType) => {
    try {
      // Import required libraries
      const PizZip = (await import('pizzip')).default;
      const Docxtemplater = (await import('docxtemplater')).default;

      // 1. Get current user info (người bàn giao)
      let currentUser = null;
      try {
        const userResponse = await api.get('/users/me');
        currentUser = userResponse.data;
        console.log('✅ Current user fetched:', currentUser);
      } catch (error) {
        console.error('❌ Error fetching current user:', error);
      }

      // 2. Load template file from /Template folder
      const response = await fetch('/Template/handover_template.docx');
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // 3. Create PizZip instance from template file
      const zip = new PizZip(arrayBuffer);

      // 4. Initialize Docxtemplater
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // 5. Get current assignment record
      const currentRecord = (device.assignmentHistory as Record<string, unknown>[])?.find(
        (history: Record<string, unknown>) => 
          history.user && 
          !history.endDate
      );

      // 6. Get device specs based on type
      const getSpecs = (device: Record<string, unknown>, deviceType: DeviceType) => {
        const specs = device.specs as Record<string, string> || {};
        switch (deviceType) {
          case 'laptop':
            return {
              processor: specs.processor || "Không xác định",
              ram: specs.ram || "Không xác định",
              storage: specs.storage || "Không xác định",
              display: specs.display || "Không xác định"
            };
          case 'monitor':
            return {
              processor: "Không xác định",
              ram: "Không xác định",
              storage: "Không xác định",
              display: specs.display || "Không xác định"
            };
          case 'printer':
            return {
              processor: "Không xác định",
              ram: specs.ram || "Không xác định",
              storage: specs.storage || "Không xác định",
              display: specs.ip || "Không xác định"
            };
          case 'projector':
            return {
              processor: specs.processor || "Không xác định",
              ram: "Không xác định",
              storage: "Không xác định",
              display: specs.display || "Không xác định"
            };
          case 'tool':
            return {
              processor: specs.processor || "Không xác định",
              ram: specs.ram || "Không xác định",
              storage: specs.storage || "Không xác định",
              display: specs.display || "Không xác định"
            };
          default:
            return {
              processor: "Không xác định",
              ram: "Không xác định",
              storage: "Không xác định",
              display: "Không xác định"
            };
        }
      };

      // 7. Prepare template data
      const assigned = device.assigned as Record<string, unknown>[] || [];
      const assignedUser = assigned[0] || {}; // Người nhận thiết bị
      
      console.log('✅ Assigned user:', assignedUser);
      console.log('✅ Device info:', {
        name: device.name,
        serial: device.serial,
        manufacturer: device.manufacturer,
        specs: device.specs
      });
      
      const templateData = {
        // Ngày hôm nay
        today: new Date().toLocaleDateString('vi-VN'),
        
        // Thông tin người bàn giao (người đang đăng nhập)
        currentUser: currentUser?.fullname || "Không xác định",
        currentUserTitle: currentUser?.jobTitle || 
                         (currentUser?.department ? `Nhân sự ${currentUser.department}` : "Nhân sự phòng Công nghệ thông tin"),
        
        // Thông tin người nhận thiết bị
        nextUser: (assignedUser.fullname as string) || "Không xác định",
        nextUserTitle: (assignedUser.jobTitle as string) || 
                      (assignedUser.department ? `Nhân sự ${assignedUser.department}` : "Không xác định"),
        
        // Thông tin thiết bị
        laptopName: (device.name as string) || "Không xác định",
        laptopSerial: (device.serial as string) || "Không xác định",
        laptopProcessor: (device.specs as Record<string, string>)?.processor || "Không xác định",
        laptopStorage: (device.specs as Record<string, string>)?.storage || "Không xác định", 
        laptopRam: (device.specs as Record<string, string>)?.ram || "Không xác định",
        laptopreleaseYear: device.releaseYear ? String(device.releaseYear) : "Không xác định",
        
        // Ghi chú
        notes: (currentRecord?.notes as string) || "Không có ghi chú.",
        
        // Thông tin bổ sung (giữ lại để tương thích với template cũ)
        fullname: (assignedUser.fullname as string) || "Không xác định",
        jobTitle: (assignedUser.jobTitle as string) || "Không xác định",
        department: (assignedUser.department as string) || "Không xác định",
        email: (assignedUser.email as string) || "Không xác định",
        laptopname: (device.name as string) || "Không xác định",
        laptopserial: (device.serial as string) || "Không xác định",
        laptopmanufacturer: (device.manufacturer as string) || "Không xác định",
        laptoptype: (device.type as string) || "Không xác định",
        currentDate: new Date().toLocaleDateString('vi-VN'),
        currentTime: new Date().toLocaleTimeString('vi-VN'),
        specs: getSpecs(device, deviceType)
      };

      console.log('✅ Template data prepared:', templateData);

      // 8. Render document with data
      doc.render(templateData);

      // 9. Generate buffer
      const buffer = doc.getZip().generate({
        type: 'arraybuffer',
        compression: 'DEFLATE',
      });

      // 10. Create blob and download
      const blob2 = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      // 11. Create download link
      const url = window.URL.createObjectURL(blob2);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bien-ban-ban-giao-${(assignedUser.fullname as string) || 'device'}-${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'Biên bản bàn giao đã được tải xuống' };
    } catch (error) {
      console.error('Error generating handover document:', error);
      throw error;
    }
  },

  // Upload handover report (PDF)
  uploadHandoverReport: async (file: File, type: DeviceType, deviceId: string, userId: string, username: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append(`${type}Id`, deviceId);
    formData.append('userId', userId);
    formData.append('username', username);

    const response = await api.post(`/${type}s/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  /* ---------- INSPECTION APIs ---------- */

/** Lấy bản kiểm tra mới nhất của một thiết bị */
getLatestInspection: async (deviceId: string) => {
  const res = await api.get(`/inspects/latest/${deviceId}`);
  return res.data;               // { message, data }
},

/** Lấy danh sách inspections (có filter) */
getInspections: async (params?: {
  deviceId?: string;
  inspectorId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const res = await api.get('/inspects', { params });
  return res.data;
},

/** Tạo inspection mới */
createInspection: async (payload: Record<string, unknown>) => {
  const res = await api.post('/inspects', payload);
  return res.data;
},

/** Cập nhật inspection */
updateInspection: async (inspectId: string, payload: Record<string, unknown>) => {
  const res = await api.put(`/inspects/${inspectId}`, payload);
  return res.data;
},

/** Xoá inspection */
deleteInspection: async (inspectId: string) => {
  const res = await api.delete(`/inspects/${inspectId}`);
  return res.data;
},

/** Upload biên bản (PDF) cho inspection */
uploadInspectionReport: async (inspectId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('inspectId', inspectId);

  const res = await api.post('/inspects/uploadReport', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
},

/**
 * Sinh file báo cáo kiểm tra thiết bị (inspection report) từ template inspection_report.docx
 * @param inspection: object chứa dữ liệu inspection (bao gồm results, technicalConclusion, ...)
 * @param device: object thiết bị (laptop, ...)
 * @param currentUser: người đang đăng nhập (có thể là kỹ thuật viên)
 * @param assignedUser: người sử dụng/QL thiết bị (có thể null)
 * @param inspector: thông tin kỹ thuật viên (nếu khác currentUser)
 * @param inspectId: ID của inspection để upload file lên backend
 */
generateInspectionReportDocument: async (
  inspection: Record<string, unknown>,
  device: Record<string, unknown>,
  currentUser: Record<string, unknown>,
  assignedUser: Record<string, unknown> | null,
  inspector: Record<string, unknown> | null = null,
  inspectId?: string
) => {
  try {
    const PizZip = (await import('pizzip')).default;
    const Docxtemplater = (await import('docxtemplater')).default;

    // 1. Load template file
    const response = await fetch('/Template/inspection_report.docx');
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const zip = new PizZip(arrayBuffer);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    // 2. Chuẩn hóa dữ liệu cho template
    const specs = (device.specs as Record<string, unknown>) || {};
    const today = new Date();
    const formatDate = (d: Date) => d.toLocaleDateString('vi-VN');
    const getVal = (obj: Record<string, unknown> | null | undefined, key: string, fallback = 'Không xác định') => (obj && obj[key]) ? obj[key] : fallback;

    // Lấy thông tin người sử dụng/QL thiết bị
    const userFullname = getVal(assignedUser, 'fullname');
    const userJobtitle = getVal(assignedUser, 'jobTitle');
    const userDepartment = getVal(assignedUser, 'department');

    // Lấy thông tin kỹ thuật viên
    const inspectorName = getVal(inspector || currentUser, 'fullname');
    const inspectorTitle = getVal(inspector || currentUser, 'jobTitle');

    // Lấy thông tin thiết bị
    const laptopName = getVal(device, 'name');
    const laptopSerial = getVal(device, 'serial');
    const laptopProcessor = getVal(specs, 'processor');
    const laptopStorage = getVal(specs, 'storage');
    const laptopRam = getVal(specs, 'ram');
    const laptopreleaseYear = device.releaseYear ? String(device.releaseYear) : 'Không xác định';

    // Lấy kết quả kiểm tra
    const results = (inspection.results as Record<string, unknown>) || {};
    // External
    const externalCondition_overallCondition = getVal(results.externalCondition as Record<string, unknown>, 'overallCondition', '');
    const externalCondition_notes = getVal(results.externalCondition as Record<string, unknown>, 'notes', '');
    // CPU
    const CPU_performance = getVal(results.cpu as Record<string, unknown>, 'performance', '');
    const CPU_temperature = getVal(results.cpu as Record<string, unknown>, 'temperature', '');
    const CPU_overallCondition = getVal(results.cpu as Record<string, unknown>, 'overallCondition', '');
    const CPU_notes = getVal(results.cpu as Record<string, unknown>, 'notes', '');
    // RAM
    const RAM_consumption = getVal(results.ram as Record<string, unknown>, 'consumption', '');
    const RAM_overallCondition = getVal(results.ram as Record<string, unknown>, 'overallCondition', '');
    const RAM_notes = getVal(results.ram as Record<string, unknown>, 'notes', '');
    // Storage
    const storage_remainingCapacity = getVal(results.storage as Record<string, unknown>, 'remainingCapacity', '');
    const storage_overallCondition = getVal(results.storage as Record<string, unknown>, 'overallCondition', '');
    const storage_notes = getVal(results.storage as Record<string, unknown>, 'notes', '');
    // Battery
    const battery_capacity = getVal(results.battery as Record<string, unknown>, 'capacity', '');
    const battery_performance = getVal(results.battery as Record<string, unknown>, 'performance', '');
    const battery_chargeCycles = getVal(results.battery as Record<string, unknown>, 'chargeCycles', '');
    const battery_overallCondition = getVal(results.battery as Record<string, unknown>, 'overallCondition', '');
    const battery_notes = getVal(results.battery as Record<string, unknown>, 'notes', '');
    // Display
    const display_colorAndBrightness = getVal(results.display as Record<string, unknown>, 'colorAndBrightness', '');
    const display_overallCondition = getVal(results.display as Record<string, unknown>, 'overallCondition', '');
    const display_notes = getVal(results.display as Record<string, unknown>, 'notes', '');
    // Connectivity
    const connectivity_overallCondition = getVal(results.connectivity as Record<string, unknown>, 'overallCondition', '');
    const connectivity_notes = getVal(results.connectivity as Record<string, unknown>, 'notes', '');
    // Software
    const software_overallCondition = getVal(results.software as Record<string, unknown>, 'overallCondition', '');
    const software_notes = getVal(results.software as Record<string, unknown>, 'notes', '');
    // Kết luận
    const conclusion = (inspection.technicalConclusion as string) || '';
    const recommendation = (inspection.followUpRecommendation as string) || '';

    // 3. Chuẩn bị data cho template
    const templateData = {
      today: formatDate(today),
      userDepartment,
      userFullname,
      userJobtitle,
      inspectorName,
      inspectorTitle,
      laptopName,
      laptopSerial,
      laptopProcessor,
      laptopStorage,
      laptopRam,
      laptopreleaseYear,
      externalCondition_overallCondition,
      externalCondition_notes,
      CPU_performance,
      CPU_temperature,
      CPU_overallCondition,
      CPU_notes,
      RAM_consumption,
      RAM_overallCondition,
      RAM_notes,
      storage_remainingCapacity,
      storage_overallCondition,
      storage_notes,
      battery_capacity,
      battery_performance,
      battery_chargeCycles,
      battery_overallCondition,
      battery_notes,
      display_colorAndBrightness,
      display_overallCondition,
      display_notes,
      connectivity_overallCondition,
      connectivity_notes,
      software_overallCondition,
      software_notes,
      conclusion,
      recommendation
    };

    // 4. Render docx
    doc.setData(templateData);
    doc.render();
    const buffer = doc.getZip().generate({ type: 'arraybuffer', compression: 'DEFLATE' });
    const blob2 = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // 5. Upload file lên backend nếu có inspectId
    if (inspectId) {
      const formData = new FormData();
      formData.append('file', blob2, `Bao-cao-kiem-tra-thiet-bi-${laptopName || 'device'}-${formatDate(today)}.docx`);
      formData.append('inspectId', inspectId);

      const uploadResponse = await api.post('/inspects/uploadReport', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('✅ File DOCX đã được upload lên backend:', uploadResponse.data);
      return { success: true, message: 'Báo cáo kiểm tra đã được tạo và lưu thành công' };
    } else {
      // Fallback: tải xuống nếu không có inspectId
      const url = window.URL.createObjectURL(blob2);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bao-cao-kiem-tra-thiet-bi-${laptopName || 'device'}-${formatDate(today)}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true, message: 'Báo cáo kiểm tra đã được tải xuống' };
    }
  } catch (error) {
    console.error('Lỗi khi sinh báo cáo kiểm tra:', error);
    throw error;
  }
},

/** Fetch activities for a device */
fetchActivities: async (deviceType: DeviceType, deviceId: string) => {
  const response = await fetch(`${API_BASE_URL}/activities/${deviceType}/${deviceId}`);
  if (!response.ok) return [];
  return await response.json();
},

/** Fetch current user info */
fetchCurrentUser: async () => {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (!response.ok) return null;
  return await response.json();
},

/** Thêm activity mới cho thiết bị */
addActivity: async (activityData: Record<string, unknown>) => {
  const response = await fetch(`${API_BASE_URL}/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(activityData),
  });
  if (!response.ok) throw new Error('Failed to add activity');
  return await response.json();
},

/** Xóa activity */
deleteActivity: async (activityId: string) => {
  const response = await fetch(`${API_BASE_URL}/activities/${activityId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
  });
  if (!response.ok) throw new Error('Failed to delete activity');
  return await response.json();
},

}; 


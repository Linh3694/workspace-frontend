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
  uploadHandoverReport: async (type: DeviceType, deviceId: string, userId: string, username: string, file: File) => {
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
}; 
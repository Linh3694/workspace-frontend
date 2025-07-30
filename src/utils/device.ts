import { DEVICE_TYPES, DEVICE_STATUS, DEVICE_TYPE_LABELS, DEVICE_STATUS_LABELS } from '../constants';

/**
 * Device utility functions
 */

/**
 * Get device type label
 */
export const getDeviceTypeLabel = (deviceType: string): string => {
  return DEVICE_TYPE_LABELS[deviceType as keyof typeof DEVICE_TYPE_LABELS] || deviceType;
};

/**
 * Get device status label
 */
export const getDeviceStatusLabel = (status: string): string => {
  return DEVICE_STATUS_LABELS[status as keyof typeof DEVICE_STATUS_LABELS] || status;
};

/**
 * Check if device is assigned
 */
export const isDeviceAssigned = (device: any): boolean => {
  return device.status === DEVICE_STATUS.ACTIVE || 
         (device.current_assignment && device.current_assignment.length > 0) ||
         (device.assigned && device.assigned.length > 0);
};

/**
 * Check if device is available for assignment
 */
export const isDeviceAvailable = (device: any): boolean => {
  return device.status === DEVICE_STATUS.STANDBY;
};

/**
 * Check if device is broken
 */
export const isDeviceBroken = (device: any): boolean => {
  return device.status === DEVICE_STATUS.BROKEN;
};

/**
 * Check if device needs documentation
 */
export const needsDocumentation = (device: any): boolean => {
  return device.status === DEVICE_STATUS.PENDING_DOCUMENTATION;
};

/**
 * Get device status color
 */
export const getDeviceStatusColor = (status: string): string => {
  const colorMap = {
    [DEVICE_STATUS.ACTIVE]: 'green',
    [DEVICE_STATUS.STANDBY]: 'blue',
    [DEVICE_STATUS.BROKEN]: 'red',
    [DEVICE_STATUS.PENDING_DOCUMENTATION]: 'orange',
  };
  
  return colorMap[status as keyof typeof colorMap] || 'gray';
};

/**
 * Get device icon
 */
export const getDeviceIcon = (deviceType: string): string => {
  const iconMap = {
    [DEVICE_TYPES.LAPTOP]: '💻',
    [DEVICE_TYPES.MONITOR]: '🖥️',
    [DEVICE_TYPES.PRINTER]: '🖨️',
    [DEVICE_TYPES.PROJECTOR]: '📽️',
    [DEVICE_TYPES.PHONE]: '📱',
    [DEVICE_TYPES.TOOL]: '🔧',
  };
  
  return iconMap[deviceType as keyof typeof iconMap] || '📦';
};

/**
 * Generate device display name
 */
export const generateDeviceDisplayName = (device: any): string => {
  const parts = [];
  
  if (device.manufacturer) {
    parts.push(device.manufacturer);
  }
  
  if (device.device_name) {
    parts.push(device.device_name);
  }
  
  if (device.serial_number) {
    parts.push(`(${device.serial_number})`);
  }
  
  return parts.join(' ') || 'Thiết bị không tên';
};

/**
 * Get current assignment info
 */
export const getCurrentAssignment = (device: any): any | null => {
  if (device.current_assignment && device.current_assignment.length > 0) {
    return device.current_assignment[0];
  }
  
  // Fallback to legacy format
  if (device.assigned && device.assigned.length > 0) {
    return {
      assigned_to: device.assigned[0],
      assigned_date: device.assignmentHistory?.[0]?.startDate,
      notes: device.assignmentHistory?.[0]?.notes
    };
  }
  
  return null;
};

/**
 * Get assignment history
 */
export const getAssignmentHistory = (device: any): any[] => {
  if (device.assignment_history && device.assignment_history.length > 0) {
    return device.assignment_history.sort((a: any, b: any) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
  }
  
  // Fallback to legacy format
  if (device.assignmentHistory && device.assignmentHistory.length > 0) {
    return device.assignmentHistory
      .map((history: any) => ({
        user: history.user,
        user_name: history.userName,
        job_title: history.jobTitle,
        start_date: history.startDate,
        end_date: history.endDate,
        notes: history.notes,
        assigned_by: history.assignedBy,
        revoked_by: history.revokedBy,
        revoked_reason: history.revokedReason,
        document: history.document
      }))
      .sort((a: any, b: any) => 
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
  }
  
  return [];
};

/**
 * Get device specs summary
 */
export const getDeviceSpecsSummary = (device: any): string[] => {
  const specs: string[] = [];
  
  if (!device.specs) {
    return specs;
  }
  
  // Common specs for all devices
  if (device.specs.model) {
    specs.push(`Model: ${device.specs.model}`);
  }
  
  // Laptop/Desktop specific specs
  if (device.device_type === DEVICE_TYPES.LAPTOP) {
    if (device.specs.processor) {
      specs.push(`CPU: ${device.specs.processor}`);
    }
    if (device.specs.ram) {
      specs.push(`RAM: ${device.specs.ram}`);
    }
    if (device.specs.storage) {
      specs.push(`Storage: ${device.specs.storage}`);
    }
    if (device.specs.display) {
      specs.push(`Display: ${device.specs.display}`);
    }
  }
  
  // Monitor specific specs
  if (device.device_type === DEVICE_TYPES.MONITOR) {
    if (device.specs.screenSize) {
      specs.push(`Kích thước: ${device.specs.screenSize}`);
    }
    if (device.specs.resolution) {
      specs.push(`Độ phân giải: ${device.specs.resolution}`);
    }
  }
  
  // Phone specific specs
  if (device.device_type === DEVICE_TYPES.PHONE) {
    if (device.specs.imei) {
      specs.push(`IMEI: ${device.specs.imei}`);
    }
    if (device.specs.storage) {
      specs.push(`Storage: ${device.specs.storage}`);
    }
  }
  
  // Printer specific specs
  if (device.device_type === DEVICE_TYPES.PRINTER) {
    if (device.specs.printType) {
      specs.push(`Loại in: ${device.specs.printType}`);
    }
    if (device.specs.connectivity) {
      specs.push(`Kết nối: ${device.specs.connectivity}`);
    }
  }
  
  // Projector specific specs
  if (device.device_type === DEVICE_TYPES.PROJECTOR) {
    if (device.specs.brightness) {
      specs.push(`Độ sáng: ${device.specs.brightness}`);
    }
    if (device.specs.resolution) {
      specs.push(`Độ phân giải: ${device.specs.resolution}`);
    }
  }
  
  return specs;
};

/**
 * Check if device needs inspection
 */
export const needsInspection = (device: any, lastInspectionDate?: string): boolean => {
  if (!lastInspectionDate) {
    return true; // Never inspected
  }
  
  const lastInspection = new Date(lastInspectionDate);
  const now = new Date();
  const daysSinceInspection = Math.floor((now.getTime() - lastInspection.getTime()) / (1000 * 60 * 60 * 24));
  
  // Need inspection if more than 90 days or device is broken
  return daysSinceInspection > 90 || isDeviceBroken(device);
};

/**
 * Calculate device age
 */
export const calculateDeviceAge = (releaseYear: number): number => {
  return new Date().getFullYear() - releaseYear;
};

/**
 * Check if device is old
 */
export const isDeviceOld = (releaseYear: number, threshold = 5): boolean => {
  return calculateDeviceAge(releaseYear) >= threshold;
};

/**
 * Get device summary stats
 */
export const getDeviceSummaryStats = (devices: any[]): {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  assigned: number;
  available: number;
  broken: number;
  oldDevices: number;
} => {
  const stats = {
    total: devices.length,
    byType: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    assigned: 0,
    available: 0,
    broken: 0,
    oldDevices: 0
  };
  
  devices.forEach(device => {
    // By type
    const type = device.device_type || 'unknown';
    stats.byType[type] = (stats.byType[type] || 0) + 1;
    
    // By status
    const status = device.status || 'unknown';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    
    // Quick stats
    if (isDeviceAssigned(device)) {
      stats.assigned++;
    }
    if (isDeviceAvailable(device)) {
      stats.available++;
    }
    if (isDeviceBroken(device)) {
      stats.broken++;
    }
    if (device.release_year && isDeviceOld(device.release_year)) {
      stats.oldDevices++;
    }
  });
  
  return stats;
};

/**
 * Filter devices by criteria
 */
export const filterDevices = (devices: any[], filters: {
  search?: string;
  type?: string;
  status?: string;
  manufacturer?: string;
  assigned?: boolean;
}): any[] => {
  return devices.filter(device => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableText = [
        device.device_name,
        device.serial_number,
        device.manufacturer,
        generateDeviceDisplayName(device)
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(searchTerm)) {
        return false;
      }
    }
    
    // Type filter
    if (filters.type && device.device_type !== filters.type) {
      return false;
    }
    
    // Status filter
    if (filters.status && device.status !== filters.status) {
      return false;
    }
    
    // Manufacturer filter
    if (filters.manufacturer && device.manufacturer !== filters.manufacturer) {
      return false;
    }
    
    // Assignment filter
    if (filters.assigned !== undefined) {
      const isAssigned = isDeviceAssigned(device);
      if (filters.assigned !== isAssigned) {
        return false;
      }
    }
    
    return true;
  });
};
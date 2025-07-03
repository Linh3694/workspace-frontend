// Common interfaces for all devices
export interface BaseDevice {
  _id: string;
  name: string;
  manufacturer?: string;
  serial: string;
  status: 'Active' | 'Standby' | 'Broken' | 'PendingDocumentation';
  assigned?: User[];
  room?: Room;
  createdAt: string;
  updatedAt: string;
  assignmentHistory?: AssignmentHistory[];
  currentHolder?: CurrentHolder;
  reason?: string;
  brokenReason?: string;
  releaseYear?: number;
  type?: string;
}

export interface User {
  _id: string;
  fullname: string;
  email?: string;
  jobTitle?: string;
  department?: string;
  avatarUrl?: string;
}

export interface Room {
  _id: string;
  name: string;
  location?: string[] | LocationDetail[];
  status?: string;
}

export interface LocationDetail {
  building: string;
  floor: string;
}

export interface CurrentHolder {
  id: string;
  fullname: string;
  jobTitle?: string;
  department?: string;
  avatarUrl?: string;
}

export interface AssignmentHistory {
  _id?: string;
  user?: User;
  userName?: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  assignedBy?: User;
  revokedBy?: User;
  revokedReason?: string;
  jobTitle?: string;
  document?: string;
}

// Specific device interfaces
export interface Laptop extends BaseDevice {
  specs?: {
    processor?: string;
    ram?: string;
    storage?: string;
    display?: string;
  };
}

export interface Monitor extends BaseDevice {
  specs?: {
    display?: string;
  };
}

export interface Printer extends BaseDevice {
  specs?: {
    ip?: string;
    ram?: string;
    storage?: string;
    display?: string;
  };
}

export interface Tool extends BaseDevice {
  specs?: {
    processor?: string;
    ram?: string;
    storage?: string;
    display?: string;
  };
}

export interface Projector extends BaseDevice {
  specs?: {
    processor?: string;
    ram?: string;
    storage?: string;
    display?: string;
  };
}

// API Response interfaces
export interface PaginatedResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface LaptopResponse {
  populatedLaptops: Laptop[];
  pagination: PaginatedResponse;
}

export interface MonitorResponse {
  populatedMonitors: Monitor[];
  pagination: PaginatedResponse;
}

export interface PrinterResponse {
  populatedPrinters: Printer[];
  pagination: PaginatedResponse;
}

export interface ToolResponse {
  populatedTools: Tool[];
}

export interface ProjectorResponse {
  populatedProjectors: Projector[];
  pagination: PaginatedResponse;
}

// Device types
export type DeviceType = 'laptop' | 'monitor' | 'printer' | 'tool' | 'projector';
export type Device = Laptop | Monitor | Printer | Tool | Projector;

export interface CreateDeviceData {
  name: string;
  manufacturer: string;
  serial: string;
  releaseYear: number;
  type: string;
  status: string;
  specs: Record<string, string>;
  reason?: string;
  assigned: string[];
  room: string | null;
} 
// Types and Enums
export type TicketStatus = "Open" | "Processing" | "Assigned" | "Done" | "Closed" | "Cancelled" | "Waiting for Customer";
export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";
export type SubTaskStatus = "In Progress" | "Completed" | "Cancelled";
export type TabType = "request" | "progress" | "discussion";
export type FilterType = "all" | "assignedToMe";
export type SortDirection = "asc" | "desc" | null;

// Base interfaces
export interface User {
  _id: string;
  id: string;
  fullname: string;
  email: string;
  role: string;
  avatarUrl?: string;
  jobTitle?: string;
}

export interface Attachment {
  url: string;
  filename?: string;
}

export interface SubTask {
  _id: string;
  title: string;
  status: SubTaskStatus;
  assignedTo?: string;
}

export interface HistoryLog {
  action: string;
  timestamp: string;
  user?: string;
}

export interface Ticket {
  _id: string;
  ticketCode: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: string;
  createdAt: string;
  updatedAt: string;
  sla: string;
  creator: User;
  assignedTo?: User;
  attachments?: Attachment[];
  notes?: string;
  subTasks: SubTask[];
  history: HistoryLog[];
  cancellationReason?: string;
}

export interface StatusOption {
  value: TicketStatus;
  label: string;
  bg: string;
}

export interface SortConfig {
  key: string | null;
  direction: SortDirection;
}

// API Response types
export interface TicketsResponse {
  success: boolean;
  tickets: Ticket[];
  message?: string;
}

export interface TicketResponse {
  success: boolean;
  ticket: Ticket;
  message?: string;
}

export interface UsersResponse {
  success: boolean;
  users?: User[];
  message?: string;
}

export interface TechnicalUsersResponse {
  success: boolean;
  members: User[];
  message?: string;
}

export interface UpdateTicketResponse {
  success: boolean;
  ticket?: Ticket;
  message?: string;
}

// Constants
export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  Low: "Thấp",
  Medium: "Trung bình", 
  High: "Cao",
  Urgent: "Khẩn cấp",
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  Open: "Chưa nhận",
  Processing: "Đang xử lý",
  Assigned: "Đã nhận",
  Done: "Hoàn thành",
  Closed: "Đóng",
  Cancelled: "Đã huỷ",
  "Waiting for Customer": "Chờ phản hồi",
};

export const PRIORITY_ORDER: Record<TicketPriority, number> = { 
  Low: 1, 
  Medium: 2, 
  High: 3, 
  Urgent: 4 
}; 
export interface LeaveRequest {
  _id: string;
  student: {
    _id: string;
    name: string;
    studentCode: string;
    class: string;
  };
  reason: 'sick' | 'family' | 'bereavement' | 'other';
  description: string;
  startDate: string;
  endDate: string;
  leaveType: 'full_day' | 'morning' | 'afternoon';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  approvalNote?: string;
  approvedBy?: {
    _id: string;
    fullname: string;
  };
  approvedAt?: string;
  createdBy: {
    _id: string;
    fullname: string;
    email: string;
    phone: string;
  };
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
}

export interface LeaveRequestCreateData {
  student: string;
  reason: string;
  description: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  createdBy: string;
}

export interface LeaveRequestUpdateData {
  reason?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  leaveType?: string;
}

export interface LeaveRequestApprovalData {
  approvalNote?: string;
  approvedBy: string;
} 
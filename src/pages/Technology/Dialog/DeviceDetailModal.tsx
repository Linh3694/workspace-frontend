import React, { useState, useEffect, useRef } from 'react';
import { User, MapPin, Eye, UserX, UserRoundPlus, FilePlus, MapPinPlus, Monitor, Cpu, HardDrive, MemoryStick, Clock, Download, AlertTriangle, Plus, Trash2, Flower2, Upload, Wrench, History, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Textarea } from '../../../components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip';
import { getAvatarUrl, getInitials } from '../../../lib/utils';
import { inventoryService } from '../../../services/inventoryService';
import type { DeviceType } from '../../../types/inventory';
import { useAuth } from '../../../contexts/AuthContext';
import AssignRoomModal from './AssignRoomModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import AssignDeviceModal from './AssignDeviceModal';
import RevokeDeviceModal from './RevokeDeviceModal';
import InspectModal from './InspectModal';
import CreateInspectModal from './CreateInspectModal';
import EditSpecsModal from './EditSpecsModal';
import EditBasicInfoModal from './EditBasicInfoModal';

interface DeviceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceType: DeviceType;
  deviceId: string | null;
  onDeviceUpdated?: () => void;
}

interface DeviceDetail {
  _id: string;
  name: string;
  manufacturer?: string;
  serial: string;
  type?: string;
  status: string;
  releaseYear?: number;
  specs?: Record<string, string>;
  // Phone specific fields
  imei1?: string;
  imei2?: string;
  phoneNumber?: string;
  room?: {
    name: string;
    location: string[] | Array<{building: string; floor: string}>;
  };
  assigned?: Array<{
    _id: string;
    fullname: string;
    jobTitle: string;
    department?: string;
    avatarUrl?: string;
  }>;
  assignmentHistory?: Array<{
    _id: string;
    user: {
      fullname: string;
      jobTitle: string;
      avatarUrl?: string;
    };
    userName: string;
    startDate: string;
    endDate?: string;
    notes?: string;
    document?: string;
    assignedBy?: {
      fullname: string;
    };
    revokedBy?: {
      fullname: string;
    };
    revokedReason?: string[];
  }>;
  reason?: string;
  brokenReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface Activity {
  _id: string;
  entityType: string;
  entityId: string;
  type: 'repair' | 'update';
  description: string;
  details?: string;
  date: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

type InspectionDataType = {
  overallAssessment?: string;
  results?: { overallAssessment?: string };
  inspectionDate?: string;
  inspectorName?:  string;
  createdBy?: { fullname?: string } | string;
  technicalConclusion?: string;
};

// Status badge styling
const getStatusBadge = (status: string) => {
  const statusConfig = {
    'Active': { label: 'Đang sử dụng', className: 'bg-[#002855] text-white' },
    'Standby': { label: 'Sẵn sàng bàn giao', className: 'bg-[#009483] text-white' },
    'Broken': { label: 'Hỏng', className: 'bg-[#F05023] text-white' },
    'PendingDocumentation': { label: 'Thiếu biên bản', className: 'bg-[#F5AA1E] text-white' },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Standby'];
  return (
    <Badge className={`${config.className} font-semibold`}>
      {config.label}
    </Badge>
  );
};

// Format specs based on device type
const formatSpecs = (specs: Record<string, string> | undefined, deviceType: DeviceType) => {
  if (!specs) return [];
  
  const specsArray = [];
  
  switch (deviceType) {
    case 'laptop':
      if (specs.processor) specsArray.push({ icon: Cpu, label: 'Bộ xử lý', value: specs.processor });
      if (specs.ram) specsArray.push({ icon: MemoryStick, label: 'RAM', value: specs.ram });
      if (specs.storage) specsArray.push({ icon: HardDrive, label: 'Ổ cứng', value: specs.storage });
      if (specs.display) specsArray.push({ icon: Monitor, label: 'Màn hình', value: specs.display });
      break;
    case 'monitor':
      if (specs.display) specsArray.push({ icon: Monitor, label: 'Màn hình', value: specs.display });
      break;
    case 'printer':
      if (specs.ip) specsArray.push({ icon: Monitor, label: 'IP Address', value: specs.ip });
      if (specs.ram) specsArray.push({ icon: MemoryStick, label: 'RAM', value: specs.ram });
      if (specs.storage) specsArray.push({ icon: HardDrive, label: 'Storage', value: specs.storage });
      break;
    case 'projector':
      if (specs.processor) specsArray.push({ icon: Cpu, label: 'Bộ xử lý', value: specs.processor });
      if (specs.display) specsArray.push({ icon: Monitor, label: 'Độ phân giải', value: specs.display });
      break;
    case 'phone':
      if (specs.processor) specsArray.push({ icon: Cpu, label: 'Bộ xử lý', value: specs.processor });
      if (specs.ram) specsArray.push({ icon: MemoryStick, label: 'RAM', value: specs.ram });
      if (specs.storage) specsArray.push({ icon: HardDrive, label: 'Bộ nhớ', value: specs.storage });
      if (specs.display) specsArray.push({ icon: Monitor, label: 'Màn hình', value: specs.display });
      break;
    case 'tool':
      if (specs.processor) specsArray.push({ icon: Cpu, label: 'Bộ xử lý', value: specs.processor });
      if (specs.ram) specsArray.push({ icon: MemoryStick, label: 'RAM', value: specs.ram });
      if (specs.storage) specsArray.push({ icon: HardDrive, label: 'Ổ cứng', value: specs.storage });
      if (specs.display) specsArray.push({ icon: Monitor, label: 'Màn hình', value: specs.display });
      break;
  }
  
  return specsArray;
};

const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({ 
  open, 
  onOpenChange, 
  deviceType, 
  deviceId,
  onDeviceUpdated
}) => {
  const { user } = useAuth();
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isAssignRoomModalOpen, setIsAssignRoomModalOpen] = useState(false);
  
  // Delete room modal state
  const [isDeleteRoomModalOpen, setIsDeleteRoomModalOpen] = useState(false);
  
  // Report broken modal state
  const [isReportBrokenModalOpen, setIsReportBrokenModalOpen] = useState(false);
  const [brokenReason, setBrokenReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  // Revive device modal state
  const [isReviveModalOpen, setIsReviveModalOpen] = useState(false);
  const [isReviving, setIsReviving] = useState(false);

  // Assign device modal state
  const [isAssignDeviceModalOpen, setIsAssignDeviceModalOpen] = useState(false);

  // Revoke device modal state
  const [isRevokeDeviceModalOpen, setIsRevokeDeviceModalOpen] = useState(false);

  // Upload handover modal state
  const [isUploadHandoverModalOpen, setIsUploadHandoverModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add activity modal state
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'repair' as 'repair' | 'update',
    description: '',
    details: ''
  });
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  // Inspect modal state
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);

  // Edit specs modal state
  const [isEditSpecsModalOpen, setIsEditSpecsModalOpen] = useState(false);

  // Edit basic info modal state
  const [isEditBasicInfoModalOpen, setIsEditBasicInfoModalOpen] = useState(false);

  // Delete activity state
  const [isDeletingActivity, setIsDeletingActivity] = useState<string | null>(null);
  const [isDeleteActivityModalOpen, setIsDeleteActivityModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);

  // Create inspect modal state
  const [isCreateInspectModalOpen, setIsCreateInspectModalOpen] = useState(false);
  
  // Inspection data state
  const [hasInspectionData, setHasInspectionData] = useState(false);
  const [inspectionData, setInspectionData] = useState<InspectionDataType | null>(null);

  // Delete device modal state
  const [isDeleteDeviceModalOpen, setIsDeleteDeviceModalOpen] = useState(false);

  useEffect(() => {
    if (open && deviceId) {
      fetchDeviceDetail();
      fetchActivities();
      checkInspectionData();
    }
  }, [open, deviceId, deviceType]);

  const checkInspectionData = async () => {
    if (!deviceId) return;
    try {
      const res = await inventoryService.getLatestInspection(deviceId);
      setHasInspectionData(!!res.data);
      setInspectionData(res.data || null);
    } catch {
      setHasInspectionData(false);
      setInspectionData(null);
    }
  };

  const fetchDeviceDetail = async () => {
    if (!deviceId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await inventoryService.getDeviceById(deviceType, deviceId);
      setDevice(data);
    } catch (err) {
      console.error('Error fetching device detail:', err);
      setError('Không thể tải thông tin chi tiết thiết bị.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivities = async () => {
    if (!deviceId) return;
    try {
      const data = await inventoryService.fetchActivities(deviceType, deviceId);
      setActivities(data);
    } catch (err) {
      console.error('Error fetching activities:', err);
      // Không set error vì activities không phải thông tin quan trọng
    }
  };

  const handleDownloadDocument = (document: string) => {
    // Extract filename from document path
    const filename = document.split('/').pop() || document;
    const downloadUrl = `${import.meta.env.VITE_BASE_URL}/uploads/Handovers/${filename}`;
    window.open(downloadUrl, '_blank');
  };

  const handleAssignRoomSuccess = () => {
    // Refresh device data after successful room assignment
    fetchDeviceDetail();
  };

  const handleAssignDeviceSuccess = () => {
    fetchDeviceDetail();
    fetchActivities();
    if (onDeviceUpdated) onDeviceUpdated();
  };

  const handleRevokeDeviceSuccess = () => {
    // Refresh device data after successful device revoke
    fetchDeviceDetail();
  };

  const handleAddActivity = async () => {
    if (!deviceId || !newActivity.description.trim()) return;
    setIsAddingActivity(true);
    try {
      await inventoryService.addActivity({
        entityType: deviceType,
        entityId: deviceId,
        type: newActivity.type,
        description: newActivity.description.trim(),
        details: newActivity.details.trim() || undefined,
        updatedBy: user?.fullname || 'Không xác định',
      });
      await fetchActivities(); // Refresh activities
      setIsAddActivityModalOpen(false);
      setNewActivity({ type: 'repair', description: '', details: '' });
    } catch (err) {
      console.error('Error adding activity:', err);
    } finally {
      setIsAddingActivity(false);
    }
  };

  const handleDeleteActivity = (activity: Activity) => {
    setActivityToDelete(activity);
    setIsDeleteActivityModalOpen(true);
  };

  const handleDeleteActivityConfirm = async () => {
    if (!activityToDelete) return;
    
    setIsDeletingActivity(activityToDelete._id);
    try {
      await inventoryService.deleteActivity(activityToDelete._id);
      await fetchActivities();
      onDeviceUpdated?.();
      setIsDeleteActivityModalOpen(false);
      setActivityToDelete(null);
    } catch (err) {
      console.error('Error deleting activity:', err);
    } finally {
      setIsDeletingActivity(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const currentUser = getCurrentUser();
    if (!file || !currentUser || !deviceId) {
      if (!currentUser) {
        setError('Không thể xác định người sử dụng thiết bị. Vui lòng kiểm tra lại thông tin bàn giao.');
      }
      return;
    }

    setIsUploading(true);
    try {
      // Gọi service chuẩn
      await inventoryService.uploadHandoverReport(
        file,
        deviceType,
        deviceId,
        currentUser._id,
        currentUser.fullname,
      );

      // Nếu thiết bị đang ở trạng thái "Thiếu biên bản", cập nhật sang "Đang sử dụng"
      if (device && device.status === 'PendingDocumentation') {
        try {
          await inventoryService.updateDeviceStatus(deviceType, deviceId, 'Active');
        } catch (statusError) {
          console.error('Error updating device status:', statusError);
        }
      }

      await fetchDeviceDetail();
      setIsUploadHandoverModalOpen(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading handover document:', error);
      setError('Không thể tải lên biên bản bàn giao.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateHandoverDocument = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser || !deviceId) {
      if (!currentUser) {
        setError('Không thể xác định người sử dụng thiết bị. Vui lòng kiểm tra lại thông tin bàn giao.');
      }
      return;
    }

    try {
      await inventoryService.generateHandoverDocument(
        device as unknown as Record<string, unknown>,
        deviceType
      );
    } catch (err) {
      console.error('Error generating handover document:', err);
      setError('Không thể tạo biên bản bàn giao.');
    }
  };

  // Delete room handlers
  const handleDeleteRoom = () => {
    setIsDeleteRoomModalOpen(true);
  };

  const handleDeleteRoomConfirm = async () => {
    if (!device?.room || !deviceId) return;
    
    try {
      // Remove room assignment from device by updating device with room = null
      await inventoryService.updateDevice(deviceType, deviceId, { room: null });
      await fetchDeviceDetail(); // Refresh device data
    } catch (err) {
      console.error('Error removing room assignment:', err);
      setError('Không thể xóa gán phòng cho thiết bị.');
      throw err; // Re-throw to let modal handle it
    }
  };

  // Report broken handlers
  const handleReportBroken = () => {
    setBrokenReason('');
    setIsReportBrokenModalOpen(true);
  };

  const handleReportBrokenConfirm = async () => {
    if (!deviceId || !brokenReason.trim()) return;
    
    setIsReporting(true);
    try {
      await inventoryService.updateDeviceStatus(deviceType, deviceId, 'Broken', brokenReason.trim());
      await fetchDeviceDetail(); // Refresh device data
      setIsReportBrokenModalOpen(false);
      setBrokenReason('');
    } catch (err) {
      console.error('Error reporting device as broken:', err);
      setError('Không thể báo hỏng thiết bị.');
      throw err; // Re-throw to let modal handle it
    } finally {
      setIsReporting(false);
    }
  };

  // Revive device handlers
  const handleReviveDevice = () => {
    setIsReviveModalOpen(true);
  };

  const handleReviveConfirm = async () => {
    if (!deviceId) return;
    
    setIsReviving(true);
    try {
      // Cập nhật trạng thái thiết bị về Standby
      await inventoryService.updateDeviceStatus(deviceType, deviceId, 'Standby');
      
      // Xóa toàn bộ lịch sử bàn giao bằng cách cập nhật assignmentHistory thành mảng rỗng
      await inventoryService.updateDevice(deviceType, deviceId, {
        assignmentHistory: []
      });
      
      await fetchDeviceDetail(); // Refresh device data
      setIsReviveModalOpen(false);
    } catch (err) {
      console.error('Error reviving device:', err);
      setError('Không thể hồi sinh thiết bị.');
      throw err; // Re-throw to let modal handle it
    } finally {
      setIsReviving(false);
    }
  };

  // Hàm kiểm tra thiết bị đã được bàn giao hay chưa
  const isDeviceAssigned = () => {
    if (!device) return false;
    
    // 1. Kiểm tra assignmentHistory có record đang mở (chưa có endDate)
    if (device.assignmentHistory && device.assignmentHistory.length > 0) {
      const openRecord = device.assignmentHistory.find(assignment => !assignment.endDate);
      if (openRecord) return true;
    }
    
    // 2. Kiểm tra assigned array
    if (device.assigned && device.assigned.length > 0) {
      return true;
    }
    
    return false;
  };

  // Hàm lấy thông tin người sử dụng hiện tại
  const getCurrentUser = () => {
    if (!device) return null;
    
    // 1. Tìm record đang mở trong assignmentHistory
    if (device.assignmentHistory && device.assignmentHistory.length > 0) {
      const openRecord = device.assignmentHistory.find(assignment => !assignment.endDate);
      if (openRecord && openRecord.user) {
        // assignmentHistory.user không có _id, nhưng vẫn có thể sử dụng
        // Chuyển đổi sang format tương thích với assigned
        return {
          _id: openRecord._id, // Sử dụng _id của assignment record
          fullname: openRecord.user.fullname,
          jobTitle: openRecord.user.jobTitle,
          avatarUrl: openRecord.user.avatarUrl,
          department: undefined // assignmentHistory.user không có department
        };
      }
    }
    
    // 2. Fallback về assigned array
    if (device.assigned && device.assigned.length > 0) {
      return device.assigned[0];
    }
    
    return null;
  };

  // Hàm kiểm tra có thể bàn giao thiết bị hay không
  const canAssignDevice = () => {
    return device && 
           (device.status === 'Standby' || 
            (device.status !== 'Broken' && !isDeviceAssigned()));
  };

  // Get current assignment document for download button
  const getCurrentAssignmentDocument = () => {
    if (!device?.assignmentHistory) return null;
    
    const currentAssignment = device.assignmentHistory.find(
      assignment => !assignment.endDate && assignment.document
    );
    
    return currentAssignment?.document || null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const specs = device ? formatSpecs(device.specs, deviceType) : [];

  if (!open) return null;


  const handleDownloadLatestInspectionReport = async () => {
    if (!deviceId) return;
    try {
      const res = await inventoryService.getLatestInspection(deviceId);
      const { documentUrl, _id: inspectId } = res.data ?? {};
      
      if (documentUrl && documentUrl !== '#') {
        // Tải file đã có sẵn
        const filename = documentUrl.split('/').pop() || 'report.docx';
        const downloadUrl = `${import.meta.env.VITE_BASE_URL}/uploads/reports/${filename}`;
        window.open(downloadUrl, '_blank');
      } else if (inspectId) {
        // Tạo file DOCX mới từ inspection data
        const deviceResponse = await inventoryService.getDeviceById(deviceType, deviceId);
        const currentUserResponse = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const currentUser = await currentUserResponse.json();
        
        await inventoryService.generateInspectionReportDocument(
          res.data,
          deviceResponse,
          currentUser,
          deviceResponse.assigned?.[0] || null,
          null,
          inspectId
        );
      } else {
        console.warn('No inspection data found for this device.');
      }
    } catch (err) {
      console.error('Error downloading inspection report:', err);
    }
  };

  // Liquidate device handlers
const handleLiquidateDevice = () => {
  setIsDeleteDeviceModalOpen(true);
};

const handleLiquidateConfirm = async () => {
  if (!deviceId) return;
  try {
    await inventoryService.deleteDevice(deviceType, deviceId);
    setIsDeleteDeviceModalOpen(false);
    onOpenChange(false);          // đóng modal chi tiết
    if (onDeviceUpdated) onDeviceUpdated();
  } catch (err) {
    console.error('Error deleting device:', err);
    setError('Không thể xoá thiết bị.');
  }
};


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-3">
          <span>Chi tiết thiết bị</span>
        </DialogTitle>
      </DialogHeader>

      <div className="flex-1 overflow-auto space-y-6">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-500">{error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={fetchDeviceDetail}
              >
                Thử lại
              </Button>
            </div>
          </div>
        )}

        {device && !isLoading && !error && (
          <>
            {/* Basic Information and Technical Specifications - Same Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-5 w-5" />
                      <span>Thông tin cơ bản</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditBasicInfoModalOpen(true)}
                          className="text-[#002855] border-[#002855] hover:bg-blue-50 h-8 w-8 p-0"
                        >
                          <Wrench className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Chỉnh sửa thông tin</TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tên thiết bị</p>
                        <p className="text-sm font-semibold">{device.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Serial</p>
                        <p className="text-sm font-semibold">{device.serial}</p>
                      </div>
                      {deviceType === 'phone' && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">IMEI 1</p>
                          <p className="text-sm font-semibold font-mono">{device.imei1 || 'Chưa cập nhật'}</p>
                        </div>
                      )}
                     
                      {deviceType === 'phone' && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Số điện thoại</p>
                          <p className="text-sm font-semibold font-mono">{device.phoneNumber || 'Chưa cập nhật'}</p>
                        </div>
                      )}
                     
                    </div>
                    <div className="space-y-3">
                      {device.type && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Loại</p>
                          <p className="text-sm font-semibold">{device.type}</p>
                        </div>
                      )}
                      {device.releaseYear && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Năm sản xuất</p>
                          <p className="text-sm font-semibold">{device.releaseYear}</p>
                        </div>
                      )}
                       {deviceType === 'phone' && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">IMEI 2</p>
                          <p className="text-sm font-semibold font-mono">{device.imei2 || 'Chưa cập nhật'}</p>
                        </div>
                      )}
                       {device.manufacturer && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Hãng sản xuất</p>
                          <p className="text-sm font-semibold">{device.manufacturer}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                        <div className="mt-1">
                          {getStatusBadge(device.status)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {device.status === 'Broken' && (device.reason || device.brokenReason) && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-medium text-red-800">Lý do báo hỏng</p>
                      <p className="text-red-700">{device.reason || device.brokenReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Technical Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cpu className="h-5 w-5" />
                      <span>Thông số kỹ thuật</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditSpecsModalOpen(true)}
                            className="text-[#002855] border-[#002855] hover:bg-blue-50 h-8 w-8 p-0"
                          >
                            <Wrench className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Cập nhật thông số</TooltipContent>
                      </Tooltip>
                      {device.status !== 'Broken' ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={handleReportBroken}
                              className="h-8 w-8 p-0"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Báo hỏng</TooltipContent>
                        </Tooltip>
                      ) : (
                       <div className="flex space-x-2">
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReviveDevice}
          className="text-[#009483] border-green-300 hover:bg-green-50 h-8 w-8 p-0"
        >
          <Flower2 className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Hồi sinh</TooltipContent>
    </Tooltip>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleLiquidateDevice}
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Thanh lý</TooltipContent>
    </Tooltip>
  </div>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {specs.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {specs.map((spec, index) => {
                        const Icon = spec.icon;
                        return (
                          <div key={index} className="flex items-center space-x-3">
                            <Icon className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-500">{spec.label}</p>
                              <p className="text-sm font-semibold">{spec.value}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="flex flex-col items-center space-y-2">
                        <Cpu className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-500">Chưa có thông số kỹ thuật</p>
                        <p className="text-xs text-gray-400">Nhấn nút chỉnh sửa để thêm thông số</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Current Assignment and Assignment History - Same Row */}
            <div className="grid grid-cols-2 gap-4">
                              {/* Current Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Thông tin sử dụng hiện tại</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsHistoryDialogOpen(true)}
                          className="h-8 w-8 p-0"
                          title="Xem lịch sử"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Lịch sử</TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isDeviceAssigned() ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getCurrentUser() ? (
                          <>
                            <Avatar className="h-12 w-12">
                              <AvatarImage 
                                src={getCurrentUser()?.avatarUrl ? getAvatarUrl(getCurrentUser()!.avatarUrl) : undefined} 
                                alt={getCurrentUser()?.fullname}
                                className="object-cover object-top" 
                              />
                              <AvatarFallback>
                                {getInitials(getCurrentUser()?.fullname || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{getCurrentUser()?.fullname}</p>
                              <p className="text-sm text-gray-500">{getCurrentUser()?.jobTitle}</p>
                              {getCurrentUser()?.department && (
                                <p className="text-xs text-gray-400">{getCurrentUser()?.department}</p>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback>
                                <User className="h-6 w-6" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-500">Thông tin người dùng không hợp lệ</p>
                              <p className="text-sm text-gray-400">Vui lòng kiểm tra lại dữ liệu bàn giao</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-row space-x-2">
                        {getCurrentAssignmentDocument() && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadDocument(getCurrentAssignmentDocument()!)}
                                className="text-xs"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Biên bản</TooltipContent>
                          </Tooltip>
                        )}
                        {device.status === 'PendingDocumentation' && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleGenerateHandoverDocument}
                                  className="text-xs text-[#002855] border-[#002855] hover:bg-green-50"
                                >
                                  <FilePlus className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Tạo biên bản</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setIsUploadHandoverModalOpen(true)}
                                  className="text-xs text-[#002855] border-[#002855] hover:bg-blue-50"
                                >
                                  <Upload className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Cập nhật</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsRevokeDeviceModalOpen(true)}
                              className="text-xs text-orange-600 border-orange-700 hover:bg-orange-50 hover:text-orange-600"
                            >
                              <UserX className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Thu hồi</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-gray-500">Chưa có người sử dụng</p>
                      <div className="flex flex-col space-y-2">
                        {canAssignDevice() && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAssignDeviceModalOpen(true)}
                                className="text-xs text-[#002855] border-[#002855] hover:bg-blue-50"
                              >
                                <UserRoundPlus className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Bàn giao</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

                {/* Location Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>Địa điểm sử dụng</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {device.room ? (
                        <div>
                          <div className="flex items-center justify-center">
                            <div className="flex-1">
                              <p className="font-medium">{device.room.name}</p>
                              <p className="text-sm mt-1 text-gray-600">
                                {Array.isArray(device.room.location) 
                                  ? device.room.location.map(loc => {
                                      if (typeof loc === 'string') {
                                        return loc;
                                      } else if (typeof loc === 'object' && loc && 'building' in loc && 'floor' in loc) {
                                        const roomLoc = loc as { building: string; floor: string };
                                        return `${roomLoc.building}, tầng ${roomLoc.floor}`;
                                      }
                                      return 'Không xác định';
                                    }).join(' • ')
                                  : typeof device.room.location === 'string' 
                                    ? device.room.location
                                    : 'Không xác định vị trí'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 ml-3">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDeleteRoom}
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                    title="Xóa gán phòng"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Xóa gán phòng</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                                              ) : (
                         <div>
                           <div className="flex items-center justify-between">
                             <div className="flex items-center space-x-3">
                               <MapPin className="h-5 w-5 text-gray-400" />
                               <div>
                                 <p className="font-medium text-gray-600">Chưa xác định vị trí</p>
                                 <p className="text-sm text-gray-500">Thiết bị chưa được gán vào phòng cụ thể</p>
                               </div>
                             </div>
                             <div className="flex items-center space-x-1 ml-3">
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={() => setIsAssignRoomModalOpen(true)}
                                     className="h-8 w-8 p-0"
                                   >
                                     <MapPinPlus className="h-4 w-4" />
                                   </Button>
                                 </TooltipTrigger>
                                 <TooltipContent>Gán phòng</TooltipContent>
                               </Tooltip>
                             </div>
                           </div>
                         </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activities and Inspections */}
              <div className="grid grid-cols-2 gap-4">
                {/* Activities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Wrench className="h-5 w-5" />
                        <span>Nhật ký sửa chữa</span>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddActivityModalOpen(true)}
                            className="text-xs h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Thêm nhật ký</TooltipContent>
                      </Tooltip>
                    </CardTitle>
                  </CardHeader>
                <CardContent>
                  {activities.length > 0 ? (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {activities
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((activity) => (
                        <div key={activity._id} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {activity.description}
                              </p>
                              <div className="flex items-center space-x-2">
                                <Badge variant={activity.type === 'repair' ? 'destructive' : 'default'} className="text-xs">
                                  {activity.type === 'repair' ? 'Sửa chữa' : 'Cập nhật'}
                                </Badge>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteActivity(activity)}
                                      disabled={isDeletingActivity === activity._id}
                                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      {isDeletingActivity === activity._id ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500"></div>
                                      ) : (
                                        <Trash2 className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Xóa nhật ký</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            {activity.details && (
                              <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                            )}
                                                         <div className="flex items-center justify-between mt-2">
                               <p className="text-xs text-gray-500">
                                 {formatDate(activity.date)}
                               </p>
                               <div className="flex items-center space-x-1">
                                 <User className="h-3 w-3 text-gray-400" />
                                 <p className="text-xs text-gray-500">
                                   {activity.updatedBy || 'Hệ thống'}
                                 </p>
                               </div>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <History className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Chưa có nhật ký sửa chữa</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Inspections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5" />
                      <span>Kiểm tra định kỳ</span>
                    </div>
                    <div className="flex space-x-2">
                      {hasInspectionData && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadLatestInspectionReport}
                                className="text-xs h-8 w-8 p-0"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Tải báo cáo</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsInspectModalOpen(true)}
                                className="text-xs h-8 w-8 p-0"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Xem chi tiết</TooltipContent>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setIsCreateInspectModalOpen(true)}
                            className="text-xs h-8 w-8 p-0"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Kiểm tra thiết bị</TooltipContent>
                      </Tooltip>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasInspectionData ? (
                    <div className="text-center py-6">
                      {/* Thông báo theo đánh giá tổng thể */}
                      {(() => {
                        const oa = inspectionData?.overallAssessment || inspectionData?.results?.overallAssessment || '';
                        if (oa === 'Tốt') {
                          return (
                            <div className="flex flex-col items-center mb-2 gap-4">
                              <div className="flex flex-row items-center gap-2">
                                <CheckCircle className="h-10 w-10 text-[#009483] mb-1" />
                                <span className="text-[#009483] font-semibold text-3xl flex items-center">
                                  Tốt
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 space-y-1 mt-1 text-center">
                                <p>
                                  <strong>Ngày kiểm tra:</strong> {inspectionData?.inspectionDate ? formatDate(inspectionData.inspectionDate) : 'Không rõ'}
                                </p>
                                <p>
                                  <strong>Người kiểm tra:</strong> {
                                    inspectionData?.inspectorName || 'Không rõ' 
                                  }
                                </p>
                                <p>
                                  <strong>Kết luận kỹ thuật:</strong> {inspectionData?.technicalConclusion || 'Không có'}
                                </p>
                              </div>
                            </div>
                          );
                        } else if (oa === 'Trung Bình') {
                          return (
                            <div className="flex flex-col items-center mb-2 gap-4">
                              <div className="flex flex-row items-center gap-2">
                                <AlertTriangle className="h-8 w-8 text-yellow-400 mb-1" />
                                <span className="bg-yellow-400 text-white font-semibold text-2xl px-3 py-1 rounded flex items-center">Trung Bình</span>
                              </div>
                              <div className="text-xs text-gray-400 space-y-1 mt-1 text-center">
                                <p>
                                  <strong>Ngày kiểm tra:</strong> {inspectionData?.inspectionDate ? formatDate(inspectionData.inspectionDate) : 'Không rõ'}
                                </p>
                                <p>
                                  <strong>Người kiểm tra:</strong> {
                                    inspectionData?.inspectorName || 'Không rõ' 
                                  }
                                </p>
                                <p>
                                  <strong>Kết luận kỹ thuật:</strong> {inspectionData?.technicalConclusion || 'Không có'}
                                </p>
                              </div>
                            </div>
                          );
                        } else if (oa === 'Kém') {
                          return (
                            <div className="flex flex-col items-center mb-2 gap-4">
                              <div className="flex flex-row items-center gap-2">
                                <AlertTriangle className="h-8 w-8 text-red-500 mb-1" />
                                <span className="bg-red-500 text-white font-semibold text-2xl px-3 py-1 rounded flex items-center">Kém</span>
                              </div>
                              <div className="text-xs text-gray-400 space-y-1 mt-1 text-center">
                                <p>
                                  <strong>Ngày kiểm tra:</strong> {inspectionData?.inspectionDate ? formatDate(inspectionData.inspectionDate) : 'Không rõ'}
                                </p>
                                <p>
                                  <strong>Người kiểm tra:</strong> {
                                    inspectionData?.inspectorName || 'Không rõ' 
                                  }
                                </p>
                                <p>
                                  <strong>Kết luận kỹ thuật:</strong> {inspectionData?.technicalConclusion || 'Không có'}
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="text-xs text-gray-400">
                        <p>Chưa có dữ liệu kiểm tra</p>
                        <p>Nhấn "Kiểm tra" để tạo bản kiểm tra đầu tiên</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            </>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </div>
      </DialogContent>

      {/* Assignment History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Lịch sử bàn giao - {device?.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {device?.assignmentHistory && device.assignmentHistory.length > 0 ? (
              <div className="space-y-4">
                {device.assignmentHistory
                  .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                  .map((assignment, index) => (
                  <div key={assignment._id || index} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={assignment.user?.avatarUrl ? getAvatarUrl(assignment.user.avatarUrl) : undefined} 
                        alt={assignment.user?.fullname || assignment.userName}
                        className="object-cover object-top" 
                      />
                      <AvatarFallback>
                        {getInitials(assignment.user?.fullname || assignment.userName || '')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{assignment.user?.fullname || assignment.userName}</p>
                          <p className="text-sm text-gray-500">{assignment.user?.jobTitle}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            Bắt đầu: {formatDate(assignment.startDate)}
                          </p>
                          {assignment.endDate && (
                            <p className="text-sm text-red-500">
                              Kết thúc: {formatDate(assignment.endDate)}
                            </p>
                          )}
                          {!assignment.endDate && (
                            <Badge variant="default" className="mt-1">
                              Đang sử dụng
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {assignment.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Ghi chú:</strong> {assignment.notes}
                        </p>
                      )}
                      
                      {assignment.document && (
                        <div className="mt-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadDocument(assignment.document!)}
                                className="h-8 w-8 p-0"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Tải biên bản bàn giao</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                      
                      {assignment.revokedReason && assignment.revokedReason.length > 0 && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                          <p className="text-sm font-medium text-orange-800">Lý do thu hồi:</p>
                          <ul className="text-sm text-orange-700 list-disc list-inside mt-1">
                            {assignment.revokedReason.map((reason, idx) => (
                              <li key={idx}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {(assignment.assignedBy || assignment.revokedBy) && (
                        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                          {assignment.assignedBy && (
                            <p>Bàn giao bởi: {assignment.assignedBy.fullname}</p>
                          )}
                          {assignment.revokedBy && (
                            <p>Thu hồi bởi: {assignment.revokedBy.fullname}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có lịch sử bàn giao</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Room Modal */}
      <AssignRoomModal
        open={isAssignRoomModalOpen}
        onOpenChange={setIsAssignRoomModalOpen}
        deviceType={deviceType}
        deviceId={deviceId}
        deviceName={device?.name || ''}
        onAssignSuccess={handleAssignRoomSuccess}
      />

      {/* Delete Room Assignment Confirmation Modal */}
      <DeleteConfirmationModal
        open={isDeleteRoomModalOpen}
        onOpenChange={setIsDeleteRoomModalOpen}
        onConfirm={handleDeleteRoomConfirm}
        title="Xác nhận xóa gán phòng"
        description="Bạn có chắc chắn muốn xóa việc gán phòng cho thiết bị này? Thiết bị sẽ không còn được gán vào phòng nào."
        itemName={device?.room?.name}
      />

      {/* Report Broken Modal */}
      <Dialog open={isReportBrokenModalOpen} onOpenChange={setIsReportBrokenModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Báo hỏng thiết bị</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Thiết bị: <span className="font-medium">{device?.name}</span>
              </p>
              {user && (
                <p className="text-sm text-gray-600 mb-4">
                  Người thực hiện: <span className="font-medium">{user.fullname}</span>
                </p>
              )}
              
              <Textarea
                placeholder="Mô tả chi tiết lý do báo hỏng thiết bị..."
                value={brokenReason}
                onChange={(e) => setBrokenReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setIsReportBrokenModalOpen(false)}
                disabled={isReporting}
              >
                Hủy
              </Button>
              <Button
                variant="outline"
                onClick={handleReportBrokenConfirm}
                disabled={!brokenReason.trim() || isReporting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isReporting ? 'Đang báo hỏng...' : 'Báo hỏng'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revive Device Confirmation Modal */}
      <Dialog open={isReviveModalOpen} onOpenChange={setIsReviveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Flower2 className="h-5 w-5 text-[#009483]" />
              <span>Hồi sinh thiết bị</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Thiết bị: <span className="font-medium">{device?.name}</span>
              </p>
              <p className="text-sm text-gray-600">
                Bạn có chắc chắn muốn hồi sinh thiết bị này? Thiết bị sẽ được chuyển về trạng thái "Sẵn sàng bàn giao".
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setIsReviveModalOpen(false)}
                disabled={isReviving}
              >
                Hủy
              </Button>
              <Button
                onClick={handleReviveConfirm}
                disabled={isReviving}
                className="bg-[#009483] hover:bg-green-700 text-white"
              >
                {isReviving ? 'Đang hồi sinh...' : 'Hồi sinh'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Device Modal */}
      <AssignDeviceModal
        open={isAssignDeviceModalOpen}
        onOpenChange={setIsAssignDeviceModalOpen}
        deviceType={deviceType}
        deviceId={deviceId}
        deviceName={device?.name || ''}
        onAssignSuccess={handleAssignDeviceSuccess}
      />

      {/* Revoke Device Modal */}
      <RevokeDeviceModal
        open={isRevokeDeviceModalOpen}
        onOpenChange={setIsRevokeDeviceModalOpen}
        deviceType={deviceType}
        deviceId={deviceId}
        deviceName={device?.name || ''}
        currentUser={getCurrentUser() as {_id: string; fullname: string; jobTitle: string; department?: string; avatarUrl?: string} | undefined}
        onRevokeSuccess={handleRevokeDeviceSuccess}
      />

      {/* Upload Handover Modal */}
      <Dialog open={isUploadHandoverModalOpen} onOpenChange={setIsUploadHandoverModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-[#002855]" />
              <span>Tải lên biên bản bàn giao</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Thiết bị: <span className="font-medium">{device?.name}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Người sử dụng: <span className="font-medium">{getCurrentUser()?.fullname || 'Không xác định'}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Trạng thái: <span className="font-medium text-orange-600">Thiếu biên bản</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Tải lên biên bản bàn giao để chuyển thiết bị sang trạng thái "Đang sử dụng":
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Đang tải lên...' : 'Chọn file'}
              </Button>
            </div>

            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setIsUploadHandoverModalOpen(false)}
                disabled={isUploading}
              >
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Activity Modal */}
      <Dialog open={isAddActivityModalOpen} onOpenChange={setIsAddActivityModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Wrench className="h-5 w-5" />
              <span>Thêm nhật ký sửa chữa</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Thiết bị: <span className="font-medium">{device?.name}</span>
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Loại hoạt động</label>
                  <div className="flex space-x-2 mt-1">
                    <Button
                      type="button"
                      variant={newActivity.type === 'repair' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewActivity(prev => ({ ...prev, type: 'repair' }))}
                      className="text-xs"
                    >
                      Sửa chữa
                    </Button>
                    <Button
                      type="button"
                      variant={newActivity.type === 'update' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewActivity(prev => ({ ...prev, type: 'update' }))}
                      className="text-xs"
                    >
                      Cập nhật
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Mô tả *</label>
                  <Textarea
                    placeholder="Mô tả hoạt động..."
                    value={newActivity.description}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Chi tiết</label>
                  <Textarea
                    placeholder="Chi tiết bổ sung (tùy chọn)..."
                    value={newActivity.details}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, details: e.target.value }))}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setIsAddActivityModalOpen(false)}
                disabled={isAddingActivity}
              >
                Hủy
              </Button>
              <Button
                onClick={handleAddActivity}
                disabled={!newActivity.description.trim() || isAddingActivity}
              >
                {isAddingActivity ? 'Đang thêm...' : 'Thêm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inspect Modal */}
      <InspectModal
        open={isInspectModalOpen}
        onOpenChange={setIsInspectModalOpen}
        deviceType={deviceType}
        deviceId={deviceId}
        deviceName={device?.name || ''}
      />

      {/* Create Inspect Modal */}
      <CreateInspectModal
        open={isCreateInspectModalOpen}
        onOpenChange={setIsCreateInspectModalOpen}
        deviceType={deviceType}
        deviceId={deviceId}
        deviceName={device?.name || ''}
        onSuccess={() => {
          setIsCreateInspectModalOpen(false);
          // Refresh device data and inspection data after successful inspection
          fetchDeviceDetail();
          checkInspectionData();
        }}
      />

      <DeleteConfirmationModal
        open={isDeleteDeviceModalOpen}
        title="Xác nhận thanh lý thiết bị"
        description="Sau khi thanh lý, thiết bị sẽ bị xoá vĩnh viễn khỏi hệ thống. Bạn chắc chắn muốn tiếp tục?"  
        onConfirm={handleLiquidateConfirm}
        onOpenChange={setIsDeleteDeviceModalOpen}
      />

      {/* Delete Activity Confirmation Modal */}
      <DeleteConfirmationModal
        open={isDeleteActivityModalOpen}
        title="Xác nhận xóa nhật ký"
        description={`Bạn có chắc chắn muốn xóa nhật ký "${activityToDelete?.description}"? Hành động này không thể hoàn tác.`}
        onConfirm={handleDeleteActivityConfirm}
        onOpenChange={setIsDeleteActivityModalOpen}
      />

      {/* Edit Specs Modal */}
      <EditSpecsModal
        open={isEditSpecsModalOpen}
        onOpenChange={setIsEditSpecsModalOpen}
        deviceType={deviceType}
        deviceId={deviceId || ''}
        currentSpecs={device?.specs}
        onSpecsUpdated={() => {
          fetchDeviceDetail();
          onDeviceUpdated?.();
        }}
      />

      {/* Edit Basic Info Modal */}
      <EditBasicInfoModal
        open={isEditBasicInfoModalOpen}
        onOpenChange={setIsEditBasicInfoModalOpen}
        deviceType={deviceType}
        deviceId={deviceId || ''}
        currentInfo={{
          name: device?.name,
          manufacturer: device?.manufacturer,
          serial: device?.serial,
          type: device?.type,
          releaseYear: device?.releaseYear,
          // Phone specific fields
          imei1: device?.imei1,
          imei2: device?.imei2,
          phoneNumber: device?.phoneNumber
        }}
        onInfoUpdated={() => {
          fetchDeviceDetail();
          onDeviceUpdated?.();
        }}
      />
    </Dialog>
  );
};

export default DeviceDetailModal; 
import React, { useState } from 'react';
import { UserX, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Checkbox } from '../../../components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { getAvatarUrl, getInitials } from '../../../lib/utils';
import { inventoryService } from '../../../services/inventoryService';
import type { DeviceType } from '../../../types/inventory';

interface RevokeDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceType: DeviceType;
  deviceId: string | null;
  deviceName: string;
  currentUser?: {
    _id: string;
    fullname: string;
    jobTitle: string;
    department?: string;
    avatarUrl?: string;
  };
  onRevokeSuccess: () => void;
}

const REVOKE_REASONS = [
  'Hết thời gian sử dụng',
  'Chuyển công tác',
  'Thôi việc',
  'Thiết bị cần bảo trì',
  'Thiết bị có vấn đề kỹ thuật',
  'Yêu cầu từ quản lý',
  'Khác'
];

const RevokeDeviceModal: React.FC<RevokeDeviceModalProps> = ({
  open,
  onOpenChange,
  deviceType,
  deviceId,
  deviceName,
  currentUser,
  onRevokeSuccess
}) => {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReasonChange = (reason: string, checked: boolean) => {
    if (checked) {
      setSelectedReasons(prev => [...prev, reason]);
    } else {
      setSelectedReasons(prev => prev.filter(r => r !== reason));
      if (reason === 'Khác') {
        setCustomReason('');
      }
    }
  };

  const handleRevoke = async () => {
    if (!deviceId || selectedReasons.length === 0) return;

    setIsRevoking(true);
    setError(null);

    try {
      // Prepare final reasons list
      let finalReasons = [...selectedReasons];
      if (selectedReasons.includes('Khác') && customReason.trim()) {
        finalReasons = finalReasons.filter(r => r !== 'Khác');
        finalReasons.push(customReason.trim());
      }

      await inventoryService.revokeDevice(deviceType, deviceId, finalReasons, 'Standby');
      onRevokeSuccess();
      onOpenChange(false);
      
      // Reset form
      setSelectedReasons([]);
      setCustomReason('');
    } catch (err: unknown) {
      console.error('Error revoking device:', err);
      setError(err instanceof Error ? err.message : 'Không thể thu hồi thiết bị.');
    } finally {
      setIsRevoking(false);
    }
  };

  const resetForm = () => {
    setSelectedReasons([]);
    setCustomReason('');
    setError(null);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(open) => {
        if (!open) resetForm();
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserX className="h-5 w-5 text-orange-600" />
            <span>Thu hồi thiết bị</span>
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            Thiết bị: <span className="font-medium">{deviceName}</span>
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Current User Info */}
          {currentUser && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={currentUser.avatarUrl ? getAvatarUrl(currentUser.avatarUrl) : undefined}
                    alt={currentUser.fullname}
                    className="object-cover object-top"
                  />
                  <AvatarFallback>
                    {getInitials(currentUser.fullname)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-blue-900">{currentUser.fullname}</p>
                  <p className="text-sm text-blue-700">{currentUser.jobTitle}</p>
                  {currentUser.department && (
                    <p className="text-sm text-blue-600">{currentUser.department}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Revoke Reasons */}
          <div className="space-y-3">
            <Label>Lý do thu hồi thiết bị</Label>
            <div className="space-y-2">
              {REVOKE_REASONS.map((reason) => (
                <div key={reason} className="flex items-center space-x-3">
                  <Checkbox
                    id={reason}
                    checked={selectedReasons.includes(reason)}
                    onCheckedChange={(checked) => handleReasonChange(reason, checked as boolean)}
                  />
                  <Label htmlFor={reason} className="text-sm cursor-pointer">
                    {reason}
                  </Label>
                </div>
              ))}
            </div>

            {/* Custom Reason */}
            {selectedReasons.includes('Khác') && (
              <div className="mt-3">
                <Label htmlFor="customReason">Lý do khác</Label>
                <Textarea
                  id="customReason"
                  placeholder="Nhập lý do cụ thể..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={3}
                  className="resize-none mt-1"
                />
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="flex items-start space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-orange-800 text-sm font-medium">Lưu ý</p>
              <p className="text-orange-700 text-sm">
                Sau khi thu hồi, thiết bị sẽ chuyển về trạng thái "Sẵn sàng bàn giao" và có thể được bàn giao cho người khác.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isRevoking}
          >
            Hủy
          </Button>
          <Button
            onClick={handleRevoke}
            disabled={selectedReasons.length === 0 || isRevoking || (selectedReasons.includes('Khác') && !customReason.trim())}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isRevoking ? 'Đang thu hồi...' : 'Thu hồi'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RevokeDeviceModal; 
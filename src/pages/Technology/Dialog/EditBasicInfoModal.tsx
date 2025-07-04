import React, { useState, useEffect } from 'react';
import { X, Save, Monitor } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

import { inventoryService } from '../../../services/inventoryService';
import type { DeviceType } from '../../../types/inventory';

interface EditBasicInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceType: DeviceType;
  deviceId: string;
  currentInfo?: {
    name?: string;
    manufacturer?: string;
    serial?: string;
    type?: string;
    releaseYear?: number;
  };
  onInfoUpdated?: () => void;
}

const EditBasicInfoModal: React.FC<EditBasicInfoModalProps> = ({
  open,
  onOpenChange,
  deviceType,
  deviceId,
  currentInfo = {},
  onInfoUpdated
}) => {
  const [info, setInfo] = useState({
    name: '',
    manufacturer: '',
    serial: '',
    type: '',
    releaseYear: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cập nhật thông tin khi modal mở
  useEffect(() => {
    if (open) {
      setInfo({
        name: currentInfo.name || '',
        manufacturer: currentInfo.manufacturer || '',
        serial: currentInfo.serial || '',
        type: currentInfo.type || '',
        releaseYear: currentInfo.releaseYear ? currentInfo.releaseYear.toString() : ''
      });
      setError(null);
    }
  }, [open, currentInfo]);

  // Xử lý thay đổi giá trị
  const handleInfoChange = (key: string, value: string) => {
    setInfo(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Xử lý lưu thông tin
  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const updateData: Record<string, string | number> = {};
      
      if (info.name.trim()) updateData.name = info.name.trim();
      if (info.manufacturer.trim()) updateData.manufacturer = info.manufacturer.trim();
      if (info.serial.trim()) updateData.serial = info.serial.trim();
      if (info.type.trim()) updateData.type = info.type.trim();
      if (info.releaseYear.trim()) {
        const year = parseInt(info.releaseYear);
        if (year >= 1900 && year <= new Date().getFullYear() + 1) {
          updateData.releaseYear = year;
        } else {
          setError('Năm sản xuất không hợp lệ');
          setIsLoading(false);
          return;
        }
      }

      await inventoryService.updateDevice(deviceType, deviceId, updateData);

      onInfoUpdated?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Error updating basic info:', err);
      setError('Không thể cập nhật thông tin cơ bản. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate form
  const isValid = info.name.trim() && info.serial.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Chỉnh sửa thông tin cơ bản</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Monitor className="h-5 w-5" />
                <span>Thông tin cơ bản</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Tên thiết bị *</Label>
                    <Input
                      id="name"
                      value={info.name}
                      onChange={(e) => handleInfoChange('name', e.target.value)}
                      placeholder="Nhập tên thiết bị"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serial">Serial *</Label>
                    <Input
                      id="serial"
                      value={info.serial}
                      onChange={(e) => handleInfoChange('serial', e.target.value)}
                      placeholder="Nhập số serial"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manufacturer">Hãng sản xuất</Label>
                    <Input
                      id="manufacturer"
                      value={info.manufacturer}
                      onChange={(e) => handleInfoChange('manufacturer', e.target.value)}
                      placeholder="Nhập hãng sản xuất"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="type">Loại thiết bị</Label>
                    <Input
                      id="type"
                      value={info.type}
                      onChange={(e) => handleInfoChange('type', e.target.value)}
                      placeholder="Nhập loại thiết bị"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="releaseYear">Năm sản xuất</Label>
                    <Input
                      id="releaseYear"
                      type="number"
                      value={info.releaseYear}
                      onChange={(e) => handleInfoChange('releaseYear', e.target.value)}
                      placeholder="Ví dụ: 2023"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isValid || isLoading}
              className="bg-[#002855] hover:bg-[#002855]/90"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Đang lưu...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Lưu thay đổi</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditBasicInfoModal; 
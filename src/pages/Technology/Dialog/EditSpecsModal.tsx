import React, { useState, useEffect } from 'react';
import { X, Save, Cpu, MemoryStick, HardDrive, Monitor } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { inventoryService } from '../../../services/inventoryService';
import type { DeviceType } from '../../../types/inventory';

interface EditSpecsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceType: DeviceType;
  deviceId: string;
  currentSpecs?: Record<string, string>;
  onSpecsUpdated?: () => void;
}

interface SpecField {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
}

const EditSpecsModal: React.FC<EditSpecsModalProps> = ({
  open,
  onOpenChange,
  deviceType,
  deviceId,
  currentSpecs = {},
  onSpecsUpdated
}) => {
  const [specs, setSpecs] = useState<Record<string, string>>(currentSpecs);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Định nghĩa các trường thông số theo loại thiết bị
  const getSpecFields = (): SpecField[] => {
    switch (deviceType) {
      case 'laptop':
        return [
          { key: 'processor', label: 'Bộ xử lý', icon: Cpu, placeholder: 'Ví dụ: Intel Core i7-10700K' },
          { key: 'ram', label: 'RAM', icon: MemoryStick, placeholder: 'Ví dụ: 16GB DDR4' },
          { key: 'storage', label: 'Ổ cứng', icon: HardDrive, placeholder: 'Ví dụ: 512GB SSD' },
          { key: 'display', label: 'Màn hình', icon: Monitor, placeholder: 'Ví dụ: 15.6" Full HD' }
        ];
      case 'monitor':
        return [
          { key: 'display', label: 'Màn hình', icon: Monitor, placeholder: 'Ví dụ: 24" 1920x1080' }
        ];
      case 'printer':
        return [
          { key: 'ip', label: 'IP Address', icon: Monitor, placeholder: 'Ví dụ: 192.168.1.100' },
          { key: 'ram', label: 'RAM', icon: MemoryStick, placeholder: 'Ví dụ: 256MB' },
          { key: 'storage', label: 'Storage', icon: HardDrive, placeholder: 'Ví dụ: 1GB' }
        ];
      case 'projector':
        return [
          { key: 'processor', label: 'Bộ xử lý', icon: Cpu, placeholder: 'Ví dụ: ARM Cortex-A7' },
          { key: 'display', label: 'Độ phân giải', icon: Monitor, placeholder: 'Ví dụ: 1920x1080' }
        ];
      case 'phone':
        return [
          { key: 'processor', label: 'Bộ xử lý', icon: Cpu, placeholder: 'Ví dụ: Snapdragon 855' },
          { key: 'ram', label: 'RAM', icon: MemoryStick, placeholder: 'Ví dụ: 8GB' },
          { key: 'storage', label: 'Bộ nhớ', icon: HardDrive, placeholder: 'Ví dụ: 128GB' },
          { key: 'display', label: 'Màn hình', icon: Monitor, placeholder: 'Ví dụ: 6.1" OLED' }
        ];
      case 'tool':
        return [
          { key: 'processor', label: 'Bộ xử lý', icon: Cpu, placeholder: 'Ví dụ: Intel Core i5' },
          { key: 'ram', label: 'RAM', icon: MemoryStick, placeholder: 'Ví dụ: 8GB' },
          { key: 'storage', label: 'Ổ cứng', icon: HardDrive, placeholder: 'Ví dụ: 256GB SSD' },
          { key: 'display', label: 'Màn hình', icon: Monitor, placeholder: 'Ví dụ: 13.3"' }
        ];
      default:
        return [];
    }
  };

  // Cập nhật specs khi modal mở
  useEffect(() => {
    if (open) {
      const safeCurrentSpecs = currentSpecs || {};
      setSpecs(safeCurrentSpecs);
      setError(null);
    }
  }, [open, JSON.stringify(currentSpecs)]);

  // Xử lý thay đổi giá trị
  const handleSpecChange = (key: string, value: string) => {
    setSpecs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Xử lý lưu thông số
  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Lọc bỏ các trường rỗng
      const filteredSpecs = Object.fromEntries(
        Object.entries(specs).filter(([, value]) => value.trim() !== '')
      );

      await inventoryService.updateDevice(deviceType, deviceId, {
        specs: filteredSpecs
      });

      onSpecsUpdated?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Error updating specs:', err);
      setError('Không thể cập nhật thông số kỹ thuật. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const specFields = getSpecFields();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Cập nhật thông số kỹ thuật</span>
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
              <CardTitle className="text-lg">Thông số kỹ thuật</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {specFields.map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.key} className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span>{field.label}</span>
                    </Label>
                    <Input
                      value={specs[field.key] || ''}
                      onChange={(e) => handleSpecChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full"
                    />
                  </div>
                );
              })}
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
              disabled={isLoading}
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

export default EditSpecsModal; 
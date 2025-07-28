import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { inventoryService } from '../../../services/inventoryService';
import type { DeviceType } from '../../../types/inventory';

interface AddDeviceModalProps {
  deviceType: DeviceType;
  onDeviceAdded: () => void;
}

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ deviceType, onDeviceAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    serial: '',
    releaseYear: new Date().getFullYear(),
    type: '',
    status: 'Standby',
    specs: {} as Record<string, string>,
    reason: '',
    // Phone specific fields
    imei1: '',
    imei2: '',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Device type specific configurations
  const deviceConfig = {
    laptop: {
      title: 'Thêm Laptop Mới',
      specs: ['processor', 'ram', 'storage', 'display'],
      specLabels: {
        processor: 'Bộ xử lý',
        ram: 'RAM',
        storage: 'Lưu trữ',
        display: 'Màn hình',
      },
    },
    monitor: {
      title: 'Thêm Màn Hình Mới',
      specs: ['display'],
      specLabels: {
        display: 'Kích thước màn hình',
      },
    },
    printer: {
      title: 'Thêm Máy In Mới',
      specs: ['ram', 'storage'],
      specLabels: {
        ram: 'RAM',
        storage: 'Lưu trữ',
      },
    },
    projector: {
      title: 'Thêm Máy Chiếu Mới',
      specs: ['display'],
      specLabels: {
        display: 'Độ phân giải',
      },
    },
    phone: {
      title: 'Thêm Điện Thoại Mới',
      specs: ['processor', 'ram', 'storage'],
      specLabels: {
        processor: 'CPU',
        ram: 'RAM',
        storage: 'Ổ cứng',
      },
    },
    tool: {
      title: 'Thêm Công Cụ Mới',
      specs: ['processor', 'ram', 'storage', 'display'],
      specLabels: {
        processor: 'Bộ xử lý',
        ram: 'RAM',
        storage: 'Lưu trữ',
        display: 'Màn hình',
      },
    },
  };

  const currentConfig = deviceConfig[deviceType];

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        manufacturer: '',
        serial: '',
        releaseYear: new Date().getFullYear(),
        type: '',
        status: 'Standby',
        specs: {},
        reason: '',
        // Phone specific fields
        imei1: '',
        imei2: '',
        phoneNumber: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSpecChange = (specKey: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      specs: { ...prev.specs, [specKey]: value }
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên thiết bị là bắt buộc';
    }

    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Hãng sản xuất là bắt buộc';
    }

    if (!formData.serial.trim()) {
      newErrors.serial = 'Số serial là bắt buộc';
    }

    // Phone specific validation
    if (deviceType === 'phone') {
      if (!formData.imei1.trim()) {
        newErrors.imei1 = 'IMEI 1 là bắt buộc';
      }
    }

    if (!formData.type.trim()) {
      newErrors.type = 'Loại thiết bị là bắt buộc';
    }

    if (formData.status === 'Broken' && !formData.reason.trim()) {
      newErrors.reason = 'Lý do báo hỏng là bắt buộc khi trạng thái là "Hỏng"';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const deviceData = {
        ...formData,
        assigned: [], // Empty array for new devices
        room: null, // No room assigned initially
      };

      // Call the appropriate API based on device type
      await inventoryService.createDevice(deviceType, deviceData);
      
      // Success
      setIsOpen(false);
      onDeviceAdded();
      
      // Show success message (you can use a toast library here)
      console.log('Device added successfully!');
      
    } catch (error) {
      console.error('Error adding device:', error);
      // Handle error (show error message)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Thêm mới</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{currentConfig.title}</DialogTitle>
          <DialogDescription>
            Điền thông tin để thêm thiết bị mới vào hệ thống
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="space-y-2">
              <Label htmlFor="name">Tên thiết bị *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nhập tên thiết bị"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Hãng sản xuất *</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                placeholder="Nhập hãng sản xuất"
                className={errors.manufacturer ? 'border-red-500' : ''}
              />
              {errors.manufacturer && <p className="text-sm text-red-500">{errors.manufacturer}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial">Số serial *</Label>
              <Input
                id="serial"
                value={formData.serial}
                onChange={(e) => handleInputChange('serial', e.target.value)}
                placeholder="Nhập số serial"
                className={errors.serial ? 'border-red-500' : ''}
              />
              {errors.serial && <p className="text-sm text-red-500">{errors.serial}</p>}
            </div>

            {/* Phone specific fields */}
            {deviceType === 'phone' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="imei1">IMEI 1 *</Label>
                  <Input
                    id="imei1"
                    value={formData.imei1}
                    onChange={(e) => handleInputChange('imei1', e.target.value)}
                    placeholder="Nhập IMEI 1"
                    className={errors.imei1 ? 'border-red-500' : ''}
                  />
                  {errors.imei1 && <p className="text-sm text-red-500">{errors.imei1}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imei2">IMEI 2</Label>
                  <Input
                    id="imei2"
                    value={formData.imei2}
                    onChange={(e) => handleInputChange('imei2', e.target.value)}
                    placeholder="Nhập IMEI 2 (tùy chọn)"
                    className={errors.imei2 ? 'border-red-500' : ''}
                  />
                  {errors.imei2 && <p className="text-sm text-red-500">{errors.imei2}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Số điện thoại</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="Nhập số điện thoại (tùy chọn)"
                    className={errors.phoneNumber ? 'border-red-500' : ''}
                  />
                  {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber}</p>}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="releaseYear">Năm sản xuất</Label>
              <Input
                id="releaseYear"
                type="number"
                value={formData.releaseYear}
                onChange={(e) => handleInputChange('releaseYear', parseInt(e.target.value))}
                placeholder="Nhập năm sản xuất"
                min="2000"
                max={new Date().getFullYear()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Loại thiết bị *</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                placeholder="Nhập loại thiết bị"
                className={errors.type ? 'border-red-500' : ''}
              />
              {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Đang sử dụng</SelectItem>
                  <SelectItem value="Standby">Sẵn sàng bàn giao</SelectItem>
                  <SelectItem value="Broken">Hỏng</SelectItem>
                  <SelectItem value="PendingDocumentation">Thiếu biên bản</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Specifications */}
          {currentConfig.specs.length > 0 && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Thông số kỹ thuật</Label>
              <div className="grid grid-cols-2 gap-4">
                {currentConfig.specs.map((spec) => (
                  <div key={spec} className="space-y-2">
                    <Label htmlFor={spec}>{currentConfig.specLabels[spec as keyof typeof currentConfig.specLabels]}</Label>
                    <Input
                      id={spec}
                      value={formData.specs[spec] || ''}
                      onChange={(e) => handleSpecChange(spec, e.target.value)}
                      placeholder={`Nhập ${String(currentConfig.specLabels[spec as keyof typeof currentConfig.specLabels] || '').toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reason for broken status */}
          {formData.status === 'Broken' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Lý do báo hỏng *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                placeholder="Nhập lý do báo hỏng"
                className={errors.reason ? 'border-red-500' : ''}
                rows={3}
              />
              {errors.reason && <p className="text-sm text-red-500">{errors.reason}</p>}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                'Thêm thiết bị'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDeviceModal; 
import React, { useState, useEffect } from 'react';
import { Building, Users, MapPin, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { inventoryService } from '../../../services/inventoryService';

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

interface EditRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room | null; // null for creating new room
  onSuccess: () => void;
}

const EditRoomModal: React.FC<EditRoomModalProps> = ({
  open,
  onOpenChange,
  room,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    capacity: '',
    building: '',
    floor: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!room;

  useEffect(() => {
    if (open) {
      if (room) {
        // Edit mode - populate form with existing data
        setFormData({
          name: room.name || '',
          type: room.type || '',
          capacity: room.capacity?.toString() || '',
          building: room.location?.[0]?.building || '',
          floor: room.location?.[0]?.floor || ''
        });
      } else {
        // Create mode - reset form
        setFormData({
          name: '',
          type: '',
          capacity: '',
          building: '',
          floor: ''
        });
      }
      setError(null);
    }
  }, [open, room]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Tên phòng là bắt buộc');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const roomData = {
        name: formData.name.trim(),
        type: formData.type || 'other',
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        location: formData.building && formData.floor ? [{
          building: formData.building,
          floor: formData.floor
        }] : undefined
      };

      if (isEditMode && room) {
        await inventoryService.updateRoom(room._id, roomData);
      } else {
        await inventoryService.createRoom(roomData);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving room:', err);
      setError(isEditMode ? 'Không thể cập nhật phòng' : 'Không thể tạo phòng mới');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>{isEditMode ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên phòng *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập tên phòng..."
              required
            />
          </div>

          {/* Room Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Loại phòng</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại phòng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classroom">Phòng học</SelectItem>
                <SelectItem value="lab">Phòng thí nghiệm</SelectItem>
                <SelectItem value="library">Thư viện</SelectItem>
                <SelectItem value="office">Văn phòng</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">Sức chứa</Label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="Số người tối đa..."
                className="pl-10"
                min="1"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="building">Tòa nhà</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="building"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder="Tòa A, B, C..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor">Tầng</Label>
              <Input
                id="floor"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                placeholder="1, 2, 3..."
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#002855] hover:bg-[#003366]"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Đang lưu...' : (isEditMode ? 'Cập nhật' : 'Tạo mới')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRoomModal; 
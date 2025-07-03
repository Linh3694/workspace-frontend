import React, { useState, useEffect } from 'react';
import { MapPin, Building, Users, Search, X, Edit, Trash2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { inventoryService } from '../../../services/inventoryService';
import type { DeviceType } from '../../../types/inventory';
import EditRoomModal from './EditRoomModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

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

interface AssignRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceType: DeviceType;
  deviceId: string | null;
  deviceName: string;
  onAssignSuccess: () => void;
}

const getRoomTypeLabel = (type: string | undefined) => {
  if (!type) return 'Không xác định';
  
  const typeMap = {
    'classroom': 'Phòng học',
    'lab': 'Phòng thí nghiệm',
    'library': 'Thư viện',
    'office': 'Văn phòng',
    'other': 'Khác'
  };
  return typeMap[type as keyof typeof typeMap] || type;
};

const getRoomTypeBadgeClass = (type: string | undefined) => {
  if (!type) return 'bg-gray-100 text-gray-800';
  
  const classMap = {
    'classroom': 'bg-blue-100 text-blue-800',
    'lab': 'bg-purple-100 text-purple-800',
    'library': 'bg-green-100 text-green-800',
    'office': 'bg-orange-100 text-orange-800',
    'other': 'bg-gray-100 text-gray-800'
  };
  return classMap[type as keyof typeof classMap] || 'bg-gray-100 text-gray-800';
};

const AssignRoomModal: React.FC<AssignRoomModalProps> = ({
  open,
  onOpenChange,
  deviceType,
  deviceId,
  deviceName,
  onAssignSuccess
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Edit/Delete modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  useEffect(() => {
    if (open) {
      fetchRooms();
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRooms(rooms);
    } else {
      const filtered = rooms.filter(room => {
        const roomName = room.name || '';
        const roomType = room.type || '';
        const roomTypeLabel = getRoomTypeLabel(roomType);
        
        return roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               roomTypeLabel.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredRooms(filtered);
    }
  }, [searchTerm, rooms]);

  const fetchRooms = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const roomData = await inventoryService.getAllRooms();
      setRooms(roomData);
      setFilteredRooms(roomData);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Không thể tải danh sách phòng.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignRoom = async () => {
    if (!selectedRoom || !deviceId) return;

    setIsAssigning(true);
    try {
      await inventoryService.assignDeviceToRoom(deviceType, deviceId, selectedRoom._id);
      onAssignSuccess();
      onOpenChange(false);
      setSelectedRoom(null);
      setSearchTerm('');
    } catch (err) {
      console.error('Error assigning room:', err);
      setError('Không thể gán phòng cho thiết bị.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedRoom(null);
    setSearchTerm('');
    setError(null);
  };

  // Edit room handlers
  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setIsEditModalOpen(true);
  };

  const handleCreateRoom = () => {
    setEditingRoom(null);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchRooms(); // Refresh rooms list
  };

  // Delete room handlers
  const handleDeleteRoom = (room: Room) => {
    setRoomToDelete(room);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roomToDelete) return;
    
    try {
      await inventoryService.deleteRoom(roomToDelete._id);
      await fetchRooms(); // Refresh rooms list
      
      // If deleted room was selected, clear selection
      if (selectedRoom?._id === roomToDelete._id) {
        setSelectedRoom(null);
      }
    } catch (err) {
      console.error('Error deleting room:', err);
      setError('Không thể xóa phòng. Phòng có thể đang được sử dụng.');
      throw err; // Re-throw to let modal handle it
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center space-x-3">
                <MapPin className="h-5 w-5" />
                <span>Gán phòng cho thiết bị</span>
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                Chọn phòng cho thiết bị: <span className="font-medium">{deviceName}</span>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateRoom}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm phòng</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Rooms list */}
          <div className="flex-1 overflow-auto space-y-2">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {searchTerm ? 'Không tìm thấy phòng nào phù hợp.' : 'Không có phòng nào trong hệ thống.'}
                </p>
              </div>
            ) : (
              filteredRooms.map((room) => (
                <Card
                  key={room._id}
                  className={`cursor-pointer transition-colors ${
                    selectedRoom?._id === room._id
                      ? 'border-2 border-[#002855]'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedRoom(room)}
                >
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900">{room.name}</h3>
                          <Badge className={getRoomTypeBadgeClass(room.type)}>
                            {getRoomTypeLabel(room.type)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          {room.capacity && (
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>Sức chứa: {room.capacity}</span>
                            </div>
                          )}
                          
                          {room.location && room.location.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Building className="h-4 w-4" />
                              <span>
                                {room.location.map(loc => `${loc.building} - Tầng ${loc.floor}`).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center space-x-1 ml-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRoom(room);
                          }}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRoom(room);
                          }}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            onClick={handleAssignRoom}
            disabled={!selectedRoom || isAssigning}
            className="bg-[#002855] hover:bg-[#003366]"
          >
            {isAssigning ? 'Đang gán...' : 'Gán phòng'}
          </Button>
        </div>
      </DialogContent>

      {/* Edit Room Modal */}
      <EditRoomModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        room={editingRoom}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa phòng"
        description="Bạn có chắc chắn muốn xóa phòng này? Hành động này không thể hoàn tác."
        itemName={roomToDelete?.name}
      />
    </Dialog>
  );
};

export default AssignRoomModal; 
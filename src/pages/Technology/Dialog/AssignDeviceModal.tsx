import React, { useState, useEffect } from 'react';
import { User, Search, AlertTriangle, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { getAvatarUrl, getInitials } from '../../../lib/utils';
import { inventoryService } from '../../../services/inventoryService';
import type { DeviceType } from '../../../types/inventory';

interface AssignDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceType: DeviceType;
  deviceId: string | null;
  deviceName: string;
  onAssignSuccess: () => void;
}

interface User {
  _id: string;
  fullname: string;
  email: string;
  jobTitle: string;
  department: string;
  avatarUrl?: string;
  active: boolean;
}

const AssignDeviceModal: React.FC<AssignDeviceModalProps> = ({
  open,
  onOpenChange,
  deviceType,
  deviceId,
  deviceName,
  onAssignSuccess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch users when modal opens
  useEffect(() => {
    if (open) {
      fetchUsers();
      setSearchTerm('');
      setSelectedUser(null);
      setNotes('');
      setError(null);
    }
  }, [open]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Lấy toàn bộ user
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const users = await response.json();
      setUsers(users);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Không thể tải danh sách người dùng.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUser || !deviceId) return;

    setIsAssigning(true);
    setError(null);

    try {
      await inventoryService.assignDevice(deviceType, deviceId, selectedUser._id, notes);
      onAssignSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Error assigning device:', err);
      setError(err instanceof Error ? err.message : 'Không thể bàn giao thiết bị.');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Bàn giao thiết bị</span>
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            Thiết bị: <span className="font-medium">{deviceName}</span>
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Tìm kiếm người dùng</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder="Tìm theo tên, email, phòng ban..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* User List */}
          <div className="space-y-2">
            <Label>Chọn người nhận bàn giao</Label>
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  Đang tải danh sách người dùng...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'Không tìm thấy người dùng nào' : 'Không có người dùng nào'}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 `}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.avatarUrl ? getAvatarUrl(user.avatarUrl) : undefined}
                          alt={user.fullname}
                          className="object-cover object-top"
                        />
                        <AvatarFallback>
                          {getInitials(user.fullname)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{user.fullname}</p>
                          {selectedUser?._id === user._id && (
                            <Badge variant="default" className="text-xs">
                              Đã chọn
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{user.jobTitle}</p>
                        <p className="text-sm text-gray-400">{user.department}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
            <Textarea
              id="notes"
              placeholder="Nhập ghi chú về việc bàn giao thiết bị..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
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
            disabled={isAssigning}
          >
            Hủy
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedUser || isAssigning}
            className="bg-[#002855] hover:bg-[#002855] text-white"
          >
            {isAssigning ? 'Đang bàn giao...' : 'Bàn giao'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignDeviceModal; 
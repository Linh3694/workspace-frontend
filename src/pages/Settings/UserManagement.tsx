import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { useRef } from 'react';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import UserDialog from './UserDialog';
import { API_ENDPOINTS } from '../../lib/config';
import { api } from '../../lib/api';
import { useToast } from "../../hooks/use-toast";


interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  fullname: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  school?: string; // Added school field
  avatarUrl?: string;
}

interface UserFormData {
  username: string;
  email: string;
  role: string;
  fullname: string;
  password?: string;
  oldPassword?: string;
  confirmPassword?: string;
  active: boolean;
  school?: string; // Added school field
  avatar?: File | string;
}

interface ApiResponse {
  data: User[];
  message?: string;
}

interface APIError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'changePassword'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // Bulk import Excel state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const response = await api.get<ApiResponse>(API_ENDPOINTS.USERS);
      console.log('API Response:', response);

      if (Array.isArray(response)) {
        setUsers(response);
      } else if (response && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error('Invalid response format:', response);
        setUsers([]);
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải danh sách người dùng",
        });
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách người dùng: " + errorMessage,
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = () => {
    setDialogMode('create');
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleUpdateUser = (user: User) => {
    setDialogMode('edit');
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.delete(API_ENDPOINTS.USER(id));
      setUsers(users.filter(user => user._id !== id));
      toast({
        variant: "success",
        title: "Thành công",
        description: "Đã xóa người dùng",
      });
    } catch (err) {
      console.error('Error deleting user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa người dùng: " + errorMessage,
      });
    }
  };

  const handleChangePassword = (user: User) => {
    setDialogMode('changePassword');
    setSelectedUser(user);
    setDialogOpen(true);
  };

  // Excel bulk upload handler
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    let data;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      data = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không đọc được file Excel' });
      setImportLoading(false);
      return;
    }

    // Verify headers
    const required = ['Username', 'Password', 'Email', 'Role', 'Fullname', 'Active'];
    const headers = Object.keys(data[0] || {});
    const missing = required.filter(h => !headers.includes(h));
    if (missing.length) {
      toast({ variant: 'destructive', title: 'Lỗi', description: `Thiếu cột: ${missing.join(', ')}` });
      setImportLoading(false);
      return;
    }

    // Map to payload
    const users = data.map((row) => ({
      username: row.Username.toString().trim(),
      password: row.Password.toString().trim(),
      email: row.Email.toString().trim(),
      role: row.Role.toString().trim(),
      fullname: row.Fullname.toString().trim(),
      active: /true/i.test(row.Active.toString()),
      // optional School column if present
      ...(row.School ? { school: row.School.toString().trim() } : {})
    }));

    // Send to backend
    try {
      const res = await api.post(API_ENDPOINTS.USERS + '/batch', { users, defaultSchool: undefined });
      toast({ title: 'Thành công', description: res.data.message });
      fetchUsers();
    } catch (err: any) {
      const detail = err.response?.data;
      toast({ variant: 'destructive', title: detail?.message || err.message, description: Array.isArray(detail?.errors) ? detail.errors.join('; ') : undefined });
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsImportDialogOpen(false);
    }
  };

  const handleDialogSubmit = async (data: UserFormData) => {
    try {
      if (dialogMode === 'create') {
        // Validate dữ liệu cho tạo mới
        if (!data.username || !data.email || !data.role || !data.fullname) {
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Vui lòng điền đầy đủ thông tin",
          });
          return;
        }
        if (!data.password) {
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Vui lòng nhập mật khẩu",
          });
          return;
        }

        // Chuẩn hóa dữ liệu
        const submissionData = {
          ...data,
          username: data.username.trim(),
          email: data.email.trim().toLowerCase(),
          fullname: data.fullname.trim(),
          role: data.role.trim(),
          school: data.role === 'teacher' ? data.school : undefined // Assign school for teachers
        };

        if (data.avatar && data.avatar instanceof File) {
          const fd = new FormData();
          Object.entries(submissionData).forEach(([k, v]) => {
            if (v !== undefined && v !== null) fd.append(k, String(v));
          });
          fd.append("avatar", data.avatar);
          await api.post<User>(API_ENDPOINTS.USERS, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          await api.post<User>(API_ENDPOINTS.USERS, submissionData);
        } toast({
          variant: "success",
          title: "Thành công",
          description: "Đã tạo người dùng mới",
        });
        setDialogOpen(false);
      } else if (dialogMode === 'edit' && selectedUser) {
        // Validate dữ liệu cho cập nhật
        if (!data.username || !data.email || !data.role || !data.fullname) {
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Vui lòng điền đầy đủ thông tin",
          });
          return;
        }

        const updateData = {
          username: data.username.trim(),
          email: data.email.trim().toLowerCase(),
          fullname: data.fullname.trim(),
          role: data.role.trim(),
          active: data.active,
          school: data.role === 'teacher' ? data.school : undefined // Assign school for teachers
        };

        if (data.avatar && data.avatar instanceof File) {
          const fd = new FormData();
          Object.entries(updateData).forEach(([k, v]) => {
            if (v !== undefined && v !== null) fd.append(k, String(v));
          });
          fd.append("avatar", data.avatar);
          // Perform API update and capture updated user
          const response = await api.put<User>(API_ENDPOINTS.USER(selectedUser._id), fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const updatedUserFromServer = response.data || response;

          // If the updated user is the one in localStorage, update it there
          const stored = localStorage.getItem("user");
          if (stored) {
            const currentUser = JSON.parse(stored);
            if (currentUser._id === selectedUser._id) {
              const newUser = { ...currentUser, avatarUrl: updatedUserFromServer.avatarUrl };
              localStorage.setItem("user", JSON.stringify(newUser));
              window.dispatchEvent(new Event("userUpdated"));
            }
          }
        } else {
          // Perform API update and capture updated user
          const response = await api.put<User>(API_ENDPOINTS.USER(selectedUser._id), updateData);
          const updatedUserFromServer = response.data || response;

          // If the updated user is the one in localStorage, update it there
          const stored = localStorage.getItem("user");
          if (stored) {
            const currentUser = JSON.parse(stored);
            if (currentUser._id === selectedUser._id) {
              const newUser = { ...currentUser, avatarUrl: updatedUserFromServer.avatarUrl };
              localStorage.setItem("user", JSON.stringify(newUser));
              window.dispatchEvent(new Event("userUpdated"));
            }
          }
        } toast({
          variant: "success",
          title: "Thành công",
          description: "Đã cập nhật thông tin người dùng",
        });
        setDialogOpen(false);
      } else if (dialogMode === 'changePassword' && selectedUser) {
        // Validate dữ liệu cho đổi mật khẩu
        if (!data.password || !data.confirmPassword) {
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Vui lòng nhập mật khẩu mới",
          });
          return;
        }
        if (data.password !== data.confirmPassword) {
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Mật khẩu xác nhận không khớp",
          });
          return;
        }

        await api.put(API_ENDPOINTS.USER_RESET_PASSWORD(selectedUser._id), {
          newPassword: data.password
        });
        toast({
          variant: "success",
          title: "Thành công",
          description: "Đã đặt lại mật khẩu",
        });
        setDialogOpen(false);
      }

      setError(null);
      fetchUsers(); // Refresh danh sách sau khi thay đổi
    } catch (err: unknown) {
      console.error('Error submitting user data:', err);
      const apiError = err as APIError;

      console.log('API Error details:', {
        response: apiError?.response,
        message: apiError?.message
      });

      const errorMessage = apiError?.response?.data?.message || apiError?.message || 'Đã xảy ra lỗi không xác định';
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: errorMessage,
      });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Quản lý người dùng</h1>
        <div className="space-x-2 ">
          <Button onClick={handleCreateUser}>
            Thêm người dùng
          </Button>
          <Button onClick={() => setIsImportDialogOpen(true)}>Import Excel</Button>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Excel</DialogTitle>
                <DialogDescription>
                  Chọn file Excel để nhập dữ liệu. Bạn có thể tải mẫu để tham khảo.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-4 items-center gap-4 py-4">
                <Label className="col-span-1 text-right">File Excel</Label>
                <div className="col-span-3">
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    ref={fileInputRef}
                    onChange={handleBulkUpload}
                  />
                </div>

                <Label className="col-span-1 text-right">File Mẫu</Label>
                <div className="col-span-3">
                  <Button variant="outline" asChild>
                    <a href="/Template/user-example.xlsx" download>
                      Tải file mẫu
                    </a>
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setIsImportDialogOpen(false)} disabled={importLoading}>
                  Đóng
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Tên đăng nhập</TableHead>
              <TableHead className="font-semibold">Họ tên</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Vai trò</TableHead>
              <TableHead className="font-semibold">Trạng thái</TableHead>
              <TableHead className="font-semibold">Ngày tạo</TableHead>
              <TableHead className="text-right font-semibold">Hành Động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.fullname}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${user.active ? 'bg-green-100 text-green-800 font-bold' : 'bg-gray-100 text-gray-800'}`}>
                    {user.active ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </TableCell>
                <TableCell>
                  {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: vi })}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdateUser(user)}
                  >
                    Cập nhật
                  </Button>

                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        userData={selectedUser ? {
          username: selectedUser.username,
          email: selectedUser.email,
          role: selectedUser.role,
          fullname: selectedUser.fullname,
          active: selectedUser.active,
          school: selectedUser.school,
          _id: selectedUser._id,
          createdAt: selectedUser.createdAt,
          updatedAt: selectedUser.updatedAt
        } : undefined}
        onSubmit={handleDialogSubmit}
        onDelete={handleDeleteUser}
        onChangePassword={handleChangePassword}
      />

      {/* UploadDialog removed, replaced with in-place Excel import dialog */}
    </div>
  );
};

export default UserManagement;
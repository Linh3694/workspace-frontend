import React, { useEffect, useState, useMemo } from 'react';
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../components/ui/pagination";
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import UserDialog from './UserDialog';
import { API_ENDPOINTS } from '../../lib/config';
import { api } from '../../lib/api';
import { useToast } from "../../hooks/use-toast";
import { UserAvatar } from '../../lib/avatar';

// Function to translate role to Vietnamese
const translateRole = (role: string): string => {
  const roleTranslations: { [key: string]: string } = {
    'superadmin': 'Quản trị viên cấp cao',
    'admin': 'Quản trị viên',
    // 'teacher': 'Giáo viên',
    // 'parent': 'Phụ huynh',
    // 'registrar': 'Giáo vụ',
    // 'admission': 'Tuyển sinh',
    'bos': 'Ban đào tạo',
    // 'principal': 'Hiệu trưởng',
    // 'service': 'Dịch vụ',
    'technical': 'Kỹ thuật/IT',
    // 'marcom': 'Marcom',
    'hr': 'Nhân sự',
    // 'bod': 'Ban giám đốc',
    'user': 'Người dùng'
  };
  
  return roleTranslations[role] || role;
};

interface User {
  _id: string;
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
      errors?: string[];
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
  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();

  // Filter and paginate users
  const filteredAndPaginatedUsers = useMemo(() => {
    if (!users || users.length === 0) {
      return {
        users: [],
        totalUsers: 0,
        totalPages: 0,
        currentPage: 1,
        hasNext: false,
        hasPrev: false
      };
    }

    const filtered = users.filter(user => 
      (user.fullname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      translateRole(user.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filtered.slice(startIndex, endIndex);

    return {
      users: paginatedUsers,
      totalUsers: filtered.length,
      totalPages,
      currentPage,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1
    };
  }, [users, searchTerm, currentPage, itemsPerPage]);

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
      data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    } catch {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không đọc được file Excel' });
      setImportLoading(false);
      return;
    }

    // Verify headers
    const required = ['Password', 'Email', 'Role', 'Fullname', 'Active'];
    const headers = Object.keys(data[0] || {});
    const missing = required.filter(h => !headers.includes(h));
    if (missing.length) {
      toast({ variant: 'destructive', title: 'Lỗi', description: `Thiếu cột: ${missing.join(', ')}` });
      setImportLoading(false);
      return;
    }

    // Map to payload
    const users = data.map((row) => ({
      password: String(row.Password || '').trim(),
      email: String(row.Email || '').trim(),
      role: String(row.Role || '').trim(),
      fullname: String(row.Fullname || '').trim(),
      active: /true/i.test(String(row.Active || '')),
      ...(row.School ? { school: String(row.School).trim() } : {})
    }));

    // Send to backend
    try {
      const res = await api.post(API_ENDPOINTS.USERS + '/batch', { users, defaultSchool: undefined });
      toast({ title: 'Thành công', description: res.data.message });
      fetchUsers();
    } catch (err: unknown) {
      const apiError = err as APIError;
      const detail = apiError.response?.data;
      toast({ variant: 'destructive', title: detail?.message || apiError.message, description: Array.isArray(detail?.errors) ? detail.errors.join('; ') : undefined });
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
        if (!data.email || !data.role || !data.fullname) {
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
        if (!data.email || !data.role || !data.fullname) {
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Vui lòng điền đầy đủ thông tin",
          });
          return;
        }

        const updateData = {
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
    <div className="space-y-6 bg-white p-6 rounded-2xl shadow-md">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Quản lý người dùng</h1>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Tìm kiếm người dùng..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            className="w-64"
          />
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
              <TableHead className="font-semibold">Họ tên</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Vai trò</TableHead>
              <TableHead className="font-semibold">Ngày tạo</TableHead>
              <TableHead className="text-right font-semibold">Hành Động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndPaginatedUsers.users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <UserAvatar 
                      user={user}
                      size={40}
                      showTooltip
                    />
                    <div>
                      <div className="font-medium">{user.fullname}</div>
                      {user.school && (
                        <div className="text-sm text-gray-500">{user.school}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{translateRole(user.role)}</TableCell>
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

      {filteredAndPaginatedUsers.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              {filteredAndPaginatedUsers.hasPrev && (
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              )}
              
              {Array.from({ length: filteredAndPaginatedUsers.totalPages }, (_, i) => i + 1)
                .filter(page => {
                  const showPage = page === 1 || 
                                 page === filteredAndPaginatedUsers.totalPages ||
                                 Math.abs(page - currentPage) <= 1;
                  return showPage;
                })
                .map((page, index, array) => {
                  const prevPage = array[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;
                  
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    </React.Fragment>
                  );
                })}

              {filteredAndPaginatedUsers.hasNext && (
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        userData={selectedUser ? {
          email: selectedUser.email,
          role: selectedUser.role,
          fullname: selectedUser.fullname,
          active: selectedUser.active,
          school: selectedUser.school,
          _id: selectedUser._id,
          avatarUrl: selectedUser.avatarUrl,
          createdAt: selectedUser.createdAt,
          updatedAt: selectedUser.updatedAt,
        } : undefined}
        onSubmit={handleDialogSubmit}
        onDelete={handleDeleteUser}
        onChangePassword={handleChangePassword}
      />
    </div>
  );
};

export default UserManagement;
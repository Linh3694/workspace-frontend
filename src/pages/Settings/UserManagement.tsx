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
// import { format } from 'date-fns';
// import { vi } from 'date-fns/locale';
import UserDialog from './UserDialog';
import { frappeApi } from '../../lib/frappe-api';
import { useToast } from "../../hooks/use-toast";
import { UserAvatar } from '../../lib/avatar';

// Function to translate role to Vietnamese
const translateRole = (role: string): string => {
  const roleTranslations: { [key: string]: string } = {
    // Frappe system roles
    'System Manager': 'Quản trị viên hệ thống',
    'Administrator': 'Quản trị viên',
    'All': 'Người dùng cơ bản',
    'User': 'Người dùng',
    'Guest': 'Khách',
    'Desk User': 'Người dùng bàn làm việc',
    
    // Custom roles từ hệ thống
    'superadmin': 'Quản trị viên cấp cao',
    'admin': 'Quản trị viên',
    'teacher': 'Giáo viên',
    'parent': 'Phụ huynh',
    'registrar': 'Giáo vụ',
    'admission': 'Tuyển sinh',
    'bos': 'Ban đào tạo',
    'principal': 'Hiệu trưởng',
    'service': 'Dịch vụ',
    'technical': 'Kỹ thuật/IT',
    'marcom': 'Marcom',
    'hr': 'Nhân sự',
    'bod': 'Ban giám đốc',
    'user': 'Người dùng',
    'librarian': 'Thủ thư',
    'IT Manager': 'Quản lý IT'
  };
  
  return roleTranslations[role] || role;
};

interface User {
  name: string; // Frappe document name (usually email)
  user: string; // Email from ERP User Profile
  id: string; // Email from ERP User Profile (renamed for clarity)
  email: string; // From User doctype
  display_email?: string; // Unified email field from backend
  full_name: string; // From User doctype
  phone?: string;
  user_role?: string; // From ERP User Profile (legacy)
  frappe_roles?: string[]; // Frappe system roles
  active?: boolean; // From ERP User Profile
  enabled?: boolean; // From User doctype
  creation?: string; // From User doctype
  modified?: string; // From User doctype
  username?: string; // From ERP User Profile
  employee_code?: string; // From ERP User Profile
  department?: string; // From ERP User Profile
  job_title?: string; // From ERP User Profile
  avatar_url?: string; // From ERP User Profile
  provider?: string; // From ERP User Profile
  disabled?: boolean; // From ERP User Profile
  last_login?: string; // From ERP User Profile
  last_seen?: string; // From ERP User Profile
}

interface UserFormData {
  email: string;
  phone?: string;
  fullname: string; // UserDialog uses 'fullname' not 'full_name'
  password?: string;
  oldPassword?: string;
  confirmPassword?: string;
  active: boolean;
  school?: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
  employeeCode?: string; // UserDialog uses 'employeeCode' not 'employee_code'
  department?: string;
  jobTitle?: string; // UserDialog uses 'jobTitle' not 'job_title'
  avatar?: File | string;
  newAvatarFile?: File;
  username?: string;
}

// interface ApiResponse {
//   data: User[];
//   message?: string;
// }

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
      (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || user.user || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.user_role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      translateRole(user.user_role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.employee_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.department || '').toLowerCase().includes(searchTerm.toLowerCase())
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

  const fetchUsers = async (useServerPagination = false) => {
    try {
      setLoading(true);
      
      if (useServerPagination) {
        // Server-side pagination - chỉ lấy dữ liệu cho trang hiện tại
        const response = await frappeApi.getUsers({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm || undefined
        });
        
        console.log('Frappe API response:', response);
        
        if (response && response.status === 'success' && Array.isArray(response.users)) {
          setUsers(response.users as User[]);
          // TODO: Update pagination info from server response
        } else {
          console.error('Invalid response format:', response);
          setUsers([]);
          toast({
            variant: "destructive",
            title: "Lỗi", 
            description: "Không thể tải danh sách người dùng",
          });
        }
      } else {
        // Client-side pagination - lấy tất cả users để có thể filter/search
        const params = {
          page: 1,
          limit: 1000, // Lấy tất cả users (có 384 users total)
          search: undefined // Không search trên server, để client tự search
        };
        
    
        
        const response = await frappeApi.getUsers(params);
        
        console.log('Frappe API response:', response);
        
        if (response && response.status === 'success' && Array.isArray(response.users)) {
          setUsers(response.users as User[]);
        } else {
          console.error('Invalid response format:', response);
          setUsers([]);
          toast({
            variant: "destructive",
            title: "Lỗi", 
            description: "Không thể tải danh sách người dùng",
          });
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách người dùng: " + errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(false); // Sử dụng client-side pagination để lấy nhiều users hơn
  }, []);

  const handleCreateUser = () => {
    setDialogMode('create');
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleUpdateUser = (user: User) => {
    console.log('🔍 handleUpdateUser called with user:', user);
    setDialogMode('edit');
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleDeleteUser = async (userEmail: string) => {
    try {
              const response = await frappeApi.deleteUser(userEmail);
              if ((response as { status: string }).status === 'success') {
          setUsers(users.filter(user => 
            user.display_email !== userEmail && 
            user.user !== userEmail && 
            user.email !== userEmail
          ));
        toast({
          variant: "success", 
          title: "Thành công",
          description: "Đã xóa người dùng",
        });
      }
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
                      const res = await frappeApi.batchCreateUsers(users.map(user => ({
          email: user.email,
          full_name: user.fullname,
          password: user.password,
          user_role: user.role,
          active: user.active,
          enabled: user.active
        })));
        toast({ title: 'Thành công', description: (res as { message?: string }).message || 'Đã tạo thành công' });
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
        if (!data.email || !data.fullname) {
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

        // Chuẩn hóa dữ liệu cho Frappe - map từ dialog field names sang API field names
        const submissionData = {
          email: data.email.trim().toLowerCase(),
          full_name: data.fullname.trim(),
          first_name: data.fullname.split(' ')[0],
          last_name: data.fullname.split(' ').slice(1).join(' '),
          password: data.password,
          enabled: data.active ?? true,
          username: data.username?.trim(),
          employee_code: data.employeeCode?.trim(),
          department: data.department?.trim(),
          job_title: data.jobTitle?.trim(),
          provider: 'local',
          active: data.active ?? true
        };

        const response = await frappeApi.createUser(submissionData);
        
        if ((response as { status: string }).status === 'success') {
          toast({
            variant: "success",
            title: "Thành công",
            description: "Đã tạo người dùng mới",
          });
          setDialogOpen(false);
          fetchUsers(); // Refresh danh sách
        }
      }
      else if (dialogMode === 'edit' && selectedUser) {
        // Validate dữ liệu cho cập nhật
        if (!data.email || !data.fullname) {
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Vui lòng điền đầy đủ thông tin",
          });
          return;
        }

        // Chuẩn hóa dữ liệu cho Frappe - map từ dialog field names sang API field names
        const updateData = {
          email: data.email.trim().toLowerCase(),
          full_name: data.fullname.trim(),
          first_name: data.fullname.split(' ')[0],
          last_name: data.fullname.split(' ').slice(1).join(' '),
          enabled: data.active ?? true,
          username: data.username?.trim(),
          employee_code: data.employeeCode?.trim(),
          department: data.department?.trim(),
          job_title: data.jobTitle?.trim(),
          active: data.active ?? true
        };

        const userEmail = selectedUser.display_email || selectedUser.user || selectedUser.email;

        
        // Kiểm tra xem user email có hợp lệ không
        if (!userEmail) {
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: "Không thể xác định email của người dùng",
          });
          return;
        }
        
        const response = await frappeApi.updateUser(userEmail, updateData);
        
        if ((response as { status: string }).status === 'success') {
          toast({
            variant: "success",
            title: "Thành công",
            description: "Đã cập nhật thông tin người dùng",
          });
          setDialogOpen(false);
          fetchUsers(); // Refresh danh sách
        }
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

        const userEmail = selectedUser.display_email || selectedUser.user || selectedUser.email;
        const response = await frappeApi.resetUserPassword(userEmail);
        
        if ((response as { status: string }).status === 'success') {
          toast({
            variant: "success",
            title: "Thành công",
            description: "Đã gửi email đặt lại mật khẩu",
          });
          setDialogOpen(false);
        }
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
              <TableHead className="font-semibold">Số điện thoại</TableHead>
              <TableHead className="font-semibold">Mã NV</TableHead>
              <TableHead className="font-semibold">Chức danh</TableHead>
              <TableHead className="font-semibold">Phòng ban</TableHead>
              <TableHead className="font-semibold">Vai trò</TableHead>
              <TableHead className="text-right font-semibold">Hành Động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndPaginatedUsers.users.map((user) => (
              <TableRow key={user.name || user.user}>
                <TableCell className="max-w-[200px]">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <UserAvatar 
                        user={{
                          ...user,
                          fullname: user.full_name,
                          avatarUrl: user.avatar_url
                        }}
                        size={40}
                        showTooltip
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{user.full_name}</div>
                      <div className="text-sm text-gray-500 truncate">
                        {user.display_email || user.email || user.user || '-'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{user.phone || '-'}</TableCell>
                <TableCell>{user.employee_code || '-'}</TableCell>
                <TableCell className="max-w-[200px] whitespace-normal">
                  <div className="text-sm leading-relaxed">
                    {user.job_title || '-'}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] whitespace-normal">
                  <div className="text-sm leading-relaxed">
                    {user.department || '-'}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <div className="text-sm leading-relaxed">
                    {user.frappe_roles && user.frappe_roles.length > 0 ? (
                      user.frappe_roles.length > 2 ? (
                        <div>
                          <div className="font-medium">
                            {translateRole(user.frappe_roles[0])}
                          </div>
                          <div className="text-xs text-gray-500">
                            +{user.frappe_roles.length - 1} vai trò khác
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {user.frappe_roles.map((role, index) => (
                            <div key={index} className="text-xs">
                              {translateRole(role)}
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      translateRole(user.user_role || '')
                    )}
                  </div>
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
          email: selectedUser.display_email || selectedUser.email || selectedUser.user,
          phone: selectedUser.phone,
          fullname: selectedUser.full_name,
          active: selectedUser.active ?? true,
          _id: selectedUser.name || selectedUser.user,
          avatarUrl: selectedUser.avatar_url,
          createdAt: selectedUser.creation || '',
          updatedAt: selectedUser.modified || '',
          employeeCode: selectedUser.employee_code,
          department: selectedUser.department,
          jobTitle: selectedUser.job_title,
        } : undefined}
        onSubmit={handleDialogSubmit}
        onDelete={(userId) => handleDeleteUser(selectedUser?.display_email || selectedUser?.user || selectedUser?.email || userId)}
        onChangePassword={(user) => handleChangePassword(user as unknown as User)}
      />
    </div>
  );
};

export default UserManagement;
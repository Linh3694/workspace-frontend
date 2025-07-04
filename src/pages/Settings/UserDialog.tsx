import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
// import { Switch } from "../../components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Avatar } from "../../lib/avatar";

// Function to translate role to Vietnamese
const translateRole = (role: string): string => {
  const roleTranslations: { [key: string]: string } = {
    'superadmin': 'Quản trị viên cấp cao',
    'admin': 'Quản trị viên',
    'teacher': 'Giáo viên',
    'parent': 'Phụ huynh',
    'registrar': 'Phòng đăng ký',
    'admission': 'Phòng tuyển sinh',
    'bos': 'Ban điều hành trường',
    'principal': 'Hiệu trưởng',
    'service': 'Dịch vụ',
    'technical': 'Kỹ thuật',
    'marcom': 'Marcom',
    'hr': 'Nhân sự',
    'bod': 'Hội đồng quản trị',
    'user': 'Người dùng thông thường',
    'librarian': 'Thủ thư'
  };
  
  return roleTranslations[role] || role;
};

// Available roles with their English keys and Vietnamese labels
const availableRoles = [
  { value: 'superadmin', label: 'Quản trị viên cấp cao' },
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'teacher', label: 'Giáo viên' },
  { value: 'parent', label: 'Phụ huynh' },
  // { value: 'registrar', label: 'Phòng đăng ký' },
  // { value: 'admission', label: 'Phòng tuyển sinh' },
  { value: 'bos', label: 'Ban đào tạo' },
  // { value: 'principal', label: 'Hiệu trưởng' },
  // { value: 'service', label: 'Dịch vụ' },
  { value: 'technical', label: 'Kỹ thuật' },
  // { value: 'marcom', label: 'Marcom' },
  { value: 'hr', label: 'Nhân sự' },
  // { value: 'bod', label: 'Hội đồng quản trị' },
  { value: 'user', label: 'Người dùng thông thường' },
  { value: 'librarian', label: 'Thủ thư' }
];

interface BaseUser {
  username?: string;
  email: string;
  phone?: string;
  role: string;
  fullname: string;
  active: boolean;
  school?: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
  employeeCode?: string;
  department?: string;
  jobTitle?: string;
}

interface UserFormData extends BaseUser {
  password?: string;
  confirmPassword?: string;
  avatar?: File | string;
  newAvatarFile?: File;
}

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData) => void;
  onDelete?: (userId: string) => void;
  onChangePassword?: (user: BaseUser) => void;
  mode: 'create' | 'edit' | 'changePassword';
  userData?: UserFormData;
}

const UserDialog = ({ open, onOpenChange, onSubmit, onDelete, onChangePassword, mode, userData }: UserDialogProps) => {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    phone: '',
    role: 'user',
    fullname: '',
    active: true,
    password: '',
    confirmPassword: '',
    _id: '',
    createdAt: '',
    updatedAt: '',
    avatarUrl: '',
    employeeCode: '',
    department: '',
    jobTitle: ''
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Cập nhật form khi dialog mở và có userData
  useEffect(() => {
    if (open && userData) {
      setFormData({
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        fullname: userData.fullname,
        active: userData.active ?? true,
        password: '',
        confirmPassword: '',
        school: userData.school,
        _id: userData._id,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        avatarUrl: userData.avatarUrl,
        employeeCode: userData.employeeCode,
        department: userData.department,
        jobTitle: userData.jobTitle
      });
    } else if (!open) {
      // Reset form khi dialog đóng
      setFormData({
        email: '',
        phone: '',
        role: 'user',
        fullname: '',
        active: true,
        password: '',
        confirmPassword: '',
        school: '',
        _id: '',
        createdAt: '',
        updatedAt: '',
        avatarUrl: '',
        employeeCode: '',
        department: '',
        jobTitle: ''
      });
    }
  }, [open, userData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // const handleSwitchChange = (name: string, checked: boolean): void => {
  //   setFormData(prev => ({
  //     ...prev,
  //     [name]: checked
  //   }));
  // };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' && 'Thêm người dùng mới'}
              {mode === 'edit' && 'Cập nhật thông tin người dùng'}
              {mode === 'changePassword' && 'Đổi mật khẩu người dùng'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create' && 'Nhập thông tin người dùng mới'}
              {mode === 'edit' && 'Cập nhật thông tin người dùng'}
              {mode === 'changePassword' && 'Nhập mật khẩu mới cho người dùng'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            {(mode === 'create' || mode === 'edit') && (
              <>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Số điện thoại
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      className="col-span-3"
                      placeholder="0912345678"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="fullname" className="text-right">
                      Họ tên
                    </Label>
                    <Input
                      id="fullname"
                      name="fullname"
                      value={formData.fullname}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="avatar" className="text-right mt-3">
                      Ảnh đại diện
                    </Label>
                    <div className="col-span-3 space-y-2">
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, newAvatarFile: e.target.files?.[0] }))
                        }
                      />
                      {/* Hiển thị ảnh hiện có hoặc ảnh preview mới */}
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={
                            formData.newAvatarFile
                              ? URL.createObjectURL(formData.newAvatarFile)
                              : formData.avatarUrl || undefined
                          }
                          alt="Ảnh đại diện"
                          name={formData.fullname}
                          email={formData.email}
                          size={80}
                          className="border-2 border-gray-200"
                        />
                       
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Vai trò
                    </Label>
                    <Select
                      name="role"
                      value={formData.role}
                      onValueChange={(value) => handleSelectChange('role', value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Chọn vai trò">
                          {formData.role ? translateRole(formData.role) : "Chọn vai trò"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="employeeCode" className="text-right">
                      Mã nhân viên
                    </Label>
                    <Input
                      id="employeeCode"
                      name="employeeCode"
                      value={formData.employeeCode || ''}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="department" className="text-right">
                      Phòng ban
                    </Label>
                    <Input
                      id="department"
                      name="department"
                      value={formData.department || ''}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="jobTitle" className="text-right">
                      Chức danh
                    </Label>
                    <Input
                      id="jobTitle"
                      name="jobTitle"
                      value={formData.jobTitle || ''}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  {mode === 'create' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">
                        Mật khẩu
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="col-span-3"
                      />
                    </div>
                  )}
                  {/* <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="active" className="text-right">
                      Trạng thái
                    </Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="active"
                        name="active"
                        checked={formData.active}
                        onCheckedChange={(checked) => handleSwitchChange('active', checked)}
                      />
                      <Label htmlFor="active" className="ml-2">
                        {formData.active ? 'Active' : 'Deactive'}
                      </Label>
                    </div>
                  </div> */}
                </div>
              </>
            )}
            {mode === 'changePassword' && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Mật khẩu mới
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="confirmPassword" className="text-right">
                    Xác nhận mật khẩu
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              {mode === 'edit' && userData?._id && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  Xóa
                </Button>
              )}
              {mode === 'edit' && onChangePassword && (
                <Button
                  type="button"
                  onClick={() => onChangePassword(formData)}
                >
                  Đổi mật khẩu
                </Button>
              )}
              <Button type="submit">
                {mode === 'create' && 'Thêm mới'}
                {mode === 'edit' && 'Cập nhật'}
                {mode === 'changePassword' && 'Đổi mật khẩu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa người dùng "{userData?.fullname}" không?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userData?._id && onDelete) {
                  onDelete(userData._id);
                  setIsDeleteDialogOpen(false);
                  onOpenChange(false);
                }
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserDialog;
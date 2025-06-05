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

interface BaseUser {
  email: string;
  role: string;
  fullname: string;
  active: boolean;
  school?: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
}

interface UserFormData extends BaseUser {
  password?: string;
  confirmPassword?: string;
  avatar?: File | string;
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
    role: 'user',
    fullname: '',
    active: true,
    password: '',
    confirmPassword: '',
    _id: '',
    createdAt: '',
    updatedAt: '',
    avatar: undefined  
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Cập nhật form khi dialog mở và có userData
  useEffect(() => {
    if (open && userData) {
      setFormData({
        email: userData.email,
        role: userData.role,
        fullname: userData.fullname,
        active: userData.active ?? true,
        password: '',
        confirmPassword: '',
        school: userData.school,
        _id: userData._id,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        avatar: userData.avatar,  

      });
    } else if (!open) {
      // Reset form khi dialog đóng
      setFormData({
        email: '',
        role: 'user',
        fullname: '',
        active: true,
        password: '',
        confirmPassword: '',
        school: '',
        _id: '',
        createdAt: '',
        updatedAt: '',
        avatar: undefined
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
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="avatar" className="text-right">
                      Ảnh đại diện
                    </Label>
                    <div className="col-span-3 space-y-2">
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, avatar: e.target.files?.[0] }))
                        }
                      />
                      {/* preview */}
                      {formData.avatar && typeof formData.avatar !== 'string' && (
                        <img
                          src={URL.createObjectURL(formData.avatar)}
                          alt="preview"
                          className="h-16 w-16 object-cover rounded-full"
                        />
                      )}
                      {typeof formData.avatar === 'string' && formData.avatar && (
                        <img
                          src={formData.avatar}
                          alt="preview"
                          className="h-16 w-16 object-cover rounded-full"
                        />
                      )}
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
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="superadmin">Super Admin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="teacher">Giáo viên</SelectItem>
                        <SelectItem value="parent">Phụ huynh</SelectItem>
                        <SelectItem value="registrar">Giáo vụ</SelectItem>
                        <SelectItem value="admission">Tuyển sinh</SelectItem>
                        <SelectItem value="bos">Ban giám hiệu</SelectItem>
                        <SelectItem value="principal">Hiệu trưởng</SelectItem>
                        <SelectItem value="service">Dịch vụ</SelectItem>
                      </SelectContent>
                    </Select>
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
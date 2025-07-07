import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { DatePicker } from "../../../components/ui/datepicker";
import { Loader2, Upload, Calendar, FileText, Edit, Trash2, Plus, Eye } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import { api } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../lib/config";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";

interface TimetableSchedule {
  _id: string;
  name: string;
  schoolYear: {
    _id: string;
    code: string;
  };
  class: {
    _id: string;
    className: string;
  };
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
  fileUrl?: string;
  fileName?: string;
  createdBy?: {
    _id: string;
    fullname: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TimetableListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSchoolYear: string;
  selectedClass: string;
  onTimetableUpdated: () => void;
}

interface EditFormData {
  name: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  status: 'active' | 'inactive';
  file: File | null;
}

export const TimetableListDialog: React.FC<TimetableListDialogProps> = ({
  isOpen,
  onClose,
  selectedSchoolYear,
  selectedClass,
  onTimetableUpdated
}) => {
  const [schedules, setSchedules] = useState<TimetableSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TimetableSchedule | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<TimetableSchedule | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: '',
    startDate: undefined,
    endDate: undefined,
    status: 'active',
    file: null
  });
  const [editLoading, setEditLoading] = useState(false);
  const [fileError, setFileError] = useState<string>('');
  const { toast } = useToast();

  // Fetch schedules when dialog opens
  useEffect(() => {
    if (isOpen && selectedSchoolYear && selectedClass) {
      fetchSchedules();
    }
  }, [isOpen, selectedSchoolYear, selectedClass]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_ENDPOINTS.TIMETABLE_SCHEDULES}?schoolYearId=${selectedSchoolYear}&classId=${selectedClass}`);
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách thời khoá biểu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (schedule: TimetableSchedule) => {
    setEditingSchedule(schedule);
    setEditFormData({
      name: schedule.name,
      startDate: new Date(schedule.startDate),
      endDate: new Date(schedule.endDate),
      status: schedule.status,
      file: null
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (schedule: TimetableSchedule) => {
    setScheduleToDelete(schedule);
    setIsDeleteDialogOpen(true);
  };

  const handleEditInputChange = (field: keyof EditFormData, value: string | Date | undefined | File | null) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'file') {
      setFileError('');
    }
  };

  const handleEditFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        setFileError('Chỉ chấp nhận file Excel (.xlsx, .xls)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setFileError('File quá lớn. Kích thước tối đa 5MB');
        return;
      }
      
      setFileError('');
    }
    handleEditInputChange('file', file);
  };

  const validateEditForm = (): boolean => {
    if (!editFormData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên thời khoá biểu",
        variant: "destructive"
      });
      return false;
    }

    if (!editFormData.startDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày bắt đầu",
        variant: "destructive"
      });
      return false;
    }

    if (!editFormData.endDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày kết thúc",
        variant: "destructive"
      });
      return false;
    }

    if (editFormData.startDate >= editFormData.endDate) {
      toast({
        title: "Lỗi",
        description: "Ngày kết thúc phải sau ngày bắt đầu",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleEditSubmit = async () => {
    if (!validateEditForm() || !editingSchedule) return;

    try {
      setEditLoading(true);

      const updateData = {
        name: editFormData.name,
        startDate: editFormData.startDate?.toISOString().split('T')[0],
        endDate: editFormData.endDate?.toISOString().split('T')[0],
        status: editFormData.status
      };

      await api.put(API_ENDPOINTS.TIMETABLE_SCHEDULE(editingSchedule._id), updateData);
      
      // Upload file if provided
      if (editFormData.file) {
        const formDataFile = new FormData();
        formDataFile.append('file', editFormData.file);
        
        await api.post(
          API_ENDPOINTS.TIMETABLE_SCHEDULE_UPLOAD(editingSchedule._id),
          formDataFile,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      toast({
        title: "Thành công",
        description: "Cập nhật thời khoá biểu thành công"
      });

      setIsEditDialogOpen(false);
      setEditingSchedule(null);
      fetchSchedules();
      onTimetableUpdated();
    } catch (error: any) {
      console.error('Error updating timetable:', error);
      const errorMessage = error.response?.data?.message || "Không thể cập nhật thời khoá biểu. Vui lòng thử lại.";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!scheduleToDelete) return;

    try {
      setEditLoading(true);
      await api.delete(API_ENDPOINTS.TIMETABLE_SCHEDULE(scheduleToDelete._id));
      
      toast({
        title: "Thành công",
        description: "Xóa thời khoá biểu thành công"
      });

      setIsDeleteDialogOpen(false);
      setScheduleToDelete(null);
      fetchSchedules();
      onTimetableUpdated();
    } catch (error: any) {
      console.error('Error deleting timetable:', error);
      const errorMessage = error.response?.data?.message || "Không thể xóa thời khoá biểu. Vui lòng thử lại.";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setEditLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        status === 'active' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
      </span>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Danh sách thời khoá biểu
            </DialogTitle>
            <DialogDescription>
              Quản lý các thời khoá biểu đã tạo cho lớp học này
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Đang tải...</span>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có thời khoá biểu nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên thời khoá biểu</TableHead>
                    <TableHead>Ngày bắt đầu</TableHead>
                    <TableHead>Ngày kết thúc</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Người tạo</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule._id}>
                      <TableCell className="font-medium">{schedule.name}</TableCell>
                      <TableCell>{formatDate(schedule.startDate)}</TableCell>
                      <TableCell>{formatDate(schedule.endDate)}</TableCell>
                      <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                      <TableCell>
                        {schedule.fileUrl ? (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-blue-600 hover:underline cursor-pointer">
                              {schedule.fileName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Chưa có file</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {schedule.createdBy?.fullname || 'Không xác định'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(schedule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(schedule)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={() => setIsEditDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Chỉnh sửa thời khoá biểu
            </DialogTitle>
            <DialogDescription>
              Cập nhật thông tin thời khoá biểu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tên thời khoá biểu */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Tên thời khoá biểu *</Label>
              <Input
                id="edit-name"
                placeholder="VD: Thời khoá biểu học kỳ 1"
                value={editFormData.name}
                onChange={(e) => handleEditInputChange('name', e.target.value)}
              />
            </div>

            {/* Ngày bắt đầu */}
            <div className="space-y-2">
              <Label>Ngày bắt đầu *</Label>
              <DatePicker
                date={editFormData.startDate}
                setDate={(date) => handleEditInputChange('startDate', date)}
              />
            </div>

            {/* Ngày kết thúc */}
            <div className="space-y-2">
              <Label>Ngày kết thúc *</Label>
              <DatePicker
                date={editFormData.endDate}
                setDate={(date) => handleEditInputChange('endDate', date)}
              />
            </div>

            {/* Trạng thái */}
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <select
                value={editFormData.status}
                onChange={(e) => handleEditInputChange('status', e.target.value as 'active' | 'inactive')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>

            {/* File upload (optional) */}
            <div className="space-y-2">
              <Label htmlFor="edit-file">File thời khoá biểu (tùy chọn)</Label>
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleEditFileChange}
                  className="hidden"
                  id="edit-file"
                  disabled={editLoading}
                />
                <Button asChild variant="outline" className="w-full">
                  <label htmlFor="edit-file" className="cursor-pointer flex items-center gap-2">
                    {editFormData.file ? (
                      <>
                        <FileText className="h-4 w-4" />
                        {editFormData.file.name}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Chọn file Excel (tùy chọn)
                      </>
                    )}
                  </label>
                </Button>
              </div>
              {fileError && (
                <p className="text-sm text-red-500">{fileError}</p>
              )}
              <p className="text-xs text-gray-500">
                Chỉ upload file mới nếu muốn thay thế file hiện tại
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={editLoading}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleEditSubmit}
              disabled={editLoading}
            >
              {editLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang cập nhật...
                </>
              ) : (
                "Cập nhật"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa thời khoá biểu "{scheduleToDelete?.name}"? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={editLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={editLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {editLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang xóa...
                </>
              ) : (
                "Xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}; 
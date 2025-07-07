import React, { useState } from 'react';
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
import { Loader2, Upload, Calendar, FileText } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import { api } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../lib/config";

interface AddTimetableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSchoolYear: string;
  selectedClass: string;
  onTimetableAdded: () => void;
}

interface TimetableFormData {
  name: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  file: File | null;
}

export const AddTimetableDialog: React.FC<AddTimetableDialogProps> = ({
  isOpen,
  onClose,
  selectedSchoolYear,
  selectedClass,
  onTimetableAdded
}) => {
  const [formData, setFormData] = useState<TimetableFormData>({
    name: '',
    startDate: undefined,
    endDate: undefined,
    file: null
  });
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState<string>('');
  const { toast } = useToast();

  const handleInputChange = (field: keyof TimetableFormData, value: string | File | null | Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear file error when file is selected
    if (field === 'file') {
      setFileError('');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      // Validate file type
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        setFileError('Chỉ chấp nhận file Excel (.xlsx, .xls)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFileError('File quá lớn. Kích thước tối đa 5MB');
        return;
      }
      
      setFileError('');
    }
    handleInputChange('file', file);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên thời khoá biểu",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.startDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày bắt đầu",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.endDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày kết thúc",
        variant: "destructive"
      });
      return false;
    }

    if (formData.startDate >= formData.endDate) {
      toast({
        title: "Lỗi",
        description: "Ngày kết thúc phải sau ngày bắt đầu",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.file) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file thời khoá biểu",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Tạo thời khoá biểu mới
      const scheduleData = {
        name: formData.name,
        schoolYear: selectedSchoolYear,
        class: selectedClass,
        startDate: formData.startDate?.toISOString().split('T')[0],
        endDate: formData.endDate?.toISOString().split('T')[0]
      };

      const response = await api.post(API_ENDPOINTS.TIMETABLE_SCHEDULES, scheduleData);
      
      // Nếu có file, upload file
      if (formData.file) {
        const formDataFile = new FormData();
        formDataFile.append('file', formData.file);
        
        await api.post(
          API_ENDPOINTS.TIMETABLE_SCHEDULE_UPLOAD(response.data.schedule._id),
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
        description: "Thời khoá biểu đã được thêm thành công"
      });

      // Reset form
      setFormData({
        name: '',
        startDate: undefined,
        endDate: undefined,
        file: null
      });

      onTimetableAdded();
      onClose();
    } catch (error) {
      console.error('Error adding timetable:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Không thể thêm thời khoá biểu. Vui lòng thử lại.";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      startDate: undefined,
      endDate: undefined,
      file: null
    });
    setFileError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Thêm thời khoá biểu mới
          </DialogTitle>
          <DialogDescription>
            Tạo thời khoá biểu mới với tên, khoảng thời gian và file Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tên thời khoá biểu */}
          <div className="space-y-2">
            <Label htmlFor="timetable-name">Tên thời khoá biểu *</Label>
            <Input
              id="timetable-name"
              placeholder="VD: Thời khoá biểu học kỳ 1"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>

          {/* Ngày bắt đầu */}
          <div className="space-y-2">
            <Label>Ngày bắt đầu *</Label>
            <DatePicker
              date={formData.startDate}
              setDate={(date) => handleInputChange('startDate', date)}
            />
          </div>

          {/* Ngày kết thúc */}
          <div className="space-y-2">
            <Label>Ngày kết thúc *</Label>
            <DatePicker
              date={formData.endDate}
              setDate={(date) => handleInputChange('endDate', date)}
            />
          </div>

          {/* File upload */}
          <div className="space-y-2">
            <Label htmlFor="timetable-file">File thời khoá biểu *</Label>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="timetable-file"
                disabled={loading}
              />
              <Button asChild variant="outline" className="w-full">
                <label htmlFor="timetable-file" className="cursor-pointer flex items-center gap-2">
                  {formData.file ? (
                    <>
                      <FileText className="h-4 w-4" />
                      {formData.file.name}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Chọn file Excel
                    </>
                  )}
                </label>
              </Button>
            </div>
            {fileError && (
              <p className="text-sm text-red-500">{fileError}</p>
            )}
            <p className="text-xs text-gray-500">
              Hỗ trợ file Excel (.xlsx, .xls). Kích thước tối đa 5MB
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Đang thêm...
              </>
            ) : (
              "Thêm thời khoá biểu"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 
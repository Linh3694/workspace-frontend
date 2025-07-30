import React, { useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { API_ENDPOINTS } from '../../../config/api';
import { toast } from 'sonner';
import type { AwardCategory, RecipientType } from '../../../types';

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated: (category: AwardCategory) => void;
}

interface FormData {
  name: string;
  nameEng: string;
  description: string;
  descriptionEng: string;
  recipientType: RecipientType;
}

const CreateCategoryDialog: React.FC<CreateCategoryDialogProps> = ({
  open,
  onOpenChange,
  onCategoryCreated,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    nameEng: '',
    description: '',
    descriptionEng: '',
    recipientType: 'student',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên loại vinh danh là bắt buộc';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        subAwards: [], // Initialize with empty sub-awards
      };

      const response = await axios.post(API_ENDPOINTS.AWARD_CATEGORIES, payload);
      
      toast.success('Tạo loại vinh danh thành công!');
      onCategoryCreated(response.data);
      
      // Reset form
      setFormData({
        name: '',
        nameEng: '',
        description: '',
        descriptionEng: '',
        recipientType: 'student',
      });
      setErrors({});
      
    } catch (error: unknown) {
      console.error('Lỗi khi tạo loại vinh danh:', error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo loại vinh danh');
      } else {
        toast.error('Có lỗi xảy ra khi tạo loại vinh danh');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        nameEng: '',
        description: '',
        descriptionEng: '',
        recipientType: 'student',
      });
      setErrors({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tạo loại vinh danh mới</DialogTitle>
          <DialogDescription>
            Thêm một loại giải thưởng hoặc vinh danh mới vào hệ thống
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Tên tiếng Việt */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Tên loại vinh danh <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="VD: Học sinh giỏi"
                className={errors.name ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Tên tiếng Anh */}
            <div className="space-y-2">
              <Label htmlFor="nameEng">Tên tiếng Anh</Label>
              <Input
                id="nameEng"
                value={formData.nameEng}
                onChange={(e) => handleInputChange('nameEng', e.target.value)}
                placeholder="VD: Outstanding Student"
                className={errors.nameEng ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.nameEng && (
                <p className="text-sm text-red-500">{errors.nameEng}</p>
              )}
            </div>

            {/* Mô tả tiếng Việt */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Mô tả <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Mô tả chi tiết về loại vinh danh này..."
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Mô tả tiếng Anh */}
            <div className="space-y-2">
              <Label htmlFor="descriptionEng">Mô tả tiếng Anh</Label>
              <Textarea
                id="descriptionEng"
                value={formData.descriptionEng}
                onChange={(e) => handleInputChange('descriptionEng', e.target.value)}
                placeholder="English description for this award category..."
                rows={3}
                className={errors.descriptionEng ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.descriptionEng && (
                <p className="text-sm text-red-500">{errors.descriptionEng}</p>
              )}
            </div>

            {/* Loại đối tượng vinh danh */}
            <div className="space-y-2">
              <Label htmlFor="recipientType">
                Loại đối tượng vinh danh <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.recipientType}
                onValueChange={(value: RecipientType) => handleInputChange('recipientType', value)}
                disabled={loading}
              >
                <SelectTrigger className={errors.recipientType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Chọn loại đối tượng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Học sinh</SelectItem>
                  <SelectItem value="class">Lớp</SelectItem>
                </SelectContent>
              </Select>
              {errors.recipientType && (
                <p className="text-sm text-red-500">{errors.recipientType}</p>
              )}
            </div>


          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo loại vinh danh'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCategoryDialog; 
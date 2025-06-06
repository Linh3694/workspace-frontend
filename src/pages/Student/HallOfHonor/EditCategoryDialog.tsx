import React, { useState, useEffect } from 'react';
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
import { API_ENDPOINTS, UPLOAD_URL, BASE_URL } from '../../../lib/config';
import { toast } from 'sonner';

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: AwardCategory | null;
  onCategoryUpdated: (category: AwardCategory) => void;
}

interface AwardCategory {
  _id: string;
  name: string;
  nameEng: string;
  description: string;
  descriptionEng: string;
  coverImage?: string;
  subAwards: SubAward[];
  createdAt: string;
  updatedAt: string;
}

interface SubAward {
  type: string;
  label: string;
  labelEng?: string;
  priority?: number;
  schoolYear?: string;
}

interface FormData {
  name: string;
  nameEng: string;
  description: string;
  descriptionEng: string;
  coverImage: string;
}

const EditCategoryDialog: React.FC<EditCategoryDialogProps> = ({
  open,
  onOpenChange,
  category,
  onCategoryUpdated,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    nameEng: '',
    description: '',
    descriptionEng: '',
    coverImage: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Populate form when category changes
  useEffect(() => {
    if (category && open) {
      setFormData({
        name: category.name || '',
        nameEng: category.nameEng || '',
        description: category.description || '',
        descriptionEng: category.descriptionEng || '',
        coverImage: category.coverImage || '',
      });
      setErrors({});
      setSelectedFile(null);
      setPreviewUrl('');
    }
  }, [category, open]);

  // Handle file selection and preview
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Clear any existing coverImage error
      if (errors.coverImage) {
        setErrors(prev => ({
          ...prev,
          coverImage: undefined
        }));
      }
    }
  };

  // Upload image to server
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('coverImage', file);

    const response = await axios.post(`${UPLOAD_URL}/HallOfFame`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Upload response:', response.data);
    
    // Return the full path or construct it properly
    return response.data.filePath || 
           (response.data.filename ? `/uploads/HallOfFame/${response.data.filename}` : '') ||
           response.data.url || 
           '';
  };

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
    
    if (!category || !validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      let coverImageUrl = formData.coverImage;
      
      // Upload new image if selected
      if (selectedFile) {
        try {
          coverImageUrl = await uploadImage(selectedFile);
        } catch (uploadError) {
          console.error('Lỗi khi upload ảnh:', uploadError);
          toast.error('Có lỗi xảy ra khi upload ảnh bìa');
          setLoading(false);
          return;
        }
      }

      const payload = {
        ...formData,
        coverImage: coverImageUrl,
        // Keep existing subAwards
        subAwards: category.subAwards,
      };

      const response = await axios.put(API_ENDPOINTS.AWARD_CATEGORY(category._id), payload);
      
      toast.success('Cập nhật loại vinh danh thành công!');
      onCategoryUpdated(response.data);
      
    } catch (error: unknown) {
      console.error('Lỗi khi cập nhật loại vinh danh:', error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật loại vinh danh');
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật loại vinh danh');
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
        coverImage: '',
      });
      setErrors({});
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl('');
      onOpenChange(false);
    }
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[70%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa loại vinh danh</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin loại giải thưởng hoặc vinh danh
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Image Section */}
          <div className="space-y-4">            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Image */}
              {formData.coverImage && !previewUrl && (
                <div className="space-y-2 flex items-center justify-center">
                    <img
                      src={formData.coverImage.startsWith('http') 
                        ? formData.coverImage 
                        : `${BASE_URL}${formData.coverImage.startsWith('/') ? '' : '/'}${formData.coverImage}`
                      }
                      alt="Current cover"
                      className="w-full h-full object-cover rounded-md border"
                      onError={(e) => {
                        console.error('Error loading image:', formData.coverImage);
                        console.error('Full URL:', formData.coverImage.startsWith('http') 
                          ? formData.coverImage 
                          : `${BASE_URL}${formData.coverImage.startsWith('/') ? '' : '/'}${formData.coverImage}`
                        );
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />               
                </div>
              )}

              {/* Preview New Image */}
              {previewUrl && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Ảnh mới</Label>
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview new cover"
                      className="w-full h-32 object-cover rounded-md border"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="edit-coverImage">
                {formData.coverImage ? 'Thay đổi ảnh bìa' : 'Chọn ảnh bìa'}
              </Label>
              <Input
                id="edit-coverImage"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                disabled={loading}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Hỗ trợ định dạng: JPEG, JPG, PNG, WebP. Tối đa 5MB.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Tên tiếng Việt */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Tên loại vinh danh <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
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
              <Label htmlFor="edit-nameEng">Tên tiếng Anh</Label>
              <Input
                id="edit-nameEng"
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
              <Label htmlFor="edit-description">
                Mô tả <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit-description"
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
              <Label htmlFor="edit-descriptionEng">Mô tả tiếng Anh</Label>
              <Textarea
                id="edit-descriptionEng"
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
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryDialog; 
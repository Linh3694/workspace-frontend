import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from './button';
import { toast } from 'sonner';
import { API_URL } from '@/config/api';


interface UploadedImage {
  url: string;
  originalName?: string;
  size?: number;
  caption?: string;
}

interface ImageUploadProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;

    // Kiểm tra số lượng ảnh tối đa
    if (images.length + files.length > maxImages) {
      toast.error(`Chỉ có thể upload tối đa ${maxImages} ảnh`);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    
    Array.from(files).forEach(file => {
      // Kiểm tra định dạng file
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} không phải là ảnh`);
        return;
      }
      
      // Kiểm tra kích thước file (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} quá lớn (tối đa 5MB)`);
        return;
      }
      
      formData.append('images', file);
    });

    try {
      const response = await fetch(`${API_URL}/library-activities/upload-images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Lỗi khi upload ảnh');
      }

      const data = await response.json();
      console.log('Upload response:', data); // Debug log
      
      // Convert relative URLs to full URLs
      const processedImages = data.images.map((img: UploadedImage) => {
        let fullUrl = img.url;
        if (!img.url.startsWith('http')) {
          // Create base URL by removing /api from API_URL
          // API_URL: https://dev.wellspring.edu.vn/api
          // baseUrl: https://dev.wellspring.edu.vn
          let baseUrl = API_URL;
          if (baseUrl.endsWith('/api')) {
            baseUrl = baseUrl.slice(0, -4); // Remove '/api' from the end
          }
          fullUrl = `${baseUrl}${img.url}`;
        }
        console.log('API_URL:', API_URL);
        console.log('Base URL:', API_URL.replace('/api', ''));
        console.log('Original URL:', img.url, 'Full URL:', fullUrl);
        return {
          ...img,
          url: fullUrl
        };
      });
      
      const newImages = [...images, ...processedImages];
      onImagesChange(newImages);
      toast.success(data.message);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Không thể upload ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!uploading ? openFileDialog : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={uploading}
        />
        
        <div className="flex flex-col items-center">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-sm text-gray-600">Đang upload...</p>
            </>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Kéo thả ảnh vào đây hoặc click để chọn
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF tối đa 5MB mỗi ảnh
              </p>
              <p className="text-xs text-gray-500">
                Tối đa {maxImages} ảnh ({images.length}/{maxImages})
              </p>
            </>
          )}
        </div>
      </div>

      {/* Preview Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => {
            console.log('Image URL:', image.url); // Debug log
            return (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.url}
                    alt={image.originalName || `Ảnh ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      console.error('Image load error:', image.url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                
                {/* Remove Button */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
                
                {/* Image Info */}
                <div className="mt-2">
                  <p className="text-xs text-gray-600 truncate">
                    {image.originalName || `Ảnh ${index + 1}`}
                  </p>
                  {image.size && (
                    <p className="text-xs text-gray-500">
                      {(image.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}; 
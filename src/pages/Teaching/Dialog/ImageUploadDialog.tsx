import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Combobox } from "../../../components/ui/combobox";
import { useToast } from "../../../hooks/use-toast";
import { fileUploadApi } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../lib/config";
import type { SchoolYear } from '../../../types/school.types';
import type { ComboboxOption } from '../../../types/common.types';

interface ImageUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUploadType: 'class' | 'student' | '';
  schoolYears: SchoolYear[];
  classesOptions: ComboboxOption[];
  studentsOptions: ComboboxOption[];
  selectedSchoolYear: string;
  onSchoolYearChange: (year: string) => void;
  onSuccess: () => void;
}

const ImageUploadDialog: React.FC<ImageUploadDialogProps> = ({
  isOpen,
  onClose,
  imageUploadType,
  schoolYears,
  classesOptions,
  studentsOptions,
  selectedSchoolYear,
  onSchoolYearChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const zipFileInputRef = useRef<HTMLInputElement>(null);
  
  const [updateImageClassId, setUpdateImageClassId] = useState<string>("");
  const [updateImageStudentId, setUpdateImageStudentId] = useState<string>("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  
  // Bulk upload states
  const [selectedZipFile, setSelectedZipFile] = useState<File | null>(null);
  const [uploadingZip, setUploadingZip] = useState<boolean>(false);
  const [bulkUploadSchoolYear, setBulkUploadSchoolYear] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [bulkUploadResults, setBulkUploadResults] = useState<{ success: string[], errors: string[] } | null>(null);

  // Cleanup image preview URL when component unmounts hoặc file thay đổi
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Clear all states when dialog closes
  useEffect(() => {
    if (!isOpen) {
      clearSelectedImage();
      setUpdateImageClassId("");
      setUpdateImageStudentId("");
      setSelectedZipFile(null);
      setBulkUploadSchoolYear("");
      setUploadProgress(0);
      setBulkUploadResults(null);
      if (zipFileInputRef.current) zipFileInputRef.current.value = '';
    }
  }, [isOpen]);

  // Handle image file selection
  const handleImageFileSelect = (file: File) => {
    setSelectedImageFile(file);
    
    // Cleanup previous URL
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    
    // Create new preview URL
    const newPreviewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(newPreviewUrl);
  };

  // Clear selected image
  const clearSelectedImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    if (imageFileInputRef.current) {
      imageFileInputRef.current.value = '';
    }
  };

  // Handle upload image
  const handleUploadImage = async () => {
    if (!selectedImageFile) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file ảnh",
        variant: "destructive"
      });
      return;
    }

    // Validate required fields based on image type
    if (imageUploadType === 'class' && !updateImageClassId) {
      toast({
        title: "Lỗi", 
        description: "Vui lòng chọn lớp",
        variant: "destructive"
      });
      return;
    }

    if (imageUploadType === 'student' && !updateImageStudentId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn học sinh", 
        variant: "destructive"
      });
      return;
    }

    if (imageUploadType === 'student' && !selectedSchoolYear) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn năm học cho ảnh học sinh", 
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingImage(true);
      
      if (imageUploadType === 'student') {
        // Upload ảnh học sinh
        const formData = new FormData();
        formData.append('avatar', selectedImageFile);
        formData.append('schoolYear', selectedSchoolYear);

        await fileUploadApi.post(`${API_ENDPOINTS.STUDENTS}/${updateImageStudentId}/photo`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        toast({
          title: "Thành công",
          description: "Upload ảnh học sinh thành công",
        });
      } else {
        // Upload ảnh lớp
        const formData = new FormData();
        formData.append('classImage', selectedImageFile);

        await fileUploadApi.post(`${API_ENDPOINTS.CLASSES}/${updateImageClassId}/upload-image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        toast({
          title: "Thành công",
          description: "Upload ảnh lớp thành công",
        });
      }

      // Clear form and close dialog
      clearSelectedImage();
      setUpdateImageClassId('');
      setUpdateImageStudentId('');
      onSuccess();
      onClose();

    } catch (error: unknown) {
      console.error('Upload error:', error);
      const axiosError = error as { response?: { data: unknown } };
      let message = "Không thể upload ảnh. Vui lòng thử lại.";
      
      if (axiosError.response && axiosError.response.data) {
        const respData = axiosError.response.data;
        if (typeof respData === 'string') {
          message = respData;
        } else if (typeof respData === 'object' && respData !== null) {
          const obj = respData as { message?: string; error?: string };
          message = obj.message || obj.error || message;
        }
      }
      
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle bulk upload ZIP cho học sinh
  const handleUploadStudentZip = async () => {
    if (!selectedZipFile) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file ZIP",
        variant: "destructive"
      });
      return;
    }

    if (!bulkUploadSchoolYear) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn năm học cho upload bulk",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingZip(true);
      setUploadProgress(0);
      setBulkUploadResults(null);
      
      const formData = new FormData();
      formData.append('zipFile', selectedZipFile);
      formData.append('schoolYear', bulkUploadSchoolYear);
      
      const response = await fileUploadApi.post(`${API_ENDPOINTS.STUDENTS}/bulk-upload-images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      // Handle response with results
      if (response.data.results) {
        setBulkUploadResults(response.data.results);
        
        const successCount = response.data.results.success.length;
        const errorCount = response.data.results.errors.length;
        
        toast({
          title: successCount > 0 ? "Xử lý hoàn tất" : "Có lỗi xảy ra",
          description: `${successCount} thành công, ${errorCount} lỗi`,
          variant: errorCount > 0 ? "destructive" : "default",
        });
      } else {
        toast({
          title: "Thành công",
          description: "Upload ZIP ảnh học sinh thành công",
        });
      }

      // Clear form
      setSelectedZipFile(null);
      if (zipFileInputRef.current) {
        zipFileInputRef.current.value = '';
      }
      setBulkUploadSchoolYear("");
      onSuccess();
      
    } catch (error: unknown) {
      console.error('Student ZIP Upload error:', error);
      const axiosError = error as { response?: { data: unknown } };
      let message = "Không thể upload ZIP. Vui lòng thử lại.";
      
      if (axiosError.response && axiosError.response.data) {
        const respData = axiosError.response.data;
        if (typeof respData === 'string') {
          message = respData;
        } else if (typeof respData === 'object' && respData !== null) {
          const obj = respData as { message?: string; error?: string };
          message = obj.message || obj.error || message;
        }
      }
      
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive"
      });
    } finally {
      setUploadingZip(false);
    }
  };

  // Handle bulk upload ZIP cho lớp
  const handleUploadClassZip = async () => {
    if (!selectedZipFile) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file ZIP",
        variant: "destructive"
      });
      return;
    }

    if (!bulkUploadSchoolYear) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn năm học cho upload bulk",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingZip(true);
      setUploadProgress(0);
      setBulkUploadResults(null);
      
      const formData = new FormData();
      formData.append('zipFile', selectedZipFile);
      formData.append('schoolYear', bulkUploadSchoolYear);
      
      const response = await fileUploadApi.post(`${API_ENDPOINTS.CLASSES}/bulk-upload-images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      // Handle response with results
      if (response.data.results) {
        setBulkUploadResults(response.data.results);
        
        const successCount = response.data.results.success.length;
        const errorCount = response.data.results.errors.length;
        
        toast({
          title: successCount > 0 ? "Xử lý hoàn tất" : "Có lỗi xảy ra",
          description: `${successCount} thành công, ${errorCount} lỗi`,
          variant: errorCount > 0 ? "destructive" : "default",
        });
      } else {
        toast({
          title: "Thành công",
          description: "Upload ZIP ảnh lớp thành công",
        });
      }

      // Clear form
      setSelectedZipFile(null);
      if (zipFileInputRef.current) {
        zipFileInputRef.current.value = '';
      }
      setBulkUploadSchoolYear("");
      onSuccess();
      
    } catch (error: unknown) {
      console.error('Class ZIP Upload error:', error);
      const axiosError = error as { response?: { data: unknown } };
      let message = "Không thể upload ZIP. Vui lòng thử lại.";
      
      if (axiosError.response && axiosError.response.data) {
        const respData = axiosError.response.data;
        if (typeof respData === 'string') {
          message = respData;
        } else if (typeof respData === 'object' && respData !== null) {
          const obj = respData as { message?: string; error?: string };
          message = obj.message || obj.error || message;
        }
      }
      
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive"
      });
    } finally {
      setUploadingZip(false);
    }
  };

  const renderIndividualUpload = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          {imageUploadType === 'class' ? 'Upload ảnh lớp' : 'Upload ảnh học sinh'}
        </h3>
        
        {imageUploadType === 'class' ? (
          <div className="space-y-2">
            <Label htmlFor="updateImageClass">Lớp</Label>
            <Combobox
              multiple={false}
              value={updateImageClassId}
              onSelect={(value) => setUpdateImageClassId(value)}
              options={classesOptions}
              placeholder="Chọn lớp"
              searchPlaceholder="Tìm kiếm lớp..."
              emptyText="Không có lớp"
              className="w-full"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="updateImageStudent">Học sinh</Label>
              <Combobox
                multiple={false}
                value={updateImageStudentId}
                onSelect={(value) => setUpdateImageStudentId(value)}
                options={studentsOptions}
                placeholder="Chọn học sinh"
                searchPlaceholder="Tìm kiếm học sinh..."
                emptyText="Không có học sinh"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="updateImageStudentSchoolYear">Năm học</Label>
              <Select value={selectedSchoolYear} onValueChange={onSchoolYearChange}>
                <SelectTrigger>
                  <SelectValue placeholder="--Chọn năm học--" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map((year) => (
                    <SelectItem key={year._id} value={year._id}>
                      {year.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="imageFile">File ảnh *</Label>
          {!imagePreviewUrl ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => imageFileInputRef.current?.click()}
            >
              <div className="space-y-2">
                <p className="text-gray-500">Kéo thả hoặc chọn tệp từ máy tính</p>
                <p className="text-sm text-gray-400">Định dạng hỗ trợ: image/* • Dung lượng tối đa: 5MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <div className="space-y-3">
                  <img 
                    src={imagePreviewUrl} 
                    alt="Preview" 
                    className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {selectedImageFile?.name}
                    </p>
                    <p className="text-xs">
                      {selectedImageFile && `${(selectedImageFile.size / 1024 / 1024).toFixed(2)} MB`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => imageFileInputRef.current?.click()}
                >
                  Thay đổi ảnh
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearSelectedImage}
                >
                  Xóa ảnh
                </Button>
              </div>
            </div>
          )}
          <Input
            type="file"
            accept="image/*"
            ref={imageFileInputRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImageFileSelect(file);
              }
            }}
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button 
            onClick={handleUploadImage} 
            disabled={!selectedImageFile || uploadingImage}
          >
            {uploadingImage ? "Đang upload..." : "Upload ảnh"}
          </Button>
        </div>
      </div>
    );
  };

  const renderBulkUpload = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          Upload ZIP {imageUploadType === 'class' ? 'cho lớp' : 'cho học sinh'}
        </h3>
        
        <div className="space-y-2">
          <Label htmlFor="bulkUploadSchoolYear">Năm học *</Label>
          <Select value={bulkUploadSchoolYear} onValueChange={setBulkUploadSchoolYear}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn năm học cho upload bulk" />
            </SelectTrigger>
            <SelectContent>
              {schoolYears.map((year) => (
                <SelectItem key={year._id} value={year._id}>
                  {year.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-4">
          {!selectedZipFile ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => zipFileInputRef.current?.click()}
            >
              <div className="space-y-2">
                <p className="text-gray-500">Kéo thả hoặc chọn tệp ZIP từ máy tính</p>
                <p className="text-sm text-gray-400">Định dạng hỗ trợ: .zip • Dung lượng tối đa: 1024MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg p-4 text-center">
                <div className="space-y-2">
                  <div className="text-4xl">📦</div>
                  <p className="text-sm font-medium text-gray-800">
                    {selectedZipFile.name}
                  </p>
                  <p className="text-xs text-green-600">
                    {`${(selectedZipFile.size / 1024 / 1024).toFixed(2)} MB`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => zipFileInputRef.current?.click()}
                >
                  Thay đổi file
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedZipFile(null);
                    setBulkUploadResults(null);
                    if (zipFileInputRef.current) zipFileInputRef.current.value = '';
                  }}
                >
                  Xóa file
                </Button>
              </div>
            </div>
          )}
          
          <Input
            type="file"
            accept=".zip"
            ref={zipFileInputRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setSelectedZipFile(file);
                setBulkUploadResults(null); // Clear previous results
              }
            }}
          />
          
          {/* Progress Bar */}
          {uploadingZip && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#002855] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Đang upload... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Results Display */}
          {bulkUploadResults && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Kết quả xử lý:</h4>
              
              {bulkUploadResults.success.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h5 className="font-medium text-green-800 mb-2">
                    Thành công ({bulkUploadResults.success.length})
                  </h5>
                  <ul className="text-sm text-green-700 space-y-1">
                    {bulkUploadResults.success.map((msg, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        {msg}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {bulkUploadResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h5 className="font-medium text-red-800 mb-2">
                    Lỗi ({bulkUploadResults.errors.length})
                  </h5>
                  <ul className="text-sm text-red-700 space-y-1">
                    {bulkUploadResults.errors.map((msg, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">✗</span>
                        {msg}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button 
              onClick={imageUploadType === 'class' ? handleUploadClassZip : handleUploadStudentZip}
              disabled={!selectedZipFile || !bulkUploadSchoolYear || uploadingZip}
            >
              {uploadingZip ? "Đang upload..." : `Upload ZIP ${imageUploadType === 'class' ? 'Lớp' : 'Học Sinh'}`}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Upload Ảnh {imageUploadType === 'class' ? 'Lớp' : 'Học Sinh'}
          </DialogTitle>
          <DialogDescription>
            Tải ảnh lên cho {imageUploadType === 'class' ? 'lớp' : 'học sinh'} (cá nhân hoặc bulk ZIP)
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-6">
          {renderIndividualUpload()}
          
          <hr className="my-6" />
          
          {renderBulkUpload()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploadDialog; 
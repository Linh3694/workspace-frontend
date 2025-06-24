import { useState } from "react";
import { API_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FiUpload, FiCheck, FiX, FiAlertCircle, FiImage } from "react-icons/fi";
import type { Library } from "@/types/library";

// Utility function to handle errors
const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Lỗi không xác định";
};

interface BulkImageUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  libraries: Library[];
  onSuccess: () => void;
}

interface ImageUploadResult {
  fileName: string;
  libraryCode?: string;
  libraryTitle?: string;
  status: 'pending' | 'success' | 'error' | 'not_found';
  message?: string;
}

export function BulkImageUploadDialog({
  isOpen,
  onClose,
  libraries,
  onSuccess
}: BulkImageUploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<ImageUploadResult[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Reset state when dialog opens
  const resetState = () => {
    setSelectedFiles([]);
    setUploadResults([]);
    setUploadProgress(0);
    setIsUploading(false);
  };

  // Handle drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error("Vui lòng chọn các file ảnh (.jpg, .jpeg, .png, .webp)");
      return;
    }
    
    setSelectedFiles(imageFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error("Vui lòng chọn các file ảnh (.jpg, .jpeg, .png, .webp)");
      return;
    }
    
    setSelectedFiles(imageFiles);
  };

  // Extract library code from filename
  const extractLibraryCodeFromFilename = (filename: string): string => {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    
    // Try different patterns:
    // 1. Direct match with library code (e.g., "LIB001.jpg")
    // 2. Filename contains library code (e.g., "cover_LIB001.jpg", "LIB001_cover.jpg")
    
    // Pattern 1: Direct match
    const library = libraries.find(lib => 
      lib.libraryCode.toLowerCase() === nameWithoutExt.toLowerCase()
    );
    if (library) return library.libraryCode;
    
    // Pattern 2: Contains library code
    const libraryWithCode = libraries.find(lib => {
      const code = lib.libraryCode.toLowerCase();
      const name = nameWithoutExt.toLowerCase();
      return name.includes(code) || code.includes(name);
    });
    
    if (libraryWithCode) return libraryWithCode.libraryCode;
    
    // Pattern 3: Try to extract code-like patterns (e.g., LIB001, BOOK-001)
    const codePattern = /([A-Z]{2,}[-_]?\d{3,})/i;
    const match = nameWithoutExt.match(codePattern);
    if (match) {
      const extractedCode = match[1];
      const libraryByExtracted = libraries.find(lib => 
        lib.libraryCode.toLowerCase().includes(extractedCode.toLowerCase()) ||
        extractedCode.toLowerCase().includes(lib.libraryCode.toLowerCase())
      );
      if (libraryByExtracted) return libraryByExtracted.libraryCode;
    }
    
    return nameWithoutExt; // Return original name if no match found
  };

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Vui lòng chọn ít nhất một file ảnh!");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    const results: ImageUploadResult[] = [];
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const libraryCode = extractLibraryCodeFromFilename(file.name);
        
        // Find matching library
        const matchingLibrary = libraries.find(lib => 
          lib.libraryCode.toLowerCase() === libraryCode.toLowerCase()
        );
        
        if (!matchingLibrary) {
          results.push({
            fileName: file.name,
            libraryCode: libraryCode,
            status: 'not_found',
            message: `Không tìm thấy đầu sách với mã: ${libraryCode}`
          });
          setUploadProgress(((i + 1) / selectedFiles.length) * 100);
          continue;
        }

        try {
          const formData = new FormData();
          formData.append("file", file);
          
          const response = await fetch(`${API_URL}/libraries/${matchingLibrary._id}/upload-cover`, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Lỗi khi upload ảnh");
          }

          results.push({
            fileName: file.name,
            libraryCode: matchingLibrary.libraryCode,
            libraryTitle: matchingLibrary.title,
            status: 'success',
            message: 'Upload thành công'
          });

        } catch (error) {
          results.push({
            fileName: file.name,
            libraryCode: matchingLibrary.libraryCode,
            libraryTitle: matchingLibrary.title,
            status: 'error',
            message: getErrorMessage(error)
          });
        }
        
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }
      
      setUploadResults(results);
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      const notFoundCount = results.filter(r => r.status === 'not_found').length;
      
      if (successCount > 0) {
        toast.success(`Upload thành công ${successCount} ảnh!`);
        onSuccess();
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} ảnh upload thất bại!`);
      }
      
      if (notFoundCount > 0) {
        toast.warning(`${notFoundCount} ảnh không tìm thấy đầu sách tương ứng!`);
      }
      
    } catch (error) {
      console.error("Error during bulk upload:", error);
      toast.error("Lỗi trong quá trình upload hàng loạt");
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: ImageUploadResult['status']) => {
    switch (status) {
      case 'success':
        return <FiCheck className="text-green-500" size={16} />;
      case 'error':
        return <FiX className="text-red-500" size={16} />;
      case 'not_found':
        return <FiAlertCircle className="text-yellow-500" size={16} />;
      default:
        return <FiUpload className="text-gray-400" size={16} />;
    }
  };

  const getStatusBadge = (status: ImageUploadResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="text-green-600 border-green-600">Thành công</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-red-600 border-red-600">Lỗi</Badge>;
      case 'not_found':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Không tìm thấy</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-600">Chờ xử lý</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col p-8">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiImage size={20} />
            Upload ảnh bìa hàng loạt
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-2">
              <p>Upload nhiều ảnh bìa cùng lúc cho các đầu sách. Tên file ảnh phải chứa mã đầu sách.</p>
              <p className="text-sm text-[#002855]">
                <strong>Ví dụ:</strong> 00001.jpg, cover_00001.png, BOOK-0001_cover.webp
              </p>
              
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          {/* File Selection Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 ${
              isDragOver 
                ? 'border-primary bg-primary/5 scale-105' 
                : 'border-gray-300 hover:border-primary'
            }`}
            onClick={() => document.getElementById('bulk-image-input')?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-2">
              <FiImage className="mx-auto h-12 w-12 text-gray-400" />
              <div className="text-gray-500">
                <p className="text-lg font-medium">Kéo thả hoặc chọn nhiều ảnh bìa</p>
                <p className="text-sm mt-1">Định dạng hỗ trợ: .jpg, .jpeg, .png, .webp</p>
                <p className="text-xs mt-2 text-[#002855]">
                  Tên file phải chứa mã đầu sách để tự động ghép nối
                </p>
              </div>
              {isDragOver && (
                <div className="text-primary font-medium animate-pulse">
                  Thả ảnh vào đây...
                </div>
              )}
            </div>
            <input
              id="bulk-image-input"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Đã chọn {selectedFiles.length} file ảnh
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFiles([])}
                  disabled={isUploading}
                >
                  Xóa tất cả
                </Button>
              </div>
              
              <ScrollArea className="h-32 border rounded-md p-2">
                <div className="space-y-1">
                  {selectedFiles.map((file, index) => {
                    const libraryCode = extractLibraryCodeFromFilename(file.name);
                    const matchingLibrary = libraries.find(lib => 
                      lib.libraryCode.toLowerCase() === libraryCode.toLowerCase()
                    );
                    
                    return (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <FiImage size={14} />
                          <span className="font-medium">{file.name}</span>
                          <span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {matchingLibrary ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              {matchingLibrary.libraryCode}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              Không tìm thấy: {libraryCode}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Tiến trình upload</Label>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Upload Results */}
          {uploadResults.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Kết quả upload</Label>
              <ScrollArea className="h-48 border rounded-md p-2">
                <div className="space-y-2">
                  {uploadResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <div>
                          <p className="font-medium text-sm">{result.fileName}</p>
                          {result.libraryTitle && (
                            <p className="text-xs text-gray-500">{result.libraryTitle}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(result.status)}
                        {result.message && (
                          <p className="text-xs text-gray-500 mt-1">{result.message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            {selectedFiles.length > 0 && (
              <span>Sẵn sàng upload {selectedFiles.length} ảnh</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                onClose();
                resetState();
              }}
              disabled={isUploading}
            >
              {uploadResults.length > 0 ? 'Đóng' : 'Hủy'}
            </Button>
            <Button 
              onClick={handleBulkUpload} 
              disabled={selectedFiles.length === 0 || isUploading}
              className="bg-[#F05023] text-white"
            >
              {isUploading ? 'Đang upload...' : 'Bắt đầu upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
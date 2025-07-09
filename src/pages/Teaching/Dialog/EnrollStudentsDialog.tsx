import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { api } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../lib/config";
import type { Class } from '../../../types/class.types';
import type { SchoolYear } from '../../../types/school.types';
import type { ComboboxOption } from '../../../types/common.types';

interface EnrollStudentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  schoolYears: SchoolYear[];
  classes: Class[];
  studentsOptions: ComboboxOption[];
  onSuccess: () => void;
}

const EnrollStudentsDialog: React.FC<EnrollStudentsDialogProps> = ({
  isOpen,
  onClose,
  schoolYears,
  classes,
  studentsOptions,
  onSuccess
}) => {
  const { toast } = useToast();
  const enrollExcelFileInputRef = useRef<HTMLInputElement>(null);
  
  const [enrollSchoolYear, setEnrollSchoolYear] = useState<string>("");
  const [enrollClassId, setEnrollClassId] = useState<string>("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [enrollExcelFile, setEnrollExcelFile] = useState<File | null>(null);
  const [uploadingEnrollExcel, setUploadingEnrollExcel] = useState<boolean>(false);

  // Filter classes for manual enroll based on selected school year
  const enrollClassesOptions = classes.filter(c => c.schoolYear._id === enrollSchoolYear);

  const handleCloseDialog = () => {
    setEnrollSchoolYear("");
    setEnrollClassId("");
    setSelectedStudentIds([]);
    setEnrollExcelFile(null);
    if (enrollExcelFileInputRef.current) {
      enrollExcelFileInputRef.current.value = '';
    }
    onClose();
  };

  const handleEnrollManual = async () => {
    if (!enrollSchoolYear || !enrollClassId || selectedStudentIds.length === 0) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn năm học, lớp và ít nhất một học sinh",
        variant: "destructive",
      });
      return;
    }

    try {
      const results = await Promise.allSettled(
        selectedStudentIds.map((stuId) =>
          api.post(`${API_ENDPOINTS.ENROLLMENTS}/upsert`, {
            student: stuId,
            class: enrollClassId,
            schoolYear: enrollSchoolYear,
          })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0) {
        toast({
          title: "Thành công",
          description: `Đã thêm ${successful} học sinh vào lớp${failed > 0 ? `, ${failed} học sinh thất bại` : ''}`,
        });
      }

      if (failed > 0 && successful === 0) {
        const firstError = results.find(r => r.status === 'rejected') as PromiseRejectedResult;
        const errorData = firstError?.reason?.response?.data;
        let errorMessage = "Không thể thêm học sinh";
        
        if (errorData) {
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (typeof errorData === 'object' && errorData !== null) {
            const obj = errorData as { message?: string; error?: string; errors?: string[] };
            if (obj.errors && Array.isArray(obj.errors)) {
              errorMessage = obj.errors.join('; ');
            } else {
              errorMessage = obj.message || obj.error || errorMessage;
            }
          }
        } else if (firstError?.reason?.message) {
          errorMessage = firstError.reason.message;
        }
        
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (failed > 0 && successful > 0) {
        toast({
          title: "Hoàn thành với một số lỗi",
          description: `${successful} học sinh đã được thêm thành công, ${failed} học sinh thất bại`,
          variant: "default",
        });
      }

      onSuccess();
      setSelectedStudentIds([]);
      
      if (successful > 0) {
        handleCloseDialog();
      }
    } catch (err: unknown) {
      console.error('Enroll error:', err);
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể thêm học sinh",
        variant: "destructive",
      });
    }
  };

  const handleEnrollExcel = async () => {
    if (!enrollExcelFile) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file Excel",
        variant: "destructive"
      });
      return;
    }

    if (!enrollSchoolYear) {
      toast({
        title: "Lỗi", 
        description: "Vui lòng chọn năm học trước khi import",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingEnrollExcel(true);
      
      const data = await enrollExcelFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const enrollments = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      await api.post(`${API_ENDPOINTS.ENROLLMENTS}/bulk-import`, {
        enrollments,
        schoolYear: enrollSchoolYear
      });

      toast({
        title: "Thành công",
        description: "Import enrollment từ Excel thành công",
      });

      setEnrollExcelFile(null);
      if (enrollExcelFileInputRef.current) {
        enrollExcelFileInputRef.current.value = '';
      }
      
      onSuccess();
      handleCloseDialog();
      
    } catch (error: unknown) {
      console.error('Enroll Excel error:', error);
      const axiosError = error as { response?: { data: unknown } };
      let message = "Không thể import enrollment. Vui lòng thử lại.";
      
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
      setUploadingEnrollExcel(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll Students</DialogTitle>
          <DialogDescription>
            Thêm học sinh vào lớp bằng cách chọn thủ công hoặc import từ Excel
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Manual enroll section */}
          <div>
            <h3 className="text-lg font-medium">1. Enroll thủ công</h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="enrollSchoolYear">Năm học</Label>
                <Select value={enrollSchoolYear} onValueChange={setEnrollSchoolYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn năm học" />
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
              <div className="space-y-2">
                <Label htmlFor="enrollClass">Lớp</Label>
                <Select value={enrollClassId} onValueChange={setEnrollClassId} disabled={!enrollSchoolYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn lớp" />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollClassesOptions.map((cls) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <Label htmlFor="enrollStudent">Học sinh *</Label>
              <Combobox
                multiple
                selectedValues={selectedStudentIds}
                onChange={setSelectedStudentIds}
                options={studentsOptions}
                placeholder="Chọn học sinh"
                searchPlaceholder="Tìm kiếm học sinh..."
                emptyText="Không có học sinh"
                className="w-full"
              />
              {selectedStudentIds.length > 0 && (
                <p className="text-sm text-blue-600">
                  ✓ Đã chọn {selectedStudentIds.length} học sinh
                </p>
              )}
            </div>
            
            <Button 
              className="mt-4" 
              onClick={handleEnrollManual}
              disabled={!enrollSchoolYear || !enrollClassId || selectedStudentIds.length === 0}
            >
              Enroll
            </Button>
          </div>
          
          <hr className="my-6" />
          
          {/* Excel enroll section */}
          <div>
            <h3 className="text-lg font-medium">2. Enroll bằng file Excel</h3>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="enrollExcelSchoolYear">Năm học *</Label>
                <Select value={enrollSchoolYear} onValueChange={setEnrollSchoolYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn năm học" />
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
              
              <div className="space-y-2">
                <Label htmlFor="enrollExcelFile">File Excel *</Label>
                <div className="flex gap-2">
                  <Input 
                    type="file" 
                    accept=".xlsx,.xls" 
                    ref={enrollExcelFileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEnrollExcelFile(file);
                      }
                    }}
                  />
                  <Button variant="outline" asChild>
                    <a href="/Template/enrollment-example.xlsx" download>
                      File mẫu
                    </a>
                  </Button>
                </div>
                {enrollExcelFile && (
                  <p className="text-sm text-green-600">
                    ✓ Đã chọn: {enrollExcelFile.name}
                  </p>
                )}
              </div>
              
              <Button 
                onClick={handleEnrollExcel}
                disabled={!enrollExcelFile || !enrollSchoolYear || uploadingEnrollExcel}
              >
                {uploadingEnrollExcel ? "Đang import..." : "Import Enrollments"}
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={handleCloseDialog}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnrollStudentsDialog; 
import React, { useRef } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import type { SchoolYear, EducationalSystem, GradeLevel } from '../../../types/school.types';
import type { ComboboxOption } from '../../../types/common.types';

const schema = z.object({
  className: z.string().min(1, "Tên lớp là bắt buộc"),
  schoolYear: z.string().min(1, "Năm học là bắt buộc"),
  educationalSystem: z.string().min(1, "Hệ học là bắt buộc"),
  gradeLevel: z.string().min(1, "Khối lớp là bắt buộc"),
  homeroomTeachers: z.array(z.string()).optional(),
});

type ClassFormData = z.infer<typeof schema>;

interface ClassFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: Class | null;
  selectedSchoolYear: string;
  schoolYears: SchoolYear[];
  systems: EducationalSystem[];
  gradeLevels: GradeLevel[];
  teachers: ComboboxOption[];
  onSuccess: () => void;
  onDelete: () => void;
  loading: boolean;
}

const ClassFormDialog: React.FC<ClassFormDialogProps> = ({
  isOpen,
  onClose,
  selectedClass,
  selectedSchoolYear,
  schoolYears,
  systems,
  gradeLevels,
  teachers,
  onSuccess,
  onDelete,
  loading
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      className: "",
      schoolYear: "",
      educationalSystem: "",
      gradeLevel: "",
      homeroomTeachers: [],
    },
  });

  React.useEffect(() => {
    if (selectedClass) {
      setValue("className", selectedClass.className || "");
      setValue("schoolYear", selectedClass.schoolYear?._id || "");
      setValue("educationalSystem", selectedClass.educationalSystem?._id || "");
      setValue("gradeLevel", selectedClass.gradeLevel?._id || "");
      const teacherIds = selectedClass.homeroomTeachers?.filter(t => t && t._id).map(t => t._id) || [];
      setValue("homeroomTeachers", teacherIds);
    } else {
      reset({
        className: "",
        schoolYear: selectedSchoolYear || "",
        educationalSystem: "",
        gradeLevel: "",
        homeroomTeachers: []
      });
    }
  }, [selectedClass, setValue, reset, selectedSchoolYear]);

  const handleCreateOrUpdateClass = async (formData: ClassFormData) => {
    try {
      if (selectedClass) {
        await api.put<Class>(API_ENDPOINTS.CLASS(selectedClass._id), formData);
        toast({
          title: "Thành công",
          description: "Cập nhật lớp học thành công"
        });
      } else {
        await api.post<Class>(API_ENDPOINTS.CLASSES, formData);
        toast({
          title: "Thành công",
          description: "Thêm lớp học thành công"
        });
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data: unknown } };
      let message: string = 'Đã xảy ra lỗi';
      if (axiosError.response && axiosError.response.data) {
        const respData = axiosError.response.data;
        if (typeof respData === 'string') {
          try {
            const parsed = JSON.parse(respData);
            message = parsed.message || parsed.error || respData;
          } catch {
            message = respData;
          }
        } else if (typeof respData === 'object' && respData !== null) {
          const obj = respData as { message?: string; error?: string };
          message = obj.message || obj.error || (error instanceof Error ? error.message : message);
        }
      }
      toast({ title: "Lỗi", description: message, variant: "destructive" });
    }
  };

  const handleImportClasses = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    try {
      toast({ title: 'Đang nhập lớp từ Excel...', variant: 'default' });
      
      const formData = new FormData();
      formData.append('excelFile', file);
      
      await api.post(`${API_ENDPOINTS.CLASSES}/bulk-upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast({ title: 'Thành công', description: 'Nhập lớp thành công' });
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data: unknown } };
      let message: string = 'Đã xảy ra lỗi';
      if (axiosError.response && axiosError.response.data) {
        const respData = axiosError.response.data;
        if (typeof respData === 'string') {
          try {
            const parsed = JSON.parse(respData);
            message = parsed.message || parsed.error || respData;
          } catch {
            message = respData;
          }
        } else if (typeof respData === 'object' && respData !== null) {
          const obj = respData as { message?: string; error?: string };
          message = obj.message || obj.error || (error instanceof Error ? error.message : message);
        }
      }
      toast({ title: "Lỗi", description: message, variant: "destructive" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateOrImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    
    if (file) {
      await handleImportClasses();
    } else {
      handleSubmit(handleCreateOrUpdateClass)();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selectedClass ? "Cập nhật lớp học" : "Tạo lớp học mới"}</DialogTitle>
          <DialogDescription>Nhập thông tin lớp học hoặc import từ file Excel</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">1. Tạo lớp thủ công</h3>
          <form onSubmit={handleSubmit(handleCreateOrUpdateClass)} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="className">Tên lớp</Label>
                <Input id="className" {...register("className")} />
                {errors.className && <p className="text-red-500 text-sm">{errors.className.message}</p>}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="gradeLevel">Khối lớp</Label>
                <Select
                  value={watch("gradeLevel")}
                  onValueChange={(value) => setValue("gradeLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khối lớp" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map((level) => (
                      <SelectItem key={level._id} value={level._id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.gradeLevel && <p className="text-red-500 text-sm">{errors.gradeLevel.message}</p>}
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="schoolYear">Năm học</Label>
                <Select
                  value={watch("schoolYear")}
                  onValueChange={(value) => setValue("schoolYear", value)}
                >
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
                {errors.schoolYear && <p className="text-red-500 text-sm">{errors.schoolYear.message}</p>}
              </div>

              <div className="flex-1 space-y-2">
                <Label htmlFor="educationalSystem">Hệ học</Label>
                <Select
                  value={watch("educationalSystem")}
                  onValueChange={(value) => setValue("educationalSystem", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn hệ học" />
                  </SelectTrigger>
                  <SelectContent>
                    {systems.map((system) => (
                      <SelectItem key={system._id} value={system._id}>
                        {system.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.educationalSystem && <p className="text-red-500 text-sm">{errors.educationalSystem.message}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Giáo viên chủ nhiệm</Label>
              <div className="space-y-2">
                <Combobox
                  multiple
                  selectedValues={watch("homeroomTeachers")}
                  onChange={(values) => setValue("homeroomTeachers", values)}
                  options={teachers}
                  placeholder="Chọn giáo viên chủ nhiệm"
                  emptyText="Không có giáo viên"
                  className="w-full"
                />
              </div>

              {(watch("homeroomTeachers") || []).length > 0 && (
                <div className="space-y-2">
                  {(watch("homeroomTeachers") || []).map((teacherId: string) => {
                    const teacher = teachers.find(t => t.value === teacherId);
                    if (!teacher) return null;

                    return (
                      <div
                        key={teacherId}
                        className="flex items-center justify-between p-2 rounded-md border bg-gray-50"
                      >
                        <span className="text-sm font-medium">{teacher.label}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          onClick={() => {
                            const currentTeachers = watch("homeroomTeachers") || [];
                            setValue(
                              "homeroomTeachers",
                              currentTeachers.filter(id => id !== teacherId)
                            );
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </form>
        </div>

        <hr className="my-6" />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">2. Import từ file Excel</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="class-file" className="text-right">File Excel</Label>
              <Input
                id="class-file"
                type="file"
                accept=".xlsx,.xls"
                ref={fileInputRef}
                className="col-span-3"
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">File Mẫu</Label>
              <Button variant="outline" asChild>
                <a href="/Template/class-bulk-upload.xlsx" download>
                  Tải file mẫu
                </a>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <div className="flex justify-end space-x-2">
            {selectedClass && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
              >
                Xóa
              </Button>
            )}
            <Button 
              type="button" 
              onClick={handleCreateOrImport}
              disabled={loading}
            >
              {selectedClass ? "Cập nhật" : "Thêm mới"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClassFormDialog; 
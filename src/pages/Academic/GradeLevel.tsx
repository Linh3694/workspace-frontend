import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "../../hooks/use-toast";
import { api } from "../../lib/api";
import { API_ENDPOINTS } from "../../lib/config";
import type { 
  School, 
  GradeLevel, 
  Quality, 
  SchoolFormData, 
  GradeLevelFormData 
} from "../../types/school.types";

const schoolSchema = z.object({
  name: z.string().min(1, "Tên trường là bắt buộc"),
  code: z.string().min(1, "Mã trường là bắt buộc"),
  type: z.string().optional(),
  description: z.string().optional(),
});

const schema = z.object({
  name: z.string().min(1, "Tên khối lớp là bắt buộc"),
  description: z.string().optional(),
  schoolId: z.string().min(1, "Trường là bắt buộc"),
  qualities: z.array(z.enum(["Level 1", "Level 2", "Level 3", "Level 4"] as const)).min(1, "Chọn ít nhất một chất lượng"),
});

const GradeLevelComponent: React.FC = () => {
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSchoolDialogOpen, setIsSchoolDialogOpen] = useState(false);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<GradeLevel | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors }, clearErrors } = useForm<GradeLevelFormData>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      description: "",
      schoolId: "",
      qualities: ["Level 1"],
    },
  });

  const schoolForm = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "",
      description: "",
    },
  });

  useEffect(() => {
    fetchSchools();
    fetchGradeLevels();
  }, []);

  useEffect(() => {
    if (selectedGradeLevel) {
      setValue("name", selectedGradeLevel.name);
      setValue("description", selectedGradeLevel.description || "");
      setValue("schoolId", selectedGradeLevel.school?._id || "");
      setValue("qualities", Array.isArray(selectedGradeLevel.qualities) ? selectedGradeLevel.qualities : []);
      clearErrors();
    }
  }, [selectedGradeLevel, setValue, clearErrors]);

  const fetchSchools = async () => {
    try {
      const response = await api.get<{ data: School[] }>(API_ENDPOINTS.SCHOOLS);
      // Kiểm tra và lấy dữ liệu từ response
      let schoolsData: School[] = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        schoolsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        schoolsData = response.data;
      }
      setSchools(schoolsData);
    } catch (error: unknown) {
      console.error('Error fetching schools:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi tải danh sách trường",
        variant: "destructive"
      });
      setSchools([]);
    }
  };

  const fetchGradeLevels = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: GradeLevel[] }>(API_ENDPOINTS.GRADE_LEVELS);
      let gradeLevelsData: GradeLevel[] = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        gradeLevelsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        gradeLevelsData = response.data;
      }

      setGradeLevels(gradeLevelsData.sort((a, b) => a.order - b.order));
    } catch (error: unknown) {
      console.error('Error fetching grade levels:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi tải danh sách khối lớp",
        variant: "destructive"
      });
      setGradeLevels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateGradeLevel = async (formData: GradeLevelFormData) => {
    try {
      if (selectedGradeLevel) {
        const response = await api.put<{ data: GradeLevel }>(API_ENDPOINTS.GRADE_LEVEL(selectedGradeLevel._id), {
          name: formData.name,
          description: formData.description,
          school: formData.schoolId,
          qualities: formData.qualities,
        });
        // Kiểm tra response
        if (!response?.data) {
          throw new Error("Không nhận được dữ liệu từ server");
        }

        toast({
          title: "Thành công",
          description: "Cập nhật khối lớp thành công"
        });
      } else {
        const response = await api.post<{ data: GradeLevel }>(API_ENDPOINTS.GRADE_LEVELS, {
          name: formData.name,
          description: formData.description,
          schoolId: formData.schoolId,
          qualities: formData.qualities,
        });
        // Kiểm tra response
        if (!response?.data) {
          throw new Error("Không nhận được dữ liệu từ server");
        }

        toast({
          title: "Thành công",
          description: "Thêm khối lớp mới thành công"
        });
      }

      // Đợi một chút trước khi fetch lại dữ liệu
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchGradeLevels();
      setIsDialogOpen(false);
      setSelectedGradeLevel(null);
      reset();
    } catch (error: unknown) {
      console.error('Error in handleCreateOrUpdateGradeLevel:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra",
        variant: "destructive"
      });
    }
  };

  const handleDeleteGradeLevel = async (id: string) => {
    try {
      await api.delete(API_ENDPOINTS.GRADE_LEVEL(id));
      toast({
        title: "Thành công",
        description: "Xóa khối lớp thành công"
      });
      await fetchGradeLevels();
      setIsDialogOpen(false);
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi xóa khối lớp",
        variant: "destructive"
      });
    }
  };

  const handleCreateSchool = async (data: SchoolFormData) => {
    try {
      const response = await api.post<{ data: School }>(API_ENDPOINTS.SCHOOLS, data);
      if (!response?.data?.data) {
        throw new Error("Không nhận được dữ liệu từ server");
      }

      toast({
        title: "Thành công",
        description: "Thêm trường mới thành công"
      });
      await fetchSchools();
      setIsSchoolDialogOpen(false);
      schoolForm.reset();
    } catch (error: unknown) {
      console.error('Error creating school:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi thêm trường",
        variant: "destructive"
      });
    }
  };

  const qualityOptions: { id: string; label: string; value: Quality }[] = [
    { id: "level1", label: "Level 1", value: "Level 1" },
    { id: "level2", label: "Level 2", value: "Level 2" },
    { id: "level3", label: "Level 3", value: "Level 3" },
    { id: "level4", label: "Level 4", value: "Level 4" },
  ];

  const handleCloseDialog = () => {
    clearErrors();
    reset();
    setSelectedGradeLevel(null);
    setIsDialogOpen(false);
  };

  // Debug render
  return (
    <div className="space-y-6 bg-white p-6 rounded-lg">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Quản lý khối lớp</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSchoolDialogOpen} onOpenChange={setIsSchoolDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsSchoolDialogOpen(true)}>Thêm trường</Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm trường mới</DialogTitle>
                <DialogDescription>Nhập thông tin trường</DialogDescription>
              </DialogHeader>
              <form onSubmit={schoolForm.handleSubmit(handleCreateSchool)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên trường</Label>
                  <Input id="name" {...schoolForm.register("name")} />
                  {schoolForm.formState.errors.name && (
                    <p className="text-red-500 text-sm">{schoolForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Mã trường</Label>
                  <Input id="code" {...schoolForm.register("code")} />
                  {schoolForm.formState.errors.code && (
                    <p className="text-red-500 text-sm">{schoolForm.formState.errors.code.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Loại trường</Label>
                  <Input id="type" {...schoolForm.register("type")} placeholder="VD: Tiểu học, THCS, THPT..." />
                  {schoolForm.formState.errors.type && (
                    <p className="text-red-500 text-sm">{schoolForm.formState.errors.type.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Input id="description" {...schoolForm.register("description")} placeholder="Mô tả về trường..." />
                  {schoolForm.formState.errors.description && (
                    <p className="text-red-500 text-sm">{schoolForm.formState.errors.description.message}</p>
                  )}
                </div>

                <DialogFooter>
                  <Button type="submit">Thêm mới</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button onClick={() => {
            setSelectedGradeLevel(null);
            clearErrors();
            setIsDialogOpen(true);
          }}>
            Thêm khối
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) {
              handleCloseDialog();
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedGradeLevel ? "Cập nhật khối lớp" : "Thêm khối lớp mới"}</DialogTitle>
                <DialogDescription>Nhập thông tin khối lớp</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(handleCreateOrUpdateGradeLevel)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên khối lớp</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolId">Trường</Label>
                  <Select
                    value={watch("schoolId")}
                    onValueChange={(value) => setValue("schoolId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trường" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school._id} value={school._id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.schoolId && <p className="text-red-500 text-sm">{errors.schoolId.message}</p>}
                </div>

                <div className="space-y-4">
                  <Label>Chất lượng</Label>
                  <div className="grid gap-2">
                    {qualityOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.id}
                          checked={watch("qualities").includes(option.value)}
                          onCheckedChange={(checked) => {
                            const currentQualities = watch("qualities");
                            if (checked) {
                              setValue("qualities", [...currentQualities, option.value]);
                            } else {
                              setValue(
                                "qualities",
                                currentQualities.filter((q) => q !== option.value)
                              );
                            }
                          }}
                        />
                        <Label
                          htmlFor={option.id}
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {errors.qualities && <p className="text-red-500 text-sm">{errors.qualities.message}</p>}
                </div>

                <DialogFooter className="flex justify-between items-center gap-2">
                  {selectedGradeLevel && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive">
                          Xóa
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa khối lớp "{selectedGradeLevel.name}" không?
                            Hành động này không thể hoàn tác.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteGradeLevel(selectedGradeLevel._id)}>
                            Xác nhận xóa
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit">
                      {selectedGradeLevel ? "Cập nhật" : "Thêm mới"}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên khối lớp</TableHead>
                <TableHead>Trường</TableHead>
                  <TableHead>Trình độ</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {Array.isArray(gradeLevels) && gradeLevels.map((gradeLevel) => (
                <TableRow key={gradeLevel._id}>
                  <TableCell className="font-medium">{gradeLevel.name}</TableCell>
                  <TableCell>{gradeLevel.school?.name || "N/A"}</TableCell>
                    <TableCell>{Array.isArray(gradeLevel.qualities) ? gradeLevel.qualities.join(", ") : "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedGradeLevel(gradeLevel);
                        setIsDialogOpen(true);
                      }}
                    >
                      Cập nhật
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default GradeLevelComponent;
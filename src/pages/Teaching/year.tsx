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
} from "../../components/ui/alert-dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "../../hooks/use-toast";
import { api } from "../../lib/api";
import { API_ENDPOINTS } from "../../lib/config";
import { DatePicker } from "../../components/ui/datepicker";

interface SchoolYear {
  _id: string;
  code: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const schema = z.object({
  code: z.string().min(1, "Mã năm học là bắt buộc"),
  startDate: z.date({
    required_error: "Ngày bắt đầu là bắt buộc",
  }),
  endDate: z.date({
    required_error: "Ngày kết thúc là bắt buộc",
  }),
  isActive: z.boolean(),
});

type SchoolYearFormData = z.infer<typeof schema>;

const YearComponent = () => {
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<SchoolYear | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<SchoolYearFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      startDate: undefined,
      endDate: undefined,
      isActive: false,
    },
  });

  useEffect(() => {
    fetchSchoolYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      setValue("code", selectedYear.code);
      setValue("startDate", new Date(selectedYear.startDate));
      setValue("endDate", new Date(selectedYear.endDate));
      setValue("isActive", selectedYear.isActive);
    } else {
      reset();
    }
  }, [selectedYear, setValue, reset]);

  const fetchSchoolYears = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SCHOOL_YEARS);
      
      if (!response || !response.data) {
        setSchoolYears([]);
        return;
      }

      const schoolYearsData = Array.isArray(response.data) ? response.data : response.data.data;
      
      if (Array.isArray(schoolYearsData)) {
        setSchoolYears(schoolYearsData);
      } else {
        setSchoolYears([]);
      }
    } catch (error: unknown) {
      console.error('Fetch error:', error);
      setSchoolYears([]);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: "destructive"
      });
    }
  };

  const handleCreateOrUpdateSchoolYear = async (formData: SchoolYearFormData) => {
    try {
      if (formData.endDate < formData.startDate) {
        toast({
          title: "Lỗi",
          description: "Ngày kết thúc phải sau ngày bắt đầu",
          variant: "destructive"
        });
        return;
      }

      const startDate = format(formData.startDate, 'yyyy-MM-dd');
      const endDate = format(formData.endDate, 'yyyy-MM-dd');

      const payload = {
        code: formData.code,
        startDate,
        endDate,
        isActive: formData.isActive
      };

      if (selectedYear) {
        await api.put(API_ENDPOINTS.SCHOOL_YEAR(selectedYear._id), payload);
      } else {
        await api.post(API_ENDPOINTS.SCHOOL_YEARS, payload);
      }

      toast({
        title: "Thành công",
        description: selectedYear ? "Cập nhật năm học thành công" : "Thêm năm học thành công"
      });

      setIsDialogOpen(false);
      setSelectedYear(null);
      reset();
      await fetchSchoolYears();
    } catch (error: unknown) {
      console.error('Submit error:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: "destructive"
      });
    }
  };

  const confirmAndDeleteSchoolYear = async (id: string) => {
    try {
      if (!id) {
        console.error('Invalid ID for deletion');
        return;
      }
      
      setDeleteId(id);
      setIsAlertOpen(true);
    } catch (error: unknown) {
      console.error('Delete error:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Không thể xóa năm học',
        variant: "destructive"
      });
    }
  };
  
  const handleConfirmDelete = async () => {
    try {
      if (!deleteId) return;
      
      // Log để kiểm tra
      console.log('Deleting school year with ID:', deleteId);
      const endpoint = API_ENDPOINTS.SCHOOL_YEAR(deleteId);
      console.log('Delete endpoint:', endpoint);
      
      // Sử dụng axios trực tiếp thay vì api wrapper
      try {
        // Gọi trực tiếp đến API với Axios
        const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
        });
        
        if (response.ok) {
          toast({
            title: "Thành công",
            description: "Xóa năm học thành công"
          });
          
          // Đóng dialog và reset state
          setIsAlertOpen(false);
          setIsDialogOpen(false);
          setSelectedYear(null);
          
          // Refresh danh sách
          await fetchSchoolYears();
        } else {
          const errorData = await response.json();
          console.error('Delete error response:', errorData);
          throw new Error(errorData.message || `Lỗi ${response.status}: Không thể xóa năm học`);
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }
    } catch (error: unknown) {
      console.error('Delete error:', error);
      
      let errorMessage = 'Không thể xóa năm học';
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
        errorMessage = error.message;
      }
      
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Prevent unnecessary re-renders
  const handleYearClick = React.useCallback((year: SchoolYear) => {
    setSelectedYear(year);
    setIsDialogOpen(true);
  }, []);

  const handleAddNewClick = React.useCallback(() => {
    setSelectedYear(null);
    setIsDialogOpen(true);
  }, []);

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl shadow-md">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Quản lý năm học</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setSelectedYear(null);
            reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNewClick}>Thêm năm học mới</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedYear ? "Cập nhật năm học" : "Thêm năm học mới"}</DialogTitle>
              <DialogDescription>Nhập thông tin năm học</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleCreateOrUpdateSchoolYear)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Mã năm học</Label>
                <Input id="code" {...register("code")} />
                {errors.code && <p className="text-red-500 text-sm">{errors.code.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Ngày bắt đầu</Label>
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field }) => (
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                    />
                  )}
                />
                {errors.startDate && <p className="text-red-500 text-sm">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Ngày kết thúc</Label>
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field }) => (
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                    />
                  )}
                />
                {errors.endDate && <p className="text-red-500 text-sm">{errors.endDate.message}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="isActive">Kích hoạt</Label>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch
                      id="isActive"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
              <DialogFooter>
                {selectedYear && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedYear && selectedYear._id) {
                        confirmAndDeleteSchoolYear(selectedYear._id);
                      }
                    }}
                  >
                    Xóa
                  </Button>
                )}
                <Button type="submit">{selectedYear ? "Cập nhật" : "Thêm mới"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã năm học</TableHead>
              <TableHead>Ngày bắt đầu</TableHead>
              <TableHead>Ngày kết thúc</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(schoolYears) && schoolYears.length > 0 ? (
              schoolYears.map((year) => {
                return (
                  <TableRow key={year._id}>
                    <TableCell className="font-medium">{year.code}</TableCell>
                    <TableCell>{format(new Date(year.startDate), 'dd/MM/yyyy', { locale: vi })}</TableCell>
                    <TableCell>{format(new Date(year.endDate), 'dd/MM/yyyy', { locale: vi })}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${year.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {year.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                       
                        size="sm"
                        onClick={() => handleYearClick(year)}
                      >
                        Cập nhật
                      </Button>

                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Không có dữ liệu năm học
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa năm học này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default YearComponent;
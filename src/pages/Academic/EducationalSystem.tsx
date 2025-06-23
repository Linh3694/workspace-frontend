import { useEffect, useState } from 'react';
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
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "../../hooks/use-toast";
import { api } from "../../lib/api";
import { API_ENDPOINTS } from "../../lib/config";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../components/ui/alert-dialog";
import type { 
  School, 
  EducationalSystem, 
  EducationalSystemFormData 
} from "../../types/school.types";

const schema = z.object({
  name: z.string().min(1, "Tên hệ học là bắt buộc"),
  description: z.string().optional(),
  school: z.string().min(1, "Trường học là bắt buộc"),
});

const EducationalSystemComponent: React.FC = () => {
  const [systems, setSystems] = useState<EducationalSystem[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<EducationalSystem | null>(null);
  const { toast } = useToast();

  const form = useForm<EducationalSystemFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      school: "",
    }
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = form;

  useEffect(() => {
    fetchSystems();
    fetchSchools();
  }, []);

  // Reset form khi dialog đóng
  useEffect(() => {
    if (!isDialogOpen) {
      setSelectedSystem(null);
      reset();
    }
  }, [isDialogOpen, reset]);

  // Set form values khi selectedSystem thay đổi
  useEffect(() => {
    if (selectedSystem) {
      setValue("name", selectedSystem.name || "");
      setValue("description", selectedSystem.description || "");
      setValue("school", selectedSystem.school?._id || "");
    }
  }, [selectedSystem, setValue]);

  const fetchSystems = async () => {
    try {
      const result = await api.get(API_ENDPOINTS.EDUCATIONAL_SYSTEMS);
      const systemsData = Array.isArray(result.data) ? result.data : result.data?.data;

      if (Array.isArray(systemsData)) {
        setSystems(systemsData);
      } else {
        setSystems([]);
        console.error('Không thể lấy được dữ liệu hệ thống giáo dục');
      }
    } catch (error: unknown) {
      setSystems([]);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải dữ liệu',
        variant: "destructive"
      });
    }
  };

  const fetchSchools = async () => {
    try {
      const res = await api.get<{ data: School[] }>(API_ENDPOINTS.SCHOOLS);
      const schoolsData = Array.isArray(res.data) ? res.data : res.data?.data;
      if (Array.isArray(schoolsData)) {
        setSchools(schoolsData);
        if (schoolsData.length > 0 && !watch("school")) {
          setValue("school", schoolsData[0]._id);
        }
      } else {
        setSchools([]);
      }
    } catch (error: unknown) {
      console.error('Error fetching schools:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải danh sách trường học',
        variant: "destructive"
      });
      setSchools([]);
    }
  };

  const handleCreateOrUpdateSystem = async (formData: EducationalSystemFormData) => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        schoolId: formData.school,
      };
      
      if (selectedSystem?._id) {
        await api.put(
          API_ENDPOINTS.EDUCATIONAL_SYSTEM(selectedSystem._id),
          payload
        );
        toast({
          title: "Thành công",
          description: "Cập nhật hệ học thành công"
        });
      } else {
        await api.post(API_ENDPOINTS.EDUCATIONAL_SYSTEMS, payload);
        toast({
          title: "Thành công",
          description: "Thêm hệ học thành công"
        });
      }
      
      await fetchSystems();
      setIsDialogOpen(false);
    } catch (error: unknown) {
      console.error('Error handling system:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: "destructive"
      });
    }
  };

  const handleOpenDialog = (system?: EducationalSystem) => {
    if (system) {
      setSelectedSystem(system);
    } else {
      setSelectedSystem(null);
      reset();
    }
    setIsDialogOpen(true);
  };

  const handleDeleteSystem = async () => {
    try {
      if (selectedSystem?._id) {
        await api.delete(API_ENDPOINTS.EDUCATIONAL_SYSTEM(selectedSystem._id));
        toast({
          title: "Thành công",
          description: "Xóa hệ học thành công"
        });
        await fetchSystems();
        setIsDeleteDialogOpen(false);
        setSelectedSystem(null);
      }
    } catch (error: unknown) {
      console.error('Error deleting system:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Quản lý hệ học</h1>
        <Dialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        >
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              Thêm hệ thống mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedSystem ? "Cập nhật hệ học" : "Thêm hệ học mới"}</DialogTitle>
              <DialogDescription>Nhập thông tin hệ học</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleCreateOrUpdateSystem)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên hệ học</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">Trường học</Label>
                <Select
                  value={watch("school")}
                  onValueChange={(value) => setValue("school", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trường học" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(schools) && schools.map(school => (
                      <SelectItem key={school._id} value={school._id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.school && <p className="text-red-500 text-sm">{errors.school.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" {...register("description")} />
              </div>
              <DialogFooter>
                <Button type="submit">
                  {selectedSystem ? "Cập nhật" : "Thêm mới"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên hệ học</TableHead>
              <TableHead>Trường</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!systems || systems.length === 0) ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Không có dữ liệu hệ thống giáo dục
                </TableCell>
              </TableRow>
            ) : (
              Array.isArray(systems) && systems.map(system => (
                system && (
                  <TableRow key={system._id}>
                    <TableCell className="font-medium">{system?.name || ''}</TableCell>
                    <TableCell>{system.school?.name || ''}</TableCell>
                    <TableCell>{system?.description || ''}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSystem(system);
                          setIsDialogOpen(true);
                        }}
                      >
                        Cập nhật
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedSystem(system);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa hệ học</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa hệ học "{selectedSystem?.name}" không?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSystem}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EducationalSystemComponent;
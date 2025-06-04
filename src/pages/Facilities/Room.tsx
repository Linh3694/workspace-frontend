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
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "../../lib/toast";
import { api } from "../../lib/api";
import { API_ENDPOINTS } from "../../lib/config";

interface Subject {
  _id: string;
  name: string;
  code: string;
}

interface Room {
  _id: string;
  name: string;
  type: "classroom" | "lab" | "library" | "other";
  capacity?: number;
  periodsPerDay: number;
  subjects: Subject[];
}

const schema = z.object({
  name: z.string()
    .min(1, "Tên phòng học là bắt buộc")
    .max(100, "Tên phòng học không được quá 100 ký tự"),
  type: z.enum(["classroom", "lab", "library", "other"], {
    errorMap: () => ({ message: "Vui lòng chọn loại phòng học" })
  }),
  capacity: z.number()
    .min(0, "Sức chứa không được âm")
    .max(1000, "Sức chứa không được quá 1000")
    .optional(),
  periodsPerDay: z.number()
    .min(1, "Số tiết học phải lớn hơn 0")
    .max(20, "Số tiết học không được quá 20"),
  subjects: z.array(z.string()).optional(),
});

type RoomFormData = z.infer<typeof schema>;

const RoomComponent: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<RoomFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "classroom",
      capacity: undefined,
      periodsPerDay: 10,
      subjects: [],
    },
  });

  useEffect(() => {
    fetchRooms();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      setValue("name", selectedRoom.name);
      setValue("type", selectedRoom.type);
      setValue("capacity", selectedRoom.capacity);
      setValue("periodsPerDay", selectedRoom.periodsPerDay);
      setValue(
        "subjects",
        selectedRoom.subjects && Array.isArray(selectedRoom.subjects)
          ? selectedRoom.subjects.map(s => s._id)
          : []
      );
    } else {
      reset();
    }
  }, [selectedRoom, setValue, reset]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: Room[] }>(API_ENDPOINTS.ROOMS);
      if (response && response.data && Array.isArray(response.data)) {
        setRooms(response.data);
      } else {
        console.error('Invalid response format:', response);
        toast({
          title: "Lỗi",
          description: "Định dạng dữ liệu không hợp lệ",
          variant: "destructive"
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi tải danh sách phòng học",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get<{ data: Subject[] }>(API_ENDPOINTS.SUBJECTS);
      if (response && response.data && Array.isArray(response.data)) {
        setSubjects(response.data);
      } else {
        console.error('Invalid subjects response format:', response);
        toast({
          title: "Lỗi",
          description: "Định dạng dữ liệu môn học không hợp lệ",
          variant: "destructive"
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi tải danh sách môn học",
        variant: "destructive"
      });
    }
  };

  const handleCreateOrUpdateRoom: SubmitHandler<RoomFormData> = async (data) => {
    try {
      setLoading(true);
      const response = await api[selectedRoom ? "put" : "post"](
        selectedRoom ? API_ENDPOINTS.ROOM(selectedRoom._id) : API_ENDPOINTS.ROOMS,
        data
      );
      
      if (response && response.data) {
        await fetchRooms();
        setIsDialogOpen(false);
        toast({
          title: selectedRoom ? "Cập nhật thành công" : "Tạo mới thành công",
          description: `Phòng học "${data.name}" đã được ${selectedRoom ? "cập nhật" : "tạo"}`,
        });
      } else {
        throw new Error("Không nhận được phản hồi từ máy chủ");
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Có lỗi xảy ra",
        description: error instanceof Error ? error.message : "Không thể lưu phòng học",
      });
    } finally {
      setLoading(false);
    }
  };

  const roomTypes = {
    classroom: "Phòng học",
    lab: "Phòng thí nghiệm",
    library: "Thư viện",
    other: "Khác"
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Quản lý phòng học</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedRoom(null)}>Thêm phòng học mới</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedRoom ? "Cập nhật thông tin phòng học" : "Thêm phòng học mới"}</DialogTitle>
              <DialogDescription>Nhập thông tin phòng học</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleCreateOrUpdateRoom)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên phòng học</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Loại phòng</Label>
                <Select
                  value={watch("type")}
                  onValueChange={(value: "classroom" | "lab" | "library" | "other") => setValue("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại phòng" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roomTypes).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-red-500 text-sm">{errors.type.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Sức chứa</Label>
                <Input
                  id="capacity"
                  type="number"
                  {...register("capacity", { valueAsNumber: true })}
                />
                {errors.capacity && <p className="text-red-500 text-sm">{errors.capacity.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodsPerDay">Số tiết học trong ngày</Label>
                <Input
                  id="periodsPerDay"
                  type="number"
                  {...register("periodsPerDay", { valueAsNumber: true })}
                />
                {errors.periodsPerDay && <p className="text-red-500 text-sm">{errors.periodsPerDay.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjects">Môn học phụ trách</Label>
                <Select
                  value={watch("subjects")?.[0] || ""}
                  onValueChange={(value) => {
                    const currentSubjects = watch("subjects") || [];
                    if (currentSubjects.includes(value)) {
                      setValue("subjects", currentSubjects.filter(id => id !== value));
                    } else {
                      setValue("subjects", [...currentSubjects, value]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn môn học" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject._id} value={subject._id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {Boolean(watch("subjects")?.length) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(watch("subjects") || []).map(subjectId => {
                      const subject = subjects.find(s => s._id === subjectId);
                      return subject ? (
                        <div key={subject._id} className="bg-gray-100 px-2 py-1 rounded-md flex items-center gap-2">
                          <span>{subject.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const currentSubjects = watch("subjects") || [];
                              setValue("subjects", currentSubjects.filter(id => id !== subject._id));
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? "Đang xử lý..." : selectedRoom ? "Cập nhật" : "Tạo mới"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
                <TableHead>Tên phòng</TableHead>
                <TableHead>Loại phòng</TableHead>
                <TableHead>Sức chứa</TableHead>
                <TableHead>Số tiết/ngày</TableHead>
                <TableHead>Môn học phụ trách</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room._id}>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell>{roomTypes[room.type]}</TableCell>
                  <TableCell>{room.capacity || "N/A"}</TableCell>
                  <TableCell>{room.periodsPerDay}</TableCell>
                  <TableCell>
                    {Array.isArray(room.subjects) && room.subjects.length > 0
                      ? room.subjects.map(subject => subject.name).join(", ")
                      : "Chưa phân công"
                    }
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRoom(room);
                        setIsDialogOpen(true);
                      }}
                    >
                      Sửa
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

export default RoomComponent; 
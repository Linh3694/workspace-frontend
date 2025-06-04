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
import { Textarea } from "../../components/ui/textarea";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "../../hooks/use-toast";
import { api } from "../../lib/api";
import { API_ENDPOINTS } from "../../lib/config";

interface SchoolYearEvent {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const schema = z.object({
  name: z.string().min(1, "Tên sự kiện là bắt buộc"),
  startDate: z.string().min(1, "Ngày bắt đầu là bắt buộc"),
  endDate: z.string().min(1, "Ngày kết thúc là bắt buộc"),
  description: z.string().optional(),
});

type SchoolYearEventFormData = z.infer<typeof schema>;

const SchoolYearCalendar: React.FC = () => {
  const [events, setEvents] = useState<SchoolYearEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SchoolYearEvent | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<SchoolYearEventFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      description: "",
    },
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      setValue("name", selectedEvent.name);
      setValue("startDate", format(new Date(selectedEvent.startDate), 'yyyy-MM-dd'));
      setValue("endDate", format(new Date(selectedEvent.endDate), 'yyyy-MM-dd'));
      setValue("description", selectedEvent.description || "");
    } else {
      reset();
    }
  }, [selectedEvent, setValue, reset]);

  const fetchEvents = async () => {
    try {
      const data = await api.get<SchoolYearEvent[]>(API_ENDPOINTS.SCHOOL_YEAR_EVENTS);
      setEvents(data);
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: "destructive"
      });
    }
  };

  const handleCreateOrUpdateEvent = async (formData: SchoolYearEventFormData) => {
    try {
      if (selectedEvent) {
        await api.put<SchoolYearEvent>(API_ENDPOINTS.SCHOOL_YEAR_EVENT(selectedEvent._id), formData);
      } else {
        await api.post<SchoolYearEvent>(API_ENDPOINTS.SCHOOL_YEAR_EVENTS, formData);
      }

      await fetchEvents();
      setIsDialogOpen(false);
      setSelectedEvent(null);
      toast({
        title: "Thành công",
        description: selectedEvent ? "Cập nhật sự kiện thành công" : "Thêm sự kiện thành công"
      });
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Lịch năm học</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedEvent(null)}>Thêm sự kiện</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedEvent ? "Cập nhật sự kiện" : "Thêm sự kiện mới"}</DialogTitle>
              <DialogDescription>Nhập thông tin sự kiện</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleCreateOrUpdateEvent)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên sự kiện</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Ngày bắt đầu</Label>
                <Input id="startDate" type="date" {...register("startDate")} />
                {errors.startDate && <p className="text-red-500 text-sm">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Ngày kết thúc</Label>
                <Input id="endDate" type="date" {...register("endDate")} />
                {errors.endDate && <p className="text-red-500 text-sm">{errors.endDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" {...register("description")} />
              </div>
              <DialogFooter>
                <Button type="submit">{selectedEvent ? "Cập nhật" : "Thêm mới"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên sự kiện</TableHead>
              <TableHead>Ngày bắt đầu</TableHead>
              <TableHead>Ngày kết thúc</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event._id}>
                <TableCell className="font-medium">{event.name}</TableCell>
                <TableCell>{format(new Date(event.startDate), 'dd/MM/yyyy', { locale: vi })}</TableCell>
                <TableCell>{format(new Date(event.endDate), 'dd/MM/yyyy', { locale: vi })}</TableCell>
                <TableCell>{event.description}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedEvent(event);
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
      </div>
    </div>
  );
};

export default SchoolYearCalendar;
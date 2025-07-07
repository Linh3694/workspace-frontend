import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { format } from 'date-fns';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "../../hooks/use-toast";
import { api } from "../../lib/api";
import { API_ENDPOINTS } from "../../lib/config";
import type { SchoolYearEvent, SchoolYear } from "../../types/school-year.types";
import { CalendarYearView } from "../../components/ui/CalendarYearView";
import { DatePicker } from "../../components/ui/datepicker";

const schema = z.object({
  name: z.string().min(1, "Tên sự kiện là bắt buộc"),
  startDate: z.string().min(1, "Ngày bắt đầu là bắt buộc"),
  endDate: z.string().min(1, "Ngày kết thúc là bắt buộc"),
  description: z.string().optional(),
  type: z.enum(["holiday", "event", "exam"], {
    required_error: "Loại sự kiện là bắt buộc",
  }),
  schoolYear: z.string().min(1, "Năm học là bắt buộc"),
});

type FormData = z.infer<typeof schema>;

// Thêm hàm parseLocalDate và formatDate
function formatDate(date: Date) {
  // yyyy-MM-dd theo local time
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function parseLocalDate(str: string) {
  const [year, month, day] = str.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const SchoolYearCalendar: React.FC = () => {
  const [events, setEvents] = useState<SchoolYearEvent[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SchoolYearEvent | null>(null);
  const { toast } = useToast();
  const [isSameDay, setIsSameDay] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      description: "",
      type: "event",
      schoolYear: "",
    },
  });

  useEffect(() => {
    fetchSchoolYears();
  }, []);

  useEffect(() => {
    if (selectedSchoolYear) {
      fetchEvents();
    }
  }, [selectedSchoolYear]);

  useEffect(() => {
    if (selectedEvent) {
      console.log('Setting form values for selected event:', selectedEvent);
      setValue("name", selectedEvent.name);
      setValue("startDate", formatDate(new Date(selectedEvent.startDate)));
      setValue("endDate", formatDate(new Date(selectedEvent.endDate)));
      setValue("description", selectedEvent.description || "");
      setValue("type", selectedEvent.type);
      setValue("schoolYear", selectedEvent.schoolYear);
      setIsSameDay(selectedEvent.startDate === selectedEvent.endDate);
    } else {
      console.log('Resetting form');
      reset();
      if (selectedSchoolYear) {
        setValue("schoolYear", selectedSchoolYear);
      }
      setIsSameDay(false);
    }
  }, [selectedEvent, setValue, reset, selectedSchoolYear]);

  const fetchSchoolYears = async () => {
    try {
      const response = await api.get<any>(API_ENDPOINTS.SCHOOL_YEARS);
      let schoolYearsData: SchoolYear[] = [];
      if (Array.isArray(response)) {
        schoolYearsData = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        // response.data.data mới là mảng!
        schoolYearsData = Array.isArray(response.data.data) ? response.data.data : [];
      }
      setSchoolYears(schoolYearsData);

      // Tự động chọn năm học active hoặc năm học đầu tiên
      const activeSchoolYear = schoolYearsData?.find(sy => sy.isActive);
      if (activeSchoolYear) {
        setSelectedSchoolYear(activeSchoolYear._id);
      } else if (schoolYearsData?.length > 0) {
        setSelectedSchoolYear(schoolYearsData[0]._id);
      }
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải danh sách năm học',
        variant: "destructive"
      });
    }
  };

  const fetchEvents = async () => {
    if (!selectedSchoolYear) return;
    try {
      const response = await api.get(API_ENDPOINTS.SCHOOL_YEAR_EVENTS_BY_SCHOOL_YEAR(selectedSchoolYear));
      let eventsData: SchoolYearEvent[] = [];
      if (Array.isArray(response)) {
        eventsData = response;
      } else if (response && typeof response === 'object' && Array.isArray((response as any).data)) {
        eventsData = (response as any).data;
      } else if (response && typeof response === 'object' && Array.isArray((response as any).data?.data)) {
        eventsData = (response as any).data.data;
      }
      setEvents(eventsData || []);
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải sự kiện',
        variant: "destructive"
      });
    }
  };

  const handleCreateOrUpdateEvent = async (formData: FormData) => {
    // Validate: startDate <= endDate
    if (formData.startDate > formData.endDate) {
      toast({
        title: "Lỗi",
        description: "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc",
        variant: "destructive"
      });
      return;
    }
    try {
      console.log('Submitting form data:', formData);
      
      if (selectedEvent) {
        console.log('Updating event:', selectedEvent._id);
        await api.put<SchoolYearEvent>(API_ENDPOINTS.SCHOOL_YEAR_EVENT(selectedEvent._id), formData);
      } else {
        console.log('Creating new event');
        await api.post<SchoolYearEvent>(API_ENDPOINTS.SCHOOL_YEAR_EVENTS, formData);
      }

      console.log('Event saved successfully, fetching updated events...');
      await fetchEvents();
      setIsDialogOpen(false);
      setSelectedEvent(null);
      toast({
        title: "Thành công",
        description: selectedEvent ? "Cập nhật sự kiện thành công" : "Thêm sự kiện thành công"
      });
    } catch (error: unknown) {
      console.error('Error saving event:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: "destructive"
      });
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setIsDialogOpen(true);
    setValue("startDate", formatDate(date));
    setValue("endDate", formatDate(date));
  };

  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
  };

  const getSchoolYearDateRange = () => {
    if (!selectedSchoolYear || !Array.isArray(schoolYears)) return null;
    
    const schoolYear = schoolYears.find(sy => sy._id === selectedSchoolYear);
    if (!schoolYear) return null;

    const startDate = new Date(schoolYear.startDate);
    const endDate = new Date(schoolYear.endDate);
    
    return { startDate, endDate };
  };

  const dateRange = getSchoolYearDateRange();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Lịch năm học</h1>
        
        {/* School Year Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="schoolYear">Năm học:</Label>
            <Select value={selectedSchoolYear} onValueChange={setSelectedSchoolYear}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Chọn năm học" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(schoolYears) && schoolYears.map((schoolYear) => (
                  <SelectItem key={schoolYear._id} value={schoolYear._id}>
                    {schoolYear.code} ({format(new Date(schoolYear.startDate), 'dd/MM/yyyy')} - {format(new Date(schoolYear.endDate), 'dd/MM/yyyy')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setSelectedEvent(null);
              reset();
              if (selectedSchoolYear) {
                setValue("schoolYear", selectedSchoolYear);
              }
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedEvent(null);
                reset();
                if (selectedSchoolYear) {
                  setValue("schoolYear", selectedSchoolYear);
                }
              }}>Thêm sự kiện</Button>
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
                  <Label htmlFor="type">Loại sự kiện</Label>
                  <Select onValueChange={(value) => setValue("type", value as "holiday" | "event" | "exam")} defaultValue={watch("type") || "event"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại sự kiện" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="holiday">Nghỉ lễ</SelectItem>
                      <SelectItem value="event">Sự kiện</SelectItem>
                      <SelectItem value="exam">Thi</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-red-500 text-sm">{errors.type.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="startDate">Ngày bắt đầu</Label>
                  <DatePicker
                    date={watch("startDate") ? parseLocalDate(watch("startDate")) : undefined}
                    setDate={date => {
                      setValue("startDate", date ? formatDate(date) : "");
                      if (isSameDay) setValue("endDate", date ? formatDate(date) : "");
                    }}
                    className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.startDate && <p className="text-red-500 text-sm">{errors.startDate.message}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="sameDay"
                    type="checkbox"
                    checked={isSameDay}
                    onChange={e => {
                      setIsSameDay(e.target.checked);
                      if (e.target.checked) setValue("endDate", watch("startDate"));
                    }}
                  />
                  <Label htmlFor="sameDay">Trong ngày</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Ngày kết thúc</Label>
                  {isSameDay ? (
                    <Input
                      id="endDate"
                      value={watch("endDate")}
                      readOnly
                      className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 cursor-not-allowed"
                    />
                  ) : (
                    <DatePicker
                      date={watch("endDate") ? parseLocalDate(watch("endDate")) : undefined}
                      setDate={date => setValue("endDate", date ? formatDate(date) : "")}
                      className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                  {errors.endDate && <p className="text-red-500 text-sm">{errors.endDate.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea id="description" {...register("description")} />
                </div>
                
                <DialogFooter>
                  <Button type="submit" onClick={() => console.log('Form submitted, current values:', watch())}>
                    {selectedEvent ? "Cập nhật" : "Thêm mới"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar */}
      {selectedSchoolYear && dateRange && (
        <>
          <CalendarYearView
            events={(Array.isArray(events) ? events : [])}
            schoolYear={schoolYears.find(sy => sy._id === selectedSchoolYear)!}
          />
        </>
      )}

      {!selectedSchoolYear && (
        <div className="text-center py-8 text-gray-500">
          Vui lòng chọn năm học để xem lịch
        </div>
      )}
    </div>
  );
};

export default SchoolYearCalendar;
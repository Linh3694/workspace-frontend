import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// Removed form validation imports - using inline editing
import { useToast } from "../../hooks/use-toast";
import { api } from "../../lib/api";
import { API_ENDPOINTS } from "../../lib/config";

import { Loader2, Settings, Plus, Calendar, Clock, Users, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

// Dialog components
import { TimetableDetailDialog } from './Dialog/TimetableDetailDialog';
import { PeriodManagementDialog } from './Dialog/PeriodManagementDialog';
import { AddTimetableDialog } from './Dialog/AddTimetableDialog';
import { TimetableListDialog } from './Dialog/TimetableListDialog';

// Import types
import type { SchoolYear, School } from '../../types/school.types';
import type { Class } from '../../types/class.types';

import type { Room } from '../../types/room.types';
import type {
  TimetableEntry,
  TimetableGrid,
  PeriodDefinition,
  ApiResponse
} from '../../types/timetable.types';
import {
  DAY_OF_WEEK_LABELS,
  PERIOD_TYPE_LABELS
} from '../../types/timetable.types';
import type { SchoolYearEvent } from '../../types/school-year.types';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '../../types/school-year.types';

// Thêm type cho TimetableSchedule
interface TimetableSchedule {
  _id: string;
  name: string;
  schoolYear: {
    _id: string;
    code: string;
  };
  class: {
    _id: string;
    className: string;
  };
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
  fileUrl?: string;
  fileName?: string;
  createdBy?: {
    _id: string;
    fullname: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Validation schemas - moved to inline validation

const TimetablesPage = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // State management
  const [timetableGrid, setTimetableGrid] = useState<TimetableGrid | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: string;
    period: number;
    entry: TimetableEntry | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [periodDefinitions, setPeriodDefinitions] = useState<PeriodDefinition[]>([]);
  const [isPeriodDialogOpen, setIsPeriodDialogOpen] = useState(false);
  const [isAddTimetableDialogOpen, setIsAddTimetableDialogOpen] = useState(false);
  const [isTimetableListDialogOpen, setIsTimetableListDialogOpen] = useState(false);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('');
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');

  const [, setRooms] = useState<Room[]>([]);
  const { toast } = useToast();

  // Thêm state cho tuần hiện tại
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  
  // State cho school year events
  const [schoolYearEvents, setSchoolYearEvents] = useState<SchoolYearEvent[]>([]);

  // Thêm state cho schedules và selected schedule
  const [schedules, setSchedules] = useState<TimetableSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');

  // Hàm tính toán ngày trong tuần
  const getWeekDates = (weekStart: Date) => {
    const dates = [];
    const startOfWeek = new Date(weekStart);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Bắt đầu từ thứ 2
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Hàm format ngày
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Hàm điều hướng tuần
  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  // Hàm kiểm tra event cho một ngày
  const getEventForDate = (date: Date) => {
    return schoolYearEvents.find(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const checkDate = new Date(date);
      
      // Reset time để so sánh chỉ ngày
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);
      
      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };

  // ① Auto-select schedule (đặt ngay sau khai báo selectedScheduleId)
  useEffect(() => {
    if (!schedules.length) return;

    const monday = getWeekDates(currentWeek)[0];
    const active = schedules.find(s => {
      const sStart = new Date(s.startDate); sStart.setHours(0,0,0,0);
      const sEnd   = new Date(s.endDate);   sEnd.setHours(0,0,0,0);
      return monday >= sStart && monday <= sEnd;
    });

    setSelectedScheduleId(active ? active._id : '');
  }, [schedules, currentWeek]);

  // Effects
  useEffect(() => {
    // Chỉ fetch data khi authentication đã sẵn sàng
    if (!authLoading && isAuthenticated) {
      fetchInitialData();
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (selectedSchoolYear) {
      fetchSchools();
    }
  }, [selectedSchoolYear]);

  useEffect(() => {
    if (selectedSchoolYear && selectedSchool) {
      fetchPeriodDefinitions(selectedSchoolYear, selectedSchool);
      fetchClasses(selectedSchoolYear, selectedSchool);
    }
  }, [selectedSchoolYear, selectedSchool]);

  useEffect(() => {
    if (selectedSchoolYear && selectedSchool && selectedClass) {
      fetchSchedules();
      fetchTimetableGrid(selectedSchoolYear, selectedClass);
      fetchSchoolYearEvents();
    }
  }, [selectedSchoolYear, selectedSchool, selectedClass, currentWeek, selectedScheduleId]);

  // Hiển thị loading khi đang chờ authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Đang tải...</span>
        </div>
      </div>
    );
  }

  // API calls
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSchoolYears(),
        fetchRooms()
      ]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu ban đầu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolYears = async () => {
    try {
      const response = await api.get(`${API_ENDPOINTS.SCHOOL_YEARS}`);
      const schoolYearsData = Array.isArray(response.data) ? response.data : response.data.data || [];
      setSchoolYears(schoolYearsData);
      if (schoolYearsData.length > 0) {
        const activeYear = schoolYearsData.find((year: SchoolYear) => year.isActive) || schoolYearsData[0];
        setSelectedSchoolYear(activeYear._id);
      }
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách năm học",
        variant: "destructive"
      });
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await api.get<School[]>(API_ENDPOINTS.SCHOOLS);
      const schoolsData = Array.isArray(response.data) ? response.data : (response.data as { data?: School[] })?.data || [];
      setSchools(schoolsData);
      if (schoolsData.length > 0 && !selectedSchool) {
        setSelectedSchool(schoolsData[0]._id);
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách trường",
        variant: "destructive"
      });
    }
  };

  const fetchClasses = async (yearId: string, schoolId: string) => {
    try {
      if (!yearId || !schoolId) {
        setClasses([]);
        return;
      }

      // Debug: Kiểm tra token
      const token = localStorage.getItem('token');
      console.log('🔍 Debug fetchClasses - Token exists:', !!token);
      console.log('🔍 Debug fetchClasses - Token preview:', token ? token.substring(0, 20) + '...' : 'null');
      
      if (!token) {
        console.error('❌ No token found, waiting for authentication...');
        // Đợi một chút để token được lưu
        await new Promise(resolve => setTimeout(resolve, 1000));
        const retryToken = localStorage.getItem('token');
        if (!retryToken) {
          console.error('❌ Still no token after retry');
          setClasses([]);
          return;
        }
      }

      // Lấy lớp theo trường thông qua grade levels
      const response = await api.get<Class[]>(`${API_ENDPOINTS.CLASSES}?schoolYear=${yearId}&school=${schoolId}`);
      const classesData = Array.isArray(response.data) ? response.data : (response.data as { data?: Class[] })?.data || [];
      setClasses(classesData);

      if (classesData.length && !selectedClass) {
        setSelectedClass(classesData[0]._id);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClasses([]);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách lớp",
        variant: "destructive",
      });
    }
  };

  const fetchSchedules = async () => {
    try {
      if (!selectedSchoolYear || !selectedClass) return;
      
      const response = await api.get(`${API_ENDPOINTS.TIMETABLE_SCHEDULES}?schoolYearId=${selectedSchoolYear}&classId=${selectedClass}`);
      const schedulesData = Array.isArray(response.data) ? response.data : response.data.data || [];
      setSchedules(schedulesData);
      
      // Tự động chọn schedule đầu tiên nếu có
      // if (schedulesData.length > 0 && !selectedScheduleId) {
      //   setSelectedScheduleId(schedulesData[0]._id);
      // }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      setSchedules([]);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await api.get<Room[]>(API_ENDPOINTS.ROOMS);
      setRooms(response.data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const fetchTimetableGrid = async (yearId: string, classId: string) => {
    setLoading(true);
    try {
      console.log("Fetching timetable grid for:", { yearId, classId, selectedScheduleId, currentWeek });
      
      // Tính toán ngày bắt đầu của tuần hiện tại
      const weekDates = getWeekDates(currentWeek);
      const weekStartDate = weekDates[0].toISOString().split('T')[0];
      
      const params = new URLSearchParams({
        ...(selectedScheduleId && { scheduleId: selectedScheduleId }),
        weekStartDate: weekStartDate
      });
      
      const response = await api.get<{ data: TimetableGrid }>(`${API_ENDPOINTS.TIMETABLES_GRID(yearId, classId)}?${params}`);
      console.log("Timetable grid response:", response);
      setTimetableGrid(response.data.data);
        /** -----------------------------------------------------------
         *  FILTER GRID BY SELECTED SCHEDULE DATE RANGE
         *  Nếu ngày trong tuần nằm ngoài [schedule.startDate, schedule.endDate]
         *  thì xoá dữ liệu để tránh hiển thị nhầm tiết.
         *  ----------------------------------------------------------- */
        const selectedSchedule = schedules.find(s => s._id === selectedScheduleId);
        if (selectedSchedule) {
          const scheduleStart = new Date(selectedSchedule.startDate);
          const scheduleEnd   = new Date(selectedSchedule.endDate);
          
          // Reset giờ để so sánh thuần tuý ngày
          scheduleStart.setHours(0, 0, 0, 0);
          scheduleEnd.setHours(0, 0, 0, 0);
          
          // Tính lại mảng ngày của tuần hiện tại
          const weekDates = getWeekDates(currentWeek); // [Mon..Fri]
          const dayKeys: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = 
            ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
          
          const filteredGrid = { ...response.data.data };
          
          dayKeys.forEach((dayKey, idx) => {
            const date = new Date(weekDates[idx]);
            date.setHours(0, 0, 0, 0);
            
            // Nếu date nằm ngoài range của schedule đã chọn
            if (date < scheduleStart || date > scheduleEnd) {
              if (filteredGrid[dayKey]) {
                // Xoá toàn bộ tiết của ngày này
                Object.keys(filteredGrid[dayKey]).forEach(periodKey => {
                  filteredGrid[dayKey][periodKey] = null;
                });
              }
            }
          });
          
          // Ghi đè grid đã lọc
          setTimetableGrid(filteredGrid);
        }
    } catch (error: unknown) {
      console.error("Error fetching timetable grid:", error);
      
      let errorMessage = "Không thể tải thời khóa biểu";
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 404) {
          errorMessage = "API endpoint không tìm thấy. Vui lòng kiểm tra backend.";
        } else if (axiosError.response?.status === 400) {
          errorMessage = axiosError.response?.data?.message || "Dữ liệu không hợp lệ";
        }
      } else if (error && typeof error === 'object' && 'code' in error) {
        const networkError = error as { code?: string };
        if (networkError.code === 'ERR_NETWORK') {
          errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra backend.";
        }
      }
      
      toast({ 
        title: "Lỗi", 
        description: errorMessage, 
        variant: "destructive" 
      });
      setTimetableGrid(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodDefinitions = async (yearId: string, schoolId: string) => {
    try {
      const response = await api.get<ApiResponse<PeriodDefinition[]>>(
        `${API_ENDPOINTS.PERIOD_DEFINITIONS(yearId)}?schoolId=${schoolId}`
      );
      console.log("Fetched period definitions:", response.data.data);
      setPeriodDefinitions(response.data.data);
    } catch (error) {
      console.error("Error fetching period definitions:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách tiết học",
        variant: "destructive"
      });
    }
  };

  const fetchSchoolYearEvents = async () => {
    if (!selectedSchoolYear) return;
    
    try {
      // Tính toán khoảng thời gian cho tuần hiện tại
      const weekDates = getWeekDates(currentWeek);
      const startDate = weekDates[0];
      const endDate = weekDates[4];
      
      const response = await api.get(API_ENDPOINTS.SCHOOL_YEAR_EVENTS_BY_DATE_RANGE, {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          schoolYear: selectedSchoolYear
        }
      });
      
      const eventsData = Array.isArray(response.data) ? response.data : response.data.data || [];
      setSchoolYearEvents(eventsData);
    } catch (error) {
      console.error("Error fetching school year events:", error);
      // Không hiển thị toast lỗi vì events không quan trọng bằng timetable
    }
  };

  // Event handlers
  const handleSelectClass = (id: string) => {
    setSelectedClass(id);
    if (selectedSchoolYear) {
      fetchTimetableGrid(selectedSchoolYear, id);
    }
  };

  const handleSelectSchool = (schoolId: string) => {
    setSelectedSchool(schoolId);
    setSelectedClass(''); // Reset selected class when school changes
    setClasses([]); // Clear classes list
  };

  const handleCellClick = (day: string, period: number, entry: TimetableEntry | null) => {
    setSelectedSlot({ day, period, entry });
    setIsDialogOpen(true);
  };

  // Open period management dialog
  const handleOpenPeriodDialog = () => {
    if (!selectedSchoolYear) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn năm học trước",
        variant: "destructive"
      });
      return;
    }
    setIsPeriodDialogOpen(true);
  };

  // Helper functions
  const getPeriodMeta = (): { number: number; label: string; time?: string; type: string; start: string; uniqueKey: string }[] => {
    if (Array.isArray(periodDefinitions) && periodDefinitions.length) {
      // Tách biệt regular periods và special periods
      const regularPeriods: PeriodDefinition[] = [];
      const specialPeriods: PeriodDefinition[] = [];
      
      // Tạo map để xử lý duplicate periodNumbers cho special periods
      const specialMap = new Map<number, PeriodDefinition>();
      
      periodDefinitions.forEach((p) => {
        if (p.type === "regular") {
          regularPeriods.push(p);
        } else {
          const ex = specialMap.get(p.periodNumber);
          if (!ex) {
            specialMap.set(p.periodNumber, p);
            return;
          }

          const score = (pd: PeriodDefinition) =>
            (pd.label ? 1 : 0);

          const exScore = score(ex);
          const pScore = score(p);

          if (
            pScore > exScore ||
            (pScore === exScore && p.startTime < ex.startTime)
          ) {
            specialMap.set(p.periodNumber, p);
          }
        }
      });

      // Lấy tất cả special periods
      specialPeriods.push(...specialMap.values());

      // Sắp xếp regular periods theo startTime
      regularPeriods.sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      // Tạo danh sách tất cả periods với unique keys
      const allPeriods: { number: number; label: string; time?: string; type: string; start: string; uniqueKey: string }[] = [];
      
      // Thêm regular periods với số thứ tự từ 1-10 và unique key
      regularPeriods.forEach((p, index) => {
        allPeriods.push({
          number: index + 1, // Đánh số từ 1-10 bất kể periodNumber trong DB
          label: `Tiết ${index + 1}`,
          time: `${p.startTime} – ${p.endTime}`,
          type: p.type,
          start: p.startTime,
          uniqueKey: `regular-${index + 1}`, // Unique key để tránh duplicate
        });
      });

      // Thêm special periods với unique key
      specialPeriods.forEach((p) => {
        allPeriods.push({
          number: p.periodNumber,
          label: p.label || PERIOD_TYPE_LABELS[p.type],
          time: `${p.startTime} – ${p.endTime}`,
          type: p.type,
          start: p.startTime,
          uniqueKey: `special-${p.periodNumber}-${p.type}`, // Unique key để tránh duplicate
        });
      });

      // Log để debug
      console.log("Period definitions found:", periodDefinitions.length);
      console.log("Regular periods:", regularPeriods.length);
      console.log("Special periods:", specialPeriods.length);
      console.log("All periods:", allPeriods.map(p => `${p.uniqueKey}:${p.number}:${p.type}:${p.start}`));

      // Sắp xếp tất cả theo startTime
      return allPeriods.sort((a, b) => a.start.localeCompare(b.start));
    }

    // Fallback khi không có period definitions - tạo 10 tiết regular
    return [...Array(10)].map((_, i) => ({
      number: i + 1,
      label: `Tiết ${i + 1}`,
      type: "regular",
      start: `${(i + 7).toString().padStart(2, "0")}:00`, // Bắt đầu từ 7:00
      uniqueKey: `regular-${i + 1}`, // Unique key
    }));
  };

  const renderTimetableGrid = () => {
    if (!selectedClass) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Vui lòng chọn lớp để xem thời khóa biểu</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (loading) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#002855] mx-auto mb-4" />
              <p className="text-gray-500">Đang tải thời khóa biểu...</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!timetableGrid) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Không có dữ liệu thời khóa biểu</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    const rawMetas = getPeriodMeta();
    rawMetas.sort((a, b) => a.start.localeCompare(b.start));

    const days = Object.keys(DAY_OF_WEEK_LABELS).slice(0, 5); // Only weekdays
    const periodMetas = rawMetas;
    const weekDates = getWeekDates(currentWeek);

    return (
      <Card>
        <CardContent className="p-0">
          {/* Week Navigation */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Tuần trước
            </Button>
            
            <div className="flex items-center gap-4">
              <span className="font-semibold text-[#002855]">
                Tuần {formatDate(weekDates[0])} - {formatDate(weekDates[4])}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentWeek}
              >
                Tuần hiện tại
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
              className="flex items-center gap-2"
            >
              Tuần sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border text-center bg-gray-50 font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4" />
                      Tiết học
                    </div>
                  </TableHead>
                  {days.map((day, index) => {
                    const date = weekDates[index];
                    const event = getEventForDate(date);
                    
                    return (
                      <TableHead key={day} className="border text-center min-w-[200px] bg-gray-50 font-semibold">
                        <div>
                          <div>{DAY_OF_WEEK_LABELS[day as keyof typeof DAY_OF_WEEK_LABELS]}</div>
                          <div className="text-sm text-gray-600 font-normal">
                            {formatDate(date)}
                          </div>
                          {event && (
                            <div className={`mt-1 px-2 py-1 rounded text-xs font-medium text-white ${EVENT_TYPE_COLORS[event.type]}`}>
                              {EVENT_TYPE_LABELS[event.type]}
                            </div>
                          )}
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodMetas.map((pm) => {
                  // Kiểm tra nếu là tiết đặc biệt (không phải regular)
                  const isSpecialPeriod = pm.type !== "regular";
                  
                  if (isSpecialPeriod) {
                    return (
                      <TableRow key={pm.uniqueKey} className="hover:bg-gray-50">
                        {/* Merge từ cột tiết học sang tất cả các cột ngày */}
                        <TableCell 
                          colSpan={days.length + 1}
                          className="border p-4 text-center bg-gradient-to-r from-gray-50 to-gray-25" 
                        >
                          <div className="text-center">
                            <div className="font-semibold text-[#002855] text-lg">{pm.label}</div>
                            <div className="text-sm text-gray-500 mt-1">{pm.time}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  
                  // Tiết học thường - hiển thị như cũ
                  return (
                    <TableRow key={pm.uniqueKey} className="hover:bg-gray-50">
                      <TableCell className="border text-center font-medium bg-gray-25">
                        <div>
                          <div className="font-semibold text-[#002855]">{pm.label}</div>
                          <div className="text-xs text-gray-500">{pm.time}</div>
                        </div>
                      </TableCell>
                      {days.map((day, dayIndex) => {
                        const entry = timetableGrid[day]?.[String(pm.number)];
                        const date = weekDates[dayIndex];
                        const event = getEventForDate(date);
                        
                        return (
                          <TableCell 
                            key={`${day}-${pm.uniqueKey}`} 
                            className={`border p-3 transition-colors ${
                              event ? 'bg-gray-100' : 'cursor-pointer hover:bg-[#002855]/5'
                            }`}
                            onClick={event ? undefined : () => handleCellClick(day, pm.number, entry)}
                          >
                            {event ? (
                              <div className="text-center py-4">
                                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-medium ${EVENT_TYPE_COLORS[event.type]}`}>
                                  <Calendar className="h-4 w-4" />
                                  {event.name}
                                </div>
                                <div className="text-xs text-gray-500 mt-2">
                                  {EVENT_TYPE_LABELS[event.type]}
                                </div>
                              </div>
                            ) : entry ? (
                              <div className="space-y-2">
                                <div className="font-semibold text-[#002855] flex items-center gap-1">
                                  <div className="h-2 w-2 bg-[#002855] rounded-full"></div>
                                  {typeof entry.subject === 'object' ? entry.subject.name : entry.subject}
                                </div>
                                <div className="space-y-1">
                                  {(() => {
                                    const teachers = entry.teachers;
                                    if (Array.isArray(teachers)) {
                                      return teachers.map((teacher, index) => (
                                        <div key={index} className="flex items-center gap-1 text-sm text-gray-600">
                                          <Users className="h-3 w-3" />
                                          {typeof teacher === 'object' ? teacher.fullname : teacher}
                                        </div>
                                      ));
                                    } else if (typeof teachers === 'string') {
                                      return (
                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                          <Users className="h-3 w-3" />
                                          {teachers}
                                        </div>
                                      );
                                    }
                                    return (
                                      <div className="text-sm text-gray-400 italic">
                                        Chưa có giáo viên
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <MapPin className="h-3 w-3" />
                                  {entry.room
                                    ? typeof entry.room === "object"
                                      ? entry.room.name
                                      : entry.room
                                    : "Chưa có phòng"}
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 rounded">
                                <Plus className="h-6 w-6 mx-auto mb-1" />
                                <span className="text-sm">Trống</span>
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                <Calendar className="h-6 w-6 text-[#002855]" />
                Thời khóa biểu
              </CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>Năm học:</Label>
                <Select value={selectedSchoolYear} onValueChange={setSelectedSchoolYear}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Chọn năm học" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {schoolYears.map((year) => (
                      <SelectItem key={year._id} value={year._id}>
                        {year.code} {year.isActive && "(Hiện tại)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {schools.length > 0 && (
                <div className="flex items-center gap-2">
                  <Label>Trường:</Label>
                  <Select value={selectedSchool} onValueChange={handleSelectSchool}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Chọn trường" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {schools.map((school) => (
                        <SelectItem key={school._id} value={school._id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {classes.length > 0 && (
                <div className="flex items-center gap-2">
                  <Label>Lớp:</Label>
                  <Select value={selectedClass} onValueChange={handleSelectClass}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Chọn lớp" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {classes.map((cls) => (
                        <SelectItem key={cls._id} value={cls._id}>
                          {cls.className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-start items-center gap-4 mt-4 pt-4 border-t">
            <Button 
              onClick={handleOpenPeriodDialog}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Khai báo tiết học
            </Button>

            <Button 
              onClick={() => setIsAddTimetableDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Thêm thời khoá biểu
            </Button>

            <Button 
              onClick={() => setIsTimetableListDialogOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Danh sách thời khoá biểu
            </Button>
          </div>
          
          {/* Schedule Selection */}
          {schedules.length > 0 && (
            <div className="flex justify-start items-center gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Label>Thời khoá biểu:</Label>
                <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Chọn thời khoá biểu" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {schedules.map((schedule) => (
                      <SelectItem key={schedule._id} value={schedule._id}>
                        {schedule.name} ({new Date(schedule.startDate).toLocaleDateString('vi-VN')} - {new Date(schedule.endDate).toLocaleDateString('vi-VN')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Timetable Grid */}
      {renderTimetableGrid()}

      {/* Dialog Components */}
      <TimetableDetailDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        selectedSlot={selectedSlot}
      />

      <PeriodManagementDialog
        isOpen={isPeriodDialogOpen}
        onClose={() => setIsPeriodDialogOpen(false)}
        selectedSchoolYear={selectedSchoolYear}
        schools={schools}
        onPeriodUpdated={fetchPeriodDefinitions}
      />

      <AddTimetableDialog
        isOpen={isAddTimetableDialogOpen}
        onClose={() => setIsAddTimetableDialogOpen(false)}
        selectedSchoolYear={selectedSchoolYear}
        selectedClass={selectedClass}
        onTimetableAdded={() => {
          if (selectedSchoolYear && selectedClass) {
            fetchTimetableGrid(selectedSchoolYear, selectedClass);
          }
        }}
        periodDefinitions={periodDefinitions}
      />

      <TimetableListDialog
        isOpen={isTimetableListDialogOpen}
        onClose={() => setIsTimetableListDialogOpen(false)}
        selectedSchoolYear={selectedSchoolYear}
        selectedClass={selectedClass}
        onTimetableUpdated={() => {
          // Refresh timetable data
          if (selectedSchoolYear && selectedClass) {
            fetchTimetableGrid(selectedSchoolYear, selectedClass);
          }
        }}
      />
    </div>
  );
};

export default TimetablesPage;
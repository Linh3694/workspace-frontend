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
      fetchTimetableGrid(selectedSchoolYear, selectedClass);
      fetchSchoolYearEvents();
    }
  }, [selectedSchoolYear, selectedSchool, selectedClass, currentWeek]);

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
      console.log("Fetching timetable grid for:", { yearId, classId });
      const response = await api.get<{ data: TimetableGrid }>(API_ENDPOINTS.TIMETABLES_GRID(yearId, classId));
      console.log("Timetable grid response:", response);
      setTimetableGrid(response.data.data);
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
  const getPeriodMeta = (): { number: number; label: string; time?: string; type: string; start: string }[] => {
    if (Array.isArray(periodDefinitions) && periodDefinitions.length) {
      // Tạo map để xử lý duplicate periodNumbers
      const map = new Map<number, PeriodDefinition>();
      periodDefinitions.forEach((p) => {
        const ex = map.get(p.periodNumber);
        if (!ex) {
          map.set(p.periodNumber, p);
          return;
        }

        const score = (pd: PeriodDefinition) =>
          (pd.type !== "regular" ? 2 : 0) + (pd.label ? 1 : 0);

        const exScore = score(ex);
        const pScore = score(p);

        if (
          pScore > exScore ||
          (pScore === exScore && p.startTime < ex.startTime)
        ) {
          map.set(p.periodNumber, p);
        }
      });

      // Log để debug
      console.log("Period definitions found:", periodDefinitions.length);
      console.log("Unique periods after dedup:", map.size);
      console.log("Period types:", [...map.values()].map(p => `${p.periodNumber}:${p.type}`));

      return [...map.values()]
        .sort((a, b) => {
          // Sort by start time first, then by period number
          if (a.startTime !== b.startTime) {
            return a.startTime.localeCompare(b.startTime);
          }
          return a.periodNumber - b.periodNumber;
        })
        .map((p) => ({
          number: p.periodNumber,
          label: p.label || (p.type === "regular" ? `Tiết ${p.periodNumber}` : PERIOD_TYPE_LABELS[p.type]),
          time: `${p.startTime} – ${p.endTime}`,
          type: p.type,
          start: p.startTime,
        }));
    }

    // Fallback khi không có period definitions
    const nums = new Set<number>();
    if (timetableGrid) {
      Object.values(timetableGrid).forEach((dayObj: Record<string, TimetableEntry | null>) => {
        Object.keys(dayObj || {}).forEach((k) => nums.add(Number(k)));
      });
    }
    if (nums.size === 0) {
      [...Array(10)].forEach((_, i) => nums.add(i + 1));
    }

    return [...nums].sort((a, b) => a - b).map((n, idx) => ({
      number: n,
      label: `Tiết ${n}`,
      type: "regular",
      start: `${idx.toString().padStart(2, "0")}:00`,
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
                      <TableRow key={pm.number} className="hover:bg-gray-50">
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
                    <TableRow key={pm.number} className="hover:bg-gray-50">
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
                            key={`${day}-${pm.number}`} 
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
          // Refresh timetable data
          if (selectedSchoolYear && selectedClass) {
            fetchTimetableGrid(selectedSchoolYear, selectedClass);
          }
        }}
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
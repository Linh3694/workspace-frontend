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
import * as XLSX from 'xlsx';
import { Loader2, Upload, Settings, Plus, Calendar, Clock, Users, MapPin } from "lucide-react";

// Dialog components
import { TimetableDetailDialog } from './Dialog/TimetableDetailDialog';
import { PeriodManagementDialog } from './Dialog/PeriodManagementDialog';

// Import types
import type { SchoolYear, School } from '../../types/school.types';
import type { Class } from '../../types/class.types';
import type { Subject } from '../../types/curriculum.types';
import type { Teacher } from '../../types/user.types';
import type { Room } from '../../types/room.types';
import type {
  TimetableEntry,
  TimetableGrid,
  PeriodDefinition,
  PeriodFormData,
  ApiResponse
} from '../../types/timetable.types';
import {
  DAY_OF_WEEK_LABELS,
  PERIOD_TYPE_LABELS
} from '../../types/timetable.types';

// Validation schemas - moved to inline validation

const TimetablesPage = () => {
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
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('');
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [, setRooms] = useState<Room[]>([]);
  const { toast } = useToast();
  // Effects
  useEffect(() => {
    fetchInitialData();
  }, []);

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
    }
  }, [selectedSchoolYear, selectedSchool, selectedClass]);

  // API calls
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSchoolYears(),
        fetchSubjects(),
        fetchTeachers(),
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

  const fetchSubjects = async () => {
    try {
      const response = await api.get<Subject[]>(API_ENDPOINTS.SUBJECTS);
      const subjectsData = Array.isArray(response.data) ? response.data : (response.data as { data?: Subject[] })?.data || [];
      setSubjects(subjectsData);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get<Teacher[]>(API_ENDPOINTS.TEACHERS);
      const teachersData = Array.isArray(response.data) ? response.data : (response.data as { data?: Teacher[] })?.data || [];
      setTeachers(teachersData);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setTeachers([]);
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
    } catch (error: any) {
      console.error("Error fetching timetable grid:", error);
      
      let errorMessage = "Không thể tải thời khóa biểu";
      if (error?.response?.status === 404) {
        errorMessage = "API endpoint không tìm thấy. Vui lòng kiểm tra backend.";
      } else if (error?.response?.status === 400) {
        errorMessage = error?.response?.data?.message || "Dữ liệu không hợp lệ";
      } else if (error?.code === 'ERR_NETWORK') {
        errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra backend.";
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



  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Kiểm tra đã chọn năm học và trường
    if (!selectedSchoolYear || !selectedSchool) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn năm học và trường trước khi upload",
        variant: "destructive"
      });
      return;
    }

    // Kiểm tra dữ liệu cần thiết đã được tải
    if (!Array.isArray(subjects) || subjects.length === 0) {
      toast({
        title: "Lỗi",
        description: "Danh sách môn học chưa được tải. Vui lòng thử lại sau.",
        variant: "destructive"
      });
      return;
    }

    if (!Array.isArray(teachers) || teachers.length === 0) {
      toast({
        title: "Lỗi", 
        description: "Danh sách giáo viên chưa được tải. Vui lòng thử lại sau.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Utility functions
      const normalize = (str: string) =>
        str
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, " ")
          .trim();

      const findSubject = (nameVi: string) =>
        subjects.find((s) => normalize(s.name) === normalize(nameVi));

      // Create teacher mapping
      const teacherMap = new Map<string, string>();

      const buildAliases = (fullname: string): string[] => {
        const norm = normalize(fullname);
        const parts = norm.split(" ");
        const aliases: string[] = [norm];
        if (parts.length >= 2) {
          aliases.push(`${parts[0]} ${parts[parts.length - 1]}`);
          aliases.push(`${parts[parts.length - 1]} ${parts[0]}`);
        }
        if (parts.length >= 3) {
          aliases.push(`${parts.slice(1).join(" ")}`);
        }
        return aliases;
      };

      teachers.forEach((t) => {
        buildAliases(t.fullname).forEach((alias) => {
          if (!teacherMap.has(alias)) teacherMap.set(alias, t._id);
        });
      });

      const findTeacherId = (fullname: string): string | undefined => {
        if (!fullname) return undefined;
        const key = normalize(fullname);
        if (teacherMap.has(key)) return teacherMap.get(key);

        const parts = key.split(" ");
        if (parts.length >= 2) {
          const k1 = `${parts[0]} ${parts[parts.length - 1]}`;
          if (teacherMap.has(k1)) return teacherMap.get(k1);
          const k2 = `${parts[parts.length - 1]} ${parts[0]}`;
          if (teacherMap.has(k2)) return teacherMap.get(k2);
        }
        return undefined;
      };

      // Create subject-room mapping
      const subjectDefaultRoom: Record<string, string | "Homeroom"> = {};
      if (Array.isArray(subjects)) {
        subjects.forEach((s: Subject) => {
          if (s.needFunctionRoom && s.rooms?.length)
            subjectDefaultRoom[s._id] = typeof s.rooms[0] === 'string' ? s.rooms[0] : s.rooms[0]._id;
          else subjectDefaultRoom[s._id] = "Homeroom";
        });
      }

      // Process Excel file
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const sheet: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      let currentDay = "";
      const vi2en: Record<string, string> = {
        "Thứ Hai": "Monday",
        "Thứ Ba": "Tuesday",
        "Thứ Tư": "Wednesday",
        "Thứ Năm": "Thursday", 
        "Thứ Sáu": "Friday",
        "Thứ Bảy": "Saturday",
        "Chủ Nhật": "Sunday"
      };

      const isPeriodRow = (row: unknown[]) => Number.isInteger(row[1]);
      const dayRegex = /^Thứ\s+(Hai|Ba|Tư|Năm|Sáu|Bảy)$/i;
      
      const detectDay = (value: string): string | null => {
        const trimmed = value.trim();
        if (trimmed.includes("/")) {
          const vi = trimmed.split("/")[0].trim();
          return vi2en[vi] ?? null;
        }
        if (dayRegex.test(trimmed)) {
          const vi = trimmed;
          return vi2en[vi] ?? null;
        }
        return null;
      };

      const cleanData: unknown[] = [];

      for (let r = 0; r < sheet.length; r++) {
        const row = sheet[r];

        if (typeof row[0] === "string") {
          const detected = detectDay(row[0]);
          if (detected) {
            currentDay = detected;
            continue;
          }
        }

        if (!currentDay) continue;
        if (!isPeriodRow(row)) continue;

        const periodNumber = row[1];
        const teacherRows: unknown[][] = [];
        let t = r + 1;
        
        while (
          t < sheet.length &&
          !isPeriodRow(sheet[t]) &&
          !(typeof sheet[t][0] === "string" && detectDay(sheet[t][0] as string) !== null)
        ) {
          teacherRows.push(sheet[t]);
          t++;
        }

        for (let c = 2; c < row.length; c++) {
          const rawSubject = row[c];
          if (!rawSubject) continue;

          const subjectDoc = findSubject(String(rawSubject));
          if (!subjectDoc) continue;

          const teacherNames = teacherRows
            .map((tr) => String(tr[c] || "").trim())
            .filter(Boolean)
            .slice(0, 2);
          const teacherIds = teacherNames
            .map((n) => findTeacherId(n))
            .filter(Boolean);

          cleanData.push({
            dayOfWeek: currentDay,
            periodNumber,
            classCode: sheet[0][c],
            subject: subjectDoc._id,
            teachers: teacherIds,
            room: subjectDefaultRoom[subjectDoc._id] ?? "Homeroom",
          });
        }
      }

      if (cleanData.length === 0) {
        toast({
          title: "Không có dữ liệu",
          description: "File không chứa bản ghi hợp lệ.",
          variant: "destructive",
        });
        return;
      }

      await api.post(`${API_ENDPOINTS.TIMETABLES}/import`, {
        schoolYear: selectedSchoolYear,
        records: cleanData,
      });

      if (selectedSchoolYear && selectedClass) {
        await fetchTimetableGrid(selectedSchoolYear, selectedClass);
      }
      
      toast({ 
        title: "Thành công", 
        description: "Upload thời khóa biểu thành công" 
      });
    } catch (error: unknown) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Upload thất bại",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      event.target.value = "";
    }
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

    return (
      <Card>
        <CardContent className="p-0">
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
                  {days.map(day => (
                    <TableHead key={day} className="border text-center min-w-[200px] bg-gray-50 font-semibold">
                      {DAY_OF_WEEK_LABELS[day as keyof typeof DAY_OF_WEEK_LABELS]}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodMetas.map((pm) => {
                  // Kiểm tra nếu là tiết đặc biệt (không phải regular)
                  const isSpecialPeriod = pm.type !== "regular";
                  
                  if (isSpecialPeriod) {
                    // Tìm entry có dữ liệu từ bất kỳ ngày nào trong tuần
                    let specialEntry = null;
                    let entryDay = days[0]; // default day for click handler
                    
                    for (const day of days) {
                      const dayEntry = timetableGrid[day]?.[String(pm.number)];
                      if (dayEntry) {
                        specialEntry = dayEntry;
                        entryDay = day;
                        break;
                      }
                    }
                    
                    return (
                      <TableRow key={pm.number} className="hover:bg-gray-50">
                        <TableCell className="border text-center font-medium bg-gray-25">
                          <div>
                            <div className="font-semibold text-[#002855]">{pm.label}</div>
                            <div className="text-xs text-gray-500">{pm.time}</div>
                          </div>
                        </TableCell>
                        {/* Merge tất cả các cột ngày thành một cell */}
                        <TableCell 
                          colSpan={days.length}
                          className="border p-3 cursor-pointer hover:bg-[#002855]/5 transition-colors text-center" 
                          onClick={() => handleCellClick(entryDay, pm.number, specialEntry)}
                        >
                          {specialEntry ? (
                            <div className="space-y-2">
                              <div className="font-semibold text-[#002855] flex items-center justify-center gap-1">
                                <div className="h-2 w-2 bg-[#002855] rounded-full"></div>
                                {typeof specialEntry.subject === 'object' ? specialEntry.subject.name : specialEntry.subject}
                              </div>
                              <div className="flex justify-center">
                                {(() => {
                                  const teachers = specialEntry.teachers;
                                  if (Array.isArray(teachers)) {
                                    return (
                                      <div className="flex flex-wrap justify-center gap-2">
                                        {teachers.map((teacher, index) => (
                                          <div key={index} className="flex items-center gap-1 text-sm text-gray-600">
                                            <Users className="h-3 w-3" />
                                            {typeof teacher === 'object' ? teacher.fullname : teacher}
                                          </div>
                                        ))}
                                      </div>
                                    );
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
                              <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                                <MapPin className="h-3 w-3" />
                                {specialEntry.room
                                  ? typeof specialEntry.room === "object"
                                    ? specialEntry.room.name
                                    : specialEntry.room
                                  : "Chưa có phòng"}
                              </div>
                              <div className="text-xs text-gray-500 italic mt-2">
                                Áp dụng cho tất cả các ngày trong tuần
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400 py-4 border-2 border-dashed border-gray-200 rounded">
                              <Plus className="h-6 w-6 mx-auto mb-1" />
                              <span className="text-sm">Trống</span>
                              <div className="text-xs text-gray-500 italic mt-1">
                                Áp dụng cho tất cả các ngày trong tuần
                              </div>
                            </div>
                          )}
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
                      {days.map(day => {
                        const entry = timetableGrid[day]?.[String(pm.number)];
                        return (
                          <TableCell 
                            key={`${day}-${pm.number}`} 
                            className="border p-3 cursor-pointer hover:bg-[#002855]/5 transition-colors" 
                            onClick={() => handleCellClick(day, pm.number, entry)}
                          >
                            {entry ? (
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

            <div className="relative inline-block">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={loading}
              />
              <Button asChild disabled={loading}>
                <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload Excel
                </label>
              </Button>
            </div>
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
    </div>
  );
};

export default TimetablesPage;
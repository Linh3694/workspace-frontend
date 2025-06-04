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
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "../../hooks/use-toast";
import { api } from "../../lib/api";
import { API_ENDPOINTS } from "../../lib/config";
import * as XLSX from 'xlsx';
import { useParams } from 'react-router-dom';

interface TimetableEntry {
  id?: string;
  _id?: string;
  subject: { _id: string; name: string } | string;
  teachers: Array<{ _id: string; fullname: string }> | Array<string> | string;
  room: { _id: string; name: string } | string;
  dayOfWeek: string;
  period: number;
}

interface TimetableGrid {
  [day: string]: {
    [period: string]: TimetableEntry | null;
  };
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface PeriodDefinition {
  _id?: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  type: "regular" | "morning" | "lunch" | "nap" | "snack" | "dismissal";
  schoolYear: string;
}

interface ApiError {
  message: string;
}

const periodSchema = z.object({
  periodNumber: z.number().min(0, "Số tiết phải lớn hơn hoặc bằng 0").max(14, "Số tiết không được vượt quá 14"),
  startTime: z.string().min(1, "Thời gian bắt đầu là bắt buộc"),
  endTime: z.string().min(1, "Thời gian kết thúc là bắt buộc"),
  type: z.enum(["regular", "morning", "lunch", "nap", "snack", "dismissal"]),
});

type PeriodFormData = z.infer<typeof periodSchema>;

const TimetableComponent = () => {
  const [timetableGrid, setTimetableGrid] = useState<TimetableGrid | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: string;
    period: number;
    entry: TimetableEntry | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [periodDefinitions, setPeriodDefinitions] = useState<PeriodDefinition[]>([]);
  const [isPeriodDialogOpen, setIsPeriodDialogOpen] = useState(false);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('');
  const [schoolYears, setSchoolYears] = useState<Array<{ _id: string, code: string }>>([]);
  const [classes, setClasses] = useState<Array<{ _id: string; className: string; schoolYear: string }>>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');

  const periodForm = useForm<PeriodFormData>({
    resolver: zodResolver(periodSchema),
    defaultValues: {
      type: 'regular'
    }
  });

  const { schoolYearId } = useParams<{ schoolYearId: string }>();

  const dayOfWeekLabels = {
    "Monday": "Thứ Hai",
    "Tuesday": "Thứ Ba",
    "Wednesday": "Thứ Tư",
    "Thursday": "Thứ Năm",
    "Friday": "Thứ Sáu"
  };

  useEffect(() => {
    fetchSchoolYears();
  }, [schoolYearId]);

  useEffect(() => {
    if (selectedSchoolYear) {
      fetchPeriodDefinitions(selectedSchoolYear);
      fetchClasses(selectedSchoolYear);
    }
  }, [selectedSchoolYear]);

  const fetchClasses = async (yearId: string) => {
    try {
      if (!yearId) {
        console.log("No school year selected");
        setClasses([]);
        return;
      }

      console.log("Fetching classes for school year:", yearId);
      const res = await api.get(`${API_ENDPOINTS.CLASSES}?schoolYear=${yearId}`);
      console.log("API Response:", res);

      let classesData = [];
      if (res && typeof res === 'object') {
        if (Array.isArray(res)) {
          classesData = res;
        } else if (res.data && Array.isArray(res.data)) {
          classesData = res.data;
        } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
          classesData = res.data.data;
        } else {
          console.error('Classes data is not in expected format:', res);
        }
      }

      console.log("Processed classes data:", classesData);
      setClasses(classesData);

      if (classesData.length && !selectedClass) {
        setSelectedClass(classesData[0]._id);
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
      setClasses([]);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách lớp",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (selectedSchoolYear && selectedClass) {
      fetchTimetableGrid(selectedSchoolYear, selectedClass);
    }
  }, [selectedSchoolYear, selectedClass]);

  const fetchTimetableGrid = async (yearId: string, classId: string) => {
    setLoading(true);
    try {
      const res = await api.get(API_ENDPOINTS.TIMETABLES_GRID(yearId, classId));
      const grid = res.data?.data ?? res.data;
      console.log("Timetable grid response ➜", grid);
      setTimetableGrid(grid);
    } catch (e) {
      console.error("Error fetching timetable grid:", e);
      toast({ title: "Lỗi", description: "Không thể tải TKB", variant: "destructive" });
      setTimetableGrid(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodDefinitions = async (yearId: string) => {
    try {
      const response = await api.get<ApiResponse<PeriodDefinition[]>>(API_ENDPOINTS.PERIOD_DEFINITIONS(yearId));
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

  const fetchSchoolYears = async () => {
    try {
      const response = await api.get(`${API_ENDPOINTS.SCHOOL_YEARS}`);
      setSchoolYears(response.data);
      if (response.data.length > 0) {
        const activeYear = response.data.find((year: any) => year.isActive) || response.data[0];
        setSelectedSchoolYear(activeYear._id);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách năm học",
        variant: "destructive"
      });
    }
  };

  const handleSelectClass = (id: string) => {
    setSelectedClass(id);
    if (selectedSchoolYear) {
      fetchTimetableGrid(selectedSchoolYear, id);
    }
  };

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const getPeriodMeta = (): { number: number; label: string; time?: string; type: string; start: string }[] => {
    if (Array.isArray(periodDefinitions) && periodDefinitions.length) {
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

      return [...map.values()]
        .sort((a, b) => {
          if (a.startTime !== b.startTime) {
            return a.startTime.localeCompare(b.startTime);
          }
          return a.periodNumber - b.periodNumber;
        })
        .map((p) => ({
          number: p.periodNumber,
          label: p.label
            ? p.label                              // ưu tiên nhãn nhập tay
            : p.type === "regular"
              ? `Tiết ${p.periodNumber}`             // tiết học thường
              : p.type,                              // morning / lunch / nap / dismissal
          time: `${p.startTime} – ${p.endTime}`,
          type: p.type,
          start: p.startTime,
        }));
    }

    const nums = new Set<number>();
    if (timetableGrid) {
      Object.values(timetableGrid).forEach((dayObj: any) => {
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
      start: `${idx}`.padStart(2, "0") + ":00",
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);

      const [subjectsRes, teachersRes, roomsRes] = await Promise.all([
        api.get(API_ENDPOINTS.SUBJECTS),
        api.get(API_ENDPOINTS.TEACHERS),
        api.get(API_ENDPOINTS.ROOMS),
      ]);
      const subjects: any[] = subjectsRes.data?.data ?? subjectsRes.data ?? [];
      const teachers: any[] = teachersRes.data?.data ?? teachersRes.data ?? [];
      const rooms: any[] = roomsRes.data?.data ?? roomsRes.data ?? [];

      const findSubject = (nameVi: string) =>
        subjects.find((s) => normalize(s.name) === normalize(nameVi));

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

      const subjectDefaultRoom: Record<string, string | "Homeroom"> = {};
      subjects.forEach((s: any) => {
        if (s.needFunctionRoom && s.rooms?.length)
          subjectDefaultRoom[s._id] = s.rooms[0];
        else subjectDefaultRoom[s._id] = "Homeroom";
      });

      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const sheet: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

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
      const isPeriodRow = (row: any[]) => Number.isInteger(row[1]);
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
      const cleanData: any[] = [];

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

        const teacherRows: any[][] = [];
        let t = r + 1;
        while (
          t < sheet.length &&
          !isPeriodRow(sheet[t]) &&
          !(typeof sheet[t][0] === "string" && detectDay(sheet[t][0]) !== null)
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
      toast({ title: "Thành công", description: "Upload thời khóa biểu thành công" });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || error.message || "Upload thất bại",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handleCreatePeriod = async (data: PeriodFormData) => {
    try {
      if (!selectedSchoolYear) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn năm học",
          variant: "destructive"
        });
        return;
      }

      setLoading(true);
      const payload = {
        ...data,
        schoolYear: selectedSchoolYear,
        label: data.type === "regular"
          ? `Tiết ${data.periodNumber}`
          : data.type
      };
      await api.post(API_ENDPOINTS.PERIOD_DEFINITIONS(selectedSchoolYear), payload);
      await fetchPeriodDefinitions(selectedSchoolYear);
      setIsPeriodDialogOpen(false);
      periodForm.reset();
      toast({
        title: "Thành công",
        description: "Thêm tiết học thành công"
      });
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể thêm tiết học",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderTimetableGrid = () => {
    if (!selectedClass) {
      return <div className="text-center py-8 text-gray-500">Vui lòng chọn lớp</div>;
    }
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      );
    }
    if (!timetableGrid) {
      return (
        <div className="text-center py-8 text-gray-500">
          Không có dữ liệu thời khóa biểu
        </div>
      );
    }
    const rawMetas = getPeriodMeta();
    rawMetas.sort((a, b) => a.start.localeCompare(b.start));

    const days = Object.keys(dayOfWeekLabels);
    const periodMetas = rawMetas;
    return (
      <Table className="border-collapse">
        <TableHeader>
          <TableRow>
            <TableHead className="border text-center">Tiết</TableHead>
            {days.map(day => (
              <TableHead key={day} className="border text-center min-w-[200px]">
                {dayOfWeekLabels[day as keyof typeof dayOfWeekLabels]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {periodMetas.map((pm) => (
            <TableRow key={pm.number}>
              <TableCell className="border text-center font-medium">
                <div>{pm.label}</div>
                <div className="text-xs text-muted-foreground">{pm.time}</div>
              </TableCell>
              {days.map(day => {
                const entry = timetableGrid[day]?.[String(pm.number)];
                return (
                  <TableCell key={`${day}-${pm.number}`} className="border p-2 cursor-pointer hover:bg-accent/30" onClick={() => handleCellClick(day, pm.number, entry)}>
                    {entry ? (
                      <div className="text-sm">
                        <div className="font-semibold">
                          {typeof entry.subject === 'object' ? entry.subject.name : entry.subject}
                        </div>
                        <div className="space-y-0.5">
                          {(() => {
                            const teachers = entry.teachers;
                            if (Array.isArray(teachers)) {
                              return teachers.map((teacher, index) => (
                                <span
                                  key={index}
                                  className="block whitespace-normal leading-tight"
                                >
                                  {typeof teacher === 'object' ? teacher.fullname : teacher}
                                </span>
                              ));
                            } else if (typeof teachers === 'string') {
                              return <span>{teachers}</span>;
                            }
                            return "Chưa có giáo viên";
                          })()}
                        </div>
                        <div>
                          Phòng:&nbsp;
                          {entry.room
                            ? typeof entry.room === "object"
                              ? entry.room.name
                              : entry.room
                            : "—"}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-center">Trống</div>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const handleCellClick = async (
    day: string,
    period: number,
    entry: TimetableEntry | null
  ) => {
    setSelectedSlot({ day, period, entry });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Thời khóa biểu</h1>
          <Select value={selectedSchoolYear} onValueChange={setSelectedSchoolYear}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chọn năm học" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              {schoolYears.map((year) => (
                <SelectItem key={year._id} value={year._id}>
                  {year.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-x-4">
          <Button onClick={() => setIsPeriodDialogOpen(true)}>
            Khai báo tiết học
          </Button>
          <div className="relative inline-block">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Upload Excel
              </label>
            </Button>
          </div>
        </div>
      </div>
      {classes.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {classes.map((cls) => (
            <Badge
              key={cls._id}
              variant={selectedClass === cls._id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleSelectClass(cls._id)}
            >
              {cls.className}
            </Badge>
          ))}
        </div>
      )}
      <div className="overflow-auto">
        {renderTimetableGrid()}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết tiết học</DialogTitle>
            <DialogDescription>Nhập thông tin tiết học</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedSlot?.entry && (
              <>
                <div className="flex items-center">
                  <div className="w-32 font-medium">Tên môn học</div>
                  <div>
                    {typeof selectedSlot.entry.subject === 'object'
                      ? selectedSlot.entry.subject.name
                      : selectedSlot.entry.subject}
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-32 font-medium">Giáo viên</div>
                  <div>
                    {(() => {
                      const teachers = selectedSlot.entry.teachers;
                      if (Array.isArray(teachers)) {
                        return teachers.map((teacher, index) => (
                          <div key={index}>
                            {typeof teacher === 'object' ? teacher.fullname : teacher}
                          </div>
                        ));
                      } else if (typeof teachers === 'string') {
                        return <div>{teachers}</div>;
                      }
                      return "Chưa có giáo viên";
                    })()}
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-32 font-medium">Phòng học</div>
                  <div>
                    {typeof selectedSlot.entry.room === 'object'
                      ? selectedSlot.entry.room.name
                      : selectedSlot.entry.room || 'Homeroom'}
                  </div>
                </div>
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                onClick={() => setIsDialogOpen(false)}
              >
                Đóng
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPeriodDialogOpen} onOpenChange={setIsPeriodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Khai báo tiết học</DialogTitle>
            <DialogDescription>
              Nhập thông tin tiết học cho thời khóa biểu
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={periodForm.handleSubmit(handleCreatePeriod)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="periodNumber">Tiết số</Label>
              <Select onValueChange={(value) => periodForm.setValue("periodNumber", parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tiết" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectItem value="0">Tiết đặc biệt</SelectItem>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      Tiết {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {periodForm.formState.errors.periodNumber && (
                <p className="text-red-500 text-sm">{periodForm.formState.errors.periodNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Loại tiết học</Label>
              <Select onValueChange={(value) => periodForm.setValue("type", value as "regular" | "morning" | "lunch" | "nap" | "snack" | "dismissal")}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại tiết học" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectItem value="regular">Tiết học thông thường</SelectItem>
                  <SelectItem value="morning">Đón học sinh, ăn sáng</SelectItem>
                  <SelectItem value="lunch">Ăn trưa</SelectItem>
                  <SelectItem value="nap">Ngủ trưa</SelectItem>
                  <SelectItem value="snack">Ăn nhẹ</SelectItem>
                  <SelectItem value="dismissal">Dặn dò, xếp hàng ra về</SelectItem>
                </SelectContent>
              </Select>
              {periodForm.formState.errors.type && (
                <p className="text-red-500 text-sm">{periodForm.formState.errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Thời gian bắt đầu</Label>
              <input
                type="time"
                {...periodForm.register("startTime")}
                className="w-full p-2 border rounded"
              />
              {periodForm.formState.errors.startTime && (
                <p className="text-red-500 text-sm">{periodForm.formState.errors.startTime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Thời gian kết thúc</Label>
              <input
                type="time"
                {...periodForm.register("endTime")}
                className="w-full p-2 border rounded"
              />
              {periodForm.formState.errors.endTime && (
                <p className="text-red-500 text-sm">{periodForm.formState.errors.endTime.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Đang xử lý..." : "Thêm mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimetableComponent;

import React, { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "../../hooks/use-toast";
import { api } from "../../lib/api";
import { API_ENDPOINTS } from "../../lib/config";
import { Checkbox } from "../../components/ui/checkbox";
import type { 
  Subject, 
  Curriculum, 
  SubjectFormData 
} from "../../types/curriculum.types";
import type { Room } from "../../types/room.types";
import type { School, GradeLevel } from "../../types/school.types";

interface ExcelRowData {
  Name?: string;
  Code?: string;
  SchoolCode?: string;
  GradeLevelCodes?: string;
  NeedFunctionRoom?: string;
  RoomCodes?: string;
}

/** Trả về danh sách phòng học của một subject */
const renderRoomNames = (subj: Partial<Subject>): string[] => {
  if (!subj.needFunctionRoom) {
    // Không cần phòng chức năng ⇒ luôn là Homeroom
    return ["Homeroom"];
  }
  if (Array.isArray(subj.rooms) && subj.rooms.length > 0) {
    return subj.rooms.map((r: Room) => r.name);
  }
  // Cần phòng chức năng nhưng chưa gán phòng
  return ["—"];
};

const formSchema = z.object({
  name: z.string().min(1, "Tên môn học không được để trống"),
  code: z.string().min(1, "Mã môn học không được để trống"),
  school: z.string().min(1, "Trường không được để trống"),
  gradeLevels: z.array(z.string()).min(1, "Phải chọn ít nhất một khối lớp"),
  needFunctionRoom: z.boolean(),
  rooms: z.array(z.string()),
  isParentSubject: z.boolean(),
  parentSubject: z.string().optional(),
  description: z.string().optional()
});

const SubjectComponent: React.FC = () => {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredGradeLevels, setFilteredGradeLevels] = useState<GradeLevel[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCurriculumDialogOpen, setIsCurriculumDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>("");
  const [needFunctionRoom, setNeedFunctionRoom] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [isParentSubject, setIsParentSubject] = useState(false);
  const [parentSubjects, setParentSubjects] = useState<Subject[]>([]);
  // Track the previously selected school id so we know when the user actually changes it
  const prevSchoolIdRef = useRef<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Đọc file Excel, validate và gửi lên backend */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportError(null);

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw: ExcelRowData[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const payload = raw.reduce<Record<string, unknown>[]>((acc, row, idx) => {
        const Name = row.Name?.toString().trim();
        const SchoolCode = row.SchoolCode?.toString().trim();
        const GradeLevelCodes = row.GradeLevelCodes?.toString()
          ?.split(",")
          .map((c: string) => c.trim())
          .filter(Boolean) || [];

        if (!Name || !SchoolCode || !GradeLevelCodes.length) {
          console.warn(`Row ${idx + 2} skipped – missing required fields`);
          return acc;
        }

        acc.push({
          name: Name,
          code: row.Code?.toString().trim() || undefined,
          schoolCode: SchoolCode,
          gradeLevelCodes: GradeLevelCodes,
          needFunctionRoom: /true/i.test(row.NeedFunctionRoom?.toString() || ""),
          roomCodes: row.RoomCodes?.toString()
            ?.split(",")
            .map((c: string) => c.trim())
            .filter(Boolean) || [],
        });
        return acc;
      }, []);

      if (!payload.length) {
        setImportError("Không có bản ghi hợp lệ trong file Excel");
        setImportLoading(false);
        return;
      }

      toast({ title: "Đang nhập môn học...", variant: "loading" });
      await api.post(`${API_ENDPOINTS.SUBJECTS}/bulk-upload`, payload);
      toast({
        title: "Thành công",
        description: `Đã nhập ${payload.length} môn học`,
      });
      fetchSubjects();
      setIsImportDialogOpen(false);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "Nhập môn học thất bại");
    } finally {
      setImportLoading(false);
      (e.target as HTMLInputElement).value = "";
    }
  };
  
  const handleImportSubjects = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw: ExcelRowData[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const payload = raw.reduce<Record<string, unknown>[]>((acc, row, idx) => {
      const Name = row.Name?.toString().trim();
      const SchoolCode = row.SchoolCode?.toString().trim();
      const GradeLevelCodes = row.GradeLevelCodes?.toString()?.split(',').map((c: string) => c.trim()).filter(Boolean) || [];
      if (!Name || !SchoolCode || !GradeLevelCodes.length) {
        console.warn(`Row ${idx + 2} skipped – missing required fields`);
        return acc; // skip invalid rows
      }

      acc.push({
        name: Name,
        code: row.Code?.toString().trim() || undefined,
        schoolCode: SchoolCode,
        gradeLevelCodes: GradeLevelCodes,
        needFunctionRoom: /true/i.test(row.NeedFunctionRoom?.toString() || ""),
        roomCodes: row.RoomCodes?.toString()?.split(',').map((c: string) => c.trim()).filter(Boolean) || [],
      });
      return acc;
    }, []);

    if (!payload.length) {
      toast({ title: 'Lỗi', description: 'Không có bản ghi hợp lệ trong file Excel', variant: 'destructive' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      toast({ title: 'Đang nhập môn học...', variant: 'loading' });
      await api.post(`${API_ENDPOINTS.SUBJECTS}/bulk-upload`, payload);
      toast({ title: 'Thành công', description: `Đã nhập ${payload.length} môn học` });
      fetchSubjects();
    } catch (err: unknown) {
      toast({ title: 'Lỗi', description: err instanceof Error ? err.message : 'Nhập môn học thất bại', variant: 'destructive' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      school: "",
      gradeLevels: [],
      needFunctionRoom: false,
      rooms: [],
      isParentSubject: false,
      parentSubject: undefined,
      description: ""
    }
  });

  useEffect(() => {
    fetchSubjects();
    fetchCurriculums();
    fetchRooms();
    fetchSchools();
    fetchParentSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await api.get<{ data: Subject[] }>(API_ENDPOINTS.SUBJECTS);
      if (response && response.data && Array.isArray(response.data)) {
        setSubjects(response.data);
      } else {
        console.error('Invalid response format:', response);
        setSubjects([]);
      }
    } catch (error: unknown) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: "destructive"
      });
    }
  };

  const fetchCurriculums = async () => {
    try {
      const response = await api.get<{ data: Curriculum[] }>(API_ENDPOINTS.CURRICULUMS);
      if (response && response.data && Array.isArray(response.data)) {
        setCurriculums(response.data);
      } else {
        console.error('Invalid curriculums response format:', response);
        setCurriculums([]);
      }
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: "destructive"
      });
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await api.get<{ data: Room[] }>(API_ENDPOINTS.ROOMS);
      if (response && response.data && Array.isArray(response.data)) {
      // Lọc ra các phòng không phải homeroom
        setRooms(response.data.filter((room: Room) => !room.isHomeroom));
      } else {
        console.error('Invalid rooms response format:', response);
        setRooms([]);
      }
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: "destructive"
      });
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await api.get<{ data: School[] }>(API_ENDPOINTS.SCHOOLS);
      if (response && response.data && Array.isArray(response.data)) {
        setSchools(response.data);
      } else {
        console.error('Invalid schools response format:', response);
        setSchools([]);
      }
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải danh sách trường',
        variant: "destructive"
      });
    }
  };

  const fetchGradeLevels = async (schoolId: string) => {
    try {
      const response = await api.get<{ data: GradeLevel[] }>(`${API_ENDPOINTS.GRADE_LEVELS}?school=${schoolId}`);
      if (response && response.data && Array.isArray(response.data)) {
        const sorted = response.data.sort((a, b) => a.order - b.order);
        setFilteredGradeLevels(sorted);
      } else {
        console.error('Invalid grade levels response format:', response);
        setFilteredGradeLevels([]);
      }
    } catch (error: unknown) {
      console.error('Error fetching grade levels:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải danh sách khối lớp',
        variant: "destructive"
      });
      setFilteredGradeLevels([]);
    }
  };

  const fetchParentSubjects = async () => {
    try {
      console.log('Fetching parent subjects...');
      const response = await api.get<{ data: Subject[] }>(`${API_ENDPOINTS.SUBJECTS}/parent`);
      console.log('Parent subjects response:', response);
      if (response && response.data && Array.isArray(response.data)) {
        setParentSubjects(response.data);
      }
    } catch (error) {
      console.error('Error fetching parent subjects:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải danh sách môn học cha',
        variant: "destructive"
      });
    }
  };

  // When the selected school changes we (1) fetch its grade‑levels and
  // (2) clear the currently chosen grade‑levels **only if** the user really
  // changed the school, not when we first populate the form while editing.
  useEffect(() => {
    const selectedSchoolId = form.watch("school");

    // If no school is selected, clear everything and reset the tracker
    if (!selectedSchoolId) {
      setFilteredGradeLevels([]);
      prevSchoolIdRef.current = null;
      return;
    }

    // Proceed only when the school value has changed
    if (selectedSchoolId !== prevSchoolIdRef.current) {
      fetchGradeLevels(selectedSchoolId);

      // If prevSchoolIdRef is already set, that means the user changed the school
      // manually, so we should clear the previously selected grade‑levels.
      if (prevSchoolIdRef.current !== null) {
        form.setValue("gradeLevels", []);
      }

      // Remember the current school for the next change detection
      prevSchoolIdRef.current = selectedSchoolId;
    }
  }, [form.watch("school")]);

  useEffect(() => {
    if (selectedSubject) {
      form.reset({
        name: selectedSubject.name,
        code: selectedSubject.code,
        school: selectedSubject.school?._id || "",
        gradeLevels: selectedSubject.gradeLevels.map(level => level._id),
        needFunctionRoom: selectedSubject.needFunctionRoom,
        rooms: selectedSubject.rooms.map(room => room._id),
        isParentSubject: selectedSubject.isParentSubject,
        parentSubject: selectedSubject.parentSubject?._id,
        description: selectedSubject.description
      });
      // Update the previous school tracker so that the first render of the edit dialog
      // does not clear the existing grade‑levels
      prevSchoolIdRef.current = selectedSubject.school?._id || null;
      setNeedFunctionRoom(selectedSubject.needFunctionRoom);
      setIsParentSubject(selectedSubject.isParentSubject);

      if (selectedSubject.school?._id) {
        fetchGradeLevels(selectedSubject.school._id);
      }
    } else {
      form.reset({
        name: "",
        code: "",
        school: "",
        gradeLevels: [],
        needFunctionRoom: false,
        rooms: [],
        isParentSubject: false,
        parentSubject: undefined,
        description: ""
      });
      setNeedFunctionRoom(false);
      setIsParentSubject(false);
      prevSchoolIdRef.current = null;
    }
  }, [selectedSubject]);

  const handleCreateOrUpdateSubject = async (formData: SubjectFormData) => {
    try {
      console.log('Form data before submit:', formData);
      console.log('Is parent subject state:', isParentSubject);

      const payload = {
        ...formData,
        gradeLevels: formData.gradeLevels || [],
        rooms: formData.rooms || [],
        isParentSubject: formData.isParentSubject,
        parentSubject: formData.isParentSubject ? undefined : formData.parentSubject
      };

      console.log('Payload to be sent:', payload);

      if (selectedSubject) {
        const response = await api.put<Subject>(
          API_ENDPOINTS.SUBJECT(selectedSubject._id),
          payload
        );
        console.log('Update response:', response);
        toast({
          title: "Thành công",
          description: "Cập nhật môn học thành công"
        });
      } else {
        const response = await api.post<Subject>(
          API_ENDPOINTS.SUBJECTS,
          payload
        );
        console.log('Create response:', response);
        toast({
          title: "Thành công",
          description: "Thêm môn học thành công"
        });
      }

      await fetchSubjects();
      await fetchParentSubjects();
      setIsDialogOpen(false);
      setSelectedSubject(null);
      form.reset();
    } catch (error) {
      console.error('Error in handleCreateOrUpdateSubject:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: "destructive"
      });
    }
  };

  const handleAddToCurriculum = async () => {
    if (!selectedSubject || !selectedCurriculum) return;

    try {


      const endpoint = `${API_ENDPOINTS.CURRICULUM(selectedCurriculum)}/subjects`;
      await api.post(endpoint, {
        subjectId: selectedSubject._id,
      });

      // Lấy thông tin curriculum đã chọn
      const selectedCurriculumData = curriculums.find(c => c._id === selectedCurriculum);

      // Cập nhật state subjects với curriculum mới
      setSubjects(prev =>
        prev.map(s => {
          // luôn cập nhật môn vừa chọn
          if (s._id === selectedSubject._id) {
            return {
              ...s,
              curriculums: [
                ...s.curriculums,
                { curriculum: { _id: selectedCurriculum, name: selectedCurriculumData?.name || '' } },
              ],
            };
          }

          // Nếu môn vừa chọn là cha → cập nhật cho con
          if (
            selectedSubject.isParentSubject &&
            selectedSubject.subSubjects.some(sub => sub._id === s._id) &&
            !s.curriculums.some(c => c.curriculum._id === selectedCurriculum)
          ) {
            return {
              ...s,
              curriculums: [
                ...s.curriculums,
                { curriculum: { _id: selectedCurriculum, name: selectedCurriculumData?.name || '' } },
              ],
            };
          }

          return s;
        })
      );

      setIsCurriculumDialogOpen(false);
      setSelectedCurriculum("");
      toast({
        title: "Thành công",
        description: "Thêm môn học vào chương trình thành công"
      });
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: "destructive"
      });
    }
  };

  const handleDeleteSubject = async () => {
    try {
      if (!selectedSubject) return;
      await api.delete(API_ENDPOINTS.SUBJECT(selectedSubject._id));
      toast({
        title: "Thành công",
        description: "Xóa môn học thành công"
      });
      await fetchSubjects();
      setIsDialogOpen(false);
      setSelectedSubject(null);
    } catch (error: unknown) {
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
        <h1 className="text-2xl font-semibold">Quản lý môn học</h1>
        <div className="flex gap-2 items-center">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedSubject(null)}>Thêm môn học mới</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedSubject ? "Cập nhật môn học" : "Thêm môn học mới"}</DialogTitle>
                <DialogDescription>Nhập thông tin môn học</DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(handleCreateOrUpdateSubject)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên môn học</Label>
                  <Input id="name" {...form.register("name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Mã môn học</Label>
                  <Input id="code" {...form.register("code")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school">Trường</Label>
                  <Select
                    value={form.watch("school")}
                    onValueChange={(value) => {
                      form.setValue("school", value);
                      form.setValue("gradeLevels", []);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trường" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(schools) && schools.map((school) => (
                        <SelectItem key={school._id} value={school._id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {form.watch("school") && (
                  <div className="space-y-2">
                    <Label>Khối lớp</Label>
                    <div className="grid gap-2">
                      {filteredGradeLevels.map((level) => (
                        <div key={level._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`level-${level._id}`}
                            checked={(form.watch("gradeLevels") || []).includes(level._id)}
                            onCheckedChange={(checked) => {
                              const currentLevels = form.watch("gradeLevels") || [];
                              if (checked) {
                                form.setValue("gradeLevels", [...currentLevels, level._id]);
                              } else {
                                form.setValue("gradeLevels", currentLevels.filter(id => id !== level._id));
                              }
                            }}
                          />
                          <Label htmlFor={`level-${level._id}`}>{level.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isParentSubject"
                    checked={isParentSubject}
                    onCheckedChange={(checked) => {
                      const isChecked = checked as boolean;
                      setIsParentSubject(isChecked);
                      form.setValue("isParentSubject", isChecked);
                      if (isChecked) {
                        form.setValue("parentSubject", undefined);
                      }
                      console.log('isParentSubject changed to:', isChecked);
                      console.log('Form values after change:', form.getValues());
                    }}
                  />
                  <Label htmlFor="isParentSubject">Là môn học cha</Label>
                </div>
                {!isParentSubject && (
                  <div className="space-y-2">
                    <Label htmlFor="parentSubject">Môn học cha</Label>
                    <Select
                      value={form.watch("parentSubject")}
                      onValueChange={(value) => form.setValue("parentSubject", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn môn học cha" />
                      </SelectTrigger>
                      <SelectContent>
                        {parentSubjects.map((subject) => (
                          <SelectItem key={subject._id} value={subject._id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Input id="description" {...form.register("description")} />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="needFunctionRoom"
                    checked={needFunctionRoom}
                    onCheckedChange={(checked) => {
                      setNeedFunctionRoom(checked as boolean);
                      if (!checked) {
                        form.setValue("rooms", []);
                      }
                    }}
                  />
                  <Label htmlFor="needFunctionRoom">Học tại phòng chức năng</Label>
                </div>
                {needFunctionRoom && (
                  <div className="space-y-2">
                    <Label>Chọn phòng học</Label>
                    <div className="grid gap-2">
                      {rooms.map((room) => (
                        <div key={room._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`room-${room._id}`}
                            checked={(form.watch("rooms") || []).includes(room._id)}
                            onCheckedChange={(checked) => {
                              const currentRooms = form.watch("rooms") || [];
                              if (checked) {
                                form.setValue("rooms", [...currentRooms, room._id]);
                              } else {
                                form.setValue("rooms", currentRooms.filter(id => id !== room._id));
                              }
                            }}
                          />
                          <Label htmlFor={`room-${room._id}`}>{room.name} ({room.type})</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <DialogFooter>
                  {selectedSubject && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteSubject}
                    >
                      Xóa
                    </Button>
                  )}
                  <Button type="submit">{selectedSubject ? "Cập nhật" : "Thêm mới"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <input
            type="file"
            accept=".xlsx, .xls"
            ref={fileInputRef}
            onChange={handleImportSubjects}
            style={{ display: 'none' }}
          />
          <Button onClick={() => setIsImportDialogOpen(true)}>
            Import Excel
          </Button>

          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nhập môn học từ Excel</DialogTitle>
                <DialogDescription>
                  File cần có các cột: Name, Code, SchoolCode, GradeLevelCodes, NeedFunctionRoom, RoomCodes.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fileImport" className="text-right">
                    File Excel
                  </Label>
                  <Input
                    id="fileImport"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="col-span-3"
                    disabled={importLoading}
                  />
                </div>

                {importError && (
                  <div className="text-red-500 text-sm">{importError}</div>
                )}

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">File mẫu</Label>
                  <Button variant="outline" asChild>
                    <a href="/Template/subject-example.xlsx" download>
                      Tải file mẫu
                    </a>
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" onClick={() => setIsImportDialogOpen(false)}>
                  Đóng
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên môn học</TableHead>
              <TableHead>Trường</TableHead>
              <TableHead>Khối lớp</TableHead>
              <TableHead>Phòng học</TableHead>
              <TableHead>Chương trình học</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.length > 0 ? (
              <>
                {subjects
                  /* Only top‑level (không có parent) */
                  .filter((s) => !s.parentSubject)
                  .map((parent) => (
                    <React.Fragment key={parent._id}>
                      {/* ---------- Parent row ---------- */}
                      <TableRow>
                        <TableCell className="font-semibold">
                          {parent.name}
                          {parent.isParentSubject && (
                            <span className="ml-2 text-sm opacity-70">(Môn học cha)</span>
                          )}
                        </TableCell>
                        <TableCell>{parent.school?.name || "—"}</TableCell>
                        <TableCell>
                          {parent.gradeLevels.map((l) => l.name).join(", ") || "—"}
                        </TableCell>
                        <TableCell>
                          {renderRoomNames(parent).map((room, index) => (
                            <div key={index}>{room}</div>
                          ))}
                        </TableCell>
                        <TableCell>
                          {parent.curriculums?.map((c) => c.curriculum.name).join(", ") ||
                            "—"}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubject(parent);
                              setIsParentSubject(parent.isParentSubject);
                              setIsDialogOpen(true);
                            }}
                          >
                            Cập nhật
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubject(parent);
                              setIsCurriculumDialogOpen(true);
                            }}
                          >
                            Thêm vào chương trình
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* ---------- Child rows ---------- */}
                      {parent.subSubjects.map((sub) => {
                        // Tìm subject con đầy đủ thông tin (có thể đã có sẵn trong mảng subjects)
                        const child =
                          subjects.find((s) => s._id === sub._id) || (sub as Subject);

                        return (
                          <TableRow key={child._id}>
                            <TableCell className="pl-8">{child.name}</TableCell>
                            <TableCell>{child.school?.name || "—"}</TableCell>
                            <TableCell>
                              {child.gradeLevels?.map((l: GradeLevel) => l.name).join(", ") ||
                                "—"}
                            </TableCell>
                            <TableCell>
                              {renderRoomNames(child).map((room, index) => (
                                <div key={index}>{room}</div>
                              ))}
                            </TableCell>
                            <TableCell>
                              {child.curriculums
                                ?.map((c: { curriculum: { _id: string; name: string; } }) => c.curriculum?.name)
                                .join(", ") || "—"}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSubject(child as Subject);
                                  setIsParentSubject(false);
                                  setIsDialogOpen(true);
                                }}
                              >
                                Cập nhật
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSubject(child as Subject);
                                  setIsCurriculumDialogOpen(true);
                                }}
                              >
                                Thêm vào chương trình
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  ))}
              </>
            ) : (
              <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                  Không có môn học nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCurriculumDialogOpen} onOpenChange={setIsCurriculumDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm môn học vào chương trình</DialogTitle>
            <DialogDescription>Chọn chương trình học và số tiết học mỗi tuần</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex">
              <div className="flex-1 space-y-2">
                <Label htmlFor="curriculum">Chương trình học</Label>
                <Select
                  value={selectedCurriculum}
                  onValueChange={setSelectedCurriculum}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chương trình học" />
                  </SelectTrigger>
                  <SelectContent>
                    {curriculums.map((curriculum) => (
                      <SelectItem key={curriculum._id} value={curriculum._id}>
                        {curriculum.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
            <DialogFooter>
              <Button onClick={handleAddToCurriculum}>Thêm vào chương trình</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa môn học</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa môn học "{selectedSubject?.name}" không?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubject}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubjectComponent;
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { FaAngleRight, FaAngleDown } from "react-icons/fa6";


/** Simple error boundary to catch runtime errors within Curriculum screen */
class CurriculumErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render shows the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // You can also log the error to an error reporting service
    console.error('Error caught in CurriculumErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-6 text-center text-red-600">
          Đã xảy ra lỗi khi tải chương trình học. Vui lòng thử tải lại trang hoặc liên hệ quản trị viên.
        </div>
      );
    }

    return this.props.children;
  }
}

interface EducationalSystem {
  _id: string;
  name: string;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
}

interface CurriculumSubject {
  subject: Subject;
  periodsPerWeek: number;
}

interface Curriculum {
  _id: string;
  name: string;
  educationalSystem: EducationalSystem;
  gradeLevel: string;
  subjects: CurriculumSubject[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const schema = z.object({
  name: z.string().min(1, "Tên chương trình học là bắt buộc"),
  educationalSystem: z.string().min(1, "Hệ học là bắt buộc"),
  gradeLevel: z.string().optional(),
  description: z.string().optional(),
});

type CurriculumFormData = z.infer<typeof schema>;

const CurriculumComponent: React.FC = () => {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [systems, setSystems] = useState<EducationalSystem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CurriculumFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      educationalSystem: "",
      gradeLevel: "",
      description: "",
    }
  });

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  useEffect(() => {
    fetchSystems();
    fetchSubjects();
    fetchCurriculums();
  }, []);

  useEffect(() => {
    if (selectedCurriculum) {
      console.log('Setting form values for curriculum:', selectedCurriculum);
      setValue("name", selectedCurriculum.name);
      setValue("educationalSystem", selectedCurriculum.educationalSystem._id);
      setValue("gradeLevel", selectedCurriculum.gradeLevel || "");
      setValue("description", selectedCurriculum.description || "");
    } else {
      console.log('Resetting form');
      reset();
    }
  }, [selectedCurriculum, setValue, reset]);

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

  const fetchSubjects = async () => {
    try {
      const result = await api.get(API_ENDPOINTS.SUBJECTS);
      const subjectsData = Array.isArray(result.data) ? result.data : result.data?.data;

      if (Array.isArray(subjectsData)) {
        setSubjects(subjectsData);
        console.log('Subjects data:', subjectsData);
      } else {
        setSubjects([]);
        console.error('Không thể lấy được dữ liệu môn học');
      }
    } catch (error: unknown) {
      setSubjects([]);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải dữ liệu',
        variant: "destructive"
      });
    }
  };

  const fetchCurriculums = async () => {
    try {
      const result = await api.get(API_ENDPOINTS.CURRICULUMS);
      const rawList: Curriculum[] = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.data?.data)
          ? result.data.data
          : [];

      const sanitized = rawList
        .filter((c) => c && c._id && c.educationalSystem?._id) // Ensure curriculum and educationalSystem are valid
        .map((c) => {
          // keep only entries that have a populated subject and ensure uniqueness by subject._id
          const seen = new Set<string>();
          const validSubjects = Array.isArray(c.subjects)
            ? c.subjects.reduce<typeof c.subjects>((acc, sd) => {
              const id = sd?.subject?._id;
              if (!id) {
                console.warn(`Invalid subject entry in curriculum ${c._id}:`, sd);
                return acc; // skip
              }
              if (seen.has(id.toString())) {
                // duplicated entry – skip
                return acc;
              }
              seen.add(id.toString());
              acc.push(sd);
              return acc;
            }, [])
            : [];
          return {
            ...c,
            subjects: validSubjects,
          };
        });

      setCurriculums(sanitized);
    } catch (error: unknown) {
      setCurriculums([]);
      toast({
        title: 'Lỗi',
        description:
          error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải dữ liệu',
        variant: 'destructive',
      });
    }
  };

  const handleCreateOrUpdateCurriculum = async (formData: CurriculumFormData) => {
    console.log('Bắt đầu xử lý form submit với dữ liệu:', formData);
    try {
      if (selectedCurriculum) {
        console.log('Đang cập nhật curriculum với id:', selectedCurriculum._id);
        const endpoint = API_ENDPOINTS.CURRICULUM(selectedCurriculum._id);
        console.log('Endpoint:', endpoint);

        const dataToSend = {
          name: formData.name,
          educationalSystem: formData.educationalSystem,
          gradeLevel: formData.gradeLevel || null,
          description: formData.description || '',
          subjects: selectedCurriculum.subjects
            .filter((s) => s?.subject?._id)
            .map((s) => s.subject._id)
        };
        console.log('Dữ liệu sẽ gửi đi:', dataToSend);

        try {
          const response = await api.put<Curriculum>(endpoint, dataToSend);
          console.log('Phản hồi từ server:', response);

          if (response) {
            await fetchCurriculums();
            setIsDialogOpen(false);
            setSelectedCurriculum(null);
            reset();
            toast({
              title: "Thành công",
              description: "Cập nhật chương trình học thành công"
            });
          }
        } catch (error) {
          console.error('Lỗi khi gọi API:', error);
          if (error instanceof Error) {
            console.error('Chi tiết lỗi:', error.message);
            console.error('Stack trace:', error.stack);
          }
          throw error;
        }
      } else {
        const endpoint = API_ENDPOINTS.CURRICULUMS;
        console.log('Đang tạo chương trình mới:', {
          formData,
          endpoint
        });

        const response = await api.post<Curriculum>(endpoint, formData);
        console.log('Phản hồi tạo mới:', response);
      }

      await fetchCurriculums();
      setIsDialogOpen(false);
      setSelectedCurriculum(null);
      reset();
      toast({
        title: "Thành công",
        description: selectedCurriculum ? "Cập nhật chương trình học thành công" : "Thêm chương trình học thành công"
      });
    } catch (error: unknown) {
      console.error('Chi tiết lỗi:', error);
      let errorMessage = 'Đã xảy ra lỗi không xác định';

      if (error instanceof Error) {
        errorMessage = `Lỗi: ${error.message}`;
        console.error('Stack trace:', error.stack);
      } else if (error instanceof Response) {
        try {
          const text = await error.text();
          console.error('Response text:', text);
          const status = error.status;
          if (status === 404) {
            errorMessage = 'Không tìm thấy chương trình học này';
          } else if (status === 401) {
            errorMessage = 'Bạn không có quyền thực hiện thao tác này';
          } else if (status === 400) {
            errorMessage = `Lỗi dữ liệu: ${text}`;
          } else {
            errorMessage = `Lỗi server (${status}): ${text}`;
          }
        } catch {
          errorMessage = `Lỗi kết nối tới server`;
        }
      }

      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleAddSubject = async () => {
    if (!selectedCurriculum || !selectedSubject) return;

    try {
      const periodsPerWeek = (document.getElementById('periodsPerWeek') as HTMLInputElement)?.value;
      if (!periodsPerWeek || parseInt(periodsPerWeek) < 1) {
        toast({
          title: "Lỗi",
          description: "Số tiết học/tuần phải lớn hơn 0",
          variant: "destructive"
        });
        return;
      }

      const endpoint = `${API_ENDPOINTS.CURRICULUM(selectedCurriculum._id)}/subjects`;
      await api.post(endpoint, {
        subjectId: selectedSubject,
        periodsPerWeek: parseInt(periodsPerWeek)
      });

      await fetchCurriculums();

      const subject = subjects.find(s => s._id === selectedSubject);
      if (subject) {
        const response = await api.get<{ data: Subject }>(`${API_ENDPOINTS.SUBJECTS}/${selectedSubject}`);
        const updatedSubject = Array.isArray(response) ? response[0] : response.data.data;
        setSubjects(prevSubjects =>
          prevSubjects.map(s => s._id === selectedSubject ? updatedSubject : s)
        );
      }

      setIsSubjectDialogOpen(false);
      setSelectedSubject("");
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

  const handleRemoveSubject = async (curriculumId: string, subjectId: string) => {
    try {
      // Optimistically strip the subject from the current curriculums state to avoid transient render errors
      setCurriculums(prev =>
        prev.map(c =>
          c._id === curriculumId
            ? {
              ...c,
              subjects: c.subjects.filter(sd => sd.subject?._id !== subjectId)
            }
            : c
        )
      );

      const endpoint = `${API_ENDPOINTS.CURRICULUM(curriculumId)}/subjects/${subjectId}`;
      await api.delete(endpoint);

      await fetchCurriculums();

      const subject = subjects.find(s => s._id === subjectId);
      if (subject) {
        const response = await api.get<{ data: Subject }>(`${API_ENDPOINTS.SUBJECTS}/${subjectId}`);
        const updatedSubject = Array.isArray(response) ? response[0] : response.data.data;
        setSubjects(prevSubjects =>
          prevSubjects.map(s => s._id === subjectId ? updatedSubject : s)
        );
      }

      toast({
        title: "Thành công",
        description: "Xóa môn học khỏi chương trình thành công"
      });
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: "destructive"
      });
    }
  };

  const handleDeleteCurriculum = async () => {
    try {
      if (!selectedCurriculum) return;

      const response = await api.delete(API_ENDPOINTS.CURRICULUM(selectedCurriculum._id));

      if (response) {
        toast({
          title: "Thành công",
          description: "Xóa chương trình học thành công"
        });
        await fetchCurriculums();
        setIsDialogOpen(false);
        setSelectedCurriculum(null);
        setIsDeleteDialogOpen(false);
      }
    } catch (error: unknown) {
      console.error('Error deleting curriculum:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa chương trình học',
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Quản lý chương trình học</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          console.log('Dialog state changed:', open);
          if (!open) {
            setSelectedCurriculum(null);
            reset();
          }
          setIsDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              console.log('Thêm mới button clicked');
              setSelectedCurriculum(null);
            }}>
              Thêm chương trình học mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedCurriculum ? "Cập nhật chương trình học" : "Thêm chương trình học mới"}</DialogTitle>
              <DialogDescription>Nhập thông tin chương trình học</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              console.log('Form submitted');
              handleSubmit(handleCreateOrUpdateCurriculum)(e);
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên chương trình học</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="educationalSystem">Hệ học</Label>
                <Select
                  value={watch("educationalSystem")}
                  onValueChange={(value) => {
                    console.log('Selected educationalSystem:', value);
                    setValue("educationalSystem", value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn hệ học" />
                  </SelectTrigger>
                  <SelectContent>
                    {systems.map((system) => (
                      <SelectItem key={system._id} value={system._id}>
                        {system.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.educationalSystem && <p className="text-red-500 text-sm">{errors.educationalSystem.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" {...register("description")} />
              </div>
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa chương trình học</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc chắn muốn xóa chương trình học "{selectedCurriculum?.name}" không?
                      Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCurriculum}>Xóa</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <DialogFooter>
                {selectedCurriculum && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    Xóa
                  </Button>
                )}
                <Button type="submit">{selectedCurriculum ? "Cập nhật" : "Thêm mới"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên chương trình</TableHead>
              <TableHead>Hệ học</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {curriculums.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Không có dữ liệu chương trình học
                </TableCell>
              </TableRow>
            ) : (
                curriculums.map((curr) => (
                  <React.Fragment key={curr._id}>
                    {/* ----- Hàng cha (Curriculum) ----- */}
                    <TableRow
                      className={`cursor-pointer ${expandedRows.has(curr._id)}`}
                      onClick={() => toggleExpand(curr._id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-lg">
                            {expandedRows.has(curr._id) ? <FaAngleDown /> : <FaAngleRight />}
                          </div>
                          <div className="text-base font-medium">{curr.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{curr.educationalSystem?.name || "—"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          setSelectedCurriculum(curr);
                          setIsDialogOpen(true);
                          e.stopPropagation();
                        }}
                      >
                        Cập nhật
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          setSelectedCurriculum(curr);
                          setIsSubjectDialogOpen(true);
                          e.stopPropagation();
                        }}
                      >
                        Thêm môn học
                      </Button>
                    </TableCell>
                  </TableRow>

                    {/* ----- Hàng con (Subjects) ----- */}
                    {expandedRows.has(curr._id) && (
                      curr.subjects
                        ?.filter((sd) => sd?.subject?._id)
                        .map((sd) => (
                          <TableRow key={`${curr._id}-${sd.subject._id}`}>
                            <TableCell className="pl-8">{sd.subject.name}</TableCell>
                            <TableCell />
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation(); // tránh click làm sập row
                                  handleRemoveSubject(curr._id, sd.subject._id);
                                }}
                                title="Xoá môn khỏi chương trình"
                              >
                                ×
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm môn học vào chương trình</DialogTitle>
            <DialogDescription>Chọn môn học và số tiết học mỗi tuần</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="subject">Môn học</Label>
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn môn học" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.length === 0 ? (
                      <SelectItem value="" disabled>Không có môn học</SelectItem>
                    ) : (
                      subjects.map((subject) => (
                        <SelectItem key={subject._id} value={subject._id}>
                          {subject.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

            </div>
            <DialogFooter>
              <Button onClick={handleAddSubject}>Thêm môn học</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Wrap the screen component with an error boundary
const CurriculumPage: React.FC = () => (
  <CurriculumErrorBoundary>
    <CurriculumComponent />
  </CurriculumErrorBoundary>
);

export default CurriculumPage;
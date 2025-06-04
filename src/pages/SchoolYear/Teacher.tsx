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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "../../hooks/use-toast";
import { api } from "../../lib/api";
import { API_ENDPOINTS, BASE_URL } from "../../lib/config";
import { Checkbox } from "../../components/ui/checkbox";
import type { SchoolType } from "../../lib/constants";
import { Combobox } from "../../components/ui/combobox";

interface Subject {
  _id: string;
  name: string;
  code: string;
  curriculums: {
    curriculum: {
      _id: string;
      name: string;
    };
    periodsPerWeek: number;
  }[];
}

interface Curriculum {
  _id: string;
  name: string;
  description?: string;
  educationalSystem: {
    _id: string;
    name: string;
  };
}

interface School {
  _id: string;
  name: string;
  code: string;
  type: SchoolType;
}

interface GradeLevel {
  _id: string;
  name: string;
  code: string;
  order: number;
  school: string;
  subjects: {
    _id: string;
    name: string;
    code: string;
  }[];
}

interface Teacher {
  _id: string;
  user?: {
    avatarUrl?: string;
  };
  fullname: string;
  phone: string;
  email: string;
  jobTitle: string;
  school: {
    _id: string;
    name: string;
    code: string;
    type: string;
  };
  gradeLevels: GradeLevel[];
  subjects: Subject[];
  curriculums: Curriculum[];
  educationalSystem?: {
    _id: string;
    name: string;
  };
  classes?: Class[];
  teachingAssignments?: {
    class: { _id: string; className: string };
    subjects: { _id: string; name: string }[];
  }[];
}

interface Class {
  _id: string;
  className: string;
  gradeLevel: {
    _id: string;
    name: string;
    code: string;
    order: number;
  };
}

interface ClassSubjectAssignment {
  classId: string;
  subjectIds: string[];
}

interface ComboboxOption {
  value: string;
  label: string;
}

const schema = z.object({
  fullname: z.string().min(1, "Họ và tên là bắt buộc"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  school: z.string().min(1, "Trường học là bắt buộc"),
  gradeLevels: z.array(z.string()).optional(),
  subjects: z.array(z.string()).optional(),
  curriculum: z.string().optional(),
  classes: z.array(z.string()).optional(),
});

type TeacherFormData = z.infer<typeof schema>;

const TeacherComponent: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTeachingDialogOpen, setIsTeachingDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [classesList, setClassesList] = useState<Class[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubjectAssignment[]>([]);
  const [availableSubjectsForClass, setAvailableSubjectsForClass] = useState<{ [key: string]: ComboboxOption[] }>({});

  const { handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullname: "",
      email: "",
      phone: "",
      jobTitle: "",
      school: "",
      gradeLevels: [],
      subjects: [],
      curriculum: "",
      classes: [],
    }
  });


  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
    fetchSchools();
  }, []);

  useEffect(() => {
    const schoolId = watch("school");
    if (schoolId) {
      fetchGradeLevelsForSchool(schoolId);
    } else {
      setGradeLevels([]);
    }
  }, [watch("school")]);

  useEffect(() => {
    const gradeLevels = watch("gradeLevels") || [];
    console.log('Current gradeLevels:', gradeLevels);
    console.log('Current classesList state:', classesList);

    if (gradeLevels.length > 0) {
      fetchClassesForGradeLevels(gradeLevels);
    } else {
      setClassesList([]);
    }
  }, [watch("gradeLevels")]);



  useEffect(() => {
    if (selectedTeacher) {
      setValue("fullname", selectedTeacher.fullname);
      setValue("email", selectedTeacher.email);
      setValue("phone", selectedTeacher.phone || "");
      setValue("jobTitle", selectedTeacher.jobTitle || "");
      setValue("school", selectedTeacher.school?._id || "");
      setValue("gradeLevels", selectedTeacher.gradeLevels?.map(g => g._id) || []);
      setValue("subjects", selectedTeacher.subjects?.map(s => s._id) || []);
      setValue("curriculum", selectedTeacher.curriculums?.[0]?._id || "");
      setSelectedClasses(selectedTeacher?.classes?.map(c => c._id) || []);
    } else {
      reset();
    }
  }, [selectedTeacher, setValue, reset]);

  useEffect(() => {
    const selectedCurriculum = watch("curriculum");
    if (selectedCurriculum) {
      const filtered = subjects.filter(subject =>
        subject.curriculums.some(c => c.curriculum._id === selectedCurriculum)
      );
      const currentSubjects = watch("subjects") || [];
      const validSubjects = currentSubjects.filter(subjectId =>
        filtered.some(s => s._id === subjectId)
      );
      if (validSubjects.length !== currentSubjects.length) {
        setValue("subjects", validSubjects);
      }
    } else {
      setValue("subjects", []);
    }
  }, [watch("curriculum"), subjects, setValue]);

  const getGradeLevelDisplay = (order: number, schoolType: string) => {
    switch (schoolType) {
      case 'THPT':
        return `Khối ${order + 9}`; // Khối 10, 11, 12
      case 'THCS':
        return `Khối ${order + 5}`; // Khối 6, 7, 8, 9
      case 'Tiểu học':
        return `Khối ${order}`; // Khối 1, 2, 3, 4, 5
      default:
        return `Khối ${order}`;
    }
  };

  const fetchGradeLevelsForSchool = async (schoolId: string) => {
    try {
      const selectedSchool = schools.find(s => s._id === schoolId);
      if (!selectedSchool) {
        console.log('No school found with ID:', schoolId);
        setGradeLevels([]);
        return;
      }
      console.log('Fetching grade levels for school:', selectedSchool.name);

      const response = await api.get<GradeLevel[]>(`${API_ENDPOINTS.GRADE_LEVELS}?school=${schoolId}`);
      console.log('Grade levels API response:', response);

      if (response) {
        const sortedLevels = response.data.sort((a, b) => a.order - b.order);
        console.log('Sorted grade levels:', sortedLevels);
        setGradeLevels(sortedLevels);
      } else {
        console.log('No grade levels data in response');
        setGradeLevels([]);
      }
    } catch (error: unknown) {
      console.error('Error fetching grade levels:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải danh sách khối lớp',
        variant: "destructive"
      });
      setGradeLevels([]);
    }
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.TEACHERS);
      console.log('Raw API response:', response);

      let teachersData: Teacher[] = [];

      // Kiểm tra và xử lý response theo nhiều cấp
      if (response) {
        if (Array.isArray(response)) {
          teachersData = response;
        } else if (typeof response === 'object') {
          if (Array.isArray(response.data)) {
            teachersData = response.data;
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            teachersData = response.data.data;
          }
        }
      }

      console.log('Teachers data before filtering:', teachersData);

      // Lọc và kiểm tra dữ liệu
      const validTeachers = teachersData.filter(teacher => {
        const isValid = teacher &&
          typeof teacher === 'object' &&
          teacher._id &&
          teacher.fullname;

        if (!isValid) {
          console.log('Invalid teacher data:', teacher);
        }
        return isValid;
      });

      console.log('Final processed teachers:', validTeachers);
      setTeachers(validTeachers);
    } catch (error: unknown) {
      console.error('Error fetching teachers:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi tải danh sách giáo viên",
        variant: "destructive"
      });
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await api.get<Subject[]>(API_ENDPOINTS.SUBJECTS);
      setSubjects(data.data);
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi tải danh sách môn học",
        variant: "destructive"
      });
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await api.get<School[]>(API_ENDPOINTS.SCHOOLS);
      // Ensure schools have their grade levels
      const schoolsWithGrades = await Promise.all(
        response.data.map(async (school: School) => {
          const schoolDetails = await api.get<School>(API_ENDPOINTS.SCHOOL(school._id));
          return schoolDetails.data;
        })
      );
      setSchools(schoolsWithGrades);
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi tải danh sách trường học",
        variant: "destructive"
      });
    }
  };

  const fetchClassesForGradeLevels = async (gradeIds: string[]) => {
    try {
      if (!gradeIds.length) {
        setClassesList([]);
        return;
      }

      console.log('Fetching classes for grades:', gradeIds);

      const response = await api.get<{ data: Class[] }>(
        `${API_ENDPOINTS.CLASSES}?gradeLevels=${gradeIds.join(",")}`
      );

      // Log toàn bộ response để debug
      console.log('Full API response:', response);

      // Lấy dữ liệu trực tiếp từ response.data
      const classesData = response.data || [];
      console.log('Classes data to process:', classesData);

      // Kiểm tra xem dữ liệu có đúng cấu trúc không
      if (Array.isArray(classesData)) {
        // Map trực tiếp dữ liệu từ response
        const processedClasses = classesData.map(cls => ({
          _id: cls._id,
          className: cls.className,
          gradeLevel: {
            _id: cls.gradeLevel._id,
            name: cls.gradeLevel.name,
            code: cls.gradeLevel.code,
            order: cls.gradeLevel.order
          }
        }));

        console.log('Processed classes:', processedClasses);
        setClassesList(processedClasses);
      } else {
        // Nếu dữ liệu nằm trong property 'data'
        const classes = response.data?.data || [];
        const processedClasses = classes.map(cls => ({
          _id: cls._id,
          className: cls.className,
          gradeLevel: {
            _id: cls.gradeLevel._id,
            name: cls.gradeLevel.name,
            code: cls.gradeLevel.code,
            order: cls.gradeLevel.order
          }
        }));

        console.log('Processed classes from data property:', processedClasses);
        setClassesList(processedClasses);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách lớp học",
        variant: "destructive"
      });
      setClassesList([]);
    }
  };



  // Khi chọn giáo viên, tự động ánh xạ môn học cho từng lớp dựa vào gradeLevel
  // Khi chọn giáo viên, tự động ánh xạ môn học cho từng lớp dựa vào gradeLevel
  useEffect(() => {
    if (selectedTeacher?.classes && selectedTeacher.gradeLevels) {
      const updated: { [key: string]: ComboboxOption[] } = {};

      selectedTeacher.classes.forEach((cls) => {
        // ID khối của lớp
        const classGradeId =
          typeof cls.gradeLevel === "string" ? cls.gradeLevel : cls.gradeLevel?._id;

        // Tìm khối trong mảng gradeLevels của GV (có thể là object hoặc string)
        const grade = selectedTeacher.gradeLevels.find((g) =>
          (typeof g === "string" ? g : g._id) === classGradeId
        ) as GradeLevel | undefined;

        if (grade && Array.isArray(grade.subjects)) {
          updated[cls._id] = grade.subjects.map((sub) => {
            // 1) Khi grade.subjects chỉ là ObjectId
            // 2) Hoặc đã populate thành object
            const subId = typeof sub === "string" ? sub : sub._id;
            const subObj = subjects.find((s) => s._id === subId); // subjects = state đã fetch toàn bộ

            return {
              value: subId,
              label: subObj ? subObj.name : typeof sub === "string" ? "(Chưa đặt tên)" : sub.name,
            };
          });
        }
      });

      setAvailableSubjectsForClass(updated);
    } else {
      setAvailableSubjectsForClass({});
    }
  }, [selectedTeacher, subjects]); // thêm `subjects` vào dependency
  console.log(availableSubjectsForClass)

  // Handle subject assignment update
  const handleUpdateSubjectAssignment = async () => {
    try {
      if (selectedTeacher && classSubjects.length > 0) {
        const subjectAssignments = classSubjects.map(cs => ({
          classId: cs.classId,
          subjectIds: cs.subjectIds,
        }));

        await api.put<Teacher>(API_ENDPOINTS.TEACHER(selectedTeacher._id), {
          subjectAssignments
        });

        toast({
          title: "Thành công",
          description: "Cập nhật phân công môn học thành công"
        });

        await fetchTeachers();
        setIsSubjectDialogOpen(false);
        setSelectedTeacher(null);
      }
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi cập nhật phân công môn học",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTeachingInfo = async (formData: TeacherFormData) => {
    try {
      if (selectedTeacher) {
        const teachingData = {
          school: formData.school,
          gradeLevels: formData.gradeLevels || [],
          classes: selectedClasses,
        };

        console.log('Updating teaching info:', teachingData);

        await api.put<Teacher>(API_ENDPOINTS.TEACHER(selectedTeacher._id), teachingData);

        toast({
          title: "Thành công",
          description: "Cập nhật phân công lớp thành công"
        });
        await fetchTeachers();
        setIsTeachingDialogOpen(false);
        setSelectedTeacher(null);
        setSelectedClasses([]);
      }
    } catch (error: unknown) {
      console.error('Error updating teaching info:', error);
      toast({
        title: "Lỗi", 
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi cập nhật phân công lớp",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Quản lý giáo viên</h1>
        {/* <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedTeacher(null)}>Thêm giáo viên mới</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTeacher ? "Cập nhật thông tin giáo viên" : "Thêm giáo viên mới"}</DialogTitle>
              <DialogDescription>Nhập thông tin giáo viên</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleCreateOrUpdateTeacher)} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullname">Họ và tên</Label>
                  <Input id="fullname" {...register("fullname")} />
                  {errors.fullname && <p className="text-red-500 text-sm">{errors.fullname.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" {...register("phone")} />
                  {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Chức danh</Label>
                  <Input id="jobTitle" {...register("jobTitle")} />
                  {errors.jobTitle && <p className="text-red-500 text-sm">{errors.jobTitle.message}</p>}
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">{selectedTeacher ? "Cập nhật" : "Thêm mới"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog> */}

        {/* Dialog phân công giảng dạy */}
        <Dialog open={isTeachingDialogOpen} onOpenChange={setIsTeachingDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Phân công lớp</DialogTitle>
              <DialogDescription>Cập nhật phân công lớp cho giáo viên {selectedTeacher?.fullname}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleUpdateTeachingInfo)} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="school">Trường</Label>
                  <Select
                    value={watch("school")}
                    onValueChange={(value) => setValue("school", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trường" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school._id} value={school._id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.school && <p className="text-red-500 text-sm">{errors.school.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Khối lớp phụ trách</Label>
                  <div className="grid gap-2">
                    {watch("school") ? (
                      gradeLevels.length > 0 ? (
                        gradeLevels.map((grade) => {
                          const selectedSchool = schools.find(s => s._id === watch("school"));
                          return (
                            <div key={grade._id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`grade-${grade._id}`}
                                checked={(watch("gradeLevels") || []).includes(grade._id)}
                                onCheckedChange={(checked) => {
                                  const currentGrades = watch("gradeLevels") || [];
                                  if (checked) {
                                    setValue("gradeLevels", [...currentGrades, grade._id]);
                                  } else {
                                    setValue("gradeLevels", currentGrades.filter(id => id !== grade._id));
                                  }
                                }}
                              />
                              <Label htmlFor={`grade-${grade._id}`}>
                                {getGradeLevelDisplay(grade.order, selectedSchool?.type || '')}
                              </Label>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-yellow-600 text-sm">Không có khối lớp nào cho trường này</p>
                      )
                    ) : (
                      <p className="text-yellow-600 text-sm">Vui lòng chọn trường trước khi chọn khối lớp</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Lớp phụ trách</Label>
                    <div className="grid gap-2">
                      {classesList && classesList.length > 0 ? (
                        classesList.map(cls => {
                          console.log('Rendering class item:', cls);
                          return (
                            <div key={cls._id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`cls-${cls._id}`}
                                checked={selectedClasses.includes(cls._id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedClasses([...selectedClasses, cls._id]);
                                  } else {
                                    setSelectedClasses(selectedClasses.filter(id => id !== cls._id));
                                  }
                                }}
                              />
                              <Label htmlFor={`cls-${cls._id}`}>
                                {`${cls.className}`}
                              </Label>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-yellow-600 text-sm">
                          {watch("gradeLevels")?.length ? "Không có lớp cho khối đã chọn" : "Vui lòng chọn khối lớp"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">Cập nhật</Button>
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
                <TableHead>Họ và tên</TableHead>
                <TableHead>Chức danh</TableHead>
                  <TableHead>Trường</TableHead>
                  <TableHead>Lớp - Môn</TableHead>
                  <TableHead>Chương trình học</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
              </TableHeader>
            <TableBody>
                {teachers && Array.isArray(teachers) && teachers.length > 0 ? (
                  teachers.map((teacher) => {
                    return (
                      <TableRow key={teacher._id}>
                        <TableCell className="font-medium">{teacher.user?.avatarUrl && (
                          <img
                            src={`${BASE_URL}${encodeURI(teacher.user.avatarUrl)}`}
                            alt={teacher.fullname}
                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }}
                          />
                        )}
                          {teacher.fullname}</TableCell>
                        <TableCell>{teacher.jobTitle || "N/A"}</TableCell>
                        <TableCell>{teacher.school?.name || "N/A"}</TableCell>

                        <TableCell className="whitespace-pre-line">
                          {teacher.teachingAssignments && teacher.teachingAssignments.length ? (
                            teacher.teachingAssignments.map((ta) => (
                              <div key={ta.class._id}>
                                {ta.class.className}: {ta.subjects.map((s) => s.name).join(", ")}
                              </div>
                            ))
                          ) : (
                            "Chưa phân công"
                          )}
                        </TableCell>
                        <TableCell>
                          {teacher.curriculums && Array.isArray(teacher.curriculums)
                            ? teacher.curriculums.map(c => c?.name).join(", ")
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setIsTeachingDialogOpen(true);
                              setValue("school", teacher.school?._id || "");
                              setValue("gradeLevels", teacher.gradeLevels?.map(g => g._id) || []);
                            }}
                          >
                            Phân công lớp
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!teacher.school?._id) {
                                toast({
                                  title: "Lỗi",
                                  description: "Vui lòng phân công lớp trước khi phân công môn học",
                                  variant: "destructive",
                                });
                                return;
                              }
                              setClassSubjects(
                                teacher.teachingAssignments?.map(ta => ({
                                  classId: ta.class._id,
                                  subjectIds: ta.subjects.map(s => s._id),
                                })) || []
                              );
                              setSelectedTeacher(teacher);
                              setIsSubjectDialogOpen(true);
                            }}
                          >
                            Phân công môn
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setIsDialogOpen(true);
                            }}
                          >
                            Cập nhật
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      Không có dữ liệu giáo viên
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Subject Assignment Dialog */}
      <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Phân công môn học</DialogTitle>
            <DialogDescription>
              Phân công môn học cho giáo viên {selectedTeacher?.fullname} tại trường {selectedTeacher?.school?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Danh sách lớp và môn học */}
            <div className="space-y-4">
              <Label>Phân công môn học cho các lớp</Label>
              {selectedTeacher?.classes && selectedTeacher.classes.length > 0 ? (
                selectedTeacher.classes.map((cls) => (
                  <div key={cls._id} className="space-y-2 border p-4 rounded-lg">
                    {/* tiêu đề gom lại thành một dòng */}
                    <div className="font-medium">Chọn môn học cho lớp {cls.className}</div>

                    <Combobox
                      multiple
                      options={availableSubjectsForClass[cls._id] || []}
                      selectedValues={
                        classSubjects.find((cs) => cs.classId === cls._id)?.subjectIds || []
                      }
                      onChange={(values: string[]) => {
                        setClassSubjects((prev) => {
                          const rest = prev.filter((cs) => cs.classId !== cls._id);
                          return [...rest, { classId: cls._id, subjectIds: values }];
                        });
                      }}
                      placeholder="Chọn môn học"
                      searchPlaceholder="Tìm kiếm môn học..."
                      emptyText="Không tìm thấy môn học"
                    />
                  </div>
                ))
              ) : (
                <p className="text-yellow-600">Vui lòng phân công lớp trước khi phân công môn học</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                onClick={handleUpdateSubjectAssignment}
                disabled={!selectedTeacher?.classes?.length || classSubjects.length === 0}
              >
                Cập nhật
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherComponent;

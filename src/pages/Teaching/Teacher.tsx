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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "../../hooks/use-toast";
import { api } from "../../lib/api";
import { API_ENDPOINTS, BASE_URL } from "../../lib/config";
import { Checkbox } from "../../components/ui/checkbox";
import { Combobox } from "../../components/ui/combobox";

// Import types từ folder types
import type { School, GradeLevel } from "../../types/school.types";
import type { Subject } from "../../types/curriculum.types";
import type { ComboboxOption } from "../../types/common.types";
import type { 
  GradeLevelWithSubjects,
  TeacherExtended as Teacher,
  TeachingClass as Class,
  ClassSubjectAssignment
} from "../../types/teaching.types";



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



const TeacherComponent: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
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

  // Reset form khi đóng dialog
  useEffect(() => {
    if (!isTeachingDialogOpen) {
      setSelectedTeacher(null);
      setSelectedClasses([]);
    }
  }, [isTeachingDialogOpen]);

  // Set form values khi dialog mở và có selectedTeacher
  useEffect(() => {
    if (isTeachingDialogOpen && selectedTeacher && schools.length > 0) {
      console.log('Setting form values via useEffect');
      console.log('Selected teacher school:', selectedTeacher.school);
      console.log('Available schools:', schools);
      
      const schoolId = selectedTeacher.school?._id || "";
      
      if (schoolId) {
        // Teacher có school data
        const schoolExists = schools.find(s => s._id === schoolId);
        if (schoolExists) {
          console.log('Setting teacher existing school:', schoolId);
          setValue("school", schoolId);
          setValue("gradeLevels", selectedTeacher.gradeLevels?.map(g => g._id) || []);
          setSelectedClasses(selectedTeacher?.classes?.map(c => c._id) || []);
        } else {
          console.log('Teacher school not found in available schools, leaving empty for manual selection');
          setValue("school", "");
          setValue("gradeLevels", []);
          setSelectedClasses([]);
        }
      } else {
        // Teacher không có school data - để trống để user chọn
        console.log('Teacher has no school assigned, leaving empty for manual selection');
        setValue("school", "");
        setValue("gradeLevels", []);
        setSelectedClasses([]);
      }
    }
  }, [isTeachingDialogOpen, selectedTeacher, schools, setValue]);

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
        setGradeLevels([]);
        return;
      }
      
      const response = await api.get(`${API_ENDPOINTS.GRADE_LEVELS}?school=${schoolId}`);
      console.log('Grade levels response:', response);
      
      let gradeLevelsData: GradeLevel[] = [];
      
      // Handle multiple possible response formats (same as other fetch functions)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = response as any;
      
      if (Array.isArray(responseData)) {
        // Direct array
        gradeLevelsData = responseData;
      } else if (responseData?.data) {
        if (Array.isArray(responseData.data)) {
          // { data: [...] }
          gradeLevelsData = responseData.data;
        } else if (responseData.data?.data && Array.isArray(responseData.data.data)) {
          // { data: { data: [...] } }
          gradeLevelsData = responseData.data.data;
        }
      }
      
      console.log('Extracted grade levels data:', gradeLevelsData);
      
      if (Array.isArray(gradeLevelsData)) {
        // Validate and sort grade levels
        const validGradeLevels = gradeLevelsData.filter(grade => 
          grade && 
          typeof grade === 'object' && 
          grade._id && 
          grade.name &&
          typeof grade.order === 'number'
        );
        
        const sortedLevels = validGradeLevels.sort((a, b) => a.order - b.order);
        console.log('Valid sorted grade levels:', sortedLevels);
        setGradeLevels(sortedLevels);
      } else {
        console.error('Grade levels data is not an array:', gradeLevelsData);
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
      console.log('Teachers response:', response);
      
      let teachersData: Teacher[] = [];
      
      // Sử dụng type assertion an toàn
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = response as any;
      
      if (Array.isArray(responseData)) {
        teachersData = responseData;
      } else if (responseData?.data) {
        if (Array.isArray(responseData.data)) {
          teachersData = responseData.data;
        } else if (responseData.data?.data && Array.isArray(responseData.data.data)) {
          teachersData = responseData.data.data;
        }
      }
      
      // Lọc và kiểm tra dữ liệu
      const validTeachers = Array.isArray(teachersData) ? teachersData.filter(teacher => {
        const isValid = teacher &&
          typeof teacher === 'object' &&
          teacher._id &&
          teacher.fullname;   
        return isValid;
      }) : [];
      
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
      const response = await api.get<Subject[]>(API_ENDPOINTS.SUBJECTS);
      console.log('Subjects response:', response);
      
      let subjectsData: Subject[] = [];
      
      // Sử dụng type assertion an toàn
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = response as any;
      
      if (Array.isArray(responseData)) {
        subjectsData = responseData;
      } else if (responseData?.data) {
        if (Array.isArray(responseData.data)) {
          subjectsData = responseData.data;
        } else if (responseData.data?.data && Array.isArray(responseData.data.data)) {
          subjectsData = responseData.data.data;
        }
      }
      
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
    } catch (error: unknown) {
      console.error('Error fetching subjects:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi tải danh sách môn học",
        variant: "destructive"
      });
      setSubjects([]);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SCHOOLS);
      console.log('Schools response:', response);
      
      let schoolsData: School[] = [];
      
      // Handle multiple possible response formats
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = response as any;
      
      if (Array.isArray(responseData)) {
        // Direct array
        schoolsData = responseData;
      } else if (responseData?.data) {
        if (Array.isArray(responseData.data)) {
          // { data: [...] }
          schoolsData = responseData.data;
        } else if (responseData.data?.data && Array.isArray(responseData.data.data)) {
          // { data: { data: [...] } }
          schoolsData = responseData.data.data;
        }
      }
      
      console.log('Extracted schools data:', schoolsData);
      console.log('Is schools data an array?', Array.isArray(schoolsData));
      
      if (Array.isArray(schoolsData)) {
        // Đảm bảo mỗi school có đủ properties cần thiết và không có value rỗng
        const validSchools = schoolsData.filter(school => {
          const isValid = school && 
            typeof school === 'object' && 
            school._id && 
            school._id.trim() !== '' &&
            school.name && 
            school.name.trim() !== '';
          
          if (!isValid) {
            console.warn('Invalid school filtered out:', school);
          }
          return isValid;
        });
        
        console.log('Valid schools count:', validSchools.length);
        console.log('Valid schools:', validSchools);
        setSchools(validSchools);
      } else {
        console.error('Schools data is not an array:', schoolsData);
        console.error('Type of schools data:', typeof schoolsData);
        setSchools([]);
      }
    } catch (error: unknown) {
      console.error('Error fetching schools:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi tải danh sách trường học",
        variant: "destructive"
      });
      setSchools([]);
    }
  };

  const fetchClassesForGradeLevels = async (gradeIds: string[]) => {
    try {
      if (!gradeIds.length) {
        setClassesList([]);
        return;
      }
      
      const response = await api.get(
        `${API_ENDPOINTS.CLASSES}?gradeLevels=${gradeIds.join(",")}`
      );
      console.log('Classes response:', response);
      
      let classesData: Class[] = [];
      
      // Handle multiple possible response formats
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = response as any;
      
      if (Array.isArray(responseData)) {
        // Direct array
        classesData = responseData;
      } else if (responseData?.data) {
        if (Array.isArray(responseData.data)) {
          // { data: [...] }
          classesData = responseData.data;
        } else if (responseData.data?.data && Array.isArray(responseData.data.data)) {
          // { data: { data: [...] } }
          classesData = responseData.data.data;
        }
      }
      
      console.log('Extracted classes data:', classesData);
      
      if (Array.isArray(classesData)) {
        // Validate and process classes
        const validClasses = classesData.filter(cls => 
          cls && 
          typeof cls === 'object' && 
          cls._id && 
          cls.className &&
          cls.gradeLevel
        );
        
        const processedClasses = validClasses.map(cls => ({
          _id: cls._id,
          className: cls.className,
          gradeLevel: {
            _id: cls.gradeLevel._id,
            name: cls.gradeLevel.name,
            code: cls.gradeLevel.code,
            order: cls.gradeLevel.order
          }
        }));
        
        console.log('Valid processed classes:', processedClasses);
        setClassesList(processedClasses);
      } else {
        console.error('Classes data is not an array:', classesData);
        setClassesList([]);
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
        ) as GradeLevelWithSubjects | undefined;

        if (grade && Array.isArray(grade.subjects)) {
          updated[cls._id] = grade.subjects.map((sub: string | { _id: string; name: string }) => {
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

  const handleUpdateTeachingInfo = async (formData: z.infer<typeof schema>) => {
    try {
      if (selectedTeacher) {
        const teachingData = {
          school: formData.school,
          gradeLevels: formData.gradeLevels || [],
          classes: selectedClasses,
        };
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
    <div className="space-y-6 bg-white p-6 rounded-2xl shadow-md">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Quản lý giáo viên</h1>
        {/* Dialog phân công giảng dạy */}
        <Dialog open={isTeachingDialogOpen} onOpenChange={setIsTeachingDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Phân công lớp</DialogTitle>
              <DialogDescription>
                Cập nhật phân công lớp cho giáo viên {selectedTeacher?.fullname}
                {!selectedTeacher?.school && (
                  <span className="block text-orange-600 mt-1">
                    ⚠️ Giáo viên chưa được phân công trường. Vui lòng chọn trường bên dưới.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleUpdateTeachingInfo)} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="school">Trường</Label>
                  <Select
                    value={watch("school") || ""}
                    onValueChange={(value) => {
                      setValue("school", value);
                      // Reset các lớp đã chọn khi đổi trường
                      setSelectedClasses([]);
                      setValue("gradeLevels", []);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedTeacher?.school ? "Đang tải..." : "Chọn trường cho giáo viên"} />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.length > 0 ? (
                        schools.map((school) => {
                          // Đảm bảo không có value rỗng
                          const value = school._id?.trim() || `school-${Math.random()}`;
                          const label = school.name?.trim() || "Trường không tên";
                          
                          return (
                            <SelectItem key={school._id} value={value}>
                              {label}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="no-schools" disabled>
                          Không có trường nào
                        </SelectItem>
                      )}
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
                            src={`${BASE_URL}/uploads/Avatar/${encodeURI(teacher.user.avatarUrl)}`}
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
                            size="sm"
                            onClick={() => {
                              console.log('Button clicked - Opening dialog for teacher:', teacher.fullname);
                              setSelectedTeacher(teacher);
                              setIsTeachingDialogOpen(true);
                            }}
                          >
                            Phân công lớp
                          </Button>
                          <Button
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

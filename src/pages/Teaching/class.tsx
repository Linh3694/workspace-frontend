import React, { useEffect, useState } from 'react';
import type { Class } from '../../types/class.types';
import type { SchoolYear, EducationalSystem, GradeLevel } from '../../types/school.types';
import type { Teacher, Student } from '../../types/user.types';
import type { ComboboxOption } from '../../types/common.types';
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
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Pagination,
  PaginationContent, 
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../components/ui/pagination";
import { useToast } from "../../hooks/use-toast";
import { api } from "../../lib/api";
import { API_ENDPOINTS, BASE_URL } from "../../lib/config";

// Import dialog components
import ClassFormDialog from './Dialog/ClassFormDialog';
import ImageUploadDialog from './Dialog/ImageUploadDialog';
import ImageTypeSelectDialog from './Dialog/ImageTypeSelectDialog'; 
import EnrollStudentsDialog from './Dialog/EnrollStudentsDialog';
import DeleteClassDialog from './Dialog/DeleteClassDialog';

const ClassComponent: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [systems, setSystems] = useState<EducationalSystem[]>([]);
  const [teachers, setTeachers] = useState<ComboboxOption[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>("");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Dialog states
  const [isClassFormDialogOpen, setIsClassFormDialogOpen] = useState(false);
  const [isImageUploadDialogOpen, setIsImageUploadDialogOpen] = useState(false);
  const [isSelectImageTypeDialogOpen, setIsSelectImageTypeDialogOpen] = useState(false);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [imageUploadType, setImageUploadType] = useState<'class' | 'student' | ''>('');

  // For enrollment dialog: list of all students
  const [studentsOptions, setStudentsOptions] = useState<ComboboxOption[]>([]);

  // Fetch students for the enroll combobox
  const fetchStudentsOptions = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.STUDENTS);
      let studentsData: Student[] = [];

      if (Array.isArray(response)) {
        studentsData = response;
      } else if (response && Array.isArray(response.data)) {
        studentsData = response.data;
      } else if (response && response.data && Array.isArray(response.data.data)) {
        studentsData = response.data.data;
      } else {
        console.error('Unexpected students response format:', response);
      }

      const options = studentsData.map((s) => ({
        value: s._id,
        label: `${s.studentCode} - ${s.name}`
      }));
      setStudentsOptions(options);
    } catch (err) {
      console.error('Error fetching students for enrollment:', err);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách học sinh",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchStudentsOptions();
  }, []);

  useEffect(() => {
    fetchSchoolYears();
    fetchSystems();
    fetchTeachers();
    fetchGradeLevels();
  }, []);

  useEffect(() => {
    if (selectedSchoolYear) {
      fetchClasses();
      setCurrentPage(1); // Reset to first page when school year changes
    }
  }, [selectedSchoolYear]);

  const fetchSchoolYears = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SCHOOL_YEARS);

      let schoolYearsData;
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          schoolYearsData = response;
        } else if (response.data && Array.isArray(response.data)) {
          schoolYearsData = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          schoolYearsData = response.data.data;
        } else {
          console.error('School years data is not an array:', response);
          schoolYearsData = [];
        }
      } else {
        console.error('Invalid response from API:', response);
        schoolYearsData = [];
      }
      setSchoolYears(schoolYearsData);
      
      if (schoolYearsData.length > 0) {
        setSelectedSchoolYear(schoolYearsData[0]._id);
      }
    } catch (error: unknown) {
      console.error('Error fetching school years:', error);
      setSchoolYears([]);
      toast({ title: "Lỗi", description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải danh sách năm học', variant: "destructive" });
    }
  };

  const fetchSystems = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EDUCATIONAL_SYSTEMS);

      let systemsData;
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          systemsData = response;
        } else if (response.data && Array.isArray(response.data)) {
          systemsData = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          systemsData = response.data.data;
        } else {
          console.error('Educational systems data is not an array:', response);
          systemsData = [];
        }
      } else {
        console.error('Invalid response from API:', response);
        systemsData = [];
      }
      
      setSystems(systemsData);
    } catch (error: unknown) {
      setSystems([]);
      toast({ title: "Lỗi", description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải hệ học', variant: "destructive" });
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.TEACHERS);

      let teachersData = [];
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          teachersData = response;
        } else if (response.data && Array.isArray(response.data)) {
          teachersData = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          teachersData = response.data.data;
        } else {
          console.error('Teachers data is not an array:', response);
        }
      } else {
        console.error('Invalid response from API:', response);
      }
      
      const formattedTeachers = teachersData.map((teacher: Teacher) => ({
        value: teacher._id,
        label: teacher.user?.fullname || teacher.fullname
      }));
      
      setTeachers(formattedTeachers);
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải danh sách giáo viên',
        variant: "destructive"
      });
      setTeachers([]);
    }
  };

  const fetchGradeLevels = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.GRADE_LEVELS);

      let gradeLevelsData;
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          gradeLevelsData = response;
        } else if (response.data && Array.isArray(response.data)) {
          gradeLevelsData = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          gradeLevelsData = response.data.data;
        } else {
          console.error('Grade levels data is not an array:', response);
          gradeLevelsData = [];
        }
      } else {
        console.error('Invalid response from API:', response);
        gradeLevelsData = [];
      }
      
      setGradeLevels(gradeLevelsData);
    } catch (error: unknown) {
      setGradeLevels([]);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải danh sách khối lớp',
        variant: "destructive"
      });
    }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `${API_ENDPOINTS.CLASSES}${selectedSchoolYear ? `?schoolYear=${selectedSchoolYear}` : ''}`,
        {
          params: {
            populate: [
              'schoolYear',
              'educationalSystem',
              'curriculum',
              'gradeLevel',
              'homeroomTeachers',
              'homeroomTeachers.user',
              'students'
            ].join(',')
          }
        }
      );

      let classesData;
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          classesData = response;
        } else if (response.data && Array.isArray(response.data)) {
          classesData = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          classesData = response.data.data;
        } else {
          console.error('Classes data is not an array:', response);
          classesData = [];
        }
      } else {
        console.error('Invalid response from API:', response);
        classesData = [];
      }
      
      setClasses(classesData);
    } catch (error: unknown) {
      console.error('Error fetching classes:', error);
      setClasses([]);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tải danh sách lớp học",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handler functions for dialogs
  const handleClassFormSuccess = async () => {
    await fetchClasses();
    setSelectedClass(null);
  };

  const handleImageUploadSuccess = async () => {
    await fetchClasses();
    await fetchStudentsOptions();
  };

  const handleEnrollSuccess = async () => {
    await fetchClasses();
  };

  const handleDeleteSuccess = async () => {
    await fetchClasses();
    setSelectedClass(null);
  };

  const handleSelectImageType = (type: 'class' | 'student') => {
    setImageUploadType(type);
    setIsImageUploadDialogOpen(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  // Get classes options for combobox
  const classesOptions = classes.map((cls) => ({
    value: cls._id,
    label: cls.className
  }));

  // Pagination calculations
  const totalPages = Math.ceil(classes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClasses = classes.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl shadow-md">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Quản lý lớp học</h1>
        <div className="flex items-center space-x-2">
          <div>
            <Select
              value={selectedSchoolYear}
              onValueChange={setSelectedSchoolYear}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn năm học" />
              </SelectTrigger>
              <SelectContent>
                {schoolYears.map((year) => (
                  <SelectItem key={year._id} value={year._id}>
                    {year.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-[300px]">
            <Input
              type="text"
              placeholder="Tìm kiếm lớp học..."
              className="pl-8"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <Dialog open={isClassFormDialogOpen} onOpenChange={setIsClassFormDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedClass(null)}>Tạo lớp</Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={isSelectImageTypeDialogOpen} onOpenChange={setIsSelectImageTypeDialogOpen}>
            <DialogTrigger asChild>
              <Button>Cập nhật ảnh</Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
            <DialogTrigger asChild>
              <Button>Ghép lớp</Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Dialog components */}
      <ClassFormDialog
        isOpen={isClassFormDialogOpen}
        onClose={() => setIsClassFormDialogOpen(false)}
        selectedClass={selectedClass}
        selectedSchoolYear={selectedSchoolYear}
        schoolYears={schoolYears}
        systems={systems}
        gradeLevels={gradeLevels}
        teachers={teachers}
        onSuccess={handleClassFormSuccess}
        onDelete={handleDeleteClick}
        loading={loading}
      />

      <ImageTypeSelectDialog
        isOpen={isSelectImageTypeDialogOpen}
        onClose={() => setIsSelectImageTypeDialogOpen(false)}
        onSelectType={handleSelectImageType}
      />

      <ImageUploadDialog
        isOpen={isImageUploadDialogOpen}
        onClose={() => setIsImageUploadDialogOpen(false)}
        imageUploadType={imageUploadType}
        schoolYears={schoolYears}
        classesOptions={classesOptions}
        studentsOptions={studentsOptions}
        selectedSchoolYear={selectedSchoolYear}
        onSchoolYearChange={setSelectedSchoolYear}
        onSuccess={handleImageUploadSuccess}
      />

      <EnrollStudentsDialog
        isOpen={isEnrollDialogOpen}
        onClose={() => setIsEnrollDialogOpen(false)}
        schoolYears={schoolYears}
        classes={classes}
        studentsOptions={studentsOptions}
        onSuccess={handleEnrollSuccess}
      />

      <DeleteClassDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        selectedClass={selectedClass}
        onSuccess={handleDeleteSuccess}
      />

      {selectedSchoolYear ? (
        <div className="rounded-lg">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên lớp</TableHead>
                  <TableHead>Năm học</TableHead>
                  <TableHead>Hệ học</TableHead>
                  <TableHead>Khối lớp</TableHead>
                  <TableHead>Giáo viên chủ nhiệm</TableHead>
                  <TableHead>Sĩ số</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {paginatedClasses && paginatedClasses.length > 0 ? (
                    paginatedClasses.map((cls) => (
                      <TableRow key={cls._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {cls.classImage ? (
                              <img 
                                src={`${BASE_URL}/${cls.classImage}`} 
                                alt={`Ảnh lớp ${cls.className}`}
                                className="w-8 h-6 object-cover rounded border border-gray-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-8 h-6 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                <svg 
                                  className="w-3 h-3 text-gray-400" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                                  />
                                </svg>
                              </div>
                            )}
                            <span>{cls.className}</span>
                          </div>
                        </TableCell>
                        <TableCell>{cls.schoolYear?.code || "N/A"}</TableCell>
                        <TableCell>{cls.educationalSystem?.name || "N/A"}</TableCell>
                        <TableCell>{cls.gradeLevel?.name || "N/A"}</TableCell>
                        <TableCell>
                          {cls.homeroomTeachers && cls.homeroomTeachers.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {cls.homeroomTeachers.map((teacher) => (
                                <span key={teacher._id} className="text-sm">
                                  {teacher.user?.fullname || teacher.fullname}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500 italic">Chưa phân công</span>
                          )}
                        </TableCell>
                        <TableCell>{cls.students ? cls.students.length : 0}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm">
                            Chi tiết
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (cls) {
                                setSelectedClass(cls);
                                setIsClassFormDialogOpen(true);
                              } else {
                                console.error('No class data available');
                                toast({
                                  title: "Lỗi",
                                  description: "Không thể tải thông tin lớp học",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            Cập nhật
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        Không có dữ liệu lớp học
                      </TableCell>
                    </TableRow>
                  )}
              </TableBody>
            </Table>
          )}
          
          {/* Pagination */}
          {!loading && classes.length > 0 && (
            <div className="flex flex-col items-center mt-6 space-y-4">
              {totalPages > 1 && (
                <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={handlePreviousPage}
                      className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={handleNextPage}
                      className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Vui lòng chọn năm học để xem danh sách lớp
        </div>
      )}
    </div>
  );
};

export default ClassComponent;
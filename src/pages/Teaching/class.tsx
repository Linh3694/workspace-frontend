import React, { useEffect, useState, useRef } from 'react';

import * as XLSX from 'xlsx';
import type { Class } from '../../types/class.types';
import type { SchoolYear, EducationalSystem, GradeLevel } from '../../types/school.types';
import type { Teacher, Student } from '../../types/user.types';
import type { ComboboxOption } from '../../types/common.types';
import type { ExcelRow } from '../../types/import.types';
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
import { Combobox } from "../../components/ui/combobox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "../../hooks/use-toast";
import { api } from "../../lib/api";
import { API_ENDPOINTS, BASE_URL } from "../../lib/config";
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

const schema = z.object({
  className: z.string().min(1, "Tên lớp là bắt buộc"),
  schoolYear: z.string().min(1, "Năm học là bắt buộc"),
  educationalSystem: z.string().min(1, "Hệ học là bắt buộc"),
  gradeLevel: z.string().min(1, "Khối lớp là bắt buộc"),
  homeroomTeachers: z.array(z.string()).optional(),
});

type ClassFormData = z.infer<typeof schema>;

const ClassComponent: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [systems, setSystems] = useState<EducationalSystem[]>([]);
  const [teachers, setTeachers] = useState<ComboboxOption[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>("");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [isUpdateImageDialogOpen, setIsUpdateImageDialogOpen] = useState(false);
  const [isSelectImageTypeDialogOpen, setIsSelectImageTypeDialogOpen] = useState(false);
  const [imageUploadType, setImageUploadType] = useState<'class' | 'student' | ''>('');

  // Enrollment form state
  const [enrollSchoolYear, setEnrollSchoolYear] = useState<string>("");
  const [enrollClassId, setEnrollClassId] = useState<string>("");
  // Filter classes for manual enroll based on selected school year
  const enrollClassesOptions = classes.filter(c => c.schoolYear._id === enrollSchoolYear);

  // For enrollment dialog: list of all students
  const [studentsOptions, setStudentsOptions] = useState<ComboboxOption[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // For update image dialog
  const [updateImageClassId, setUpdateImageClassId] = useState<string>("");
  const [updateImageStudentId, setUpdateImageStudentId] = useState<string>("");
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const zipFileInputRef = useRef<HTMLInputElement>(null);
  // Thêm state cho image preview
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  // Thêm state cho ZIP upload bulk
  const [selectedZipFile, setSelectedZipFile] = useState<File | null>(null);
  const [uploadingZip, setUploadingZip] = useState<boolean>(false);

  // Thêm state cho enroll Excel
  const [enrollExcelFile, setEnrollExcelFile] = useState<File | null>(null);
  const [uploadingEnrollExcel, setUploadingEnrollExcel] = useState<boolean>(false);
  const enrollExcelFileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup image preview URL when component unmounts hoặc file thay đổi
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Handle image file selection
  const handleImageFileSelect = (file: File) => {
    setSelectedImageFile(file);
    
    // Cleanup previous URL
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    
    // Create new preview URL
    const newPreviewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(newPreviewUrl);
  };

  // Clear selected image
  const clearSelectedImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    if (imageFileInputRef.current) {
      imageFileInputRef.current.value = '';
    }
  };

  // Handle ZIP file selection
  const handleZipFileSelect = (file: File) => {
    setSelectedZipFile(file);
  };

  // Clear selected ZIP
  const clearSelectedZip = () => {
    setSelectedZipFile(null);
    if (zipFileInputRef.current) {
      zipFileInputRef.current.value = '';
    }
  };

  // Handle bulk upload ZIP
  const handleUploadZip = async () => {
    if (!selectedZipFile) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file ZIP",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingZip(true);
      
      const formData = new FormData();
      formData.append('zipFile', selectedZipFile);
      
      // Gọi API upload ZIP
      await api.post(`${API_ENDPOINTS.CLASSES}/bulk-upload-images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: "Thành công",
        description: "Upload ZIP ảnh thành công",
      });

      // Clear form
      clearSelectedZip();
      
    } catch (error: unknown) {
      console.error('ZIP Upload error:', error);
      const axiosError = error as { response?: { data: unknown } };
      let message = "Không thể upload ZIP. Vui lòng thử lại.";
      
      if (axiosError.response && axiosError.response.data) {
        const respData = axiosError.response.data;
        if (typeof respData === 'string') {
          message = respData;
        } else if (typeof respData === 'object' && respData !== null) {
          const obj = respData as { message?: string; error?: string };
          message = obj.message || obj.error || message;
        }
      }
      
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive"
      });
    } finally {
      setUploadingZip(false);
    }
  };

  // Handle upload image
  const handleUploadImage = async () => {
    if (!selectedImageFile) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file ảnh",
        variant: "destructive"
      });
      return;
    }

    // Validate required fields based on image type
    if (imageUploadType === 'class' && !updateImageClassId) {
      toast({
        title: "Lỗi", 
        description: "Vui lòng chọn lớp",
        variant: "destructive"
      });
      return;
    }

    if (imageUploadType === 'student' && !updateImageStudentId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn học sinh", 
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingImage(true);
      
      if (imageUploadType === 'student') {
        // Upload ảnh học sinh - sử dụng PUT /students/:id với field 'avatar'
        const formData = new FormData();
        formData.append('avatar', selectedImageFile);
        formData.append('data', JSON.stringify({})); // Data trống vì chỉ cập nhật avatar

        await api.put(API_ENDPOINTS.STUDENT(updateImageStudentId), formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        toast({
          title: "Thành công",
          description: "Upload ảnh học sinh thành công",
        });

        // Clear form and close dialog
        clearSelectedImage();
        setIsUpdateImageDialogOpen(false);
        setImageUploadType('');
        setUpdateImageClassId('');
        setUpdateImageStudentId('');

        // Refresh students data để hiển thị ảnh mới
        fetchStudentsOptions();
      } else {
        // Upload ảnh lớp - sử dụng PUT /classes/:id/upload-image với field 'classImage'
        const formData = new FormData();
        formData.append('classImage', selectedImageFile);

        await api.post(`${API_ENDPOINTS.CLASSES}/${updateImageClassId}/upload-image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        toast({
          title: "Thành công",
          description: "Upload ảnh lớp thành công",
        });

        // Clear form and close dialog
        clearSelectedImage();
        setIsUpdateImageDialogOpen(false);
        setImageUploadType('');
        setUpdateImageClassId('');
        setUpdateImageStudentId('');

        // Refresh classes data để hiển thị ảnh mới
        fetchClasses();
      }

    } catch (error: unknown) {
      console.error('Upload error:', error);
      const axiosError = error as { response?: { data: unknown } };
      let message = "Không thể upload ảnh. Vui lòng thử lại.";
      
      if (axiosError.response && axiosError.response.data) {
        const respData = axiosError.response.data;
        if (typeof respData === 'string') {
          message = respData;
        } else if (typeof respData === 'object' && respData !== null) {
          const obj = respData as { message?: string; error?: string };
          message = obj.message || obj.error || message;
        }
      }
      
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

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
      console.log('Fetched studentsOptions:', options);
      console.log('Sample student option:', options[0]); // Debug thêm để kiểm tra format
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateOrImport = async () => {
    // Kiểm tra xem có file được chọn không
    const file = fileInputRef.current?.files?.[0];
    
    if (file) {
      // Nếu có file, thực hiện import Excel
      await handleImportClasses();
    } else {
      // Nếu không có file, thực hiện tạo/cập nhật lớp thông thường
      handleSubmit(handleCreateOrUpdateClass)();
    }
  };

  const handleImportClasses = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: '' });

    const valid: ExcelRow[] = [];
    const errors: string[] = [];

    for (const [idx, r] of raw.entries()) {
      const rowNum = idx + 2; // header ở dòng 1
      const missing: string[] = [];
      if (!r.ClassName) missing.push('ClassName');
      if (!r.SchoolYearCode) missing.push('SchoolYearCode');
      if (!r.EducationalSystemName) missing.push('EducationalSystemName');
      if (!r.GradeLevelCode) missing.push('GradeLevelCode');

      if (missing.length) {
        errors.push(`Dòng ${rowNum}: thiếu ${missing.join(', ')}`);
      } else {
        valid.push(r);
      }
    }

    if (errors.length) {
      toast({
        title: 'Lỗi dữ liệu Excel',
        description: errors.join('; '),
        variant: 'destructive'
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      toast({ title: 'Đang nhập lớp từ Excel...', variant: 'default' });
      await api.post(`${API_ENDPOINTS.CLASSES}/bulk-upload`, valid);
      toast({ title: 'Thành công', description: 'Nhập lớp thành công' });
      fetchClasses();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data: unknown } };
      let message: string = 'Đã xảy ra lỗi';
      if (axiosError.response && axiosError.response.data) {
        const respData = axiosError.response.data;
        if (typeof respData === 'string') {
          try {
            const parsed = JSON.parse(respData);
            message = parsed.message || parsed.error || respData;
          } catch {
            message = respData;
          }
        } else if (typeof respData === 'object' && respData !== null) {
          const obj = respData as { message?: string; error?: string };
          message = obj.message || obj.error || (error instanceof Error ? error.message : message);
        }
      }
      toast({ title: "Lỗi", description: message, variant: "destructive" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      className: "",
      schoolYear: "",
      educationalSystem: "",
      gradeLevel: "",
      homeroomTeachers: [],
    },
  });

  useEffect(() => {
    fetchSchoolYears();
    fetchSystems();
    fetchTeachers();
    fetchGradeLevels();
  }, []);

  useEffect(() => {
    if (selectedSchoolYear) {
      fetchClasses();
    }
  }, [selectedSchoolYear]);

  useEffect(() => {
    console.log('Selected class changed:', selectedClass);
    if (selectedClass) {
      setValue("className", selectedClass.className || "");
      setValue("schoolYear", selectedClass.schoolYear?._id || "");
      setValue("educationalSystem", selectedClass.educationalSystem?._id || "");
      setValue("gradeLevel", selectedClass.gradeLevel?._id || "");
      const teacherIds = selectedClass.homeroomTeachers?.filter(t => t && t._id).map(t => t._id) || [];
      setValue("homeroomTeachers", teacherIds);
    } else {
      reset({
        className: "",
        schoolYear: selectedSchoolYear || "",
        educationalSystem: "",
        gradeLevel: "",
        homeroomTeachers: []
      });
    }
  }, [selectedClass, setValue, reset, selectedSchoolYear]);


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
      
      console.log('Processed school years data:', schoolYearsData);
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
      
      console.log('Fetched classes data:', classesData);
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

  const handleCreateOrUpdateClass = async (formData: ClassFormData) => {
    try {
      console.log('Creating/Updating class with data:', formData);

      if (selectedClass) {
        await api.put<Class>(API_ENDPOINTS.CLASS(selectedClass._id), formData);
        toast({
          title: "Thành công",
          description: "Cập nhật lớp học thành công"
        });
      } else {
        await api.post<Class>(API_ENDPOINTS.CLASSES, formData);
        toast({
          title: "Thành công",
          description: "Thêm lớp học thành công"
        });
      }

      await fetchClasses();
      setIsDialogOpen(false);
      setSelectedClass(null);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data: unknown } };
      let message: string = 'Đã xảy ra lỗi';
      if (axiosError.response && axiosError.response.data) {
        const respData = axiosError.response.data;
        if (typeof respData === 'string') {
          try {
            const parsed = JSON.parse(respData);
            message = parsed.message || parsed.error || respData;
          } catch {
            message = respData;
          }
        } else if (typeof respData === 'object' && respData !== null) {
          const obj = respData as { message?: string; error?: string };
          message = obj.message || obj.error || (error instanceof Error ? error.message : message);
        }
      }
      toast({ title: "Lỗi", description: message, variant: "destructive" });
    }
  };

  const handleDeleteClass = async () => {
    try {
      if (!selectedClass) return;
      await api.delete(API_ENDPOINTS.CLASS(selectedClass._id));
      toast({
        title: "Thành công",
        description: "Xóa lớp học thành công"
      });
      await fetchClasses();
      setIsDialogOpen(false);
      setSelectedClass(null);
      setIsDeleteDialogOpen(false);
    } catch (error: unknown) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: "destructive"
      });
    }
  };

  const handleEnrollManual = async () => {
    if (!enrollSchoolYear || !enrollClassId || selectedStudentIds.length === 0) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn năm học, lớp và ít nhất một học sinh",
        variant: "destructive",
      });
      return;
    }
    try {
      // Gửi đồng thời nhiều request
      await Promise.all(
        selectedStudentIds.map((stuId) =>
          api.post(API_ENDPOINTS.ENROLLMENTS, {
            student: stuId,
            class: enrollClassId,
            schoolYear: enrollSchoolYear,
          })
        )
      );
      toast({
        title: "Thành công",
        description: `Đã thêm ${selectedStudentIds.length} học sinh vào lớp`,
      });
      // Xóa lựa chọn cũ
      setSelectedStudentIds([]);
    } catch (err: unknown) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể thêm học sinh",
        variant: "destructive",
      });
    }
  };

  // Handle enroll Excel file
  const handleEnrollExcel = async () => {
    if (!enrollExcelFile) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file Excel",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingEnrollExcel(true);
      
      const data = await enrollExcelFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const enrollments = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      // Validate và gửi API
      await api.post(`${API_ENDPOINTS.ENROLLMENTS}/bulk-import`, {
        enrollments,
        schoolYear: enrollSchoolYear
      });

      toast({
        title: "Thành công",
        description: "Import enrollment từ Excel thành công",
      });

      // Clear file
      setEnrollExcelFile(null);
      if (enrollExcelFileInputRef.current) {
        enrollExcelFileInputRef.current.value = '';
      }
      
    } catch (error: unknown) {
      console.error('Enroll Excel error:', error);
      const axiosError = error as { response?: { data: unknown } };
      let message = "Không thể import enrollment. Vui lòng thử lại.";
      
      if (axiosError.response && axiosError.response.data) {
        const respData = axiosError.response.data;
        if (typeof respData === 'string') {
          message = respData;
        } else if (typeof respData === 'object' && respData !== null) {
          const obj = respData as { message?: string; error?: string };
          message = obj.message || obj.error || message;
        }
      }
      
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive"
      });
    } finally {
      setUploadingEnrollExcel(false);
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedClass(null)}>Tạo lớp</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedClass ? "Cập nhật lớp học" : "Tạo lớp học mới"}</DialogTitle>
                <DialogDescription>Nhập thông tin lớp học hoặc import từ file Excel</DialogDescription>
              </DialogHeader>
              
              {/* Phần thêm lớp mới */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">1. Tạo lớp thủ công</h3>
                <form onSubmit={handleSubmit(handleCreateOrUpdateClass)} className="space-y-4">
                  {/* Hàng 1: Tên lớp và Khối lớp */}
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="className">Tên lớp</Label>
                      <Input id="className" {...register("className")} />
                      {errors.className && <p className="text-red-500 text-sm">{errors.className.message}</p>}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="gradeLevel">Khối lớp</Label>
                      <Select
                        value={watch("gradeLevel")}
                        onValueChange={(value) => setValue("gradeLevel", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn khối lớp" />
                        </SelectTrigger>
                        <SelectContent>
                          {gradeLevels.map((level) => (
                            <SelectItem key={level._id} value={level._id}>
                              {level.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.gradeLevel && <p className="text-red-500 text-sm">{errors.gradeLevel.message}</p>}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="schoolYear">Năm học</Label>
                      <Select
                        value={watch("schoolYear")}
                        onValueChange={(value) => setValue("schoolYear", value)}
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
                      {errors.schoolYear && <p className="text-red-500 text-sm">{errors.schoolYear.message}</p>}
                    </div>

                    <div className="flex-1 space-y-2">
                      <Label htmlFor="educationalSystem">Hệ học</Label>
                      <Select
                        value={watch("educationalSystem")}
                        onValueChange={(value) => {
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
                  </div>

                  {/* Hàng 3: Giáo viên chủ nhiệm */}
                  <div className="space-y-4">
                    <Label>Giáo viên chủ nhiệm</Label>
                    <div className="space-y-2">
                      <Combobox
                        multiple
                        selectedValues={watch("homeroomTeachers")}
                        onChange={(values) => setValue("homeroomTeachers", values)}
                        options={teachers}
                        placeholder="Chọn giáo viên chủ nhiệm"
                        emptyText="Không có giáo viên"
                        className="w-full"
                      />
                    </div>

                    {(watch("homeroomTeachers") || []).length > 0 && (
                      <div className="space-y-2">
                        {(watch("homeroomTeachers") || []).map((teacherId: string) => {
                          const teacher = teachers.find(t => t.value === teacherId);
                          if (!teacher) return null;

                          return (
                            <div
                              key={teacherId}
                              className="flex items-center justify-between p-2 rounded-md border bg-gray-50"
                            >
                              <span className="text-sm font-medium">{teacher.label}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                onClick={() => {
                                  const currentTeachers = watch("homeroomTeachers") || [];
                                  setValue(
                                    "homeroomTeachers",
                                    currentTeachers.filter(id => id !== teacherId)
                                  );
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </form>
              </div>
              {/* Đường kẻ phân cách */}
              <hr className="my-6" />
              {/* Phần Import Excel */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">2. Import từ file Excel</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="class-file" className="text-right">File Excel</Label>
                    <Input
                      id="class-file"
                      type="file"
                      accept=".xlsx,.xls"
                      ref={fileInputRef}
                      onChange={() => {
                        // Không tự động import, chỉ lưu file được chọn
                      }}
                      className="col-span-3"
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">File Mẫu</Label>
                    <Button variant="outline" asChild>
                      <a href="/Template/class-example.xlsx" download>
                        Tải file mẫu
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <div className="flex justify-end space-x-2">
                  {selectedClass && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      Xóa
                    </Button>
                  )}
                  <Button 
                    type="button" 
                    onClick={handleCreateOrImport}
                    disabled={loading}
                  >
                    {selectedClass ? "Cập nhật" : "Thêm mới"}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isSelectImageTypeDialogOpen} onOpenChange={setIsSelectImageTypeDialogOpen}>
            <DialogTrigger asChild>
              <Button>Cập nhật ảnh</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Chọn loại cập nhật ảnh</DialogTitle>
                <DialogDescription>
                  Chọn bạn muốn cập nhật ảnh cho lớp hay học sinh
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center space-y-2"
                    onClick={() => {
                      setImageUploadType('class');
                      setIsSelectImageTypeDialogOpen(false);
                      setIsUpdateImageDialogOpen(true);
                    }}
                  >
                    <span className="text-lg">🏫</span>
                    <span>Ảnh lớp</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center space-y-2"
                    onClick={() => {
                      setImageUploadType('student');
                      setIsSelectImageTypeDialogOpen(false);
                      setIsUpdateImageDialogOpen(true);
                    }}
                  >
                    <span className="text-lg">👨‍🎓</span>
                    <span>Ảnh học sinh</span>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isUpdateImageDialogOpen} onOpenChange={setIsUpdateImageDialogOpen}>
            <DialogContent className="min-w-4xl max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {imageUploadType === 'class' ? 'Upload Ảnh Lớp' : 'Upload Ảnh Học Sinh'}
                </DialogTitle>
                <DialogDescription>
                  {imageUploadType === 'class' 
                    ? 'Tải ảnh lên cho lớp học' 
                    : 'Tải ảnh lên cho học sinh'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Phần Upload ảnh đơn lẻ */}
                <div className="space-y-4">
                 
                    <div className="space-y-4">
                     {imageUploadType === 'class' && (
                       <div className="flex flex-row gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="updateImageClass">Lớp</Label>
                          <Select value={updateImageClassId} onValueChange={setUpdateImageClassId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn lớp" />
                            </SelectTrigger>
                            <SelectContent>
                              {classes.map((cls) => (
                                <SelectItem key={cls._id} value={cls._id}>
                                  {cls.className}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="updateImageSchoolYear">Năm học</Label>
                          <Select value={selectedSchoolYear} disabled>
                            <SelectTrigger>
                              <SelectValue placeholder="--Chọn năm học--" />
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
                       </div>
                     )}
                    
                      {imageUploadType === 'student' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="updateImageStudent">Học sinh</Label>
                            <Combobox
                              multiple={false}
                              value={updateImageStudentId}
                              onSelect={(value) => setUpdateImageStudentId(value)}
                              options={studentsOptions}
                              placeholder="Chọn học sinh"
                              searchPlaceholder="Tìm kiếm học sinh..."
                              emptyText="Không có học sinh"
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="updateImageStudentSchoolYear">Năm học</Label>
                            <Select value={selectedSchoolYear} disabled>
                              <SelectTrigger>
                                <SelectValue placeholder="--Chọn năm học--" />
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
                        </div>
                      )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="imageFile">File ảnh *</Label>
                      {!imagePreviewUrl ? (
                        <div 
                          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                          onClick={() => imageFileInputRef.current?.click()}
                        >
                          <div className="space-y-2">
                            <p className="text-gray-500">Kéo thả hoặc chọn tệp từ máy tính</p>
                            <p className="text-sm text-gray-400">Định dạng hỗ trợ: image/* • Dung lượng tối đa: 5MB</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Image Preview */}
                          <div className="border-2 border-dashed rounded-lg p-4 text-center">
                            <div className="space-y-3">
                              <img 
                                src={imagePreviewUrl} 
                                alt="Preview" 
                                className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                              />
                              <div className="space-y-1">
                                <p className="text-sm font-medium ">
                                  {selectedImageFile?.name}
                                </p>
                                <p className="text-xs">
                                  {selectedImageFile && `${(selectedImageFile.size / 1024 / 1024).toFixed(2)} MB`}
                                </p>
                              </div>
                            </div>
                          </div>
                          {/* Buttons to change or remove */}
                          <div className="flex gap-2 justify-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => imageFileInputRef.current?.click()}
                            >
                              Thay đổi ảnh
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={clearSelectedImage}
                            >
                              Xóa ảnh
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <Input
                        type="file"
                        accept="image/*"
                        ref={imageFileInputRef}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log('Selected image file:', file.name);
                            handleImageFileSelect(file);
                          }
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          clearSelectedImage();
                          clearSelectedZip();
                          setIsUpdateImageDialogOpen(false);
                          setImageUploadType('');
                          setUpdateImageClassId('');
                          setUpdateImageStudentId('');
                        }}
                      >
                        Hủy
                      </Button>
                      <Button 
                        onClick={handleUploadImage} 
                        disabled={!selectedImageFile || uploadingImage}
                      >
                        {uploadingImage ? "Đang upload..." : "Upload ảnh"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Phần Upload ZIP ảnh cho nhiều lớp */}
                 
                <div className="space-y-4">
                  <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <p><strong>Cấu trúc file ZIP cho lớp học:</strong></p>
                        <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                          <li>Tên file ảnh: tênLớp_mãNămHọc.ext</li>
                          <li>Định dạng ảnh: .jpg, .jpeg, .png, .gif, .webp</li>
                          <li>Ví dụ: 12A1_2023-2024.jpg, 10B2_2023-2024.png</li>
                        </ul>
                      </div>
                    </div>
                  <div className="space-y-4">
                    {!selectedZipFile ? (
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                        onClick={() => zipFileInputRef.current?.click()}
                      >
                        <div className="space-y-2">
                          <p className="text-gray-500">Kéo thả hoặc chọn tệp ZIP từ máy tính</p>
                          <p className="text-sm text-gray-400">Định dạng hỗ trợ: .zip • Dung lượng tối đa: 1024MB</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* ZIP File Info */}
                        <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-4 text-center">
                          <div className="space-y-2">
                            <div className="text-4xl">📦</div>
                            <p className="text-sm font-medium text-blue-800">
                              {selectedZipFile.name}
                            </p>
                            <p className="text-xs text-blue-600">
                              {`${(selectedZipFile.size / 1024 / 1024).toFixed(2)} MB`}
                            </p>
                          </div>
                        </div>
                        {/* Buttons to change or remove */}
                        <div className="flex gap-2 justify-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => zipFileInputRef.current?.click()}
                          >
                            Thay đổi file
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={clearSelectedZip}
                          >
                            Xóa file
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <Input
                      type="file"
                      accept=".zip"
                      ref={zipFileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          console.log('Selected ZIP file:', file.name);
                          handleZipFileSelect(file);
                        }
                      }}
                    />
                    
                   
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleUploadZip}
                        disabled={!selectedZipFile || uploadingZip}
                      >
                        {uploadingZip ? "Đang upload..." : "Upload ZIP"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
            <DialogTrigger asChild>
              <Button>Ghép lớp</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enroll Students</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Manual enroll section */}
                <div>
                  <h3 className="text-lg font-medium">1. Enroll thủ công</h3>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="enrollSchoolYear">Năm học</Label>
                      <Select value={enrollSchoolYear} onValueChange={setEnrollSchoolYear}>
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
                    <div className="space-y-2">
                      <Label htmlFor="enrollClass">Lớp</Label>
                      <Select value={enrollClassId} onValueChange={setEnrollClassId} disabled={!enrollSchoolYear}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn lớp" />
                        </SelectTrigger>
                        <SelectContent>
                          {enrollClassesOptions.map((cls) => (
                            <SelectItem key={cls._id} value={cls._id}>
                              {cls.className}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="enrollStudent">Học sinh</Label>
                    <Combobox
                      multiple
                      selectedValues={selectedStudentIds}
                      onChange={setSelectedStudentIds}
                      options={studentsOptions}
                      placeholder="Chọn học sinh"
                      emptyText="Không có học sinh"
                      className="w-full"
                    />
                  </div>
                  <Button className="mt-4" onClick={handleEnrollManual} >Enroll</Button>
                </div>
                <hr className="my-6" />
                {/* Excel enroll section */}
                <div>
                  <h3 className="text-lg font-medium">2. Enroll bằng file Excel</h3>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="enrollExcelFile">File Excel</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="file" 
                          accept=".xlsx,.xls" 
                          ref={enrollExcelFileInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setEnrollExcelFile(file);
                            }
                          }}
                        />
                        <Button variant="outline" asChild>
                          <a href="/Template/enrollment-example.xlsx" download>
                            File mẫu
                          </a>
                        </Button>
                      </div>
                      {enrollExcelFile && (
                        <p className="text-sm text-green-600">
                          ✓ Đã chọn: {enrollExcelFile.name}
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={handleEnrollExcel}
                      disabled={!enrollExcelFile || uploadingEnrollExcel}
                    >
                      {uploadingEnrollExcel ? "Đang import..." : "Import Enrollments"}
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => {
                  setIsEnrollDialogOpen(false);
                  setEnrollSchoolYear("");
                  setEnrollClassId("");
                  setSelectedStudentIds([]);
                  setEnrollExcelFile(null);
                  if (enrollExcelFileInputRef.current) {
                    enrollExcelFileInputRef.current.value = '';
                  }
                }}>Đóng</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa lớp học</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa lớp học "{selectedClass?.className}" không?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  {classes && classes.length > 0 ? (
                    classes.map((cls) => (
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
                              console.log('Class data before update:', cls);
                              if (cls) {
                                setSelectedClass(cls);
                                setIsDialogOpen(true);
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
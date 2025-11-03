import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../../../components/ui/table';
import {
    Card,
    CardContent,
    CardHeader,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '../../../components/ui/alert-dialog';
import { Input } from '../../../components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '../../../components/ui/pagination';
import { API_ENDPOINTS, BASE_URL } from '../../../lib/config';
import { useToast } from "../../../hooks/use-toast";
import StudentDialog from './StudentDialog';
import StudentImportDialog from './StudentImportDialog';

interface Parent {
    _id?: string;
    fullname: string;
    phone: string;
    email: string;
    createAccount?: boolean;
    password?: string;
}

interface Student {
    _id: string;
    studentCode: string;
    name: string;
    gender: 'male' | 'female' | 'other';
    birthDate: string;
    address: string;
    email: string;
    parents: Parent[];
    status: 'active' | 'transferred' | 'dropped';
    createdAt: string;
    updatedAt: string;
    avatar?: string;
    avatarUrl?: string; // Deprecated - sẽ được thay thế bằng currentPhotoUrl
    currentPhotoUrl?: string; // Ảnh hiện tại từ Photo model
    family?: {
        _id: string;
        familyCode: string;
    };
}

interface StudentFormData {
    _id?: string;
    studentCode: string;
    name: string;
    gender: 'male' | 'female' | 'other';
    birthDate: string;
    address: string;
    email: string;
    parents: Parent[];
    status: 'active' | 'transferred' | 'dropped';
    avatar?: File | string;
    family?: string; // Family ID
}


const StudentList: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize] = useState<number>(10);
    
    // Lazy loading state for photos
    const [loadingPhotos, setLoadingPhotos] = useState<boolean>(false);
    const [loadedPhotos, setLoadedPhotos] = useState<Set<string>>(new Set());

    // Dialog states
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState<boolean>(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentFormData | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchStudents();
    }, []);

    // Reset page when search term changes
    useEffect(() => {
        setCurrentPage(1);
        setLoadedPhotos(new Set()); // Clear loaded photos cache khi search
    }, [searchTerm]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_ENDPOINTS.STUDENTS}?populate=family`);
            const studentsData = Array.isArray(response.data) ? response.data : [];
            
            // Không load ảnh ngay, chỉ set students data
            setStudents(studentsData);
            setLoading(false);
        } catch (error) {
            console.error('Lỗi khi tải danh sách học sinh:', error);
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách học sinh. Vui lòng thử lại sau.",
                variant: "destructive"
            });
            setLoading(false);
        }
    };

    // Lazy load ảnh cho học sinh trên trang hiện tại
    const loadPhotosForCurrentPage = async (studentsOnPage: Student[]) => {
        if (loadingPhotos) return; // Tránh gọi song song
        
        try {
            setLoadingPhotos(true);
            
            // Chỉ load ảnh cho những học sinh chưa có ảnh (không có cả currentPhotoUrl và avatarUrl)
            const studentsNeedPhotos = studentsOnPage.filter(student => 
                !loadedPhotos.has(student._id) && !student.currentPhotoUrl && !student.avatarUrl
            );
            
            if (studentsNeedPhotos.length === 0) {
                setLoadingPhotos(false);
                return;
            }
            
            // Load ảnh theo batch nhỏ
            const batchSize = 3;
            const updatedStudents = [...students];
            
            for (let i = 0; i < studentsNeedPhotos.length; i += batchSize) {
                const batch = studentsNeedPhotos.slice(i, i + batchSize);
                
                const batchResults = await Promise.allSettled(
                    batch.map(async (student: Student) => {
                        try {
                            console.log(`🔍 Đang tải ảnh cho học sinh: ${student.name} (ID: ${student._id})`);
                            
                            let photoUrl = null;
                            
                            // Thử lấy ảnh từ Photo model trước
                            try {
                                const photoResponse = await axios.get(`${API_ENDPOINTS.STUDENTS}/${student._id}/photo/current`);
                                console.log(`📸 Photo model response cho ${student.name}:`, photoResponse.data);
                                photoUrl = photoResponse.data.photoUrl;
                                console.log(`✅ Tìm thấy ảnh từ Photo model cho ${student.name}: ${photoUrl}`);
                            } catch (photoError) {
                                console.log(`⚠️ Không có ảnh trong Photo model cho ${student.name}, thử lấy từ Student model...`, photoError);
                                
                                // Fallback: lấy ảnh từ Student model (avatarUrl)
                                try {
                                    const studentResponse = await axios.get(`${API_ENDPOINTS.STUDENTS}/${student._id}`);
                                    photoUrl = studentResponse.data.avatarUrl;
                                    if (photoUrl) {
                                        console.log(`✅ Tìm thấy avatarUrl từ Student model cho ${student.name}: ${photoUrl}`);
                                    }
                                } catch (avatarError) {
                                    console.log(`❌ Không thể lấy avatarUrl cho ${student.name}:`, avatarError);
                                }
                            }
                            
                            if (photoUrl) {
                                // Cập nhật student trong array
                                const studentIndex = updatedStudents.findIndex(s => s._id === student._id);
                                if (studentIndex !== -1) {
                                    updatedStudents[studentIndex] = {
                                        ...updatedStudents[studentIndex],
                                        currentPhotoUrl: photoUrl
                                    };
                                }
                            } else {
                                console.log(`⚠️ Không tìm thấy ảnh nào cho ${student.name}`);
                            }
                            
                            return { studentId: student._id, success: true, photoUrl };
                        } catch (error) {
                            console.error(`🚨 Lỗi không mong đợi khi lấy ảnh cho học sinh ${student.name}:`, error);
                            
                            // Mark as attempted even if failed
                            return { studentId: student._id, success: false };
                        }
                    })
                );
                
                // Cập nhật loaded photos set
                const newLoadedPhotos = new Set(loadedPhotos);
                batchResults.forEach((result) => {
                    if (result.status === 'fulfilled') {
                        newLoadedPhotos.add(result.value.studentId);
                    }
                });
                setLoadedPhotos(newLoadedPhotos);
                
                // Cập nhật state
                setStudents(updatedStudents);
                
                // Delay nhỏ giữa các batch
                if (i + batchSize < studentsNeedPhotos.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        } catch (error) {
            console.error('Lỗi khi load ảnh:', error);
        } finally {
            setLoadingPhotos(false);
        }
    };

    const handleCreateStudent = async (formData: StudentFormData) => {
        try {
            setLoading(true);

            // Xử lý dữ liệu trước khi gửi
            const payload = new FormData();

            // Tạo tài khoản phụ huynh nếu cần
            const parentAccounts = formData.parents
                .filter(parent => parent.createAccount && parent.password && parent.email)
                .map(parent => ({
                    username: parent.email, // Sử dụng email làm username
                    password: parent.password,
                    email: parent.email,
                    role: 'parent',
                    fullname: parent.fullname,
                    active: true,
                    phone: parent.phone
                }));

            // Thêm các trường còn lại vào FormData
            const studentData = { ...formData };
            delete studentData.avatar;

            // Loại bỏ các trường không cần thiết từ parents
            studentData.parents = formData.parents.map(parent => ({
                fullname: parent.fullname,
                phone: parent.phone,
                email: parent.email
            }));

            payload.append('data', JSON.stringify(studentData));

            // Thêm thông tin tài khoản phụ huynh (nếu có)
            if (parentAccounts.length > 0) {
                payload.append('parentAccounts', JSON.stringify(parentAccounts));
            }

            // Xử lý trường avatar nếu có
            if (formData.avatar && typeof formData.avatar !== 'string') {
                payload.append('avatar', formData.avatar);
                // Thêm schoolYear hiện tại để lưu ảnh vào Photo model
                try {
                    const schoolYearResponse = await axios.get(`${API_ENDPOINTS.SCHOOL_YEARS}`);
                    // Sửa lỗi: truy cập vào schoolYearResponse.data.data thay vì schoolYearResponse.data
                    const schoolYears = schoolYearResponse.data.data || schoolYearResponse.data;
                    const currentSchoolYear = schoolYears.find((year: { isActive: boolean; _id: string }) => year.isActive);
                    if (currentSchoolYear) {
                        payload.append('schoolYear', currentSchoolYear._id);
                    }
                } catch (error) {
                    console.warn('Không thể lấy năm học hiện tại:', error);
                }
            }

            await axios.post(API_ENDPOINTS.STUDENTS, payload);

            toast({
                title: "Thành công",
                description: `Thêm học sinh mới thành công${parentAccounts.length > 0 ? ' kèm ' + parentAccounts.length + ' tài khoản phụ huynh' : ''}`,
            });
            setIsCreateDialogOpen(false);
            
            // Clear cache ảnh và reload
            setTimeout(async () => {
                await fetchStudents();
                forceReloadPhotos();
            }, 1000);
        } catch (error) {
            console.error('Lỗi khi thêm học sinh:', error);
            toast({
                title: "Lỗi",
                description: "Không thể thêm học sinh. Vui lòng thử lại sau.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStudent = async (formData: StudentFormData) => {
        if (!formData._id) return;

        try {
            setLoading(true);

            // Xử lý dữ liệu trước khi gửi
            const payload = new FormData();

            // Tạo tài khoản phụ huynh nếu cần
            const parentAccounts = formData.parents
                .filter(parent => parent.createAccount && parent.password && parent.email)
                .map(parent => ({
                    username: parent.email, // Sử dụng email làm username
                    password: parent.password,
                    email: parent.email,
                    role: 'parent',
                    fullname: parent.fullname,
                    active: true,
                    phone: parent.phone
                }));

            // Thêm các trường còn lại vào FormData
            const studentData = { ...formData };
            delete studentData.avatar;

            // Loại bỏ các trường không cần thiết từ parents
            studentData.parents = formData.parents.map(parent => ({
                fullname: parent.fullname,
                phone: parent.phone,
                email: parent.email,
                _id: parent._id
            }));

            payload.append('data', JSON.stringify(studentData));

            // Thêm thông tin tài khoản phụ huynh (nếu có)
            if (parentAccounts.length > 0) {
                payload.append('parentAccounts', JSON.stringify(parentAccounts));
            }

            // Xử lý trường avatar nếu có
            if (formData.avatar && typeof formData.avatar !== 'string') {
                payload.append('avatar', formData.avatar);
                // Thêm schoolYear hiện tại để lưu ảnh vào Photo model
                try {
                    const schoolYearResponse = await axios.get(`${API_ENDPOINTS.SCHOOL_YEARS}`);
                    // Sửa lỗi: truy cập vào schoolYearResponse.data.data thay vì schoolYearResponse.data
                    const schoolYears = schoolYearResponse.data.data || schoolYearResponse.data;
                    const currentSchoolYear = schoolYears.find((year: { isActive: boolean; _id: string }) => year.isActive);
                    if (currentSchoolYear) {
                        payload.append('schoolYear', currentSchoolYear._id);
                    }
                } catch (error) {
                    console.warn('Không thể lấy năm học hiện tại:', error);
                }
            }

            await axios.put(`${API_ENDPOINTS.STUDENTS}/${formData._id}`, payload);

            toast({
                title: "Thành công",
                description: `Cập nhật thông tin học sinh thành công${parentAccounts.length > 0 ? ' kèm ' + parentAccounts.length + ' tài khoản phụ huynh' : ''}`,
            });
            setIsEditDialogOpen(false);
            setSelectedStudent(null);
            
            // Clear cache ảnh và reload
            setTimeout(async () => {
                await fetchStudents();
                forceReloadPhotos();
            }, 1000);
        } catch (error) {
            console.error('Lỗi khi cập nhật học sinh:', error);
            toast({
                title: "Lỗi",
                description: "Không thể cập nhật thông tin học sinh. Vui lòng thử lại sau.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStudent = async (studentId: string) => {
        try {
            setLoading(true);
            await axios.delete(`${API_ENDPOINTS.STUDENTS}/${studentId}`);

            toast({
                title: "Thành công",
                description: "Xóa học sinh thành công",
            });
            await fetchStudents();
        } catch (error) {
            console.error('Lỗi khi xóa học sinh:', error);
            toast({
                title: "Lỗi",
                description: "Không thể xóa học sinh. Vui lòng thử lại sau.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };


    const editStudent = (student: Student) => {
        // Chuyển đổi từ Student sang StudentFormData
        const studentData: StudentFormData = {
            _id: student._id,
            studentCode: student.studentCode,
            name: student.name,
            gender: student.gender,
            birthDate: student.birthDate,
            address: student.address,
            email: student.email,
            parents: student.parents,
            status: student.status,
            avatar: student.avatarUrl,
            family: student.family ? student.family._id : undefined
        };

        setSelectedStudent(studentData);
        setIsEditDialogOpen(true);
    };

    const viewStudentDetails = (student: Student) => {
        // Có thể mở trang chi tiết hoặc dialog chi tiết
        window.location.href = `/students/${student._id}`;
    };

    const processStudentsForDisplay = (students: Student[]) => {
        // Sắp xếp học sinh theo familyId (hoặc _id nếu không có family)
        return [...students].sort((a, b) => {
            // Nếu cả hai không có family, sắp xếp theo _id
            if (!a.family && !b.family) return a._id.localeCompare(b._id);
            // Nếu a không có family, b có, đặt a sau b
            if (!a.family) return 1;
            // Nếu b không có family, a có, đặt a trước b
            if (!b.family) return -1;
            // Nếu cả hai đều có family, sắp xếp theo family._id
            return a.family._id.localeCompare(b.family._id);
        });
    };

    const filteredStudents = Array.isArray(students) ? students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    // Pagination logic
    const totalPages = Math.ceil(filteredStudents.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentPageStudents = filteredStudents.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Load ảnh khi trang thay đổi
    useEffect(() => {
        if (currentPageStudents.length > 0 && !loading) {
            loadPhotosForCurrentPage(currentPageStudents);
        }
    }, [currentPage, students.length, loading]); // Dependency array
    
    // Function để force reload ảnh sau khi upload
    const forceReloadPhotos = () => {
        setLoadedPhotos(new Set()); // Clear cache
        if (currentPageStudents.length > 0) {
            loadPhotosForCurrentPage(currentPageStudents);
        }
    };

    // Pagination display logic
    const getPaginationNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;
        const halfRange = Math.floor(maxPagesToShow / 2);
        
        let startPage = Math.max(1, currentPage - halfRange);
        let endPage = Math.min(totalPages, currentPage + halfRange);
        
        // Adjust range to always show maxPagesToShow pages when possible
        if (endPage - startPage + 1 < maxPagesToShow) {
            if (startPage === 1) {
                endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
            } else {
                startPage = Math.max(1, endPage - maxPagesToShow + 1);
            }
        }
        
        // Add first page and ellipsis if needed
        if (startPage > 1) {
            pages.push(1);
            if (startPage > 2) {
                pages.push('...');
            }
        }
        
        // Add visible page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        // Add ellipsis and last page if needed
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push('...');
            }
            pages.push(totalPages);
        }
        
        return pages;
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Đang học</span>;
            case 'transferred':
                return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Đã chuyển trường</span>;
            case 'dropped':
                return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Đã nghỉ học</span>;
            default:
                return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Không xác định</span>;
        }
    };

    const handleRemoveFamily = async (studentId: string) => {
        try {
            setLoading(true);
            await axios.patch(`${API_ENDPOINTS.STUDENTS}/${studentId}/remove-family`);
            toast({
                title: "Thành công",
                description: "Đã bỏ liên kết gia đình của học sinh",
            });
            await fetchStudents();
        } catch (error) {
            console.error('Lỗi khi bỏ gia đình khỏi học sinh:', error);
            toast({
                title: "Lỗi",
                description: "Không thể bỏ gia đình khỏi học sinh. Vui lòng thử lại.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full mx-auto p-4 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-semibold">Quản lý học sinh</h1>
                        <div className="flex space-x-2">
                             <Input
                            type="text"
                            placeholder="Tìm kiếm học sinh"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            />
                           
                            <Button onClick={() => setIsImportDialogOpen(true)}>Nhập từ Excel</Button>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>Thêm học sinh</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg">
                        {loading ? (
                            <div className="flex justify-center items-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mã học sinh</TableHead>
                                        <TableHead>Họ và tên</TableHead>
                                        <TableHead>Giới tính</TableHead>
                                        <TableHead>Ngày sinh</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Gia đình</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead className="text-right">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentPageStudents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-4">
                                                Không có dữ liệu học sinh
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        (() => {
                                            const sortedStudents = processStudentsForDisplay(currentPageStudents);
                                            let currentFamilyId: string | null = null;
                                            let familyRowSpan = 0;
                                            let rowsToSkip = 0;

                                            return sortedStudents.map((student) => {
                                                // Kiểm tra nếu học sinh này có cùng gia đình với học sinh trước đó
                                                const isSameFamily = student.family &&
                                                    currentFamilyId === student.family._id;

                                                // Nếu là học sinh đầu tiên của một gia đình mới
                                                if (student.family && !isSameFamily) {
                                                    // Đếm số học sinh có cùng family ID
                                                    currentFamilyId = student.family._id;
                                                    familyRowSpan = sortedStudents.filter(s =>
                                                        s.family && s.family._id === currentFamilyId
                                                    ).length;
                                                    rowsToSkip = 0; // Reset counter for new family
                                                } else if (isSameFamily) {
                                                    rowsToSkip++; // Increment counter for same family
                                                }

                                                return (
                                        <TableRow
                                                        key={student._id}
                                                    >
                                            <TableCell className="font-medium">{student.studentCode}</TableCell>
                                                                                                <TableCell>
                                            <div className="flex items-center gap-2">
                                                {(student.currentPhotoUrl || student.avatarUrl) ? (
                                                    <img
                                                        src={`${BASE_URL}${student.currentPhotoUrl || student.avatarUrl}`}
                                                        alt={`Ảnh của ${student.name}`}
                                                        className="w-8 h-8 rounded-full object-cover border"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            console.log(`❌ Lỗi load ảnh cho ${student.name}:`, target.src);
                                                            // Thay vì ẩn hoàn toàn, hiển thị fallback avatar
                                                            target.style.display = 'none';
                                                            const fallbackDiv = target.nextElementSibling as HTMLElement;
                                                            if (fallbackDiv && fallbackDiv.classList.contains('fallback-avatar')) {
                                                                fallbackDiv.style.display = 'flex';
                                                            }
                                                        }}
                                                        onLoad={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            console.log(`✅ Ảnh load thành công cho ${student.name}:`, target.src);
                                                            // Ẩn fallback khi ảnh load thành công
                                                            const fallbackDiv = target.nextElementSibling as HTMLElement;
                                                            if (fallbackDiv && fallbackDiv.classList.contains('fallback-avatar')) {
                                                                fallbackDiv.style.display = 'none';
                                                            }
                                                        }}
                                                    />
                                                ) : null}
                                                
                                                {/* Fallback avatar - hiển thị khi không có ảnh hoặc ảnh lỗi */}
                                                <div 
                                                    className={`fallback-avatar w-8 h-8 rounded-full border flex items-center justify-center ${
                                                        (student.currentPhotoUrl || student.avatarUrl) ? 'hidden' : 
                                                        loadingPhotos && !loadedPhotos.has(student._id) ? 'bg-gray-200' : 'bg-gray-100'
                                                    }`}
                                                    style={{ display: (student.currentPhotoUrl || student.avatarUrl) ? 'none' : 'flex' }}
                                                >
                                                    {loadingPhotos && !loadedPhotos.has(student._id) ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                                    ) : (
                                                        <span className="text-xs font-semibold text-gray-600">
                                                            {student.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <span>{student.name}</span>
                                            </div>
                                        </TableCell>
                                                        <TableCell>
                                                            {student.gender === 'male' ? 'Nam' :
                                                                student.gender === 'female' ? 'Nữ' :
                                                                    'Khác'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {student.birthDate ? format(new Date(student.birthDate), 'dd/MM/yyyy', { locale: vi }) : 'N/A'}
                                                        </TableCell>
                                                        <TableCell>{student.email || 'N/A'}</TableCell>

                                                        {/* Hiển thị cột family với rowSpan cho học sinh đầu tiên của mỗi gia đình */}
                                                        {student.family && rowsToSkip === 0 ? (
                                                            <TableCell rowSpan={familyRowSpan} className="border text-center">
                                                                {student.family.familyCode}
                                                            </TableCell>
                                                        ) : !student.family ? (
                                                            <TableCell>N/A</TableCell>
                                                        ) : null}

                                                        <TableCell>{getStatusLabel(student.status)}</TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => viewStudentDetails(student)}
                                                            >
                                                                Chi tiết
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => editStudent(student)}
                                                            >
                                                                Sửa
                                                            </Button>
                                                            {student.family && (
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="destructive" size="sm">
                                                                            Xoá gia đình
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Xác nhận xoá gia đình</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Bạn có chắc muốn xoá liên kết gia đình cho học sinh này?
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Huỷ</AlertDialogCancel>
                                                                            <AlertDialogAction onClick={() => handleRemoveFamily(student._id)}>
                                                                                Xoá
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            });
                                        })()
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>

                    <div className="mt-4 flex justify-center">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious 
                                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                        className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                                
                                {getPaginationNumbers().map((page, index) => (
                                    <PaginationItem key={`${page}-${index}`}>
                                        {page === '...' ? (
                                            <PaginationEllipsis />
                                        ) : (
                                            <PaginationLink
                                                onClick={() => handlePageChange(page as number)}
                                                isActive={currentPage === page}
                                                className="cursor-pointer"
                                            >
                                                {page}
                                            </PaginationLink>
                                        )}
                                    </PaginationItem>
                                ))}
                                
                                <PaginationItem>
                                    <PaginationNext 
                                        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                                        className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog thêm học sinh mới */}
            <StudentDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSubmit={handleCreateStudent}
                mode="create"
            />

            {/* Dialog cập nhật học sinh */}
            {selectedStudent && (
                <StudentDialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    onSubmit={handleUpdateStudent}
                    onDelete={handleDeleteStudent}
                    mode="edit"
                    studentData={selectedStudent}
                />
            )}

            {/* Dialog nhập danh sách học sinh từ Excel */}
            <StudentImportDialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
            />
        </div>
    );
};

export default StudentList;

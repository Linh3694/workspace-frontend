import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from '../../hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../../components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../../components/ui/select';
import { DatePicker } from '../../components/ui/datepicker';
import { API_ENDPOINTS, API_URL } from '../../lib/config';

import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '../../components/ui/dialog';

interface Student {
    _id: string;
    name: string;
    studentCode: string;
    klass?: Array<{_id: string; className?: string}>;
    class?: {_id: string} | string;
}

interface Teacher {
    _id: string;
    user?: {
        _id: string;
    };
    fullName?: string;
}

interface Parent {
    _id: string;
    fullname: string;
    user: {
        _id: string;
        fullname: string;
    };
}

interface CommunicationBook {
    _id: string;
    student: Student;
    teacher: Teacher;
    parent: Parent;
    date: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    ratings: {
        study: string;
        discipline: string;
        extracurricular: string;
    };
}

interface Class {
    _id: string;
    homeroomTeachers?: Teacher[];
}

interface SchoolYear {
    _id: string;
    name?: string;
    code: string;
    isActive?: boolean;
    status?: string;
}

const CommunicationBookComponent: React.FC = () => {
    const [communications, setCommunications] = useState<CommunicationBook[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [content, setContent] = useState<string>('');
    const [searchTerm] = useState<string>('');
    const [studyRating, setStudyRating] = useState<string>('');
    const [disciplineRating, setDisciplineRating] = useState<string>('');
    const [extracurricularRating, setExtracurricularRating] = useState<string>('');

    // New Attendance‐style controls
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
    const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('');
    const [classes, setClasses] = useState<{ _id: string; className: string }[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [userRole, setUserRole] = useState<string>('');
    const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedTeacher, setSelectedTeacher] = useState<string>('');
    const [openDialogId, setOpenDialogId] = useState<string | null>(null);

    const { toast } = useToast();

    // 1. Load school years and current user on mount
    useEffect(() => {
        const fetchInitial = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            const yrs = await axios.get(API_ENDPOINTS.SCHOOL_YEARS, { headers: { Authorization: `Bearer ${token}` } });
            const yearArr = Array.isArray(yrs.data) ? yrs.data : yrs.data.data || [];
            setSchoolYears(yearArr);
            
            // Find active school year or default to first one
            if (yearArr.length) {
                const activeYear = yearArr.find((y: SchoolYear) => y.isActive === true || y.status === 'active');
                setSelectedSchoolYear(activeYear ? activeYear._id : yearArr[0]._id);
            }
            
            // fetch current user
            const me = await axios.get(API_ENDPOINTS.CURRENT_USER, { headers: { Authorization: `Bearer ${token}` } });
            setUserRole(me.data.role);
        };
        fetchInitial();
    }, []);

    // 2. When schoolYear changes, load classes per role
    useEffect(() => {
        if (!selectedSchoolYear) return;
        const fetchClasses = async () => {
            const token = localStorage.getItem('token');
            if (userRole === 'admin' || userRole === 'superadmin') {
                // Load all classes for admin/superadmin
                const res = await axios.get(API_ENDPOINTS.CLASSES, { params: { schoolYear: selectedSchoolYear }, headers: { Authorization: `Bearer ${token}` } });
                const clsArr = Array.isArray(res.data) ? res.data : res.data.data || [];
                setClasses(clsArr);
                setSelectedClass(clsArr[0]?._id || '');
                
                // Load all teachers for admin/superadmin to choose from
                const tRes = await axios.get(API_ENDPOINTS.TEACHERS, { headers: { Authorization: `Bearer ${token}` } });
                const teachersArr = Array.isArray(tRes.data) ? tRes.data : tRes.data.data || [];
                setTeachers(teachersArr);
            } else if (userRole === 'teacher') {
                // same logic as Attendance: fetch teachers, find current, then filter homeroomClasses
                const tRes = await axios.get(API_ENDPOINTS.TEACHERS, { headers: { Authorization: `Bearer ${token}` } });
                const teachers = Array.isArray(tRes.data) ? tRes.data : tRes.data.data || [];
                const me = await axios.get(API_ENDPOINTS.CURRENT_USER, { headers: { Authorization: `Bearer ${token}` } });
                const teacher = teachers.find((t: Teacher) => t.user?._id === me.data._id);
                setCurrentTeacher(teacher);
                const allCls = await axios.get(API_ENDPOINTS.CLASSES, { params: { schoolYear: selectedSchoolYear, populate: 'homeroomTeachers' }, headers: { Authorization: `Bearer ${token}` } });
                const arr = Array.isArray(allCls.data) ? allCls.data : allCls.data.data || [];
                const home = arr.filter((c: Class) => c.homeroomTeachers?.some((h: Teacher) => h._id === teacher._id));
                setClasses(home);
                setSelectedClass(home[0]?._id || '');
            }
        };
        fetchClasses();
    }, [selectedSchoolYear, userRole]);

    // 3. When class changes, load students
    useEffect(() => {
        if (!selectedClass) {
            setStudents([]);
            setSelectedStudent('');
            return;
        }
        const fetchStus = async () => {
            const token = localStorage.getItem('token');
            console.log('Loading students for class:', selectedClass);
            
            // Use the same endpoint as Attendance page - students-by-class
            const res = await axios.get(API_ENDPOINTS.STUDENTS_BY_CLASS, { 
                params: { classId: selectedClass },
                headers: { Authorization: `Bearer ${token}` } 
            });
            
            const studentsArr = Array.isArray(res.data) ? res.data : res.data.data || [];
            console.log('Students loaded for class:', studentsArr.length, 'students for class', selectedClass);
            
            setStudents(studentsArr);
            // Reset selected student when class changes
            setSelectedStudent('');
        };
        fetchStus();
    }, [selectedClass]);

    // 4. When class or date changes, reload communications (independent of student)
    useEffect(() => {
        if (!selectedDate || !selectedClass) return;
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const fetchComm = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const resp = await axios.get(`${API_URL}/communications`, {
                    params: { class: selectedClass, date: dateStr },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCommunications(Array.isArray(resp.data) ? resp.data : resp.data.data || []);
            } catch (error) {
                console.error('Lỗi khi tải sổ liên lạc:', error);
                setCommunications([]);
            } finally {
                setLoading(false);
            }
        };
        fetchComm();
    }, [selectedClass, selectedDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (
            !selectedStudent ||
            !content.trim() ||
            !studyRating ||
            !disciplineRating ||
            !extracurricularRating
        )
            return;

        try {
            const token = localStorage.getItem('token');
            
            // Determine teacher ID based on user role
            let teacherId;
            if (userRole === 'teacher') {
                teacherId = currentTeacher?._id;
            } else if (userRole === 'admin' || userRole === 'superadmin') {
                teacherId = selectedTeacher || null; // Allow admin/superadmin to select teacher or leave it null
            }
            
            await axios.post(`${API_URL}/communications`, {
                student: selectedStudent,
                class: selectedClass,
                date: selectedDate,
                teacher: teacherId,
                userRole: userRole, // Gửi thêm userRole để backend validate
                content,
                ratings: {
                    study: studyRating,
                    discipline: disciplineRating,
                    extracurricular: extracurricularRating
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // After submit, reload communications
            toast({
                title: 'Thành công',
                description: 'Gửi sổ liên lạc thành công',
            });
            // refetch
            if (selectedStudent && selectedDate && selectedClass) {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                setLoading(true);
                const resp = await axios.get(`${API_URL}/communications`, {
                    params: { student: selectedStudent, date: dateStr },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCommunications(Array.isArray(resp.data) ? resp.data : resp.data.data || []);
                setLoading(false);
            }
            setContent('');
            setStudyRating('');
            setDisciplineRating('');
            setExtracurricularRating('');
        } catch (error: unknown) {
            const msg = error instanceof Error && 'response' in error 
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi khi gửi sổ liên lạc'
                : 'Có lỗi khi gửi sổ liên lạc';
            toast({
                variant: 'destructive',
                title: 'Lỗi',
                description: msg,
            });
        }
    };

    const filteredCommunications = Array.isArray(communications) ? communications.filter(comm =>
        comm.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.teacher?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <div className="w-full mx-auto p-4 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Sổ liên lạc</CardTitle>
                    </div>
                    <CardDescription>Liên lạc giữa giáo viên và phụ huynh</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-row gap-10">
                        {/* Attendance-style filter controls */}
                        <div className="w-1/3 flex flex-col gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Chọn ngày</label>
                                <DatePicker date={selectedDate} setDate={(date) => date && setSelectedDate(date)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Chọn năm học</label>
                                <Select value={selectedSchoolYear} onValueChange={setSelectedSchoolYear}>
                                    <SelectTrigger><SelectValue placeholder="Chọn năm học" /></SelectTrigger>
                                    <SelectContent>
                                        {schoolYears.map(y => <SelectItem key={y._id} value={y._id}>{y.name || y.code}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Chọn lớp</label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger><SelectValue placeholder="Chọn lớp" /></SelectTrigger>
                                    <SelectContent>
                                        {classes.map(c => <SelectItem key={c._id} value={c._id}>{c.className}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedClass && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Chọn học sinh</label>
                                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                                        <SelectTrigger><SelectValue placeholder="Chọn học sinh" /></SelectTrigger>
                                        <SelectContent>
                                            {students.map(s => (
                                                <SelectItem key={s._id} value={s._id}>
                                                    {s.name} ({s.studentCode})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {(userRole === 'admin' || userRole === 'superadmin') && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Chọn giáo viên</label>
                                    <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                                        <SelectTrigger><SelectValue placeholder="Chọn giáo viên (tùy chọn)" /></SelectTrigger>
                                        <SelectContent>
                                            {teachers.map(t => (
                                                <SelectItem key={t._id} value={t._id}>
                                                    {t.fullName || 'Không có tên'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        {(userRole === 'admin' || userRole === 'superadmin' || userRole === 'teacher') && (
                            <div className="w-full mb-6">
                                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                                    <div className="space-y-7">
                                        <div className="w-full md:w-1/3 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Học tập</label>
                                                <Select value={studyRating} onValueChange={setStudyRating}>
                                                    <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="A">A</SelectItem>
                                                        <SelectItem value="B">B</SelectItem>
                                                        <SelectItem value="C">C</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Kỷ luật</label>
                                                <Select value={disciplineRating} onValueChange={setDisciplineRating}>
                                                    <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="A">A</SelectItem>
                                                        <SelectItem value="B">B</SelectItem>
                                                        <SelectItem value="C">C</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Ngoại khoá</label>
                                                <Select value={extracurricularRating} onValueChange={setExtracurricularRating}>
                                                    <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="A">A</SelectItem>
                                                        <SelectItem value="B">B</SelectItem>
                                                        <SelectItem value="C">C</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="font-medium">Nội dung</label>
                                            <textarea
                                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder="Nhập nội dung liên lạc..."
                                                rows={4}
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                            ></textarea>
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={
                                                !selectedStudent ||
                                                !content.trim() ||
                                                !studyRating ||
                                                !disciplineRating ||
                                                !extracurricularRating
                                            }
                                        >
                                            Gửi liên lạc
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}
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
                                        <TableHead>Học sinh</TableHead>
                                        <TableHead>Giáo viên</TableHead>
                                        <TableHead>Ngày</TableHead>
                                        <TableHead>Học tập</TableHead>
                                        <TableHead>Kỷ luật</TableHead>
                                        <TableHead>Ngoại khoá</TableHead>
                                        <TableHead>Nội dung</TableHead>
                                        <TableHead className="text-right">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCommunications.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-4">
                                                Không có dữ liệu sổ liên lạc
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredCommunications.map((comm) => (
                                            <TableRow key={comm._id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{comm.student.name}</div>
                                                        <div className="text-sm text-gray-500">{comm.student.studentCode}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {comm.teacher?.fullName || 'Không có giáo viên'}
                                                </TableCell>
                                                <TableCell>
                                                    {format(new Date(comm.date), 'dd/MM/yyyy', { locale: vi })}
                                                </TableCell>
                                                <TableCell>{comm.ratings?.study}</TableCell>
                                                <TableCell>{comm.ratings?.discipline}</TableCell>
                                                <TableCell>{comm.ratings?.extracurricular}</TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs truncate" title={comm.content}>
                                                        {comm.content}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Dialog open={openDialogId === comm._id} onOpenChange={(open) => {
                                                        if (!open) setOpenDialogId(null);
                                                    }}>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm" onClick={() => setOpenDialogId(comm._id)}>Cập nhật</Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Cập nhật sổ liên lạc</DialogTitle>
                                                                <DialogDescription>
                                                                    Chỉnh sửa đánh giá và nội dung liên lạc cho học sinh <strong>{comm.student.name}</strong>.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <form onSubmit={async e => {
                                                                e.preventDefault();
                                                                try {
                                                                    const token = localStorage.getItem('token');
                                                                    const updatedComm = await axios.put(`${API_URL}/communications/${comm._id}`, {
                                                                        ratings: {
                                                                            study: comm.ratings.study,
                                                                            discipline: comm.ratings.discipline,
                                                                            extracurricular: comm.ratings.extracurricular
                                                                        },
                                                                        content: comm.content
                                                                    }, {
                                                                        headers: { Authorization: `Bearer ${token}` }
                                                                    });

                                                                    // Cập nhật state với dữ liệu mới
                                                                    setCommunications(prevComms =>
                                                                        prevComms.map(c =>
                                                                            c._id === comm._id ? updatedComm.data : c
                                                                        )
                                                                    );

                                                                    toast({
                                                                        title: "Thành công",
                                                                        description: "Cập nhật sổ liên lạc thành công",
                                                                    });
                                                                    // Đóng dialog sau khi lưu thành công
                                                                    setOpenDialogId(null);
                                                                } catch (error: unknown) {
                                                                    const msg = error instanceof Error && 'response' in error 
                                                                        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Có lỗi khi cập nhật sổ liên lạc"
                                                                        : "Có lỗi khi cập nhật sổ liên lạc";
                                                                    toast({
                                                                        variant: "destructive",
                                                                        title: "Lỗi",
                                                                        description: msg,
                                                                    });
                                                                }
                                                            }}>
                                                                {/* Ratings */}
                                                                <div className="grid grid-cols-3 gap-4 mb-4">
                                                                    {['study', 'discipline', 'extracurricular'].map((field) => (
                                                                        <div key={field}>
                                                                            <label className="block text-sm font-medium mb-1">
                                                                                {field === 'study' ? 'Học tập' : field === 'discipline' ? 'Kỷ luật' : 'Ngoại khoá'}
                                                                            </label>
                                                                            <Select
                                                                                value={comm.ratings[field as keyof typeof comm.ratings]}
                                                                                onValueChange={(val) => {
                                                                                    comm.ratings[field as keyof typeof comm.ratings] = val;
                                                                                    setCommunications([...communications]);
                                                                                }}
                                                                            >
                                                                                <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="A">A</SelectItem>
                                                                                    <SelectItem value="B">B</SelectItem>
                                                                                    <SelectItem value="C">C</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {/* Content */}
                                                                <div className="grid gap-2 mb-4">
                                                                    <label className="font-medium">Nội dung</label>
                                                                    <textarea
                                                                        className="w-full rounded border px-3 py-2"
                                                                        value={comm.content}
                                                                        onChange={(e) => {
                                                                            comm.content = e.target.value;
                                                                            setCommunications([...communications]);
                                                                        }}
                                                                    />
                                                                </div>
                                                                <DialogFooter>
                                                                    <Button type="submit">Lưu</Button>
                                                                </DialogFooter>
                                                            </form>
                                                        </DialogContent>
                                                    </Dialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CommunicationBookComponent;

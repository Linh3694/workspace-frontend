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
import { API_ENDPOINTS, BASE_URL } from '../../lib/config';
import { DatePicker } from '../../components/ui/datepicker';
import { Checkbox } from '../../components/ui/checkbox';
import { Info } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '../../components/ui/popover';
import { AiOutlineInfoCircle } from "react-icons/ai";


interface Student {
    _id: string;
    name: string;
    studentCode: string;
    avatarUrl?: string;
    parents?: { fullname: string; phone: string; relationship: string }[];
}

interface Teacher {
    _id: string;
    fullname: string;
    teachingAssignments?: {
        class: { _id: string; className: string };
        subjects: { _id: string; name: string }[];
    }[];
}

interface Class {
    _id: string;
    className: string;
    homeroomTeachers?: Teacher[];
}

interface Attendance {
    _id: string;
    student: Student;
    class: Class;
    teacher: Teacher;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    note: string;
    createdAt: string;
    updatedAt: string;
}

interface SchoolYear {
    _id: string;
    code: string;
    name?: string;
}

interface Parent {
    fullname: string;
    phone: string;
    relationship: string;
}

interface Family {
    _id: string;
    familyCode: string;
    parents: { parent: Parent; relationship: string }[];
    students: { _id: string; name: string }[];
    address: string;
}

const ParentInfo: React.FC<{ parents: Parent[] }> = ({ parents }) => {
    if (!parents || parents.length === 0) {
        return <div>Không có thông tin phụ huynh</div>;
    }
    return (
        <div>
            {parents.map((parent, idx) => (
                <div key={idx} className="mb-2">
                    <div className="flex items-center gap-2">Thông tin liên lạc</div>
                    <div> <b>{parent.relationship}</b> : {parent.fullname} </div>
                    <div><b>SĐT:</b> {parent.phone}</div>
                </div>
            ))}
        </div>
    );
};

const AttendanceList: React.FC = () => {
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [classes, setClasses] = useState<Class[]>([]);
    const [userRole, setUserRole] = useState<string>('');
    const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
    const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
    const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('');
    const [students, setStudents] = useState<Student[]>([]);
    const [pendingAttendances, setPendingAttendances] = useState<{ [studentId: string]: { status: string, note: string } }>({});
    const [studentParentsMap, setStudentParentsMap] = useState<{ [studentId: string]: Parent[] }>({});

    useEffect(() => {
        fetchSchoolYears();
    }, []);

    useEffect(() => {
        if (selectedSchoolYear) {
            fetchClassesAndStudents();
        }
    }, [selectedSchoolYear]);

    // 1. Khi đổi lớp: load danh sách học sinh
    useEffect(() => {
        if (selectedClass) {
            fetchStudentsByClass(selectedClass);
        }
    }, [selectedClass]);

    // 2. Khi đổi lớp hoặc đổi ngày: only load điểm danh
    useEffect(() => {
        if (selectedClass && selectedDate) {
            fetchAttendances();
        }
    }, [selectedClass, selectedDate]);

    const fetchSchoolYears = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(API_ENDPOINTS.SCHOOL_YEARS, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const years = Array.isArray(response.data) ? response.data : response.data.data || [];
            setSchoolYears(years);
            if (years.length > 0) {
                setSelectedSchoolYear(years[0]._id);
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách năm học:', error);
        }
    };

    const fetchClassesAndStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Bạn chưa đăng nhập!');
                return;
            }
            const userResponse = await axios.get(API_ENDPOINTS.CURRENT_USER, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const role = userResponse.data.role;
            setUserRole(role);

            let classesData: Class[] = [];
            if (role === 'admin') {
                const response = await axios.get(API_ENDPOINTS.CLASSES, {
                    params: { schoolYear: selectedSchoolYear },
                    headers: { Authorization: `Bearer ${token}` }
                });
                classesData = Array.isArray(response.data) ? response.data : response.data.data || [];
                setClasses(classesData);
                setSelectedClass(classesData.length > 0 ? classesData[0]._id : '');
            } else if (role === 'teacher') {
                // Lấy tất cả teachers
                const teachersRes = await axios.get(API_ENDPOINTS.TEACHERS, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const teachers = Array.isArray(teachersRes.data) ? teachersRes.data : teachersRes.data.data || [];
                // Tìm teacher có user._id === user._id hiện tại
                const user = userResponse.data;
                const teacher = teachers.find((t: any) => t.user && t.user._id === user._id);
                if (!teacher) {
                    alert('Không tìm thấy giáo viên tương ứng với tài khoản này!');
                    return;
                }
                setCurrentTeacher(teacher);

                // 1) Lấy tất cả lớp của năm học, kèm populate homeroomTeachers
                const response = await axios.get(API_ENDPOINTS.CLASSES, {
                    params: {
                        schoolYear: selectedSchoolYear,
                        populate: 'homeroomTeachers'
                    },
                    headers: { Authorization: `Bearer ${token}` }
                });
                const allClasses = Array.isArray(response.data)
                    ? response.data
                    : response.data.data || [];

                // 2) Lọc ra các lớp mà teacher này là homeroom
                const homeroomClasses = allClasses.filter((cls: any) =>
                    cls.homeroomTeachers?.some((t: any) => t._id === teacher._id)
                );

                setClasses(homeroomClasses);
                setSelectedClass(homeroomClasses.length > 0 ? homeroomClasses[0]._id : '');
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách lớp học:', error);
        }
    };

    const fetchStudentsByClass = async (classId: string) => {
        try {
            const token = localStorage.getItem('token');
            // Use the generic STUDENTS endpoint and pass classId as query
            const response = await axios.get(API_ENDPOINTS.STUDENTS, {
                params: { classId },
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Calling STUDENTS with classId param, URL:', API_ENDPOINTS.STUDENTS, 'classId:', classId);

            let studentsArr = [];
            if (Array.isArray(response.data)) {
                studentsArr = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                studentsArr = response.data.data;
            } else {
                studentsArr = [];
            }
            setStudents(studentsArr);

            // Sau khi lấy students, fetch families
            const familiesRes = await axios.get(API_ENDPOINTS.FAMILIES, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const families: Family[] = Array.isArray(familiesRes.data) ? familiesRes.data : familiesRes.data.data || [];
            // Tạo map studentId -> parents
            const map: { [studentId: string]: Parent[] } = {};
            for (const family of families) {
                if (family.students && Array.isArray(family.students) && family.parents && Array.isArray(family.parents)) {
                    family.students.forEach((stu) => {
                        map[stu._id] = family.parents.map((p) => ({
                            fullname: (p.parent && typeof p.parent === 'object' ? p.parent.fullname : '') || '',
                            phone: (p.parent && typeof p.parent === 'object' ? p.parent.phone : '') || '',
                            relationship: p.relationship || ''
                        }));
                    });
                }
            }
            setStudentParentsMap(map);
        } catch (error) {
            console.error('Lỗi khi tải danh sách học sinh hoặc phụ huynh:', error);
            setStudents([]);
            setStudentParentsMap({});
        }
    };

    const fetchAttendances = async () => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        console.log('Fetching attendances for class:', selectedClass, 'date:', dateStr);
        try {
            setLoading(true);
            // Lấy token và đưa vào header
            const token = localStorage.getItem('token');
            const response = await axios.get(API_ENDPOINTS.ATTENDANCES, {
                params: {
                    class: selectedClass,
                    date: dateStr
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            // Chuẩn hóa response thành array
            const data = Array.isArray(response.data)
                ? response.data
                : Array.isArray(response.data.data)
                    ? response.data.data
                    : [];
            setAttendances(data);
        } catch (error) {
            console.error('Lỗi khi tải danh sách điểm danh:', error);
            // nếu lỗi hoặc không có data thì để mảng rỗng
            setAttendances([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'present':
                return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Có mặt</span>;
            case 'absent':
                return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Vắng mặt</span>;
            case 'late':
                return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Đi muộn</span>;
            case 'excused':
                return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Có phép</span>;
            default:
                return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Không xác định</span>;
        }
    };

    const handleStatusChange = async (attendanceId: string, newStatus: string) => {
        try {
            // Kiểm tra quyền thay đổi trạng thái
            if (userRole === 'teacher' && !currentTeacher) {
                console.error('Không có quyền thay đổi trạng thái điểm danh');
                return;
            }

            await axios.put(API_ENDPOINTS.ATTENDANCE(attendanceId), {
                status: newStatus
            });

            // Cập nhật state hiện tại
            const updatedAttendances = attendances.map(attendance => {
                if (attendance._id === attendanceId) {
                    return {
                        ...attendance,
                        status: newStatus as 'present' | 'absent' | 'late' | 'excused'
                    };
                }
                return attendance;
            });

            setAttendances(updatedAttendances);
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái điểm danh:', error);
        }
    };

    const getAttendanceByStudent = (studentId: string) => {
        return attendances.find(a => a.student._id === studentId);
    };

    const handleCreateAttendance = async (student: Student, status: string) => {
        try {
            const token = localStorage.getItem('token');
            // Lấy id giáo viên hiện tại
            const teacherId = currentTeacher?._id;
            if (!teacherId) {
                alert('Không xác định được giáo viên điểm danh!');
                return;
            }
            await axios.post(API_ENDPOINTS.ATTENDANCES, {
                student: student._id,
                class: selectedClass,
                date: selectedDate,
                status,
                note: '',
                teacher: teacherId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAttendances();
        } catch (error) {
            console.error('Lỗi khi tạo mới điểm danh:', error);
        }
    };

    const handlePendingStatusChange = (studentId: string, status: string, checked: boolean) => {
        setPendingAttendances(prev => ({
            ...prev,
            [studentId]: {
                status: checked ? status : '',
                note: prev[studentId]?.note || ''
            }
        }));
    };

    const handlePendingNoteChange = (studentId: string, note: string) => {
        setPendingAttendances(prev => ({
            ...prev,
            [studentId]: {
                status: prev[studentId]?.status || '',
                note
            }
        }));
    };

    const handleConfirmAttendance = async () => {
        try {
            const token = localStorage.getItem('token');
            for (const student of students) {
                const pending = pendingAttendances[student._id];
                if (!pending || !pending.status) continue;

                // Kiểm tra đã có attendance chưa
                const attendance = attendances.find(a => a.student._id === student._id);

                if (attendance) {
                    // Update
                    await axios.put(API_ENDPOINTS.ATTENDANCE(attendance._id), {
                        status: pending.status,
                        note: pending.note
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } else {
                    // Create mới
                    await axios.post(API_ENDPOINTS.ATTENDANCES, {
                        student: student._id,
                        class: selectedClass,
                        date: selectedDate,
                        status: pending.status,
                        note: pending.note,
                        teacher: currentTeacher?._id
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            }
            fetchAttendances();
            setPendingAttendances({});
            alert('Cập nhật điểm danh thành công!');
        } catch (error) {
            alert('Có lỗi khi cập nhật điểm danh!');
        }
    };

    return (
        <div className="w-full mx-auto p-4 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Điểm danh học sinh</CardTitle>
                        <Button>Điểm danh mới</Button>
                    </div>
                    <CardDescription>Quản lý thông tin điểm danh học sinh trong hệ thống</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-6">
                        <div className="w-40">
                            <label className="block text-sm font-medium mb-1">Năm học</label>
                            <select
                                className="w-full px-3 py-2 border rounded-md"
                                value={selectedSchoolYear}
                                onChange={e => setSelectedSchoolYear(e.target.value)}
                            >
                                {schoolYears.map(year => (
                                    <option key={year._id} value={year._id}>
                                        {year.name || year.code}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-64">
                            <label className="block text-sm font-medium mb-1">Lớp</label>
                            <Select
                                value={selectedClass}
                                onValueChange={setSelectedClass}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn lớp" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(cls => (
                                        <SelectItem key={cls._id} value={cls._id}>
                                            {cls.className}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-64">
                            <label className="block text-sm font-medium mb-1">Ngày</label>
                            <DatePicker
                                date={selectedDate}
                                setDate={setSelectedDate}
                            />
                        </div>
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
                                        <TableHead>Mã học sinh</TableHead>
                                        <TableHead>Họ và tên</TableHead>
                                        <TableHead className="text-center">Check-in</TableHead>
                                        <TableHead className="text-center">Check-out</TableHead>
                                        <TableHead className="text-center">Có mặt</TableHead>
                                        <TableHead className="text-center">Vắng mặt</TableHead>
                                        <TableHead className="text-center">Đi muộn</TableHead>
                                        <TableHead className="text-center">Có phép</TableHead>
                                        <TableHead>Ghi chú</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-4">
                                                Không có học sinh trong lớp này
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        students.map((student) => {
                                            const attendance = getAttendanceByStudent(student._id);
                                            return (
                                                <TableRow key={student._id}>
                                                    <TableCell className="font-medium">{student.studentCode}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {student.avatarUrl && (
                                                                <img
                                                                    src={`${BASE_URL}${student.avatarUrl}`}
                                                                    alt={student.name}
                                                                    className="w-8 h-8 rounded-full object-cover"
                                                                />
                                                            )}
                                                            <span>{student.name}</span>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <button
                                                                        className=" border-gray-300 w-6 h-6 flex items-center justify-center"
                                                                        title="Thông tin phụ huynh"
                                                                    >
                                                                        <AiOutlineInfoCircle size={16} />
                                                                    </button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="p-3 min-w-[200px]">
                                                                    <ParentInfo parents={studentParentsMap[student._id] || []} />
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <input
                                                            type="time"
                                                            value={attendance?.checkIn || ''}
                                                            onChange={e => {/* handle locally or leave for later */ }}
                                                            className="max-w-20"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <input
                                                            type="time"
                                                            value={attendance?.checkOut || ''}
                                                            onChange={e => {/* handle locally or leave for later */ }}
                                                            className="max-w-20"
                                                        />
                                                    </TableCell>
                                                    {['present', 'absent', 'late', 'excused'].map((status) => (
                                                        <TableCell key={status} className="text-center">
                                                            <Checkbox
                                                                checked={(pendingAttendances[student._id]?.status ?? attendance?.status) === status}
                                                                onCheckedChange={checked => handlePendingStatusChange(student._id, status, checked)}
                                                            />
                                                        </TableCell>
                                                    ))}
                                                    <TableCell>
                                                        {['absent', 'late', 'excused'].includes(pendingAttendances[student._id]?.status || attendance?.status) ? (
                                                            <input
                                                                type="text"
                                                                value={pendingAttendances[student._id]?.note ?? attendance?.note ?? ''}
                                                                onChange={e => handlePendingNoteChange(student._id, e.target.value)}
                                                                className="border rounded px-2 py-1 w-full"
                                                                placeholder="Nhập lý do..."
                                                            />
                                                        ) : (
                                                            <span>{attendance?.note || '-'}</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                    <div className="flex mt-5 justify-end">
                        <Button onClick={handleConfirmAttendance}>Xác nhận</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AttendanceList;

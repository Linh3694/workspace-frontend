import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
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
    CardHeader
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
import { Popover, PopoverTrigger, PopoverContent } from '../../components/ui/popover';
import { AiOutlineInfoCircle } from "react-icons/ai";
import { toast } from 'sonner';
import type { SchoolYear } from '../../types/school.types';
import type { 
    Attendance, 
    AttendanceStudent as Student, 
    AttendanceTeacher as Teacher, 
    AttendanceClass as Class,
    Parent, 
    Family,
    Period,
    Subject,
    AttendanceData,
    AttendanceStatus,
    TimetableSlot
} from '../../types/attendance.types';
import type { LeaveRequest } from '../../types/leave-request.types';

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
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [classes, setClasses] = useState<Class[]>([]);
    const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
    const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
    const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('');
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [periods, setPeriods] = useState<Period[]>([]);
    const [pendingAttendances, setPendingAttendances] = useState<{ [studentId: string]: { status: string, note: string } }>({});
    const [studentParentsMap, setStudentParentsMap] = useState<{ [studentId: string]: Parent[] }>({});
    const [timeAttendanceData, setTimeAttendanceData] = useState<{ [studentCode: string]: { checkIn: string | null, checkOut: string | null } }>({});
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

    useEffect(() => {
        fetchSchoolYears();
    }, []);

    useEffect(() => {
        if (selectedSchoolYear) {
            fetchClassesAndStudents();
        }
    }, [selectedSchoolYear]);

    // ✅ CẬP NHẬT: Khi đổi lớp, load danh sách học sinh và reset các selection
    useEffect(() => {
        if (selectedClass) {
            fetchStudentsByClass(selectedClass);
            setSelectedSubject(''); // Reset subject selection
            setPendingAttendances({}); // Reset pending attendances
        } else {
            setStudents([]);
            setStudentParentsMap({});
            setPendingAttendances({});
            setSelectedSubject('');
        }
    }, [selectedClass]);

    // ✅ CẬP NHẬT: Khi đổi ngày hoặc lớp, load subjects và periods
    useEffect(() => {
        if (selectedClass && selectedDate) {
            fetchSubjectsByClassAndDate();
            fetchPeriodsByClass();
        } else {
            setSubjects([]);
            setPeriods([]);
        }
    }, [selectedClass, selectedDate]);

    // ✅ CẬP NHẬT: Khi đổi subject, load attendance data
    useEffect(() => {
        if (selectedClass && selectedDate && selectedSubject) {
            fetchAttendancesByClassDateSubject();
            fetchTimeAttendanceData();
            fetchLeaveRequests();
        } else {
            setAttendances([]);
            setTimeAttendanceData({});
            setLeaveRequests([]);
        }
    }, [selectedClass, selectedDate, selectedSubject, students]);

    const fetchSchoolYears = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(API_ENDPOINTS.SCHOOL_YEARS, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const years = Array.isArray(response.data) ? response.data : response.data.data || [];
            setSchoolYears(years);
            
            const activeYear = years.find((year: SchoolYear) => year.isActive);
            if (activeYear) {
                setSelectedSchoolYear(activeYear._id);
            } else if (years.length > 0) {
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
                toast.error('Bạn chưa đăng nhập!');
                return;
            }
            const userResponse = await axios.get(API_ENDPOINTS.CURRENT_USER, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const role = userResponse.data.role;

            let classesData: Class[] = [];
            if (role === 'admin' || role === 'superadmin') {
                const response = await axios.get(API_ENDPOINTS.CLASSES, {
                    params: { 
                        schoolYear: selectedSchoolYear,
                        populate: 'homeroomTeachers'
                    },
                    headers: { Authorization: `Bearer ${token}` }
                });
                classesData = Array.isArray(response.data) ? response.data : response.data.data || [];
                setClasses(classesData);
                setSelectedClass(classesData.length > 0 ? classesData[0]._id : '');
            } else if (role === 'teacher') {
                const teachersRes = await axios.get(API_ENDPOINTS.TEACHERS, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const teachers = Array.isArray(teachersRes.data) ? teachersRes.data : teachersRes.data.data || [];
                const user = userResponse.data;
                const teacher = teachers.find((t: Teacher & { user?: { _id: string } }) => t.user && t.user._id === user._id);
                if (!teacher) {
                    toast.error('Không tìm thấy giáo viên tương ứng với tài khoản này!');
                    return;
                }
                setCurrentTeacher(teacher);

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

                const homeroomClasses = allClasses.filter((cls: Class & { homeroomTeachers?: Teacher[] }) =>
                    cls.homeroomTeachers?.some((t: Teacher) => t._id === teacher._id)
                );

                setClasses(homeroomClasses);
                setSelectedClass(homeroomClasses.length > 0 ? homeroomClasses[0]._id : '');
            } else {
                toast.error('Bạn không có quyền truy cập chức năng này!');
                return;
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách lớp học:', error);
        }
    };

    // ✅ THÊM: Fetch subjects theo class và date
    const fetchSubjectsByClassAndDate = async () => {
        try {
            const token = localStorage.getItem('token');
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const response = await axios.get(`${API_ENDPOINTS.ATTENDANCES}/subjects/${selectedClass}/${dateStr}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubjects(response.data.subjects || []);
        } catch (error) {
            console.error('Lỗi khi tải danh sách môn học:', error);
            setSubjects([]);
        }
    };

    // ✅ THÊM: Fetch periods theo class
    const fetchPeriodsByClass = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_ENDPOINTS.ATTENDANCES}/periods/${selectedClass}/${selectedSchoolYear}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPeriods(response.data.periods || []);
        } catch (error) {
            console.error('Lỗi khi tải danh sách tiết học:', error);
            setPeriods([]);
        }
    };

    const fetchStudentsByClass = async (classId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(API_ENDPOINTS.STUDENTS_BY_CLASS, {
                params: { classId },
                headers: { Authorization: `Bearer ${token}` }
            });            
            let studentsArr = [];
            if (Array.isArray(response.data)) {
                studentsArr = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                studentsArr = response.data.data;
            } else {
                studentsArr = [];
            }
            setStudents(studentsArr);

            const familiesRes = await axios.get(API_ENDPOINTS.FAMILIES, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const families: Family[] = Array.isArray(familiesRes.data) ? familiesRes.data : familiesRes.data.data || [];
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

    // ✅ CẬP NHẬT: Fetch attendances theo class, date, subject
    const fetchAttendancesByClassDateSubject = async () => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_ENDPOINTS.ATTENDANCES}/by-class-date-subject/${selectedClass}/${dateStr}/${selectedSubject}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = Array.isArray(response.data)
                ? response.data
                : Array.isArray(response.data.data)
                    ? response.data.data
                    : [];
            setAttendances(data);
        } catch (error) {
            console.error('Lỗi khi tải danh sách điểm danh:', error);
            setAttendances([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTimeAttendanceData = async () => {
        if (!students.length || !selectedDate) return;
        
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const studentCodes = students.map(student => student.studentCode).filter(Boolean);
        
        if (studentCodes.length === 0) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(API_ENDPOINTS.TIME_ATTENDANCE_BY_DATE, {
                params: {
                    date: dateStr,
                    studentCodes: studentCodes.join(',')
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setTimeAttendanceData(response.data || {});
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu chấm công:', error);
            setTimeAttendanceData({});
        }
    };

    const fetchLeaveRequests = async () => {
        if (!students.length || !selectedDate) return;
        
        const studentIds = students.map(student => student._id).filter(Boolean);
        
        if (studentIds.length === 0) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(API_ENDPOINTS.LEAVE_REQUESTS, {
                params: {
                    limit: 1000
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const allLeaveRequests = Array.isArray(response.data) 
                ? response.data 
                : response.data.docs || response.data.data || [];
            
            const classLeaveRequests = allLeaveRequests.filter((lr: LeaveRequest) => {
                const studentIdStr = lr.student?._id?.toString();
                const directMatch = studentIds.includes(lr.student?._id);
                const stringMatch = studentIds.includes(studentIdStr);
                return directMatch || stringMatch;
            });
            
            setLeaveRequests(classLeaveRequests);
        } catch (error) {
            console.error('Lỗi khi tải danh sách đơn xin nghỉ:', error);
            setLeaveRequests([]);
        }
    };

    const getAttendanceByStudent = (studentId: string) => {
        return attendances.find(a => {
            const aStudentId = a.student?._id?.toString();
            const inputStudentId = studentId?.toString();
            return aStudentId === inputStudentId;
        });
    };

    const getLeaveRequestByStudent = (studentId: string) => {
        return leaveRequests.find(lr => {
            const lrStudentId = lr.student?._id?.toString();
            const inputStudentId = studentId?.toString();
            
            if (lrStudentId !== inputStudentId) return false;
            
            const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
            
            const leaveStart = new Date(lr.startDate);
            const leaveEnd = new Date(lr.endDate);
            
            const leaveStartVN = new Date(leaveStart.getTime() + (7 * 3600 * 1000));
            const leaveEndVN = new Date(leaveEnd.getTime() + (7 * 3600 * 1000));
            
            const leaveStartDateStr = leaveStartVN.toISOString().split('T')[0];
            const leaveEndDateStr = leaveEndVN.toISOString().split('T')[0];
            
            const isInRange = selectedDateStr >= leaveStartDateStr && selectedDateStr <= leaveEndDateStr;
            
            return isInRange;
        });
    };

    const getLeaveRequestReason = (leaveRequest: LeaveRequest | undefined) => {
        if (!leaveRequest) return '';
        
        const reasonMap: {[key: string]: string} = {
            'sick': 'Con bị ốm',
            'family': 'Gia đình có việc bận',
            'bereavement': 'Gia đình có việc hiếu',
            'other': 'Lý do khác'
        };
        
        const reasonText = reasonMap[leaveRequest.reason] || leaveRequest.reason;
        
        if (leaveRequest.reason === 'other' && leaveRequest.description) {
            return `${reasonText}: ${leaveRequest.description}`;
        }
        
        return reasonText;
    };

    const getLeaveTypeText = (leaveType: string) => {
        const typeMap: {[key: string]: string} = {
            'full_day': 'Cả ngày',
            'morning': 'Buổi sáng',
            'afternoon': 'Buổi chiều'
        };
        return typeMap[leaveType] || leaveType;
    };

    const getLeaveRequestInfo = (leaveRequest: LeaveRequest | undefined) => {
        if (!leaveRequest) return '';
        
        const reason = getLeaveRequestReason(leaveRequest);
        const leaveType = getLeaveTypeText(leaveRequest.leaveType);
        
        const startDate = new Date(leaveRequest.startDate);
        const endDate = new Date(leaveRequest.endDate);
        
        const startDateVN = new Date(startDate.getTime() + (7 * 3600 * 1000));
        const endDateVN = new Date(endDate.getTime() + (7 * 3600 * 1000));
        
        const startDateStr = startDateVN.toISOString().split('T')[0];
        const endDateStr = endDateVN.toISOString().split('T')[0];
        
        const isSameDay = startDateStr === endDateStr;
        
        if (isSameDay && leaveRequest.leaveType !== 'full_day') {
            return `${reason} (${leaveType})`;
        }
        
        return reason;
    };

    const getCheckInTime = (student: Student, attendance: Attendance | undefined) => {
        const timeAttendanceCheckIn = timeAttendanceData[student.studentCode]?.checkIn;
        if (timeAttendanceCheckIn) {
            return timeAttendanceCheckIn;
        }
        
        if (attendance?.checkIn) {
            return attendance.checkIn;
        }

        const pending = pendingAttendances[student._id];
        if (pending?.status === 'present') {
            return new Date().toTimeString().slice(0, 5);
        }

        return '';
    };

    const getCheckOutTime = (student: Student, attendance: Attendance | undefined) => {
        const timeAttendanceCheckOut = timeAttendanceData[student.studentCode]?.checkOut;
        if (timeAttendanceCheckOut) {
            return timeAttendanceCheckOut;
        }
        
        if (attendance?.checkOut) {
            return attendance.checkOut;
        }

        return '';
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

    // ✅ CẬP NHẬT: Handle confirm attendance cho period
    const handleConfirmAttendance = async () => {
        try {
            const token = localStorage.getItem('token');
            const userResponse = await axios.get(API_ENDPOINTS.CURRENT_USER, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const role = userResponse.data.role;

            if (role !== 'teacher') {
                toast.error('Chỉ giáo viên mới có thể thực hiện điểm danh!');
                return;
            }

            if (!currentTeacher?._id) {
                toast.error('Không tìm thấy thông tin giáo viên!');
                return;
            }

            if (!selectedSubject) {
                toast.error('Vui lòng chọn môn học!');
                return;
            }

            // Sau khi xác định selectedSubject, tìm thông tin giáo viên của môn học đó
            const selectedSubjectData = subjects.find(s => s._id === selectedSubject);
            const isCurrentTeacherOfSubject = selectedSubjectData && currentTeacher && selectedSubjectData.teachers.some(t => t._id === currentTeacher._id);

            if (!selectedSubjectData) {
                toast.error('Không tìm thấy thông tin môn học!');
                return;
            }

            if (!isCurrentTeacherOfSubject) {
                toast.error('Bạn không phải giáo viên của môn học này!');
                return;
            }

            // Tìm period number từ timetable
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const timetableResponse = await axios.get(`${API_ENDPOINTS.ATTENDANCES}/timetable-slots/${selectedClass}/${dateStr}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const timetableSlots = timetableResponse.data.timetableSlots || [];
            const subjectSlot = timetableSlots.find((slot: TimetableSlot) => slot.subject._id === selectedSubject);
            
            if (!subjectSlot) {
                toast.error('Không tìm thấy thông tin tiết học cho môn học này!');
                return;
            }

            // Tìm period number từ startTime
            const period = periods.find(p => p.startTime === subjectSlot.timeSlot.startTime);
            if (!period) {
                toast.error('Không tìm thấy thông tin tiết học!');
                return;
            }

            const attendanceData: AttendanceData[] = [];
            for (const student of students) {
                const pending = pendingAttendances[student._id];
                const leaveRequest = getLeaveRequestByStudent(student._id);
                const hasLeaveRequest = !!leaveRequest;
                
                let finalStatus = pending?.status;
                let finalNote = pending?.note;
                
                if (hasLeaveRequest && !finalStatus) {
                    finalStatus = 'excused';
                    finalNote = getLeaveRequestReason(leaveRequest);
                }
                
                if (finalStatus) {
                    attendanceData.push({
                        studentId: student._id,
                        status: finalStatus as AttendanceStatus,
                        note: finalNote || '',
                        checkIn: getCheckInTime(student, getAttendanceByStudent(student._id)),
                        checkOut: getCheckOutTime(student, getAttendanceByStudent(student._id))
                    });
                }
            }

            if (attendanceData.length === 0) {
                toast.error('Không có dữ liệu điểm danh để lưu!');
                return;
            }

            // Gọi API để lưu attendance
            await axios.post(`${API_ENDPOINTS.ATTENDANCES}/period`, {
                classId: selectedClass,
                date: format(selectedDate, 'yyyy-MM-dd'),
                subjectId: selectedSubject,
                periodNumber: period.periodNumber,
                attendances: attendanceData
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            fetchAttendancesByClassDateSubject();
            setPendingAttendances({});
            toast.success('Cập nhật điểm danh thành công!');
        } catch (error) {
            console.error('Error updating attendance:', error);
            toast.error('Có lỗi khi cập nhật điểm danh!');
        }
    };

    const selectedSubjectData = useMemo(() => subjects.find(s => s._id === selectedSubject), [subjects, selectedSubject]);
    const isCurrentTeacherOfSubject = useMemo(() => {
        return selectedSubjectData && currentTeacher && selectedSubjectData.teachers.some(t => t._id === currentTeacher._id);
    }, [selectedSubjectData, currentTeacher]);

    return (
        <div className="w-full mx-auto p-4 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-row items-center justify-between mb-2">
                        <h2 className="text-xl font-semibold">Điểm danh học sinh</h2>
                        <div className="flex flex-row min-w-[180px] items-end gap-2">
                            <label className="block text-sm font-medium mb-2 text-gray-700">Năm học</label>
                            <Select
                                value={selectedSchoolYear}
                                onValueChange={setSelectedSchoolYear}
                            >
                                <SelectTrigger className="h-10 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <SelectValue placeholder="Chọn năm học" />
                                </SelectTrigger>
                                <SelectContent>
                                    {schoolYears.map(year => (
                                        <SelectItem key={year._id} value={year._id}>
                                            {year.name || year.code}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-row gap-4 items-start justify-start">
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium mb-2 text-gray-700">Ngày</label>
                            <div className="h-10">
                                <DatePicker
                                    date={selectedDate}
                                    setDate={(date) => date && setSelectedDate(date)}
                                    className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium mb-2 text-gray-700">Lớp</label>
                            <Select
                                value={selectedClass}
                                onValueChange={setSelectedClass}
                            >
                                <SelectTrigger className="h-10 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium mb-2 text-gray-700">Môn học</label>
                            <Select
                                value={selectedSubject}
                                onValueChange={setSelectedSubject}
                                disabled={!selectedClass || !selectedDate || subjects.length === 0}
                            >
                                <SelectTrigger className="h-10 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <SelectValue placeholder="Chọn môn học" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map(subject => (
                                        <SelectItem key={subject._id} value={subject._id}>
                                            {subject.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <CardDescription>Quản lý thông tin điểm danh học sinh theo từng tiết học</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* ✅ THÊM: Hiển thị thông báo khi chưa chọn môn học */}
                    {!selectedSubject ? (
                        <div className="flex justify-center items-center h-40 text-lg text-[#757575]">
                            Vui lòng chọn môn học để bắt đầu điểm danh
                        </div>
                    ) : (
                        <>
                            {/* Phần bảng điểm danh và các thành phần khác giữ nguyên như cũ */}
                            {selectedSubject && (
                                <div className="mb-4 p-4 bg-gray-100 rounded-lg">
                                    <h3 className="font-semibold mb-2">Thông tin tiết học</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium">Môn học:</span> {subjects.find(s => s._id === selectedSubject)?.name}
                                        </div>
                                        <div>
                                            <span className="font-medium">Giáo viên:</span> {subjects.find(s => s._id === selectedSubject)?.teachers.map(t => t.fullname).join(', ')}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ✅ THÊM: Hiển thị thông báo khi không phải giáo viên của tiết */}
                            {!isCurrentTeacherOfSubject && selectedSubject && (
                                <div className="flex justify-center items-center h-20 text-base text-red-500 font-medium">
                                    Bạn không phải giáo viên của tiết này, không thể điểm danh.
                                </div>
                            )}

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
                                                    const leaveRequest = getLeaveRequestByStudent(student._id);
                                                    const hasLeaveRequest = !!leaveRequest;
                                                    
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
                                                                    value={getCheckInTime(student, attendance)}
                                                                    readOnly
                                                                    className="cursor-not-allowed text-center"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <input
                                                                    type="time"
                                                                    value={getCheckOutTime(student, attendance)}
                                                                    readOnly
                                                                    className="cursor-not-allowed text-center "
                                                                />
                                                            </TableCell>
                                                            {['present', 'absent', 'late', 'excused'].map((status) => {
                                                                const isExcusedStatus = status === 'excused';
                                                                const isChecked = (pendingAttendances[student._id]?.status ?? attendance?.status) === status;
                                                                const shouldBeDisabled = isExcusedStatus && hasLeaveRequest;
                                                                const shouldBeChecked = isExcusedStatus && hasLeaveRequest ? true : isChecked;
                                                                
                                                                return (
                                                                    <TableCell key={status} className="text-center">
                                                                        <Checkbox
                                                                            checked={shouldBeChecked}
                                                                            disabled={shouldBeDisabled}
                                                                            onCheckedChange={(checked) => {
                                                                                if (!shouldBeDisabled) {
                                                                                    handlePendingStatusChange(student._id, status, checked as boolean);
                                                                                }
                                                                            }}
                                                                        />
                                                                    </TableCell>
                                                                );
                                                            })}
                                                            <TableCell>
                                                                {hasLeaveRequest ? (
                                                                    <div className="text-sm">
                                                                        <div className="font-medium text-[#002855]">PH tạo đơn xin nghỉ</div>
                                                                        <div className="text-gray-600">{getLeaveRequestInfo(leaveRequest)}</div>
                                                                    </div>
                                                                ) : ['absent', 'late', 'excused'].includes(pendingAttendances[student._id]?.status || attendance?.status || '') ? (
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
                            {/* Nút xác nhận điểm danh */}
                            <div className="flex mt-5 justify-end">
                                <Button 
                                    onClick={handleConfirmAttendance}
                                    disabled={!selectedSubject || !isCurrentTeacherOfSubject}
                                >
                                    Xác nhận điểm danh
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AttendanceList;

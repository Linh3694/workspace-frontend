import React, { useState, useEffect } from 'react';
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
    Family
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
    const [classes, setClasses] = useState<Class[]>([]);
    const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
    const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
    const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('');
    const [students, setStudents] = useState<Student[]>([]);
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

    // 1. Khi đổi lớp: load danh sách học sinh và reset pending attendances
    useEffect(() => {
        if (selectedClass) {
            fetchStudentsByClass(selectedClass);
            setPendingAttendances({}); // Reset pending attendances khi đổi lớp
        } else {
            // Nếu không có lớp được chọn, xóa danh sách học sinh
            setStudents([]);
            setStudentParentsMap({});
            setPendingAttendances({});
        }
    }, [selectedClass]);
    // 2. Khi đổi lớp hoặc ngày: load lại điểm danh, timeAttendance và leave requests
    useEffect(() => {
        if (selectedClass && selectedDate) {
            fetchAttendances();
            fetchTimeAttendanceData();
            fetchLeaveRequests();
        } else {
            // Nếu chưa chọn lớp hoặc ngày, xóa danh sách điểm danh
            setAttendances([]);
            setTimeAttendanceData({});
            setLeaveRequests([]);
        }
    }, [selectedClass, selectedDate, students]); // Thêm students vào dependency để fetch khi có students mới

    const fetchSchoolYears = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(API_ENDPOINTS.SCHOOL_YEARS, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const years = Array.isArray(response.data) ? response.data : response.data.data || [];
            setSchoolYears(years);
            
            // Tìm năm học đang active, nếu không có thì chọn năm đầu tiên
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
            // Admin và superadmin có thể xem tất cả các lớp trong năm học
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
                // Lấy tất cả teachers
                const teachersRes = await axios.get(API_ENDPOINTS.TEACHERS, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const teachers = Array.isArray(teachersRes.data) ? teachersRes.data : teachersRes.data.data || [];
                // Tìm teacher có user._id === user._id hiện tại
                const user = userResponse.data;
                const teacher = teachers.find((t: Teacher & { user?: { _id: string } }) => t.user && t.user._id === user._id);
                if (!teacher) {
                    toast.error('Không tìm thấy giáo viên tương ứng với tài khoản này!');
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
                const homeroomClasses = allClasses.filter((cls: Class & { homeroomTeachers?: Teacher[] }) =>
                    cls.homeroomTeachers?.some((t: Teacher) => t._id === teacher._id)
                );

                setClasses(homeroomClasses);
                setSelectedClass(homeroomClasses.length > 0 ? homeroomClasses[0]._id : '');
            } else {
                // Nếu không phải admin, superadmin hoặc teacher thì không có quyền truy cập
                toast.error('Bạn không có quyền truy cập chức năng này!');
                return;
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách lớp học:', error);
        }
    };

    const fetchStudentsByClass = async (classId: string) => {
        try {
            const token = localStorage.getItem('token');
            // Use the attendance endpoint to get students by class
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
        
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const studentIds = students.map(student => student._id).filter(Boolean);
        
        console.log('Fetching leave requests with params:', {
            selectedDate: selectedDate,
            dateStr: dateStr,
            studentIds: studentIds.length
        });
        
        if (studentIds.length === 0) return;

        try {
            const token = localStorage.getItem('token');
            // Fetch ALL leave requests (remove date filter to get everything, let frontend filter)
            const response = await axios.get(API_ENDPOINTS.LEAVE_REQUESTS, {
                params: {
                    limit: 1000 // Get a large number of records
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('Raw response from backend:', response.data);
            
            // Handle paginated response correctly
            const allLeaveRequests = Array.isArray(response.data) 
                ? response.data 
                : response.data.docs || response.data.data || [];
            
            console.log('All leave requests from backend:', allLeaveRequests);
            allLeaveRequests.forEach((lr: LeaveRequest, index: number) => {
                console.log(`Backend Leave Request ${index + 1}:`, {
                    id: lr._id,
                    reason: lr.reason,
                    leaveType: lr.leaveType,
                    startDate: lr.startDate,
                    endDate: lr.endDate,
                    student: lr.student?.name,
                    studentId: lr.student?._id
                });
            });
            
            // Filter leave requests for students in current class
            const classLeaveRequests = allLeaveRequests.filter((lr: LeaveRequest) => {
                const studentIdStr = lr.student?._id?.toString();
                const directMatch = studentIds.includes(lr.student?._id);
                const stringMatch = studentIds.includes(studentIdStr);
                console.log(`Filtering student ${lr.student?.name}:`, {
                    studentId: lr.student?._id,
                    studentIdStr,
                    directMatch,
                    stringMatch,
                    result: directMatch || stringMatch
                });
                return directMatch || stringMatch;
            });
            
            console.log('Filtered leave requests for class:', classLeaveRequests);
            classLeaveRequests.forEach((lr: LeaveRequest, index: number) => {
                console.log(`Class Leave Request ${index + 1}:`, {
                    reason: lr.reason,
                    leaveType: lr.leaveType,
                    startDate: lr.startDate,
                    endDate: lr.endDate,
                    student: lr.student?.name
                });
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
            
            // Kiểm tra xem leave request có cover ngày được chọn không
            const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
            
            // Convert dates to simple date strings for comparison (ignore time)
            const leaveStart = new Date(lr.startDate);
            const leaveEnd = new Date(lr.endDate);
            
            // Get date parts in Vietnam timezone (GMT+7)
            const leaveStartVN = new Date(leaveStart.getTime() + (7 * 3600 * 1000));
            const leaveEndVN = new Date(leaveEnd.getTime() + (7 * 3600 * 1000));
            
            const leaveStartDateStr = leaveStartVN.toISOString().split('T')[0];
            const leaveEndDateStr = leaveEndVN.toISOString().split('T')[0];
            
            // Check if selected date falls within leave period (inclusive)
            const isInRange = selectedDateStr >= leaveStartDateStr && selectedDateStr <= leaveEndDateStr;
            
            console.log('Checking leave request overlap:', {
                studentName: lr.student?.name,
                selectedDate: selectedDateStr,
                leaveStart: leaveStart.toISOString(),
                leaveEnd: leaveEnd.toISOString(),
                leaveStartDateStr,
                leaveEndDateStr,
                isInRange
            });
            
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
        
        console.log('Leave request data:', leaveRequest);
        console.log('Leave type:', leaveRequest.leaveType);
        
        const reason = getLeaveRequestReason(leaveRequest);
        const leaveType = getLeaveTypeText(leaveRequest.leaveType);
        
        // Kiểm tra xem có phải nghỉ 1 ngày không - sử dụng UTC dates để tránh timezone issues
        const startDate = new Date(leaveRequest.startDate);
        const endDate = new Date(leaveRequest.endDate);
        
        // Convert to Vietnam timezone và so sánh ngày
        const startDateVN = new Date(startDate.getTime() + (7 * 3600 * 1000));
        const endDateVN = new Date(endDate.getTime() + (7 * 3600 * 1000));
        
        const startDateStr = startDateVN.toISOString().split('T')[0];
        const endDateStr = endDateVN.toISOString().split('T')[0];
        
        const isSameDay = startDateStr === endDateStr;
        
        console.log('Start date:', startDate, 'VN:', startDateVN, 'DateStr:', startDateStr);
        console.log('End date:', endDate, 'VN:', endDateVN, 'DateStr:', endDateStr);
        console.log('Is same day:', isSameDay);
        console.log('Leave type text:', leaveType);
        
        if (isSameDay && leaveRequest.leaveType !== 'full_day') {
            console.log('Returning with leave type:', `${reason} (${leaveType})`);
            return `${reason} (${leaveType})`;
        }
        
        console.log('Returning reason only:', reason);
        return reason;
    };

    const getCheckInTime = (student: Student, attendance: Attendance | undefined) => {
        // Ưu tiên 1: Dữ liệu từ timeAttendance (máy chấm công)
        const timeAttendanceCheckIn = timeAttendanceData[student.studentCode]?.checkIn;
        if (timeAttendanceCheckIn) {
            return timeAttendanceCheckIn;
        }
        
        // Ưu tiên 2: Dữ liệu attendance manual đã có
        if (attendance?.checkIn) {
            return attendance.checkIn;
        }

        // Ưu tiên 3: Nếu đang pending "present" thì lấy thời gian hiện tại
        const pending = pendingAttendances[student._id];
        if (pending?.status === 'present') {
            return new Date().toTimeString().slice(0, 5); // HH:MM format
        }

        return '';
    };

    const getCheckOutTime = (student: Student, attendance: Attendance | undefined) => {
        // Ưu tiên 1: Dữ liệu từ timeAttendance (máy chấm công)
        const timeAttendanceCheckOut = timeAttendanceData[student.studentCode]?.checkOut;
        if (timeAttendanceCheckOut) {
            return timeAttendanceCheckOut;
        }
        
        // Ưu tiên 2: Dữ liệu attendance manual đã có
        if (attendance?.checkOut) {
            return attendance.checkOut;
        }

        // Không tự động điền thời gian check-out khi có mặt
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

    const handleConfirmAttendance = async () => {
        try {
            const token = localStorage.getItem('token');
            const userResponse = await axios.get(API_ENDPOINTS.CURRENT_USER, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const role = userResponse.data.role;

            // Kiểm tra quyền: chỉ teacher mới được điểm danh
            if (role !== 'teacher') {
                toast.error('Chỉ giáo viên mới có thể thực hiện điểm danh!');
                return;
            }

            // Kiểm tra có currentTeacher không
            if (!currentTeacher?._id) {
                toast.error('Không tìm thấy thông tin giáo viên!');
                return;
            }

            for (const student of students) {
                const pending = pendingAttendances[student._id];
                const leaveRequest = getLeaveRequestByStudent(student._id);
                const hasLeaveRequest = !!leaveRequest;
                
                // Nếu học sinh có đơn xin nghỉ, tự động set status thành "excused"
                let finalStatus = pending?.status;
                let finalNote = pending?.note;
                
                if (hasLeaveRequest && !finalStatus) {
                    finalStatus = 'excused';
                    finalNote = getLeaveRequestReason(leaveRequest);
                }
                
                if (!finalStatus) continue;

                // Kiểm tra đã có attendance chưa
                const attendance = attendances.find(a => a.student._id === student._id);

                if (attendance) {
                    // Update
                    await axios.put(API_ENDPOINTS.ATTENDANCE(attendance._id), {
                        status: finalStatus,
                        note: finalNote
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } else {
                    // Create mới với teacher ID
                    const attendanceData = {
                        student: student._id,
                        class: selectedClass,
                        date: selectedDate,
                        status: finalStatus,
                        note: finalNote,
                        teacher: currentTeacher._id
                    };

                    await axios.post(API_ENDPOINTS.ATTENDANCES, attendanceData, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            }
            fetchAttendances();
            setPendingAttendances({});
            toast.success('Cập nhật điểm danh thành công!');
        } catch (error) {
            console.error('Error updating attendance:', error);
            toast.error('Có lỗi khi cập nhật điểm danh!');
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
                    <div className="flex flex-row gap-4 mb-6 items-start justify-start">
                        <div className="flex flex-col">
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
                            <label className="block text-sm font-medium mb-2 text-gray-700">Ngày</label>
                            <div className="h-10">
                                <DatePicker
                                    date={selectedDate}
                                    setDate={(date) => date && setSelectedDate(date)}
                                    className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
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
                                                                {/* <div className="text-xs text-gray-500 mt-1">
                                                                    Trạng thái: {leaveRequest?.status === 'pending' ? 'Chờ duyệt' : 
                                                                                leaveRequest?.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                                                                </div> */}
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
                    <div className="flex mt-5 justify-end">
                        <Button onClick={handleConfirmAttendance}>Xác nhận</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AttendanceList;

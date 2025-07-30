import React, { useState, useEffect, useMemo } from 'react';
import axios, { AxiosError } from 'axios';
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
import { API_ENDPOINTS, BASE_URL } from '../../config/api';
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

// Component điểm danh chính
const AttendanceComponent: React.FC = () => {
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

    // ✅ CẬP NHẬT: Khi đổi subject, load attendance data với debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (selectedClass && selectedDate && selectedSubject) {
                fetchAttendancesByClassDateSubject();
                fetchTimeAttendanceData();
                fetchLeaveRequests();
            } else {
                setAttendances([]);
                setTimeAttendanceData({});
                setLeaveRequests([]);
            }
        }, 300); // 300ms debounce
        
        return () => clearTimeout(timeoutId);
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
                // Lấy teacher object từ API (đảm bảo teachingAssignments đã populate đủ class & subjects)
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

                // Lấy danh sách lớp từ teachingAssignments
                const assignedClasses = teacher.teachingAssignments?.map((a: { class: Class }) => a.class) || [];
                setClasses(assignedClasses);
                setSelectedClass(assignedClasses.length > 0 ? assignedClasses[0]._id : '');
            } else {
                toast.error('Bạn không có quyền truy cập chức năng này!');
                return;
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách lớp học:', error);
        }
    };

    // ✅ CẬP NHẬT: Fetch subjects theo class, date và timetable với improved fallback
    const fetchSubjectsByClassAndDate = async () => {
        if (!currentTeacher || !selectedClass || !selectedDate) {
            setSubjects([]);
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            
            // Lấy danh sách môn từ teachingAssignments
            const assignment = currentTeacher.teachingAssignments?.find(a => a.class._id === selectedClass);
            const teachingSubjects = assignment?.subjects || [];
            
            // Nếu không có môn học để dạy, return empty
            if (teachingSubjects.length === 0) {
                setSubjects([]);
                return;
            }
            
            // Lấy timetable slots cho ngày đó
            console.log('🔍 Fetching timetable slots for subjects filter:', { selectedClass, dateStr });
            const timetableResponse = await axios.get(`${API_ENDPOINTS.ATTENDANCES}/timetable-slots/${selectedClass}/${dateStr}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const timetableSlots = timetableResponse.data.timetableSlots || [];
            console.log('📅 Timetable slots found:', timetableSlots.length);
            
            // Lọc ra những môn học mà giáo viên dạy VÀ có trong timetable ngày đó
            const availableSubjects = teachingSubjects.filter(teachingSubject => {
                const hasSlotToday = timetableSlots.some((slot: TimetableSlot) => 
                    slot.subject._id === teachingSubject._id
                );
                return hasSlotToday;
            });
            
            let finalSubjects = [];
            
            // Nếu có timetable slots, ưu tiên hiển thị theo timetable
            if (availableSubjects.length > 0) {
                finalSubjects = availableSubjects.map(sub => ({
                    ...sub,
                    teachers: [{ _id: currentTeacher._id, fullname: currentTeacher.fullname }]
                }));
                console.log('📚 Available subjects from timetable:', finalSubjects);
            } else {
                // Fallback: Hiển thị tất cả môn mà giáo viên dạy nếu không có timetable slots
                // Điều này hữu ích khi schedule chưa được setup hoặc có lỗi timetable
                finalSubjects = teachingSubjects.map(sub => ({
                    ...sub,
                    teachers: [{ _id: currentTeacher._id, fullname: currentTeacher.fullname }]
                }));
                console.log('📚 Fallback: showing all teaching subjects:', finalSubjects);
            }
            
            setSubjects(finalSubjects);
            
            // Reset selected subject nếu không còn available
            if (selectedSubject && !finalSubjects.some(s => s._id === selectedSubject)) {
                setSelectedSubject('');
            }
            
        } catch (error) {
            console.error('Lỗi khi tải danh sách môn học theo thời khóa biểu:', error);
            
            // Fallback: vẫn hiển thị tất cả môn mà giáo viên dạy
            const assignment = currentTeacher.teachingAssignments?.find(a => a.class._id === selectedClass);
            const mappedSubjects = (assignment?.subjects || []).map(sub => ({
                ...sub,
                teachers: [{ _id: currentTeacher._id, fullname: currentTeacher.fullname }]
            }));
            setSubjects(mappedSubjects);
            console.log('📚 Error fallback: showing all teaching subjects:', mappedSubjects);
        }
    };

    // ✅ THÊM: Fetch periods theo class
    const fetchPeriodsByClass = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_ENDPOINTS.ATTENDANCES}/periods/${selectedClass}/${selectedSchoolYear}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const periodsData = response.data.periods || [];
            console.log('⏰ Periods found:', periodsData);
            setPeriods(periodsData);
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
            
            if (!token) {
                console.error('Không tìm thấy token xác thực');
                toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                setAttendances([]);
                return;
            }
            
            const response = await axios.get(`${API_ENDPOINTS.ATTENDANCES}/by-class-date-subject/${selectedClass}/${dateStr}/${selectedSubject}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = Array.isArray(response.data)
                ? response.data
                : Array.isArray(response.data.data)
                    ? response.data.data
                    : [];
            setAttendances(data);
        } catch (error: unknown) {
            console.error('Lỗi khi tải danh sách điểm danh:', error);
            
            if (error instanceof AxiosError) {
                if (error.response?.status === 401) {
                    toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                } else if (error.response?.status === 403) {
                    toast.error('Bạn không có quyền truy cập thông tin này');
                } else if (error.response?.status === 404) {
                    console.log('Không tìm thấy dữ liệu điểm danh cho tiết học này');
                    // Không hiển thị toast error cho trường hợp này vì có thể là bình thường
                } else {
                    toast.error('Có lỗi khi tải danh sách điểm danh');
                }
            } else {
                toast.error('Có lỗi khi tải danh sách điểm danh');
            }
            
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
            console.log('🔍 Fetching timetable slots for:', { selectedClass, dateStr, selectedSubject });
            
            const timetableResponse = await axios.get(`${API_ENDPOINTS.ATTENDANCES}/timetable-slots/${selectedClass}/${dateStr}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const timetableSlots = timetableResponse.data.timetableSlots || [];
            console.log('📅 Timetable slots found:', timetableSlots.length);
            console.log('📅 Available slots:', timetableSlots.map((slot: TimetableSlot) => ({
                subject: slot.subject?.name,
                subjectId: slot.subject?._id,
                dayOfWeek: slot.timeSlot?.dayOfWeek,
                startTime: slot.timeSlot?.startTime
            })));
            
            const subjectSlot = timetableSlots.find((slot: TimetableSlot) => slot.subject._id === selectedSubject);
            
            if (!subjectSlot) {
                console.error('❌ Subject slot not found for:', selectedSubject);
                console.error('❌ Available subject IDs:', timetableSlots.map((slot: TimetableSlot) => slot.subject?._id));
                toast.error('Không tìm thấy thông tin tiết học cho môn học này! Vui lòng kiểm tra thời khóa biểu.');
                return;
            }

            // Tìm period number từ startTime
            const period = periods.find(p => p.startTime === subjectSlot.timeSlot.startTime);
            if (!period) {
                console.error('❌ Period not found for startTime:', subjectSlot.timeSlot.startTime);
                console.error('❌ Available periods:', periods.map(p => ({ periodNumber: p.periodNumber, startTime: p.startTime })));
                toast.error('Không tìm thấy thông tin tiết học! Vui lòng kiểm tra cấu hình tiết học.');
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
                                <SelectValue placeholder={
                                    !selectedClass || !selectedDate 
                                        ? "Chọn lớp và ngày trước" 
                                        : subjects.length === 0 
                                            ? "Không có tiết học" 
                                            : "Chọn môn học"
                                } />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.length === 0 ? (
                                    <div className="px-2 py-1 text-sm text-gray-500">
                                        Không có tiết học nào cho ngày này
                                    </div>
                                ) : (
                                    subjects.map(subject => (
                                        <SelectItem key={subject._id} value={subject._id}>
                                            {subject.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <CardDescription>Quản lý thông tin điểm danh học sinh theo từng tiết học</CardDescription>
            </CardHeader>
            <CardContent>
                {/* ✅ CẬP NHẬT: Hiển thị thông báo khi chưa chọn môn học hoặc không có môn học */}
                {!selectedSubject ? (
                    <div className="flex justify-center items-center h-40 text-lg text-[#757575]">
                        {subjects.length === 0 ? (
                            selectedClass && selectedDate ? (
                                <div className="text-center">
                                    <div className="text-orange-600 font-medium">
                                        Không có tiết học nào cho ngày {format(selectedDate, 'dd/MM/yyyy')}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-2">
                                        Vui lòng chọn ngày khác hoặc kiểm tra thời khóa biểu
                                    </div>
                                </div>
                            ) : (
                                "Vui lòng chọn lớp và ngày để xem danh sách môn học"
                            )
                        ) : (
                            "Vui lòng chọn môn học để bắt đầu điểm danh"
                        )}
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
                                disabled={!selectedSubject || !isCurrentTeacherOfSubject || subjects.length === 0}
                            >
                                Xác nhận điểm danh
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

// Component báo cáo điểm danh
interface ReportStudentData {
    studentCode: string;
    name: string;
    avatarUrl?: string;
    checkIn: string;
    checkOut: string;
    periods: { [key: number]: string };
}

const AttendanceReportComponent: React.FC = () => {
    const [reportData, setReportData] = useState<ReportStudentData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [classes, setClasses] = useState<Class[]>([]);
    const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
    const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('');
    const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);

    useEffect(() => {
        fetchSchoolYears();
        fetchCurrentTeacher();
    }, []);

    useEffect(() => {
        if (selectedSchoolYear) {
            fetchClasses();
        }
    }, [selectedSchoolYear]);

    useEffect(() => {
        if (selectedClass && selectedDate) {
            fetchReportData();
        }
    }, [selectedClass, selectedDate]);

    const fetchCurrentTeacher = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const userResponse = await axios.get(API_ENDPOINTS.CURRENT_USER, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const role = userResponse.data.role;

            if (role === 'teacher') {
                const teachersRes = await axios.get(API_ENDPOINTS.TEACHERS, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const teachers = Array.isArray(teachersRes.data) ? teachersRes.data : teachersRes.data.data || [];
                const user = userResponse.data;
                const teacher = teachers.find((t: Teacher & { user?: { _id: string } }) => t.user && t.user._id === user._id);
                setCurrentTeacher(teacher || null);
            } else {
                setCurrentTeacher(null);
            }
        } catch (error) {
            console.error('Lỗi khi tải thông tin giáo viên:', error);
        }
    };

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

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(API_ENDPOINTS.CLASSES, {
                params: { 
                    schoolYear: selectedSchoolYear,
                    populate: 'homeroomTeachers'
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            const classesData = Array.isArray(response.data) ? response.data : response.data.data || [];
            setClasses(classesData);
            setSelectedClass(classesData.length > 0 ? classesData[0]._id : '');
        } catch (error) {
            console.error('Lỗi khi tải danh sách lớp học:', error);
        }
    };

    const fetchReportData = async () => {
        if (!selectedClass || !selectedDate) return;
        
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            
            // Lấy danh sách học sinh
                            console.log('🔍 Tải danh sách học sinh cho lớp:', selectedClass);
            let students: Student[] = [];
            
            try {
                const studentsResponse = await axios.get(API_ENDPOINTS.STUDENTS_BY_CLASS, {
                    params: { classId: selectedClass },
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                students = Array.isArray(studentsResponse.data) 
                    ? studentsResponse.data 
                    : studentsResponse.data.data || [];
                console.log('👥 Số học sinh tìm thấy:', students.length);
            } catch (studentError) {
                console.error('❌ Lỗi khi tải danh sách học sinh:', studentError);
                students = [];
                toast.error('Có lỗi khi tải danh sách học sinh');
                
                // Tạo fallback data trống và return sớm
                setReportData([]);
                return;
            }

            // Lấy dữ liệu time attendance
            const studentCodes = students.map((student: Student) => student.studentCode).filter(Boolean);
            let timeAttendanceData: { [studentCode: string]: { checkIn: string | null, checkOut: string | null } } = {};
            
            if (studentCodes.length > 0) {
                try {
                    const timeAttendanceResponse = await axios.get(API_ENDPOINTS.TIME_ATTENDANCE_BY_DATE, {
                        params: {
                            date: dateStr,
                            studentCodes: studentCodes.join(',')
                        },
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    timeAttendanceData = timeAttendanceResponse.data || {};
                } catch (error) {
                    console.log('Không thể lấy dữ liệu time attendance:', error);
                    timeAttendanceData = {};
                }
            }
            
            // Nếu không có học sinh, return data trống
            if (students.length === 0) {
                console.warn('⚠️ Không có học sinh nào trong lớp');
                setReportData([]);
                return;
            }

            // ✅ SỬA LỖI: Tải attendance data theo role
            let allAttendanceData: Attendance[] = [];
            
            try {
                let subjectsToFetch: { _id: string; name: string }[] = [];
                
                // Lấy thông tin user role
                const userResponse = await axios.get(API_ENDPOINTS.CURRENT_USER, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const role = userResponse.data.role;
                
                if (role === 'teacher' && currentTeacher) {
                    // Nếu là giáo viên, chỉ lấy subjects mà giáo viên dạy cho lớp này
                    const assignment = currentTeacher.teachingAssignments?.find(a => a.class._id === selectedClass);
                    subjectsToFetch = assignment?.subjects || [];
                } else {
                    // ✅ SỬA LỖI: Lấy subjects từ timetable thay vì tất cả subjects
                    try {
                        const timetableResponse = await axios.get(`${API_ENDPOINTS.ATTENDANCES}/timetable-slots/${selectedClass}/${dateStr}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        
                        const timetableSlots = timetableResponse.data.timetableSlots || [];
                        console.log('📅 Timetable slots tìm thấy:', timetableSlots.length);
                        
                        // Lấy unique subjects từ timetable
                        const uniqueSubjects = new Map();
                        timetableSlots.forEach((slot: TimetableSlot) => {
                            if (slot.subject && slot.subject._id) {
                                uniqueSubjects.set(slot.subject._id, {
                                    _id: slot.subject._id,
                                    name: slot.subject.name
                                });
                            }
                        });
                        
                        subjectsToFetch = Array.from(uniqueSubjects.values());
                        console.log('📚 Subjects từ timetable:', subjectsToFetch.length);
                    } catch (error) {
                        console.error('Lỗi khi lấy timetable:', error);
                        subjectsToFetch = [];
                    }
                }
                
                console.log('📚 Lấy dữ liệu cho', subjectsToFetch.length, 'môn học');
                
                if (subjectsToFetch.length > 0) {
                    // ✅ SỬA LỖI: Giới hạn số lượng concurrent API calls
                    const BATCH_SIZE = 3; // Giảm xuống 3 API cùng lúc để tránh quá tải
                    const batches = [];
                    
                    for (let i = 0; i < subjectsToFetch.length; i += BATCH_SIZE) {
                        const batch = subjectsToFetch.slice(i, i + BATCH_SIZE);
                        batches.push(batch);
                    }
                    
                    for (const batch of batches) {
                        const attendancePromises = batch.map(async (subject: { _id: string; name: string }) => {
                            // Retry mechanism cho network errors
                            const maxRetries = 2;
                            for (let retry = 0; retry <= maxRetries; retry++) {
                                try {
                                    const response = await axios.get(`${API_ENDPOINTS.ATTENDANCES}/by-class-date-subject/${selectedClass}/${dateStr}/${subject._id}`, {
                                        headers: { Authorization: `Bearer ${token}` },
                                        timeout: 8000 // 8 giây timeout
                                    });
                                    const data = Array.isArray(response.data) ? response.data : response.data.data || [];
                                    return data;
                                } catch (error: unknown) {
                                    if (error instanceof AxiosError) {
                                        if (error.response?.status === 404) {
                                            // 404 là bình thường - có thể chưa có attendance cho môn này
                                            console.log('📝 Chưa có attendance cho môn:', subject.name);
                                            return [];
                                        } else if (error.response?.status === 401 || error.response?.status === 403) {
                                            // Auth errors không cần retry
                                            console.error('🔒 Auth error cho môn:', subject.name, error.response.status);
                                            return [];
                                        } else if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
                                            // Network errors có thể retry
                                            if (retry < maxRetries) {
                                                console.log(`🔄 Retry ${retry + 1}/${maxRetries} cho môn:`, subject.name);
                                                await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
                                                continue;
                                            } else {
                                                console.error('💀 Hết retry cho môn:', subject.name, error.code);
                                                return [];
                                            }
                                        } else {
                                            console.error('❌ Lỗi khi tải attendance cho môn:', subject.name, error.response?.status || error.message);
                                            return [];
                                        }
                                    } else {
                                        console.error('❌ Lỗi không xác định cho môn:', subject.name, error);
                                        return [];
                                    }
                                }
                            }
                            return [];
                        });
                        
                        const batchResults = await Promise.all(attendancePromises);
                        allAttendanceData = [...allAttendanceData, ...batchResults.flat()];
                        
                        // Thêm delay nhỏ giữa các batch để tránh quá tải server
                        if (batches.indexOf(batch) < batches.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                    }
                    
                    console.log('Lấy được attendance data:', allAttendanceData.length);
                } else {
                    console.log('Không có môn học nào để lấy dữ liệu');
                    allAttendanceData = [];
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu attendance:', error);
                allAttendanceData = [];
                toast.error('Có lỗi khi tải dữ liệu điểm danh, chỉ hiển thị danh sách học sinh');
            }

            // Tạo dữ liệu báo cáo
            const reportStudents = students.map((student: Student) => {
                const studentAttendances = allAttendanceData.filter((att: Attendance) => 
                    att.student?._id?.toString() === student._id.toString()
                );
                
                // Tạo object cho 10 tiết học
                const periods: { [key: number]: string } = {};
                for (let i = 1; i <= 10; i++) {
                    const periodAttendance = studentAttendances.find((att: Attendance) => att.periodNumber === i);
                    if (periodAttendance) {
                        switch (periodAttendance.status) {
                            case 'present':
                                periods[i] = 'P';
                                break;
                            case 'absent':
                                periods[i] = 'A';
                                break;
                            case 'late':
                                periods[i] = 'L';
                                break;
                            case 'excused':
                                periods[i] = 'E';
                                break;
                            default:
                                periods[i] = '-';
                        }
                    } else {
                        periods[i] = '-';
                    }
                }

                                    return {
                        studentCode: student.studentCode,
                        name: student.name,
                        avatarUrl: student.avatarUrl,
                        checkIn: timeAttendanceData[student.studentCode]?.checkIn || '-',
                        checkOut: timeAttendanceData[student.studentCode]?.checkOut || '-',
                        periods
                    };
                });

                setReportData(reportStudents);
                console.log('✅ Đã tạo report data cho', reportStudents.length, 'học sinh');
        } catch (error) {
            console.error('❌ Lỗi khi tải dữ liệu báo cáo:', error);
            
            // Hiển thị toast error
            if (error instanceof AxiosError) {
                if (error.response?.status === 401) {
                    toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                } else if (error.response?.status === 403) {
                    toast.error('Bạn không có quyền truy cập thông tin này');
                } else {
                    toast.error('Có lỗi khi tải dữ liệu báo cáo');
                }
            } else {
                toast.error('Có lỗi khi tải dữ liệu báo cáo');
            }
            
            // Set empty data
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

         const getStatusColor = (status: string) => {
         switch (status) {
             case 'P':
                 return 'bg-green-100 text-green-800';
             case 'A':
                 return 'bg-red-100 text-red-800';
             case 'L':
                 return 'bg-yellow-100 text-yellow-800';
             case 'E':
                 return 'bg-blue-100 text-blue-800';
             case '-':
                 return 'bg-gray-100 text-gray-500';
             default:
                 return 'bg-gray-100 text-gray-500';
         }
     };

         const getStatusText = (status: string) => {
         switch (status) {
             case 'P':
                 return 'Có mặt';
             case 'A':
                 return 'Vắng mặt';
             case 'L':
                 return 'Đi muộn';
             case 'E':
                 return 'Có phép';
             case '-':
                 return 'Chưa điểm danh';
             default:
                 return 'Chưa điểm danh';
         }
     };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-row items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold">Báo cáo điểm danh</h2>
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
                </div>
                                 <CardDescription>
                     Báo cáo tổng hợp điểm danh theo ngày - P: Có mặt, A: Vắng mặt, L: Đi muộn, E: Có phép, -: Chưa điểm danh
                 </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-white border-r">Mã HS</TableHead>
                                    <TableHead className="sticky left-20 bg-white border-r">Họ và tên</TableHead>
                                    <TableHead className="text-center min-w-[100px]">Check-in</TableHead>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(period => (
                                        <TableHead key={period} className="text-center min-w-[60px]">
                                            Tiết {period}
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-center min-w-[100px]">Check-out</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                                                 {reportData.length === 0 ? (
                                     <TableRow>
                                         <TableCell colSpan={14} className="text-center py-8">
                                             {loading ? (
                                                 <div className="flex justify-center items-center">
                                                     <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
                                                     Đang tải dữ liệu...
                                                 </div>
                                             ) : (
                                                 "Không có học sinh trong lớp này"
                                             )}
                                         </TableCell>
                                     </TableRow>
                                                                 ) : (
                                     reportData.map((student) => (
                                         <TableRow key={student.studentCode}>
                                            <TableCell className="sticky left-0 bg-white border-r font-medium">
                                                {student.studentCode}
                                            </TableCell>
                                            <TableCell className="sticky left-20 bg-white border-r">
                                                <div className="flex items-center gap-2">
                                                    {student.avatarUrl && (
                                                        <img
                                                            src={`${BASE_URL}${student.avatarUrl}`}
                                                            alt={student.name}
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                    )}
                                                    <span className="whitespace-nowrap">{student.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="text-sm">{student.checkIn}</span>
                                            </TableCell>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(period => (
                                                <TableCell key={period} className="text-center">
                                                    <div 
                                                        className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium ${getStatusColor(student.periods[period])}`}
                                                        title={getStatusText(student.periods[period])}
                                                    >
                                                        {student.periods[period]}
                                                    </div>
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-center">
                                                <span className="text-sm">{student.checkOut}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Component chính với layout 2 cột
const AttendanceList: React.FC = () => {
    const [activeTab, setActiveTab] = useState("attendance");

    const menuItems = [
        { id: "attendance", label: "Điểm danh" },
        { id: "attendanceReport", label: "Báo cáo điểm danh" }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case "attendance":
                return <AttendanceComponent />;
            case "attendanceReport":
                return <AttendanceReportComponent />;
            default:
                return <div>Chọn một mục từ menu bên trái</div>;
        }
    };

    return (
        <div className="flex gap-6 p-6">
            {/* Sidebar */}
            <aside className="w-64">
                <Card>
                    <CardContent className="p-0">
                        <nav className="space-y-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                                        activeTab === item.id
                                            ? "bg-accent text-accent-foreground font-medium"
                                            : ""
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </CardContent>
                </Card>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
                {renderContent()}
            </main>
        </div>
    );
};

export default AttendanceList;

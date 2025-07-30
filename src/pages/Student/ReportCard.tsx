import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
import { API_ENDPOINTS } from '../../config/api';

interface Student {
    _id: string;
    name: string;
    studentCode: string;
}

interface Subject {
    _id: string;
    name: string;
    code: string;
}

interface Class {
    _id: string;
    className: string;
}

interface SchoolYear {
    _id: string;
    code: string;
}

interface ReportData {
    subject: Subject;
    grades: {
        quiz: number[];
        midterm: number[];
        final: number[];
        assignment: number[];
        average: number;
    };
}

interface Report {
    _id: string;
    student: Student;
    class: Class;
    schoolYear: SchoolYear;
    type: string;
    data: {
        semester: string;
        subjects: ReportData[];
        gpa: number;
    };
}

const ReportCardComponent: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<string>('1');
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        fetchSchoolYears();
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchStudents();
        }
    }, [selectedClass]);

    useEffect(() => {
        if (selectedStudent && selectedClass && selectedSchoolYear && selectedSemester) {
            fetchReport();
        }
    }, [selectedStudent, selectedClass, selectedSchoolYear, selectedSemester]);

    const fetchSchoolYears = async () => {
        try {
            const response = await axios.get(API_ENDPOINTS.SCHOOL_YEARS);
            const yearsData = Array.isArray(response.data) ? response.data : [];
            setSchoolYears(yearsData);
            if (yearsData.length > 0) {
                setSelectedSchoolYear(yearsData[0]._id);
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách năm học:', error);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await axios.get(API_ENDPOINTS.CLASSES);
            const classesData = Array.isArray(response.data) ? response.data : [];
            setClasses(classesData);
            if (classesData.length > 0) {
                setSelectedClass(classesData[0]._id);
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách lớp học:', error);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await axios.get(API_ENDPOINTS.STUDENTS, {
                params: { class: selectedClass }
            });
            const studentsData = Array.isArray(response.data) ? response.data : [];
            setStudents(studentsData);
            if (studentsData.length > 0) {
                setSelectedStudent(studentsData[0]._id);
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách học sinh:', error);
        }
    };

    const fetchReport = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_ENDPOINTS.REPORTS}/student`, {
                params: {
                    student: selectedStudent,
                    class: selectedClass,
                    schoolYear: selectedSchoolYear,
                    semester: selectedSemester,
                    type: 'semester'
                }
            });
            setReport(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Lỗi khi tải bảng điểm học sinh:', error);
            setLoading(false);
        }
    };

    const getGradeColor = (score: number) => {
        if (score >= 8.5) return 'text-green-600 font-semibold';
        if (score >= 7) return 'text-blue-600';
        if (score >= 5) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="w-full mx-auto p-4 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Bảng điểm học sinh</CardTitle>
                        <Button>Xuất bảng điểm</Button>
                    </div>
                    <CardDescription>Xem bảng điểm của học sinh theo học kỳ</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Năm học</label>
                            <Select
                                value={selectedSchoolYear}
                                onValueChange={setSelectedSchoolYear}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn năm học" />
                                </SelectTrigger>
                                <SelectContent>
                                    {schoolYears.map(year => (
                                        <SelectItem key={year._id} value={year._id}>
                                            {year.code}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
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

                        <div>
                            <label className="block text-sm font-medium mb-1">Học sinh</label>
                            <Select
                                value={selectedStudent}
                                onValueChange={setSelectedStudent}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn học sinh" />
                                </SelectTrigger>
                                <SelectContent>
                                    {students.map(student => (
                                        <SelectItem key={student._id} value={student._id}>
                                            {student.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Học kỳ</label>
                            <Select
                                value={selectedSemester}
                                onValueChange={setSelectedSemester}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn học kỳ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Học kỳ 1</SelectItem>
                                    <SelectItem value="2">Học kỳ 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    ) : report ? (
                        <div>
                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <div className="text-lg font-semibold mb-2">Thông tin học sinh</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Họ và tên</p>
                                        <p className="font-medium">{report.student.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Mã học sinh</p>
                                        <p className="font-medium">{report.student.studentCode}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Lớp</p>
                                        <p className="font-medium">{report.class.className}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Năm học</p>
                                        <p className="font-medium">{report.schoolYear.code}</p>
                                    </div>
                                </div>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead rowSpan={2}>STT</TableHead>
                                        <TableHead rowSpan={2}>Môn học</TableHead>
                                        <TableHead colSpan={4} className="text-center">Điểm thành phần</TableHead>
                                        <TableHead rowSpan={2} className="text-center">Điểm TB</TableHead>
                                    </TableRow>
                                    <TableRow>
                                        <TableHead className="text-center">Kiểm tra</TableHead>
                                        <TableHead className="text-center">Giữa kỳ</TableHead>
                                        <TableHead className="text-center">Cuối kỳ</TableHead>
                                        <TableHead className="text-center">Bài tập</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.data.subjects.map((subjectData, index) => (
                                        <TableRow key={subjectData.subject._id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell className="font-medium">{subjectData.subject.name}</TableCell>
                                            <TableCell className="text-center">
                                                {subjectData.grades.quiz.length > 0
                                                    ? subjectData.grades.quiz.map((score, i) => (
                                                        <span key={i} className={getGradeColor(score)}>
                                                            {score}{i < subjectData.grades.quiz.length - 1 ? ', ' : ''}
                                                        </span>
                                                    ))
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {subjectData.grades.midterm.length > 0
                                                    ? subjectData.grades.midterm.map((score, i) => (
                                                        <span key={i} className={getGradeColor(score)}>
                                                            {score}{i < subjectData.grades.midterm.length - 1 ? ', ' : ''}
                                                        </span>
                                                    ))
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {subjectData.grades.final.length > 0
                                                    ? subjectData.grades.final.map((score, i) => (
                                                        <span key={i} className={getGradeColor(score)}>
                                                            {score}{i < subjectData.grades.final.length - 1 ? ', ' : ''}
                                                        </span>
                                                    ))
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {subjectData.grades.assignment.length > 0
                                                    ? subjectData.grades.assignment.map((score, i) => (
                                                        <span key={i} className={getGradeColor(score)}>
                                                            {score}{i < subjectData.grades.assignment.length - 1 ? ', ' : ''}
                                                        </span>
                                                    ))
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className={`text-center ${getGradeColor(subjectData.grades.average)}`}>
                                                {subjectData.grades.average.toFixed(1)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-gray-50 font-semibold">
                                        <TableCell colSpan={6} className="text-right">Điểm trung bình học kỳ:</TableCell>
                                        <TableCell className={`text-center ${getGradeColor(report.data.gpa)}`}>
                                            {report.data.gpa.toFixed(1)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Vui lòng chọn đầy đủ thông tin để xem bảng điểm
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportCardComponent;

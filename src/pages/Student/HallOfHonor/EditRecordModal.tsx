import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Plus, Trash2 } from 'lucide-react';
import { API_ENDPOINTS } from '../../../lib/config';
import { toast } from 'sonner';
import type { 
  AwardRecord, 
  StudentData, 
  ClassData,
  RecipientType
} from '../../../types';
import type { Student, Class } from '../../../types';

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AwardRecord | null;
  onSuccess: () => void;
  studentData?: StudentData | null;
  classData?: any | null;
}

const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  onClose,
  record,
  onSuccess,
  studentData,
  classData
}) => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);

  // Determine recipient type from the record's category
  const recipientType: RecipientType = record?.awardCategory?.recipientType || 'student';

  useEffect(() => {
    if (record) {
      if (studentData) {
        // Khi sửa một học sinh cụ thể, chỉ load thông tin của học sinh đó
        // Tìm học sinh trong record để lấy đầy đủ thông tin
        const originalStudent = record.students?.find(s => s.student._id === studentData.student._id);
        if (originalStudent) {
          setStudents([{
            student: originalStudent.student,
            note: originalStudent.note || '',
            noteEng: originalStudent.noteEng || '',
            activity: originalStudent.activity || [],
            exam: originalStudent.exam || '',
            score: originalStudent.score || ''
          }]);
        } else {
          // Fallback nếu không tìm thấy
          setStudents([{
            student: studentData.student,
            note: studentData.note || '',
            noteEng: studentData.noteEng || '',
            activity: studentData.activity || [],
            exam: studentData.exam || '',
            score: studentData.score || ''
          }]);
        }
        setClasses(record.awardClasses || []);
      } else if (classData) {
        // Khi sửa một lớp cụ thể, chỉ load thông tin của lớp đó
        const originalClass = record.awardClasses?.find(c => c.class === classData.class);
        if (originalClass) {
          setClasses([{
            class: originalClass.class,
            classInfo: originalClass.classInfo,
            note: originalClass.note || '',
            noteEng: originalClass.noteEng || ''
          }]);
        } else {
          setClasses([{ ...classData }]);
        }
        setStudents(record.students || []);
      } else {
        // Khi sửa toàn bộ record, load tất cả học sinh và lớp
        setStudents(record.students || []);
        setClasses(record.awardClasses || []);
      }
    }
  }, [record, studentData, classData]);

  // Fetch available students and classes
  useEffect(() => {
    if (isOpen) {
      fetchAvailableStudents();
      fetchAvailableClasses();
    }
  }, [isOpen]);

  const fetchAvailableStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.STUDENTS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableStudents(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách học sinh:', error);
    }
  };

  const fetchAvailableClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.CLASSES, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableClasses(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách lớp:', error);
    }
  };

  const handleStudentChange = (index: number, field: keyof StudentData, value: string | number | string[]) => {
    const updatedStudents = [...students];
    if (field === 'student') {
      const selectedStudent = availableStudents.find(s => s._id === value);
      updatedStudents[index] = {
        ...updatedStudents[index],
        student: selectedStudent || { _id: '', name: '', studentCode: '' }
      };
    } else if (field === 'activity') {
      updatedStudents[index] = {
        ...updatedStudents[index],
        activity: Array.isArray(value) ? value : [],
      };
    } else {
      updatedStudents[index] = {
        ...updatedStudents[index],
        [field]: value
      };
    }
    setStudents(updatedStudents);
  };

  const handleAddClass = () => {
    setClasses([...classes, {
      class: '',
      note: '',
      noteEng: ''
    }]);
  };

  const handleRemoveClass = (index: number) => {
    setClasses(classes.filter((_, i) => i !== index));
  };

  const handleClassChange = (index: number, field: keyof ClassData, value: string) => {
    const updatedClasses = [...classes];
    if (field === 'class') {
      const selectedClass = availableClasses.find(c => c._id === value);
      updatedClasses[index] = {
        ...updatedClasses[index],
        class: value,
        classInfo: selectedClass
      };
    } else {
      updatedClasses[index] = {
        ...updatedClasses[index],
        [field]: value
      };
    }
    setClasses(updatedClasses);
  };

  const handleSubmit = async () => {
    if (!record) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Nếu có studentData được truyền vào (chỉnh sửa một học sinh cụ thể)
      if (studentData) {
        // Đảm bảo record.students tồn tại và không rỗng
        if (!record.students || !Array.isArray(record.students)) {
          throw new Error('Không tìm thấy danh sách học sinh trong bản ghi');
        }

        console.log('🔍 DEBUG: Editing specific student');
        console.log('🔍 Original record.students:', record.students);
        console.log('🔍 StudentData to edit:', studentData);
        console.log('🔍 Form students data:', students);

        // Tạo bản sao của danh sách học sinh hiện tại
        const currentStudents = [...record.students];
        
        // Tìm vị trí của học sinh cần cập nhật
        const studentIndex = currentStudents.findIndex(
          s => s.student._id === studentData.student._id
        );

        if (studentIndex === -1) {
          throw new Error('Không tìm thấy học sinh cần cập nhật');
        }

        console.log('🔍 Student index found:', studentIndex);
        console.log('🔍 Original student at index:', currentStudents[studentIndex]);

        // Cập nhật thông tin của học sinh tại vị trí đó
        currentStudents[studentIndex] = {
          ...currentStudents[studentIndex],
          note: students[0].note,
          noteEng: students[0].noteEng,
          activity: students[0].activity,
          exam: students[0].exam,
          score: students[0].score,
          // Giữ nguyên thông tin student và các field khác
          student: currentStudents[studentIndex].student
        };

        console.log('🔍 Updated student at index:', currentStudents[studentIndex]);
        console.log('🔍 Final currentStudents array:', currentStudents);

        const updateData = {
          students: currentStudents,
          awardCategory: record.awardCategory?._id || record.awardCategory,
          awardClasses: record.awardClasses || [], // Giữ nguyên thông tin lớp
          subAward: {
            type: record.subAward.type,
            label: record.subAward.label,
            labelEng: record.subAward.labelEng,
            schoolYear: record.subAward.schoolYear,
            semester: record.subAward.semester,
            month: record.subAward.month,
            priority: record.subAward.priority
          }
        };

        console.log('🔍 Final updateData to send:', updateData);

        await axios.put(`${API_ENDPOINTS.AWARD_RECORDS}/${record._id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (classData) {
        // Nếu có classData được truyền vào (chỉnh sửa một lớp cụ thể)
        // Đảm bảo record.awardClasses tồn tại và không rỗng
        if (!record.awardClasses || !Array.isArray(record.awardClasses)) {
          throw new Error('Không tìm thấy danh sách lớp trong bản ghi');
        }

        console.log('🔍 DEBUG: Editing specific class');
        console.log('🔍 Original record.awardClasses:', record.awardClasses);
        console.log('🔍 ClassData to edit:', classData);
        console.log('🔍 Form classes data:', classes);

        // Tạo bản sao của danh sách lớp hiện tại
        const currentClasses = [...record.awardClasses];
        
        // Tìm vị trí của lớp cần cập nhật
        const classIndex = currentClasses.findIndex(
          c => c.class === classData.class
        );

        if (classIndex === -1) {
          throw new Error('Không tìm thấy lớp cần cập nhật');
        }

        console.log('🔍 Class index found:', classIndex);
        console.log('🔍 Original class at index:', currentClasses[classIndex]);

        // Cập nhật thông tin của lớp tại vị trí đó
        currentClasses[classIndex] = {
          ...currentClasses[classIndex],
          note: classes[0].note,
          noteEng: classes[0].noteEng,
          // Giữ nguyên thông tin class và các field khác
          class: currentClasses[classIndex].class,
          classInfo: currentClasses[classIndex].classInfo
        };

        console.log('🔍 Updated class at index:', currentClasses[classIndex]);
        console.log('🔍 Final currentClasses array:', currentClasses);

        const updateData = {
          students: record.students || [], // Giữ nguyên thông tin học sinh
          awardClasses: currentClasses,
          awardCategory: record.awardCategory?._id || record.awardCategory,
          subAward: {
            type: record.subAward.type,
            label: record.subAward.label,
            labelEng: record.subAward.labelEng,
            schoolYear: record.subAward.schoolYear,
            semester: record.subAward.semester,
            month: record.subAward.month,
            priority: record.subAward.priority
          }
        };

        console.log('🔍 Final updateData to send:', updateData);

        await axios.put(`${API_ENDPOINTS.AWARD_RECORDS}/${record._id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Chỉnh sửa toàn bộ record (thêm/xóa học sinh/lớp)
        const updateData = {
          students: students.filter(s => s.student._id),
          awardClasses: classes.filter(c => c.class),
          subAward: record.subAward,
          awardCategory: record.awardCategory?._id || record.awardCategory
        };

        await axios.put(`${API_ENDPOINTS.AWARD_RECORDS}/${record._id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      toast.success('Cập nhật bản ghi thành công');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Lỗi khi cập nhật bản ghi:', error);
      let errorMessage = 'Có lỗi xảy ra khi cập nhật bản ghi';
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response?: { data?: { message?: string } } };
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {studentData ? 'Chỉnh sửa học sinh' : 'Chỉnh sửa bản ghi vinh danh'}
          </DialogTitle>
          <DialogDescription>
            {studentData 
              ? `Chỉnh sửa thông tin học sinh "${studentData.student?.name}" trong bản ghi "${record.subAward.label}"`
              : `Chỉnh sửa thông tin học sinh và lớp trong bản ghi "${record.subAward.label}"`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea>
            <div className="space-y-6 p-1">
              {/* Students Section - Only show if recipientType is 'student' */}
              {recipientType === 'student' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Học sinh</h3>
                    {/* Chỉ hiển thị nút "Thêm học sinh" khi không chỉnh sửa một học sinh cụ thể */}
                    {!studentData && (
                      <Button size="sm" onClick={() => setStudents([...students, { student: { _id: '', name: '', studentCode: '' }, note: '', noteEng: '' }])}>
                        <Plus className="h-4 w-4 mr-1" />
                        Thêm học sinh
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {students.map((student, index) => (
                      <div key={index} className="space-y-3 border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Học sinh {index + 1}</span>
                          {/* Chỉ hiển thị nút xóa khi không chỉnh sửa một học sinh cụ thể và có nhiều hơn 1 học sinh */}
                          {!studentData && students.length > 1 && (
                            <Button size="sm" variant="outline" onClick={() => setStudents(students.filter((_, i) => i !== index))} className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div>
                          <Label>Học sinh</Label>
                          <select
                            value={student.student._id}
                            onChange={(e) => handleStudentChange(index, 'student', e.target.value)}
                            className="w-full p-2 border rounded-md mt-2"
                          >
                            <option value="">Chọn học sinh</option>
                            {availableStudents.map((s) => (
                              <option key={s._id} value={s._id}>
                                {s.name} ({s.studentCode})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Ghi chú</Label>
                          <Textarea
                            value={student.note || ''}
                            onChange={(e) => handleStudentChange(index, 'note', e.target.value)}
                            placeholder="Ghi chú"
                            rows={2}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Ghi chú (Tiếng Anh)</Label>
                          <Textarea
                            value={student.noteEng || ''}
                            onChange={(e) => handleStudentChange(index, 'noteEng', e.target.value)}
                            placeholder="Ghi chú bằng tiếng Anh"
                            rows={2}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Classes Section - Only show if recipientType is 'class' and not editing a specific student or class */}
              {recipientType === 'class' && !studentData && !classData && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Lớp</h3>
                    <Button size="sm" onClick={handleAddClass}>
                      <Plus className="h-4 w-4 mr-1" />
                      Thêm lớp
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {classes.map((classData, index) => (
                      <div key={index} className="space-y-3 border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Lớp {index + 1}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveClass(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div>
                          <Label>Lớp</Label>
                          <select
                            value={classData.class}
                            onChange={(e) => handleClassChange(index, 'class', e.target.value)}
                            className="w-full p-2 border rounded-md mt-2"
                          >
                            <option value="">Chọn lớp</option>
                            {availableClasses.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.className}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Ghi chú</Label>
                          <Textarea
                            value={classData.note || ''}
                            onChange={(e) => handleClassChange(index, 'note', e.target.value)}
                            placeholder="Ghi chú"
                            rows={2}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Ghi chú (Tiếng Anh)</Label>
                          <Textarea
                            value={classData.noteEng || ''}
                            onChange={(e) => handleClassChange(index, 'noteEng', e.target.value)}
                            placeholder="Ghi chú bằng tiếng Anh"
                            rows={2}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sửa chi tiết từng lớp - giống sửa chi tiết từng học sinh */}
              {recipientType === 'class' && classData && classes.length === 1 && (
                <div>
                  <div className="space-y-3 border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Lớp</span>
                    </div>
                    <div>
                      <Label>Lớp</Label>
                      <select
                        value={classes[0].class}
                        onChange={(e) => handleClassChange(0, 'class', e.target.value)}
                        className="w-full p-2 border rounded-md mt-2"
                      >
                        <option value="">Chọn lớp</option>
                        {availableClasses.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.className}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Ghi chú</Label>
                      <Textarea
                        value={classes[0].note || ''}
                        onChange={(e) => handleClassChange(0, 'note', e.target.value)}
                        placeholder="Ghi chú"
                        rows={2}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Ghi chú (Tiếng Anh)</Label>
                      <Textarea
                        value={classes[0].noteEng || ''}
                        onChange={(e) => handleClassChange(0, 'noteEng', e.target.value)}
                        placeholder="Ghi chú bằng tiếng Anh"
                        rows={2}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang cập nhật...' : 'Cập nhật'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditRecordModal; 
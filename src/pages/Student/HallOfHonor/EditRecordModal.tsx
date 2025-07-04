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

interface Student {
  _id: string;
  name: string;
  studentCode: string;
}

interface Class {
  _id: string;
  className: string;
  classCode: string;
}

interface StudentData {
  student: Student;
  exam?: string;
  score?: number | string;
  note?: string;
  noteEng?: string;
}

interface ClassData {
  class: string;
  note?: string;
  noteEng?: string;
  classInfo?: Class;
}

interface AwardRecord {
  _id: string;
  awardCategory: {
    _id: string;
    name: string;
    nameEng: string;
  };
  subAward: {
    type: string;
    label: string;
    labelEng?: string;
    schoolYear: string;
    semester?: number;
    month?: number;
    priority?: number;
  };
  students: StudentData[];
  awardClasses: ClassData[];
  createdAt: string;
  updatedAt: string;
}

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AwardRecord | null;
  onSuccess: () => void;
}

const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  onClose,
  record,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);

  useEffect(() => {
    if (record) {
      setStudents(record.students || []);
      setClasses(record.awardClasses || []);
    }
  }, [record]);

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

  const handleAddStudent = () => {
    setStudents([...students, {
      student: { _id: '', name: '', studentCode: '' },
      exam: '',
      score: '',
      note: '',
      noteEng: ''
    }]);
  };

  const handleRemoveStudent = (index: number) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const handleStudentChange = (index: number, field: keyof StudentData, value: string | number) => {
    const updatedStudents = [...students];
    if (field === 'student') {
      const selectedStudent = availableStudents.find(s => s._id === value);
      updatedStudents[index] = {
        ...updatedStudents[index],
        student: selectedStudent || { _id: '', name: '', studentCode: '' }
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

      const updateData = {
        students: students.filter(s => s.student._id),
        awardClasses: classes.filter(c => c.class)
      };

      await axios.put(`${API_ENDPOINTS.AWARD_RECORDS}/${record._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa bản ghi vinh danh</DialogTitle>
          <DialogDescription>
            Chỉnh sửa thông tin học sinh và lớp trong bản ghi "{record.subAward.label}"
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[60vh]">
            <div className="space-y-6 p-1">
              {/* Students Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Học sinh</h3>
                  <Button size="sm" onClick={handleAddStudent}>
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm học sinh
                  </Button>
                </div>

                <div className="space-y-4">
                  {students.map((student, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Học sinh {index + 1}</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveStudent(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Học sinh</Label>
                          <select
                            value={student.student._id}
                            onChange={(e) => handleStudentChange(index, 'student', e.target.value)}
                            className="w-full p-2 border rounded-md"
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
                          <Label>Kỳ thi</Label>
                          <Input
                            value={student.exam || ''}
                            onChange={(e) => handleStudentChange(index, 'exam', e.target.value)}
                            placeholder="Tên kỳ thi"
                          />
                        </div>

                        <div>
                          <Label>Điểm số</Label>
                          <Input
                            value={student.score || ''}
                            onChange={(e) => handleStudentChange(index, 'score', e.target.value)}
                            placeholder="Điểm số"
                          />
                        </div>

                        <div>
                          <Label>Ghi chú</Label>
                          <Input
                            value={student.note || ''}
                            onChange={(e) => handleStudentChange(index, 'note', e.target.value)}
                            placeholder="Ghi chú"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Ghi chú (Tiếng Anh)</Label>
                        <Textarea
                          value={student.noteEng || ''}
                          onChange={(e) => handleStudentChange(index, 'noteEng', e.target.value)}
                          placeholder="Ghi chú bằng tiếng Anh"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Classes Section */}
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
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Lớp {index + 1}</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveClass(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Lớp</Label>
                          <select
                            value={classData.class}
                            onChange={(e) => handleClassChange(index, 'class', e.target.value)}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="">Chọn lớp</option>
                            {availableClasses.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.className} ({c.classCode})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <Label>Ghi chú</Label>
                          <Input
                            value={classData.note || ''}
                            onChange={(e) => handleClassChange(index, 'note', e.target.value)}
                            placeholder="Ghi chú"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Ghi chú (Tiếng Anh)</Label>
                        <Textarea
                          value={classData.noteEng || ''}
                          onChange={(e) => handleClassChange(index, 'noteEng', e.target.value)}
                          placeholder="Ghi chú bằng tiếng Anh"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
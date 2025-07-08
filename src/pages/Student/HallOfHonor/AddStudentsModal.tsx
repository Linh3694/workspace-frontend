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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Plus, Trash2, Download } from 'lucide-react';
import { API_ENDPOINTS } from '../../../lib/config';
import { toast } from 'sonner';
import type { 
  AwardCategory, 
  SubAward, 
  StudentData
} from '../../../types';
import type { Student } from '../../../types';

interface ExcelStudentData {
  student: string;
  exam?: string;
  score?: string;
}

interface AddStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedCategory: AwardCategory | null;
  selectedSchoolYear: string;
  selectedSubAward: SubAward | null;
}

const AddStudentsModal: React.FC<AddStudentsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedCategory,
  selectedSchoolYear,
  selectedSubAward
}) => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [excelStudents, setExcelStudents] = useState<StudentData[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Determine fields based on subAward type
  const subAwardType = selectedSubAward?.type || 'year';

  useEffect(() => {
    if (isOpen) {
      fetchAvailableStudents();
      // Initialize with one empty student
      setStudents([createEmptyStudent()]);
      setExcelStudents([]);
    }
  }, [isOpen]);

  const createEmptyStudent = (): StudentData => {
    const base = {
      student: { _id: '', name: '', studentCode: '' },
      note: '',
      noteEng: ''
    };

    if (subAwardType === 'custom') {
      return { ...base, activity: [], activityEng: [] };
    } else if (subAwardType === 'custom_with_description') {
      return { student: { _id: '', name: '', studentCode: '' }, exam: '', score: '' };
    }

    return base;
  };

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
        activity: Array.isArray(value) ? value : [value as string],
      };
    } else if (field === 'activityEng') {
      updatedStudents[index] = {
        ...updatedStudents[index],
        activityEng: Array.isArray(value) ? value : [value as string],
      };
    } else {
      updatedStudents[index] = {
        ...updatedStudents[index],
        [field]: value
      };
    }
    setStudents(updatedStudents);
  };

  const handleAddStudent = () => {
    setStudents([...students, createEmptyStudent()]);
  };

  const handleRemoveStudent = (index: number) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_ENDPOINTS.AWARD_RECORDS}/upload-excel`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.students) {
        // Convert uploaded data to StudentData format
        const convertedStudents = response.data.students.map((s: ExcelStudentData) => {
          const student = availableStudents.find(st => st.studentCode === s.student);
          if (subAwardType === 'custom_with_description') {
            return {
              student: student || { _id: '', name: s.student, studentCode: s.student },
              exam: s.exam || '',
              score: s.score || ''
            };
          } else if (subAwardType === 'custom') {
            return {
              student: student || { _id: '', name: s.student, studentCode: s.student },
              activity: [],
              activityEng: [],
              note: '',
              noteEng: ''
            };
          } else {
            // Định kỳ
            return {
              student: student || { _id: '', name: s.student, studentCode: s.student },
              note: '',
              noteEng: ''
            };
          }
        });
        setExcelStudents(convertedStudents);
        toast.success(`Đã đọc thành công ${response.data.totalStudents} học sinh từ Excel`);
      }
    } catch (error: unknown) {
      console.error('Lỗi khi upload Excel:', error);
      const errorResponse = error as { response?: { data?: { message?: string } } };
      toast.error(errorResponse.response?.data?.message || 'Có lỗi xảy ra khi đọc file Excel');
    } finally {
      setUploadLoading(false);
    }
  };

  const downloadTemplate = () => {
    let fileName = '';
    if (subAwardType === 'custom_with_description') {
      fileName = '/Template/record-sample-students-02.xlsx';
    } else {
      fileName = '/Template/record-sample-students.xlsx';
    }
    const a = document.createElement('a');
    a.href = fileName;
    a.download = fileName.split('/').pop() || 'template.xlsx';
    a.click();
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !selectedSubAward) return;

    const finalStudents = students
      .filter(s => s.student && s.student._id && s.student._id !== '')
      .concat(
        excelStudents.filter(s => s.student && s.student._id && s.student._id !== '')
      );

    if (finalStudents.length === 0) {
      toast.error('Vui lòng thêm ít nhất một học sinh');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;
    const failList: string[] = [];
    const token = localStorage.getItem('token');

    for (const stu of finalStudents) {
      const recordData = {
        awardCategory: selectedCategory._id,
        students: [stu],
        awardClasses: [],
        subAward: {
          type: selectedSubAward.type,
          label: selectedSubAward.label,
          labelEng: selectedSubAward.labelEng,
          schoolYear: selectedSchoolYear,
          semester: selectedSubAward.semester,
          month: selectedSubAward.month,
          priority: selectedSubAward.priority
        }
      };
      try {
        await axios.post(API_ENDPOINTS.AWARD_RECORDS, recordData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        successCount++;
      } catch (error: unknown) {
        failCount++;
        const errorResponse = error as { response?: { data?: { message?: string } } };
        const errorMessage = errorResponse.response?.data?.message || 'Lỗi không xác định';
        failList.push(`${stu.student.name || stu.student.studentCode}: ${errorMessage}`);
      }
    }

    setLoading(false);
    if (successCount > 0) {
      toast.success(`Đã thêm thành công ${successCount} học sinh`);
      onSuccess();
      onClose();
    }
    if (failCount > 0) {
      toast.error(`Có ${failCount} học sinh không thêm được:\n${failList.join('\n')}`);
    }
  };

  if (!selectedCategory || !selectedSubAward) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Thêm học sinh vào "{selectedSubAward.label}"</DialogTitle>
          <DialogDescription>
            Thêm học sinh vào loại vinh danh "{selectedCategory.name}"
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Thêm thủ công</TabsTrigger>
            <TabsTrigger value="excel">Thêm từ Excel</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Danh sách học sinh</h3>
              <Button size="sm" onClick={handleAddStudent}>
                <Plus className="h-4 w-4 mr-1" />
                Thêm học sinh
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-4 p-1">
                {students.map((student, index) => (
                  <div key={index} className="space-y-3 border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Học sinh {index + 1}</span>
                      {students.length > 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveStudent(index)}
                          className="text-red-600 hover:text-red-700"
                        >
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

                    {/* Custom fields for different award types */}
                    {subAwardType === 'custom' && (
                      <>
                        <div>
                          <Label>Hoạt động</Label>
                          <Input
                            value={Array.isArray(student.activity) ? student.activity.join(', ') : ''}
                            onChange={(e) => handleStudentChange(index, 'activity', e.target.value.split(', '))}
                            placeholder="Nhập các hoạt động, cách nhau bằng dấu phẩy"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Hoạt động (Tiếng Anh)</Label>
                          <Input
                            value={Array.isArray(student.activityEng) ? student.activityEng.join(', ') : ''}
                            onChange={(e) => handleStudentChange(index, 'activityEng', e.target.value.split(', '))}
                            placeholder="Nhập các hoạt động bằng tiếng Anh, cách nhau bằng dấu phẩy"
                            className="mt-2"
                          />
                        </div>
                      </>
                    )}

                    {subAwardType === 'custom_with_description' && (
                      <>
                        <div>
                          <Label>Bài thi</Label>
                          <Input
                            value={student.exam || ''}
                            onChange={(e) => handleStudentChange(index, 'exam', e.target.value)}
                            placeholder="Tên bài thi"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Điểm</Label>
                          <Input
                            value={student.score || ''}
                            onChange={(e) => handleStudentChange(index, 'score', e.target.value)}
                            placeholder="Điểm số"
                            className="mt-2"
                          />
                        </div>
                      </>
                    )}

                    {/* Ghi chú chỉ cho các loại khác */}
                    {subAwardType !== 'custom_with_description' && (
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
                    )}

                    {subAwardType !== 'custom_with_description' && (
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
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="excel" className="flex-1 overflow-hidden">
            <div className="space-y-6 flex flex-col">
              <div className="space-y-6">
                <div className="flex items-center mb-4 mt-4">
                  <div className="w-32 font-medium">File Excel</div>
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={uploadLoading}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center mb-4">
                  <div className="w-32 font-medium">File mẫu</div>
                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Tải file mẫu
                  </Button>
                </div>
                {uploadLoading && (
                  <div className="text-center py-4">
                    <div className="text-sm text-muted-foreground">Đang xử lý file Excel...</div>
                  </div>
                )}
                {excelStudents.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">
                      Danh sách học sinh từ Excel ({excelStudents.length} học sinh)
                    </h4>
                    <ScrollArea className="h-[200px] border rounded-md p-4">
                      <div className="space-y-2">
                        {excelStudents.map((student, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">
                                {student.student.name || student.student.studentCode}
                              </span>
                              {student.exam && (
                                <span className="text-sm text-gray-600 ml-2">
                                  - {student.exam}: {student.score}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang thêm...' : 'Thêm học sinh'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentsModal; 
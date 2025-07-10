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
import { Combobox } from '../../../components/ui/combobox';
import { Plus, Trash2, Download } from 'lucide-react';
import { API_ENDPOINTS } from '../../../lib/config';
import { toast } from 'sonner';
import type { 
  AwardCategory, 
  SubAward, 
  StudentData
} from '../../../types';
import type { Student } from '../../../types';



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
  const [uploadLoading, setUploadLoading] = useState(false);

  // Determine fields based on subAward type
  const subAwardType = selectedSubAward?.type || 'year';

  useEffect(() => {
    if (isOpen) {
      fetchAvailableStudents();
      // Initialize with one empty student
      setStudents([createEmptyStudent()]);
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

    if (!selectedCategory || !selectedSubAward) {
      toast.error('Vui lòng chọn loại vinh danh và thời kỳ trước khi upload file');
      return;
    }

    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('awardCategory', selectedCategory._id);
      formData.append('subAward', JSON.stringify({
        type: selectedSubAward.type,
        label: selectedSubAward.label,
        labelEng: selectedSubAward.labelEng,
        schoolYear: selectedSchoolYear,
        semester: selectedSubAward.semester,
        month: selectedSubAward.month,
        priority: selectedSubAward.priority
      }));

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

      if (response.data.success) {
        const { summary, details } = response.data;
        
        // Hiển thị thông báo thành công
        toast.success(response.data.message);
        
        // Hiển thị thông tin chi tiết
        if (summary.duplicates > 0) {
          toast.warning(`Có ${summary.duplicates} học sinh đã tồn tại trong hệ thống`);
        }
        
        // Log thông tin chi tiết cho debug
        console.log('Excel Upload Success:', {
          totalProcessed: summary.totalProcessed,
          successful: summary.successful,
          duplicates: summary.duplicates,
          duplicateStudents: details.duplicateStudents
        });
        
        // Đóng modal và refresh data
        onSuccess();
        onClose();
      } else {
        throw new Error(response.data.message || 'Upload không thành công');
      }
    } catch (error: unknown) {
      console.error('Lỗi khi upload Excel:', error);
      
      // Improved error handling for Excel upload
      let errorMessage = 'Có lỗi xảy ra khi đọc file Excel';
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const { status, data } = error.response;
          
          if (data?.message) {
            errorMessage = data.message;
          } else if (data?.error) {
            errorMessage = data.error;
          } else if (data?.errors && Array.isArray(data.errors)) {
            errorMessage = data.errors.join(', ');
          } else if (typeof data === 'string') {
            errorMessage = data;
          } else {
            errorMessage = `Lỗi upload HTTP ${status}`;
          }
          
          // Hiển thị thông tin missing students nếu có
          if (data?.missingStudents && Array.isArray(data.missingStudents)) {
            const missingList = data.missingStudents.slice(0, 5).join(', ');
            const totalMissing = data.totalMissing || data.missingStudents.length;
            errorMessage += `\n\nHọc sinh không tồn tại: ${missingList}`;
            if (totalMissing > 5) {
              errorMessage += ` và ${totalMissing - 5} học sinh khác`;
            }
          }
          
          // Log detailed error for debugging
          console.error('Excel Upload API Error:', {
            status,
            statusText: error.response.statusText,
            data: error.response.data,
            url: error.config?.url,
            method: error.config?.method,
            fileName: file?.name
          });
        } else if (error.request) {
          errorMessage = 'Lỗi kết nối mạng khi upload file';
          console.error('Excel Upload Network Error:', {
            message: error.message,
            code: error.code,
            fileName: file?.name
          });
        } else {
          errorMessage = `Lỗi cấu hình upload: ${error.message}`;
          console.error('Excel Upload Request Error:', {
            message: error.message,
            fileName: file?.name
          });
        }
      } else if (error instanceof Error) {
        errorMessage = `Lỗi xử lý file: ${error.message}`;
        console.error('Excel Upload General Error:', {
          message: error.message,
          stack: error.stack,
          fileName: file?.name
        });
      } else {
        console.error('Excel Upload Unknown Error:', {
          error,
          fileName: file?.name
        });
      }
      
      toast.error(errorMessage);
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

  // Add validation function to check student data
  const validateStudentData = (studentData: StudentData): string | null => {
    if (!studentData.student || !studentData.student._id) {
      return 'Thông tin học sinh không hợp lệ';
    }

    if (subAwardType === 'custom_with_description') {
      if (!studentData.exam || !studentData.score) {
        return 'Thiếu thông tin bài thi hoặc điểm số';
      }
    }

    if (subAwardType === 'custom') {
      if (!studentData.activity || !Array.isArray(studentData.activity) || studentData.activity.length === 0) {
        return 'Thiếu thông tin hoạt động';
      }
    }

    return null; // No validation errors
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !selectedSubAward) return;

    const finalStudents = students
      .filter(s => s.student && s.student._id && s.student._id !== '');

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
        // Validate student data before submission
        const validationError = validateStudentData(stu);
        if (validationError) {
          failCount++;
          failList.push(`${stu.student.name || stu.student.studentCode}: ${validationError}`);
          continue;
        }

        await axios.post(API_ENDPOINTS.AWARD_RECORDS, recordData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        successCount++;
        console.log('Successfully added student:', stu.student.name || stu.student.studentCode, {
          studentId: stu.student._id,
          awardType: selectedSubAward.type,
          subAwardLabel: selectedSubAward.label
        });
      } catch (error: unknown) {
        failCount++;
        
        // Improved error handling for better debugging
        let errorMessage = 'Lỗi không xác định';
        
        if (axios.isAxiosError(error)) {
          // Check for different error scenarios
          if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;
            
            if (data?.message) {
              errorMessage = data.message;
            } else if (data?.error) {
              errorMessage = data.error;
            } else if (data?.errors && Array.isArray(data.errors)) {
              errorMessage = data.errors.join(', ');
            } else if (typeof data === 'string') {
              errorMessage = data;
            } else {
              errorMessage = `Lỗi HTTP ${status}`;
            }
            
            // Log detailed error for debugging
            console.error('API Error for student:', stu.student.name || stu.student.studentCode, {
              status,
              statusText: error.response.statusText,
              data: error.response.data,
              url: error.config?.url,
              method: error.config?.method,
              requestData: recordData
            });
          } else if (error.request) {
            // Network error
            errorMessage = 'Lỗi kết nối mạng';
            console.error('Network Error for student:', stu.student.name || stu.student.studentCode, {
              message: error.message,
              code: error.code,
              requestData: recordData
            });
          } else {
            // Request setup error
            errorMessage = `Lỗi cấu hình: ${error.message}`;
            console.error('Request Error for student:', stu.student.name || stu.student.studentCode, {
              message: error.message,
              requestData: recordData
            });
          }
        } else if (error instanceof Error) {
          errorMessage = `Lỗi: ${error.message}`;
          console.error('General Error for student:', stu.student.name || stu.student.studentCode, {
            message: error.message,
            stack: error.stack,
            requestData: recordData
          });
        } else {
          // Unknown error type
          errorMessage = 'Lỗi không xác định';
          console.error('Unknown Error for student:', stu.student.name || stu.student.studentCode, {
            error,
            requestData: recordData
          });
        }
        
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
                      <Combobox
                        onSelect={(selected) => {
                          handleStudentChange(index, 'student', selected);
                        }}
                        options={availableStudents.map(s => ({
                          value: s._id,
                          label: `${s.name} (${s.studentCode})`
                        }))}
                        placeholder="Chọn học sinh..."
                        searchPlaceholder="Tìm kiếm học sinh..."
                        emptyText="Không tìm thấy học sinh."
                        value={student.student._id}
                        className="mt-2"
                      />
                    </div>

                    {/* Custom fields for different award types */}
                    {subAwardType === 'custom' && (
                      <>
                                                    <div>
                              <Label>Hoạt động</Label>
                              <Input
                                value={Array.isArray(student.activity) ? student.activity.join(', ') : ''}
                                onChange={(e) => handleStudentChange(index, 'activity', e.target.value.split(', ').filter(s => s.trim()))}
                                placeholder="Nhập các hoạt động, cách nhau bằng dấu phẩy"
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <Label>Hoạt động (Tiếng Anh)</Label>
                              <Input
                                value={Array.isArray(student.activityEng) ? student.activityEng.join(', ') : ''}
                                onChange={(e) => handleStudentChange(index, 'activityEng', e.target.value.split(', ').filter(s => s.trim()))}
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
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-medium text-blue-800 mb-2">📋 Hướng dẫn upload Excel</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Chọn loại vinh danh và thời kỳ trước khi upload</li>
                    <li>• File Excel sẽ được xử lý và tạo records tự động</li>
                    <li>• Hệ thống sẽ thông báo kết quả sau khi xử lý xong</li>
                  </ul>
                </div>
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
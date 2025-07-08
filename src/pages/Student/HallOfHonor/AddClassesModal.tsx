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
  ClassData
} from '../../../types';
import type { Class } from '../../../types';

interface ExcelClassData {
  classCode: string;
  note?: string;
  noteEng?: string;
}

interface AddClassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedCategory: AwardCategory | null;
  selectedSchoolYear: string;
  selectedSubAward: SubAward | null;
}

const AddClassesModal: React.FC<AddClassesModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedCategory,
  selectedSchoolYear,
  selectedSubAward
}) => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [excelClasses, setExcelClasses] = useState<ClassData[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchAvailableClasses();
      // Initialize with one empty class
      setClasses([createEmptyClass()]);
      setExcelClasses([]);
    }
  }, [isOpen]);

  const createEmptyClass = (): ClassData => ({
    class: '',
    note: '',
    noteEng: ''
  });

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

  const handleAddClass = () => {
    setClasses([...classes, createEmptyClass()]);
  };

  const handleRemoveClass = (index: number) => {
    setClasses(classes.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_ENDPOINTS.AWARD_RECORDS}/upload-excel-classes`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.classes) {
        // Convert uploaded data to ClassData format
        const convertedClasses = response.data.classes.map((c: ExcelClassData) => {
          const classObj = availableClasses.find(cl => cl._id === c.classCode || cl.className === c.classCode);
          return {
            class: classObj?._id || c.classCode,
            classInfo: classObj,
            note: c.note || '',
            noteEng: c.noteEng || ''
          };
        });
        setExcelClasses(convertedClasses);
        toast.success(`Đã đọc thành công ${response.data.imported} lớp từ Excel`);
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
    const fileName = '/Template/record-sample-classes.xlsx';
    const a = document.createElement('a');
    a.href = fileName;
    a.download = fileName.split('/').pop() || 'template.xlsx';
    a.click();
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !selectedSubAward) return;

    const finalClasses = classes.filter(c => c.class).concat(
      excelClasses.filter(c => c.class)
    );

    if (finalClasses.length === 0) {
      toast.error('Vui lòng thêm ít nhất một lớp');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const recordData = {
        awardCategory: selectedCategory._id,
        students: [],
        awardClasses: finalClasses,
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

      await axios.post(API_ENDPOINTS.AWARD_RECORDS, recordData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Thêm lớp thành công');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Lỗi khi thêm lớp:', error);
      const errorResponse = error as { response?: { data?: { message?: string } } };
      const errorMessage = errorResponse.response?.data?.message || 'Có lỗi xảy ra khi thêm lớp';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCategory || !selectedSubAward) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Thêm lớp vào "{selectedSubAward.label}"</DialogTitle>
          <DialogDescription>
            Thêm lớp vào loại vinh danh "{selectedCategory.name}"
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Thêm thủ công</TabsTrigger>
            <TabsTrigger value="excel">Thêm từ Excel</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Danh sách lớp</h3>
              <Button size="sm" onClick={handleAddClass}>
                <Plus className="h-4 w-4 mr-1" />
                Thêm lớp
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-4 p-1">
                {classes.map((classData, index) => (
                  <div key={index} className="space-y-3 border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Lớp {index + 1}</span>
                      {classes.length > 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveClass(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
            </ScrollArea>
          </TabsContent>

          <TabsContent value="excel" className="flex-1 overflow-hidden">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-4">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                  disabled={uploadLoading}
                >
                  <Download className="h-4 w-4" />
                  Tải template Excel
                </Button>
                <label className="flex-1 cursor-pointer">
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={uploadLoading}
                    className="hidden"
                  />
                  <div className={`w-full border rounded px-3 py-2 bg-white flex items-center justify-between ${uploadLoading ? 'opacity-60' : ''}`}
                       style={{ minHeight: 40 }}>
                    <span className="truncate text-sm">
                      {selectedFileName ? `Đã chọn: ${selectedFileName}` : 'Chọn tệp Excel'}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">{uploadLoading ? 'Đang tải...' : ''}</span>
                  </div>
                </label>
              </div>

              {uploadLoading && (
                <div className="text-center py-4">
                  <div className="text-sm text-muted-foreground">Đang xử lý file Excel...</div>
                </div>
              )}

              {excelClasses.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">
                    Danh sách lớp từ Excel ({excelClasses.length} lớp)
                  </h4>
                  <ScrollArea className="h-[300px] border rounded-md p-4">
                    <div className="space-y-2">
                      {excelClasses.map((classData, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">
                              {classData.classInfo?.className || classData.class}
                            </span>
                            {classData.note && (
                              <span className="text-sm text-gray-600 ml-2">
                                - {classData.note}
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
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang thêm...' : 'Thêm lớp'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddClassesModal; 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Trophy, 
  Edit, 
  Trash2, 
  Users, 
  GraduationCap, 
  Search,
} from 'lucide-react';
import { API_ENDPOINTS } from '../../../lib/config';
import { toast } from 'sonner';
import EditRecordModal from './EditRecordModal';
import AddStudentsModal from './AddStudentsModal';
import AddClassesModal from './AddClassesModal';
import type { 
  AwardCategory, 
  SubAward, 
  StudentData, 
  AwardRecord,
  SchoolYearExtended,
  ClassData
} from '../../../types';

interface RecordsPanelProps {
  selectedCategory: AwardCategory | null;
}

const RecordsPanel: React.FC<RecordsPanelProps> = ({ selectedCategory }) => {
  const [records, setRecords] = useState<AwardRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState<boolean>(false);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('');
  const [availableSchoolYears, setAvailableSchoolYears] = useState<SchoolYearExtended[]>([]);
  const [selectedSubAward, setSelectedSubAward] = useState<string>('');
  const [availableSubAwards, setAvailableSubAwards] = useState<SubAward[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [recordToDelete, setRecordToDelete] = useState<AwardRecord | null>(null);

  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [recordToEdit, setRecordToEdit] = useState<AwardRecord | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<StudentData | null>(null);
  const [classToEdit, setClassToEdit] = useState<ClassData | null>(null);

  // Add Students modal states
  const [addStudentsModalOpen, setAddStudentsModalOpen] = useState<boolean>(false);

  // Add Classes modal states
  const [addClassesModalOpen, setAddClassesModalOpen] = useState<boolean>(false);

  // Fetch school years from backend
  useEffect(() => {
    const fetchSchoolYears = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(API_ENDPOINTS.SCHOOL_YEARS, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const schoolYears = response.data?.data || response.data || [];
        
        setAvailableSchoolYears(schoolYears);
        
        // Set active school year as default, or first one if no active year
        const activeYear = schoolYears.find((year: SchoolYearExtended) => year.isActive);
        if (activeYear) {
          setSelectedSchoolYear(activeYear._id);
        } else if (schoolYears.length > 0) {
          setSelectedSchoolYear(schoolYears[0]._id);
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách năm học:', error);
        // Fallback to empty if API fails
        setAvailableSchoolYears([]);
        setSelectedSchoolYear('');
      }
    };

    fetchSchoolYears();
  }, []);

  // Fetch available subAwards when category or school year changes
  useEffect(() => {
    if (selectedCategory && selectedSchoolYear) {
      const subAwardsForYear = selectedCategory.subAwards.filter(
        (subAward) => subAward.schoolYear === selectedSchoolYear
      );
      
      setAvailableSubAwards(subAwardsForYear);
      
      // Auto-select first subAward if available
      if (subAwardsForYear.length > 0) {
        // Create unique identifier for subAward
        const firstSubAward = subAwardsForYear[0];
        const subAwardId = `${firstSubAward.type}-${firstSubAward.label}-${firstSubAward.semester || ''}-${firstSubAward.month || ''}`;
        setSelectedSubAward(subAwardId);
      } else {
        setSelectedSubAward('');
      }
    } else {
      setAvailableSubAwards([]);
      setSelectedSubAward('');
    }
  }, [selectedCategory, selectedSchoolYear]);

  useEffect(() => {
    if (selectedCategory && selectedSchoolYear && selectedSubAward) {
      // Parse subAwardId to get the actual subAward object
      const subAward = availableSubAwards.find(sa => {
        const subAwardId = `${sa.type}-${sa.label}-${sa.semester || ''}-${sa.month || ''}`;
        return subAwardId === selectedSubAward;
      });
      
      if (subAward) {
        fetchRecords(selectedCategory._id, selectedSchoolYear, subAward);
      }
    }
  }, [selectedCategory, selectedSchoolYear, selectedSubAward, availableSubAwards]);

  const fetchRecords = async (categoryId: string, schoolYear: string, subAward?: SubAward) => {
    try {
      setRecordsLoading(true);
      const token = localStorage.getItem('token');
      const params: Record<string, string> = { 
        awardCategory: categoryId,
        subAwardSchoolYear: schoolYear
      };
      
      if (subAward) {
        params.subAwardType = subAward.type;
        params.subAwardLabel = subAward.label;
        if (subAward.semester) {
          params.subAwardSemester = subAward.semester.toString();
        }
        if (subAward.month) {
          params.subAwardMonth = subAward.month.toString();
        }
      }
      
      console.log('📍 Fetching records with params:', params);
      console.log('📍 SubAward object:', subAward);
      
      const response = await axios.get(API_ENDPOINTS.AWARD_RECORDS, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📍 API Response:', response.data);
      const recordsData = Array.isArray(response.data) ? response.data : [];
      console.log('📍 Final records:', recordsData);
      setRecords(recordsData);
    } catch (error) {
      console.error('Lỗi khi tải danh sách bản ghi vinh danh:', error);
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleEditRecord = (record: AwardRecord, studentData?: StudentData, classData?: ClassData) => {
    setRecordToEdit(record);
    setStudentToEdit(studentData || null);
    setClassToEdit(classData || null);
    setEditModalOpen(true);
  };

  const handleDeleteRecord = (record: AwardRecord) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteRecord = async () => {
    if (!recordToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_ENDPOINTS.AWARD_RECORDS}/${recordToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Xóa bản ghi thành công');
      
      // Refresh records after deletion
      if (selectedCategory && selectedSchoolYear) {
        const subAward = availableSubAwards.find(sa => {
          const subAwardId = `${sa.type}-${sa.label}-${sa.semester || ''}-${sa.month || ''}`;
          return subAwardId === selectedSubAward;
        });
        
        if (subAward) {
          fetchRecords(selectedCategory._id, selectedSchoolYear, subAward);
        }
      }
      
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error('Lỗi khi xóa bản ghi:', error);
      toast.error('Có lỗi xảy ra khi xóa bản ghi');
    }
  };

  const handleAddStudents = () => {
    setAddStudentsModalOpen(true);
  };

  const handleAddClasses = () => {
    setAddClassesModalOpen(true);
  };

  const handleEditSuccess = () => {
    // Refresh records after successful edit
    if (selectedCategory && selectedSchoolYear) {
      const subAward = availableSubAwards.find(sa => {
        const subAwardId = `${sa.type}-${sa.label}-${sa.semester || ''}-${sa.month || ''}`;
        return subAwardId === selectedSubAward;
      });
      
      if (subAward) {
        fetchRecords(selectedCategory._id, selectedSchoolYear, subAward);
      }
    }
  };

  // Filter records based on search term
  const filteredRecords = records.filter(record => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in students
    if (record.students) {
      return record.students.some(studentData => {
        const studentName = studentData.student?.name?.toLowerCase() || '';
        const studentCode = studentData.student?.studentCode?.toLowerCase() || '';
        return studentName.includes(searchLower) || studentCode.includes(searchLower);
      });
    }
    
    // Search in classes
    if (record.awardClasses) {
      return record.awardClasses.some(classData => {
        const className = classData.classInfo?.className?.toLowerCase() || classData.class?.toLowerCase() || '';
        return className.includes(searchLower);
      });
    }
    
    return false;
  });

  return (
    <Card className="h-full">
      <CardHeader>
        {/* Dòng trên: Title + Search */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <CardTitle>
              {selectedCategory ? selectedCategory.name : 'Chọn loại vinh danh'}
            </CardTitle>
            <CardDescription>
              {selectedCategory
                ? 'Danh sách các bản ghi vinh danh'
                : 'Hãy chọn một loại vinh danh để xem các bản ghi'
              }
            </CardDescription>
          </div>
          {/* Search Bar */}
          {selectedCategory && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm học sinh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          )}
        </div>
        {/* Dòng dưới: Selector + Nút */}
        {selectedCategory && (
          <div className="flex flex-wrap items-center justify-end gap-4 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Năm học:</span>
              <Select value={selectedSchoolYear} onValueChange={setSelectedSchoolYear}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Chọn năm" />
                </SelectTrigger>
                <SelectContent>
                  {availableSchoolYears.map((year) => (
                    <SelectItem key={year._id} value={year._id}>
                      {year.displayName || year.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* SubAward Selector */}
            {availableSubAwards.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Hạng mục:</span>
                <Select value={selectedSubAward} onValueChange={setSelectedSubAward}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Chọn hạng mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubAwards.map((subAward) => {
                      const subAwardId = `${subAward.type}-${subAward.label}-${subAward.semester || ''}-${subAward.month || ''}`;
                      return (
                        <SelectItem key={subAwardId} value={subAwardId}>
                          {subAward.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Action Buttons */}
            <div className="flex gap-2">
              {selectedCategory?.recipientType === 'student' && (
                <Button size="sm" onClick={handleAddStudents}>
                  <Users className="h-4 w-4 mr-1" />
                  Thêm học sinh
                </Button>
              )}
              {selectedCategory?.recipientType === 'class' && (
                <Button size="sm" onClick={handleAddClasses}>
                  <GraduationCap className="h-4 w-4 mr-1" />
                  Thêm lớp
                </Button>
              )}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="p-4">
            {!selectedCategory ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">Chọn loại vinh danh</p>
                <p className="text-sm">
                  Hãy chọn một loại vinh danh bên trái để xem các bản ghi
                </p>
              </div>
            ) : recordsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Đang tải bản ghi...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">
                  {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có bản ghi nào'}
                </p>
                <p className="text-sm">
                  {searchTerm 
                    ? 'Hãy thử tìm kiếm với từ khóa khác'
                    : `Hãy thêm bản ghi vinh danh đầu tiên cho năm học ${selectedSchoolYear}`
                  }
                </p>
              </div>
            ) : (
              <div className="gap-2">
                {filteredRecords.map((record) => (
                  <div key={record._id}>
                    {/* Hiển thị từng học sinh trong record */}
                    {record.students?.map((studentData, idx) => {
                      const type = record.subAward.type;
                      return (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors mb-2"
                        >
                          <div className="flex-1">
                            <span className="font-medium text-[#002855]">
                              {studentData.student?.name} ({studentData.student?.studentCode})
                            </span>
                            {/* Định kỳ: chỉ Tên, Note, NoteEng */}
                            {['year', 'semester', 'month', 'schoolYear'].includes(type) && (
                              <>
                                {studentData.note && (
                                  <div className="text-xs text-[#002855] mt-1">Ghi chú: {studentData.note}</div>
                                )}
                                {studentData.noteEng && (
                                  <div className="text-xs text-[#002855] mt-1">Note (EN): {studentData.noteEng}</div>
                                )}
                              </>
                            )}
                            {/* Tuỳ chọn: Tên, Activities, ActivitiesEng, Note, NoteEng */}
                            {type === 'custom' && (
                              <>
                                {studentData.activity && studentData.activity.length > 0 && (
                                  <div className="text-xs text-[#002855] mt-1">Hoạt động: {studentData.activity.join(', ')}</div>
                                )}
                                {studentData.note && (
                                  <div className="text-xs text-[#002855] mt-1">Ghi chú: {studentData.note}</div>
                                )}
                                {studentData.noteEng && (
                                  <div className="text-xs text-[#002855] mt-1">Note (EN): {studentData.noteEng}</div>
                                )}
                              </>
                            )}
                            {/* Tuỳ chọn có mô tả: Tên, Bài thi, Điểm */}
                            {type === 'custom_with_description' && (
                              <>
                                {studentData.exam && (
                                  <div className="text-xs text-[#002855] mt-1">Bài thi: {studentData.exam}</div>
                                )}
                                {studentData.score !== undefined && studentData.score !== '' && (
                                  <div className="text-xs text-[#002855] mt-1">Điểm: {studentData.score}</div>
                                )}
                              </>
                            )}
                          </div>
                          {/* Action buttons */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditRecord(record, studentData)}
                              title="Chỉnh sửa học sinh"
                              className="h-8 px-3 text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteRecord(record)}
                              title="Xóa bản ghi"
                              className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Hiển thị từng lớp trong record */}
                    {record.awardClasses?.map((classData, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors mb-2"
                      >
                        <div className="flex-1">
                          <span className="font-medium text-[#002855]">
                            {classData.classInfo?.className || classData.class}
                          </span>
                          {classData.note && (
                            <div className="text-xs text-[#002855] mt-1">
                              Ghi chú: {classData.note}
                            </div>
                          )}
                        </div>
                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRecord(record, undefined, classData)}
                            title="Chỉnh sửa bản ghi"
                            className="h-8 px-3 text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteRecord(record)}
                            title="Xóa bản ghi"
                            className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bản ghi</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bản ghi vinh danh <strong>"{recordToDelete?.subAward.label}"</strong>?
              <br />
              Hành động này không thể hoàn tác và sẽ xóa tất cả thông tin học sinh/lớp trong bản ghi này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteRecord}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa bản ghi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Record Modal */}
      <EditRecordModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setRecordToEdit(null);
          setStudentToEdit(null);
          setClassToEdit(null);
        }}
        record={recordToEdit}
        studentData={studentToEdit}
        classData={classToEdit}
        onSuccess={handleEditSuccess}
      />

      {/* Add Students Modal */}
      <AddStudentsModal
        isOpen={addStudentsModalOpen}
        onClose={() => setAddStudentsModalOpen(false)}
        selectedCategory={selectedCategory}
        selectedSchoolYear={selectedSchoolYear}
        selectedSubAward={availableSubAwards.find(sa => {
          const subAwardId = `${sa.type}-${sa.label}-${sa.semester || ''}-${sa.month || ''}`;
          return subAwardId === selectedSubAward;
        }) || null}
        onSuccess={() => {
          setAddStudentsModalOpen(false);
          if (selectedCategory && selectedSchoolYear) {
            const subAward = availableSubAwards.find(sa => {
              const subAwardId = `${sa.type}-${sa.label}-${sa.semester || ''}-${sa.month || ''}`;
              return subAwardId === selectedSubAward;
            });
            if (subAward) {
              fetchRecords(selectedCategory._id, selectedSchoolYear, subAward);
            }
          }
        }}
      />

      {/* Add Classes Modal */}
      <AddClassesModal
        isOpen={addClassesModalOpen}
        onClose={() => setAddClassesModalOpen(false)}
        selectedCategory={selectedCategory}
        selectedSchoolYear={selectedSchoolYear}
        selectedSubAward={availableSubAwards.find(sa => {
          const subAwardId = `${sa.type}-${sa.label}-${sa.semester || ''}-${sa.month || ''}`;
          return subAwardId === selectedSubAward;
        }) || null}
        onSuccess={() => {
          setAddClassesModalOpen(false);
          if (selectedCategory && selectedSchoolYear) {
            const subAward = availableSubAwards.find(sa => {
              const subAwardId = `${sa.type}-${sa.label}-${sa.semester || ''}-${sa.month || ''}`;
              return subAwardId === selectedSubAward;
            });
            if (subAward) {
              fetchRecords(selectedCategory._id, selectedSchoolYear, subAward);
            }
          }
        }}
      />
    </Card>
  );
};

export default RecordsPanel; 
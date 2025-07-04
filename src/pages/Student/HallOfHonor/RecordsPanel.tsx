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
} from '../../../components/ui/alert-dialog';
import { 
  Trophy, 
  Edit, 
  Trash2, 
  Users, 
  GraduationCap, 
  Download,
} from 'lucide-react';
import { API_ENDPOINTS } from '../../../lib/config';
import { toast } from 'sonner';
import EditRecordModal from './EditRecordModal';

interface SubAward {
  type: string;
  label: string;
  labelEng?: string;
  priority?: number;
  schoolYear?: string;
  semester?: number;
  month?: number;
}

interface AwardCategory {
  _id: string;
  name: string;
  nameEng: string;
  description: string;
  descriptionEng: string;
  coverImage?: string;
  subAwards: SubAward[];
  createdAt: string;
  updatedAt: string;
}

interface Student {
  _id: string;
  name: string;
  studentCode: string;
}

interface Photo {
  _id: string;
  student: string;
  schoolYear: string;
  url: string;
}

interface Class {
  _id: string;
  className: string;
  classCode: string;
}

interface SchoolYear {
  _id: string;
  code: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

interface StudentData {
  student: Student;
  exam?: string;
  score?: number | string;
  photo?: Photo;
  currentClass?: Class;
  activity?: string[];
  note?: string;
  noteEng?: string;
}

interface AwardRecord {
  _id: string;
  awardCategory: AwardCategory;
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
  awardClasses: Array<{
    class: string;
    note?: string;
    noteEng?: string;
    classInfo?: Class;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface RecordsPanelProps {
  selectedCategory: AwardCategory | null;
}

const RecordsPanel: React.FC<RecordsPanelProps> = ({ selectedCategory }) => {
  const [records, setRecords] = useState<AwardRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState<boolean>(false);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('');
  const [availableSchoolYears, setAvailableSchoolYears] = useState<SchoolYear[]>([]);
  const [selectedSubAward, setSelectedSubAward] = useState<string>('');
  const [availableSubAwards, setAvailableSubAwards] = useState<SubAward[]>([]);
  
  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [recordToDelete, setRecordToDelete] = useState<AwardRecord | null>(null);

  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [recordToEdit, setRecordToEdit] = useState<AwardRecord | null>(null);

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
        const activeYear = schoolYears.find((year: SchoolYear) => year.isActive);
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



  const handleEditRecord = (record: AwardRecord) => {
    setRecordToEdit(record);
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
    // TODO: Implement add students functionality
    console.log('Add students');
  };

  const handleAddClasses = () => {
    // TODO: Implement add classes functionality
    console.log('Add classes');
  };

  const handleDownloadExcel = () => {
    // TODO: Implement download Excel functionality
    console.log('Download Excel');
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



  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
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
          
          {/* School Year and SubAward Selectors */}
          <div className="flex items-center gap-4">
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
            {selectedCategory && (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddStudents}>
                  <Users className="h-4 w-4 mr-1" />
                  Thêm học sinh
                </Button>
                <Button size="sm" variant="outline" onClick={handleAddClasses}>
                  <GraduationCap className="h-4 w-4 mr-1" />
                  Thêm lớp
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownloadExcel}>
                  <Download className="h-4 w-4 mr-1" />
                  Tải Excel
                </Button>
              </div>
            )}
          </div>
        </div>
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
            ) : records.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">Chưa có bản ghi nào</p>
                <p className="text-sm">
                  Hãy thêm bản ghi vinh danh đầu tiên cho năm học {selectedSchoolYear}
                </p>
              </div>
            ) : (
              <div className="gap-2">
                {records.map((record) => (
                  <div key={record._id}>
                    {/* Hiển thị từng học sinh trong record */}
                    {record.students?.map((studentData, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors mb-2"
                      >
                        <div className="flex-1">
                          <span className="font-medium text-[#002855]">
                            {studentData.student?.name} ({studentData.student?.studentCode})
                          </span>
                          {studentData.note && (
                            <div className="text-xs text-[#002855] mt-1">
                              Ghi chú: {studentData.note}
                            </div>
                          )}
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRecord(record)}
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

                    {/* Hiển thị từng lớp trong record */}
                    {record.awardClasses?.map((classData, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <div className="flex-1">
                          <span className="font-medium text-green-800">
                            {classData.classInfo?.className || classData.class}
                          </span>
                          {classData.note && (
                            <div className="text-xs text-green-600 mt-1">
                              Ghi chú: {classData.note}
                            </div>
                          )}
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRecord(record)}
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
        }}
        record={recordToEdit}
        onSuccess={handleEditSuccess}
      />
    </Card>
  );
};

export default RecordsPanel; 
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
import { Badge } from '../../../components/ui/badge';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Separator } from '../../../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { 
  Plus, 
  Trophy, 
  Edit, 
  Trash2, 
  Users, 
  GraduationCap, 
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { API_ENDPOINTS } from '../../../lib/config';

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
  students: Array<{
    student: Student;
    exam?: string;
    score?: number | string;
    photo?: Photo;
    currentClass?: Class;
    activity?: string[];
    note?: string;
    noteEng?: string;
  }>;
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
  const [availableSchoolYears, setAvailableSchoolYears] = useState<string[]>([]);

  // Generate school years (current year and previous 5 years)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i <= 5; i++) {
      const year = currentYear - i;
      years.push(`${year}-${year + 1}`);
    }
    setAvailableSchoolYears(years);
    if (years.length > 0) {
      setSelectedSchoolYear(years[0]); // Set current school year as default
    }
  }, []);

  useEffect(() => {
    if (selectedCategory && selectedSchoolYear) {
      fetchRecords(selectedCategory._id, selectedSchoolYear);
    }
  }, [selectedCategory, selectedSchoolYear]);

  const fetchRecords = async (categoryId: string, schoolYear: string) => {
    try {
      setRecordsLoading(true);
      const response = await axios.get(API_ENDPOINTS.AWARD_RECORDS, {
        params: { 
          awardCategory: categoryId,
          subAwardSchoolYear: schoolYear
        }
      });
      const recordsData = Array.isArray(response.data) ? response.data : [];
      setRecords(recordsData);
    } catch (error) {
      console.error('Lỗi khi tải danh sách bản ghi vinh danh:', error);
    } finally {
      setRecordsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleEditRecord = (recordId: string) => {
    // TODO: Implement edit record functionality
    console.log('Edit record:', recordId);
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      return;
    }
    
    try {
      await axios.delete(`${API_ENDPOINTS.AWARD_RECORDS}/${recordId}`);
      // Refresh records after deletion
      if (selectedCategory && selectedSchoolYear) {
        fetchRecords(selectedCategory._id, selectedSchoolYear);
      }
    } catch (error) {
      console.error('Lỗi khi xóa bản ghi:', error);
      alert('Có lỗi xảy ra khi xóa bản ghi');
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

  const renderStudentInfo = (studentData: any) => {
    const { student, exam, score, activity, note, noteEng } = studentData;
    
    return (
      <div className="space-y-1">
        <div className="font-medium">
          {student?.name || 'N/A'}
          {student?.studentCode && (
            <span className="text-muted-foreground ml-1">
              ({student.studentCode})
            </span>
          )}
        </div>
        
        {/* Hiển thị exam và score nếu có */}
        {exam && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Bài thi:</span> {exam}
            {score && (
              <span className="ml-2">
                <span className="font-medium">Điểm:</span> {score}
              </span>
            )}
          </div>
        )}
        
        {/* Hiển thị activity nếu có */}
        {activity && activity.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Hoạt động:</span> {activity.join(', ')}
          </div>
        )}
        
        {/* Hiển thị note */}
        {note && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Ghi chú:</span> {note}
          </div>
        )}
        
        {noteEng && (
          <div className="text-xs text-muted-foreground italic">
            <span className="font-medium">Note (EN):</span> {noteEng}
          </div>
        )}
      </div>
    );
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
          
          {/* School Year Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Năm học:</span>
              <Select value={selectedSchoolYear} onValueChange={setSelectedSchoolYear}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Chọn năm" />
                </SelectTrigger>
                <SelectContent>
                  {availableSchoolYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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
              <div className="space-y-3">
                {records.map((record) => (
                  <Card key={record._id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header row with title and actions */}
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-base">
                                {record.subAward.label}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {record.subAward.type}
                              </Badge>
                              {record.subAward.priority !== undefined && (
                                <Badge variant="secondary" className="text-xs">
                                  Ưu tiên: {record.subAward.priority}
                                </Badge>
                              )}
                            </div>
                            
                            {record.subAward.labelEng && (
                              <p className="text-sm text-muted-foreground italic">
                                {record.subAward.labelEng}
                              </p>
                            )}
                            
                            {/* Time info */}
                            <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                              <span>Năm học: {record.subAward.schoolYear}</span>
                              {record.subAward.semester && (
                                <span>Học kỳ: {record.subAward.semester}</span>
                              )}
                              {record.subAward.month && (
                                <span>Tháng: {record.subAward.month}</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditRecord(record._id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteRecord(record._id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        {/* Students section */}
                        {record.students?.length > 0 && (
                          <div>
                            <Separator className="my-2" />
                            <div>
                              <span className="font-medium text-sm">
                                Học sinh ({record.students.length}):
                              </span>
                              <div className="mt-2 space-y-2">
                                {record.students.map((studentData, idx) => (
                                  <div key={idx} className="p-2 bg-muted/30 rounded-md">
                                    {renderStudentInfo(studentData)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Classes section */}
                        {record.awardClasses?.length > 0 && (
                          <div>
                            <Separator className="my-2" />
                            <div>
                              <span className="font-medium text-sm">
                                Lớp ({record.awardClasses.length}):
                              </span>
                              <div className="mt-2 space-y-2">
                                {record.awardClasses.map((classData, idx) => (
                                  <div key={idx} className="p-2 bg-muted/30 rounded-md">
                                    <div className="font-medium">
                                      {classData.classInfo?.className || classData.class}
                                    </div>
                                    {classData.note && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        <span className="font-medium">Ghi chú:</span> {classData.note}
                                      </div>
                                    )}
                                    {classData.noteEng && (
                                      <div className="text-xs text-muted-foreground italic mt-1">
                                        <span className="font-medium">Note (EN):</span> {classData.noteEng}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Created date */}
                        <div className="text-xs text-muted-foreground text-right">
                          Tạo: {formatDate(record.createdAt)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecordsPanel; 
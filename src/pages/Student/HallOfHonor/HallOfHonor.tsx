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
import { Plus, Trophy, Edit } from 'lucide-react';
import { API_ENDPOINTS } from '../../../lib/config';
import CreateCategoryDialog from './CreateCategoryDialog';
import EditCategoryDialog from './EditCategoryDialog';
import SubAwardsModal from './SubAwardsModal';

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

const HallOfHonor: React.FC = () => {
  const [categories, setCategories] = useState<AwardCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AwardCategory | null>(null);
  const [records, setRecords] = useState<AwardRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [recordsLoading, setRecordsLoading] = useState<boolean>(false);
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<AwardCategory | null>(null);
  const [subAwardsModalOpen, setSubAwardsModalOpen] = useState<boolean>(false);
  const [editingCategoryForSubAwards, setEditingCategoryForSubAwards] = useState<AwardCategory | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchRecords(selectedCategory._id);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.AWARD_CATEGORIES);
      const categoriesData = Array.isArray(response.data) ? response.data : [];
      setCategories(categoriesData);
      
      // Auto select first category
      if (categoriesData.length > 0 && !selectedCategory) {
        setSelectedCategory(categoriesData[0]);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách loại vinh danh:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async (categoryId: string) => {
    try {
      setRecordsLoading(true);
      const response = await axios.get(API_ENDPOINTS.AWARD_RECORDS, {
        params: { awardCategory: categoryId }
      });
      const recordsData = Array.isArray(response.data) ? response.data : [];
      setRecords(recordsData);
    } catch (error) {
      console.error('Lỗi khi tải danh sách bản ghi vinh danh:', error);
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleCategorySelect = (category: AwardCategory) => {
    setSelectedCategory(category);
  };

  const handleCreateCategory = () => {
    setCreateDialogOpen(true);
  };

  const handleCategoryCreated = (newCategory: AwardCategory) => {
    setCategories(prev => [...prev, newCategory]);
    setSelectedCategory(newCategory);
    setCreateDialogOpen(false);
  };

  const handleEditCategory = (category: AwardCategory, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection
    setEditingCategory(category);
    setEditDialogOpen(true);
  };

  const handleCategoryUpdated = (updatedCategory: AwardCategory) => {
    setCategories(prev => 
      prev.map(cat => cat._id === updatedCategory._id ? updatedCategory : cat)
    );
    if (selectedCategory?._id === updatedCategory._id) {
      setSelectedCategory(updatedCategory);
    }
    setEditDialogOpen(false);
    setEditingCategory(null);
  };

  const handleSubAwardsClick = (category: AwardCategory, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection
    setEditingCategoryForSubAwards(category);
    setSubAwardsModalOpen(true);
  };

  const handleSubAwardsCategoryUpdated = (updatedCategory: AwardCategory) => {
    setCategories(prev => 
      prev.map(cat => cat._id === updatedCategory._id ? updatedCategory : cat)
    );
    if (selectedCategory?._id === updatedCategory._id) {
      setSelectedCategory(updatedCategory);
    }
    setSubAwardsModalOpen(false);
    setEditingCategoryForSubAwards(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="w-full mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
        {/* Left Panel - Categories */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    Loại vinh danh
                  </CardTitle>
                  <CardDescription>
                    Quản lý các loại giải thưởng và vinh danh
                  </CardDescription>
                </div>
                <Button onClick={handleCreateCategory} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Tạo mới
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="p-4 space-y-2">
                  {loading ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Đang tải...
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="text-center py-2 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Chưa có loại vinh danh nào</p>
                      <p className="text-sm">Hãy tạo loại vinh danh đầu tiên</p>
                    </div>
                  ) : (
                    categories.map((category) => (
                      <Card
                        key={category._id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedCategory?._id === category._id
                            ? 'ring-2 ring-primary bg-muted/30'
                            : ''
                        }`}
                        onClick={() => handleCategorySelect(category)}
                      >
                        <CardContent className="py-0">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <h3 className="font-semibold text-sm leading-tight flex-1">
                                {category.name}
                              </h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 ml-2"
                                onClick={(e) => handleEditCategory(category, e)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {category.description}
                            </p>
                            <div className="flex justify-between items-center pt-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="text-xs h-6 px-2 hover:bg-secondary/80"
                                onClick={(e) => handleSubAwardsClick(category, e)}
                              >
                                {category.subAwards?.length || 0} Hạng mục
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Records */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
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
                {selectedCategory && (
                  <Button>
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm bản ghi
                  </Button>
                )}
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
                        Hãy thêm bản ghi vinh danh đầu tiên cho loại này
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {records.map((record) => (
                        <Card key={record._id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-base">
                                    {record.subAward.label}
                                  </h3>
                                  {record.subAward.labelEng && (
                                    <p className="text-sm text-muted-foreground italic">
                                      {record.subAward.labelEng}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline" className="mb-1">
                                    {record.subAward.type}
                                  </Badge>
                                  {record.subAward.priority !== undefined && (
                                    <p className="text-xs text-muted-foreground">
                                      Ưu tiên: {record.subAward.priority}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Năm học:</span>{' '}
                                  {record.subAward.schoolYear}
                                </div>
                                {record.subAward.semester && (
                                  <div>
                                    <span className="font-medium">Học kỳ:</span>{' '}
                                    {record.subAward.semester}
                                  </div>
                                )}
                                {record.subAward.month && (
                                  <div>
                                    <span className="font-medium">Tháng:</span>{' '}
                                    {record.subAward.month}
                                  </div>
                                )}
                              </div>

                              {record.students?.length > 0 && (
                                <div>
                                  <Separator className="my-2" />
                                  <div>
                                    <span className="font-medium text-sm">
                                      Học sinh ({record.students.length}):
                                    </span>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {record.students.slice(0, 5).map((studentData, idx) => (
                                        <Badge key={idx} variant="secondary">
                                          {studentData.student?.name || 'N/A'} 
                                          {studentData.student?.studentCode && 
                                            ` (${studentData.student.studentCode})`
                                          }
                                        </Badge>
                                      ))}
                                      {record.students.length > 5 && (
                                        <Badge variant="outline">
                                          +{record.students.length - 5} khác
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {record.awardClasses?.length > 0 && (
                                <div>
                                  <Separator className="my-2" />
                                  <div>
                                    <span className="font-medium text-sm">
                                      Lớp ({record.awardClasses.length}):
                                    </span>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {record.awardClasses.map((classData, idx) => (
                                        <Badge key={idx} variant="secondary">
                                          {classData.classInfo?.className || classData.class}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

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
        </div>
      </div>

      {/* Create Category Dialog */}
      <CreateCategoryDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCategoryCreated={handleCategoryCreated}
      />

      {/* Edit Category Dialog */}
      <EditCategoryDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        category={editingCategory}
        onCategoryUpdated={handleCategoryUpdated}
      />

      {/* Sub Awards Modal */}
      <SubAwardsModal
        open={subAwardsModalOpen}
        onOpenChange={setSubAwardsModalOpen}
        category={editingCategoryForSubAwards}
        onCategoryUpdated={handleSubAwardsCategoryUpdated}
      />
    </div>
  );
};

export default HallOfHonor;

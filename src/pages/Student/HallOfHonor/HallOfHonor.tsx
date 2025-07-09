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
import { Plus, Trophy, Edit, Info } from 'lucide-react';
import { API_ENDPOINTS } from '../../../lib/config';
import CreateCategoryDialog from './CreateCategoryDialog';
import EditCategoryDialog from './EditCategoryDialog';
import SubAwardsModal from './SubAwardsModal';
import RecordsPanel from './RecordsPanel';
import type { AwardCategory } from '../../../types';

const HallOfHonor: React.FC = () => {
  const [categories, setCategories] = useState<AwardCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AwardCategory | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<AwardCategory | null>(null);
  const [subAwardsModalOpen, setSubAwardsModalOpen] = useState<boolean>(false);
  const [editingCategoryForSubAwards, setEditingCategoryForSubAwards] = useState<AwardCategory | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleShowId = (category: AwardCategory, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection
    alert(`ID: ${category._id}`);
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
                              <div className="flex items-center gap-2 flex-1">
                                <h3 className="font-semibold text-sm leading-tight">
                                  {category.name}
                                </h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 rounded-full"
                                  onClick={(e) => handleShowId(category, e)}
                                >
                                  <Info className="h-3 w-3" />
                                </Button>
                              </div>
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
                              <div className="flex gap-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="text-xs h-6 px-2 hover:bg-secondary/80"
                                  onClick={(e) => handleSubAwardsClick(category, e)}
                                >
                                  {category.subAwards?.length || 0} Hạng mục
                                </Button>
                                <span
                                  className="text-xs h-6 px-2 rounded bg-secondary text-secondary-foreground flex items-center"
                                >
                                  {category.recipientType === 'student' ? 'Học sinh' : 'Lớp'}
                                </span>
                              </div>
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
          <RecordsPanel selectedCategory={selectedCategory} />
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

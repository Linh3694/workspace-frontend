import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Checkbox } from '../../../components/ui/checkbox';

import { Trash2, Save } from 'lucide-react';
import { API_ENDPOINTS } from '../../../lib/config';

interface SubAward {
  type: string;
  label: string;
  labelEng?: string;
  priority?: number;
  schoolYear?: string;
  semester?: number;
  month?: number;
  description?: string;
  descriptionEng?: string;
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

interface SchoolYear {
  _id: string;
  name: string;
  code: string;
}

interface SubAwardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: AwardCategory | null;
  onCategoryUpdated: (updatedCategory: AwardCategory) => void;
}

const SubAwardsModal: React.FC<SubAwardsModalProps> = ({
  open,
  onOpenChange,
  category,
  onCategoryUpdated,
}) => {
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [subAwards, setSubAwards] = useState<SubAward[]>([]);
  const [loading, setLoading] = useState(false);

  // Mode selection states
  const [selectedModes, setSelectedModes] = useState({
    custom: false,
    customWithDescription: false,
    schoolYear: false,
  });

  // Form states cho custom awards
  const [customForm, setCustomForm] = useState({
    label: '',
    labelEng: '',
    schoolYear: '',
    priority: 1,
  });

  // Form states cho custom with description awards
  const [customDescForm, setCustomDescForm] = useState({
    label: '',
    description: '',
    descriptionEng: '',
    schoolYear: '',
    priority: 1,
  });



  useEffect(() => {
    if (open && category) {
      setSubAwards([...category.subAwards]);
      fetchSchoolYears();
      
      // Detect current modes based on existing subAwards
      const hasCustom = category.subAwards.some(s => s.type === 'custom');
      const hasCustomDesc = category.subAwards.some(s => s.type === 'custom_with_description');
      const hasSchoolYear = category.subAwards.some(s => s.type === 'schoolYear');
      
      setSelectedModes({
        custom: hasCustom,
        customWithDescription: hasCustomDesc,
        schoolYear: hasSchoolYear,
      });
    }
  }, [open, category]);

  const fetchSchoolYears = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.SCHOOL_YEARS, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // API trả về { data: schoolYears }
      const schoolYearsData = response.data?.data || [];
      console.log('School Years loaded:', schoolYearsData);
      setSchoolYears(schoolYearsData);
    } catch (error) {
      console.error('Lỗi khi tải danh sách năm học:', error);
    }
  };

  const handleAddCustomAward = () => {
    if (!customForm.label.trim() || !customForm.schoolYear) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const newAward: SubAward = {
      type: 'custom',
      label: customForm.label,
      labelEng: customForm.labelEng || undefined,
      schoolYear: customForm.schoolYear,
      priority: customForm.priority,
    };

    setSubAwards([...subAwards, newAward]);
    setCustomForm({ label: '', labelEng: '', schoolYear: '', priority: 1 });
  };

  const handleAddCustomDescAward = () => {
    if (!customDescForm.label.trim() || !customDescForm.schoolYear) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const newAward: SubAward = {
      type: 'custom_with_description',
      label: customDescForm.label,
      description: customDescForm.description,
      descriptionEng: customDescForm.descriptionEng || undefined,
      schoolYear: customDescForm.schoolYear,
      priority: customDescForm.priority,
    };

    setSubAwards([...subAwards, newAward]);
    setCustomDescForm({ label: '', description: '', descriptionEng: '', schoolYear: '', priority: 1 });
  };

  const handleCreatePeriodicAwards = (schoolYearId: string) => {
    const periodicAwards: SubAward[] = [
      { type: 'schoolYear', label: 'Tháng 1 & Tháng 2', schoolYear: schoolYearId, month: 1 },
      { type: 'schoolYear', label: 'Tháng 3', schoolYear: schoolYearId, month: 3 },
      { type: 'schoolYear', label: 'Tháng 4', schoolYear: schoolYearId, month: 4 },
      { type: 'schoolYear', label: 'Tháng 9', schoolYear: schoolYearId, month: 9 },
      { type: 'schoolYear', label: 'Tháng 10', schoolYear: schoolYearId, month: 10 },
      { type: 'schoolYear', label: 'Tháng 11', schoolYear: schoolYearId, month: 11 },
      { type: 'schoolYear', label: 'Học kì 1', schoolYear: schoolYearId, semester: 1 },
      { type: 'schoolYear', label: 'Học kì 2', schoolYear: schoolYearId, semester: 2 },
      { type: 'schoolYear', label: 'Năm học', schoolYear: schoolYearId },
    ];

    // Remove existing periodic awards for this school year
    const filteredAwards = subAwards.filter(award => 
      !(award.type === 'schoolYear' && award.schoolYear === schoolYearId)
    );

    setSubAwards([...filteredAwards, ...periodicAwards]);
  };

  const handleRemoveSubAward = (index: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa hạng mục này?')) {
      setSubAwards(subAwards.filter((_, i) => i !== index));
    }
  };

  const handleSaveCategory = async () => {
    if (!category) return;

    try {
      setLoading(true);
      const updatedCategory = {
        ...category,
        subAwards: subAwards,
      };

      const response = await axios.put(
        `${API_ENDPOINTS.AWARD_CATEGORIES}/${category._id}`,
        updatedCategory,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      onCategoryUpdated(response.data);
      onOpenChange(false);
    } catch (error) {
      console.error('Lỗi khi cập nhật loại vinh danh:', error);
      alert('Có lỗi xảy ra khi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  const getSchoolYearName = (schoolYearId: string) => {
    const sy = schoolYears.find(s => s._id === schoolYearId);
    return sy ? (sy.code || sy.name) : schoolYearId;
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[40vw] max-w-[70vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cấu hình hạng mục - {category?.name}</DialogTitle>
          <DialogDescription>
            Thiết lập các hạng mục vinh danh cho loại này
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <h3 className="text-lg font-medium border-b pb-2">Thiết lập loại Vinh danh</h3>

          {/* Vinh danh tùy chọn */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedModes.custom}
                onCheckedChange={(checked) => setSelectedModes({
                  ...selectedModes,
                  custom: !!checked,
                  customWithDescription: checked ? false : selectedModes.customWithDescription,
                })}
              />
              <span className="font-medium">Vinh danh tùy chọn</span>
            </div>
            
            {selectedModes.custom && (
              <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
                <div className="grid grid-cols-5 gap-2 items-end">
                  <div>
                    <Label>Tên (VI)</Label>
                    <Input
                      value={customForm.label}
                      onChange={(e) => setCustomForm({ ...customForm, label: e.target.value })}
                      placeholder="Nhập tên"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Tên (EN)</Label>
                    <Input
                      value={customForm.labelEng}
                      onChange={(e) => setCustomForm({ ...customForm, labelEng: e.target.value })}
                      placeholder="Enter name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Năm học</Label>
                    <select
                      className="w-full mt-1 border border-gray-300 rounded-lg p-2 h-10"
                      value={customForm.schoolYear}
                      onChange={(e) => setCustomForm({ ...customForm, schoolYear: e.target.value })}
                    >
                      <option value="">Chọn năm học</option>
                      {schoolYears.map((sy) => (
                        <option key={sy._id} value={sy._id}>
                          {sy.code || sy.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Input
                      type="number"
                      min="1"
                      value={customForm.priority}
                      onChange={(e) => setCustomForm({ ...customForm, priority: parseInt(e.target.value) || 1 })}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleAddCustomAward}
                    className="h-10"
                  >
                    Thêm
                  </Button>
                </div>

                {/* List custom awards */}
                <div className="space-y-2">
                  {subAwards.filter(award => award.type === 'custom').map((award, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium">{award.label}</span>
                        {award.labelEng && <span className="text-gray-500 ml-2">({award.labelEng})</span>}
                        <div className="text-sm text-gray-600">
                          {getSchoolYearName(award.schoolYear || '')} - Priority: {award.priority}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSubAward(subAwards.indexOf(award))}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Vinh danh tùy chọn có mô tả */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedModes.customWithDescription}
                onCheckedChange={(checked) => setSelectedModes({
                  ...selectedModes,
                  customWithDescription: !!checked,
                  custom: checked ? false : selectedModes.custom,
                })}
              />
              <span className="font-medium">Vinh danh tùy chọn có mô tả</span>
            </div>
            
            {selectedModes.customWithDescription && (
              <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
                <div className="grid grid-cols-5 gap-2 items-end">
                  <div>
                    <Label>Tên (VI)</Label>
                    <Input
                      value={customDescForm.label}
                      onChange={(e) => setCustomDescForm({ ...customDescForm, label: e.target.value })}
                      placeholder="Nhập tên"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Mô tả (VI)</Label>
                    <Textarea
                      value={customDescForm.description}
                      onChange={(e) => setCustomDescForm({ ...customDescForm, description: e.target.value })}
                      placeholder="Nhập mô tả"
                      className="mt-1"
                      rows={1}
                    />
                  </div>
                  <div>
                    <Label>Mô tả (EN)</Label>
                    <Textarea
                      value={customDescForm.descriptionEng}
                      onChange={(e) => setCustomDescForm({ ...customDescForm, descriptionEng: e.target.value })}
                      placeholder="Enter description"
                      className="mt-1"
                      rows={1}
                    />
                  </div>
                  <div>
                    <Label>Năm học</Label>
                    <select
                      className="w-full mt-1 border border-gray-300 rounded-lg p-2 h-10"
                      value={customDescForm.schoolYear}
                      onChange={(e) => setCustomDescForm({ ...customDescForm, schoolYear: e.target.value })}
                    >
                      <option value="">Chọn năm học</option>
                      {schoolYears.map((sy) => (
                        <option key={sy._id} value={sy._id}>
                          {sy.code || sy.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    onClick={handleAddCustomDescAward}
                  >
                    Thêm
                  </Button>
                </div>

                {/* List custom with description awards */}
                <div className="space-y-2">
                  {subAwards.filter(award => award.type === 'custom_with_description').map((award, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium">{award.label}</span>
                        <div className="text-sm text-gray-600">{award.description}</div>
                        {award.descriptionEng && <div className="text-sm text-gray-500 italic">{award.descriptionEng}</div>}
                        <div className="text-xs text-gray-500">{getSchoolYearName(award.schoolYear || '')}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSubAward(subAwards.indexOf(award))}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Vinh danh định kỳ */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedModes.schoolYear}
                onCheckedChange={(checked) => setSelectedModes({
                  ...selectedModes,
                  schoolYear: !!checked,
                })}
              />
              <span className="font-medium">Vinh danh định kỳ</span>
            </div>
            
            {selectedModes.schoolYear && (
              <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
                <Label>Chọn Năm học để tạo các hạng mục định kỳ:</Label>
                {schoolYears.length === 0 ? (
                  <div className="text-gray-500 text-sm">Đang tải danh sách năm học...</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {schoolYears.map((sy) => {
                      const hasPeriodicAwards = subAwards.some(award => 
                        award.type === 'schoolYear' && award.schoolYear === sy._id
                      );
                      
                      return (
                        <div key={sy._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span>{sy.code || sy.name}</span>
                          <Checkbox
                            checked={hasPeriodicAwards}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleCreatePeriodicAwards(sy._id);
                              } else {
                                // Xóa các hạng mục định kỳ của năm học này
                                const filteredAwards = subAwards.filter(award => 
                                  !(award.type === 'schoolYear' && award.schoolYear === sy._id)
                                );
                                setSubAwards(filteredAwards);
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}


              </div>
            )}
          </div>

                    {/* Summary */}
          {/* <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Tổng kết hạng mục ({subAwards.length})</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Tùy chọn:</span> {subAwards.filter(a => a.type === 'custom').length}
              </div>
              <div>
                <span className="font-medium">Có mô tả:</span> {subAwards.filter(a => a.type === 'custom_with_description').length}
              </div>
              <div>
                <span className="font-medium">Định kỳ:</span> {subAwards.filter(a => a.type === 'schoolYear').length}
              </div>
            </div>
          </div> */}

          {/* Save button */}
          <div className="flex justify-end gap-2 pt-6 border-t">
            <Button 
              onClick={handleSaveCategory}
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};



export default SubAwardsModal; 
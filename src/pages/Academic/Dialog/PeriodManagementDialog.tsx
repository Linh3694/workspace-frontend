import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Plus, Clock, Loader2 } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import { api } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../lib/config";
import { PERIOD_TYPE_LABELS } from '../../../types/timetable.types';
import type { PeriodDefinition, ApiResponse } from '../../../types/timetable.types';
import type { School } from '../../../types/school.types';

interface PeriodManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSchoolYear: string;
  schools: School[];
  onPeriodUpdated: (schoolYear: string, school: string) => Promise<void>;
}

export const PeriodManagementDialog: React.FC<PeriodManagementDialogProps> = ({
  isOpen,
  onClose,
  selectedSchoolYear,
  schools,
  onPeriodUpdated
}) => {
  const [periodSchoolSelection, setPeriodSchoolSelection] = useState<string>('');
  const [editingPeriods, setEditingPeriods] = useState<PeriodDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch periods for selected school
  const fetchPeriodsForSchool = async (schoolId: string) => {
    if (!selectedSchoolYear || !schoolId) return;
    
    try {
      const response = await api.get<ApiResponse<PeriodDefinition[]>>(
        `${API_ENDPOINTS.PERIOD_DEFINITIONS(selectedSchoolYear)}?schoolId=${schoolId}`
      );
      setEditingPeriods(response.data.data);
    } catch (error) {
      console.error("Error fetching periods for school:", error);
      setEditingPeriods([]);
    }
  };

  // Handle school selection in dialog
  const handlePeriodSchoolChange = (schoolId: string) => {
    setPeriodSchoolSelection(schoolId);
    fetchPeriodsForSchool(schoolId);
  };

  // Add new period to editing list
  const handleAddPeriod = () => {
    const newPeriod: PeriodDefinition = {
      _id: `new-${Date.now()}`,
      schoolYear: selectedSchoolYear,
      school: periodSchoolSelection,
      periodNumber: editingPeriods.length + 1,
      startTime: '',
      endTime: '',
      type: 'regular',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEditingPeriods([...editingPeriods, newPeriod]);
  };

  // Update period in editing list
  const handleUpdatePeriod = (index: number, field: keyof PeriodDefinition, value: any) => {
    const updated = [...editingPeriods];
    (updated[index] as any)[field] = value;
    setEditingPeriods(updated);
  };

  // Remove period from editing list
  const handleRemovePeriod = (index: number) => {
    const updated = editingPeriods.filter((_, i) => i !== index);
    setEditingPeriods(updated);
  };

  // Save all periods
  const handleSavePeriods = async () => {
    if (!selectedSchoolYear || !periodSchoolSelection) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn năm học và trường",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Validate periods
      for (const period of editingPeriods) {
        if (!period.startTime || !period.endTime) {
          toast({
            title: "Lỗi",
            description: "Vui lòng điền đầy đủ thời gian cho tất cả tiết học",
            variant: "destructive"
          });
          return;
        }
      }

      // Delete existing periods for this school/year
      const existingPeriods = await api.get<ApiResponse<PeriodDefinition[]>>(
        `${API_ENDPOINTS.PERIOD_DEFINITIONS(selectedSchoolYear)}?schoolId=${periodSchoolSelection}`
      );
      
      for (const period of existingPeriods.data.data) {
        await api.delete(`${API_ENDPOINTS.TIMETABLES}/period-definitions/${period._id}`);
      }

      // Create new periods
      for (const period of editingPeriods) {
        const payload = {
          periodNumber: period.periodNumber,
          startTime: period.startTime,
          endTime: period.endTime,
          type: period.type,
          label: period.type === "regular" ? `Tiết ${period.periodNumber}` : PERIOD_TYPE_LABELS[period.type],
          schoolYear: selectedSchoolYear,
          school: periodSchoolSelection
        };
        
        await api.post(API_ENDPOINTS.PERIOD_DEFINITIONS(selectedSchoolYear), payload);
      }

      // Refresh data
      await onPeriodUpdated(selectedSchoolYear, periodSchoolSelection);
      onClose();
      
      toast({
        title: "Thành công",
        description: "Cập nhật tiết học thành công"
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể cập nhật tiết học",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen && schools.length > 0 && !periodSchoolSelection) {
      setPeriodSchoolSelection(schools[0]._id);
      fetchPeriodsForSchool(schools[0]._id);
    }
  }, [isOpen, schools]);

  // Handle close
  const handleClose = () => {
    setEditingPeriods([]);
    setPeriodSchoolSelection('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="min-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quản lý tiết học</DialogTitle>
          <DialogDescription>
            Cấu hình các tiết học cho trường và năm học
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* School Selection */}
          <div className="space-y-2">
            <Label>Chọn trường</Label>
            <Select value={periodSchoolSelection} onValueChange={handlePeriodSchoolChange}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trường" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school._id} value={school._id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">
              💡 <strong>Lưu ý:</strong> Tiết số phải theo thứ tự thời gian trong ngày. 
              Các tiết đặc biệt (ăn trưa, ngủ trưa) cũng cần được đánh số tuần tự.
            </p>
          </div>

          {/* Periods List */}
          {periodSchoolSelection && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Danh sách tiết học</h3>
                  <Button onClick={handleAddPeriod} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm tiết
                  </Button>
                </div>
              </div>

              {/* Header row */}
              <div className="grid grid-cols-6 gap-2 items-center p-3 bg-gray-50 rounded-lg font-medium text-sm">
                <div className="col-span-1 text-center">Tiết số</div>
                <div className="col-span-2">Loại tiết học</div>
                <div className="col-span-1">Bắt đầu</div>
                <div className="col-span-1">Kết thúc</div>
                <div className="col-span-1 text-center">Thao tác</div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {editingPeriods.map((period, index) => (
                  <div key={period._id} className="grid grid-cols-6 gap-2 items-center p-3 border rounded-lg hover:bg-gray-50">
                    {/* Period Number */}
                    <div className="col-span-1">
                      <Input
                        type="number"
                        value={period.periodNumber}
                        onChange={(e) => handleUpdatePeriod(index, 'periodNumber', parseInt(e.target.value) || 0)}
                        placeholder="Số"
                        min="0"
                        max="14"
                        className="text-center"
                      />
                    </div>

                    {/* Period Type */}
                    <div className="col-span-2">
                      <Select
                        value={period.type}
                        onValueChange={(value) => handleUpdatePeriod(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PERIOD_TYPE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Start Time */}
                    <div className="col-span-1">
                      <Input
                        type="time"
                        value={period.startTime}
                        onChange={(e) => handleUpdatePeriod(index, 'startTime', e.target.value)}
                        placeholder="Bắt đầu"
                      />
                    </div>

                    {/* End Time */}
                    <div className="col-span-1">
                      <Input
                        type="time"
                        value={period.endTime}
                        onChange={(e) => handleUpdatePeriod(index, 'endTime', e.target.value)}
                        placeholder="Kết thúc"
                      />
                    </div>

                    {/* Remove Button */}
                    <div className="col-span-1 flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemovePeriod(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:border-red-300"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {editingPeriods.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Chưa có tiết học nào</p>
                  <p className="text-sm">Nhấn "Thêm tiết" để bắt đầu</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
          >
            Hủy
          </Button>
          {periodSchoolSelection && (
            <Button onClick={handleSavePeriods} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 
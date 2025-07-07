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
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [periods, setPeriods] = useState<PeriodDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch periods for selected school
  const fetchPeriods = async (schoolId: string) => {
    if (!selectedSchoolYear || !schoolId) return;
    
    try {
      setLoading(true);
      const response = await api.get<ApiResponse<PeriodDefinition[]>>(
        `${API_ENDPOINTS.PERIOD_DEFINITIONS(selectedSchoolYear)}?schoolId=${schoolId}`
      );
      setPeriods(response.data.data);
    } catch (error) {
      console.error("Error fetching periods:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách tiết học",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle school selection
  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchool(schoolId);
    fetchPeriods(schoolId);
  };

  // Add new period
  const handleAddPeriod = () => {
    const newPeriod: PeriodDefinition = {
      _id: `new-${Date.now()}`, // Temporary ID until saved
      schoolYear: selectedSchoolYear,
      school: selectedSchool,
      periodNumber: periods.length + 1,
      startTime: '',
      endTime: '',
      type: 'regular',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setPeriods([...periods, newPeriod]);
  };

  // Update period
  const handleUpdatePeriod = (index: number, field: keyof PeriodDefinition, value: string | number) => {
    const updated = [...periods];
    if (field === 'periodNumber' && typeof value === 'string') {
      updated[index][field] = parseInt(value) || 0;
    } else {
      (updated[index] as unknown as Record<string, unknown>)[field] = value;
    }
    setPeriods(updated);
  };

  // Remove period
  const handleRemovePeriod = (index: number) => {
    setPeriods(periods.filter((_, i) => i !== index));
  };

  // Simple validation
  const validatePeriods = (): boolean => {
    for (const period of periods) {
      if (!period.startTime || !period.endTime) {
        toast({
          title: "Lỗi",
          description: "Vui lòng điền đầy đủ thời gian cho tất cả tiết học",
          variant: "destructive"
        });
        return false;
      }
      
      if (period.startTime >= period.endTime) {
        toast({
          title: "Lỗi",
          description: `Tiết ${period.periodNumber}: Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc`,
          variant: "destructive"
        });
        return false;
      }
      
      if (period.periodNumber <= 0 || period.periodNumber > 25) {
        toast({
          title: "Lỗi",
          description: "Số tiết phải từ 1 đến 25",
          variant: "destructive"
        });
        return false;
      }
    }

    // Check for duplicate period numbers
    const periodNumbers = periods.map(p => p.periodNumber);
    const uniqueNumbers = [...new Set(periodNumbers)];
    if (periodNumbers.length !== uniqueNumbers.length) {
      toast({
        title: "Lỗi",
        description: "Không được có số tiết trùng lặp",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  // Save periods
  const handleSavePeriods = async () => {
    if (!selectedSchoolYear || !selectedSchool) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn trường",
        variant: "destructive"
      });
      return;
    }

    if (!validatePeriods()) {
      return;
    }

    try {
      setLoading(true);
      
      // Get existing periods
      const existingResponse = await api.get<ApiResponse<PeriodDefinition[]>>(
        `${API_ENDPOINTS.PERIOD_DEFINITIONS(selectedSchoolYear)}?schoolId=${selectedSchool}`
      );
      
      const existingPeriods = existingResponse.data.data;
      const newPeriods = [...periods].sort((a, b) => a.periodNumber - b.periodNumber);
      
      // Compare and find differences
      const toCreate = [];
      const toUpdate = [];
      const toDelete = [];
      
      // Find periods to create or update
      for (const newPeriod of newPeriods) {
        // Check if it's a new period (temporary ID)
        const isNewPeriod = newPeriod._id.startsWith('new-');
        
        if (isNewPeriod) {
          // This is a new period to create
          toCreate.push(newPeriod);
        } else {
          // This is an existing period, check if it needs update
          const existing = existingPeriods.find(p => p._id === newPeriod._id);
          
          if (existing) {
            const needsUpdate = 
              existing.startTime !== newPeriod.startTime ||
              existing.endTime !== newPeriod.endTime ||
              existing.type !== newPeriod.type ||
              existing.periodNumber !== newPeriod.periodNumber;
              
            if (needsUpdate) {
              toUpdate.push({ existing, new: newPeriod });
            }
          } else {
            // Period not found in existing, treat as new
            toCreate.push(newPeriod);
          }
        }
      }
      
      // Find periods to delete (existing periods not in new periods)
      for (const existingPeriod of existingPeriods) {
        const stillExists = newPeriods.find(p => 
          !p._id.startsWith('new-') && p._id === existingPeriod._id
        );
        if (!stillExists) {
          toDelete.push(existingPeriod);
        }
      }
      
      console.log(`Changes: ${toCreate.length} to create, ${toUpdate.length} to update, ${toDelete.length} to delete`);
      console.log('🔍 Period analysis:', {
        existing: existingPeriods.map(p => ({ id: p._id, period: p.periodNumber, type: p.type })),
        new: newPeriods.map(p => ({ id: p._id, period: p.periodNumber, type: p.type, isTemp: p._id.startsWith('new-') })),
        toCreate: toCreate.map(p => ({ period: p.periodNumber, type: p.type })),
        toUpdate: toUpdate.map(u => ({ id: u.existing._id, period: u.new.periodNumber })),
        toDelete: toDelete.map(p => ({ id: p._id, period: p.periodNumber }))
      });
      
      // Execute changes
      
      // Delete periods
      if (toDelete.length > 0) {
        console.log('Deleting periods...');
        await Promise.all(
          toDelete.map(async (period) => {
            try {
              await api.delete(API_ENDPOINTS.PERIOD_DEFINITION(period._id));
              console.log(`Deleted period ${period.periodNumber}`);
            } catch (error) {
              console.error(`Failed to delete period ${period.periodNumber}:`, error);
            }
          })
        );
      }
      
      // Update periods
      if (toUpdate.length > 0) {
        console.log('Updating periods...');
        for (const { existing, new: newPeriod } of toUpdate) {
          try {
            const payload = {
              periodNumber: newPeriod.periodNumber,
              startTime: newPeriod.startTime,
              endTime: newPeriod.endTime,
              type: newPeriod.type || 'regular',
              label: newPeriod.type === "regular" ? `Tiết ${newPeriod.periodNumber}` : 
                     PERIOD_TYPE_LABELS[newPeriod.type as keyof typeof PERIOD_TYPE_LABELS] || 
                     `Tiết ${newPeriod.periodNumber}`,
              school: selectedSchool
            };
            
            await api.put(API_ENDPOINTS.PERIOD_DEFINITION(existing._id), payload);
            console.log(`Updated period ${newPeriod.periodNumber}`);
          } catch (error) {
            console.error(`Failed to update period ${newPeriod.periodNumber}:`, error);
            throw new Error(`Không thể cập nhật tiết ${newPeriod.periodNumber}`);
          }
        }
      }
      
      // Create new periods
      if (toCreate.length > 0) {
        console.log('Creating new periods...');
        for (const newPeriod of toCreate) {
          try {
            const payload = {
              periodNumber: newPeriod.periodNumber,
              startTime: newPeriod.startTime,
              endTime: newPeriod.endTime,
              type: newPeriod.type || 'regular',
              label: newPeriod.type === "regular" ? `Tiết ${newPeriod.periodNumber}` : 
                     PERIOD_TYPE_LABELS[newPeriod.type as keyof typeof PERIOD_TYPE_LABELS] || 
                     `Tiết ${newPeriod.periodNumber}`,
              school: selectedSchool
            };
            
            await api.post(API_ENDPOINTS.PERIOD_DEFINITIONS(selectedSchoolYear), payload);
            console.log(`Created period ${newPeriod.periodNumber}`);
          } catch (error) {
            console.error(`Failed to create period ${newPeriod.periodNumber}:`, error);
            throw new Error(`Không thể tạo tiết ${newPeriod.periodNumber}`);
          }
        }
      }
      
      // Refresh data and close dialog
      await onPeriodUpdated(selectedSchoolYear, selectedSchool);
      onClose();
      
      const totalChanges = toCreate.length + toUpdate.length + toDelete.length;
      toast({
        title: "Thành công",
        description: totalChanges > 0 ? `Đã cập nhật ${totalChanges} thay đổi` : "Không có thay đổi nào"
      });

    } catch (error) {
      console.error('Save periods error:', error);
      
      // Refresh data to show current state
      try {
        await onPeriodUpdated(selectedSchoolYear, selectedSchool);
        await fetchPeriods(selectedSchool);
      } catch (refreshError) {
        console.error('Failed to refresh after error:', refreshError);
      }
      
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể lưu tiết học. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen && schools.length > 0) {
      setSelectedSchool(schools[0]._id);
      fetchPeriods(schools[0]._id);
    }
  }, [isOpen, schools]);

  // Handle close
  const handleClose = () => {
    setPeriods([]);
    setSelectedSchool('');
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
            <Select value={selectedSchool} onValueChange={handleSchoolChange}>
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
              💡 <strong>Lưu ý:</strong> Tiết số phải từ 1-25 và theo thứ tự thời gian trong ngày. 
              Các tiết đặc biệt (ăn trưa, ngủ trưa) cũng cần được đánh số tuần tự.
            </p>
          </div>

          {/* Periods List */}
          {selectedSchool && (
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

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {periods.map((period, index) => (
                    <div key={period._id} className="grid grid-cols-6 gap-2 items-center p-3 border rounded-lg hover:bg-gray-50">
                      {/* Period Number */}
                      <div className="col-span-1">
                        <Input
                          type="number"
                          value={period.periodNumber}
                          onChange={(e) => handleUpdatePeriod(index, 'periodNumber', parseInt(e.target.value) || 0)}
                          placeholder="Số"
                          min="1"
                          max="25"
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
              )}

              {periods.length === 0 && !loading && (
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
          {selectedSchool && (
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
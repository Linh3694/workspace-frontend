import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { FileText } from 'lucide-react';
import type { DeviceType } from '../../../types/inventory';
import { inventoryService } from '../../../services/inventoryService';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../../../components/ui/select';

interface CreateInspectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceType: DeviceType;
  deviceId: string | null;
  deviceName?: string;
  onSuccess?: () => void;
}

const deviceFields: Record<DeviceType, string[]> = {
  laptop: ['externalCondition', 'cpu', 'ram', 'storage', 'battery', 'display', 'connectivity', 'software'],
  monitor: ['externalCondition', 'display', 'storage', 'connectivity'],
  printer: ['externalCondition', 'ram', 'storage', 'connectivity'],
  projector: ['externalCondition', 'cpu', 'display'],
  tool: ['externalCondition', 'cpu', 'ram', 'storage', 'display'],
};

const defaultForm = {
  // External
  externalCondition: '',
  externalConditionNotes: '',
  // CPU
  cpuPerformance: '',
  cpuTemperature: '',
  cpuOverallCondition: '',
  cpuNotes: '',
  // RAM
  ramConsumption: '',
  ramOverallCondition: '',
  ramNotes: '',
  // Storage
  storageRemainingCapacity: '',
  storageOverallCondition: '',
  storageNotes: '',
  // Battery
  batteryCapacity: '',
  batteryPerformance: '',
  batteryChargeCycles: '',
  batteryOverallCondition: '',
  batteryNotes: '',
  // Display
  displayColorAndBrightness: '',
  displayOverallCondition: '',
  displayNotes: '',
  // Connectivity
  connectivityOverallCondition: '',
  connectivityNotes: '',
  // Software
  softwareOverallCondition: '',
  softwareNotes: '',
  // Kết luận
  conclusion: '',
  recommendation: '',
  overallAssessment: '',
};

const CreateInspectModal: React.FC<CreateInspectModalProps> = ({
  open,
  onOpenChange,
  deviceType,
  deviceId,
  onSuccess
}) => {
  const [form, setForm] = useState({ ...defaultForm });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState('external');
  const [createdInspection, setCreatedInspection] = useState<Record<string, unknown> | null>(null);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  
  

  // Kiểm tra section có được điền đầy đủ chưa
  const isSectionComplete = (sectionId: string) => {
    const sectionFields: Record<string, string[]> = {
      external: ['externalCondition', 'externalConditionNotes'],
      cpu: ['cpuPerformance', 'cpuTemperature', 'cpuOverallCondition', 'cpuNotes'],
      ram: ['ramConsumption', 'ramOverallCondition', 'ramNotes'],
      storage: ['storageRemainingCapacity', 'storageOverallCondition', 'storageNotes'],
      battery: ['batteryCapacity', 'batteryPerformance', 'batteryChargeCycles', 'batteryOverallCondition', 'batteryNotes'],
      display: ['displayColorAndBrightness', 'displayOverallCondition', 'displayNotes'],
      connectivity: ['connectivityOverallCondition', 'connectivityNotes'],
      software: ['softwareOverallCondition', 'softwareNotes'],
      conclusion: ['conclusion', 'recommendation']
    };

    const fieldsToCheck = sectionFields[sectionId] || [];
    const availableFields = fieldsToCheck.filter(field => 
      fields.includes(field.replace(/Notes$/, '').replace(/OverallCondition$/, '').replace(/Consumption$/, '').replace(/RemainingCapacity$/, '').replace(/ColorAndBrightness$/, '').replace(/ChargeCycles$/, '').replace(/Performance$/, '').replace(/Temperature$/, '').replace(/Capacity$/, '')) ||
      (sectionId === 'conclusion')
    );
    
    return availableFields.every(field => form[field as keyof typeof form]?.toString().trim());
  };
  
  // Debug function
  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
  };

  const fields = deviceFields[deviceType] || [];
  
  // Tạo danh sách các mục dựa trên deviceType
  const getMenuItems = () => {
    const items = [];
    if (fields.includes('externalCondition')) items.push({ id: 'external', label: 'Tình trạng ngoài' });
    if (fields.includes('cpu')) items.push({ id: 'cpu', label: 'CPU' });
    if (fields.includes('ram')) items.push({ id: 'ram', label: 'RAM' });
    if (fields.includes('storage')) items.push({ id: 'storage', label: 'Ổ cứng' });
    if (fields.includes('battery')) items.push({ id: 'battery', label: 'Pin' });
    if (fields.includes('display')) items.push({ id: 'display', label: 'Màn hình' });
    if (fields.includes('connectivity')) items.push({ id: 'connectivity', label: 'Kết nối' });
    if (fields.includes('software')) items.push({ id: 'software', label: 'Phần mềm' });
    items.push({ id: 'conclusion', label: 'Kết luận' });
    
    // Fallback: nếu không có mục nào, thêm ít nhất conclusion
    if (items.length === 0) {
      items.push({ id: 'conclusion', label: 'Kết luận' });
    }
    
    return items;
  };

  const menuItems = useMemo(() => getMenuItems(), [fields]);
  
  useEffect(() => {
    if (menuItems.length > 0 && !activeItem) {
      setActiveItem(menuItems[0].id);
    }
  }, [deviceType]); // Chỉ phụ thuộc vào deviceType
  
  // Reset form khi modal mở
  useEffect(() => {
    if (open) {
      setForm({ ...defaultForm });
      setError(null);
    }
  }, [open]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, type, value } = e.target;
    let val: string | boolean = value;
    if (type === 'checkbox') {
      val = (e.target as HTMLInputElement).checked;
    }
    setForm((prev) => ({
      ...prev,
      [name]: val
    }));
  };

  // Hàm kiểm tra validation
  const validateForm = () => {
    const errors: string[] = [];
    
    // Kiểm tra từng field dựa trên deviceType
    if (fields.includes('externalCondition')) {
      if (!form.externalCondition?.trim()) {
        errors.push('Vui lòng điền "Tình trạng bên ngoài"');
      }
      if (!form.externalConditionNotes?.trim()) {
        errors.push('Vui lòng điền "Ghi chú tình trạng ngoài"');
      }
    }
    
    if (fields.includes('cpu')) {
      if (!form.cpuPerformance?.trim()) {
        errors.push('Vui lòng điền "Hiệu suất CPU"');
      }
      if (!form.cpuTemperature?.trim()) {
        errors.push('Vui lòng điền "Nhiệt độ CPU"');
      }
      if (!form.cpuOverallCondition?.trim()) {
        errors.push('Vui lòng điền "Tình trạng CPU"');
      }
      if (!form.cpuNotes?.trim()) {
        errors.push('Vui lòng điền "Ghi chú CPU"');
      }
    }
    
    if (fields.includes('ram')) {
      if (!form.ramConsumption?.trim()) {
        errors.push('Vui lòng điền "Tiêu thụ RAM"');
      }
      if (!form.ramOverallCondition?.trim()) {
        errors.push('Vui lòng điền "Tình trạng RAM"');
      }
      if (!form.ramNotes?.trim()) {
        errors.push('Vui lòng điền "Ghi chú RAM"');
      }
    }
    
    if (fields.includes('storage')) {
      if (!form.storageRemainingCapacity?.trim()) {
        errors.push('Vui lòng điền "Dung lượng còn lại (Ổ cứng)"');
      }
      if (!form.storageOverallCondition?.trim()) {
        errors.push('Vui lòng điền "Tình trạng ổ cứng"');
      }
      if (!form.storageNotes?.trim()) {
        errors.push('Vui lòng điền "Ghi chú ổ cứng"');
      }
    }
    
    if (fields.includes('battery')) {
      if (!form.batteryCapacity?.trim()) {
        errors.push('Vui lòng điền "Dung lượng pin (mAh)"');
      }
      if (!form.batteryPerformance?.trim()) {
        errors.push('Vui lòng điền "Hiệu suất pin"');
      }
      if (!form.batteryChargeCycles?.trim()) {
        errors.push('Vui lòng điền "Số chu kỳ nạp pin"');
      }
      if (!form.batteryOverallCondition?.trim()) {
        errors.push('Vui lòng điền "Tình trạng pin"');
      }
      if (!form.batteryNotes?.trim()) {
        errors.push('Vui lòng điền "Ghi chú pin"');
      }
    }
    
    if (fields.includes('display')) {
      if (!form.displayColorAndBrightness?.trim()) {
        errors.push('Vui lòng điền "Màu sắc & độ sáng"');
      }
      if (!form.displayOverallCondition?.trim()) {
        errors.push('Vui lòng điền "Tình trạng màn hình"');
      }
      if (!form.displayNotes?.trim()) {
        errors.push('Vui lòng điền "Ghi chú màn hình"');
      }
    }
    
    if (fields.includes('connectivity')) {
      if (!form.connectivityOverallCondition?.trim()) {
        errors.push('Vui lòng điền "Tình trạng kết nối"');
      }
      if (!form.connectivityNotes?.trim()) {
        errors.push('Vui lòng điền "Ghi chú kết nối"');
      }
    }
    
    if (fields.includes('software')) {
      if (!form.softwareOverallCondition?.trim()) {
        errors.push('Vui lòng điền "Tình trạng phần mềm"');
      }
      if (!form.softwareNotes?.trim()) {
        errors.push('Vui lòng điền "Ghi chú phần mềm"');
      }
    }
    
    // Kiểm tra kết luận (bắt buộc cho tất cả)
    if (!form.conclusion?.trim()) {
      errors.push('Vui lòng điền "Kết luận kỹ thuật"');
    }
    if (!form.recommendation?.trim()) {
      errors.push('Vui lòng điền "Khuyến nghị tiếp theo"');
    }
    
    if (!form.overallAssessment) {
      errors.push('Vui lòng chọn "Đánh giá tổng thể"');
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    if (!deviceId) return;
    
    // Kiểm tra validation trước khi submit
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(`Vui lòng điền đầy đủ thông tin:\n${validationErrors.join('\n')}`);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      // Build results object đúng model
      const results: Record<string, unknown> = {};
      if (fields.includes('externalCondition')) {
        results.externalCondition = {
          overallCondition: form.externalCondition,
          notes: form.externalConditionNotes
        };
      }
      if (fields.includes('cpu')) {
        results.cpu = {
          performance: form.cpuPerformance,
          temperature: form.cpuTemperature,
          overallCondition: form.cpuOverallCondition,
          notes: form.cpuNotes
        };
      }
      if (fields.includes('ram')) {
        results.ram = {
          consumption: form.ramConsumption,
          overallCondition: form.ramOverallCondition,
          notes: form.ramNotes
        };
      }
      if (fields.includes('storage')) {
        results.storage = {
          remainingCapacity: form.storageRemainingCapacity,
          overallCondition: form.storageOverallCondition,
          notes: form.storageNotes
        };
      }
      if (fields.includes('battery')) {
        results.battery = {
          capacity: form.batteryCapacity,
          performance: form.batteryPerformance,
          chargeCycles: form.batteryChargeCycles,
          overallCondition: form.batteryOverallCondition,
          notes: form.batteryNotes
        };
      }
      if (fields.includes('display')) {
        results.display = {
          colorAndBrightness: form.displayColorAndBrightness,
          overallCondition: form.displayOverallCondition,
          notes: form.displayNotes
        };
      }
      if (fields.includes('connectivity')) {
        results.connectivity = {
          overallCondition: form.connectivityOverallCondition,
          notes: form.connectivityNotes
        };
      }
      if (fields.includes('software')) {
        results.software = {
          overallCondition: form.softwareOverallCondition,
          notes: form.softwareNotes
        };
      }
      
      const inspectionData = {
        deviceId,
        deviceType,
        results: {
          ...results,
        },
        overallAssessment: form.overallAssessment,
        technicalConclusion: form.conclusion,
        followUpRecommendation: form.recommendation
      };
      
      const response = await inventoryService.createInspection(inspectionData);
      setCreatedInspection(response.data);
      
      // Không đóng modal ngay, để người dùng có thể tải file docx
      setForm({ ...defaultForm });
    } catch (error) {
      console.error('Lỗi khi tạo inspection:', error);
      if (error instanceof Error) {
        setError(`Không thể lưu kết quả kiểm tra: ${error.message}`);
      } else {
        setError('Không thể lưu kết quả kiểm tra.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateDocx = async () => {
    if (!createdInspection || !deviceId) return;
    
    setIsGeneratingDoc(true);
    try {
      // Lấy thông tin thiết bị và người dùng hiện tại
      const deviceResponse = await inventoryService.getDeviceById(deviceType, deviceId);
      const currentUserResponse = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const currentUser = await currentUserResponse.json();
      
      await inventoryService.generateInspectionReportDocument(
        createdInspection,
        deviceResponse,
        currentUser,
        deviceResponse.assigned?.[0] || null,
        null,
        createdInspection._id as string
      );
    } catch (error) {
      console.error('Lỗi khi tạo file docx:', error);
      setError('Không thể tạo file báo cáo.');
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const handleClose = () => {
    setCreatedInspection(null);
    setForm({ ...defaultForm });
    setError(null);
    onOpenChange(false);
    if (onSuccess) onSuccess();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-auto  ">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Tiến hành kiểm tra thiết bị</span>
          </DialogTitle>
        </DialogHeader>

        {/* Thông báo lỗi */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-2">
            <span className="text-red-700 text-sm font-medium">
              {error.includes('Vui lòng điền') ? (
                (() => {
                  const lines = error.split('\n').filter(line => line.startsWith('Vui lòng điền'));
                  if (lines.length === 0) return error;
                  return `Vui lòng điền: ${lines.map(l => l.replace('Vui lòng điền ', '').replace(/"/g, '')).join(', ')}`;
                })()
              ) : (
                error
              )}
            </span>
          </div>
        )}

        {/* Thông báo thành công */}
        {createdInspection && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-2">
            <span className="text-green-700 text-sm font-medium">
              ✅ Kết quả kiểm tra đã được lưu thành công! Bạn có thể tải file DOCX để người dùng ký.
            </span>
          </div>
        )}

        <div className="flex h-[500px] relative">
          {/* Sidebar */}
          <div className="w-48 border-r border-gray-200 pr-4 flex-shrink-0">
            <div className="space-y-1">
              {menuItems.length === 0 ? (
                <div className="text-sm text-gray-500 p-3">
                  Debug: deviceType={deviceType}, fields={JSON.stringify(fields)}
                </div>
              ) : (
                menuItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors cursor-pointer select-none flex items-center justify-between ${
                      activeItem === item.id
                        ? 'bg-[#002855] text-white font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveItem(item.id);
                      }
                    }}
                  >
                    <span>{item.label}</span>
                    {isSectionComplete(item.id) && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 pl-6 overflow-y-auto">
            
            {activeItem === 'external' && fields.includes('externalCondition') && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Tình trạng bên ngoài</h3>
                <p className="text-sm text-gray-600 italic">Kiểm tra tình trạng bên ngoài của thiết bị bao gồm vỏ máy, màn hình, bàn phím và các bộ phận khác.</p>
                <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                      <Label className="w-1/3">Tình trạng bên ngoài</Label>
                      <Input name="externalCondition" value={form.externalCondition} onChange={handleChange} className="w-2/3" placeholder="Ví dụ: Tốt, Trung bình, Kém" />
                    </div>
                                      <div className="flex items-start justify-between">
                      <Label className="w-1/3 pt-2">Ghi chú tình trạng ngoài</Label>
                      <Textarea name="externalConditionNotes" value={form.externalConditionNotes} onChange={handleChange} className="w-2/3" placeholder="Mô tả chi tiết về tình trạng bên ngoài..." />
                    </div>
                </div>
              </div>
            )}

            {activeItem === 'cpu' && fields.includes('cpu') && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">CPU</h3>
                <p className="text-sm text-gray-600 italic">Kiểm tra hiệu suất, nhiệt độ và tình trạng tổng thể của bộ xử lý trung tâm.</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="w-1/3">Hiệu suất CPU</Label>
                    <Input name="cpuPerformance" value={form.cpuPerformance} onChange={handleChange} className="w-2/3" placeholder="Ví dụ: 85%, Chậm, Bình thường" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="w-1/3">Nhiệt độ CPU</Label>
                    <Input name="cpuTemperature" value={form.cpuTemperature} onChange={handleChange} className="w-2/3" placeholder="Ví dụ: 65°C, 80°C" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="w-1/3">Tình trạng CPU</Label>
                    <Input name="cpuOverallCondition" value={form.cpuOverallCondition} onChange={handleChange} className="w-2/3" placeholder="Ví dụ: Tốt, Cần bảo trì" />
                  </div>
                  <div className="flex items-start justify-between">
                    <Label className="w-1/3 pt-2">Ghi chú CPU</Label>
                    <Textarea name="cpuNotes" value={form.cpuNotes} onChange={handleChange} className="w-2/3" placeholder="Mô tả chi tiết về tình trạng CPU..." />
                  </div>
                </div>
              </div>
            )}

            {activeItem === 'ram' && fields.includes('ram') && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">RAM</h3>
                <p className="text-sm text-gray-600 italic">Kiểm tra mức tiêu thụ bộ nhớ RAM và tình trạng hoạt động của hệ thống.</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="w-1/3">Tiêu thụ RAM</Label>
                    <Input name="ramConsumption" value={form.ramConsumption} onChange={handleChange} className="w-2/3" placeholder="Ví dụ: 6GB/8GB, 75%" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="w-1/3">Tình trạng RAM</Label>
                    <Input name="ramOverallCondition" value={form.ramOverallCondition} onChange={handleChange} className="w-2/3" placeholder="Ví dụ: Tốt, Đầy, Cần nâng cấp" />
                  </div>
                  <div className="flex items-start justify-between">
                    <Label className="w-1/3 pt-2">Ghi chú RAM</Label>
                    <Textarea name="ramNotes" value={form.ramNotes} onChange={handleChange} className="w-2/3" placeholder="Mô tả chi tiết về tình trạng RAM..." />
                  </div>
                </div>
              </div>
            )}

            {activeItem === 'storage' && fields.includes('storage') && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Ổ cứng</h3>
                <p className="text-sm text-gray-600 italic">Kiểm tra dung lượng còn lại và tình trạng hoạt động của ổ cứng.</p>
                  <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="w-1/3">Dung lượng còn lại (Ổ cứng)</Label>
                    <Input name="storageRemainingCapacity" value={form.storageRemainingCapacity} onChange={handleChange} className="w-2/3" placeholder="Ví dụ: 200GB/500GB, 60%" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="w-1/3">Tình trạng ổ cứng</Label>
                    <Input name="storageOverallCondition" value={form.storageOverallCondition} onChange={handleChange} className="w-2/3" placeholder="Ví dụ: Tốt, Cần dọn dẹp, Lỗi" />
                  </div>
                  <div className="flex items-start justify-between">
                    <Label className="w-1/3 pt-2">Ghi chú ổ cứng</Label>
                    <Textarea name="storageNotes" value={form.storageNotes} onChange={handleChange} className="w-2/3" placeholder="Mô tả chi tiết về tình trạng ổ cứng..." />
                  </div>
                </div>
              </div>
            )}

            {activeItem === 'battery' && fields.includes('battery') && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Pin</h3>
                <p className="text-sm text-gray-600 italic">Kiểm tra dung lượng pin, hiệu suất và số chu kỳ sạc để đánh giá tình trạng pin.</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="w-1/3">Dung lượng pin (mAh)</Label>
                    <Input name="batteryCapacity" value={form.batteryCapacity} onChange={handleChange} className="w-2/3" placeholder="Ví dụ: 4000mAh, 85%" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="w-1/3">Hiệu suất pin</Label>
                    <Input name="batteryPerformance" value={form.batteryPerformance} onChange={handleChange} className="w-2/3" placeholder="Ví dụ: Tốt, Yếu, Cần thay" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="w-1/3">Số chu kỳ nạp pin</Label>
                    <Input name="batteryChargeCycles" value={form.batteryChargeCycles} onChange={handleChange} className="w-2/3" placeholder="Ví dụ: 150, 300" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="w-1/3">Tình trạng pin</Label>
                    <Input name="batteryOverallCondition" value={form.batteryOverallCondition} onChange={handleChange} className="w-2/3" placeholder="Ví dụ: Tốt, Cần thay, Lỗi" />
                  </div>
                  <div className="flex items-start justify-between">
                    <Label className="w-1/3 pt-2">Ghi chú pin</Label>
                    <Textarea name="batteryNotes" value={form.batteryNotes} onChange={handleChange} className="w-2/3" placeholder="Mô tả chi tiết về tình trạng pin..." />
                  </div>
                </div>
              </div>
            )}

            {activeItem === 'display' && fields.includes('display') && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Màn hình</h3>
                <p className="text-sm text-gray-600 italic">Kiểm tra tình trạng màn hình bao gồm sọc, điểm chết, màu sắc và độ sáng.</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="w-1/3">Màu sắc & độ sáng</Label>
                    <Input name="displayColorAndBrightness" value={form.displayColorAndBrightness} onChange={handleChange} className="w-2/3" placeholder="Ví dụ: Tốt, Mờ, Lệch màu" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="w-1/3">Tình trạng màn hình</Label>
                    <Input name="displayOverallCondition" value={form.displayOverallCondition} onChange={handleChange} className="w-2/3" placeholder="Ví dụ: Tốt, Cần thay, Lỗi" />
                  </div>
                  <div className="flex items-start justify-between">
                    <Label className="w-1/3 pt-2">Ghi chú màn hình</Label>
                    <Textarea name="displayNotes" value={form.displayNotes} onChange={handleChange} className="w-2/3" placeholder="Mô tả chi tiết về tình trạng màn hình..." />
                  </div>
                </div>
              </div>
            )}

            {activeItem === 'connectivity' && fields.includes('connectivity') && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Kết nối</h3>
                <p className="text-sm text-gray-600 italic">Kiểm tra các cổng kết nối và khả năng kết nối của thiết bị.</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="w-1/3">Tình trạng kết nối</Label>
                    <Input name="connectivityOverallCondition" value={form.connectivityOverallCondition} onChange={handleChange} className="w-2/3" placeholder="Ví dụ: Tốt, Lỗi một số cổng" />
                  </div>
                  <div className="flex items-start justify-between">
                    <Label className="w-1/3 pt-2">Ghi chú kết nối</Label>
                    <Textarea name="connectivityNotes" value={form.connectivityNotes} onChange={handleChange} className="w-2/3" placeholder="Mô tả chi tiết về tình trạng kết nối..." />
                  </div>
                </div>
              </div>
            )}

            {activeItem === 'software' && fields.includes('software') && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Phần mềm</h3>
                <p className="text-sm text-gray-600 italic">Kiểm tra hệ điều hành, bản vá bảo mật và cài đặt Windows Updates.</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="w-1/3">Tình trạng phần mềm</Label>
                    <Input name="softwareOverallCondition" value={form.softwareOverallCondition} onChange={handleChange} className="w-2/3" placeholder="Ví dụ: Tốt, Cần cập nhật, Lỗi" />
                  </div>
                  <div className="flex items-start justify-between">
                    <Label className="w-1/3 pt-2">Ghi chú phần mềm</Label>
                    <Textarea name="softwareNotes" value={form.softwareNotes} onChange={handleChange} className="w-2/3" placeholder="Mô tả chi tiết về tình trạng phần mềm..." />
                  </div>
                </div>
              </div>
            )}

            {activeItem === 'conclusion' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Kết luận</h3>
                <p className="text-sm text-gray-600 italic">Tổng kết kết quả kiểm tra và đưa ra khuyến nghị tiếp theo cho thiết bị.</p>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <Label className="w-1/3 pt-2">Đánh giá tổng thể</Label>
                    <div className="w-2/3">
                      <Select
                        value={form.overallAssessment}
                        onValueChange={(value) => setForm((prev) => ({ ...prev, overallAssessment: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn đánh giá" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tốt">Tốt</SelectItem>
                          <SelectItem value="Trung Bình">Trung Bình</SelectItem>
                          <SelectItem value="Kém">Kém</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-start justify-between">
                    <Label className="w-1/3 pt-2">Kết luận kỹ thuật</Label>
                    <Textarea
                      name="conclusion"
                      placeholder="Nhập kết luận kỹ thuật..."
                      value={form.conclusion}
                      onChange={handleChange}
                      rows={4}
                      className="w-2/3"
                    />
                  </div>
                  <div className="flex items-start justify-between">
                    <Label className="w-1/3 pt-2">Khuyến nghị tiếp theo</Label>
                    <Textarea
                      name="recommendation"
                      placeholder="Nhập khuyến nghị..."
                      value={form.recommendation}
                      onChange={handleChange}
                      rows={4}
                      className="w-2/3"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          {!createdInspection ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu kết quả'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Đóng
              </Button>
              <Button 
                onClick={handleGenerateDocx} 
                disabled={isGeneratingDoc}
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                {isGeneratingDoc ? 'Đang tạo...' : 'Tải file DOCX'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInspectModal; 
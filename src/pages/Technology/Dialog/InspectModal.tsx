import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { 
  CheckCircle, 
  Clock, 
  User, 
  FileText, 
  Download, 
  AlertTriangle,
  Cpu,
  HardDrive,
  MemoryStick,
  Monitor,
  Wifi,
  Battery,
  Volume2
} from 'lucide-react';
import type { DeviceType } from '../../../types/inventory';
import { inventoryService } from '../../../services/inventoryService';

interface InspectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceType: DeviceType;
  deviceId: string | null;
  deviceName?: string;
}

interface InspectionResult {
  _id: string;
  inspectionDate: string;
  inspectorName: string;
  results: {
    cpu?: {
      performance: string;
      temperature: string;
    };
    ram?: {
      capacity: string;
      speed: string;
    };
    storage?: {
      capacity: string;
      health: string;
    };
    display?: {
      resolution: string;
      brightness: string;
    };
    network?: {
      wifi: string;
      ethernet: string;
    };
    battery?: {
      health: string;
      capacity: string;
    };
    audio?: {
      speakers: string;
      microphone: string;
    };
    connectivity?: InspectSection;
    software?: InspectSection;
    "Tổng thể"?: {
      overallCondition: string;
    };
  };
  overallCondition: string;
  documentUrl: string;
  technicalConclusion: string;
  followUpRecommendation: string;
}

type InspectSection = Record<string, string | number | boolean | undefined>;

const InspectModal: React.FC<InspectModalProps> = ({
  open,
  onOpenChange,
  deviceId,
  deviceName
}) => {
  const [inspection, setInspection] = useState<InspectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && deviceId) {
      fetchLatestInspection();
    }
  }, [open, deviceId]);

  const fetchLatestInspection = async () => {
  if (!deviceId) return;

  setIsLoading(true);
  setError(null);

  try {
    const apiRes = await inventoryService.getLatestInspection(deviceId);
    setInspection(apiRes.data);
  } catch (err: unknown) {                      // <- đổi any thành unknown
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      setInspection(null);
    } else {
      console.error('Error fetching inspection:', err);
      setError('Không thể tải dữ liệu kiểm tra.');
    }
  } finally {
    setIsLoading(false);
  }
};

  const handleDownloadReport = (documentUrl: string) => {
    if (documentUrl && documentUrl !== '#') {
      const filename = documentUrl.split('/').pop() || 'report.pdf';
      const downloadUrl = `${import.meta.env.VITE_BASE_URL}/uploads/reports/${filename}`;
      window.open(downloadUrl, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConditionBadge = (condition: string) => {
    const conditionConfig = {
      'Tốt': { label: 'Tốt', className: 'bg-green-100 text-green-800' },
      'Khá': { label: 'Khá', className: 'bg-blue-100 text-blue-800' },
      'Trung bình': { label: 'Trung bình', className: 'bg-yellow-100 text-yellow-800' },
      'Kém': { label: 'Kém', className: 'bg-red-100 text-red-800' },
      'Hỏng': { label: 'Hỏng', className: 'bg-red-100 text-red-800' },
    };
    
    const config = conditionConfig[condition as keyof typeof conditionConfig] || conditionConfig['Trung bình'];
    return (
      <Badge className={`${config.className} font-semibold`}>
        {config.label}
      </Badge>
    );
  };

  const renderInspectionSectionV2 = (
    title: string,
    icon: React.ComponentType<{ className?: string }>,
    fields: { label: string, key: string }[],
    data: InspectSection | undefined
  ) => {
    if (!data) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          {React.createElement(icon, { className: "h-4 w-4 text-gray-500" })}
          <h4 className="font-medium text-sm">{title}</h4>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {fields.map(({ label, key }) => (
            data[key] !== undefined && (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600">{label}:</span>
                <span className="font-medium break-all">{String(data[key])}</span>
              </div>
            )
          ))}
        </div>
      </div>
    );
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Kết quả kiểm tra - {deviceName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-500">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={fetchLatestInspection}
                >
                  Thử lại
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !error && !inspection && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có dữ liệu kiểm tra</p>
            </div>
          )}

          {inspection && !isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bên trái: Thông tin cơ bản, kết luận, tải biên bản */}
              <div className="space-y-6">
                {/* Thông tin kiểm tra */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>Thông tin kiểm tra</span>
                      </div>
                      {getConditionBadge(inspection.overallCondition)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Ngày kiểm tra:</span>
                      </div>
                      <p className="text-sm text-gray-600">{formatDate(inspection.inspectionDate)}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Người kiểm tra:</span>
                      </div>
                      <p className="text-sm text-gray-600">{inspection.inspectorName}</p>
                    </div>
                  </CardContent>
                </Card>
                {/* Kết luận và khuyến nghị */}
                {(inspection.technicalConclusion || inspection.followUpRecommendation) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Kết luận & khuyến nghị</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {inspection.technicalConclusion && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Kết luận kỹ thuật:</h4>
                          <p className="text-sm text-gray-600">{inspection.technicalConclusion}</p>
                        </div>
                      )}
                      {inspection.followUpRecommendation && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Khuyến nghị tiếp theo:</h4>
                          <p className="text-sm text-gray-600">{inspection.followUpRecommendation}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                {/* Tải biên bản */}
                {inspection.documentUrl && inspection.documentUrl !== '#' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Biên bản kiểm tra</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        onClick={() => handleDownloadReport(inspection.documentUrl)}
                        className="flex items-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Tải xuống biên bản</span>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
              {/* Bên phải: Thông số kỹ thuật kiểm tra */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Cpu className="h-5 w-5" />
                      <span>Kết quả kiểm tra kỹ thuật</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {renderInspectionSectionV2('CPU', Cpu, [
                      { label: 'Hiệu suất', key: 'performance' },
                      { label: 'Nhiệt độ', key: 'temperature' },
                      { label: 'Tình trạng', key: 'overallCondition' },
                      { label: 'Ghi chú', key: 'notes' },
                    ], inspection.results.cpu)}
                    {renderInspectionSectionV2('RAM', MemoryStick, [
                      { label: 'Tiêu thụ', key: 'consumption' },
                      { label: 'Tình trạng', key: 'overallCondition' },
                      { label: 'Ghi chú', key: 'notes' },
                    ], inspection.results.ram)}
                    {renderInspectionSectionV2('Ổ cứng', HardDrive, [
                      { label: 'Dung lượng còn lại', key: 'remainingCapacity' },
                      { label: 'Tình trạng', key: 'overallCondition' },
                      { label: 'Ghi chú', key: 'notes' },
                    ], inspection.results.storage)}
                    {renderInspectionSectionV2('Pin', Battery, [
                      { label: 'Dung lượng', key: 'capacity' },
                      { label: 'Hiệu suất', key: 'performance' },
                      { label: 'Số chu kỳ nạp', key: 'chargeCycles' },
                      { label: 'Tình trạng', key: 'overallCondition' },
                      { label: 'Ghi chú', key: 'notes' },
                    ], inspection.results.battery)}
                    {renderInspectionSectionV2('Màn hình', Monitor, [
                      { label: 'Màu sắc & độ sáng', key: 'colorAndBrightness' },
                      { label: 'Tình trạng', key: 'overallCondition' },
                      { label: 'Ghi chú', key: 'notes' },
                    ], inspection.results.display)}
                    {renderInspectionSectionV2('Kết nối', Wifi, [
                      { label: 'Tình trạng', key: 'overallCondition' },
                      { label: 'Ghi chú', key: 'notes' },
                    ], inspection.results.network)}
                    {renderInspectionSectionV2('Phần mềm', Volume2, [
                      { label: 'Tình trạng', key: 'overallCondition' },
                      { label: 'Ghi chú', key: 'notes' },
                    ], inspection.results.software)}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InspectModal; 
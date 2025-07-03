import React, { useState, useEffect } from 'react';
import { Search, FileText, Calendar, User, CheckCircle, XCircle, AlertTriangle, Download, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip';
import type { DeviceType } from '../../../types/inventory';

interface InspectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceType: DeviceType;
  deviceId: string | null;
  deviceName?: string;
}

interface InspectRecord {
  _id: string;
  inspectionDate: string;
  inspectorName: string;
  results: {
    externalCondition?: {
      overallCondition: string;
      notes: string;
    };
    cpu?: {
      performance: string;
      temperature: string;
      overallCondition: string;
      notes: string;
    };
    ram?: {
      consumption: string;
      overallCondition: string;
      notes: string;
    };
    storage?: {
      remainingCapacity: string;
      overallCondition: string;
      notes: string;
    };
    battery?: {
      capacity: number;
      performance: number;
      chargeCycles: number;
      overallCondition: string;
      notes: string;
    };
    display?: {
      isStriped: boolean;
      hasDeadPixels: boolean;
      colorAndBrightness: string;
      overallCondition: string;
      notes: string;
    };
    connectivity?: {
      Wifi: boolean;
      Bluetooth: boolean;
      USB: boolean;
      HDMI: boolean;
      Ethernet: boolean;
      Micro: boolean;
      Loa: boolean;
      overallCondition: string;
      notes: string;
    };
    software?: {
      "Kiểm tra hệ điều hành": boolean;
      "Cập nhật bản vá": boolean;
      "Tắt Windows Updates": boolean;
      overallCondition: string;
      notes: string;
    };
  };
  overallCondition: string;
  documentUrl: string;
  technicalConclusion: string;
  followUpRecommendation: string;
}

const InspectModal: React.FC<InspectModalProps> = ({ 
  open, 
  onOpenChange, 
  deviceType, 
  deviceId, 
  deviceName 
}) => {
  const [inspectRecord, setInspectRecord] = useState<InspectRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && deviceId) {
      fetchInspectRecord();
    }
  }, [open, deviceId, deviceType]);

  const fetchInspectRecord = async () => {
    if (!deviceId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/inspect/latest/${deviceId}`);
      if (response.ok) {
        const data = await response.json();
        setInspectRecord(data.data);
      } else if (response.status === 404) {
        setInspectRecord(null);
      } else {
        throw new Error('Không thể tải thông tin kiểm tra');
      }
    } catch (err) {
      console.error('Error fetching inspect record:', err);
      setError('Không thể tải thông tin kiểm tra thiết bị.');
    } finally {
      setIsLoading(false);
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
      'Bình thường': { label: 'Bình thường', className: 'bg-blue-100 text-blue-800' },
      'Kém': { label: 'Kém', className: 'bg-red-100 text-red-800' },
    };
    
    const config = conditionConfig[condition as keyof typeof conditionConfig] || conditionConfig['Bình thường'];
    return (
      <Badge className={`${config.className} text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const getOverallStatusIcon = (condition: string) => {
    switch (condition) {
      case 'Tốt':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Kém':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const handleDownloadReport = (documentUrl: string) => {
    if (documentUrl && documentUrl !== '#') {
      const downloadUrl = `${import.meta.env.VITE_BASE_URL}${documentUrl}`;
      window.open(downloadUrl, '_blank');
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Thông tin kiểm tra - {deviceName}</span>
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
                  onClick={fetchInspectRecord}
                >
                  Thử lại
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !error && !inspectRecord && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có thông tin kiểm tra</p>
            </div>
          )}

          {inspectRecord && !isLoading && !error && (
            <>
              {/* Header Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>Thông tin kiểm tra</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getOverallStatusIcon(inspectRecord.overallCondition)}
                      {getConditionBadge(inspectRecord.overallCondition)}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Ngày kiểm tra</p>
                      <p className="text-sm font-semibold">{formatDate(inspectRecord.inspectionDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Người kiểm tra</p>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <p className="text-sm font-semibold">{inspectRecord.inspectorName}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inspection Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Kết quả kiểm tra</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    {/* External Condition */}
                    {inspectRecord.results.externalCondition && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Tình trạng bên ngoài</h4>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Tình trạng:</span>
                            {getConditionBadge(inspectRecord.results.externalCondition.overallCondition)}
                          </div>
                          {inspectRecord.results.externalCondition.notes && (
                            <p className="text-xs text-gray-600 mt-1">
                              {inspectRecord.results.externalCondition.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* CPU */}
                    {inspectRecord.results.cpu && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">CPU</h4>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Hiệu suất:</span>
                            <span className="text-xs font-medium">{inspectRecord.results.cpu.performance}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Nhiệt độ:</span>
                            <span className="text-xs font-medium">{inspectRecord.results.cpu.temperature}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Tình trạng:</span>
                            {getConditionBadge(inspectRecord.results.cpu.overallCondition)}
                          </div>
                          {inspectRecord.results.cpu.notes && (
                            <p className="text-xs text-gray-600 mt-1">
                              {inspectRecord.results.cpu.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* RAM */}
                    {inspectRecord.results.ram && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">RAM</h4>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Tiêu thụ:</span>
                            <span className="text-xs font-medium">{inspectRecord.results.ram.consumption}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Tình trạng:</span>
                            {getConditionBadge(inspectRecord.results.ram.overallCondition)}
                          </div>
                          {inspectRecord.results.ram.notes && (
                            <p className="text-xs text-gray-600 mt-1">
                              {inspectRecord.results.ram.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Storage */}
                    {inspectRecord.results.storage && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Ổ cứng</h4>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Dung lượng còn:</span>
                            <span className="text-xs font-medium">{inspectRecord.results.storage.remainingCapacity}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Tình trạng:</span>
                            {getConditionBadge(inspectRecord.results.storage.overallCondition)}
                          </div>
                          {inspectRecord.results.storage.notes && (
                            <p className="text-xs text-gray-600 mt-1">
                              {inspectRecord.results.storage.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Battery */}
                    {inspectRecord.results.battery && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Pin</h4>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Dung lượng:</span>
                            <span className="text-xs font-medium">{inspectRecord.results.battery.capacity}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Hiệu suất:</span>
                            <span className="text-xs font-medium">{inspectRecord.results.battery.performance}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Chu kỳ sạc:</span>
                            <span className="text-xs font-medium">{inspectRecord.results.battery.chargeCycles}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Tình trạng:</span>
                            {getConditionBadge(inspectRecord.results.battery.overallCondition)}
                          </div>
                          {inspectRecord.results.battery.notes && (
                            <p className="text-xs text-gray-600 mt-1">
                              {inspectRecord.results.battery.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Display */}
                    {inspectRecord.results.display && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Màn hình</h4>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Có sọc:</span>
                            <span className={`text-xs font-medium ${inspectRecord.results.display.isStriped ? 'text-red-600' : 'text-green-600'}`}>
                              {inspectRecord.results.display.isStriped ? 'Có' : 'Không'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Điểm chết:</span>
                            <span className={`text-xs font-medium ${inspectRecord.results.display.hasDeadPixels ? 'text-red-600' : 'text-green-600'}`}>
                              {inspectRecord.results.display.hasDeadPixels ? 'Có' : 'Không'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Màu sắc & độ sáng:</span>
                            <span className="text-xs font-medium">{inspectRecord.results.display.colorAndBrightness}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Tình trạng:</span>
                            {getConditionBadge(inspectRecord.results.display.overallCondition)}
                          </div>
                          {inspectRecord.results.display.notes && (
                            <p className="text-xs text-gray-600 mt-1">
                              {inspectRecord.results.display.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Connectivity */}
                    {inspectRecord.results.connectivity && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Kết nối</h4>
                        <div className="space-y-1">
                          {Object.entries(inspectRecord.results.connectivity).map(([key, value]) => {
                            if (key === 'overallCondition' || key === 'notes') return null;
                            return (
                              <div key={key} className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">{key}:</span>
                                <span className={`text-xs font-medium ${value ? 'text-green-600' : 'text-red-600'}`}>
                                  {value ? 'Hoạt động' : 'Không hoạt động'}
                                </span>
                              </div>
                            );
                          })}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Tình trạng:</span>
                            {getConditionBadge(inspectRecord.results.connectivity.overallCondition)}
                          </div>
                          {inspectRecord.results.connectivity.notes && (
                            <p className="text-xs text-gray-600 mt-1">
                              {inspectRecord.results.connectivity.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Software */}
                    {inspectRecord.results.software && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Phần mềm</h4>
                        <div className="space-y-1">
                          {Object.entries(inspectRecord.results.software).map(([key, value]) => {
                            if (key === 'overallCondition' || key === 'notes') return null;
                            return (
                              <div key={key} className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">{key}:</span>
                                <span className={`text-xs font-medium ${value ? 'text-green-600' : 'text-red-600'}`}>
                                  {value ? 'Đã kiểm tra' : 'Chưa kiểm tra'}
                                </span>
                              </div>
                            );
                          })}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Tình trạng:</span>
                            {getConditionBadge(inspectRecord.results.software.overallCondition)}
                          </div>
                          {inspectRecord.results.software.notes && (
                            <p className="text-xs text-gray-600 mt-1">
                              {inspectRecord.results.software.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Conclusions and Recommendations */}
              {(inspectRecord.technicalConclusion || inspectRecord.followUpRecommendation) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Kết luận & Khuyến nghị</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {inspectRecord.technicalConclusion && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Kết luận kỹ thuật</h4>
                        <p className="text-sm text-gray-700">{inspectRecord.technicalConclusion}</p>
                      </div>
                    )}
                    {inspectRecord.followUpRecommendation && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Khuyến nghị tiếp theo</h4>
                        <p className="text-sm text-gray-700">{inspectRecord.followUpRecommendation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Report Download */}
              {inspectRecord.documentUrl && inspectRecord.documentUrl !== '#' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Biên bản kiểm tra</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Biên bản kiểm tra chi tiết</span>
                      </div>
                      <div className="flex space-x-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadReport(inspectRecord.documentUrl)}
                              className="text-xs"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Tải xuống</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadReport(inspectRecord.documentUrl)}
                              className="text-xs"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Xem</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
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
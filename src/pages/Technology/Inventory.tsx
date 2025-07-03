import React, { useState, useEffect } from 'react';
import { Laptop, Monitor, Printer, Server, HardDrive, Search, Filter, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import { getAvatarUrl, getInitials } from '../../lib/utils';
import { inventoryService } from '../../services/inventoryService';
import type { DeviceType, Device } from '../../types/inventory';
import AddDeviceModal from './Dialog/AddDeviceModal';
import DeviceDetailModal from './Dialog/DeviceDetailModal';

// Device menu configuration
const deviceCategories = [
  {
    id: 'laptop' as DeviceType,
    name: 'Laptop',
    icon: Laptop,
    color: 'text-white',
    bgColor: 'bg-[#002855]',
  },
  {
    id: 'monitor' as DeviceType,
    name: 'Màn hình',
    icon: Monitor,
     color: 'text-white',
    bgColor: 'bg-[#002855]',
  },
  {
    id: 'printer' as DeviceType,
    name: 'Máy in',
    icon: Printer,
    color: 'text-white',
    bgColor: 'bg-[#002855]',
  },
  {
    id: 'projector' as DeviceType,
    name: 'Máy chiếu',
    icon: Server,
     color: 'text-white',
    bgColor: 'bg-[#002855]',
  },
  {
    id: 'tool' as DeviceType,
    name: 'Công cụ',
    icon: HardDrive,
     color: 'text-white',
    bgColor: 'bg-[#002855]',
  },
];

// Status badge styling
const getStatusBadge = (status: string) => {
  const statusConfig = {
    'Active': { variant: 'default' as const, label: 'Đang sử dụng', className: 'bg-[#002855] text-white w-32 justify-center font-semibold text-xs' },
    'Standby': { variant: 'secondary' as const, label: 'Sẵn sàng bàn giao', className: 'bg-[#009483] text-white w-32 justify-center font-semibold text-xs' },
    'Broken': { variant: 'destructive' as const, label: 'Hỏng', className: 'bg-[#F05023] text-white w-32 justify-center font-semibold text-xs' },
    'PendingDocumentation': { variant: 'outline' as const, label: 'Thiếu biên bản', className: 'bg-[#F5AA1E] text-white w-32 justify-center font-semibold text-xs' },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Standby'];
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
};

// Device table component
const DeviceTable: React.FC<{ 
  devices: Device[]; 
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onDeviceClick: (deviceId: string) => void;
}> = ({ devices, isLoading, currentPage, totalPages, onPageChange, onDeviceClick }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!devices || devices.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Không có thiết bị nào được tìm thấy.</p>
      </div>
    );
  }

  // Generate pagination numbers
  const generatePaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          items.push(i);
        }
        items.push('ellipsis');
        items.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        items.push(1);
        items.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          items.push(i);
        }
      } else {
        items.push(1);
        items.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(i);
        }
        items.push('ellipsis');
        items.push(totalPages);
      }
    }
    
    return items;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Table container with overflow */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thiết bị</TableHead>
              <TableHead>Loại thiết bị</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Người sử dụng</TableHead>
              <TableHead>Phòng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device._id}>
                <TableCell>
                  <div 
                    className="font-medium text-[#002855]  cursor-pointer hover:underline"
                    onClick={() => onDeviceClick(device._id)}
                  >
                    {device.name}
                  </div>
                  <div className="text-sm text-gray-500 italic">
                    {[device.manufacturer, device.releaseYear].filter(Boolean).join(' • ') || 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{device.type || 'N/A'}</span>
                </TableCell>
                <TableCell className="font-mono text-sm">{device.serial}</TableCell>
                <TableCell>{getStatusBadge(device.status)}</TableCell>
                <TableCell>
                  {device.assigned && device.assigned.length > 0 ? (
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8 ">
                        <AvatarImage src={getAvatarUrl(device.assigned[0]?.avatarUrl)} alt={device.assigned[0]?.fullname} className="object-cover object-top" />
                        <AvatarFallback className="text-xs">
                          {getInitials(device.assigned[0]?.fullname || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{device.assigned[0]?.fullname}</div>
                        <div className="text-xs text-gray-500">{device.assigned[0]?.jobTitle}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">Chưa bàn giao</span>
                  )}
                </TableCell>
                <TableCell>
                  {device.room ? (
                    <div>
                      <div className="font-medium text-sm">{device.room.name}</div>
                      <div className="text-xs text-gray-500">
                        {Array.isArray(device.room.location) 
                          ? device.room.location.map(loc => {
                              if (typeof loc === 'string') {
                                return loc;
                              } else if (typeof loc === 'object' && loc && 'building' in loc && 'floor' in loc) {
                                const roomLoc = loc as { building: string; floor: string };
                                return `${roomLoc.building}, tầng ${roomLoc.floor}`;
                              }
                              return 'Không xác định';
                            }).join(', ')
                          : 'N/A'}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">Chưa xác định</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination - Fixed at bottom */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 pt-4 border-t">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {generatePaginationItems().map((item, index) => (
                <PaginationItem key={index}>
                  {item === 'ellipsis' ? (
                    <span className="px-3 py-2">...</span>
                  ) : (
                    <PaginationLink
                      onClick={() => onPageChange(item as number)}
                      isActive={currentPage === item}
                      className="cursor-pointer"
                    >
                      {item}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

// Filter interface
interface DeviceFilters {
  status?: string;
  manufacturer?: string;
  type?: string;
  assignedUser?: string;
  room?: string;
  releaseYear?: string;
}

// Main Inventory component
const Inventory: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<DeviceType>('laptop');
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<DeviceFilters>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter options (populated from API)
  const [filterOptions, setFilterOptions] = useState({
    statuses: ['Active', 'Standby', 'Broken', 'PendingDocumentation'],
    manufacturers: [] as string[],
    types: [] as string[],
    rooms: [] as string[],
    assignedUsers: [] as string[],
    yearRange: [2015, new Date().getFullYear()] as [number, number]
  });

  // Device detail modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle category change
  const handleCategoryChange = (category: DeviceType) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when changing category
    setSearchTerm(''); // Clear search
    setFilters({}); // Clear filters
  };

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle filter change
  const handleFilterChange = (newFilters: DeviceFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle device detail modal
  const handleDeviceClick = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedDeviceId(null);
  };

  // Load filter options when category changes
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await inventoryService.getFilterOptions(selectedCategory);
        setFilterOptions(prev => ({
          ...prev,
          manufacturers: options.manufacturers || [],
          types: options.types || [],
          yearRange: options.yearRange || [2015, new Date().getFullYear()],
        }));
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    };

    loadFilterOptions();
  }, [selectedCategory]);

  // Fetch devices when category, page, search, or filters change
  useEffect(() => {
    const fetchDevices = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Prepare search and filter params
        const searchFilters = {
          search: searchTerm || undefined,
          status: filters.status || undefined,
          manufacturer: filters.manufacturer || undefined,
          type: filters.type || undefined,
          releaseYear: filters.releaseYear || undefined,
        };

        const response = await inventoryService.getDevicesByType(selectedCategory, currentPage, 20, searchFilters);
        
        // Handle different response structures
        let deviceList: Device[] = [];
        let paginationData = null;
        
        if ('populatedLaptops' in response) {
          deviceList = response.populatedLaptops;
          paginationData = response.pagination;
        } else if ('populatedMonitors' in response) {
          deviceList = response.populatedMonitors;
          paginationData = response.pagination;
        } else if ('populatedPrinters' in response) {
          deviceList = response.populatedPrinters;
          paginationData = response.pagination;
        } else if ('populatedTools' in response) {
          deviceList = response.populatedTools;
          // Tools don't have pagination
          setTotalPages(1);
        } else if ('populatedProjectors' in response) {
          deviceList = response.populatedProjectors;
          paginationData = response.pagination;
        }
        
        // Set pagination data for paginated responses
        if (paginationData) {
          setTotalPages(paginationData.totalPages);
        }
        
        setDevices(deviceList);
      } catch (err) {
        console.error('Error fetching devices:', err);
        setError('Không thể tải dữ liệu thiết bị. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchDevices();
    }, searchTerm ? 300 : 0);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, currentPage, searchTerm, filters]);

  const selectedCategoryInfo = deviceCategories.find(cat => cat.id === selectedCategory);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-white border border-gray-200 rounded-2xl mr-5">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Quản lý thiết bị</h1>
          <nav className="space-y-2">
            {deviceCategories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <Button
                  key={category.id}
                  variant={isSelected ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start h-12",
                    isSelected 
                      ? "bg-[#002855] text-white hover:bg-[#002855]" 
                      : "hover:bg-gray-100"
                  )}
                  onClick={() => handleCategoryChange(category.id)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {category.name}
                </Button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-900">Danh sách {selectedCategoryInfo?.name}</CardTitle>
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm thiết bị..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 w-64"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={() => handleSearchChange('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Filter */}
                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <Filter className="h-4 w-4" />
                      <span>Lọc</span>
                      {Object.keys(filters).length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {Object.keys(filters).length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Bộ lọc</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFilterChange({})}
                          className="text-sm"
                        >
                          Xóa tất cả
                        </Button>
                      </div>
                      {/* Status Filter */}
                      <div>
                        <label className="text-sm font-medium">Trạng thái</label>
                        <Select value={filters.status || 'all'} onValueChange={(value) => 
                          handleFilterChange({ ...filters, status: value === 'all' ? undefined : value })
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            {filterOptions.statuses.map(status => (
                              <SelectItem key={status} value={status}>
                                {status === 'Active' ? 'Đang sử dụng' : 
                                 status === 'Standby' ? 'Sẵn sàng bàn giao' :
                                 status === 'Broken' ? 'Hỏng' :
                                 status === 'PendingDocumentation' ? 'Thiếu biên bản' : status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Manufacturer Filter */}
                      <div>
                        <label className="text-sm font-medium">Hãng sản xuất</label>
                        <Select value={filters.manufacturer || 'all'} onValueChange={(value) => 
                          handleFilterChange({ ...filters, manufacturer: value === 'all' ? undefined : value })
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn hãng" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            {filterOptions.manufacturers.map(manufacturer => (
                              <SelectItem key={manufacturer} value={manufacturer}>
                                {manufacturer}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Type Filter */}
                      <div>
                        <label className="text-sm font-medium">Loại thiết bị</label>
                        <Select value={filters.type || 'all'} onValueChange={(value) => 
                          handleFilterChange({ ...filters, type: value === 'all' ? undefined : value })
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn loại" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            {filterOptions.types.map(type => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Release Year Filter */}
                      <div>
                        <label className="text-sm font-medium">Năm sản xuất</label>
                        <Select value={filters.releaseYear || 'all'} onValueChange={(value) => 
                          handleFilterChange({ ...filters, releaseYear: value === 'all' ? undefined : value })
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn năm" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            {Array.from(
                              { length: filterOptions.yearRange[1] - filterOptions.yearRange[0] + 1 }, 
                              (_, i) => filterOptions.yearRange[1] - i
                            ).map(year => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                {/* Add Device */}
                <AddDeviceModal 
                  deviceType={selectedCategory}
                  onDeviceAdded={() => {
                    // Refresh the devices list - force refetch
                    setCurrentPage(1);
                    setSearchTerm(''); // Clear search to show all devices
                    setFilters({}); // Clear filters to show all devices
                    // Force a refetch by clearing the current devices
                    setDevices([]);
                    setIsLoading(true);
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            {error ? (
              <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Thử lại
                </Button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <DeviceTable 
                  devices={devices} 
                  isLoading={isLoading}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  onDeviceClick={handleDeviceClick}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Device Detail Modal */}
      <DeviceDetailModal
        open={isDetailModalOpen}
        onOpenChange={handleCloseDetailModal}
        deviceType={selectedCategory}
        deviceId={selectedDeviceId}
      />
    </div>
  );
};

export default Inventory;

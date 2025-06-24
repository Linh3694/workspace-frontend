import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Calendar, Upload, Edit, Eye, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DatePicker } from '@/components/ui/datepicker';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/image-upload';
import { API_URL } from '@/lib/config';

// Types
interface ActivityDay {
  _id?: string;
  dayNumber: number;
  date: string;
  title: string;
  description: string;
  isPublished?: boolean;
  images: Array<{
    _id?: string;
    url: string;
    caption?: string;
    uploadedAt?: string;
  }>;
}

interface LibraryActivity {
  _id: string;
  title: string;
  description?: string;
  date: string;
  days: ActivityDay[];
  images: Array<{
    _id: string;
    url: string;
    caption?: string;
    uploadedAt: string;
  }>;
  isPublished: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ActivityFormData {
  title: string;
  days: Array<{
    title: string;
    date: Date;
  }>;
}

const LibraryActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<LibraryActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<LibraryActivity | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState<LibraryActivity | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isViewImagesModalOpen, setIsViewImagesModalOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [currentDayImages, setCurrentDayImages] = useState<Array<{
    _id: string;
    url: string;
    caption?: string;
    uploadedAt: string;
  }>>([]);
  const [isDeleteImageDialogOpen, setIsDeleteImageDialogOpen] = useState(false);
  const [deletingImage, setDeletingImage] = useState<{
    activityId: string;
    dayId: string;
    imageId: string;
    imageName: string;
  } | null>(null);

  const form = useForm<ActivityFormData>({
    defaultValues: {
      title: '',
      days: [{ title: 'Ngày 1', date: new Date() }]
    }
  });

  // Fetch activities - Admin interface shows all activities
  const fetchActivities = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        admin: 'true', // Admin interface - show all activities regardless of published status
        ...(search && { search })
      });

      const response = await fetch(`${API_URL}/library-activities?${params}`);
      if (!response.ok) throw new Error('Lỗi khi tải danh sách hoạt động');
      
      const data = await response.json();
      setActivities(data.activities || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Không thể tải danh sách hoạt động');
      // Set empty state on error
      setActivities([]);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  // Create activity
  const handleCreateActivity = async (data: ActivityFormData) => {
    try {
      const response = await fetch(`${API_URL}/library-activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          date: data.days[0].date.toISOString(),
          days: data.days.map((day, index) => ({
            dayNumber: index + 1,
            date: day.date.toISOString(),
            title: day.title,
            description: '',
            isPublished: true,
            images: []
          })),
          createdBy: 'current-user' // Replace with actual user
        }),
      });

      if (!response.ok) throw new Error('Lỗi khi tạo hoạt động');
      
      toast.success('Tạo hoạt động thành công');
      setIsCreateModalOpen(false);
      form.reset({
        title: '',
        days: [{ title: 'Ngày 1', date: new Date() }]
      });
      fetchActivities(currentPage, searchTerm);
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Không thể tạo hoạt động');
    }
  };

  // Update activity
  const handleUpdateActivity = async (data: ActivityFormData) => {
    if (!editingActivity) return;

    try {
      const response = await fetch(`${API_URL}/library-activities/${editingActivity._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          date: data.days[0].date.toISOString(),
          days: data.days.map((day, index) => ({
            dayNumber: index + 1,
            date: day.date.toISOString(),
            title: day.title,
            description: '',
            isPublished: true,
            images: []
          })),
        }),
      });

      if (!response.ok) throw new Error('Lỗi khi cập nhật hoạt động');
      
      toast.success('Cập nhật hoạt động thành công');
      setIsEditModalOpen(false);
      setEditingActivity(null);
      form.reset({
        title: '',
        days: [{ title: 'Ngày 1', date: new Date() }]
      });
      fetchActivities(currentPage, searchTerm);
    } catch (error) {
      console.error('Error updating activity:', error);
      toast.error('Không thể cập nhật hoạt động');
    }
  };

  // Delete activity
  const handleDeleteActivity = async () => {
    if (!deletingActivity) return;

    try {
      const response = await fetch(`${API_URL}/library-activities/${deletingActivity._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Lỗi khi xóa hoạt động');
      
      toast.success('Xóa hoạt động thành công');
      setIsDeleteDialogOpen(false);
      setDeletingActivity(null);
      fetchActivities(currentPage, searchTerm);
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Không thể xóa hoạt động');
    }
  };

  // Delete day
  const handleDeleteDay = async (activityId: string, dayId: string) => {
    try {
      const response = await fetch(`${API_URL}/library-activities/${activityId}/days/${dayId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Lỗi khi xóa ngày');
      
      toast.success('Xóa ngày thành công');
      fetchActivities(currentPage, searchTerm);
    } catch (error) {
      console.error('Error deleting day:', error);
      toast.error('Không thể xóa ngày');
    }
  };

  // Upload images for day
  const handleUploadImages = async (images: Array<{ url: string; caption?: string }>) => {
    if (!selectedActivityId || !selectedDayId) return;

    try {
      const response = await fetch(`${API_URL}/library-activities/${selectedActivityId}/days/${selectedDayId}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ images }),
      });

      if (!response.ok) throw new Error('Lỗi khi thêm ảnh');
      
      toast.success('Thêm ảnh thành công');
      setIsImageModalOpen(false);
      
             // Refresh current day images if view modal is open
       if (isViewImagesModalOpen && selectedActivityId && selectedDayId) {
         const response = await fetch(`${API_URL}/library-activities/${selectedActivityId}`);
         if (response.ok) {
           const activityData: LibraryActivity = await response.json();
           const day = activityData.days.find(d => d._id === selectedDayId);
           if (day) {
             const validImages = day.images.filter(img => img._id && img.uploadedAt).map(img => ({
               _id: img._id!,
               url: img.url,
               caption: img.caption,
               uploadedAt: img.uploadedAt!
             }));
             setCurrentDayImages(validImages);
           }
         }
       } else {
        setSelectedActivityId(null);
        setSelectedDayId(null);
      }
      
      fetchActivities(currentPage, searchTerm);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Không thể thêm ảnh');
    }
      };

  // Delete single image
  const handleDeleteImage = async () => {
    if (!deletingImage) return;

    try {
      const { activityId, dayId, imageId } = deletingImage;
      const response = await fetch(`${API_URL}/library-activities/${activityId}/days/${dayId}/images/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Lỗi khi xóa ảnh');
      
      toast.success('Xóa ảnh thành công');
      // Update current day images
      setCurrentDayImages(prev => prev.filter(img => img._id !== imageId));
      // Refresh activities list
      fetchActivities(currentPage, searchTerm);
      
      // Close dialog
      setIsDeleteImageDialogOpen(false);
      setDeletingImage(null);
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Không thể xóa ảnh');
    }
  };

  // Open delete image dialog
  const openDeleteImageDialog = (activityId: string, dayId: string, imageId: string, imageName: string) => {
    setDeletingImage({ activityId, dayId, imageId, imageName });
    setIsDeleteImageDialogOpen(true);
  };
  
  // Toggle published status for individual day
  const handleToggleDayPublished = async (activityId: string, dayId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_URL}/library-activities/${activityId}/days/${dayId}/toggle-published`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      if (!response.ok) throw new Error('Lỗi khi cập nhật trạng thái ngày');
      
      toast.success(`${!currentStatus ? 'Xuất bản' : 'Ẩn'} ngày thành công`);
      fetchActivities(currentPage, searchTerm);
    } catch (error) {
      console.error('Error toggling day published status:', error);
      toast.error('Không thể cập nhật trạng thái ngày');
    }
  };

  
    // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    fetchActivities(1, value);
  };

  // Open edit modal
  const openEditModal = (activity: LibraryActivity) => {
    setEditingActivity(activity);
    form.reset({
      title: activity.title,
      days: activity.days.map(day => ({
        title: day.title,
        date: new Date(day.date)
      }))
    });
    setIsEditModalOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (activity: LibraryActivity) => {
    setDeletingActivity(activity);
    setIsDeleteDialogOpen(true);
  };

  // Open image modal
  const openImageModal = (activityId: string, dayId: string) => {
    setSelectedActivityId(activityId);
    setSelectedDayId(dayId);
    setIsImageModalOpen(true);
  };

  // Open view images modal
  const openViewImagesModal = (activityId: string, dayId: string) => {
    const activity = activities.find(a => a._id === activityId);
    const day = activity?.days.find(d => d._id === dayId);
    if (day) {
      // Filter out images without _id and uploadedAt to match the type
      const validImages = day.images.filter(img => img._id && img.uploadedAt).map(img => ({
        _id: img._id!,
        url: img.url,
        caption: img.caption,
        uploadedAt: img.uploadedAt!
      }));
      setCurrentDayImages(validImages);
      setSelectedActivityId(activityId);
      setSelectedDayId(dayId);
      setIsViewImagesModalOpen(true);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const ActivityForm = ({ isEdit = false }: { isEdit?: boolean }) => {
    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "days"
    });

    const addDay = () => {
      append({ title: `Ngày ${fields.length + 1}`, date: new Date() });
    };

    const removeDay = (index: number) => {
      if (fields.length > 1) {
        remove(index);
      }
    };

    const onSubmit = isEdit ? handleUpdateActivity : handleCreateActivity;

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            rules={{ required: 'Tiêu đề là bắt buộc' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tiêu đề hoạt động</FormLabel>
                <FormControl>
                  <Input placeholder="Nhập tiêu đề hoạt động..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <FormLabel>Ngày hoạt động</FormLabel>
              <Button type="button" onClick={addDay} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Thêm ngày
              </Button>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                <div className="col-span-5">Tên ngày</div>
                <div className="col-span-5">Ngày diễn ra</div>
                <div className="col-span-2">Thao tác</div>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    <FormField
                      control={form.control}
                      name={`days.${index}.title` as const}
                      render={({ field }) => (
                        <FormControl>
                          <Input
                            placeholder="Tên ngày (VD: Ngày 1 - Khai mạc)"
                            {...field}
                          />
                        </FormControl>
                      )}
                    />
                  </div>
                  <div className="col-span-5">
                    <FormField
                      control={form.control}
                      name={`days.${index}.date` as const}
                      render={({ field }) => (
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                          />
                        </FormControl>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDay(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : (isEdit ? 'Cập nhật hoạt động' : 'Tạo hoạt động')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Activities Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Danh sách hoạt động</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm theo tiêu đề..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm hoạt động
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Đang tải...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-muted-foreground">Chưa có hoạt động nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên ngày</TableHead>
                  <TableHead>Ngày diễn ra</TableHead>
                  <TableHead>Số ảnh</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <React.Fragment key={activity._id}>
                    {/* Main activity row */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={2} className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{activity.title}</span>
                          <Badge variant="outline">
                            {activity.days.length} ngày
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {activity.days.reduce((total, day) => total + day.images.length, 0)} ảnh tổng
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          Trạng thái theo ngày
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(activity)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(activity)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Day rows */}
                    {activity.days.map((day) => (
                      <TableRow key={day._id}>
                        <TableCell className="pl-8">
                          {day.title}
                        </TableCell>
                        <TableCell>
                          {new Date(day.date).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {day.images.length} ảnh
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={day.isPublished ?? true}
                              onCheckedChange={() => handleToggleDayPublished(activity._id, day._id!, day.isPublished ?? true)}
                            />
                            <span className="text-sm">
                              {day.isPublished ?? true ? 'Ngày đã xuất bản' : 'Ngày ở trạng thái nháp'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {day.images.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openViewImagesModal(activity._id, day._id!)}
                                title="Xem ảnh"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openImageModal(activity._id, day._id!)}
                              title="Thêm ảnh"
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDay(activity._id, day._id!)}
                              title="Xóa ngày"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => fetchActivities(currentPage - 1, searchTerm)}
              >
                Trước
              </Button>
              <span className="flex items-center px-4">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => fetchActivities(currentPage + 1, searchTerm)}
              >
                Sau
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog 
        open={isCreateModalOpen} 
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) {
            form.reset({
              title: '',
              days: [{ title: 'Ngày 1', date: new Date() }]
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Thêm hoạt động mới</DialogTitle>
          </DialogHeader>
          <ActivityForm />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog 
        open={isEditModalOpen} 
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            setEditingActivity(null);
            form.reset({
              title: '',
              days: [{ title: 'Ngày 1', date: new Date() }]
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa hoạt động</DialogTitle>
          </DialogHeader>
          <ActivityForm isEdit={true} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Bạn có chắc chắn muốn xóa hoạt động "{deletingActivity?.title}"? 
            Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteActivity}
              disabled={loading}
            >
              {loading ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Images Modal */}
      <Dialog open={isViewImagesModalOpen} onOpenChange={setIsViewImagesModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quản lý ảnh</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {currentDayImages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Chưa có ảnh nào</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {currentDayImages.map((image, index) => (
                  <div key={image._id} className="relative group">
                    <div className="aspect-square overflow-hidden rounded-lg border">
                      <img
                        src={image.url}
                        alt={image.caption || `Ảnh ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    
                    {/* Image controls overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (selectedActivityId && selectedDayId) {
                            openDeleteImageDialog(
                              selectedActivityId, 
                              selectedDayId, 
                              image._id, 
                              image.caption || `Ảnh ${index + 1}`
                            );
                          }
                        }}
                        title="Xóa ảnh"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Caption */}
                    {image.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-sm p-2 rounded-b-lg">
                        {image.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Add more images button */}
            <div className="pt-4 border-t">
              <Button
                onClick={() => {
                  setIsViewImagesModalOpen(false);
                  if (selectedActivityId && selectedDayId) {
                    openImageModal(selectedActivityId, selectedDayId);
                  }
                }}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm ảnh mới
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Upload Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Thêm ảnh cho ngày</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ImageUpload
              images={[]}
              onImagesChange={handleUploadImages}
              maxImages={20}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImageModalOpen(false)}
            >
              Hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Image Confirmation Dialog */}
      <Dialog open={isDeleteImageDialogOpen} onOpenChange={setIsDeleteImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa ảnh</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Bạn có chắc chắn muốn xóa ảnh "{deletingImage?.imageName}"? 
            Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteImageDialogOpen(false);
                setDeletingImage(null);
              }}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteImage}
              disabled={loading}
            >
              {loading ? 'Đang xóa...' : 'Xóa ảnh'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LibraryActivitiesPage;

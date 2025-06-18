import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Calendar } from 'lucide-react';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/ui/image-upload';
import { API_URL } from '@/lib/config';

// Types
interface LibraryActivity {
  _id: string;
  title: string;
  date: string;
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
  date: Date;
  images: Array<{
    url: string;
    caption?: string;
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

  const form = useForm<ActivityFormData>({
    defaultValues: {
      title: '',
      date: new Date(),
      images: []
    }
  });

  // Fetch activities
  const fetchActivities = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search })
      });

      const response = await fetch(`${API_URL}/library-activities?${params}`);
      if (!response.ok) throw new Error('Lỗi khi tải danh sách hoạt động');
      
      const data = await response.json();
      setActivities(data.activities);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Không thể tải danh sách hoạt động');
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
          date: data.date.toISOString(),
          images: data.images,
          createdBy: 'current-user' // Replace with actual user
        }),
      });

      if (!response.ok) throw new Error('Lỗi khi tạo hoạt động');
      
      toast.success('Tạo hoạt động thành công');
      setIsCreateModalOpen(false);
      // Reset form về giá trị mặc định
      form.reset({
        title: '',
        date: new Date(),
        images: []
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
          date: data.date.toISOString(),
          images: data.images,
        }),
      });

      if (!response.ok) throw new Error('Lỗi khi cập nhật hoạt động');
      
      toast.success('Cập nhật hoạt động thành công');
      setIsEditModalOpen(false);
      setEditingActivity(null);
      // Reset form về giá trị mặc định
      form.reset({
        title: '',
        date: new Date(),
        images: []
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
      date: new Date(activity.date),
      images: activity.images.map(img => ({ url: img.url, caption: img.caption }))
    });
    setIsEditModalOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (activity: LibraryActivity) => {
    setDeletingActivity(activity);
    setIsDeleteDialogOpen(true);
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const ActivityForm = ({ onSubmit, submitText }: { onSubmit: (data: ActivityFormData) => void, submitText: string }) => (
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

        <FormField
          control={form.control}
          name="date"
          rules={{ required: 'Ngày hoạt động là bắt buộc' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ngày hoạt động</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  setDate={field.onChange}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hình ảnh</FormLabel>
              <FormControl>
                <ImageUpload
                  images={field.value}
                  onImagesChange={field.onChange}
                  maxImages={10}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : submitText}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý hoạt động thư viện</h1>
          <p className="text-muted-foreground">
            Tạo, chỉnh sửa và quản lý các hoạt động của thư viện
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm hoạt động
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm và lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm theo tiêu đề..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách hoạt động</CardTitle>
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
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Ngày hoạt động</TableHead>
                  <TableHead>Số hình ảnh</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity._id}>
                    <TableCell className="font-medium">
                      {activity.title}
                    </TableCell>
                    <TableCell>
                      {new Date(activity.date).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {activity.images.length} ảnh
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={activity.isPublished ? "default" : "secondary"}>
                        {activity.isPublished ? 'Đã xuất bản' : 'Nháp'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(activity.createdAt).toLocaleDateString('vi-VN')}
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
            // Reset form khi đóng modal
            form.reset({
              title: '',
              date: new Date(),
              images: []
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Thêm hoạt động mới</DialogTitle>
          </DialogHeader>
          <ActivityForm 
            onSubmit={handleCreateActivity} 
            submitText="Tạo hoạt động" 
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog 
        open={isEditModalOpen} 
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            // Reset editing state khi đóng modal
            setEditingActivity(null);
            form.reset({
              title: '',
              date: new Date(),
              images: []
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa hoạt động</DialogTitle>
          </DialogHeader>
          <ActivityForm 
            onSubmit={handleUpdateActivity} 
            submitText="Cập nhật hoạt động" 
          />
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
    </div>
  );
};

export default LibraryActivitiesPage;

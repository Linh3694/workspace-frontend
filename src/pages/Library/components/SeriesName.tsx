import { useState, useEffect } from "react";
import { API_URL } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { FiPlus } from "react-icons/fi";
import { toast } from "sonner";
import type { SeriesName } from "@/types/library";

// Utility function to handle errors
const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Lỗi không xác định";
};

export function SeriesNameComponent() {
  const [data, setData] = useState<SeriesName[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [seriesNameToDelete, setSeriesNameToDelete] = useState<SeriesName | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/libraries/series-names`);
      if (!response.ok) throw new Error("Failed to fetch series names");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching series names:", error);
      toast.error("Lỗi khi tải danh sách tùng thư");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setName("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: SeriesName) => {
    setModalMode("edit");
    setEditingId(item._id);
    setName(item.name);
    setIsModalOpen(true);
  };

  const handleModalSave = async () => {
    if (!name) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    
    try {
      if (modalMode === "create") {
        // Tạo mới - chỉ gửi name, backend sẽ tự generate code
        const response = await fetch(`${API_URL}/libraries/series-names`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Lỗi khi tạo series name");
        }
        
        toast.success("Tạo mới thành công");
      } else {
        // Cập nhật - chỉ gửi name
        const response = await fetch(`${API_URL}/libraries/series-names/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Lỗi khi cập nhật series name");
        }
        
        toast.success("Cập nhật thành công");
      }
      
      setName("");
      setEditingId(null);
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving series name:", error);
      toast.error(error instanceof Error ? error.message : "Lỗi không xác định");
    }
  };

  const handleDelete = async (item: SeriesName) => {
    try {
      const response = await fetch(`${API_URL}/libraries/series-names/${item._id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi xóa series name");
      }
      
      fetchData();
      toast.success("Xóa thành công");
    } catch (error) {
      console.error("Error deleting series name:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const confirmDelete = (item: SeriesName) => {
    setSeriesNameToDelete(item);
    setDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (seriesNameToDelete) {
      await handleDelete(seriesNameToDelete);
      setDeleteDialogOpen(false);
      setSeriesNameToDelete(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tùng thư</CardTitle>
          <Button 
          variant="destructive"
          onClick={openCreateModal} className="flex items-center gap-2">
            <FiPlus size={16} />
            Thêm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>STT</TableHead>
              <TableHead>Tên tùng thư</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, idx) => (
              <TableRow key={item._id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => openEditModal(item)}
                      className="bg-[#002855] text-white hover:bg-[#002855]/80"
                    >
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => confirmDelete(item)}
                    >
                      Xoá
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Modal tạo mới/chỉnh sửa */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" ? "Tạo mới tùng thư" : "Chỉnh sửa tùng thư"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="name" className="block text-sm font-medium mb-2">
                Tên tùng thư <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên tùng thư..."
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleModalSave}>
              {modalMode === "create" ? "Tạo mới" : "Cập nhật"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog xác nhận xóa */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tùng thư "{seriesNameToDelete?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-[#FF5733] text-white hover:bg-[#FF5733]/80">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
} 
import { useState, useEffect } from "react";
import { API_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { FiPlus } from "react-icons/fi";
import { toast } from "sonner";
import type { Author } from "@/types/library";

// Utility function to handle errors
const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Lỗi không xác định";
};

export function AuthorListComponent() {
  const [data, setData] = useState<Author[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/libraries/authors`);
      if (!response.ok) throw new Error("Failed to fetch authors");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching authors:", error);
      toast.error("Lỗi khi tải danh sách tác giả");
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

  const openEditModal = (item: Author) => {
    setModalMode("edit");
    setEditingId(item._id);
    setName(item.name);
    setIsModalOpen(true);
  };

  const handleModalSave = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    
    try {
      if (modalMode === "create") {
        // Tạo mới
        const response = await fetch(`${API_URL}/libraries/authors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Lỗi khi tạo tác giả");
        }
        
        toast.success("Tạo mới thành công");
      } else {
        // Cập nhật
        const response = await fetch(`${API_URL}/libraries/authors/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Lỗi khi cập nhật tác giả");
        }
        
        toast.success("Cập nhật thành công");
      }
      
      setName("");
      setEditingId(null);
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving author:", error);
      toast.error(error instanceof Error ? error.message : "Lỗi không xác định");
    }
  };

  const handleDelete = async (item: Author) => {
    try {
      const response = await fetch(`${API_URL}/libraries/authors/${item._id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi xóa tác giả");
      }
      
      fetchData();
      toast.success("Xóa thành công");
    } catch (error) {
      console.error("Error deleting author:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const confirmDelete = (item: Author) => {
    setAuthorToDelete(item);
    setDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (authorToDelete) {
      await handleDelete(authorToDelete);
      setDeleteDialogOpen(false);
      setAuthorToDelete(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Danh sách tác giả</CardTitle>
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
              <TableHead>Tên tác giả</TableHead>
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
              {modalMode === "create" ? "Tạo mới tác giả" : "Chỉnh sửa tác giả"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="name" className="block text-sm font-medium mb-2">
                Tên tác giả <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên tác giả..."
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
              Bạn có chắc chắn muốn xóa tác giả "{authorToDelete?.name}"? Hành động này không thể hoàn tác.
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
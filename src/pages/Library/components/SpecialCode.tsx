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
import type { SpecialCode } from "@/types/library";

// Utility function to handle errors
const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Lỗi không xác định";
};

export function SpecialCodeComponent() {
  const [data, setData] = useState<SpecialCode[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [specialCodeToDelete, setSpecialCodeToDelete] = useState<SpecialCode | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/libraries/special-codes`);
      if (!response.ok) throw new Error("Failed to fetch special codes");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching special codes:", error);
      toast.error("Lỗi khi tải danh sách đăng ký cá biệt");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setName("");
    setCode("");
    setLanguage("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: SpecialCode) => {
    setModalMode("edit");
    setEditingId(item._id);
    setName(item.name);
    setCode(item.code);
    setLanguage(item.language || "");
    setIsModalOpen(true);
  };

  const handleModalSave = async () => {
    if (!name.trim() || !code.trim() || !language.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    
    try {
      if (modalMode === "create") {
        // Tạo mới
        const response = await fetch(`${API_URL}/libraries/special-codes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: name.trim(), 
            code: code.trim(),
            language: language.trim()
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Lỗi khi tạo special code");
        }
        
        toast.success("Tạo mới thành công");
      } else {
        // Cập nhật
        const response = await fetch(`${API_URL}/libraries/special-codes/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: name.trim(), 
            code: code.trim(),
            language: language.trim()
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Lỗi khi cập nhật special code");
        }
        
        toast.success("Cập nhật thành công");
      }
      
      setName("");
      setCode("");
      setLanguage("");
      setEditingId(null);
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving special code:", error);
      toast.error(error instanceof Error ? error.message : "Lỗi không xác định");
    }
  };

  const handleDelete = async (item: SpecialCode) => {
    try {
      const response = await fetch(`${API_URL}/libraries/special-codes/${item._id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi xóa special code");
      }
      
      fetchData();
      toast.success("Xóa thành công");
    } catch (error) {
      console.error("Error deleting special code:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const confirmDelete = (item: SpecialCode) => {
    setSpecialCodeToDelete(item);
    setDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (specialCodeToDelete) {
      await handleDelete(specialCodeToDelete);
      setDeleteDialogOpen(false);
      setSpecialCodeToDelete(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Mã quy ước</CardTitle>
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
              <TableHead>Mã đặc biệt</TableHead>
              <TableHead>Nơi lưu trữ</TableHead>
              <TableHead>Ngôn ngữ</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, idx) => (
              <TableRow key={item._id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.code}</TableCell>
                <TableCell>{item.language || "N/A"}</TableCell>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" ? "Tạo mới đăng ký cá biệt" : "Chỉnh sửa đăng ký cá biệt"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="name" className="block text-sm font-medium mb-2">
                Mã đặc biệt <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập mã đặc biệt..."
              />
            </div>
            <div>
              <Label htmlFor="code" className="block text-sm font-medium mb-2">
                Nơi lưu trữ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Nhập nơi lưu trữ..."
              />
            </div>
            <div>
              <Label htmlFor="language" className="block text-sm font-medium mb-2">
                Ngôn ngữ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="Nhập ngôn ngữ..."
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
              Bạn có chắc chắn muốn xóa mã quy ước "{specialCodeToDelete?.name}"? Hành động này không thể hoàn tác.
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
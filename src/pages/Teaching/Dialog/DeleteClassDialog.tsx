import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import { useToast } from "../../../hooks/use-toast";
import { api } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../config/api";
import type { Class } from '../../../types/class.types';

interface DeleteClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: Class | null;
  onSuccess: () => void;
}

const DeleteClassDialog: React.FC<DeleteClassDialogProps> = ({
  isOpen,
  onClose,
  selectedClass,
  onSuccess
}) => {
  const { toast } = useToast();

  const handleDeleteClass = async () => {
    try {
      if (!selectedClass) return;
      
      await api.delete(API_ENDPOINTS.CLASS(selectedClass._id));
      
      toast({
        title: "Thành công",
        description: "Xóa lớp học thành công"
      });
      
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Delete class error:', error);
      const axiosError = error as { response?: { data: unknown } };
      let message = "Không thể xóa lớp học. Vui lòng thử lại.";
      
      if (axiosError.response && axiosError.response.data) {
        const respData = axiosError.response.data;
        if (typeof respData === 'string') {
          message = respData;
        } else if (typeof respData === 'object' && respData !== null) {
          const obj = respData as { message?: string; error?: string };
          message = obj.message || obj.error || message;
        }
      }
      
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive"
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa lớp học</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa lớp học "{selectedClass?.className}" không?
            Hành động này không thể hoàn tác và có thể ảnh hưởng đến dữ liệu học sinh trong lớp.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteClass}>Xóa</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteClassDialog; 
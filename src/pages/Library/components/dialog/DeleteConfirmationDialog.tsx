import { API_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

// Utility function to handle errors
const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Lỗi không xác định";
};

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  deleteLibraryInfo: {
    libraryId: string;
    libraryTitle: string;
    bookCount: number;
    books: Array<{
      generatedCode: string;
      title: string;
      status: string;
    }>;
  } | null;
  onSuccess: () => void;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  deleteLibraryInfo,
  onSuccess
}: DeleteConfirmationDialogProps) {
  const confirmDelete = async () => {
    if (!deleteLibraryInfo) return;
    
    try {
      const response = await fetch(`${API_URL}/libraries/${deleteLibraryInfo.libraryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error deleting library");
      }

      onClose();
      onSuccess();
      toast.success("Xóa thành công!");
    } catch (error) {
      console.error("Error deleting library:", error);
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa đầu sách</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {deleteLibraryInfo && (
            <>
              <div className="text-sm">
                <p className="font-medium mb-2">
                  Bạn có chắc chắn muốn xóa đầu sách: <span className="text-red-600">"{deleteLibraryInfo.libraryTitle}"</span>?
                </p>
                <p className="text-gray-600 mb-4">
                  Đầu sách này có <span className="font-bold text-red-600">{deleteLibraryInfo.bookCount}</span> bản sách chi tiết.
                </p>
                
                {deleteLibraryInfo.bookCount > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-yellow-800 font-medium mb-2">Cảnh báo:</p>
                    <p className="text-yellow-700 text-sm mb-2">
                      Việc xóa đầu sách sẽ xóa {deleteLibraryInfo.bookCount} sách bên dưới:
                    </p>
                    <div className="max-h-32 overflow-y-auto">
                      {deleteLibraryInfo.books.map((book, index) => (
                        <div key={index} className="text-xs text-yellow-700 mb-1">
                          • {book.generatedCode} - {book.title} (Trạng thái: {book.status})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-red-600 font-medium mt-4">
                  Hành động này không thể hoàn tác.
                </p>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button 
            variant="destructive"
            onClick={confirmDelete}
          >
            Xác nhận xóa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
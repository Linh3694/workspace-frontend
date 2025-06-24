import { useState } from "react";
import { API_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Library } from "@/types/library";

// Utility function to handle errors
const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Lỗi không xác định";
};

interface DescriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  library: Library | null;
  onSuccess: () => void;
}

export function DescriptionDialog({
  isOpen,
  onClose,
  library,
  onSuccess
}: DescriptionDialogProps) {
  const [descriptionActiveTab, setDescriptionActiveTab] = useState<'description' | 'introduction' | 'audiobook'>('description');
  const [currentDescriptionLibrary, setCurrentDescriptionLibrary] = useState<Library | null>(null);

  // Update current library when dialog opens
  if (isOpen && library && currentDescriptionLibrary?._id !== library._id) {
    setCurrentDescriptionLibrary(library);
    setDescriptionActiveTab('description');
  }

  const handleSave = async () => {
    if (!currentDescriptionLibrary) return;
    
    try {
      const response = await fetch(`${API_URL}/libraries/${currentDescriptionLibrary._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: currentDescriptionLibrary.description,
          introduction: currentDescriptionLibrary.introduction,
          audioBook: currentDescriptionLibrary.audioBook,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error updating library");
      }

      onClose();
      onSuccess();
      toast.success("Cập nhật mô tả thành công!");
    } catch (error) {
      console.error("Error updating description:", error);
      toast.error(getErrorMessage(error));
    }
  };

  if (!currentDescriptionLibrary) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[62vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Mô tả sách: {currentDescriptionLibrary?.title}
          </DialogTitle>
        </DialogHeader>
        
        {/* Tabs Component */}
        <Tabs 
          value={descriptionActiveTab} 
          onValueChange={(value) => setDescriptionActiveTab(value as 'description' | 'introduction' | 'audiobook')}
          className="flex-1 flex flex-col"
        >
          <div className="flex justify-center mb-4">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="description">Mô tả</TabsTrigger>
              <TabsTrigger value="introduction">Giới thiệu sách</TabsTrigger>
              <TabsTrigger value="audiobook">Sách nói</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="description" className="space-y-4 h-full mt-0">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Link embed
                </label>
                <Input
                  type="url"
                  placeholder="Nhập URL embed từ Voiz FM, Spotify, YouTube..."
                  value={currentDescriptionLibrary?.description?.linkEmbed || ''}
                  onChange={(e) => {
                    if (currentDescriptionLibrary) {
                      setCurrentDescriptionLibrary({
                        ...currentDescriptionLibrary,
                        description: {
                          ...currentDescriptionLibrary.description,
                          linkEmbed: e.target.value
                        }
                      });
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ví dụ: https://voiz.vn/play/461/ hoặc các URL embed khác
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <Textarea
                  className="h-[200px] resize-none"
                  placeholder="Nhập nội dung mô tả sách..."
                  value={currentDescriptionLibrary?.description?.content || ''}
                  onChange={(e) => {
                    if (currentDescriptionLibrary) {
                      setCurrentDescriptionLibrary({
                        ...currentDescriptionLibrary,
                        description: {
                          ...currentDescriptionLibrary.description,
                          content: e.target.value
                        }
                      });
                    }
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="introduction" className="space-y-4 h-full mt-0">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Link embed
                </label>
                <Input
                  type="url"
                  placeholder="Nhập URL embed từ Voiz FM, Spotify, YouTube..."
                  value={currentDescriptionLibrary?.introduction?.linkEmbed || ''}
                  onChange={(e) => {
                    if (currentDescriptionLibrary) {
                      setCurrentDescriptionLibrary({
                        ...currentDescriptionLibrary,
                        introduction: {
                          ...currentDescriptionLibrary.introduction,
                          linkEmbed: e.target.value
                        }
                      });
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ví dụ: https://voiz.vn/play/461/ hoặc các URL embed khác
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Giới thiệu sách <span className="text-red-500">*</span>
                </label>
                <Textarea
                  className="h-[200px] resize-none"
                  placeholder="Nhập nội dung giới thiệu chi tiết về sách..."
                  value={currentDescriptionLibrary?.introduction?.content || ''}
                  onChange={(e) => {
                    if (currentDescriptionLibrary) {
                      setCurrentDescriptionLibrary({
                        ...currentDescriptionLibrary,
                        introduction: {
                          ...currentDescriptionLibrary.introduction,
                          content: e.target.value
                        }
                      });
                    }
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="audiobook" className="space-y-4 h-full mt-0">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Link embed
                </label>
                <Input
                  type="url"
                  placeholder="Nhập URL embed từ Voiz FM, Spotify, YouTube..."
                  value={currentDescriptionLibrary?.audioBook?.linkEmbed || ''}
                  onChange={(e) => {
                    if (currentDescriptionLibrary) {
                      setCurrentDescriptionLibrary({
                        ...currentDescriptionLibrary,
                        audioBook: {
                          ...currentDescriptionLibrary.audioBook,
                          linkEmbed: e.target.value
                        }
                      });
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ví dụ: https://voiz.vn/play/461/ hoặc các URL embed khác
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <Textarea
                  className="h-[200px] resize-none"
                  placeholder="Nhập nội dung mô tả sách nói..."
                  value={currentDescriptionLibrary?.audioBook?.content || ''}
                  onChange={(e) => {
                    if (currentDescriptionLibrary) {
                      setCurrentDescriptionLibrary({
                        ...currentDescriptionLibrary,
                        audioBook: {
                          ...currentDescriptionLibrary.audioBook,
                          content: e.target.value
                        }
                      });
                    }
                  }}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Đóng
          </Button>
          <Button 
            onClick={handleSave}
          >
            Lưu thay đổi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
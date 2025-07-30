import { useState, useRef, useEffect } from "react";
import { API_URL, BASE_URL } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { FiPlus, FiX } from "react-icons/fi";
import { toast } from "sonner";
import type { 
  DocumentType, 
  SeriesName, 
  Author, 
  Library
} from "@/types/library";

// Utility function to handle errors
const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Lỗi không xác định";
};

interface CreateEditBookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  library?: Library | null;
  allAuthors: Author[];
  allDocumentTypes: DocumentType[];
  allSeriesNames: SeriesName[];
  onSuccess: () => void;
}

export function CreateEditBookDialog({
  isOpen,
  onClose,
  mode,
  library,
  allAuthors,
  allDocumentTypes,
  allSeriesNames,
  onSuccess
}: CreateEditBookDialogProps) {
  const [currentLibrary, setCurrentLibrary] = useState<Partial<Library>>({
    authors: [],
    title: "",
    coverImage: "",
    category: "",
    language: "",
    description: {
      linkEmbed: "",
      content: ""
    },
    introduction: {
      linkEmbed: "",
      content: ""
    },
    audioBook: {
      linkEmbed: "",
      content: ""
    },
    documentType: "",
    specialCode: "",
    seriesName: "",
    isNewBook: false,
    isFeaturedBook: false,
    isAudioBook: false,
  });
  
  // States for author input
  const [authorInput, setAuthorInput] = useState("");
  const [filteredAuthors, setFilteredAuthors] = useState<Author[]>([]);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);

  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);



  // Reset form when dialog opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "create" || !library) {
        setCurrentLibrary({
          authors: [],
          title: "",
          coverImage: "",
          category: "",
          language: "",
          description: {
            linkEmbed: "",
            content: ""
          },
          introduction: {
            linkEmbed: "",
            content: ""
          },
          audioBook: {
            linkEmbed: "",
            content: ""
          },
          documentType: "",
          specialCode: "",
          seriesName: "",
          isNewBook: false,
          isFeaturedBook: false,
          isAudioBook: false,
        });
        setSelectedAuthors([]);
        setAuthorInput("");
        setCoverImageFile(null);
        setCoverImagePreview(null);
      } else {
        setCurrentLibrary(library);
        setSelectedAuthors(Array.isArray(library.authors) ? library.authors : []);
        setAuthorInput("");
        if (library.coverImage) {
          setCoverImageFile(null);
          setCoverImagePreview(`${BASE_URL}/${library.coverImage}`);
        } else {
          setCoverImageFile(null);
          setCoverImagePreview(null);
        }
      }
    }
  }, [isOpen, mode, library?._id]);

  // Author handling functions
  const handleAuthorInputChange = (value: string) => {
    setAuthorInput(value);
    if (value.trim()) {
      const filtered = allAuthors.filter(author => 
        author.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredAuthors(filtered);
      setShowAuthorSuggestions(true);
    } else {
      setShowAuthorSuggestions(false);
    }
  };

  const addAuthor = (authorName: string) => {
    if (!selectedAuthors.includes(authorName)) {
      const newAuthors = [...selectedAuthors, authorName];
      setSelectedAuthors(newAuthors);
      handleModalChange("authors", newAuthors);
    }
    setAuthorInput("");
    setShowAuthorSuggestions(false);
  };

  const removeAuthor = (authorName: string) => {
    const newAuthors = selectedAuthors.filter(name => name !== authorName);
    setSelectedAuthors(newAuthors);
    handleModalChange("authors", newAuthors);
  };

  const addNewAuthor = async () => {
    if (!authorInput.trim()) return;
    
    try {
      const response = await fetch(`${API_URL}/libraries/authors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: authorInput.trim() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi tạo tác giả");
      }
      
      // Add to selected authors
      addAuthor(authorInput.trim());
      toast.success("Thêm tác giả mới thành công");
    } catch (error) {
      console.error("Error creating author:", error);
      toast.error(getErrorMessage(error));
    }
  };

  // Handle drag & drop for cover image
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleImageFileSelect(imageFile);
    } else {
      toast.error("Vui lòng chọn file ảnh (.jpg, .jpeg, .png, .webp)");
    }
  };

  const handleImageFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Vui lòng chọn file ảnh (.jpg, .jpeg, .png, .webp)");
      return;
    }
    
    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const handleModalChange = (field: string, value: unknown) => {
    setCurrentLibrary((prev) => ({ ...prev, [field]: value }));
  };

  const handleModalSave = async () => {
    try {
      const formData = new FormData();
      
      // Thêm file ảnh nếu có
      if (coverImageFile) {
        formData.append("file", coverImageFile);
      }

      // Thêm tất cả dữ liệu khác vào FormData cho cả create và edit mode
      formData.append("authors", JSON.stringify(selectedAuthors));
      formData.append("title", currentLibrary.title || "");
      formData.append("category", currentLibrary.category || "");
      formData.append("language", currentLibrary.language || "");
      formData.append("description", JSON.stringify(currentLibrary.description || { linkEmbed: "", content: "" }));
      formData.append("introduction", JSON.stringify(currentLibrary.introduction || { linkEmbed: "", content: "" }));
      formData.append("audioBook", JSON.stringify(currentLibrary.audioBook || { linkEmbed: "", content: "" }));
      formData.append("documentType", currentLibrary.documentType || "");
      formData.append("specialCode", currentLibrary.specialCode || "");
      formData.append("seriesName", currentLibrary.seriesName || "");
      formData.append("isNewBook", String(currentLibrary.isNewBook || false));
      formData.append("isFeaturedBook", String(currentLibrary.isFeaturedBook || false));
      formData.append("isAudioBook", String(currentLibrary.isAudioBook || false));

      if (mode === "create") {
        const response = await fetch(`${API_URL}/libraries`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Error creating library");
        }
      } else {
        // Edit mode - cũng sử dụng FormData để có thể gửi ảnh
        const response = await fetch(`${API_URL}/libraries/${currentLibrary._id}`, {
          method: "PUT",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Error updating library");
        }
      }

      onClose();
      onSuccess();
      toast.success("Lưu thành công!");
    } catch (error) {
      console.error("Error saving library:", error);
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-3xl max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tạo mới đầu sách" : "Chỉnh sửa đầu sách"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tên đầu sách <span className="text-red-500">*</span>
              </label>
              <Input
                value={currentLibrary.title || ""}
                onChange={(e) => handleModalChange("title", e.target.value)}
                placeholder="Nhập tên sách..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tác giả:</label>
              <div className="relative">
                <Input
                  value={authorInput}
                  onChange={(e) => handleAuthorInputChange(e.target.value)}
                  placeholder="Gõ để tìm tác giả..."
                  onFocus={() => authorInput && setShowAuthorSuggestions(true)}
                  onBlur={() => {
                    // Delay to allow click events on suggestions
                    setTimeout(() => setShowAuthorSuggestions(false), 150);
                  }}
                />
                {showAuthorSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredAuthors.length > 0 ? (
                      filteredAuthors.map((author) => (
                        <div
                          key={author._id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => addAuthor(author.name)}
                        >
                          {author.name}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500">
                        Không tìm thấy tác giả
                      </div>
                    )}
                    {authorInput.trim() && (
                      <div
                        className="px-4 py-2 border-t bg-blue-50 hover:bg-blue-100 cursor-pointer flex items-center gap-2 text-sm"
                        onClick={addNewAuthor}
                      >
                        <FiPlus size={14} />
                        Thêm tác giả mới: "{authorInput.trim()}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Selected Authors */}
              {selectedAuthors.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedAuthors.map((author) => (
                    <div 
                      key={author} 
                      className="flex items-center gap-1 px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs"
                    >
                      {author}
                      <button
                        type="button"
                        className="cursor-pointer hover:text-red-500 ml-0.5 p-0 border-0 bg-transparent"
                        onClick={() => removeAuthor(author)}
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
                        <div>
              <label className="block text-sm font-medium mb-2">Tùng thư:</label>
              <div className="w-full">
                <Combobox
                  options={allSeriesNames.map(sn => ({
                    value: sn.name,
                    label: sn.name
                  }))}
                  value={currentLibrary.seriesName}
                  onSelect={(value: string) => handleModalChange("seriesName", value)}
                  placeholder="Chọn tùng thư..."
                  searchPlaceholder="Tìm tùng thư..."
                  emptyText="Không tìm thấy tùng thư"
                  className="w-full min-w-0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ngôn ngữ:</label>
              <Input
                value={currentLibrary.language || ""}
                onChange={(e) => handleModalChange("language", e.target.value)}
                placeholder="Nhập ngôn ngữ..."
              />
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-4">
                        <div>
              <label className="block text-sm font-medium mb-2">Phân loại tài liệu:</label>
              <div className="w-full">
                <Combobox
                  options={allDocumentTypes.map(dt => ({
                    value: dt.name,
                    label: dt.name
                  }))}
                  value={currentLibrary.documentType}
                  onSelect={(value: string) => handleModalChange("documentType", value)}
                  placeholder="Chọn phân loại tài liệu..."
                  searchPlaceholder="Tìm phân loại tài liệu..."
                  emptyText="Không tìm thấy phân loại tài liệu"
                  className="w-full min-w-0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ảnh bìa:</label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-300 ${
                  isDragOver 
                    ? 'border-primary bg-primary/5 scale-105' 
                    : 'border-gray-300 hover:border-primary'
                }`}
                onClick={() => coverImageInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {coverImagePreview ? (
                  <div className="relative">
                    <img
                      src={coverImagePreview}
                      alt="Preview"
                      className="h-28 mx-auto object-contain"
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCoverImageFile(null);
                        setCoverImagePreview(null);
                      }}
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="mx-auto h-10 w-10 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                      </svg>
                    </div>
                    <div className="text-gray-500">
                      <p className="text-sm font-medium">Kéo thả hoặc chọn ảnh bìa từ máy tính</p>
                      <p className="text-xs mt-1">Định dạng hỗ trợ: .jpg, .jpeg, .png, .webp</p>
                    </div>
                    {isDragOver && (
                      <div className="text-primary font-medium animate-pulse">
                        Thả ảnh vào đây...
                      </div>
                    )}
                  </div>
                )}
                <input
                  ref={coverImageInputRef}
                  type="file"
                  accept="image/*,.webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageFileSelect(file);
                    }
                  }}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Đặc điểm sách:</label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="libraryIsNew"
                    checked={currentLibrary.isNewBook || false}
                    onCheckedChange={(checked) => handleModalChange("isNewBook", !!checked)}
                  />
                  <label htmlFor="libraryIsNew" className="text-sm cursor-pointer">Sách mới</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="libraryIsFeatured"
                    checked={currentLibrary.isFeaturedBook || false}
                    onCheckedChange={(checked) => handleModalChange("isFeaturedBook", !!checked)}
                  />
                  <label htmlFor="libraryIsFeatured" className="text-sm cursor-pointer">Sách nổi bật</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="libraryIsAudio"
                    checked={currentLibrary.isAudioBook || false}
                    onCheckedChange={(checked) => handleModalChange("isAudioBook", !!checked)}
                  />
                  <label htmlFor="libraryIsAudio" className="text-sm cursor-pointer">Sách nói</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleModalSave}>
            Lưu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
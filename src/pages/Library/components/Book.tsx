import { useState, useEffect, useRef } from "react";
import { API_URL, BASE_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { FiPlus, FiX } from "react-icons/fi";
import { toast } from "sonner";
import type { 
  DocumentType, 
  SeriesName, 
  // SpecialCode, 
  Author, 
  Library
} from "@/types/library";

// Utility function to handle errors
const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Lỗi không xác định";
};

export function BookComponent() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
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
  
  // Description modal states
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [descriptionActiveTab, setDescriptionActiveTab] = useState<'description' | 'introduction' | 'audiobook'>('description');
  const [currentDescriptionLibrary, setCurrentDescriptionLibrary] = useState<Library | null>(null);

  const [allAuthors, setAllAuthors] = useState<Author[]>([]);
  const [allDocumentTypes, setAllDocumentTypes] = useState<DocumentType[]>([]);
  // const [allSpecialCodes, setAllSpecialCodes] = useState<SpecialCode[]>([]);
  const [allSeriesNames, setAllSeriesNames] = useState<SeriesName[]>([]);
  
  // States for author input
  const [authorInput, setAuthorInput] = useState("");
  const [filteredAuthors, setFilteredAuthors] = useState<Author[]>([]);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);

  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fetchLibraries = async () => {
    try {
      const response = await fetch(`${API_URL}/libraries`);
      if (!response.ok) throw new Error("Failed to fetch libraries");
      const result = await response.json();
      setLibraries(result);
    } catch (error) {
      console.error("Error fetching libraries:", error);
      toast.error("Lỗi khi tải danh sách đầu sách");
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [authorsRes, docTypesRes, specialCodesRes, seriesRes] = await Promise.all([
        fetch(`${API_URL}/libraries/authors`),
        fetch(`${API_URL}/libraries/document-types`),
        fetch(`${API_URL}/libraries/special-codes`),
        fetch(`${API_URL}/libraries/series-names`),
      ]);

      const [authors, docTypes, , series] = await Promise.all([
        authorsRes.json(),
        docTypesRes.json(),
        specialCodesRes.json(),
        seriesRes.json(),
      ]);

      setAllAuthors(authors);
      setAllDocumentTypes(docTypes);
      // setAllSpecialCodes(specialCodes);
      setAllSeriesNames(series);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  useEffect(() => {
    fetchLibraries();
    fetchDropdownData();
  }, []);

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
    console.log("Removing author:", authorName);
    console.log("Current selectedAuthors:", selectedAuthors);
    const newAuthors = selectedAuthors.filter(name => name !== authorName);
    console.log("New selectedAuthors:", newAuthors);
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
      
      // Refresh authors list
      await fetchDropdownData();
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

  const openCreateModal = () => {
    setModalMode("create");
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
    setIsModalOpen(true);
  };

  const openEditModal = (library: Library) => {
    setModalMode("edit");
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
    setIsModalOpen(true);
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

      if (modalMode === "create") {
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

      setIsModalOpen(false);
      fetchLibraries();
      toast.success("Lưu thành công!");
    } catch (error) {
      console.error("Error saving library:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/libraries/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error deleting library");
      }

      fetchLibraries();
      toast.success("Xóa thành công!");
    } catch (error) {
      console.error("Error deleting library:", error);
      toast.error(getErrorMessage(error));
    }
  };

  // Open description modal
  const openDescriptionModal = (library: Library) => {
    setCurrentDescriptionLibrary(library);
    setDescriptionActiveTab('description');
    setIsDescriptionModalOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Đầu sách</CardTitle>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <FiPlus size={16} />
            Thêm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã định danh</TableHead>
              <TableHead>Tên sách</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead>Thể loại</TableHead>
              <TableHead>Ngôn ngữ</TableHead>
              <TableHead>Đặc điểm</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {libraries.map((lib) => (
              <TableRow key={lib._id}>
                <TableCell>{lib.libraryCode}</TableCell>
                <TableCell className="font-medium">{lib.title}</TableCell>
                <TableCell>{lib.authors?.join(", ")}</TableCell>
                <TableCell>{lib.category}</TableCell>
                <TableCell>{lib.language}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {lib.isNewBook && <Badge variant="outline" className="text-xs">Sách mới</Badge>}
                    {lib.isFeaturedBook && <Badge variant="outline" className="text-xs">Nổi bật</Badge>}
                    {lib.isAudioBook && <Badge variant="outline" className="text-xs">Sách nói</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => openDescriptionModal(lib)}
                      className="flex items-center gap-1"
                    >
                      Mô tả
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openEditModal(lib)}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(lib._id)}
                    >
                      Xóa
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="min-w-3xl max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {modalMode === "create" ? "Tạo mới đầu sách" : "Chỉnh sửa đầu sách"}
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
                            onClick={() => {
                              console.log("Click remove button for:", author);
                              removeAuthor(author);
                            }}
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
                  <Select
                    value={currentLibrary.seriesName || ""}
                    onValueChange={(value) => handleModalChange("seriesName", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tùng thư..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allSeriesNames.map((sn) => (
                        <SelectItem key={sn._id} value={sn.name}>
                          {sn.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select
                    value={currentLibrary.documentType || ""}
                    onValueChange={(value) => handleModalChange("documentType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phân loại tài liệu..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allDocumentTypes.map((dt) => (
                        <SelectItem key={dt._id} value={dt.name}>
                          {dt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleModalSave}>
                Lưu
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Description Modal */}
        <Dialog open={isDescriptionModalOpen} onOpenChange={setIsDescriptionModalOpen}>
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
                onClick={() => setIsDescriptionModalOpen(false)}
              >
                Đóng
              </Button>
              <Button 
                onClick={async () => {
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

                    setIsDescriptionModalOpen(false);
                    fetchLibraries();
                    toast.success("Cập nhật mô tả thành công!");
                  } catch (error) {
                    console.error("Error updating description:", error);
                    toast.error(getErrorMessage(error));
                  }
                }}
              >
                Lưu thay đổi
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 
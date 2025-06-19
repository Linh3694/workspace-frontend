import { useState, useEffect, useRef } from "react";
import { API_URL, BASE_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { FiPlus, FiX } from "react-icons/fi";
import { toast } from "sonner";
import type { 
  DocumentType, 
  SeriesName, 
  SpecialCode, 
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
    description: "",
    documentType: "",
    specialCode: "",
    seriesName: "",
  });

  const [allAuthors, setAllAuthors] = useState<Author[]>([]);
  const [allDocumentTypes, setAllDocumentTypes] = useState<DocumentType[]>([]);
  const [allSpecialCodes, setAllSpecialCodes] = useState<SpecialCode[]>([]);
  const [allSeriesNames, setAllSeriesNames] = useState<SeriesName[]>([]);
  
  // States for author input
  const [authorInput, setAuthorInput] = useState("");
  const [filteredAuthors, setFilteredAuthors] = useState<Author[]>([]);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);

  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

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

      const [authors, docTypes, specialCodes, series] = await Promise.all([
        authorsRes.json(),
        docTypesRes.json(),
        specialCodesRes.json(),
        seriesRes.json(),
      ]);

      setAllAuthors(authors);
      setAllDocumentTypes(docTypes);
      setAllSpecialCodes(specialCodes);
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

  const openCreateModal = () => {
    setModalMode("create");
    setCurrentLibrary({
      authors: [],
      title: "",
      coverImage: "",
      category: "",
      language: "",
      description: "",
      documentType: "",
      specialCode: "",
      seriesName: "",
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
      if (coverImageFile) {
        formData.append("file", coverImageFile);
      }

      if (modalMode === "create") {
        formData.append("authors", selectedAuthors.join(","));
        formData.append("title", currentLibrary.title || "");
        formData.append("category", currentLibrary.category || "");
        formData.append("language", currentLibrary.language || "");
        formData.append("documentType", currentLibrary.documentType || "");
        formData.append("specialCode", currentLibrary.specialCode || "");
        formData.append("seriesName", currentLibrary.seriesName || "");

        const response = await fetch(`${API_URL}/libraries`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Error creating library");
        }
      } else {
        // Edit mode
        const payload = {
          ...currentLibrary,
          authors: selectedAuthors,
        };

        const response = await fetch(`${API_URL}/libraries/${currentLibrary._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(lib)}
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
                    Tên sách <span className="text-red-500">*</span>
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
                  <label className="block text-sm font-medium mb-2">Thể loại:</label>
                  <Input
                    value={currentLibrary.category || ""}
                    onChange={(e) => handleModalChange("category", e.target.value)}
                    placeholder="Nhập thể loại..."
                  />
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
                  <label className="block text-sm font-medium mb-2">Quy ước sách:</label>
                  <Select
                    value={currentLibrary.specialCode || ""}
                    onValueChange={(value) => handleModalChange("specialCode", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn quy ước sách..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allSpecialCodes.map((sc) => (
                        <SelectItem key={sc._id} value={sc.name}>
                          {sc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <label className="block text-sm font-medium mb-2">Ảnh bìa:</label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary"
                    onClick={() => coverImageInputRef.current?.click()}
                  >
                    {coverImagePreview ? (
                      <img
                        src={coverImagePreview}
                        alt="Preview"
                        className="h-32 mx-auto object-contain"
                      />
                    ) : (
                      <div className="text-gray-500">
                        <p>Kéo thả hoặc chọn ảnh bìa từ máy tính</p>
                        <p className="text-xs mt-1">Định dạng hỗ trợ: .jpg, .jpeg, .png</p>
                      </div>
                    )}
                    <input
                      ref={coverImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setCoverImageFile(file);
                        setCoverImagePreview(URL.createObjectURL(file));
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleModalSave}>
                Lưu
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 
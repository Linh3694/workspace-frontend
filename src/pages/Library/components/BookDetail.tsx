import { useState, useEffect } from "react";
import { API_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FiPlus } from "react-icons/fi";
import { toast } from "sonner";
import type { Library, Book, SpecialCode } from "@/types/library";

// Utility function to handle errors
const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Lỗi không xác định";
};

export function BookDetailComponent() {
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentBook, setCurrentBook] = useState<Partial<Book>>({
    isbn: "",
    documentIdentifier: "",
    bookTitle: "",
    classificationSign: "",
    publisherPlaceName: "",
    publisherName: "",
    publishYear: null,
    pages: null,
    attachments: [],
    documentType: "",
    coverPrice: null,
    language: "",
    catalogingAgency: "WIS",
    storageLocation: "",
    seriesName: "",
    specialCode: "",
    specialCodeId: "",
  });



  const [libraries, setLibraries] = useState<Library[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);
  const [librarySearchTerm, setLibrarySearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Library[]>([]);
  const [specialCodes, setSpecialCodes] = useState<SpecialCode[]>([]);
  


  const fetchAllBooks = async () => {
    try {
      const response = await fetch(`${API_URL}/libraries/books`);
      if (!response.ok) throw new Error("Failed to fetch books");
      const result = await response.json();
      setAllBooks(result);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast.error("Lỗi khi tải danh sách sách");
    }
  };

  const fetchLibraries = async () => {
    try {
      const response = await fetch(`${API_URL}/libraries`);
      if (!response.ok) throw new Error("Failed to fetch libraries");
      const result = await response.json();
      setLibraries(result);
    } catch (error) {
      console.error("Error fetching libraries:", error);
    }
  };

  const fetchSpecialCodes = async () => {
    try {
      const response = await fetch(`${API_URL}/libraries/special-codes`);
      if (!response.ok) throw new Error("Failed to fetch special codes");
      const result = await response.json();
      setSpecialCodes(result);
    } catch (error) {
      console.error("Error fetching special codes:", error);
    }
  };

  useEffect(() => {
    fetchAllBooks();
    fetchLibraries();
    fetchSpecialCodes();
  }, []);

  const handleLibrarySearch = (term: string) => {
    setLibrarySearchTerm(term);
    if (!term.trim()) {
      setSearchResults([]);
      setSelectedLibrary(null);
      return;
    }
    const lower = term.toLowerCase();
    const matched = libraries
      .filter((lib) => lib.title.toLowerCase().includes(lower))
      .slice(0, 5);
    setSearchResults(matched);
  };

  const handleSelectLibrary = (lib: Library) => {
    setSelectedLibrary(lib);
    setLibrarySearchTerm(lib.title);
    setSearchResults([]);
    
    // Cập nhật tên sách từ đầu sách đã chọn
    handleChange("bookTitle", lib.title);
  };



  const openCreateModal = () => {
    setModalMode("create");
    setCurrentBook({
      isbn: "",
      documentIdentifier: "",
      bookTitle: "",
      classificationSign: "",
      publisherPlaceName: "",
      publisherName: "",
      publishYear: null,
      pages: null,
      attachments: [],
      documentType: "",
      coverPrice: null,
      language: "",
      catalogingAgency: "WIS",
      storageLocation: "",
      seriesName: "",
      specialCode: "",
      specialCodeId: "",
    });

    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setModalMode("edit");
    
    // Tìm specialCodeId dựa trên specialCode của book
    const matchingSpecialCode = specialCodes.find(sc => sc.name === book.specialCode);
    
    setCurrentBook({
      ...book,
      specialCodeId: matchingSpecialCode?._id || ""
    });

    setIsModalOpen(true);
  };

  const handleChange = (field: string, value: unknown) => {
    setCurrentBook((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveModal = async () => {
    if (!selectedLibrary && modalMode === "create") {
      toast.error("Vui lòng chọn Library trước!");
      return;
    }

    try {
      const payload = {
        ...currentBook,
        publishYear: currentBook.publishYear ? Number(currentBook.publishYear) : null,
        pages: currentBook.pages ? Number(currentBook.pages) : null,
        coverPrice: currentBook.coverPrice ? Number(currentBook.coverPrice) : null,
      };

      if (modalMode === "create") {


        const response = await fetch(
          `${API_URL}/libraries/${selectedLibrary!._id}/books`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Error adding new book");
        }
      } else {
        // Edit mode - update existing book
        if (!currentBook.generatedCode) {
          toast.error("Không tìm thấy mã sách để cập nhật");
          return;
        }



        const response = await fetch(
          `${API_URL}/libraries/books/${encodeURIComponent(currentBook.generatedCode)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Error updating book");
        }
      }

      setIsModalOpen(false);
      fetchAllBooks();
      toast.success(modalMode === "create" ? "Thêm sách thành công!" : "Cập nhật sách thành công!");
    } catch (error) {
      console.error("Error saving book:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (book: Book) => {
    if (!book.generatedCode) {
      toast.error("Không tìm thấy mã sách để xóa");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/libraries/books/${encodeURIComponent(book.generatedCode)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi xóa sách");
      }

      fetchAllBooks();
      toast.success("Xóa sách thành công!");
    } catch (error) {
      console.error("Error deleting book:", error);
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sách</CardTitle>
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
              <TableHead>Mã sách</TableHead>
              <TableHead>ISBN</TableHead>
              <TableHead>Tên sách</TableHead>
              <TableHead>Năm XB</TableHead>

              <TableHead>Tình trạng</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allBooks.map((book) => (
              <TableRow key={book.generatedCode}>
                <TableCell className="font-medium">{book.generatedCode}</TableCell>
                <TableCell>{book.isbn}</TableCell>
                <TableCell>{book.bookTitle}</TableCell>
                <TableCell>{book.publishYear}</TableCell>

                <TableCell>
                  <Badge variant={book.status === "available" ? "default" : "secondary"}>
                    {book.status || "Có sẵn"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => openEditModal(book)}
                    >
                    Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(book)}
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
          <DialogContent className="min-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {modalMode === "create" ? "Thêm sách mới" : "Chỉnh sửa sách"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {modalMode === "create" && (
                <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Chọn Đầu Sách <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Nhập đầu sách..."
                      value={librarySearchTerm}
                      onChange={(e) => handleLibrarySearch(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                      <div className="border border-gray-200 mt-1 rounded bg-white shadow-md max-h-32 overflow-y-auto">
                        {searchResults.map((lib) => (
                          <div
                            key={lib._id}
                            className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleSelectLibrary(lib)}
                          >
                            {lib.title}
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedLibrary && (
                      <div className="mt-2 text-sm text-gray-600">
                        Đã chọn: <b>{selectedLibrary.title}</b>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Mã đặc biệt <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={currentBook.specialCodeId || ""}
                      onValueChange={(value) => handleChange("specialCodeId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn mã đặc biệt..." />
                      </SelectTrigger>
                      <SelectContent>
                        {specialCodes.map((code) => (
                          <SelectItem key={code._id} value={code._id}>
                            {code.name} ({code.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <Label className="text-base font-medium mb-2">Thông tin sách</Label>
              <div className="flex gap-4 border-b border-gray-200 pb-4">
                <div className="grid gap-4 flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        ISBN <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="Nhập mã ISBN"
                        value={currentBook.isbn || ""}
                        onChange={(e) => handleChange("isbn", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Định danh tài liệu <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="Nhập định danh tài liệu"
                        value={currentBook.documentIdentifier || ""}
                        onChange={(e) => handleChange("documentIdentifier", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Tên sách <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="Nhập tên sách"
                        value={currentBook.bookTitle || ""}
                        onChange={(e) => handleChange("bookTitle", e.target.value)}
                      />
                    </div>
                    {selectedLibrary && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Tác giả
                        </label>
                        <Input
                          placeholder="Tác giả sẽ hiển thị khi chọn đầu sách"
                          value={selectedLibrary?.authors ? selectedLibrary.authors.join(", ") : ""}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                    )}
                  </div>
                  {/* <div>
                    <label className="block text-sm font-medium mb-2">
                      Ký hiệu phân loại <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Nhập ký hiệu phân loại"
                      value={currentBook.classificationSign || ""}
                      onChange={(e) => handleChange("classificationSign", e.target.value)}
                    />
                  </div> */}
                </div>

              </div>
              <Label className="text-base font-medium mb-2">Thông tin xuất bản</Label>
              <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Năm Xuất Bản
                  </label>
                  <Input
                    type="number"
                    placeholder="Nhập năm xuất bản"
                    value={currentBook.publishYear || ""}
                    onChange={(e) => handleChange("publishYear", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nhà Xuất Bản
                  </label>
                  <Input
                    placeholder="Nhập tên nhà xuất bản"
                    value={currentBook.publisherName || ""}
                    onChange={(e) => handleChange("publisherName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nơi Xuất Bản
                  </label>
                  <Input
                    placeholder="Nhập nơi xuất bản"
                    value={currentBook.publisherPlaceName || ""}
                    onChange={(e) => handleChange("publisherPlaceName", e.target.value)}
                  />
                </div>
              </div>
              <Label className="text-base font-medium mb-2">Mô tả</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Số trang
                  </label>
                  <Input
                    type="number"
                    placeholder="Nhập số trang"
                    value={currentBook.pages || ""}
                    onChange={(e) => handleChange("pages", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Giá bìa
                  </label>
                  <Input
                    type="number"
                    placeholder="Nhập giá bìa"
                    value={currentBook.coverPrice || ""}
                    onChange={(e) => handleChange("coverPrice", e.target.value)}
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium mb-2">
                    Cơ quan biên mục
                  </label>
                  <Input
                    placeholder="Mặc định: WIS"
                    value={currentBook.catalogingAgency || ""}
                    onChange={(e) => handleChange("catalogingAgency", e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSaveModal}>
                {modalMode === "create" ? "Thêm mới" : "Cập nhật"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>


      </CardContent>
    </Card>
  );
} 
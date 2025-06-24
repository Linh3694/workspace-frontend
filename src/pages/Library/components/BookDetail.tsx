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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { FiPlus, FiSearch } from "react-icons/fi";
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
  const [copyCount, setCopyCount] = useState<number | "">(1);
  
  // States for duplicate functionality
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState<number>(1);
  const [bookToDuplicate, setBookToDuplicate] = useState<Book | null>(null);
  
  // States for delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  
  // States for pagination and search
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  

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
    setCopyCount("");
    setSelectedLibrary(null);
    setLibrarySearchTerm("");
    setSearchResults([]);

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

      let finalCopyCount = 1;
      
      if (modalMode === "create") {
        // Kiểm tra và thêm số lượng sách vào payload
        finalCopyCount = copyCount || 1;
        const createPayload = {
          ...payload,
          copyCount: finalCopyCount
        };

        const response = await fetch(
          `${API_URL}/libraries/${selectedLibrary!._id}/books`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(createPayload),
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
      toast.success(
        modalMode === "create" 
          ? `Thêm ${finalCopyCount} quyển sách thành công!` 
          : "Cập nhật sách thành công!"
      );
    } catch (error) {
      console.error("Error saving book:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const openDeleteModal = (book: Book) => {
    // Kiểm tra trạng thái sách trước khi cho phép xóa
    const allowedStatuses = ["Sẵn sàng", ""];
    const bookStatus = book.status || "Sẵn sàng"; // Default là Sẵn sàng nếu không có status
    
    if (!allowedStatuses.includes(bookStatus)) {
      toast.error(`Không thể xóa sách đang ở trạng thái "${bookStatus}". Chỉ có thể xóa sách ở trạng thái "Sẵn sàng".`);
      return;
    }
    
    setBookToDelete(book);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!bookToDelete?.generatedCode) {
      toast.error("Không tìm thấy mã sách để xóa");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/libraries/books/${encodeURIComponent(bookToDelete.generatedCode)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi xóa sách");
      }

      setIsDeleteModalOpen(false);
      fetchAllBooks();
      toast.success("Xóa sách thành công!");
    } catch (error) {
      console.error("Error deleting book:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const openDuplicateModal = (book: Book) => {
    setBookToDuplicate(book);
    setDuplicateCount(1);
    setIsDuplicateModalOpen(true);
  };

  const handleDuplicate = async () => {
    if (!bookToDuplicate?.generatedCode) {
      toast.error("Không tìm thấy thông tin sách để nhân bản");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/libraries/books/${encodeURIComponent(bookToDuplicate.generatedCode)}/duplicate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ copyCount: duplicateCount }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi nhân bản sách");
      }

      setIsDuplicateModalOpen(false);
      fetchAllBooks();
      toast.success(`Nhân bản thành công ${duplicateCount} quyển sách từ ${bookToDuplicate.generatedCode}!`);
    } catch (error) {
      console.error("Error duplicating book:", error);
      toast.error(getErrorMessage(error));
    }
  };

  // Filter và pagination logic
  const filteredBooks = allBooks.filter(book => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      book.generatedCode?.toLowerCase().includes(searchLower) ||
      book.isbn?.toLowerCase().includes(searchLower) ||
      book.bookTitle?.toLowerCase().includes(searchLower) ||
      book.publishYear?.toString().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

  // Reset về trang 1 khi search thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sách</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Tìm kiếm sách..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <Button 
              variant="destructive"
              onClick={openCreateModal} 
              className="flex items-center gap-2"
            >
              <FiPlus size={16} />
              Thêm mới
            </Button>
          </div>
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
            {paginatedBooks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {searchTerm ? "Không tìm thấy sách nào phù hợp" : "Chưa có sách nào"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedBooks.map((book) => (
                <TableRow key={book.generatedCode}>
                  <TableCell className="font-medium">{book.generatedCode}</TableCell>
                  <TableCell>{book.isbn}</TableCell>
                  <TableCell>{book.bookTitle}</TableCell>
                  <TableCell>{book.publishYear}</TableCell>

                  <TableCell>
                    <Badge variant={book.status === "Sẵn sàng" ? "default" : "secondary"}>
                      {book.status || "Sẵn sàng"}
                    </Badge>
                  </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDuplicateModal(book)}
                    >
                    Nhân bản
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openEditModal(book)}
                    >
                    Sửa
                    </Button>
                    {(() => {
                      const allowedStatuses = ["Sẵn sàng", ""];
                      const bookStatus = book.status || "Sẵn sàng";
                      const canDelete = allowedStatuses.includes(bookStatus);
                      
                      return (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={!canDelete}
                          onClick={() => openDeleteModal(book)}
                          title={!canDelete ? `Không thể xóa sách đang ở trạng thái "${bookStatus}"` : "Xóa sách"}
                        >
                        Xóa
                        </Button>
                      );
                    })()}
                  </div>
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  // Chỉ hiển thị trang hiện tại và 2 trang trước/sau
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                  ) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(pageNumber);
                          }}
                          isActive={pageNumber === currentPage}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

       

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
                <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-4">
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
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn mã đặc biệt...">
                          {currentBook.specialCodeId && specialCodes.find(sc => sc._id === currentBook.specialCodeId) && (
                            <span className="truncate">
                              {specialCodes.find(sc => sc._id === currentBook.specialCodeId)?.name}
                            </span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-w-xs">
                        {specialCodes.map((code) => (
                          <SelectItem key={code._id} value={code._id} className="text-sm">
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{code.name}</span>
                              <span className="text-xs text-gray-500 ml-2">{code.code}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Số lượng sách <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="Nhập số lượng sách cần tạo"
                      value={copyCount}
                      onChange={(e) => setCopyCount(e.target.value === "" ? "" : Number(e.target.value))}
                    />
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

        {/* Duplicate Modal */}
        <Dialog open={isDuplicateModalOpen} onOpenChange={setIsDuplicateModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nhân bản sách</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Nhân bản từ sách: <span className="font-medium">{bookToDuplicate?.generatedCode}</span>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Tên sách: <span className="font-medium">{bookToDuplicate?.bookTitle}</span>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Số lượng sách cần nhân bản <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Nhập số lượng sách cần nhân bản"
                  value={duplicateCount}
                  onChange={(e) => setDuplicateCount(Number(e.target.value) || 1)}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Sẽ tạo {duplicateCount} bản sách mới với mã sách tăng dần
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsDuplicateModalOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleDuplicate}>
                Nhân bản
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Xác nhận xóa sách</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-sm text-gray-600">
                Bạn có chắc chắn muốn xóa sách này không?
              </p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm">
                  <span className="font-medium">Mã sách:</span> {bookToDelete?.generatedCode}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Tên sách:</span> {bookToDelete?.bookTitle}
                </p>
                <p className="text-sm">
                  <span className="font-medium">ISBN:</span> {bookToDelete?.isbn}
                </p>
              </div>
              <p className="text-sm text-red-600">
                ⚠️ Hành động này không thể hoàn tác!
              </p>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                Hủy
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Xóa sách
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
} 
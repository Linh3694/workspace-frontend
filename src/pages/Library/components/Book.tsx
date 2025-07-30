import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";

import { FiPlus, FiImage, FiSearch } from "react-icons/fi";
import { toast } from "sonner";
import type { 
  DocumentType, 
  SeriesName, 
  Author, 
  Library
} from "@/types/library";

import {
  CreateEditBookDialog,
  DescriptionDialog,
  BulkUploadDialog,
  BulkImageUploadDialog,
  DeleteConfirmationDialog
} from "./dialog";

// Utility function to handle errors
const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Lỗi không xác định";
};

export function BookComponent() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  
  // Dialog states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentLibrary, setCurrentLibrary] = useState<Library | null>(null);
  
  // Description modal states
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [currentDescriptionLibrary, setCurrentDescriptionLibrary] = useState<Library | null>(null);

  const [allAuthors, setAllAuthors] = useState<Author[]>([]);
  const [allDocumentTypes, setAllDocumentTypes] = useState<DocumentType[]>([]);
  const [allSeriesNames, setAllSeriesNames] = useState<SeriesName[]>([]);
  
  // Bulk upload states
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkImageModalOpen, setIsBulkImageModalOpen] = useState(false);

  // Delete confirmation states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLibraryInfo, setDeleteLibraryInfo] = useState<{
    libraryId: string;
    libraryTitle: string;
    bookCount: number;
    books: Array<{
      generatedCode: string;
      title: string;
      status: string;
    }>;
  } | null>(null);
  const [isCheckingDelete, setIsCheckingDelete] = useState(false);

  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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
      setAllSeriesNames(series);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  // Sử dụng useCallback để tránh re-render vô hạn
  const handleRefresh = useCallback(() => {
    fetchLibraries();
  }, []);

  useEffect(() => {
    fetchLibraries();
    fetchDropdownData();
  }, []);

  // Filter libraries based on search term
  const filteredLibraries = libraries.filter(lib => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lib.title?.toLowerCase().includes(searchLower) ||
      lib.libraryCode?.toLowerCase().includes(searchLower) ||
      lib.authors?.some(author => author.toLowerCase().includes(searchLower)) ||
      lib.category?.toLowerCase().includes(searchLower) ||
      lib.language?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredLibraries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLibraries = filteredLibraries.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let start = Math.max(1, currentPage - halfVisible);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    if (end === totalPages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const openCreateModal = () => {
    setModalMode("create");
    setCurrentLibrary(null);
    setIsModalOpen(true);
  };

  const openEditModal = (library: Library) => {
    setModalMode("edit");
    setCurrentLibrary(library);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsCheckingDelete(true);
      
      // Kiểm tra số lượng BookDetail trước khi xóa
      const response = await fetch(`${API_URL}/libraries/${id}/book-count`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lỗi khi kiểm tra thông tin sách");
      }
      
      const bookInfo = await response.json();
      setDeleteLibraryInfo(bookInfo);
      setIsDeleteModalOpen(true);
      
    } catch (error) {
      console.error("Error checking book count:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsCheckingDelete(false);
    }
  };

  // Open description modal
  const openDescriptionModal = (library: Library) => {
    setCurrentDescriptionLibrary(library);
    setIsDescriptionModalOpen(true);
  };

  // Bulk upload functions
  const openBulkModal = () => {
    setIsBulkModalOpen(true);
  };

  // Bulk image upload functions
  const openBulkImageModal = () => {
    setIsBulkImageModalOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Đầu sách</CardTitle>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Tìm kiếm theo tên sách, mã, tác giả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <Button onClick={openBulkImageModal}  className="flex items-center gap-2">
              <FiImage size={16} />
              Cập nhật ảnh
            </Button>
            <Button onClick={openBulkModal}  className="flex items-center gap-2">
              <FiPlus size={16} />
              Thêm nhiều
            </Button>
            <Button 
            variant="destructive"
            onClick={openCreateModal} className="flex items-center gap-2">
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
            {paginatedLibraries.map((lib) => (
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
                      disabled={isCheckingDelete}
                    >
                      {isCheckingDelete ? "Đang kiểm tra..." : "Xóa"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredLibraries.length)} của {filteredLibraries.length} kết quả
            </p>
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
                
                {currentPage > 3 && (
                  <>
                    <PaginationItem>
                      <PaginationLink 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(1);
                        }}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                    {currentPage > 4 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                  </>
                )}

                {getPageNumbers().map((pageNumber) => (
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
                ))}

                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(totalPages);
                        }}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

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

        {/* No results message */}
        {filteredLibraries.length === 0 && searchTerm && (
          <div className="text-center py-8 text-gray-500">
            Không tìm thấy kết quả nào cho "{searchTerm}"
          </div>
        )}

        {/* Create/Edit Book Dialog */}
        <CreateEditBookDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          library={currentLibrary}
          allAuthors={allAuthors}
          allDocumentTypes={allDocumentTypes}
          allSeriesNames={allSeriesNames}
          onSuccess={handleRefresh}
        />

        {/* Description Dialog */}
        <DescriptionDialog
          isOpen={isDescriptionModalOpen}
          onClose={() => setIsDescriptionModalOpen(false)}
          library={currentDescriptionLibrary}
          onSuccess={handleRefresh}
        />

        {/* Bulk Upload Dialog */}
        <BulkUploadDialog
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={handleRefresh}
        />

        {/* Bulk Image Upload Dialog */}
        <BulkImageUploadDialog
          isOpen={isBulkImageModalOpen}
          onClose={() => setIsBulkImageModalOpen(false)}
          libraries={libraries}
          onSuccess={handleRefresh}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteLibraryInfo(null);
          }}
          deleteLibraryInfo={deleteLibraryInfo}
          onSuccess={handleRefresh}
        />
      </CardContent>
    </Card>
  );
} 
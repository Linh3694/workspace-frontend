import { useEffect, useState, useRef } from "react";
import { API_URL, BASE_URL, API_ENDPOINTS } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FiTrash2, FiChevronRight, FiShoppingCart, FiUser, FiBook } from "react-icons/fi";
import { toast } from "sonner";
import type {
  LibraryWithBooks,
  BookItem,
  CartItem,
  StudentInfo,
  StudentSuggestion,
  BorrowPayload
} from "@/types/library";

// Utility function to handle errors
const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Lỗi không xác định";
};

function LibraryManagement() {
  // State for libraries and books
  const [libraries, setLibraries] = useState<LibraryWithBooks[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [expandedBooks, setExpandedBooks] = useState<Record<string, boolean>>({});

  // State for borrow modal
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    studentId: "",
    studentCode: "",
    name: "",
    email: "",
    className: "",
    photoUrl: "",
  });

  // State for student autocomplete
  const [studentSuggestions, setStudentSuggestions] = useState<StudentSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch libraries with books
  useEffect(() => {
    const fetchLibraries = async () => {
      try {
        const response = await fetch(`${API_URL}/libraries/full-libraries`);
        if (!response.ok) throw new Error("Failed to fetch libraries");
        const data = await response.json();
        if (Array.isArray(data)) {
          setLibraries(data);
        }
      } catch (error) {
        console.error("Error fetching libraries:", error);
        toast.error("Lỗi khi tải danh sách thư viện");
      }
    };

    fetchLibraries();
  }, []);

  // Filter libraries by search term
  const filteredLibraries = libraries.filter((lib) =>
    lib.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle expand/collapse books list
  const toggleExpand = (libraryId: string) => {
    setExpandedBooks((prev) => ({
      ...prev,
      [libraryId]: !prev[libraryId],
    }));
  };

  // Add book to cart
  const handleSelectBook = (library: LibraryWithBooks, book: BookItem) => {
    const alreadyInCart = cart.some(
      (item) => item.bookCode === book.generatedCode
    );
    if (alreadyInCart) {
      toast.error("Sách này đã có trong giỏ rồi!");
      return;
    }
    const newItem: CartItem = {
      libraryId: library._id,
      libraryTitle: library.title,
      bookCode: book.generatedCode || "NoCode",
      bookStatus: book.status,
    };
    setCart([...cart, newItem]);
    toast.success("Đã thêm sách vào giỏ");
  };

  // Remove book from cart
  const handleRemoveBook = (idx: number) => {
    const newCart = [...cart];
    newCart.splice(idx, 1);
    setCart(newCart);
    toast.success("Đã xóa sách khỏi giỏ");
  };

  // Clear all cart
  const handleClearAll = () => {
    setCart([]);
    toast.success("Đã xóa tất cả sách trong giỏ");
  };

  // Open borrow modal
  const handleBorrow = () => {
    if (cart.length === 0) {
      toast.error("Giỏ sách trống");
      return;
    }
    setShowBorrowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowBorrowModal(false);
    setStudentSuggestions([]);
    setShowSuggestions(false);
    setSearchQuery("");
    setStudentInfo({
      studentId: "",
      studentCode: "",
      name: "",
      email: "",
      className: "",
      photoUrl: "",
    });
  };

  // Search student suggestions
  const handleSearchStudent = async (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setStudentSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await fetch(
        `${API_ENDPOINTS.STUDENTS_SEARCH}?q=${encodeURIComponent(value)}`
      );
      if (!response.ok) throw new Error("Failed to search students");
      const data = await response.json();
      if (Array.isArray(data)) {
                const studentsWithPhotos = await Promise.all(
          data.map(async (student: StudentSuggestion) => {
            let photoUrl = student.photoUrl;
            
            // Nếu chưa có ảnh hoặc ảnh rỗng, thử lấy từ API
            if (!photoUrl || photoUrl.trim() === "") {
              // Thử lấy từ Photo model trước
              try {
                const photoApiUrl = `${API_ENDPOINTS.STUDENTS}/${student._id}/photo/current`;
                const photoResponse = await fetch(photoApiUrl);
                
                if (photoResponse.ok) {
                  const photoData = await photoResponse.json();
                  photoUrl = photoData.photoUrl;
                }
              } catch {
                // Ignore photo API errors
              }
              
              // Fallback: nếu vẫn chưa có ảnh, thử Student model
              if (!photoUrl) {
                try {
                  const studentApiUrl = `${API_ENDPOINTS.STUDENTS}/${student._id}`;
                  const studentResponse = await fetch(studentApiUrl);
                  
                  if (studentResponse.ok) {
                    const studentData = await studentResponse.json();
                    photoUrl = studentData.avatarUrl;
                  }
                } catch {
                  // Ignore student API errors
                }
              }
            }
            
            return {
              ...student,
              photoUrl: photoUrl || ""
            };
          })
        );
        
        setStudentSuggestions(studentsWithPhotos);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error fetching student suggestions:", error);
      toast.error("Lỗi khi tìm kiếm học sinh");
    }
  };

  // Select student from suggestions
  const handleSelectStudentSuggestion = async (student: StudentSuggestion) => {
    // Set thông tin cơ bản trước
    setStudentInfo({
      studentId: student._id,
      studentCode: student.studentId,
      name: student.fullName,
      email: student.email,
      className: student.className,
      photoUrl: student.photoUrl || "",
    });
    
    setStudentSuggestions([]);
    setShowSuggestions(false);
    setSearchQuery(student.studentId);
    
    // Lấy ảnh học sinh từ API nếu chưa có hoặc ảnh rỗng
    if (!student.photoUrl || student.photoUrl.trim() === "") {
      try {
        let photoUrl = null;
        
        // Thử lấy ảnh từ Photo model trước
        try {
          const photoApiUrl = `${API_ENDPOINTS.STUDENTS}/${student._id}/photo/current`;
          const photoResponse = await fetch(photoApiUrl);
          
          if (photoResponse.ok) {
            const photoData = await photoResponse.json();
            photoUrl = photoData.photoUrl;
          }
        } catch {
          // Ignore photo API errors
        }

        // Fallback: nếu không có ảnh từ Photo model, thử Student model
        if (!photoUrl) {
          try {
            const studentApiUrl = `${API_ENDPOINTS.STUDENTS}/${student._id}`;
            const studentResponse = await fetch(studentApiUrl);
            
            if (studentResponse.ok) {
              const studentData = await studentResponse.json();
              photoUrl = studentData.avatarUrl;
            }
          } catch {
            // Ignore student API errors
          }
        }
        
        // Cập nhật ảnh nếu tìm thấy
        if (photoUrl && photoUrl.trim() !== "") {
          setStudentInfo(prev => ({
            ...prev,
            photoUrl: photoUrl
          }));
        }
        
      } catch {
        // Ignore errors silently
      }
    }
  };

  // Confirm borrow
  const handleConfirmBorrow = async () => {
    if (!studentInfo.studentId.trim()) {
      toast.error("Vui lòng chọn học sinh trước khi mượn sách!");
      return;
    }

    const payload: BorrowPayload = {
      studentId: studentInfo.studentId,
      borrowedBooks: cart.map((item) => ({
        libraryId: item.libraryId,
        bookCode: item.bookCode,
      })),
    };

    try {
      const response = await fetch(`${API_URL}/libraries/borrow-multiple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Lỗi khi mượn sách");
      }

      toast.success("Mượn sách thành công!");
      setCart([]);
      setShowBorrowModal(false);
      setStudentInfo({
        studentId: "",
        studentCode: "",
        name: "",
        email: "",
        className: "",
        photoUrl: "",
      });

      // Refresh libraries
      const refreshResponse = await fetch(`${API_URL}/libraries/full-libraries`);
      if (refreshResponse.ok) {
        const updatedLibraries = await refreshResponse.json();
        setLibraries(updatedLibraries);
      }
    } catch (error) {
      console.error("Error borrowing books:", error);
      toast.error(getErrorMessage(error));
    }
  };

  // Get status badge variant and color
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Sẵn sàng":
        return { variant: "default" as const, color: "#3E8B00", count: 0 };
      case "Đang mượn":
        return { variant: "secondary" as const, color: "#F5AB00", count: 0 };
      case "Đã đặt trước":
        return { variant: "outline" as const, color: "#800080", count: 0 };
      case "Quá hạn":
        return { variant: "destructive" as const, color: "#FF0000", count: 0 };
      default:
        return { variant: "secondary" as const, color: "#777777", count: 0 };
    }
  };

  return (
    <div className="flex gap-6 p-6 h-screen">
      {/* Left Column: Libraries and Books */}
      <div className="flex-1 overflow-y-auto">
        {/* Search Input */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Tìm kiếm sách..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-gray-200"
          />
        </div>

        {/* Libraries List */}
        <div className="space-y-4">
          {filteredLibraries.map((lib) => {
            // Count books by status
            const readyCount = lib.books.filter((b) => b.status === "Sẵn sàng").length;
            const borrowedCount = lib.books.filter((b) => b.status === "Đang mượn").length;
            const reservedCount = lib.books.filter((b) => b.status === "Đã đặt trước").length;
            const overdueCount = lib.books.filter((b) => b.status === "Quá hạn").length;

            return (
              <Card key={lib._id} className="w-full">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Book Cover */}
                    <div className="flex-shrink-0">
                      {lib.coverImage ? (
                        <img
                          src={`${BASE_URL}/${lib.coverImage}`}
                          alt={lib.title}
                          className="w-20 h-28 mx-5 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-20 h-28 mx-5 bg-gray-200 rounded-md flex items-center justify-center">
                          <FiBook className="text-gray-400" size={20} />
                        </div>
                      )}
                    </div>

                    {/* Book Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold">{lib.title}</h3>
                        <div className="flex gap-2">
                          {readyCount > 0 && (
                            <Badge
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {readyCount}
                            </Badge>
                          )}
                          {borrowedCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="bg-yellow-500 hover:bg-yellow-600 text-white"
                            >
                              {borrowedCount}
                            </Badge>
                          )}
                          {reservedCount > 0 && (
                            <Badge
                              variant="outline"
                              className="border-purple-500 text-purple-700"
                            >
                              {reservedCount}
                            </Badge>
                          )}
                          {overdueCount > 0 && (
                            <Badge variant="destructive">
                              {overdueCount}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-muted-foreground mb-3">
                        {lib.authors?.join(", ") || "Chưa có tác giả"}
                      </p>

                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(lib._id)}
                          className="text-muted-foreground p-0 h-auto"
                        >
                          Xem tất cả
                          <FiChevronRight
                            className={`ml-1 transition-transform duration-200 ${
                              expandedBooks[lib._id] ? "rotate-90" : ""
                            }`}
                            size={14}
                          />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {borrowedCount} lượt mượn
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Books List */}
                  {expandedBooks[lib._id] && (
                    <div className="mt-4 pt-4 border-t">
                      {lib.books && lib.books.length > 0 ? (
                        <div className="space-y-3">
                            {lib.books.map((book, idx) => {
                             const statusConfig = getStatusConfig(book.status);
                             return (
                               <div
                                 key={idx}
                                 className="flex ml-[10%] items-center justify-between p-3"
                               >
                                 <div className="flex flex-col items-start gap-2">
                                   <span className="font-medium text-gray-700">
                                     {book.generatedCode || "Chưa có mã"}
                                   </span>
                                   <Badge
                                     variant={statusConfig.variant}
                                     className="w-fit px-3 py-1 text-xs font-medium rounded-md"
                                     style={{ 
                                       backgroundColor: statusConfig.color,
                                       color: "white",
                                       borderColor: statusConfig.color
                                     }}
                                   >
                                     {book.status}
                                   </Badge>
                                 </div>

                                 <div className="flex items-center gap-3">
                                   {book.status !== "Sẵn sàng" && book.borrowedStudent && (
                                     <div className="text-sm text-muted-foreground text-right">
                                       <div className="font-medium">
                                         {book.borrowedStudent.fullName || book.borrowedStudent.name} -{" "}
                                         {book.studentEnroll?.classInfo?.className || "N/A"}
                                       </div>
                                       <div>
                                         Ngày trả:{" "}
                                         {book.returnDate
                                           ? new Date(book.returnDate).toLocaleDateString("vi-VN")
                                           : "Chưa trả"}
                                       </div>
                                     </div>
                                   )}
                                   {book.status === "Sẵn sàng" && (
                                     <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={() => handleSelectBook(lib, book)}
                                       className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                     >
                                       Chọn sách
                                     </Button>
                                   )}
                                 </div>
                               </div>
                             );
                           })}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          Chưa có sách con
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Right Column: Cart */}
      <div className="w-96 flex-shrink-0">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiShoppingCart size={20} />
              Giỏ Sách ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <FiShoppingCart size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-muted-foreground">Chưa có sách nào trong giỏ</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.libraryTitle}</p>
                      <p className="text-xs text-muted-foreground">{item.bookCode}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBook(idx)}
                      className="text-gray-500 hover:text-red-600 p-1"
                    >
                      <FiTrash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleBorrow}
                disabled={cart.length === 0}
                className="w-full"
                size="lg"
              >
                Mượn sách
              </Button>
              <Button
                onClick={handleClearAll}
                disabled={cart.length === 0}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Xóa tất cả
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Borrow Modal */}
      <Dialog open={showBorrowModal} onOpenChange={setShowBorrowModal}>
        <DialogContent className="min-w-5xl max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mượn sách</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-8 mt-6">
            {/* Step 1: Select Student */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Bước 1: Chọn học sinh</h3>
              
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium mb-2">
                    Tìm kiếm (Mã/Tên)
                  </label>
                  <Input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchStudent(e.target.value)}
                    placeholder="Nhập mã hoặc tên học sinh..."
                    className="w-full"
                  />
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && studentSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {studentSuggestions.map((stu) => (
                        <div
                          key={stu._id}
                          className="flex items-center gap-3 px-3 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                          onClick={() => handleSelectStudentSuggestion(stu)}
                        >
                          {/* Avatar học sinh trong dropdown */}
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarImage
                              src={stu.photoUrl && stu.photoUrl.trim() !== "" 
                                ? (stu.photoUrl.startsWith('/') 
                                    ? `${BASE_URL}${stu.photoUrl}` 
                                    : `${BASE_URL}/${stu.photoUrl}`)
                                : undefined}
                              alt={stu.fullName}
                            />
                            <AvatarFallback className="text-xs">
                              {stu.fullName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          {/* Thông tin học sinh */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{stu.fullName}</div>
                            <div className="text-xs text-muted-foreground">{stu.studentId}</div>
                            {stu.className && (
                              <div className="text-xs text-blue-600">Lớp: {stu.className}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Họ và Tên</label>
                  <Input
                    type="text"
                    value={studentInfo.name}
                    onChange={(e) =>
                      setStudentInfo({ ...studentInfo, name: e.target.value })
                    }
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Lớp</label>
                  <Input
                    type="text"
                    value={studentInfo.className}
                    onChange={(e) =>
                      setStudentInfo({ ...studentInfo, className: e.target.value })
                    }
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={studentInfo.email}
                    onChange={(e) =>
                      setStudentInfo({ ...studentInfo, email: e.target.value })
                    }
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Student Photo in Center */}
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                {studentInfo.photoUrl && studentInfo.photoUrl.trim() !== "" ? (
                  <img
                    src={studentInfo.photoUrl.startsWith('/') 
                      ? `${BASE_URL}${studentInfo.photoUrl}` 
                      : `${BASE_URL}/${studentInfo.photoUrl}`}
                    alt="Student"
                    className="w-56 h-72 object-cover rounded-lg border-4 border-gray-200 shadow-lg"
                  />
                ) : (
                  <div className="w-48 h-64 bg-gray-100 rounded-lg border-4 border-gray-200 shadow-lg flex items-center justify-center">
                    <FiUser size={80} className="text-gray-400" />
                  </div>
                )}
              </div>
             
            </div>

            {/* Step 2: Review Books */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Bước 2: Kiểm tra sách</h3>
              
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{item.libraryTitle}</p>
                      <p className="text-sm text-muted-foreground">Mã: {item.bookCode}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBook(index)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <FiTrash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              onClick={handleConfirmBorrow}
              size="lg"
              className="px-8"
            >
              Xác nhận
            </Button>
            <Button
              onClick={handleCloseModal}
              variant="outline"
              size="lg"
              className="px-8"
            >
              Hủy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LibraryManagement; 
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiSearch } from "react-icons/fi";
import { FaFilter } from "react-icons/fa6";
import { TICKETS_API_URL } from "../../../../config/api";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Import 2 file tách riêng
import TicketCreate from "./TicketCreate";
import TicketDetail from "./TicketDetail";

// ---------------------- TYPE DEFINITIONS ----------------------
interface ApiError {
  response?: {
    status: number;
    data?: unknown;
  };
}

interface User {
  id: string;
  _id: string;
  fullname: string;
  email: string;
  avatarUrl?: string;
}

interface Attachment {
  _id: string;
  filename: string;
  originalName: string;
  path: string;
  mimetype: string;
  size: number;
  url: string;
}

interface Message {
  _id: string;
  text: string;
  sender: User;
  timestamp: string;
  type?: string;
}

interface Feedback {
  rating: number;
  comment: string;
  badges: string[];
}

interface Ticket {
  _id: string;
  ticketCode: string;
  title: string;
  description: string;
  status: 'Open' | 'Processing' | 'Assigned' | 'Waiting for Customer' | 'Closed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High';
  type: string;
  creator: User;
  assignedTo?: User;
  messages: Message[];
  attachments: Attachment[];
  feedback?: Feedback;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  sla: string;
  notes?: string;
}

interface TicketData {
  type: string;
  title: string;
  description: string;
  images: File[];
  attachments: File[];
  notes: string;
  priority: string;
}

interface TicketProps {
  currentUser: User;
}

type StatusFilter = '' | 'Open' | 'Processing' | 'Waiting for Customer' | 'Closed' | 'Cancelled';

// ---------------------- COMPONENT ----------------------
const Ticket: React.FC<TicketProps> = ({ currentUser }) => {
  // ---------------------- AUTH & CONTEXT ----------------------
  
  // Get token safely from localStorage
  const getToken = (): string | null => {
    const token = localStorage.getItem("token");
    console.log("🔍 Debug getToken - Raw token from localStorage:", token);
    console.log("🔍 Debug getToken - localStorage keys:", Object.keys(localStorage));
    
    // Kiểm tra nếu token là string "null" thì return null
    if (token === "null" || token === "" || !token) {
      console.log("🔍 Debug getToken - Token is invalid or empty");
      return null;
    }
    console.log("🔍 Debug getToken - Token is valid, length:", token.length);
    return token;
  };

  // ---------------------- STATE & LOGIC CHUNG ----------------------
  const [step, setStep] = useState<number>(1);

  const [ticketData, setTicketData] = useState<TicketData>({
    type: "",
    title: "",
    description: "",
    images: [],
    attachments: [],
    notes: "",
    priority: "Medium",
  });

  const [ticketCreatedId, setTicketCreatedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("");
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [showCreateTicket, setShowCreateTicket] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Chat & feedback
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>("");
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);

  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");

  // ---------------------- API CALLS ----------------------
  const fetchUserTickets = async (): Promise<void> => {
    try {
      // Kiểm tra token trước khi gọi API
      const token = getToken();
      if (!token) {
        console.error("Không có token authentication");
        toast.error("Vui lòng đăng nhập lại");
        return;
      }

      let url = `${TICKETS_API_URL}`;
      if (currentUser?.id) {
        url += `?creator=${currentUser.id}`;
      }
      if (filterStatus) {
        url += `${currentUser?.id ? "&" : "?"}status=${filterStatus}`;
      }

      console.log("📞 Calling API:", url);
      console.log("🔑 Token exists:", !!token);

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setUserTickets(res.data.tickets || []);
        console.log("✅ Fetched tickets:", res.data.tickets?.length || 0);
      }
    } catch (error: unknown) {
      console.error("Lỗi khi lấy danh sách ticket:", error);
      
      if ((error as ApiError)?.response?.status === 401) {
        console.error("Token không hợp lệ hoặc đã hết hạn");
        toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
        // Có thể redirect về trang login
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        toast.error("Không thể tải danh sách ticket");
      }
    }
  };

  const fetchTicketById = async (ticketId: string): Promise<void> => {
    if (!ticketId) return;
    
    try {
      const token = getToken();
      if (!token) {
        console.error("Không có token authentication");
        toast.error("Vui lòng đăng nhập lại");
        return;
      }

      const res = await axios.get(`${TICKETS_API_URL}/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setSelectedTicket(res.data.ticket);
      }
    } catch (error: unknown) {
      console.error("Lỗi khi lấy chi tiết ticket:", error);
      
      if ((error as ApiError)?.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        toast.error("Không thể tải chi tiết ticket");
      }
    }
  };

  const submitTicket = async (): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append("title", ticketData.title);
      formData.append("description", ticketData.description);
      formData.append("priority", ticketData.priority);
      formData.append("notes", ticketData.notes);

      if (currentUser?.id) {
        formData.append("creator", currentUser.id);
      } else {
        console.error("Lỗi: Không tìm thấy userId của người tạo ticket.");
        return;
      }

      ticketData.images.forEach((file) => formData.append("attachments", file));

      const token = getToken();
      if (!token) {
        console.error("Không có token authentication");
        toast.error("Vui lòng đăng nhập lại");
        return;
      }

      const res = await axios.post(`${TICKETS_API_URL}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.data.success && res.data.ticket?.ticketCode) {
        setTicketCreatedId(res.data.ticket.ticketCode);
        setStep(5); // chuyển sang bước 5
      } else {
        console.error("Lỗi: Không có mã Ticket trả về từ server");
      }

      // Fetch lại danh sách ticket sau khi tạo
      await fetchUserTickets();
      setStep(5);
    } catch (error) {
      console.error("Lỗi khi tạo ticket:", error);
    }
  };

  const handleFeedback = async (): Promise<void> => {
    if (!selectedTicket) return;
    
    try {
      const hasPreviousRating =
        selectedTicket.feedback && selectedTicket.feedback.rating;
      if (!hasPreviousRating) {
        // Lần đầu
        if (!rating) {
          toast.error("Vui lòng chọn số sao trước khi gửi.");
          return;
        }
      } else {
        // Đã có rating => phải có comment
        if (!rating) {
          toast.error("Vui lòng chọn số sao để cập nhật đánh giá.");
          return;
        }
        if (!review.trim()) {
          toast.error("Bạn cần nhập nhận xét khi thay đổi đánh giá.");
          return;
        }
      }
      const token = getToken();
      console.log("🔍 Debug Feedback - Token exists:", !!token);
      console.log("🔍 Debug Feedback - Token preview:", token ? token.substring(0, 20) + "..." : "null");
      
      if (!token) {
        console.error("Không có token authentication");
        toast.error("Vui lòng đăng nhập lại");
        return;
      }

      console.log("🔍 Debug Feedback - API URL:", `${TICKETS_API_URL}/${selectedTicket._id}/feedback`);
      console.log("🔍 Debug Feedback - Request payload:", { rating, comment: review, badges: selectedBadges });

      const res = await axios.post(
        `${TICKETS_API_URL}/${selectedTicket._id}/feedback`,
        {
          rating,
          comment: review,
          badges: selectedBadges, // ✅ Thêm dòng này
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        toast.success("Đánh giá thành công!");
        // load lại ticket
        await fetchTicketById(selectedTicket._id);
      } else {
        toast.error("Có lỗi xảy ra khi gửi đánh giá.");
      }
    } catch (error: unknown) {
      console.error("Error feedback:", error);
      toast.error("Không thể gửi đánh giá. Vui lòng thử lại sau.");
    }
  };

  const handleReopenTicket = async (): Promise<void> => {
    if (!selectedTicket) return;
    
    try {
      const token = getToken();
      if (!token) {
        console.error("Không có token authentication");
        toast.error("Vui lòng đăng nhập lại");
        return;
      }

      const res = await axios.put(
        `${TICKET_API_URL}/tickets/${selectedTicket._id}`,
        { status: "Processing" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Ticket đã được mở lại, vui lòng chờ kỹ thuật xử lý.");
        fetchTicketById(selectedTicket._id);
      } else {
        toast.error("Lỗi khi mở lại ticket");
      }
    } catch (error) {
      console.error("Error reopening ticket:", error);
    }
  };

  const handleFeedbackAndClose = async (): Promise<void> => {
    // Gửi feedback
    await handleFeedback();
    if (!selectedTicket) return;
    
    try {
      const token = getToken();
      console.log("🔍 Debug - Token exists:", !!token);
      console.log("🔍 Debug - Token preview:", token ? token.substring(0, 20) + "..." : "null");
      
      if (!token) {
        console.error("Không có token authentication");
        toast.error("Vui lòng đăng nhập lại");
        return;
      }

      console.log("🔍 Debug - API URL:", `${TICKETS_API_URL}/${selectedTicket._id}`);
      console.log("🔍 Debug - Request payload:", { status: "Closed" });

      const res = await axios.put(
        `${TICKETS_API_URL}/${selectedTicket._id}`,
        { status: "Closed" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Ticket đã được cập nhật sang trạng thái Closed.");
        fetchTicketById(selectedTicket._id);
      } else {
        toast.error("Lỗi khi cập nhật trạng thái ticket.");
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
      console.error("🔍 Debug - Full error:", error);
      
      if ((error as ApiError)?.response?.status === 401) {
        console.error("🔍 Debug - 401 Error details:", (error as ApiError)?.response?.data);
        toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        toast.error("Lỗi khi cập nhật trạng thái ticket.");
      }
    }
  };

  const handleUrgent = async (): Promise<void> => {
    if (!selectedTicket) return;
    
    try {
      const token = getToken();
      if (!token) {
        console.error("Không có token authentication");
        toast.error("Vui lòng đăng nhập lại");
        return;
      }

      const res = await axios.put(
        `${TICKETS_API_URL}/${selectedTicket._id}`,
        { priority: "High" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Ticket priority updated to High.");
        fetchTicketById(selectedTicket._id);
      } else {
        toast.error("Error updating priority.");
      }
    } catch (error) {
      console.error("Error updating priority:", error);
      toast.error("Error updating priority.");
    }
  };

  // Hàm xử lý huỷ ticket với lý do nhập vào
  const handleCancelTicket = async (): Promise<void> => {
    if (!cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do huỷ ticket.");
      return;
    }
    if (!selectedTicket) return;
    
    try {
      const token = getToken();
      if (!token) {
        console.error("Không có token authentication");
        toast.error("Vui lòng đăng nhập lại");
        return;
      }

      const res = await axios.put(
        `${TICKETS_API_URL}/${selectedTicket._id}`,
        { status: "Cancelled", cancellationReason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Ticket đã được huỷ.");
        fetchTicketById(selectedTicket._id);
        setShowCancelModal(false);
        setCancelReason("");
      } else {
        toast.error("Lỗi khi huỷ ticket.");
      }
    } catch (error) {
      console.error("Error cancelling ticket:", error);
      toast.error("Error cancelling ticket.");
    }
  };

  // ---------------------- USE EFFECTS ---------------------
  // Tự động reload mỗi 5s nếu đã có selectedTicket
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (selectedTicket?._id) {
      interval = setInterval(() => {
        fetchTicketById(selectedTicket._id);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedTicket?._id]);

  useEffect(() => {
    if (selectedTicket?._id) {
      setRating(selectedTicket.feedback?.rating || 0);
      setReview(selectedTicket.feedback?.comment || "");
      setSelectedBadges(selectedTicket.feedback?.badges || []); // ✅ Gán lại badge nếu đã có
    }
  }, [selectedTicket?._id]);

  // Mỗi khi searchTerm / filterStatus thay đổi => load list
  useEffect(() => {
    fetchUserTickets();
  }, [searchTerm, filterStatus]);

  // ---------------------- HELPER FUNCTIONS ----------------------
  const getStatusDisplay = (status: string): string => {
    const statusMap: Record<string, string> = {
      "": "Tất cả",
      Open: "Chưa nhận",
      Assigned: "Đã nhận",
      Processing: "Đang xử lý",
      "Waiting for Customer": "Chờ phản hồi",
      Closed: "Đóng",
      Cancelled: "Hủy",
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status: string): string => {
    switch (status) {
      case "Processing":
        return "bg-[#F5AA1E] text-white";
      case "Waiting for Customer":
        return "bg-[#F05023] text-white";
      case "Closed":
        return "bg-[#BED232] text-white";
      default:
        return "bg-[#002855] text-white";
    }
  };

  // ---------------------- RENDER ----------------------
  return (
    <div className="h-screen max-h-[86vh] flex justify-center overflow-hidden">
      <style dangerouslySetInnerHTML={{
        __html: `
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `
      }} />
      <div className="w-full h-full flex flex-row gap-6">
        {/* CỘT BÊN TRÁI - DANH SÁCH TICKET */}
        <div className="w-2/5 h-full bg-white rounded-lg border shadow-sm flex flex-col">
          {/* Header cố định */}
          <div className="flex flex-col space-y-1.5 p-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold leading-none tracking-tight">Danh sách Ticket</h3>
              <Button
                onClick={() => {
                  setShowCreateTicket(true);
                  setSelectedTicket(null);
                }}
                size="sm"
                className="bg-[#FF5733] hover:bg-[#E44D26]"
              >
                Tạo Ticket
              </Button>
            </div>
          </div>

          {/* Phần nội dung có thể cuộn */}
          <div className="flex-1 flex flex-col px-6 pb-6 min-h-0">
            {/* Tìm kiếm & Filter */}
            <div className="mb-4 flex-shrink-0">
              <div className="relative mb-3 flex items-center gap-2">
                <div className="relative w-full">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm ticket..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="absolute right-2">
                  <Button
                    onClick={() => setShowFilterDropdown((prev) => !prev)}
                    variant="outline"
                    size="sm"
                    className=" text-[#002855] border-none"
                  >
                    <FaFilter size={16} />
                  </Button>
                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      {(["", "Open", "Processing", "Waiting for Customer", "Closed", "Cancelled"] as StatusFilter[]).map((status) => (
                        <div
                          key={status}
                          onClick={() => {
                            setFilterStatus(status);
                            setShowFilterDropdown(false);
                          }}
                          className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                            filterStatus === status
                              ? "bg-gray-200 font-semibold"
                              : ""
                          }`}
                        >
                          {getStatusDisplay(status)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* LIST TICKET - Phần có thể cuộn */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-3">
                {userTickets.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Không có ticket nào.</p>
                ) : (
                  userTickets.map((ticket) => (
                    <div
                      key={ticket._id}
                      className="cursor-pointer hover:shadow-md transition-shadow bg-white rounded-lg border shadow-sm flex-shrink-0"
                      onClick={() => {
                        fetchTicketById(ticket._id);
                        setShowCreateTicket(false);
                      }}
                    >
                      <div className="p-4">
                        <div className="w-full flex flex-col justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="text-[#002147] font-semibold text-base line-clamp-1 leading-tight">
                              {ticket.title || "Chưa có tiêu đề"}
                            </h3>
                           
                          </div>
                          
                          <div className="flex flex-row items-center justify-between pt-2">
                             <p className="text-[#757575] text-sm font-medium">
                              {ticket.ticketCode}
                            </p>
                            <Badge
                              className={`text-xs font-semibold w-20 py-1 ${getStatusClass(ticket.status)}`}
                            >
                              {getStatusDisplay(ticket.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CỘT BÊN PHẢI */}
        {showCreateTicket && !selectedTicket && (
          <TicketCreate
            currentUser={currentUser}
            step={step}
            setStep={setStep}
            ticketData={ticketData}
            setTicketData={setTicketData}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            submitTicket={submitTicket}
            ticketCreatedId={ticketCreatedId}
          />
        )}
        {selectedTicket && !showCreateTicket && (
          <TicketDetail
            selectedTicket={selectedTicket}
            currentUser={currentUser}
            rating={rating}
            setRating={setRating}
            review={review}
            setReview={setReview}
            handleFeedback={handleFeedback}
            selectedBadges={selectedBadges}
            setSelectedBadges={setSelectedBadges}
            handleReopenTicket={handleReopenTicket}
            handleFeedbackAndClose={handleFeedbackAndClose}
            handleUrgent={handleUrgent}
            setShowCancelModal={setShowCancelModal}
            fetchTicketById={fetchTicketById}
          />
        )}
      </div>
      {/* Modal huỷ ticket */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="w-96">
          <DialogHeader>
            <DialogTitle>Huỷ Ticket</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Nhập lý do huỷ ticket"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
            className="mb-4"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
            >
              Huỷ bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelTicket}
            >
              Xác nhận huỷ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Ticket; 
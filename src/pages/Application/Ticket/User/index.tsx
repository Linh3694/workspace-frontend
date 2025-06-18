import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";
import TicketCreate from "./TicketCreate";
import TicketDetail from "./TicketDetail";
import TicketList from "./Ticket";

interface User {
  id: string;
  _id: string;
  fullname: string;
  email: string;
  avatarUrl?: string;
}

interface TicketData {
  type: string;
  title: string;
  description: string;
  images: File[];
  attachments: File[];
  notes: string;
  priority: string;
  startDate?: string;
  endDate?: string;
}

interface Ticket {
  _id: string;
  ticketCode: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  creator: User;
  assignedTo?: User;
  sla: string;
  attachments?: Array<{ url: string; filename?: string }>;
  notes?: string;
  feedback?: {
    rating: number;
    comment: string;
    badges?: string[];
  };
}

interface TicketUserProps {
  currentUser: User | null;
}

const TicketUser: React.FC<TicketUserProps> = ({ currentUser }) => {
  // State quản lý view hiện tại
  const [currentView, setCurrentView] = useState<"list" | "create" | "detail">("list");
  const [step, setStep] = useState(1);

  // State cho ticket data
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
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // State cho feedback
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const token = localStorage.getItem("authToken");

  // Reset form khi chuyển view
  useEffect(() => {
    if (currentView === "create") {
      setStep(1);
      setTicketData({
        type: "",
        title: "",
        description: "",
        images: [],
        attachments: [],
        notes: "",
        priority: "Medium",
      });
      setSelectedOption(null);
      setTicketCreatedId(null);
    }
  }, [currentView]);

  // API Functions
  const fetchTicketById = async (ticketId: string) => {
    if (!ticketId) return;
    try {
      const res = await axios.get(`${API_URL}/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setSelectedTicket(res.data.ticket);
      }
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết ticket:", error);
      toast.error("Không thể tải chi tiết ticket");
    }
  };

  const submitTicket = async () => {
    try {
      const formData = new FormData();
      formData.append("title", ticketData.title);
      formData.append("description", ticketData.description);
      formData.append("priority", ticketData.priority);
      formData.append("notes", ticketData.notes);
      formData.append("type", ticketData.type);

      if (currentUser?.id) {
        formData.append("creator", currentUser.id);
      } else {
        toast.error("Lỗi: Không tìm thấy thông tin người dùng.");
        return;
      }

      // Thêm ngày cho sự kiện
      if (ticketData.type === "event") {
        if (ticketData.startDate) {
          formData.append("startDate", ticketData.startDate);
        }
        if (ticketData.endDate) {
          formData.append("endDate", ticketData.endDate);
        }
      }

      // Thêm file đính kèm
      ticketData.images.forEach((file) => formData.append("attachments", file));

      const res = await axios.post(`${API_URL}/tickets`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success && res.data.ticket?.ticketCode) {
        setTicketCreatedId(res.data.ticket.ticketCode);
        setStep(5);
        toast.success("Tạo ticket thành công!");
      } else {
        toast.error("Lỗi: Không thể tạo ticket");
      }
    } catch (error) {
      console.error("Lỗi khi tạo ticket:", error);
      toast.error("Không thể tạo ticket. Vui lòng thử lại.");
    }
  };

  const handleFeedback = async () => {
    if (!selectedTicket) return;

    try {
      const hasPreviousRating = selectedTicket.feedback && selectedTicket.feedback.rating;
      
      if (!hasPreviousRating) {
        if (!rating) {
          toast.error("Vui lòng chọn số sao trước khi gửi.");
          return;
        }
      } else {
        if (!rating) {
          toast.error("Vui lòng chọn số sao để cập nhật đánh giá.");
          return;
        }
        if (!review.trim()) {
          toast.error("Bạn cần nhập nhận xét khi thay đổi đánh giá.");
          return;
        }
      }

      const res = await axios.post(
        `${API_URL}/tickets/${selectedTicket._id}/feedback`,
        {
          rating,
          comment: review,
          badges: selectedBadges,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        toast.success("Đánh giá thành công!");
        await fetchTicketById(selectedTicket._id);
      } else {
        toast.error("Có lỗi xảy ra khi gửi đánh giá.");
      }
    } catch (error) {
      console.error("Error feedback:", error);
      toast.error("Không thể gửi đánh giá. Vui lòng thử lại sau.");
    }
  };

  const handleReopenTicket = async () => {
    if (!selectedTicket) return;

    try {
      const res = await axios.put(
        `${API_URL}/tickets/${selectedTicket._id}`,
        { status: "Processing" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Ticket đã được mở lại, vui lòng chờ kỹ thuật xử lý.");
        await fetchTicketById(selectedTicket._id);
      } else {
        toast.error("Lỗi khi mở lại ticket");
      }
    } catch (error) {
      console.error("Error reopening ticket:", error);
      toast.error("Không thể mở lại ticket");
    }
  };

  const handleFeedbackAndClose = async () => {
    await handleFeedback();
    
    if (!selectedTicket) return;

    try {
      const res = await axios.put(
        `${API_URL}/tickets/${selectedTicket._id}`,
        { status: "Closed" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Ticket đã được cập nhật sang trạng thái Closed.");
        await fetchTicketById(selectedTicket._id);
      } else {
        toast.error("Lỗi khi cập nhật trạng thái ticket.");
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Lỗi khi cập nhật trạng thái ticket.");
    }
  };

  const handleUrgent = async () => {
    if (!selectedTicket) return;

    try {
      const res = await axios.put(
        `${API_URL}/tickets/${selectedTicket._id}`,
        { priority: "High" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Đã cập nhật độ ưu tiên thành Cao.");
        await fetchTicketById(selectedTicket._id);
      } else {
        toast.error("Lỗi khi cập nhật độ ưu tiên.");
      }
    } catch (error) {
      console.error("Error updating priority:", error);
      toast.error("Lỗi khi cập nhật độ ưu tiên.");
    }
  };

  const handleCancelTicket = async () => {
    if (!selectedTicket || !cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy ticket.");
      return;
    }

    try {
      const res = await axios.put(
        `${API_URL}/tickets/${selectedTicket._id}`,
        { 
          status: "Cancelled",
          cancelReason: cancelReason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        toast.success("Ticket đã được hủy.");
        setShowCancelModal(false);
        setCancelReason("");
        await fetchTicketById(selectedTicket._id);
      } else {
        toast.error("Lỗi khi hủy ticket.");
      }
    } catch (error) {
      console.error("Error cancelling ticket:", error);
      toast.error("Không thể hủy ticket.");
    }
  };

  // Event Handlers

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedTicket(null);
  };

  // Render based on current view
  const renderContent = () => {
    switch (currentView) {
      case "create":
        return (
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
        );

      case "detail":
        return selectedTicket ? (
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
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-500">Không tìm thấy ticket</p>
              <button
                onClick={handleBackToList}
                className="mt-4 px-4 py-2 bg-[#FF5733] text-white rounded-lg"
              >
                Quay lại danh sách
              </button>
            </div>
          </div>
        );

      default:
        return currentUser ? (
          <TicketList
            currentUser={currentUser}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Vui lòng đăng nhập để xem ticket</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full">
      {/* Navigation breadcrumb */}
      {currentView !== "list" && (
        <div className="mb-4">
          <button
            onClick={handleBackToList}
            className="text-[#FF5733] hover:text-[#E64A2E] font-medium"
          >
            ← Quay lại danh sách ticket
          </button>
        </div>
      )}

      {/* Main content */}
      {renderContent()}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Hủy Ticket</h3>
            <p className="text-gray-600 mb-4">
              Vui lòng nhập lý do hủy ticket:
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={4}
              placeholder="Nhập lý do hủy..."
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCancelTicket}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Xác nhận hủy
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketUser; 
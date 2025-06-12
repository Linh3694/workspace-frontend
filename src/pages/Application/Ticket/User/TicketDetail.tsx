import React, { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import { FaCommentDots } from "react-icons/fa6";
import { BASE_URL } from "../../../core/config";
import Modal from "react-modal";
import TechnicalRating from "../TechnicalRating";
import TicketChat from "./TicketChat";

interface User {
  _id: string;
  id: string;
  fullname: string;
  email: string;
  avatarUrl?: string;
  jobTitle?: string;
}

interface Attachment {
  url: string;
  filename?: string;
}

interface Feedback {
  rating: number;
  comment: string;
  badges?: string[];
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
  attachments?: Attachment[];
  notes?: string;
  feedback?: Feedback;
}

interface TicketDetailProps {
  selectedTicket: Ticket;
  currentUser: User | null;
  rating: number;
  setRating: (rating: number) => void;
  review: string;
  setReview: (review: string) => void;
  handleFeedback: () => Promise<void>;
  selectedBadges: string[];
  setSelectedBadges: (badges: string[]) => void;
  handleReopenTicket: () => Promise<void>;
  handleFeedbackAndClose: () => Promise<void>;
  handleCancelTicket: () => Promise<void>;
  handleUrgent: () => Promise<void>;
  setShowCancelModal: (show: boolean) => void;
  fetchTicketById: (id: string) => Promise<void>;
}

const TicketDetail: React.FC<TicketDetailProps> = ({
  selectedTicket,
  currentUser,
  rating,
  setRating,
  review,
  setReview,
  handleFeedback,
  selectedBadges,
  setSelectedBadges,
  handleReopenTicket,
  handleFeedbackAndClose,
  handleCancelTicket,
  handleUrgent,
  setShowCancelModal,
  fetchTicketById,
}) => {
  const [detailTab, setDetailTab] = useState<"request" | "progress" | "discussion">("request");

  useEffect(() => {
    if (selectedTicket?._id) {
      setRating(selectedTicket.feedback?.rating || 0);
      setReview(selectedTicket.feedback?.comment || "");
    }
  }, [selectedTicket?._id, setRating, setReview]);

  return (
    <div className="bg-white w-full h-full rounded-xl shadow-xl p-6 flex gap-4">
      {/* CỘT TRÁI - HIỂN THỊ TAB */}
      <div className="flex flex-col w-3/4 h-full">
        <h1 className="text-start text-2xl font-bold text-[#002147] mb-3">
          {selectedTicket.title || "Chưa có tiêu đề"}
        </h1>
        {/* Thanh Tab */}
        <div className="flex gap-6 border-b">
          <button
            className={`pb-2 ${
              detailTab === "request"
                ? "text-[#FF5733] border-b-4 border-[#FF5733]"
                : "text-[#757575]"
            }`}
            onClick={() => setDetailTab("request")}
          >
            Yêu cầu
          </button>
          <button
            className={`pb-2 ${
              detailTab === "progress"
                ? "text-[#FF5733] border-b-4 border-[#FF5733]"
                : "text-[#757575]"
            }`}
            onClick={() => setDetailTab("progress")}
          >
            Tiến trình
          </button>
          <button
            className={`pb-2 ${
              detailTab === "discussion"
                ? "text-[#FF5733] border-b-4 border-[#FF5733]"
                : "text-[#757575]"
            }`}
            onClick={() => setDetailTab("discussion")}
          >
            Trao đổi
          </button>
        </div>
        {/* Nội dung Tab */}
        <div className="flex-1 overflow-hidden mt-3">
          <div className="h-full max-h-full overflow-y-hidden hover:overflow-y-auto">
            {detailTab === "request" && (
              <RequestTab selectedTicket={selectedTicket} />
            )}
            {detailTab === "progress" && (
              <ProgressTab
                selectedTicket={selectedTicket}
                rating={rating}
                setRating={setRating}
                review={review}
                setReview={setReview}
                handleFeedback={handleFeedback}
                selectedBadges={selectedBadges}
                setSelectedBadges={setSelectedBadges}
                handleReopenTicket={handleReopenTicket}
                handleFeedbackAndClose={handleFeedbackAndClose}
                handleCancelTicket={handleCancelTicket}
                handleUrgent={handleUrgent}
                setShowCancelModal={setShowCancelModal}
              />
            )}
            {detailTab === "discussion" && (
              <TicketChat
                ticket={selectedTicket}
                currentUser={currentUser}
                fetchTicketById={fetchTicketById}
              />
            )}
          </div>
        </div>
      </div>

      {/* CỘT PHẢI - THÔNG TIN TICKET */}
      <div className="w-1/4 max-h-fit overflow-y-hidden hover:overflow-y-auto flex-shrink-0 border rounded-2xl p-4">
        <div className="p-2 text-[#002147] space-y-4 flex flex-col">
          <div className="h-full space-y-4">
            <div className="flex-row flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-sm text-[#757575]">Mã yêu cầu</p>
                <p className="text-base font-semibold">
                  {selectedTicket.ticketCode || "N/A"}
                </p>
              </div>
              <button
                className="flex px-4 py-2 bg-orange-red text-white text-sm font-semibold rounded-lg"
                onClick={handleUrgent}
              >
                Báo Gấp
              </button>
            </div>
            <div>
              <p className="text-sm text-[#757575]">Loại yêu cầu</p>
              <p className="text-base font-semibold">
                {selectedTicket.type || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#757575]">Trạng thái</p>
              <span
                className={`text-sm font-semibold px-3 py-1 rounded-full inline-block mt-1 ${
                  selectedTicket.status === "Processing"
                    ? "bg-[#F5AA1E] text-white"
                    : selectedTicket.status === "Closed"
                    ? "bg-[#3DB838] text-white"
                    : selectedTicket.status === "Assigned"
                    ? "bg-[#002855] text-white"
                    : selectedTicket.status === "Done"
                    ? "bg-[#3DB838] text-white"
                    : selectedTicket.status === "Cancelled"
                    ? "bg-orange-red text-white"
                    : "bg-[#b63737] text-white"
                }`}
              >
                {selectedTicket.status === "Open"
                  ? "Chưa nhận"
                  : selectedTicket.status === "Processing"
                  ? "Đang xử lý"
                  : selectedTicket.status === "Assigned"
                  ? "Đã nhận"
                  : selectedTicket.status === "Waiting for Customer"
                  ? "Chờ phản hồi"
                  : selectedTicket.status === "Closed"
                  ? "Đóng"
                  : selectedTicket.status === "Cancelled"
                  ? "Đã huỷ"
                  : selectedTicket.status || "N/A"}
              </span>
            </div>

            <div>
              <p className="text-sm text-[#757575]">Ngày yêu cầu</p>
              <p className="text-base font-semibold">
                {selectedTicket.createdAt
                  ? new Date(selectedTicket.createdAt).toLocaleDateString("vi-VN")
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#757575]">Ngày hoàn thành dự kiến</p>
              <p className="text-base font-semibold">
                {new Date(selectedTicket.sla).toLocaleString()}
              </p>
            </div>

            <div className="pb-2">
              <p className="text-sm text-[#757575]">Người thực hiện</p>
              {selectedTicket.assignedTo ? (
                <div className="flex items-center gap-2 mt-3">
                  <img
                    src={`${BASE_URL}/uploads/Avatar/${selectedTicket.assignedTo?.avatarUrl}`}
                    alt="Avatar"
                    className="w-20 h-20 rounded-xl object-cover object-top border"
                  />
                  <div>
                    <div className="w-full flex flex-row gap-4 items-center justify-start">
                      <p className="text-base font-semibold">
                        {selectedTicket.assignedTo?.fullname || "Chưa có"}
                      </p>
                      <button
                        className="flex px-2 py-2 bg-[#002855] text-white text-sm font-semibold rounded-lg"
                        onClick={() => setDetailTab("discussion")}
                      >
                        <FaCommentDots />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      {selectedTicket.assignedTo?.jobTitle === "technical"
                        ? "Kỹ thuật viên"
                        : selectedTicket.assignedTo?.jobTitle || ""}
                    </p>
                    <TechnicalRating
                      technicalId={selectedTicket.assignedTo?._id}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">Chưa được phân công</p>
              )}
            </div>
            
            {(selectedTicket.status === "Assigned" ||
              selectedTicket.status === "Processing" ||
              selectedTicket.status === "Done") && (
              <div className="flex flex-row items-center gap-6">
                <div className="w-full">
                  <button
                    className="w-full flex-1 px-4 py-2 bg-orange-red hover:bg-red-600 text-white text-sm font-semibold rounded-lg"
                    onClick={() => setShowCancelModal(true)}
                  >
                    Huỷ Ticket
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Đánh giá */}
          {(selectedTicket.status === "Closed" ||
            selectedTicket.status === "Cancelled") && (
            <div className="border-t pt-3 space-y-4">
              {selectedTicket.feedback?.rating ? (
                <div>
                  <div className="flex items-center justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`text-3xl mx-1 ${
                          i < rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-center text-lg font-semibold">
                    {rating}/5 sao
                  </p>
                  {selectedTicket.feedback?.comment && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        {selectedTicket.feedback.comment}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold mb-2">Đánh giá dịch vụ</h3>
                  <div className="flex items-center justify-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`text-3xl mx-1 cursor-pointer ${
                          i < rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                        onClick={() => setRating(i + 1)}
                      />
                    ))}
                  </div>
                  <textarea
                    className="w-full p-3 border rounded-lg resize-none"
                    rows={3}
                    placeholder="Nhận xét của bạn..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                  />
                  <button
                    onClick={handleFeedback}
                    className="w-full mt-2 px-4 py-2 bg-[#FF5733] text-white rounded-lg font-semibold hover:bg-[#E64A2E]"
                  >
                    Gửi đánh giá
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Component RequestTab
interface RequestTabProps {
  selectedTicket: Ticket;
}

const RequestTab: React.FC<RequestTabProps> = ({ selectedTicket }) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  return (
    <div className="w-full h-full p-4 flex flex-col gap-3 overflow-y-auto">
      {/* Mô tả chi tiết */}
      <div className="pb-4">
        <p className="font-semibold text-[#002147]">Mô tả chi tiết</p>
        <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">
          {selectedTicket.description || "Không có mô tả chi tiết."}
        </p>
      </div>

      {/* Ảnh đính kèm */}
      <div className="pb-4">
        <p className="font-semibold text-[#002147] mb-2">Ảnh đính kèm</p>
        {selectedTicket.attachments && selectedTicket.attachments.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto">
            {selectedTicket.attachments.map((item, index) => (
              <img
                key={index}
                src={`${BASE_URL}/uploads/Tickets/${item.url}`}
                alt={item.filename || `attachment-${index}`}
                onClick={() =>
                  setPreviewImage(`${BASE_URL}/uploads/Tickets/${item.url}`)
                }
                className="w-[120px] h-[120px] object-cover rounded-lg border shadow-sm cursor-pointer"
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Không có ảnh đính kèm.</p>
        )}
      </div>

      {previewImage && (
        <Modal
          isOpen={!!previewImage}
          onRequestClose={() => setPreviewImage(null)}
          className="flex items-center justify-center p-4"
          overlayClassName="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
        >
          <div className="relative max-w-3xl max-h-[80vh]">
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-white text-black rounded-full w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </Modal>
      )}

      {/* Ghi chú */}
      <div>
        <p className="font-semibold text-[#002147]">* Ghi chú</p>
        <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">
          {selectedTicket.notes || "Không có ghi chú."}
        </p>
      </div>
    </div>
  );
};

// Component ProgressTab
interface ProgressTabProps {
  selectedTicket: Ticket;
  rating: number;
  setRating: (rating: number) => void;
  review: string;
  setReview: (review: string) => void;
  handleFeedback: () => Promise<void>;
  selectedBadges: string[];
  setSelectedBadges: (badges: string[]) => void;
  handleReopenTicket: () => Promise<void>;
  handleFeedbackAndClose: () => Promise<void>;
  handleCancelTicket: () => Promise<void>;
  handleUrgent: () => Promise<void>;
  setShowCancelModal: (show: boolean) => void;
}

const ProgressTab: React.FC<ProgressTabProps> = ({
  selectedTicket,
  rating,
  setRating,
  review,
  setReview,
  handleFeedback,
  selectedBadges,
  setSelectedBadges,
  handleReopenTicket,
  handleFeedbackAndClose,
  handleCancelTicket,
  handleUrgent,
  setShowCancelModal,
}) => {
  const availableBadges = [
    "Chuyên nghiệp",
    "Nhanh chóng",
    "Tận tâm",
    "Hiệu quả",
    "Thân thiện",
  ];

  const toggleBadge = (badge: string) => {
    if (selectedBadges.includes(badge)) {
      setSelectedBadges(selectedBadges.filter((b) => b !== badge));
    } else {
      setSelectedBadges([...selectedBadges, badge]);
    }
  };

  return (
    <div className="w-full h-full p-4 flex flex-col gap-4 overflow-y-auto">
      {/* Trạng thái hiện tại */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-[#002147] mb-2">Trạng thái hiện tại</h3>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedTicket.status === "Processing"
                ? "bg-yellow-100 text-yellow-800"
                : selectedTicket.status === "Done"
                ? "bg-green-100 text-green-800"
                : selectedTicket.status === "Closed"
                ? "bg-gray-100 text-gray-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {selectedTicket.status === "Open"
              ? "Chưa nhận"
              : selectedTicket.status === "Processing"
              ? "Đang xử lý"
              : selectedTicket.status === "Assigned"
              ? "Đã nhận"
              : selectedTicket.status === "Done"
              ? "Hoàn thành"
              : selectedTicket.status === "Closed"
              ? "Đóng"
              : selectedTicket.status}
          </span>
        </div>
      </div>

      {/* Đánh giá và phản hồi */}
      {selectedTicket.status === "Done" && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-[#002147] mb-3">
            Ticket đã hoàn thành - Vui lòng đánh giá
          </h3>
          
          {/* Rating stars */}
          <div className="flex items-center justify-center mb-4">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={`text-3xl mx-1 cursor-pointer ${
                  i < rating ? "text-yellow-400" : "text-gray-300"
                }`}
                onClick={() => setRating(i + 1)}
              />
            ))}
          </div>

          {/* Badges */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Chọn đánh giá (tùy chọn):</p>
            <div className="flex flex-wrap gap-2">
              {availableBadges.map((badge) => (
                <button
                  key={badge}
                  onClick={() => toggleBadge(badge)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedBadges.includes(badge)
                      ? "bg-[#FF5733] text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {badge}
                </button>
              ))}
            </div>
          </div>

          {/* Review textarea */}
          <textarea
            className="w-full p-3 border rounded-lg resize-none mb-4"
            rows={3}
            placeholder="Nhận xét của bạn về dịch vụ..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleFeedbackAndClose}
              className="flex-1 px-4 py-2 bg-[#FF5733] text-white rounded-lg font-semibold hover:bg-[#E64A2E]"
            >
              Đánh giá & Đóng ticket
            </button>
            <button
              onClick={handleReopenTicket}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600"
            >
              Yêu cầu mở lại
            </button>
          </div>
        </div>
      )}

      {/* Lịch sử xử lý */}
      <div>
        <h3 className="font-semibold text-[#002147] mb-2">Lịch sử xử lý</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">
              {new Date(selectedTicket.createdAt).toLocaleString("vi-VN")} - Ticket được tạo
            </span>
          </div>
          {selectedTicket.assignedTo && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">
                Được phân công cho {selectedTicket.assignedTo.fullname}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">
              {new Date(selectedTicket.updatedAt).toLocaleString("vi-VN")} - Cập nhật gần nhất
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail; 
import React, { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import { FaCommentDots } from "react-icons/fa6";
import { FRAPPE_API_URL } from "../../../../config/api";
import TechnicalRating from "../Admin/TechnicalRating";
import TicketChat from "./TicketChat";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface User {
  _id: string;
  id: string;
  fullname: string;
  email: string;
  avatarUrl?: string;
  jobTitle?: string;
  badges?: Record<string, number>;
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

interface SubTask {
  _id: string;
  title: string;
  status: string;
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
  history?: Array<{ action: string }>;
  subTasks?: Array<SubTask>;
  cancellationReason?: string;
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
    <Card className="w-full h-full flex flex-row gap-4 p-6 min-h-0">
      {/* CỘT TRÁI - HIỂN THỊ TAB */}
      <div className="flex flex-col w-3/4 h-full min-h-0">
        <CardHeader className="p-0 pb-3 flex-shrink-0">
          <CardTitle className="text-2xl text-[#002147]">
            {selectedTicket.title || "Chưa có tiêu đề"}
          </CardTitle>
        </CardHeader>
        
        {/* Custom Tab Navigation */}
        <div className="w-full border-b border-gray-200 flex-shrink-0">
          <div className="flex space-x-8">
            <button
              onClick={() => setDetailTab("request")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                detailTab === "request"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Yêu cầu
            </button>
            <button
              onClick={() => setDetailTab("progress")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                detailTab === "progress"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Tiến trình
            </button>
            <button
              onClick={() => setDetailTab("discussion")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                detailTab === "discussion"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Trao đổi
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-hidden mt-4 min-h-0">
          <div className="h-full overflow-y-auto">
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
                selectedBadges={selectedBadges}
                setSelectedBadges={setSelectedBadges}
                handleReopenTicket={handleReopenTicket}
                handleFeedbackAndClose={handleFeedbackAndClose}
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
      <div className="w-1/4 h-full overflow-y-auto flex-shrink-0 border rounded-2xl p-4 min-h-0">
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
                    src={`${FRAPPE_API_URL}/api/tickets/uploads/Avatar/${selectedTicket.assignedTo?.avatarUrl}`}
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
              {/* Nếu đã đánh giá (đã có rating) => hiển thị đánh giá dưới dạng chỉ đọc */}
              {selectedTicket.feedback?.rating ? (
                <div>
                  {/* Hiển thị số sao (chỉ đọc) */}
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

                  {/* Comment (chỉ đọc) */}
                  <textarea
                    placeholder="Hãy viết nhận xét của bạn..."
                    value={review}
                    disabled
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed resize-none"
                    rows={3}
                  />

                  {/* Huy hiệu (chỉ xem) */}
                  <div className="flex flex-wrap gap-2 my-2">
                    {[
                      "Nhiệt Huyết",
                      "Chu Đáo",
                      "Vui Vẻ",
                      "Tận Tình",
                      "Chuyên Nghiệp",
                    ].map((badge) => {
                      const isSelected = selectedBadges?.includes(badge);
                      return (
                        <span
                          key={badge}
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            isSelected
                              ? "bg-[#002855] text-white"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {badge}
                        </span>
                      );
                    })}
                  </div>

                  {/* Nút "Đã đánh giá" (chỉ đọc) */}
                  <div className="flex items-center justify-center">
                    <button
                      disabled
                      className="mt-2 px-3 py-1 bg-gray-300 text-white text-sm font-semibold rounded-lg transition w-full cursor-not-allowed"
                    >
                      Đã đánh giá
                    </button>
                  </div>
                </div>
              ) : (
                /* Chưa đánh giá => cho phép người dùng đánh giá */
                <div>
                  <h3 className="font-semibold mb-2">Đánh giá dịch vụ</h3>
                  {/* Dải sao (clickable) */}
                  <div className="flex items-center justify-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        onClick={() => setRating(i + 1)} // Cho phép click để setRating
                        className={`cursor-pointer text-3xl mx-1 ${
                          i < rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Textarea nhập nhận xét (có thể chỉnh sửa) */}
                  <textarea
                    placeholder="Nhận xét của bạn..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none"
                    rows={3}
                  />

                  {/* Chọn huy hiệu */}
                  <div className="flex flex-wrap gap-2 my-2">
                    {[
                      "Nhiệt Huyết",
                      "Chu Đáo",
                      "Vui Vẻ",
                      "Tận Tình",
                      "Chuyên Nghiệp",
                    ].map((badge) => {
                      const isSelected = selectedBadges?.includes(badge);
                      return (
                        <span
                          key={badge}
                                                     onClick={() => {
                             if (isSelected) {
                               setSelectedBadges(selectedBadges.filter((b: string) => b !== badge));
                             } else {
                               setSelectedBadges([...selectedBadges, badge]);
                             }
                           }}
                          className={`cursor-pointer text-xs font-semibold px-3 py-1 rounded-full ${
                            isSelected
                              ? "bg-[#002855] text-white"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {badge}
                        </span>
                      );
                    })}
                  </div>

                  {/* Nút Gửi đánh giá */}
                  <div className="flex items-center justify-center">
                    <button
                      onClick={handleFeedback}
                      className="mt-2 px-3 py-1 bg-[#002855] text-white text-sm font-semibold rounded-lg transition w-full hover:bg-[#001a3d]"
                    >
                      Gửi đánh giá
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
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
                src={`${FRAPPE_API_URL}/api/tickets/uploads/Tickets/${item.url}`}
                alt={item.filename || `attachment-${index}`}
                onClick={() =>
                  setPreviewImage(`${FRAPPE_API_URL}/api/tickets/uploads/Tickets/${item.url}`)
                }
                className="w-[120px] h-[120px] object-cover rounded-lg border shadow-sm cursor-pointer"
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Không có ảnh đính kèm.</p>
        )}
      </div>

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] p-0">
          <div className="relative">
            <img
              src={previewImage || ""}
              alt="Preview"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <Button
              onClick={() => setPreviewImage(null)}
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 bg-white text-black rounded-full w-8 h-8"
            >
              ×
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
  selectedBadges: string[];
  setSelectedBadges: (badges: string[]) => void;
  handleReopenTicket: () => Promise<void>;
  handleFeedbackAndClose: () => Promise<void>;
}

const ProgressTab: React.FC<ProgressTabProps> = ({
  selectedTicket,
  rating,
  setRating,
  review,
  setReview,
  selectedBadges,
  setSelectedBadges,
  handleReopenTicket,
  handleFeedbackAndClose,
}) => {
  const [doneOption, setDoneOption] = useState<string | null>(null);

  const statuses = [
    { key: "Assigned", label: "Đã tiếp nhận", icon: "/ticket/tickets.svg" },
    { key: "Processing", label: "Đang xử lý", icon: "/ticket/processing.svg" },
    { key: "Done", label: "Hoàn thành", icon: "/ticket/done.svg" },
    { key: "Cancelled", label: "Hủy", icon: "/ticket/cancelled.svg" },
  ];

  const availableBadges = [
    "Nhiệt Huyết",
    "Chu Đáo", 
    "Vui Vẻ",
    "Tận Tình",
    "Chuyên Nghiệp",
  ];

  const toggleBadge = (badge: string) => {
    if (selectedBadges.includes(badge)) {
      setSelectedBadges(selectedBadges.filter((b) => b !== badge));
    } else {
      setSelectedBadges([...selectedBadges, badge]);
    }
  };

  return (
    <div className="bg-white w-full p-4 flex gap-6">
      {/* Cột trái: danh sách trạng thái */}
      <div className="flex flex-col gap-3 w-1/4">
        {statuses.map((s, index) => {
          const currentIndex = statuses.findIndex(
            (item) => item.key === selectedTicket.status
          );

          let bgColor = "bg-gray-100";
          let textColor = "text-gray-500";
          let iconFilter = "brightness(0) saturate(100%) invert(50%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(110%) contrast(90%)"; // gray-400

          // Xác định màu sắc dựa trên trạng thái
          if (selectedTicket.status === "Cancelled" && s.key === "Cancelled") {
            bgColor = "bg-red-50";
            textColor = "text-red-600";
            iconFilter = "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)"; // red-600
          } else if (index < currentIndex) {
            bgColor = "bg-green-50";
            textColor = "text-green-700";
            iconFilter = "brightness(0) saturate(100%) invert(29%) sepia(65%) saturate(834%) hue-rotate(92deg) brightness(94%) contrast(101%)"; // green-700
          } else if (index === currentIndex) {
            if (s.key === "Processing") {
              bgColor = "bg-yellow-50";
              textColor = "text-yellow-500";
              iconFilter = "brightness(0) saturate(100%) invert(62%) sepia(98%) saturate(1151%) hue-rotate(2deg) brightness(97%) contrast(103%)"; // yellow-700
            } else {
              bgColor = "bg-yellow-50";
              textColor = "text-yellow-500";
              iconFilter = "brightness(0) saturate(100%) invert(62%) sepia(98%) saturate(1151%) hue-rotate(2deg) brightness(97%) contrast(103%)"; // yellow-700
            }
          }

          return (
            <div
              key={s.key}
              className={`flex items-center gap-3 py-5 px-4 rounded-lg ${bgColor} transition-colors`}
            >
              <div>
                <img 
                  src={s.icon} 
                  alt={s.label} 
                  className="w-5 h-5" 
                  style={{ filter: iconFilter }}
                />
              </div>
              <span className={`font-semibold text-sm ${textColor}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cột phải: hiển thị khác nhau theo status */}
      <div className="w-full p-6 border rounded-xl space-y-2 h-fit">
        {selectedTicket.status === "Assigned" && (
          <div>
            <p className="text-sm text-[#757575] mb-2">Người tiếp nhận</p>
            <div className="flex items-center gap-4">
                  <img
                    src={`${FRAPPE_API_URL}/api/tickets/uploads/Avatar/${selectedTicket.assignedTo?.avatarUrl || 'default.png'}`}
                alt="Avatar"
                className="w-16 h-16 rounded-xl object-cover border"
              />
              <div className="flex flex-col">
                <p className="text-base font-semibold text-[#002147]">
                  {selectedTicket.assignedTo?.fullname || "Chưa có"}
                </p>
                <p className="text-xs text-gray-400">
                  {selectedTicket.assignedTo?.jobTitle === "technical"
                    ? "Kỹ thuật viên"
                    : selectedTicket.assignedTo?.jobTitle || ""}
                </p>
                <TechnicalRating technicalId={selectedTicket.assignedTo?._id || ''} />
              </div>
            </div>

            {/* Hiển thị huy hiệu và số lượng */}
            {selectedTicket.assignedTo?.badges &&
              Object.keys(selectedTicket.assignedTo.badges).length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-[#757575] mb-1 font-semibold">
                    Huy hiệu được đánh giá
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedTicket.assignedTo.badges).map(
                      ([badge, count]) => (
                        <span
                          key={badge}
                          className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium"
                        >
                          {badge} ({count})
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        )}

        {selectedTicket.status === "Processing" && (
          <>
            {selectedTicket.subTasks && selectedTicket.subTasks.length > 0 ? (
              <>
                <p className="text-sm text-[#757575] mb-2 font-semibold">
                  Ticket đang được xử lý. Vui lòng chờ kĩ thuật viên hoàn thành
                  các hạng mục sau
                </p>
                {selectedTicket.subTasks.map((task: SubTask, i: number) => {
                  const isCompleted = task.status === "Completed";
                  const isCancelled = task.status === "Cancelled";

                  let displayStatus = task.status;
                  let bg = "";
                  let textColor = "";

                  if (isCompleted) {
                    bg = "bg-[#E4EFE6]";
                    textColor = "text-[#009483]";
                    displayStatus = "Hoàn thành";
                  } else if (isCancelled) {
                    bg = "bg-[#EBEBEB] line-through";
                    textColor = "text-[#757575]";
                    displayStatus = "Hủy";
                  } else {
                    if (
                      selectedTicket.subTasks?.filter(
                        (t: SubTask) =>
                          t.status !== "Completed" && t.status !== "Cancelled"
                      )[0]?._id === task._id
                    ) {
                      bg = "bg-[#E6EEF6]";
                      textColor = "text-[#002855]";
                      displayStatus = "Đang làm";
                    } else {
                      bg = "bg-[#EBEBEB]";
                      textColor = "text-[#757575]";
                      displayStatus = "Chờ xử lý";
                    }
                  }

                  return (
                    <div
                      key={i}
                      className={`flex justify-between items-center px-4 py-3 rounded-lg mb-2 text-sm font-bold ${bg} ${textColor}`}
                    >
                      <span>{task.title}</span>
                      <span>{displayStatus}</span>
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="text-sm text-[#757575] mb-2 font-semibold">
                Ticket đang được xử lý, vui lòng chờ.
              </p>
            )}
          </>
        )}

        {/* Phần hiển thị khi ticket bị huỷ */}
        {selectedTicket.status === "Cancelled" && (
          <div className="space-y-4">
            <div className="bg-orange-red bg-opacity-10 p-4 rounded-xl">
              <p className="text-red-500 font-bold mb-2">Lý do huỷ ticket:</p>
              <p className="text-red-500">
                {selectedTicket.cancellationReason}
              </p>
            </div>
          </div>
        )}

        {/* Phần Done */}
        {selectedTicket.status === "Done" && (
          <div className="space-y-4">
            <p className="text-sm text-[#757575] font-semibold">
              Yêu cầu đã được xử lý xong. Vui lòng nhận kết quả và kiểm tra chất
              lượng phục vụ
            </p>

            {/* Chọn kết quả */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="doneOption"
                  value="accepted"
                  checked={doneOption === "accepted"}
                  onChange={(e) => setDoneOption(e.target.value)}
                  className="form-radio text-[#002855]"
                />
                <span className="text-base font-semibold text-[#002855]">
                  Chấp nhận kết quả
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="doneOption"
                  value="rejected"
                  checked={doneOption === "rejected"}
                  onChange={(e) => setDoneOption(e.target.value)}
                  className="form-radio text-[#002855]"
                />
                <span className="text-base font-semibold text-[#757575]">
                  Chưa đạt yêu cầu, cần xử lý lại
                </span>
              </label>
            </div>

            {/* Nếu chọn "Chấp nhận kết quả" thì hiển thị bảng feedback */}
            {doneOption === "accepted" && (
              <div className="w-[50%] mx-auto pt-5 space-y-4">
                {/* Dải sao */}
                <div className="flex items-center justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`cursor-pointer text-3xl mx-1 ${
                        i < rating ? "text-yellow-400" : "text-gray-300"
                      }`}
                      onClick={() => setRating(i + 1)}
                    />
                  ))}
                </div>

                {/* Textarea review */}
                <textarea
                  placeholder="Hãy viết nhận xét của bạn"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  rows={4}
                />

                {/* Chọn huy hiệu */}
                <div className="flex flex-wrap gap-2 my-2">
                  {availableBadges.map((badge) => {
                    const isSelected = selectedBadges?.includes(badge);
                    return (
                      <span
                        key={badge}
                        onClick={() => toggleBadge(badge)}
                        className={`cursor-pointer text-xs font-semibold px-3 py-1 rounded-full ${
                          isSelected
                            ? "bg-[#002855] text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {badge}
                      </span>
                    );
                  })}
                </div>

                {/* Nút gửi feedback */}
                <div className="flex items-center justify-center">
                  <button
                    onClick={handleFeedbackAndClose}
                    className="mt-2 px-6 py-2 bg-[#FF5733] text-white rounded-lg text-sm font-semibold"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            )}

            {/* Nếu chọn "Chưa đạt yêu cầu, cần xử lý lại" thì hiển thị nút mở lại ticket */}
            {doneOption === "rejected" && (
              <div className="flex items-center justify-center pt-5">
                <button
                  onClick={handleReopenTicket}
                  className="px-6 py-2 bg-[#FF5733] text-white rounded-lg text-sm font-semibold"
                >
                  Mở lại ticket
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetail; 
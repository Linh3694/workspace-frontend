import React, { useState, useEffect } from "react";
import axios from "axios";
import { TICKETS_API_URL, FRAPPE_API_URL } from "../../../../config/api";
import { toast } from "sonner";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";

import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import TicketChat from "../User/TicketChat";
import TechnicalRating from "./TechnicalRating";
import type {
  User,
  Ticket,
  TicketStatus,
  TabType,
  StatusOption,
  TechnicalUsersResponse,
  UpdateTicketResponse,
} from "../types";

interface TicketAdminModalProps {
  ticket: Ticket;
  currentUser: User | null;
  onClose: () => void;
  fetchTicketById: (id: string) => Promise<void>;
}

const TicketAdminModal: React.FC<TicketAdminModalProps> = ({
  ticket,
  currentUser,
  onClose,
  fetchTicketById,
}) => {
  const [detailTab, setDetailTab] = useState<TabType>("request");
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>(ticket.status);

  // State cho swap
  const [showSwapModal, setShowSwapModal] = useState<boolean>(false);
  const [swapUserId, setSwapUserId] = useState<string>("");

  // Danh sách technical user
  const [technicalUsers, setTechnicalUsers] = useState<User[]>([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    setTicketStatus(ticket.status);
  }, [ticket.status]);

  useEffect(() => {
    fetchTechnicalUsers();
  }, []);

  const fetchTechnicalUsers = async (): Promise<void> => {
    try {
      const res = await axios.get<TechnicalUsersResponse>(`${TICKETS_API_URL}/support-team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setTechnicalUsers(res.data.members);
      }
    } catch (error) {
      console.error("Lỗi fetch technical users:", error);
    }
  };

  const handleSwapUser = async (): Promise<void> => {
    if (!swapUserId) {
      toast.warning("Vui lòng chọn người thực hiện mới!");
      return;
    }
    try {
      const res = await axios.put<UpdateTicketResponse>(
        `${TICKETS_API_URL}/${ticket._id}`,
        {
          assignedTo: swapUserId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        toast.success("Đã đổi người thực hiện!");
        setShowSwapModal(false);
        await fetchTicketById(ticket._id);
      } else {
        toast.error("Không thể đổi người thực hiện.");
      }
    } catch (error) {
      console.error("Lỗi swap user:", error);
      toast.error("Lỗi swap user.");
    }
  };

  // Component RequestTab
  const RequestTab: React.FC = () => {
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    return (
      <div className="w-full h-full p-4 flex flex-col gap-3 overflow-y-auto">
        {/* Mô tả chi tiết */}
        <div className="pb-4">
          <p className="font-semibold text-[#002147]">Mô tả chi tiết</p>
          <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">
            {ticket.description || "Không có mô tả chi tiết."}
          </p>
        </div>

        {/* Ảnh đính kèm */}
        <div className="pb-4">
          <p className="font-semibold text-[#002147] mb-2">Ảnh đính kèm</p>
          {ticket.attachments && ticket.attachments.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto">
              {ticket.attachments.map((item, index) => (
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

        {previewImage && (
          <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] p-0">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Ghi chú */}
        <div>
          <p className="font-semibold text-[#002147]">* Ghi chú</p>
          <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">
            {ticket.notes || "Không có ghi chú."}
          </p>
        </div>
      </div>
    );
  };

  // Component ProgressTab
  const ProgressTab: React.FC = () => {
    // Các trạng thái ticket khả dụng
    const statusOptions: StatusOption[] = [
      { value: "Processing", label: "Đang xử lý", bg: "bg-[#F5AA1E]" },
      { value: "Done", label: "Hoàn thành", bg: "bg-green-500" },
      { value: "Cancelled", label: "Đã huỷ", bg: "bg-orange-red" },
    ];

    // Bản sao cục bộ của ticket
    const [localTicket, setLocalTicket] = useState<Ticket>(ticket);
    const [localTicketStatus, setLocalTicketStatus] = useState<TicketStatus>(ticket.status);

    // Trạng thái cho việc nhập subtask
    const [showAddSubTask, setShowAddSubTask] = useState<boolean>(false);
    const [newSubTaskTitle, setNewSubTaskTitle] = useState<string>("");

    // Trạng thái cho việc nhập lý do huỷ
    const [showCancelReasonInput, setShowCancelReasonInput] = useState<boolean>(false);
    const [cancelReasonLocal, setCancelReasonLocal] = useState<string>("");

    // Hàm cập nhật trạng thái ticket
    const handleUpdateStatus = async (newStatus: TicketStatus, cancelReasonParam = ""): Promise<void> => {
      try {
        const payload: { status: TicketStatus; cancelReason?: string } = { status: newStatus };
        if (newStatus === "Cancelled" && cancelReasonParam) {
          payload.cancelReason = cancelReasonParam;
        }

        const res = await axios.put<UpdateTicketResponse>(
          `${TICKET_API_URL}/tickets/${ticket._id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.data.success) {
          toast.success("Cập nhật trạng thái thành công!");
          setLocalTicketStatus(newStatus);
          await fetchTicketById(ticket._id);
        } else {
          toast.error("Không thể cập nhật trạng thái.");
        }
      } catch (error) {
        console.error("Lỗi cập nhật trạng thái:", error);
        toast.error("Lỗi cập nhật trạng thái.");
      }
    };

    // Hàm cập nhật trạng thái subtask
    const handleUpdateSubTaskStatus = async (subTaskId: string, newStatus: string) => {
      try {
        const res = await axios.put(
          `${TICKETS_API_URL}/${ticket._id}/subtasks/${subTaskId}`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          toast.success("Cập nhật subtask thành công!");
          // Cập nhật localTicket ngay (optimistic update)
          setLocalTicket((prev) => ({
            ...prev,
            subTasks: prev.subTasks.map((task) =>
              task._id === subTaskId ? { ...task, status: newStatus as "In Progress" | "Completed" | "Cancelled" } : task
            ),
          }));
          await fetchTicketById(ticket._id);
        } else {
          toast.error("Không thể cập nhật subtask.");
        }
      } catch (error) {
        console.error("Lỗi cập nhật subtask:", error);
        toast.error("Lỗi cập nhật subtask.");
      }
    };

    // Hàm thêm subtask
    const handleAddSubTask = async () => {
      if (!newSubTaskTitle.trim()) {
        toast.warning("Tiêu đề subtask không được để trống.");
        return;
      }
      try {
        const res = await axios.post(
          `${TICKETS_API_URL}/${ticket._id}/subtasks`,
          {
            title: newSubTaskTitle,
            assignedTo: currentUser?.fullname,
            status: "In Progress",
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          toast.success("Thêm subtask thành công!");
          const updated = res.data.ticket;
          setLocalTicket(updated);
          setNewSubTaskTitle("");
          setShowAddSubTask(false);
        } else {
          toast.error("Không thể thêm subtask.");
        }
      } catch (error) {
        console.error("Lỗi thêm subtask:", error);
        toast.error("Lỗi thêm subtask.");
      }
    };

    return (
      <div className="p-4 space-y-3 overflow-auto">
        {/* PHẦN CHỌN TRẠNG THÁI TICKET */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base font-semibold">Trạng thái: </span>
          <Select
            value={localTicketStatus}
            onValueChange={(newStatus: TicketStatus) => {
              if (newStatus !== localTicketStatus) {
                // Chặn Processing -> Done nếu còn subtask In Progress
                if (
                  localTicketStatus === "Processing" &&
                  newStatus === "Done"
                ) {
                  const pendingSubtasks = localTicket.subTasks.filter(
                    (task) => task.status === "In Progress"
                  );
                  if (pendingSubtasks.length > 0) {
                    toast.error(
                      "Bạn cần xử lý hết các subtask trước khi chuyển sang trạng thái Hoàn thành."
                    );
                    return;
                  }
                }
                // Nếu chọn hủy, mở ô nhập lý do
                if (newStatus === "Cancelled") {
                  setShowCancelReasonInput(true);
                  return;
                }
                // Còn lại (chọn Processing hoặc Done trực tiếp)
                handleUpdateStatus(newStatus);
                setLocalTicketStatus(newStatus);
              }
            }}
          >
            <SelectTrigger className={`w-auto font-semibold text-white border-none rounded-full ${
              statusOptions.find((opt) => opt.value === localTicketStatus)?.bg
            }`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ô NHẬP LÝ DO HỦY */}
        {showCancelReasonInput && (
          <div className="mt-3 space-y-3">
            <Textarea
              value={cancelReasonLocal}
              onChange={(e) => setCancelReasonLocal(e.target.value)}
              placeholder="Nhập lý do huỷ ticket..."
              className="bg-[#EBEBEB] border-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  if (!cancelReasonLocal.trim()) {
                    toast.error("Vui lòng nhập lý do huỷ.");
                    return;
                  }
                  await handleUpdateStatus("Cancelled", cancelReasonLocal);
                  setLocalTicketStatus("Cancelled");
                  setShowCancelReasonInput(false);
                }}
              >
                Xác nhận
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCancelReasonLocal("");
                  setShowCancelReasonInput(false);
                }}
              >
                Huỷ bỏ
              </Button>
            </div>
          </div>
        )}

        {localTicketStatus === "Cancelled" &&
          localTicket?.cancellationReason && (
            <div className="bg-orange-red bg-opacity-10 p-3 rounded-xl mt-3">
              <p className="text-red-500 font-bold">Lý do huỷ ticket:</p>
              <p className="text-red-500 font-semibold">
                {localTicket.cancellationReason}
              </p>
            </div>
          )}

        {/* DANH SÁCH SUBTASK */}
        <div className="w-full flex flex-row items-start justify-start gap-2">
          <div className="w-2/3 p-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold">Danh sách công việc</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddSubTask(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                + Việc
              </Button>
            </div>

            {/* Form thêm subtask */}
            {showAddSubTask && (
              <div className="flex items-center gap-2 mb-2">
                <Input
                  type="text"
                  placeholder="Thêm việc cần làm"
                  value={newSubTaskTitle}
                  onChange={(e) => setNewSubTaskTitle(e.target.value)}
                  className="bg-[#EBEBEB] border-none flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleAddSubTask}
                  className="bg-[#002855] hover:bg-[#002855]/90"
                >
                  Thêm
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setShowAddSubTask(false);
                    setNewSubTaskTitle("");
                  }}
                >
                  Hủy
                </Button>
              </div>
            )}

            {/* Liệt kê subtask */}
            {localTicket.subTasks && localTicket.subTasks.length > 0 ? (
              localTicket.subTasks.map((task) => {
                let bg = "";
                let textColor = "";

                // Xác định subtask đầu tiên "In Progress"
                const inProgressTasks = localTicket.subTasks.filter(
                  (t) => t.status === "In Progress"
                );
                const isFirstInProgress =
                  inProgressTasks.length > 0 &&
                  inProgressTasks[0]._id === task._id;

                if (task.status === "Completed") {
                  bg = "bg-[#E4EFE6]";
                  textColor = "text-[#009483]";
                } else if (task.status === "Cancelled") {
                  bg = "bg-[#EBEBEB] line-through";
                  textColor = "text-[#757575]";
                } else if (task.status === "In Progress") {
                  if (isFirstInProgress) {
                    bg = "bg-[#E6EEF6]";
                    textColor = "text-[#002855]";
                  } else {
                    bg = "bg-[#EBEBEB]";
                    textColor = "text-[#757575]";
                  }
                }

                return (
                  <div
                    key={task._id}
                    className={`flex justify-between items-center px-4 py-2 rounded-lg mb-2 text-sm font-bold ${bg} ${textColor}`}
                  >
                    <span>{task.title}</span>
                    <div className="flex items-center gap-3">
                      {/* Dropdown để đổi trạng thái subtask */}
                      <Select
                        disabled={localTicketStatus === "Cancelled"}
                        value={task.status}
                        onValueChange={(value) =>
                          handleUpdateSubTaskStatus(task._id, value)
                        }
                      >
                        <SelectTrigger className={`w-auto border-none text-right text-sm shadow-none ${textColor} h-fit p-0`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="In Progress">
                            {isFirstInProgress ? "Đang xử lý" : "Chờ xử lý"}
                          </SelectItem>
                          <SelectItem value="Completed">Hoàn thành</SelectItem>
                          <SelectItem value="Cancelled">Hủy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-600">
                Không có sub-task nào cho ticket này.
              </p>
            )}
          </div>

          {/* BẢNG LỊCH SỬ THAY ĐỔI */}
          <div className="w-1/3 border-l pl-4">
            <h3 className="text-base font-semibold mb-2">Lịch sử</h3>
            {localTicket.history && localTicket.history.length > 0 ? (
              <div className="space-y-2">
                {[...localTicket.history].reverse().map((log, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-gray-700"
                    dangerouslySetInnerHTML={{ __html: log.action }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Chưa có lịch sử thay đổi cho ticket này.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Hàm xử lý huỷ ticket
  const handleCancelTicketLocal = async () => {
    if (!cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do huỷ ticket.");
      return;
    }
    try {
      const res = await axios.put(
        `${TICKETS_API_URL}/${ticket._id}`,
        { status: "Cancelled", cancellationReason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Ticket đã được huỷ.");
        setShowCancelModal(false);
        setCancelReason("");
        await fetchTicketById(ticket._id);
      } else {
        toast.error("Lỗi khi huỷ ticket.");
      }
    } catch (error) {
      console.error("Error cancelling ticket:", error);
      toast.error("Lỗi khi huỷ ticket.");
    }
  };

  // Hàm nhận ticket
  const handleAcceptTicket = async () => {
    try {
      const res = await axios.put(
        `${TICKETS_API_URL}/${ticket._id}`,
        {
          status: "Processing",
          assignedTo: currentUser?.id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        toast.success("Đã nhận ticket. Chuyển sang trạng thái Đang xử lý.");
        await fetchTicketById(ticket._id);
      } else {
        toast.error("Không thể nhận ticket.");
      }
    } catch (error) {
      console.error("Lỗi khi nhận ticket:", error);
      toast.error("Lỗi khi nhận ticket.");
    }
  };

  // Hàm lấy thông tin trạng thái
  const getStatusInfo = (status: string) => {
    const statusMapping: Record<string, { label: string; bg: string }> = {
      Processing: {
        label: "Đang xử lý",
        bg: "bg-[#F5AA1E] text-white",
      },
      Done: {
        label: "Hoàn thành",
        bg: "bg-green-500 text-white",
      },
      Cancelled: {
        label: "Đã huỷ",
        bg: "bg-orange-red text-white",
      },
      Closed: { label: "Đóng", bg: "bg-[#3DB838] text-white" },
      Assigned: {
        label: "Đã nhận",
        bg: "bg-[#002855] text-white",
      },
      "Waiting for Customer": {
        label: "Chờ phản hồi",
        bg: "bg-orange-500 text-white",
      },
      Open: { label: "Chưa nhận", bg: "bg-gray-600 text-white" },
    };
    return statusMapping[status] || { label: status || "N/A", bg: "bg-gray-300 text-black" };
  };

  const statusInfo = getStatusInfo(ticketStatus);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="min-w-[70vw] max-h-[90vh] p-0" showCloseButton={false}>
        <div className="flex flex-row gap-6 h-[85vh]">
          {/* CỘT TRÁI */}
          <div className="flex flex-col w-3/4 p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold text-[#002147]">
                {ticket.ticketCode}: {ticket.title || "N/A"}
              </DialogTitle>
            </DialogHeader>

            {/* Tabs */}
            <div className="flex gap-6 border-b">
              <button
                onClick={() => setDetailTab("request")}
                className={`pb-2 ${
                  detailTab === "request"
                    ? "text-[#FF5733] border-b-4 border-[#FF5733]"
                    : "text-[#757575]"
                }`}
              >
                Yêu cầu
              </button>
              {ticket.status !== "Assigned" && (
                <>
                  <button
                    onClick={() => setDetailTab("progress")}
                    className={`pb-2 ${
                      detailTab === "progress"
                        ? "text-[#FF5733] border-b-4 border-[#FF5733]"
                        : "text-[#757575]"
                    }`}
                  >
                    Tiến trình
                  </button>
                  <button
                    onClick={() => setDetailTab("discussion")}
                    className={`pb-2 ${
                      detailTab === "discussion"
                        ? "text-[#FF5733] border-b-4 border-[#FF5733]"
                        : "text-[#757575]"
                    }`}
                  >
                    Trao đổi
                  </button>
                </>
              )}
            </div>

            {/* Nội dung Tab */}
            <div className="flex-1 overflow-hidden mt-3">
              <div className="h-full max-h-full overflow-y-hidden hover:overflow-y-auto">
                {detailTab === "request" && <RequestTab />}
                {detailTab === "progress" && <ProgressTab />}
                {detailTab === "discussion" && (
                  <TicketChat
                    ticket={ticket}
                    currentUser={currentUser}
                    fetchTicketById={fetchTicketById}
                  />
                )}
              </div>
            </div>
          </div>

        {/* CỘT PHẢI - THÔNG TIN TICKET */}
        <Card className="w-1/4 flex-shrink-0 my-6 mx-6">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#002147] flex items-center gap-2">
              <div className="w-2 h-2 bg-[#FF5733] rounded-full"></div>
              Thông tin Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mã yêu cầu</p>
                <p className="text-lg font-bold text-[#002147] mt-1">
                  {ticket.ticketCode || "N/A"}
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Loại yêu cầu</p>
                  <p className="text-sm font-semibold mt-1">
                    {ticket.type || "N/A"}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trạng thái</p>
                  <Badge variant="secondary" className={`${statusInfo.bg} mt-1 font-semibold`}>
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Timeline Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-[#002147] mb-3">Thời gian</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">Ngày tạo</p>
                  <p className="text-sm font-medium">
                    {ticket.createdAt
                      ? new Date(ticket.createdAt).toLocaleDateString("vi-VN")
                      : "N/A"}
                  </p>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className="text-sm font-medium text-orange-600">
                    {new Date(ticket.sla).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Người tạo</p>
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="w-12 h-12">
                   <AvatarImage 
                    src={`${FRAPPE_API_URL}/api/tickets/uploads/Avatar/${ticket.creator?.avatarUrl}`}
                    alt={ticket.creator?.fullname || "Avatar"}
                    className="object-cover object-top"
                  />
                  <AvatarFallback>
                    {ticket.creator?.fullname?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">
                    {ticket.creator?.fullname || "Chưa có"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.creator?.jobTitle === "technical"
                      ? "Kỹ thuật viên"
                      : ticket.creator?.jobTitle || ""}
                  </p>
                </div>
              </div>
            </div>
            
            {(ticket.status === "Assigned" ||
              ticket.status === "Processing" ||
              ticket.status === "Done" ||
              ticket.status === "Cancelled" ||
              ticket.status === "Closed") && ticket.assignedTo && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {ticket.status === "Assigned"
                    ? "Người được chỉ định"
                    : "Người thực hiện"}
                </p>
                <div className="flex items-center justify-between gap-2 mt-2">
                  <div className="flex gap-2">
                    <Avatar className="w-12 h-12">
                      <AvatarImage 
                        src={`${FRAPPE_API_URL}/api/tickets/uploads/Avatar/${ticket.assignedTo?.avatarUrl}`}
                        alt={ticket.assignedTo?.fullname || "Avatar"}
                        className="object-cover object-top"
                      />
                      <AvatarFallback>
                        {ticket.assignedTo?.fullname?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">
                        {ticket.assignedTo?.fullname || "Chưa có"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.assignedTo?.jobTitle === "technical"
                          ? "Kỹ thuật viên"
                          : ticket.assignedTo?.jobTitle || ""}
                      </p>
                      <TechnicalRating technicalId={ticket.assignedTo?._id} />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSwapModal(true)}
                  >
                    <FaArrowRightArrowLeft />
                  </Button>
                </div>
              </div>
            )}

            {/* Nút hành động cho ticket Assigned */}
            {ticket.status === "Assigned" && (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-[#002855] hover:bg-[#002855]/90"
                  onClick={handleAcceptTicket}
                >
                  Nhận Ticket
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setShowCancelModal(true)}
                >
                  Huỷ Ticket
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </DialogContent>

      {/* Modal Swap User */}
      {showSwapModal && (
        <Dialog open={showSwapModal} onOpenChange={setShowSwapModal}>
          <DialogContent className="max-w-sm w-[320px] p-4">
            <DialogHeader className="pb-3">
              <DialogTitle className="text-base font-semibold text-center">Đổi người thực hiện</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 flex flex-col items-center">
              <Select value={swapUserId} onValueChange={setSwapUserId}>
                <SelectTrigger className="h-9 text-sm w-full max-w-xs">
                  <SelectValue placeholder="Chọn người xử lý" />
                </SelectTrigger>
                <SelectContent>
                  {technicalUsers.map((u) => (
                    <SelectItem key={u._id} value={u._id} className="text-sm">
                      {u.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="w-full flex gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 text-sm"
                  onClick={() => {
                    setShowSwapModal(false);
                    setSwapUserId("");
                  }}
                >
                  Hủy
                </Button>
                <Button size="lg" className="flex-1 h-9 text-sm" onClick={handleSwapUser}>
                  Xác nhận
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Cancel Ticket */}
      {showCancelModal && (
        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Huỷ Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Nhập lý do huỷ ticket"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                >
                  Huỷ bỏ
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelTicketLocal}
                >
                  Xác nhận huỷ
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default TicketAdminModal; 
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiSearch } from "react-icons/fi";
import { FaFilter } from "react-icons/fa6";
import { API_URL } from "../../../core/config";
import { toast } from "react-toastify";

interface User {
  id: string;
  fullname: string;
  email: string;
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
}

interface TicketListProps {
  currentUser: User | null;
  onSelectTicket: (ticket: Ticket) => void;
  onCreateTicket: () => void;
}

const TicketList: React.FC<TicketListProps> = ({
  currentUser,
  onSelectTicket,
  onCreateTicket,
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const token = localStorage.getItem("authToken");

  // Fetch danh sách tickets của user
  const fetchUserTickets = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/tickets`;
      if (currentUser?.id) {
        url += `?creator=${currentUser.id}`;
      }
      if (filterStatus) {
        url += `${currentUser?.id ? "&" : "?"}status=${filterStatus}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setTickets(res.data.tickets || []);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách ticket:", error);
      toast.error("Không thể tải danh sách ticket");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUserTickets();
    }
  }, [currentUser, filterStatus]);

  // Lọc tickets theo search term
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Hàm lấy màu sắc cho status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800";
      case "Processing":
        return "bg-yellow-100 text-yellow-800";
      case "Assigned":
        return "bg-purple-100 text-purple-800";
      case "Done":
        return "bg-green-100 text-green-800";
      case "Closed":
        return "bg-gray-100 text-gray-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Hàm lấy màu sắc cho priority
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Low":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Hàm chuyển đổi status sang tiếng Việt
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Open":
        return "Chưa nhận";
      case "Processing":
        return "Đang xử lý";
      case "Assigned":
        return "Đã nhận";
      case "Done":
        return "Hoàn thành";
      case "Closed":
        return "Đóng";
      case "Cancelled":
        return "Đã huỷ";
      case "Waiting for Customer":
        return "Chờ phản hồi";
      default:
        return status;
    }
  };

  // Hàm chuyển đổi priority sang tiếng Việt
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "Low":
        return "Thấp";
      case "Medium":
        return "Trung bình";
      case "High":
        return "Cao";
      case "Urgent":
        return "Khẩn cấp";
      default:
        return priority;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5733]"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-xl p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#002147]">
          Danh sách ticket của tôi
        </h1>
        <button
          onClick={onCreateTicket}
          className="px-6 py-2 bg-[#FF5733] text-white rounded-lg font-semibold hover:bg-[#E64A2E] transition-colors"
        >
          Tạo ticket mới
        </button>
      </div>

      {/* Search và Filter */}
      <div className="flex gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề, mã ticket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
          />
        </div>

        {/* Filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FaFilter />
            Lọc trạng thái
          </button>
          
          {showFilterDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-2">
                <button
                  onClick={() => {
                    setFilterStatus("");
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                    filterStatus === "" ? "bg-[#FF5733] text-white" : ""
                  }`}
                >
                  Tất cả
                </button>
                {["Open", "Processing", "Assigned", "Done", "Closed", "Cancelled"].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setFilterStatus(status);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                      filterStatus === status ? "bg-[#FF5733] text-white" : ""
                    }`}
                  >
                    {getStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danh sách tickets */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl text-gray-300 mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {tickets.length === 0 ? "Chưa có ticket nào" : "Không tìm thấy ticket"}
          </h3>
          <p className="text-gray-500 mb-4">
            {tickets.length === 0 
              ? "Bạn chưa tạo ticket nào. Hãy tạo ticket đầu tiên của bạn!"
              : "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"
            }
          </p>
          {tickets.length === 0 && (
            <button
              onClick={onCreateTicket}
              className="px-6 py-2 bg-[#FF5733] text-white rounded-lg font-semibold hover:bg-[#E64A2E] transition-colors"
            >
              Tạo ticket đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket._id}
              onClick={() => onSelectTicket(ticket)}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-[#002147]">
                      {ticket.title}
                    </h3>
                    <span className="text-sm text-gray-500">
                      #{ticket.ticketCode}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {ticket.description}
                  </p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {getStatusLabel(ticket.status)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {getPriorityLabel(ticket.priority)}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span>Loại: {ticket.type}</span>
                  <span>
                    Tạo: {new Date(ticket.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                  {ticket.assignedTo && (
                    <span>Người xử lý: {ticket.assignedTo.fullname}</span>
                  )}
                </div>
                <span>
                  Cập nhật: {new Date(ticket.updatedAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination có thể thêm sau */}
      {filteredTickets.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Hiển thị {filteredTickets.length} / {tickets.length} ticket
        </div>
      )}
    </div>
  );
};

export default TicketList; 
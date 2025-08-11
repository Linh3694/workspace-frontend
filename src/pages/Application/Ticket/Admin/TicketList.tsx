import React, { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { TICKETS_API_URL } from "../../../../config/api";
import TicketAdminModal from "./DetailModal";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Input } from "../../../../components/ui/input";
import { FiSearch } from "react-icons/fi";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../../../components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import type {
  User,
  Ticket,
  TicketStatus,
  TicketPriority,
  FilterType,
  SortDirection,
  SortConfig,
  TicketsResponse,
  TicketResponse,
  UsersResponse,
} from "../types";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  PRIORITY_ORDER,
} from "../types";

// Component Props
interface TicketAdminTableProps {
  currentUser: User | null;
}

const TicketList: React.FC<TicketAdminTableProps> = ({ currentUser }) => {
  // State chung về danh sách tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [originalTickets, setOriginalTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Modal state
  const [showTicketModal, setShowTicketModal] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // State sắp xếp
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: "asc" });

  // Danh sách người dùng & phân loại
  const [, setUsers] = useState<User[]>([]);
  const [, setTechnicalUsers] = useState<User[]>([]);

  // Filter chính: "all" hoặc "assignedToMe"
  const [filter, setFilter] = useState<FilterType>("all");

  // Bộ lọc nhiều ưu tiên / nhiều trạng thái
  const [selectedPriorities, setSelectedPriorities] = useState<TicketPriority[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<TicketStatus[]>([]);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const token = localStorage.getItem("token");

  // Modal functions
  const openTicketModal = async (ticketId: string): Promise<void> => {
    try {
      const res = await axios.get<TicketResponse>(`${TICKETS_API_URL}/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setSelectedTicket(res.data.ticket);
        setShowTicketModal(true);
      } else {
        toast.error("Không thể tải thông tin ticket.");
      }
    } catch (error) {
      console.error("Lỗi khi fetch ticket:", error);
      toast.error("Không thể tải thông tin ticket.");
    }
  };

  const closeTicketModal = (): void => {
    setShowTicketModal(false);
    setSelectedTicket(null);
  };

  // Fetch danh sách tickets
  const fetchTickets = async (): Promise<void> => {
    try {
      console.log("🔑 Token:", token ? "Có token" : "Không có token");
      console.log("🌐 API URL:", `${TICKETS_API_URL}`);
      
      if (!token) {
        setError("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }

      const response = await axios.get<TicketsResponse>(`${TICKETS_API_URL}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTickets(response.data.tickets);
      setOriginalTickets(response.data.tickets);
      setLoading(false);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      console.error("❌ Lỗi fetch tickets:", axiosError.response?.status, axiosError.response?.data);
      
      if (axiosError.response?.status === 401) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        // Có thể redirect về trang login
        localStorage.removeItem("token");
      } else {
        setError(
          axiosError.response?.data?.message || "Có lỗi xảy ra khi tải dữ liệu."
        );
      }
      setLoading(false);
    }
  };

  const fetchTicketById = async (ticketId: string): Promise<void> => {
    try {
      const response = await axios.get<TicketResponse>(`${TICKETS_API_URL}/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setSelectedTicket(response.data.ticket);
      } else {
        console.error("❌ Không thể tải ticket:", response.data.message);
      }
    } catch (error) {
      console.error("Lỗi khi getTicketById (Admin):", error);
    }
  };

  // Fetch danh sách users
  const fetchUsers = async (): Promise<void> => {
    try {
      const response = await axios.get<UsersResponse | User[]>(`${TICKET_API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      let allUsers: User[] = [];
      if (Array.isArray(response.data)) {
        allUsers = response.data;
      } else if (response.data.users && Array.isArray(response.data.users)) {
        allUsers = response.data.users;
      }
      setUsers(allUsers);

      const validUsers = allUsers.filter(
        (user) => user.role === "technical" || user.role === "admin"
      );
      setTechnicalUsers(validUsers);
    } catch {
      toast.error("Có lỗi xảy ra khi tải danh sách người dùng.");
    }
  };

  // Dot color
  const getPriorityDotColor = (priority: TicketPriority): string => {
    switch (priority) {
      case "Low":
        return "#22c55e";
      case "Medium":
        return "#FFCE02";
      case "High":
        return "#ef4444";
      case "Urgent":
        return "#FF5733";
      default:
        return "#6b7280";
    }
  };

  // Sắp xếp tickets
  const handleSort = (key: string): void => {
    let direction: SortDirection = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
      }
    }
    setSortConfig({ key, direction });

    if (direction === null) {
      setTickets([...originalTickets]);
    } else {
      const sortedTickets = [...tickets].sort((a, b) => {
        if (key === "priority") {
          const aValue = PRIORITY_ORDER[a.priority] || 0;
          const bValue = PRIORITY_ORDER[b.priority] || 0;
          return direction === "asc" ? aValue - bValue : bValue - aValue;
        } else if (key === "status") {
          return direction === "asc"
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        }
        return 0;
      });
      setTickets(sortedTickets);
    }
  };

  // Lọc tickets theo filter chính & bộ lọc phụ
  const filteredTickets = tickets.filter((ticket) => {
    // A) Lọc theo "all" hoặc "assignedToMe"
    let match =
      filter === "all" ||
      (filter === "assignedToMe" && ticket.assignedTo?._id === currentUser?.id);

    // B) Lọc theo nhiều ưu tiên
    if (selectedPriorities.length > 0) {
      match = match && selectedPriorities.includes(ticket.priority);
    }

    // C) Lọc theo nhiều trạng thái
    if (selectedStatuses.length > 0) {
      match = match && selectedStatuses.includes(ticket.status);
    }

    // D) Lọc theo search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      match = match && (
        ticket.ticketCode.toLowerCase().includes(searchLower) ||
        ticket.title.toLowerCase().includes(searchLower) ||
        (ticket.creator?.fullname || "").toLowerCase().includes(searchLower) ||
        (ticket.creator?.email || "").toLowerCase().includes(searchLower) ||
        (ticket.assignedTo?.fullname || "").toLowerCase().includes(searchLower)
      );
    }

    return match;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedPriorities, selectedStatuses, filter]);

  // Hàm chuyển đổi bảng chính
  const handleMainFilterChange = (mainFilter: FilterType): void => {
    setFilter(mainFilter);
  };

  // Toggle ưu tiên
  const handlePriorityClick = (priority: TicketPriority): void => {
    setSelectedPriorities((prev) => {
      if (prev.includes(priority)) {
        return prev.filter((p) => p !== priority);
      } else {
        return [...prev, priority];
      }
    });
  };

  // Toggle trạng thái
  const handleStatusClick = (status: TicketStatus): void => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  // Hàm lấy màu sắc cho status
  const getStatusColor = (status: TicketStatus): string => {
    switch (status) {
      case "Processing":
        return "bg-[#FFCE02] text-white";
      case "Assigned":
        return "bg-[#002855] text-white";
      case "Done":
        return "bg-[#009483] text-white";
      case "Closed":
        return "bg-[#00687F] text-white";
      case "Cancelled":
        return "bg-[#C13346] text-white";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Hàm chuyển đổi status sang tiếng Việt
  const getStatusLabel = (status: TicketStatus): string => {
    return STATUS_LABELS[status] || status;
  };

  useEffect(() => {
    fetchTickets();
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5733]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <Button
          onClick={fetchTickets}
          className="mt-4 bg-[#FF5733] hover:bg-[#FF5733]/90"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-xl p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#002147]">
          Quản lý Ticket
        </h1>
        <div className="relative w-80">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Tìm kiếm ticket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {/* Main filter */}
          <Button
            onClick={() => handleMainFilterChange("all")}
            variant={filter === "all" ? "default" : "outline"}
            className={filter === "all" ? "bg-[#FF5733] hover:bg-[#FF5733]/90" : ""}
          >
            Tất cả ticket
          </Button>
          <Button
            onClick={() => handleMainFilterChange("assignedToMe")}
            variant={filter === "assignedToMe" ? "default" : "outline"}
            className={filter === "assignedToMe" ? "bg-[#FF5733] hover:bg-[#FF5733]/90" : ""}
          >
            Giao cho tôi
          </Button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-300"></div>

          {/* Priority filter */}
          {(["Low", "Medium", "High", "Urgent"] as TicketPriority[]).map((priority) => (
            <Button
              key={priority}
              onClick={() => handlePriorityClick(priority)}
              variant={selectedPriorities.includes(priority) ? "default" : "outline"}
              size="sm"
              className={` ${selectedPriorities.includes(priority) ? "bg-[#FF5733] hover:bg-[#FF5733]/90" : ""}`}
            >
              {PRIORITY_LABELS[priority]}
            </Button>
          ))}

          {/* Separator */}
          <div className="h-6 w-px bg-gray-300"></div>

          {/* Status filter */}
          {(["Open", "Processing", "Assigned", "Done", "Closed", "Cancelled"] as TicketStatus[]).map((status) => (
            <Button
              key={status}
              onClick={() => handleStatusClick(status)}
              variant={selectedStatuses.includes(status) ? "default" : "outline"}
              size="sm"
              className={` ${selectedStatuses.includes(status) ? "bg-[#FF5733] hover:bg-[#FF5733]/90" : ""}`}
            >
              {getStatusLabel(status)}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold">Mã Ticket</TableHead>
            <TableHead className="font-bold">Tiêu đề</TableHead>
            <TableHead className="font-bold">Người tạo</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort("priority")}
            >
              <span className="font-bold">Độ ưu tiên</span> {sortConfig.key === "priority" && (
                <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead className="font-bold">Người xử lý</TableHead>
           <TableHead className="font-bold">Ngày tạo</TableHead>
             <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort("status")}
            >
              <span className="font-bold">Trạng thái</span> {sortConfig.key === "status" && (
                <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {paginatedTickets.map((ticket) => (
              <TableRow key={ticket._id}>
                <TableCell>
                  <span className="font-mono text-sm">{ticket.ticketCode}</span>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <p 
                      className="font-medium truncate cursor-pointer hover:text-[#FF5733] hover:underline transition-colors"
                      onClick={() => openTicketModal(ticket._id)}
                    >
                      {ticket.title}
                    </p>
                    {/* <p className="text-sm text-gray-500 truncate">{ticket.description}</p> */}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{ticket.creator?.fullname || "N/A"}</p>
                  <p className="text-sm text-gray-500">{ticket.creator?.email || "N/A"}</p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getPriorityDotColor(ticket.priority) }}
                    ></div>
                    <span className="text-sm font-medium">
                      {PRIORITY_LABELS[ticket.priority]}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  {ticket.assignedTo ? (
                    <div>
                      <p className="font-medium">{ticket.assignedTo.fullname}</p>
                    </div>
                  ) : (
                    <span className="text-gray-400">Chưa phân công</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {new Date(ticket.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </TableCell>
               <TableCell>
                  <Badge 
                    variant="secondary"
                    className={getStatusColor(ticket.status)}
                  >
                    {getStatusLabel(ticket.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {/* First page */}
              <PaginationItem>
                <PaginationLink
                  onClick={() => setCurrentPage(1)}
                  isActive={currentPage === 1}
                  className="cursor-pointer"
                >
                  1
                </PaginationLink>
              </PaginationItem>

              {/* Left ellipsis */}
              {currentPage > 3 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Pages around current page */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  if (totalPages <= 5) return page > 1 && page < totalPages;
                  return page > 1 && page < totalPages && Math.abs(page - currentPage) <= 1;
                })
                .map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

              {/* Right ellipsis */}
              {currentPage < totalPages - 2 && totalPages > 5 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Last page */}
              {totalPages > 1 && (
                <PaginationItem>
                  <PaginationLink
                    onClick={() => setCurrentPage(totalPages)}
                    isActive={currentPage === totalPages}
                    className="cursor-pointer"
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Empty state */}
      {filteredTickets.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl text-gray-300 mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Không có ticket nào
          </h3>
          <p className="text-gray-500">
            Không tìm thấy ticket phù hợp với bộ lọc hiện tại.
          </p>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {showTicketModal && selectedTicket && (
        <TicketAdminModal
          ticket={selectedTicket}
          currentUser={currentUser}
          onClose={closeTicketModal}
          fetchTicketById={fetchTicketById}
        />
      )}
    </div>
  );
};

export default TicketList; 
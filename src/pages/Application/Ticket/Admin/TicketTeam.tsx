import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { API_URL, BASE_URL } from "@/lib/config";
import { toast } from "sonner";

interface User {
  _id: string;
  fullname: string;
  email: string;
  avatarUrl?: string;
  jobTitle?: string;
  averageRating?: number;
  badgesCount?: Record<string, number>;
}



const TicketTeam: React.FC = () => {
  const [members, setMembers] = useState<User[]>([]);
  const [teamName, setTeamName] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Trạng thái cho việc chọn user
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Lấy thông tin supportTeam
  const fetchSupportTeam = async () => {
    try {
      const res = await axios.get(`${API_URL}/tickets/support-team`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (res.data.success) {
        setTeamName(res.data.teamName);
        setMembers(res.data.members);
      }
    } catch (error) {
      console.error("Error fetching support team:", error);
      toast.error("Không thể tải thông tin team");
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/users`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (res.data.success) {
        setAllUsers(res.data.users);
      } else if (Array.isArray(res.data)) {
        setAllUsers(res.data);
      }
    } catch (error) {
      console.error("Error fetching all users:", error);
      toast.error("Không thể tải danh sách người dùng");
    }
  };

  useEffect(() => {
    fetchSupportTeam();
    fetchAllUsers();
  }, []);

  // Lọc users khi searchTerm thay đổi
  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const filtered = allUsers.filter((u) =>
        u.fullname.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [searchTerm, allUsers]);

  const renderStars = (avg: number = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (avg >= i) {
        stars.push(<FaStar size={16} key={i} className="text-orange-red" />);
      } else if (avg >= i - 0.5) {
        stars.push(
          <FaStarHalfAlt size={16} key={i} className="text-orange-red" />
        );
      } else {
        stars.push(<FaRegStar size={16} key={i} className="text-orange-400" />);
      }
    }
    return stars;
  };

  // Thêm user vào supportTeam
  const handleAddUser = async () => {
    if (!selectedUser) {
      toast.error("Vui lòng chọn user trước khi thêm.");
      return;
    }
    try {
      const res = await axios.post(
        `${API_URL}/tickets/support-team/add-user`,
        { userId: selectedUser },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      if (res.data.success) {
        toast.success("Đã thêm user vào team!");
        setShowAddModal(false);
        setSearchTerm("");
        setSelectedUser(null);
        fetchSupportTeam();
      } else {
        toast.error(res.data.message || "Lỗi khi thêm user.");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("Không thể thêm user.");
    }
  };

  // Xóa user khỏi team
  const handleRemoveUser = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thành viên này khỏi team?")) {
      return;
    }

    try {
      const res = await axios.delete(
        `${API_URL}/tickets/support-team/remove-user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      if (res.data.success) {
        toast.success("Đã xóa thành viên khỏi team!");
        fetchSupportTeam();
      } else {
        toast.error(res.data.message || "Lỗi khi xóa thành viên.");
      }
    } catch (error) {
      console.error("Error removing user:", error);
      toast.error("Không thể xóa thành viên.");
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#002147]">
          {teamName || "Support Team"}
        </h1>
        <button
          className="px-4 py-2 bg-[#002855] text-white rounded-lg font-semibold hover:bg-[#001a3d] transition-colors"
          onClick={() => setShowAddModal(true)}
        >
          Thêm thành viên
        </button>
      </div>

      {/* Team stats */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-[#FF5733]">{members.length}</p>
            <p className="text-sm text-gray-600">Thành viên</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#FF5733]">
              {members.reduce((sum, member) => sum + (member.averageRating || 0), 0) / members.length || 0}
            </p>
            <p className="text-sm text-gray-600">Đánh giá TB</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#FF5733]">
              {members.reduce((sum, member) => {
                const badges = member.badgesCount || {};
                return sum + Object.values(badges).reduce((a, b) => a + b, 0);
              }, 0)}
            </p>
            <p className="text-sm text-gray-600">Tổng huy hiệu</p>
          </div>
        </div>
      </div>

      {/* Danh sách team */}
      {members.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl text-gray-300 mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Chưa có thành viên nào
          </h3>
          <p className="text-gray-500 mb-4">
            Hãy thêm thành viên đầu tiên vào team support
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-[#FF5733] text-white rounded-lg font-semibold hover:bg-[#E64A2E] transition-colors"
          >
            Thêm thành viên đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {members.map((member) => (
            <div
              key={member._id}
              className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center border hover:shadow-xl transition-shadow"
            >
              {/* Avatar */}
              <div className="relative mb-4">
                <img
                  src={
                    member.avatarUrl
                      ? `${BASE_URL}/uploads/Avatar/${member.avatarUrl}`
                      : "/default-avatar.png"
                  }
                  alt={member.fullname}
                  className="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
                />
                <button
                  onClick={() => handleRemoveUser(member._id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                  title="Xóa khỏi team"
                >
                  ×
                </button>
              </div>

              {/* Info */}
              <h2 className="font-semibold text-lg text-center mb-1">
                {member.fullname}
              </h2>
              <p className="text-sm text-gray-500 mb-3 text-center">
                {member.jobTitle || "N/A"}
              </p>

              {/* Rating */}
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">
                    {member.averageRating ? member.averageRating.toFixed(1) : "0.0"}
                  </span>
                  <div className="flex">
                    {renderStars(member.averageRating || 0)}
                  </div>
                </div>
              </div>

              {/* Badges */}
              {member.badgesCount &&
                Object.keys(member.badgesCount).length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1">
                    {Object.entries(member.badgesCount).map(([badge, count]) => (
                      <span
                        key={badge}
                        className="bg-[#002855] text-white font-bold text-xs px-2 py-1 rounded-full"
                      >
                        {badge} ({count})
                      </span>
                    ))}
                  </div>
                )}

              {/* Contact */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400">{member.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal thêm user */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-96 relative max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Thêm thành viên vào Support Team
            </h2>

            {/* Ô nhập tên user */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Nhập tên user..."
                className="w-full border p-3 rounded-md focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedUser(null);
                }}
              />
              {/* Hiển thị gợi ý */}
              {filteredUsers.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white border border-t-0 shadow-md z-10 max-h-40 overflow-y-auto">
                  {filteredUsers.map((u) => (
                    <div
                      key={u._id}
                      className="p-3 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-b-0"
                      onClick={() => {
                        setSearchTerm(u.fullname);
                        setSelectedUser(u._id);
                        setFilteredUsers([]);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            u.avatarUrl
                              ? `${BASE_URL}/uploads/Avatar/${u.avatarUrl}`
                              : "/default-avatar.png"
                          }
                          alt={u.fullname}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium">{u.fullname}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected user preview */}
            {selectedUser && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">
                  ✓ Đã chọn: {searchTerm}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
                onClick={() => {
                  setShowAddModal(false);
                  setSearchTerm("");
                  setSelectedUser(null);
                  setFilteredUsers([]);
                }}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 bg-[#002855] text-white rounded-md hover:bg-[#001a3d] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleAddUser}
                disabled={!selectedUser}
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketTeam; 
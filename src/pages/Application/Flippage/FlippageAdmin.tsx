import React, { useState, useEffect, useRef } from "react";
import { API_URL } from "../../../config/api";
import { FiEdit, FiTrash2, FiPlus, FiX } from "react-icons/fi";
import { toast } from "sonner";

interface FileItem {
  _id: string;
  customName: string;
  filename: string;
  isActive: boolean;
  bookmarks?: Bookmark[];
  createdAt: string;
}

interface Bookmark {
  title: string;
  page: number;
}

export default function FlippageAdmin() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [newCustomName, setNewCustomName] = useState("");
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
  const [deletingFile, setDeletingFile] = useState<FileItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([{ title: "", page: 1 }]);
  const [customName, setCustomName] = useState("");
  const [customNameMessage, setCustomNameMessage] = useState("");
  const [isCustomNameValid, setIsCustomNameValid] = useState<boolean | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Định nghĩa hàm fetchFileList
  const fetchFileList = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Bạn chưa đăng nhập!");
      return;
    }
    
    fetch(`${API_URL}/flippage/get-all-pdfs`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setFileList(data);
        } else {
          console.error("❌ Dữ liệu không phải mảng:", data);
          setFileList([]);
        }
      })
      .catch((err) => {
        console.error("❌ Lỗi khi lấy danh sách:", err);
        if (err.message === "Unauthorized") {
          toast.error("Phiên đăng nhập đã hết hạn!");
        } else {
          toast.error("Lỗi khi tải danh sách tài liệu");
        }
        setFileList([]);
      });
  };

  useEffect(() => {
    fetchFileList();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEdit = (file: FileItem) => {
    setEditingFile(file);
    setNewCustomName(file.customName);
    setShowEditModal(true);
  };

  const checkCustomName = async (name: string) => {
    if (!name.trim()) {
      setCustomNameMessage("Đường dẫn không được để trống.");
      setIsCustomNameValid(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/flippage/check-customname/${encodeURIComponent(name)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        setCustomNameMessage(data.message);
        setIsCustomNameValid(true);
      } else {
        setCustomNameMessage(data.message);
        setIsCustomNameValid(false);
      }
    } catch (err) {
      console.error("❌ Lỗi khi kiểm tra customName:", err);
      setCustomNameMessage("Lỗi server khi kiểm tra.");
      setIsCustomNameValid(false);
    }
  };

  const handleUpdateCustomName = async () => {
    if (!editingFile) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Bạn chưa đăng nhập!");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/flippage/update-customname/${editingFile._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newCustomName }),
        }
      );

      if (!res.ok) {
        throw new Error("Cập nhật thất bại");
      }

      const data = await res.json();
      console.log("✅ Cập nhật thành công:", data);

      setFileList((prev) =>
        prev.map((file) =>
          file._id === editingFile._id
            ? { ...file, customName: newCustomName }
            : file
        )
      );
      toast.success("Cập nhật thành công!");
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi khi cập nhật customName");
    }
  };

  // Khi nhấn nút xoá: mở modal xác nhận xoá
  const handlePermanentDelete = (file: FileItem) => {
    if (!file._id) {
      console.error("❌ File không có _id");
      return;
    }
    setDeletingFile(file);
    setShowPermanentDeleteModal(true);
  };

  // Xác nhận xoá vĩnh viễn
  const confirmPermanentDelete = async () => {
    if (!deletingFile?._id) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Bạn chưa đăng nhập!");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/flippage/permanent-delete/${deletingFile._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error("Xoá thất bại");
      }

      setFileList((prev) => prev.filter((file) => file._id !== deletingFile._id));
      toast.success("Xoá vĩnh viễn thành công!");
      setShowPermanentDeleteModal(false);
      setDeletingFile(null);
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi khi xoá tài liệu");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Vui lòng chọn file PDF");
      return;
    }

    if (!customName.trim()) {
      toast.error("Vui lòng nhập đường dẫn tùy chỉnh");
      return;
    }

    if (!isCustomNameValid) {
      toast.error("Đường dẫn tùy chỉnh không hợp lệ");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("pdfFile", selectedFile);
    formData.append("customName", customName);
    formData.append("bookmarks", JSON.stringify(bookmarks));

    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(`${API_URL}/flippage/upload-pdf`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload thất bại");
      }

      await response.json();
      toast.success("Upload thành công!");
      
      // Reset form
      setSelectedFile(null);
      setCustomName("");
      setBookmarks([{ title: "", page: 1 }]);
      setIsUploadModalOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Refresh danh sách
      fetchFileList();
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi khi upload tài liệu");
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle trạng thái active/inactive
  const toggleActive = async (file: FileItem) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Bạn chưa đăng nhập!");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/flippage/toggle-active/${file._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error("Toggle thất bại");
      }

      const data = await res.json();
      
      setFileList((prev) =>
        prev.map((f) =>
          f._id === file._id ? { ...f, isActive: data.isActive } : f
        )
      );
      
      toast.success(`Tài liệu đã được ${data.isActive ? 'kích hoạt' : 'tắt'}`);
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi khi cập nhật trạng thái");
    }
  };

  // Filter files based on search term
  const filteredFiles = fileList.filter(file =>
    file.customName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
       <h1 className="text-2xl font-bold">Danh sách PDF đã upload</h1>
      <div className="flex justify-between items-center mb-6">
        <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm tài liệu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FiPlus />
          Thêm tài liệu mới
        </button>
      </div>

      {/* Search */}
     

      {/* File List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên tài liệu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đường dẫn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFiles.map((file) => (
                <tr key={file._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {file.filename}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{file.customName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(file)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        file.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {file.isActive ? 'Hoạt động' : 'Tạm dừng'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(file.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(file)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Chỉnh sửa"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(file)}
                        className="text-red-600 hover:text-red-900"
                        title="Xóa vĩnh viễn"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Không có tài liệu nào</p>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Thêm tài liệu mới</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn file PDF
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                {selectedFile && (
                  <div className="mt-2 p-2 bg-gray-100 rounded flex justify-between items-center">
                    <span className="text-sm">{selectedFile.name}</span>
                    <button onClick={handleRemoveFile} className="text-red-500">
                      <FiX />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đường dẫn tùy chỉnh
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => {
                    setCustomName(e.target.value);
                    if (e.target.value.trim()) {
                      checkCustomName(e.target.value);
                    } else {
                      setIsCustomNameValid(null);
                      setCustomNameMessage("");
                    }
                  }}
                  placeholder="vi-du-duong-dan"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                {customNameMessage && (
                  <p className={`mt-1 text-sm ${isCustomNameValid ? 'text-green-600' : 'text-red-600'}`}>
                    {customNameMessage}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || !isCustomNameValid || isUploading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? "Đang tải..." : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Chỉnh sửa tài liệu</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đường dẫn tùy chỉnh
                </label>
                <input
                  type="text"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateCustomName}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showPermanentDeleteModal && deletingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-600">Xác nhận xóa</h3>
              <button
                onClick={() => setShowPermanentDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700">
                Bạn có chắc chắn muốn xóa vĩnh viễn tài liệu "{deletingFile.filename}"?
              </p>
              <p className="text-sm text-red-600 mt-2">
                Hành động này không thể hoàn tác!
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPermanentDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmPermanentDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
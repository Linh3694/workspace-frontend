import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../../../core/config";
import { toast } from "react-toastify";

const EmailIntegration: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null);
  const [emailStats, setEmailStats] = useState({
    totalEmails: 0,
    newTickets: 0,
    lastSync: null as string | null,
  });

  const handleFetchEmails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/email/fetch-emails`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setLastFetchTime(new Date().toLocaleString("vi-VN"));
        
        // Cập nhật stats nếu có
        if (res.data.stats) {
          setEmailStats(res.data.stats);
        }
      } else {
        toast.error("Không thể fetch emails: " + (res.data.message || ""));
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi fetch emails."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/email/test-connection`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (res.data.success) {
        toast.success("Kết nối email thành công!");
      } else {
        toast.error("Không thể kết nối email: " + (res.data.message || ""));
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi test kết nối."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${API_URL}/email/sync-settings`,
        {
          autoSync: true,
          syncInterval: 300000, // 5 phút
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      if (res.data.success) {
        toast.success("Đã cập nhật cài đặt đồng bộ!");
      } else {
        toast.error("Không thể cập nhật cài đặt: " + (res.data.message || ""));
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật cài đặt."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#002147] mb-2">
          Tích hợp Email
        </h1>
        <p className="text-gray-600">
          Quản lý việc đồng bộ email và tự động tạo ticket từ email
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Tổng Email</p>
              <p className="text-2xl font-bold">{emailStats.totalEmails}</p>
            </div>
            <div className="text-3xl opacity-80">📧</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Ticket Mới</p>
              <p className="text-2xl font-bold">{emailStats.newTickets}</p>
            </div>
            <div className="text-3xl opacity-80">🎫</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Đồng bộ cuối</p>
              <p className="text-sm font-medium">
                {emailStats.lastSync
                  ? new Date(emailStats.lastSync).toLocaleString("vi-VN")
                  : "Chưa đồng bộ"}
              </p>
            </div>
            <div className="text-3xl opacity-80">🔄</div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Fetch Emails Card */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#FF5733] rounded-lg flex items-center justify-center text-white text-xl">
              📥
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#002147]">
                Lấy Email & Tạo Ticket
              </h3>
              <p className="text-sm text-gray-600">
                Đồng bộ email mới và tự động tạo ticket
              </p>
            </div>
          </div>
          
          <button
            disabled={loading}
            onClick={handleFetchEmails}
            className="w-full px-4 py-3 bg-[#FF5733] text-white rounded-lg font-semibold hover:bg-[#E64A2E] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang xử lý...
              </div>
            ) : (
              "Lấy Email Mới"
            )}
          </button>
          
          {lastFetchTime && (
            <p className="text-xs text-gray-500 mt-2">
              Lần cuối: {lastFetchTime}
            </p>
          )}
        </div>

        {/* Test Connection Card */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#002855] rounded-lg flex items-center justify-center text-white text-xl">
              🔗
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#002147]">
                Kiểm tra Kết nối
              </h3>
              <p className="text-sm text-gray-600">
                Test kết nối với email server
              </p>
            </div>
          </div>
          
          <button
            disabled={loading}
            onClick={handleTestConnection}
            className="w-full px-4 py-3 bg-[#002855] text-white rounded-lg font-semibold hover:bg-[#001a3d] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang kiểm tra...
              </div>
            ) : (
              "Test Kết nối"
            )}
          </button>
        </div>
      </div>

      {/* Settings Section */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[#002147] mb-4">
          Cài đặt Đồng bộ
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Tự động đồng bộ</h4>
              <p className="text-sm text-gray-600">
                Tự động lấy email mới mỗi 5 phút
              </p>
            </div>
            <button
              disabled={loading}
              onClick={handleSyncSettings}
              className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Đang cập nhật..." : "Bật tự động"}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Thông báo</h4>
              <p className="text-sm text-gray-600">
                Nhận thông báo khi có email mới
              </p>
            </div>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              onClick={() => toast.info("Tính năng đang phát triển")}
            >
              Cấu hình
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          📋 Hướng dẫn sử dụng
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>
              <strong>Lấy Email Mới:</strong> Đồng bộ email từ server và tự động tạo ticket cho email mới
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>
              <strong>Test Kết nối:</strong> Kiểm tra xem hệ thống có thể kết nối với email server không
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>
              <strong>Tự động đồng bộ:</strong> Bật tính năng tự động lấy email mới mỗi 5 phút
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>
              Email sẽ được chuyển thành ticket với tiêu đề là subject và nội dung là body của email
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EmailIntegration; 
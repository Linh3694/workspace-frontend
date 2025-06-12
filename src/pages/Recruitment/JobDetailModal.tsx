import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { API_URL, BASE_URL } from "../../lib/config";
import Switch from "react-switch";
import TiptapEditor from "../../components/TiptapEditor";
import { toast } from 'sonner';
import { FaDownload, FaEye } from "react-icons/fa6";
import { DatePicker } from "../../components/ui/datepicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../components/ui/select";

interface Job {
  _id: string;
  title: string;
  description: string;
  requirements: string;
  salaryRange?: string;
  location?: string;
  jobType: string;
  urgent: boolean;
  deadline: string;
  active: boolean;
  cvCount?: number;
}

interface Application {
  _id: string;
  jobId: string;
  fullname: string;
  email: string;
  phone: string;
  resumeUrl: string;
  createdAt: string;
}

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId?: string;
}

function JobDetailModal({ isOpen, onClose, jobId }: JobDetailModalProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [cvList, setCvList] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!isOpen || !jobId) return;
    
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_URL}/jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Không thể tải thông tin công việc");
        const data = await res.json();
        setJob(data.job || data);
        setEditJob(data.job || data);
      } catch {
        setJob(null);
        setEditJob(null);
      }
    };
    
    const fetchCVs = async () => {
      try {
        const res = await fetch(`${API_URL}/applications/job/${jobId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Không thể tải danh sách CV");
        const data = await res.json();
        setCvList(data.applications || []);
      } catch {
        setCvList([]);
      }
    };
    
    fetchJob();
    fetchCVs();
  }, [isOpen, jobId]);

  if (!isOpen) return null;
  if (!editJob) return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg">
        <p>Đang tải thông tin công việc...</p>
      </div>
    </div>
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setEditJob(prev => prev ? ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }) : null);
  };

  const handleSelectChange = (field: string, value: string) => {
    setEditJob(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleDateChange = (date: Date | undefined) => {
    setEditJob(prev => prev ? ({ 
      ...prev, 
      deadline: date ? date.toISOString().split('T')[0] : '' 
    }) : null);
  };

  const handleQuillChange = (name: string, value: string) => {
    setEditJob(prev => prev ? ({ ...prev, [name]: value }) : null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/jobs/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(editJob),
      });
      if (!res.ok) throw new Error("Cập nhật thất bại");
      const data = await res.json();
      setJob(data.job);
      setEditJob(data.job);
      toast.success("Cập nhật thành công!");
      onClose();
    } catch  {
      toast.error("Có lỗi khi cập nhật công việc!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditJob(job);
    onClose();
  };

  const filteredCVs = cvList.filter(cv =>
    cv.fullname?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewUrl(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-[90vw] h-[90vh] px-10 py-5">
        <div className="flex justify-between items-center pb-3 mb-4">
          <h2 className="text-xl font-bold text-[#002147]">{job?.title}</h2>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
              disabled={isSaving}
            >
              Huỷ bỏ
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#FF5733] text-white font-semibold rounded-lg hover:bg-[#ff6b4a] transition"
              disabled={isSaving}
            >
              Lưu
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Bên trái: Thông tin job dạng chỉnh sửa */}
          <div className="border-r border-gray-200 pr-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Vị trí tuyển dụng */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Vị trí tuyển dụng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={editJob.title || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#F8F8F8] border-none text-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                  placeholder="dvasv"
                />
              </div>
              
              {/* Hạn cuối */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Hạn cuối <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  date={editJob.deadline ? new Date(editJob.deadline) : undefined}
                  setDate={handleDateChange}
                  className="w-full bg-[#F8F8F8] border-none rounded-full"
                />
              </div>
              
              {/* Loại hình công việc */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Loại hình công việc <span className="text-red-500">*</span>
                </label>
                <Select
                  value={editJob.jobType || ''}
                  onValueChange={(value) => handleSelectChange('jobType', value)}
                >
                  <SelectTrigger className="w-full bg-[#F8F8F8] border-none rounded-full">
                    <SelectValue placeholder="Chọn loại hình công việc" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fulltime">Toàn thời gian</SelectItem>
                    <SelectItem value="parttime">Bán thời gian</SelectItem>
                    <SelectItem value="intern">Thực tập</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Tuyển gấp */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Tuyển gấp <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center h-full">
                  <Switch
                    onChange={checked => setEditJob(prev => prev ? ({ ...prev, urgent: checked }) : null)}
                    checked={!!editJob.urgent}
                    onColor="#FF5733"
                    offColor="#ccc"
                    uncheckedIcon={false}
                    checkedIcon={false}
                    height={24}
                    width={48}
                  />
                </div>
              </div>
            </div>

            {/* Mô tả */}
            <div className="flex flex-col gap-2 mb-4">
              <label className="text-sm font-semibold text-gray-700">
                Mô tả <span className="text-red-500">*</span>
              </label>
              <div className="h-[200px] flex flex-col">
                <TiptapEditor
                  content={editJob.description || ''}
                  onUpdate={(content) => handleQuillChange('description', content)}
                  placeholder="Nhập mô tả công việc"
                  className="h-full"
                />
              </div>
            </div>

            {/* Yêu cầu công việc */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">
                Yêu cầu công việc <span className="text-red-500">*</span>
              </label>
              <div className="h-[200px] flex flex-col">
                <TiptapEditor
                  content={editJob.requirements || ''}
                  onUpdate={(content) => handleQuillChange('requirements', content)}
                  placeholder="Nhập yêu cầu công việc"
                  className="h-full"
                />
              </div>
            </div>
          </div>

          {/* Bên phải: Danh sách CV */}
          <div className="pl-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#002147]">
                Danh sách CV ({filteredCVs.length})
              </h3>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            
            <div className="max-h-[70vh] overflow-y-auto">
              {filteredCVs.length > 0 ? (
                <div className="space-y-3">
                  {filteredCVs.map((cv, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#002147]">{cv.fullname}</h4>
                          <p className="text-sm text-gray-600">{cv.email}</p>
                          <p className="text-sm text-gray-600">{cv.phone}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Nộp lúc: {new Date(cv.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePreview(`${BASE_URL}/uploads/CV/${cv.resumeUrl}`)}
                            className="flex items-center justify-center w-8 h-8 text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition"
                            title="Xem trước"
                          >
                            <FaEye size={14} />
                          </button>
                          <a
                            href={`${BASE_URL}/uploads/CV/${cv.resumeUrl}`}
                            download
                            className="flex items-center justify-center w-8 h-8 text-green-600 bg-green-100 rounded-lg hover:bg-green-200 transition"
                            title="Tải xuống"
                          >
                            <FaDownload size={14} />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  {search ? "Không tìm thấy CV nào phù hợp" : "Chưa có CV nào được nộp"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">Xem trước CV</h3>
              <button
                onClick={handleClosePreview}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-4">
              <iframe
                src={previewUrl}
                className="w-full h-[70vh]"
                title="CV Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobDetailModal; 
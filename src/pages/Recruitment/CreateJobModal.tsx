import React, { useState } from "react";
import { API_URL } from "../../config/api";
import { FaTimes } from "react-icons/fa";
import { toast } from 'sonner';
import Switch from "react-switch";
import TiptapEditor from "../../components/TiptapEditor";
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

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (job: Job) => void;
  onRefreshData?: () => void;
}

interface JobData {
  title: string;
  description: string;
  requirements: string;
  salaryRange: string;
  location: string;
  jobType: string;
  urgent: boolean;
  deadline: Date | undefined;
}

function CreateJobModal({ isOpen, onClose, onJobCreated, onRefreshData }: CreateJobModalProps) {
  const initialJobData: JobData = {
    title: "",
    description: "",
    requirements: "",
    salaryRange: "",
    location: "",
    jobType: "",
    urgent: false,
    deadline: undefined,
  };
  const [jobData, setJobData] = useState<JobData>(initialJobData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setJobData({ ...jobData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setJobData({ ...jobData, [field]: value });
  };

  const handleCloseAndReset = () => {
    setJobData(initialJobData);
    onClose();
  };

  const handleSubmit = async () => {
    if (
      !jobData.title ||
      !jobData.description ||
      !jobData.requirements ||
      !jobData.jobType ||
      !jobData.deadline
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      // Convert Date to ISO string for API
      const submitData = {
        ...jobData,
        deadline: jobData.deadline?.toISOString().split('T')[0] || '',
      };
      
      console.log("Sending job data:", submitData);
      const res = await fetch(`${API_URL}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(submitData),
      });

      console.log("Response status:", res.status);
      const responseData = await res.json();
      console.log("Response data:", responseData);

      if (!res.ok) {
        throw new Error(responseData.message || "Không thể tạo công việc");
      }

      toast.success("Công việc đã được tạo!");
      onJobCreated(responseData.job || responseData);
      
      // Refresh lại dữ liệu bảng để có dữ liệu mới nhất
      if (onRefreshData) {
        onRefreshData();
      }
      
      setJobData(initialJobData);
      onClose();
    } catch {
      toast.error("Có lỗi xảy ra khi tạo công việc");
    }
  };

  return (
    isOpen && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" onClick={handleCloseAndReset}>
        <div className="bg-white rounded-[20px] p-6 w-full max-w-2xl shadow-lg" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-lg font-bold text-[#002147]">Thêm mới</h2>
            <button
              onClick={onClose}
              className="text-red-500 hover:text-red-700"
            >
              <FaTimes size={18} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vị trí tuyển dụng */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-semibold text-gray-700">
                Vị trí tuyển dụng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={jobData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#F8F8F8] border-none text-gray-800 rounded-full focus:outline-none "
                placeholder="Tên công việc"
              />
            </div>
            {/* Loại hình công việc */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-semibold text-gray-700">
                Loại hình công việc <span className="text-red-500">*</span>
              </label>
              <Select
                value={jobData.jobType}
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
            {/* Hạn cuối */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-semibold text-gray-700">
                Hạn cuối <span className="text-red-500">*</span>
              </label>
              <DatePicker
                date={jobData.deadline}
                setDate={(date) => setJobData({ ...jobData, deadline: date })}
              />
            </div>
            
            {/* Tuyển gấp */}
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tuyển gấp <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center h-full">
                <Switch
                  onChange={(checked) => setJobData({ ...jobData, urgent: checked })}
                  checked={jobData.urgent}
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
          <div className="flex flex-col gap-2 mt-4">
            <label className="block text-sm font-semibold text-gray-700">
              Mô tả <span className="text-red-500">*</span>
            </label>
            <div className="h-[200px] flex flex-col">
              <TiptapEditor
                content={jobData.description}
                onUpdate={(content) => setJobData({ ...jobData, description: content })}
                placeholder="Nhập mô tả công việc"
                className="h-full"
              />
            </div>
          </div>

          {/* Yêu cầu công việc */}
          <div className="flex flex-col gap-2 mt-4">
            <label className="block text-sm font-semibold text-gray-700">
              Yêu cầu công việc <span className="text-red-500">*</span>
            </label>
            <div className="h-[200px] flex flex-col">
              <TiptapEditor
                content={jobData.requirements}
                onUpdate={(content) => setJobData({ ...jobData, requirements: content })}
                placeholder="Nhập yêu cầu công việc"
                className="h-full"
              />
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex justify-end mt-6 space-x-4">
            <button
              onClick={handleCloseAndReset}
              className="px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#FF5733] text-white font-semibold rounded-lg hover:bg-[#ff6b4a] transition"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    )
  );
}

export default CreateJobModal; 
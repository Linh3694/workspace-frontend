import { useState, useEffect } from "react";
import { API_URL } from "../../lib/config";
import { FiTrash2 } from "react-icons/fi";
import { toast } from 'sonner';
import Switch from "react-switch";
import CreateJobModal from "./CreateJobModal";
import JobDetailModal from "./JobDetailModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { Button } from "@/components/ui/button";

interface Job {
  _id: string;
  title: string;
  urgent: boolean;
  deadline?: string;
  updatedAt?: string;
  createdAt?: string;
  cvCount?: number;
  active: boolean;
}

function RecruitmentAdmin() {
  const [fileList, setFileList] = useState<Job[]>([]);
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isJobDetailModalOpen, setIsJobDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  const fetchFileList = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Bạn chưa đăng nhập!");
      return;
    }
    fetch(`${API_URL}/jobs`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFileList(data);
        }
      })
      .catch(() => {
        toast.error("Có lỗi khi tải danh sách CV!");
      });
  };

  const handleOpenJobDetail = (job: Job) => {
    setSelectedJob(job);
    setIsJobDetailModalOpen(true);
  };

  useEffect(() => {
    fetchFileList();
  }, []);

  const handleRemoveJob = (job: Job) => {
    setJobToDelete(job);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;
    try {
      const res = await fetch(`${API_URL}/jobs/${jobToDelete._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Xoá công việc thất bại");
      toast.success("Đã xoá công việc!");
      setFileList((prev) => prev.filter((j) => j._id !== jobToDelete._id));
    } catch {
      toast.error("Có lỗi khi xoá công việc!");
    } finally {
      setIsDeleteModalOpen(false);
      setJobToDelete(null);
    }
  };

  const toggleActiveStatus = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Bạn chưa đăng nhập!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/jobs/toggle-active/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Cập nhật trạng thái thất bại");
      }

      const data = await res.json();
      toast.success("Trạng thái đã được cập nhật!");

      setFileList((prev) =>
        prev.map((job) =>
          job._id === id ? { ...job, active: data.job.active } : job
        )
      );
    } catch (err: unknown) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      const errorMessage = err instanceof Error ? err.message : "Có lỗi khi cập nhật trạng thái!";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="w-full h-full p-6 bg-white rounded-xl shadow-md border">
        <div className="flex flex-row justify-between items-center">
          <h2 className="font-bold text-lg mb-4">Tuyển dụng</h2>
          <Button
            onClick={() => setIsCreateJobModalOpen(true)}
          >
            Tạo mới
          </Button>
        </div>
        {fileList.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="!border-px !border-gray-400">
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">STT</p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">
                    Tên công việc
                  </p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">Tuyển gấp</p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">Hạn cuối</p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">Ngày đăng</p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">CVs</p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start">
                  <p className="text-sm font-bold text-gray-500">Active</p>
                </th>
                <th className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-end  ">
                  <p className="text-sm font-bold text-gray-500">Hành Động</p>
                </th>
              </tr>
            </thead>
            <tbody>
              {fileList.map((job, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="text-[#002147] border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700">
                      {index + 1}
                    </p>
                  </td>

                  <td
                    className="max-w-[400px] border-white/0 py-3 pr-4 cursor-pointer text-[#002147] font-bold hover:underline"
                    onClick={() => handleOpenJobDetail(job)}
                  >
                    {job.title}
                  </td>

                  <td className="border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700">
                      {job.urgent ? "Có" : "Không"}
                    </p>
                  </td>

                  <td className="border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700">
                      {job.deadline ? new Date(job.deadline).toLocaleDateString("vi-VN") : "-"}
                    </p>
                  </td>

                  <td className="border-white/0 py-3 pr-4">
                    <p className="text-sm font-bold text-navy-700">
                      {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString("vi-VN") : (job.createdAt ? new Date(job.createdAt).toLocaleDateString("vi-VN") : "-")}
                    </p>
                  </td>

                  <td className="border-white/0 py-3 pr-4 text-left">
                    <p className="text-sm font-bold text-navy-700">
                      {job.cvCount || 0}
                    </p>
                  </td>

                  <td className="border-white/0 py-3 pr-4">
                    <Switch
                      onChange={() => toggleActiveStatus(job._id)}
                      checked={job.active}
                      onColor="#FF5733"
                      offColor="#ccc"
                      uncheckedIcon={false}
                      checkedIcon={false}
                      height={20}
                      width={40}
                    />
                  </td>

                  <td className="border-white/0 py-3 pr-4">
                    <div className="flex justify-end space-x-2">
                      {/* <button
                        onClick={() => handleOpenJobDetail(job)}
                        className="flex items-center justify-center w-8 h-8 text-white bg-blue-600 rounded-lg hover:bg-blue-700 hover:scale-105 transition"
                        title="Chỉnh sửa"
                      >
                        <FiEdit size={14} />
                      </button> */}
                      <button
                        onClick={() => handleRemoveJob(job)}
                        className="flex items-center justify-center w-8 h-8 text-white bg-[#FF5733] rounded-lg hover:bg-red-700 hover:scale-105 transition"
                        title="Xóa"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Chưa có file nào được upload.</p>
        )}
      </div>
      <CreateJobModal
        isOpen={isCreateJobModalOpen}
        onClose={() => setIsCreateJobModalOpen(false)}
        onJobCreated={(newJob: Job) => setFileList(prev => [...prev, newJob])}
        onRefreshData={fetchFileList}
      />
      <JobDetailModal
        isOpen={isJobDetailModalOpen}
        onClose={() => setIsJobDetailModalOpen(false)}
        jobId={selectedJob?._id}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setJobToDelete(null); }}
        onConfirm={handleConfirmDelete}
        jobTitle={jobToDelete?.title}
      />
    </div>
  );
}

export default RecruitmentAdmin; 
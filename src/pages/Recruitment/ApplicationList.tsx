import { useState, useEffect } from "react";
import { API_URL, BASE_URL } from "../../config/api";
import { FiDownload, FiEye, FiUser, FiMail, FiPhone, FiCalendar } from "react-icons/fi";
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GraduationSchool {
  school: string;
  major: string;
  graduationYear: string;
}

interface Application {
  _id: string;
  fullname: string;
  birthdate: string;
  phone: string;
  email: string;
  graduationSchools: GraduationSchool[];
  highestDegree: string;
  englishLevel: string;
  expectedSalary: string;
  cvFile: string;
  profilePicture?: string;
  appliedJob?: {
    _id: string;
    title: string;
  };
  openPositionTitle?: string;
  openPositionType?: string;
  createdAt: string;
  updatedAt: string;
}

function ApplicationList() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Bạn chưa đăng nhập!");
        return;
      }

      const res = await fetch(`${API_URL}/applications`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Không thể tải danh sách ứng viên");
      }

      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
      setFilteredApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Có lỗi khi tải danh sách ứng viên!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Lọc applications
  useEffect(() => {
    let filtered = applications;

    // Lọc theo loại
    if (filterType === "job") {
      filtered = filtered.filter(app => app.appliedJob);
    } else if (filterType === "open") {
      filtered = filtered.filter(app => app.openPositionTitle && !app.appliedJob);
    }

    // Tìm kiếm theo tên hoặc email
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
  }, [applications, filterType, searchTerm]);

  const handleViewDetail = (application: Application) => {
    setSelectedApplication(application);
    setIsDetailModalOpen(true);
  };

  const handleDownloadCV = async (cvFile: string, fullname: string) => {
    try {
      // Static files không cần authentication, trực tiếp tạo link download
      const fileUrl = `${BASE_URL}${cvFile}`;
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `CV_${fullname}.pdf`;
      link.target = '_blank'; // Mở tab mới nếu không thể download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Đang tải CV...");
    } catch (error) {
      console.error("Error downloading CV:", error);
      toast.error("Có lỗi khi tải CV!");
    }
  };

  const getJobTitle = (application: Application) => {
    if (application.appliedJob) {
      return application.appliedJob.title;
    } else if (application.openPositionTitle) {
      return `${application.openPositionTitle} (Vị trí mở)`;
    }
    return "N/A";
  };

  const getApplicationType = (application: Application) => {
    if (application.appliedJob) {
      return "job";
    } else if (application.openPositionTitle) {
      return "open";
    }
    return "unknown";
  };

  return (
    <div className="min-h-screen p-8">
      <div className="w-full h-full p-6 bg-white rounded-xl shadow-md border">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-row justify-between items-center">
            <h2 className="font-bold text-2xl text-[#002147]">Quản lý hồ sơ</h2>
            <Button onClick={fetchApplications} disabled={loading}>
              {loading ? "Đang tải..." : "Làm mới"}
            </Button>
          </div>
          
          {/* Bộ lọc và tìm kiếm */}
          <div className="flex flex-row gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Lọc theo loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="job">Ứng tuyển công việc</SelectItem>
                <SelectItem value="open">Vị trí mở</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bảng danh sách */}
        {loading ? (
          <div className="text-center py-8">
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : filteredApplications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">STT</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Họ tên</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Số điện thoại</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Vị trí ứng tuyển</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Trình độ</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Loại</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Ngày nộp</th>
                  <th className="text-right py-4 px-4 font-semibold text-gray-700">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application, index) => (
                  <tr key={application._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">{index + 1}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {application.profilePicture ? (
                          <img
                            src={`${BASE_URL}${application.profilePicture}`}
                            alt={application.fullname}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <FiUser size={16} className="text-gray-500" />
                          </div>
                        )}
                        <span className="font-medium text-[#002147]">{application.fullname}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{application.email}</td>
                    <td className="py-4 px-4 text-gray-600">{application.phone}</td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium">{getJobTitle(application)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="secondary">{application.highestDegree}</Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge 
                        variant={getApplicationType(application) === "job" ? "default" : "outline"}
                        className={getApplicationType(application) === "job" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}
                      >
                        {getApplicationType(application) === "job" ? "Công việc" : "Vị trí mở"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {new Date(application.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetail(application)}
                          className="flex items-center gap-1"
                        >
                          <FiEye size={14} />
                          Chi tiết
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDownloadCV(application.cvFile, application.fullname)}
                          className="flex items-center gap-1 bg-[#FF5733] hover:bg-[#ff6b4a]"
                        >
                          <FiDownload size={14} />
                          Tải CV
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Không có ứng viên nào.</p>
          </div>
        )}
      </div>

      {/* Modal chi tiết ứng viên */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] min-w-[800px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#002147]">
              Chi tiết ứng viên: {selectedApplication?.fullname}
            </DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Thông tin cá nhân */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FiUser className="text-[#FF5733]" />
                    Thông tin cá nhân
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FiUser size={16} className="text-gray-500" />
                    <span className="font-medium">Họ tên:</span>
                    <span>{selectedApplication.fullname}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCalendar size={16} className="text-gray-500" />
                    <span className="font-medium">Ngày sinh:</span>
                    <span>{new Date(selectedApplication.birthdate).toLocaleDateString("vi-VN")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMail size={16} className="text-gray-500" />
                    <span className="font-medium">Email:</span>
                    <span>{selectedApplication.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone size={16} className="text-gray-500" />
                    <span className="font-medium">Số điện thoại:</span>
                    <span>{selectedApplication.phone}</span>
                  </div>
                  {selectedApplication.profilePicture && (
                    <div>
                      <span className="font-medium block mb-2">Ảnh đại diện:</span>
                      <img
                                                 src={`${BASE_URL}${selectedApplication.profilePicture}`}
                        alt={selectedApplication.fullname}
                        className="w-32 h-32 rounded-lg object-cover border"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Thông tin học vấn và kinh nghiệm */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Học vấn & Kinh nghiệm</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="font-medium">Trình độ cao nhất:</span>
                    <Badge className="ml-2">{selectedApplication.highestDegree}</Badge>
                  </div>
                  <div>
                    <span className="font-medium">Trình độ tiếng Anh:</span>
                    <Badge variant="outline" className="ml-2">{selectedApplication.englishLevel}</Badge>
                  </div>
                  <div>
                    <span className="font-medium">Mức lương mong muốn:</span>
                    <span className="ml-2 text-[#FF5733] font-semibold">{selectedApplication.expectedSalary}</span>
                  </div>
                  
                  {selectedApplication.graduationSchools.length > 0 && (
                    <div>
                      <span className="font-medium block mb-2">Trường học đã tốt nghiệp:</span>
                      <div className="space-y-2">
                        {selectedApplication.graduationSchools.map((school, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium">{school.school}</p>
                            <p className="text-sm text-gray-600">Chuyên ngành: {school.major}</p>
                            <p className="text-sm text-gray-600">Năm tốt nghiệp: {school.graduationYear}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Thông tin ứng tuyển */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin ứng tuyển</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="font-medium">Vị trí ứng tuyển:</span>
                    <span className="ml-2">{getJobTitle(selectedApplication)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Loại ứng tuyển:</span>
                    <Badge 
                      className="ml-2"
                      variant={getApplicationType(selectedApplication) === "job" ? "default" : "outline"}
                    >
                      {getApplicationType(selectedApplication) === "job" ? "Công việc cụ thể" : "Vị trí mở"}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Ngày nộp:</span>
                    <span className="ml-2">{new Date(selectedApplication.createdAt).toLocaleString("vi-VN")}</span>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => handleDownloadCV(selectedApplication.cvFile, selectedApplication.fullname)}
                      className="bg-[#FF5733] hover:bg-[#ff6b4a]"
                    >
                      <FiDownload className="mr-2" size={16} />
                      Tải CV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ApplicationList;

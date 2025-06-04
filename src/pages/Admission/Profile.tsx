import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Input } from "../../components/ui/input";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ProfileDialog from './ProfileDialog';
import type { AdmissionFormData } from '../../types/admission';
import { API_ENDPOINTS } from '../../lib/config';
import { api } from '../../lib/api';
import { toast } from "../../lib/toast";

interface Parent {
  fullName: string;
  phone: string;
  email: string;
  relationship: string;
  address: string;
}

interface EntranceTestRecord {
  testDate: string;
  result: 'Đạt' | 'Không đạt';
  note?: string;
}

interface Admission {
  _id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  currentClass: string;
  appliedClass: string;
  currentSchool: string;
  parents: Parent[];
  status: string;
  followUpType: string;
  createdAt: string;
  updatedAt: string;
  ace: string[];
  isChildOfStaff: boolean;
  howParentLearned: string;
  expectedSemester: string;
  admissionSupport: string;
  notes: string;
  followUpNote: string;
  entranceTests: EntranceTestRecord[];
}

const useAdmissions = () => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);

  const fetchAdmissions = useCallback(async () => {
    try {
      const data = await api.get<Admission[]>(API_ENDPOINTS.ADMISSIONS);
      if (Array.isArray(data)) {
        setAdmissions(data);
      } else {
        console.error('Invalid response format:', data);
        toast.error("Dữ liệu không đúng định dạng");
      }
    } catch (error: unknown) {
      console.error('Error fetching admissions:', error);
      const errorMessage = error instanceof Error ? error.message : "Không thể tải danh sách hồ sơ";
      toast.error(errorMessage);
    }
  }, []);

  const handleCreateAdmission = async (data: AdmissionFormData) => {
    try {
      await api.post(API_ENDPOINTS.ADMISSIONS, data);
      toast.success("Thêm hồ sơ thành công");
      fetchAdmissions();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && error.message.includes("400")
        ? "Dữ liệu không hợp lệ, vui lòng kiểm tra lại"
        : "Không thể thêm hồ sơ";
      toast.error(errorMessage);
    }
  };

  const handleUpdateAdmission = async (data: AdmissionFormData) => {
    try {
      if (!data._id) {
        toast.error("Không tìm thấy ID hồ sơ");
        return;
      }
      const response = await fetch(API_ENDPOINTS.ADMISSION(data._id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update admission');
      }

      await fetchAdmissions();
      toast.success("Đã cập nhật hồ sơ tuyển sinh");
    } catch (error) {
      console.error('Error updating admission:', error);
      toast.error("Có lỗi xảy ra khi cập nhật hồ sơ");
    }
  };

  const handleNextStage = async (id: string) => {
    try {
      const stages = ["Follow up", "Test", "After test", "Offer", "Paid"];
      const admission = admissions.find(a => a._id === id);
      if (!admission) return;

      const currentIndex = stages.indexOf(admission.status);
      if (currentIndex < stages.length - 1) {
        const nextStatus = stages[currentIndex + 1];
        await api.put(API_ENDPOINTS.ADMISSION_NEXT_STAGE(id), { nextStatus });
        toast.success("Chuyển giai đoạn thành công");
        fetchAdmissions();
      }
    } catch (error) {
      console.error('Error moving to next stage:', error);
      toast.error("Không thể chuyển giai đoạn");
    }
  };

  return { admissions, fetchAdmissions, handleCreateAdmission, handleUpdateAdmission, handleNextStage };
};

const Profile = () => {
  const { admissions, fetchAdmissions, handleCreateAdmission, handleUpdateAdmission } = useAdmissions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAdmissions();
  }, [fetchAdmissions]);

  const filteredAdmissions = admissions.filter(admission =>
    admission.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const transformAdmissionToFormData = (admission: Admission): AdmissionFormData => ({
    ...admission,
    ace: admission.ace || [],
    isChildOfStaff: admission.isChildOfStaff || false,
    howParentLearned: admission.howParentLearned || '',
    expectedSemester: admission.expectedSemester || '',
    admissionSupport: admission.admissionSupport || '',
    notes: admission.notes || '',
    followUpNote: admission.followUpNote || '',
    entranceTests: admission.entranceTests || []
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Quản lý hồ sơ tuyển sinh</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm kiếm theo họ tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={() => {
            setSelectedAdmission(null);
            setIsDialogOpen(true);
          }}>
            Thêm hồ sơ
          </Button>
        </div>
      </div>


      <div className="rounded-lg p-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Ngày sinh</TableHead>
                    <TableHead>Lớp hiện tại</TableHead>
                    <TableHead>Lớp đăng ký</TableHead>
                    <TableHead>Phụ huynh</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Follow-up</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmissions.map((admission) => (
                    <TableRow key={admission._id}>
                      <TableCell>{admission.fullName}</TableCell>
                      <TableCell>
                        {format(new Date(admission.dateOfBirth), 'dd/MM/yyyy', { locale: vi })}
                      </TableCell>
                      <TableCell>{admission.currentClass || 'N/A'}</TableCell>
                      <TableCell>{admission.appliedClass}</TableCell>
                      <TableCell>
                        {admission.parents.map((parent, index) => (
                          <div key={index}>
                            {parent.fullName} - {parent.phone}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${admission.status === 'Paid' ? 'bg-green-100 text-green-800' :
                          admission.status === 'Lost' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {admission.status}
                        </span>
                      </TableCell>
                      <TableCell>{admission.followUpType || 'N/A'}</TableCell>
                      <TableCell>
                        {format(new Date(admission.createdAt), 'dd/MM/yyyy', { locale: vi })}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAdmission(admission);
                            setIsDialogOpen(true);
                          }}
                        >
                         Cập nhật 
                        </Button>
                        {/* <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNextStage(admission._id)}
                          disabled={admission.status === 'Paid' || admission.status === 'Lost'}
                        >
                          Chuyển giai đoạn
                        </Button> */}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      <ProfileDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedAdmission(null);
        }}
        onSubmit={selectedAdmission ? handleUpdateAdmission : handleCreateAdmission}
        mode={selectedAdmission ? 'edit' : 'create'}
        admissionData={selectedAdmission ? transformAdmissionToFormData(selectedAdmission) : undefined}
      />
    </div>
  );
};

export default Profile;
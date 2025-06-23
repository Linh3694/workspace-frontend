import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { API_ENDPOINTS } from '../../lib/config';
import { useToast } from "../../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import { Switch } from "../../components/ui/switch";

interface Parent {
  parent: {
    _id: string;
    fullname: string;
    phone: string;
    email: string;
    user?: {
      _id: string;
      active: boolean;
    };
    address?: string;
  };
  relationship: "Bố" | "Mẹ" | "Khác";
}

interface Student {
  _id: string;
  studentCode: string;
  name: string;
}

interface Family {
  _id: string;
  familyCode: string;
  parents: Parent[];
  students: Student[];
  address: string;
  createdAt: string;
  updatedAt: string;
}

interface FamilyFormData {
  familyCode: string;
  parents: {
    fullname: string;
    phone: string;
    email: string;
    relationship: "Bố" | "Mẹ" | "Khác";
    createUser?: boolean;
    username?: string;
    password?: string;
    userId?: string;
    parentId?: string;
    active?: boolean;
  }[];
  address: string;
}

const FamilyList: React.FC = () => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [formData, setFormData] = useState<FamilyFormData>({
    familyCode: '',
    parents: [{
      fullname: '',
      phone: '',
      email: '',
      relationship: 'Bố',
      createUser: false,
      username: '',
      password: ''
    }],
    address: ''
  });
  const { toast } = useToast();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.FAMILIES);
      console.log('Dữ liệu gia đình từ API:', response.data);

      // Debug để xem chi tiết cấu trúc dữ liệu
      if (response.data.length > 0) {
        console.log('Sample family structure:', JSON.stringify(response.data[0], null, 2));
        if (response.data[0].parents?.length > 0) {
          console.log('Sample parent structure:', JSON.stringify(response.data[0].parents[0], null, 2));
        }
      }

      // Đảm bảo trường parents luôn là array và đầy đủ
      const processedFamilies = response.data.map((family: Family) => {
        if (!family.parents || !Array.isArray(family.parents)) {
          family.parents = [];
        }
        return family;
      });

      setFamilies(processedFamilies);
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi tải danh sách gia đình:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách gia đình. Vui lòng thử lại sau.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleCreateFamily = async () => {
    setLoading(true);
    let newFamilyId: string;

    try {
      console.log('Bắt đầu tạo gia đình với dữ liệu:', formData);
      
      // 1. Tạo Family trước
      const familyResponse = await axios.post(
        API_ENDPOINTS.FAMILIES,
        {
          familyCode: formData.familyCode,
          parents: [],
          address: formData.address
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      newFamilyId = familyResponse.data._id;
      console.log('Family đã tạo thành công với ID:', newFamilyId);

      // 2. Thêm từng parent vào, bắt lỗi riêng cho mỗi parent
      const addedParents = [];
              for (const parent of formData.parents) {
        try {
          console.log('Đang xử lý parent:', parent);
          let createdParentId: string;
          // Nếu tick tạo user
          if (parent.createUser) {
            if (!parent.password) {
              throw new Error(`Thiếu mật khẩu cho phụ huynh ${parent.fullname}`);
            }
            console.log('Tạo user cho parent:', parent.fullname);
            // Tạo user
            const userRes = await axios.post(
              API_ENDPOINTS.USERS,
              {
                username: parent.phone,
                phone: parent.phone,
                password: parent.password,
                email: parent.email,
                fullname: parent.fullname,
                role: 'parent'
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('User tạo thành công:', userRes.data);
            
            // Tạo parent với user
            const parentRes = await axios.post(
              API_ENDPOINTS.PARENTS,
              {
                user: userRes.data._id,
                fullname: parent.fullname,
                phone: parent.phone,
                email: parent.email
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Parent với user tạo thành công:', parentRes.data);
            createdParentId = parentRes.data._id;
          } else {
            console.log('Tạo parent không có user:', parent.fullname);
            // Tạo parent không có user
            const parentRes = await axios.post(
              API_ENDPOINTS.PARENTS,
              {
                fullname: parent.fullname,
                phone: parent.phone,
                email: parent.email
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Parent không có user tạo thành công:', parentRes.data);
            createdParentId = parentRes.data._id;
          }

          // Gắn parent vào Family
          console.log('Gắn parent vào family:', { parentId: createdParentId, relationship: parent.relationship });
          await axios.post(
            `${API_ENDPOINTS.FAMILIES}/${newFamilyId}/add-parent`,
            {
              parentId: createdParentId,
              relationship: parent.relationship
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log('Đã gắn parent vào family thành công');

          addedParents.push(parent.fullname);
        } catch (err: unknown) {
          console.error(`Lỗi khi thêm phụ huynh ${parent.fullname}:`, err);
          toast({
            title: `Phụ huynh ${parent.fullname}`,
            description: err instanceof Error ? err.message : "Không thể thêm phụ huynh.",
            variant: "destructive"
          });
          // Tiếp tục với parent tiếp theo
        }
      }

      // 3. Hoàn thành và tải lại bảng tự động
      if (addedParents.length > 0) {
        toast({
          title: "Thành công",
          description: `Đã thêm ${addedParents.length} phụ huynh vào gia đình.`,
        });
      }
      setIsCreateDialogOpen(false);
      // Reset form data
      setFormData({
        familyCode: '',
        parents: [{
          fullname: '',
          phone: '',
          email: '',
          relationship: 'Bố',
          createUser: false,
          username: '',
          password: ''
        }],
        address: ''
      });
      await fetchFamilies();
    } catch (err: unknown) {
      console.error('Lỗi khi tạo gia đình:', err);
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể tạo gia đình. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFamily = async () => {
    if (!selectedFamily) return;

    try {
      setLoading(true);
      console.log("Đang cập nhật gia đình với dữ liệu:", formData);

      // Cập nhật thông tin cơ bản của gia đình
      await axios.put(`${API_ENDPOINTS.FAMILIES}/${selectedFamily._id}`, {
        familyCode: formData.familyCode,
        address: formData.address
      });

      // Lấy danh sách userId của parent cũ (chỉ những parent đã có userId)
      const oldParentIds = selectedFamily.parents
        .map(p => p.parent && typeof p.parent === 'object' ? p.parent._id : undefined)
        .filter(Boolean);

      // Lấy danh sách userId của parent mới (chỉ những parent đã có userId)
      const newParentIds = formData.parents
        .map(p => p.parentId)
        .filter(Boolean);

      // Chỉ xóa những parent cũ không còn trong danh sách mới
      for (const oldId of oldParentIds) {
        if (!newParentIds.includes(oldId)) {
          await axios.delete(`${API_ENDPOINTS.FAMILIES}/${selectedFamily._id}/remove-parent/${oldId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }

      // Xử lý từng phụ huynh: update hoặc tạo mới rồi add
      for (const parent of formData.parents) {
        if (parent.parentId) {
          // Update parent hiện có
          await axios.put(
            `${API_ENDPOINTS.PARENTS}/${parent.parentId}`,
            { fullname: parent.fullname, phone: parent.phone, email: parent.email },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          await axios.patch(
            `${API_ENDPOINTS.FAMILIES}/${selectedFamily._id}/update-parent/${parent.parentId}`,
            { relationship: parent.relationship },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } else {
          // Tạo user nếu tick
          if (parent.createUser) {
            if (!parent.password) throw new Error(`Thiếu mật khẩu cho ${parent.fullname}`);
            const userRes = await axios.post(
              API_ENDPOINTS.USERS,
              { username: parent.phone, phone: parent.phone, password: parent.password, email: parent.email, fullname: parent.fullname, role: 'parent' },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const pRes = await axios.post(
              API_ENDPOINTS.PARENTS,
              { user: userRes.data._id, fullname: parent.fullname, phone: parent.phone, email: parent.email },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const parentId = pRes.data._id;
            await axios.post(
              `${API_ENDPOINTS.FAMILIES}/${selectedFamily._id}/add-parent`,
              { parentId, relationship: parent.relationship },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } else {
            const pRes = await axios.post(
              API_ENDPOINTS.PARENTS,
              { fullname: parent.fullname, phone: parent.phone, email: parent.email },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const parentId = pRes.data._id;
            await axios.post(
              `${API_ENDPOINTS.FAMILIES}/${selectedFamily._id}/add-parent`,
              { parentId, relationship: parent.relationship },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
        }
      }

      toast({
        title: "Thành công",
        description: "Cập nhật thông tin gia đình thành công",
      });
      setIsEditDialogOpen(false);
      setSelectedFamily(null);
      await fetchFamilies();
    } catch (error) {
      console.error('Lỗi khi cập nhật gia đình:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin gia đình. Vui lòng thử lại sau.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFamily = async (familyId: string) => {
    try {
      setLoading(true);
      console.log('Đang xóa family với ID:', familyId);
      console.log('Token:', token);
      const response = await axios.delete(`${API_ENDPOINTS.FAMILIES}/${familyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Phản hồi từ server:', response.data);
      toast({
        title: "Thành công",
        description: "Xóa gia đình thành công",
      });
      await fetchFamilies();
    } catch (error) {
      console.error('Lỗi khi xóa gia đình:', error);
      const errorMessage = (error as AxiosError<{ message: string }>)?.response?.data?.message || "Không thể xóa gia đình. Vui lòng thử lại sau.";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (familyId: string, studentId: string) => {
    try {
      setLoading(true);
      await axios.delete(`${API_ENDPOINTS.FAMILIES}/${familyId}/remove-student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: "Thành công",
        description: "Đã xoá học sinh khỏi gia đình",
      });
      await fetchFamilies();
    } catch (error) {
      console.error('Lỗi khi xoá học sinh khỏi gia đình:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xoá học sinh khỏi gia đình. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const editFamily = (family: Family) => {
    console.log('Thông tin gia đình cần sửa:', family);
    setSelectedFamily(family);

    // Đảm bảo family.parents là một mảng
    const familyParents = Array.isArray(family.parents) ? family.parents : [];

    // Xử lý dữ liệu phụ huynh
    const processedParents = familyParents
      .filter(p => p !== null && p !== undefined)
      .map(p => {
        if (p.parent && typeof p.parent === 'object') {
          return {
            fullname: p.parent.fullname || "",
            phone: p.parent.phone || "",
            email: p.parent.email || "",
            relationship: p.relationship || "Khác",
            parentId: p.parent._id,
            userId: p.parent.user && typeof p.parent.user === 'object' ? p.parent.user._id : (typeof p.parent.user === 'string' ? p.parent.user : undefined),
            active: p.parent.user && typeof p.parent.user === 'object' ? p.parent.user.active : undefined,
            createUser: false,
            password: ""
          };
        } else if (p.parent && typeof p.parent === 'string') {
          return {
            fullname: "Phụ huynh #" + (p.parent as string).substring(0, 5),
            phone: "",
            email: "",
            relationship: p.relationship || "Khác",
            parentId: p.parent,
            userId: undefined,
            active: undefined,
            createUser: false,
            password: ""
          };
        } else {
          return {
            fullname: "",
            phone: "",
            email: "",
            relationship: p.relationship || "Khác",
            createUser: false,
            password: ""
          };
        }
      });

    setFormData({
      familyCode: family.familyCode,
      parents: processedParents.length > 0 ? processedParents : [{
        fullname: '',
        phone: '',
        email: '',
        relationship: 'Bố',
        createUser: false,
        password: ''
      }],
      address: family.address
    });

    setIsEditDialogOpen(true);
  };

  const handleAddParent = () => {
    setFormData(prev => ({
      ...prev,
      parents: [...prev.parents, {
        fullname: '',
        phone: '',
        email: '',
        relationship: 'Bố',
        createUser: false,
        username: '',
        password: ''
      }]
    }));
  };

  const handleRemoveParent = (index: number) => {
    if (formData.parents.length > 1) {
      setFormData(prev => ({
        ...prev,
        parents: prev.parents.filter((_, i) => i !== index)
      }));
    }
  };

  const handleParentChange = (index: number, field: string, value: string | boolean) => {
    setFormData(prev => {
      const updatedParents = [...prev.parents];
      updatedParents[index] = {
        ...updatedParents[index],
        [field]: value
      };
      return {
        ...prev,
        parents: updatedParents
      };
    });
  };

  const handleToggleActive = async (userId: string, newStatus: boolean) => {
    try {
      await axios.patch(API_ENDPOINTS.USER(userId), { active: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: "Thành công", description: "Cập nhật trạng thái tài khoản thành công" });
      fetchFamilies();
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
      toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái tài khoản", variant: "destructive" });
    }
  };

  // Thêm helper function để hiển thị thông tin phụ huynh theo định dạng yêu cầu
  const formatParentInfo = (parent: Parent) => {
    if (!parent || !parent.parent || typeof parent.parent !== 'object') return '';

    const p = parent.parent;
    return (
      <div className="flex flex-col space-y-1">
        <div className="font-medium">{p.fullname || 'Không có tên'}</div>
        <div className="text-sm text-gray-600">
          <span className="inline-block min-w-20">Quan hệ:</span> {parent.relationship || 'Chưa có'}
        </div>
        <div className="text-sm text-gray-600">
          <span className="inline-block min-w-20">SĐT:</span> {p.phone || 'Chưa có SĐT'}
        </div>
        <div className="text-sm text-gray-600">
          <span className="inline-block min-w-20">Email:</span> {p.email || 'Chưa có email'}
        </div>
      </div>
    );
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      await fetchFamilies();
      toast({
        title: "Thành công",
        description: "Dữ liệu đã được cập nhật",
      });
    } catch (error) {
      console.error('Lỗi khi làm mới dữ liệu:', error);
      toast({
        title: "Lỗi",
        description: "Không thể làm mới dữ liệu. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFamilies = families.filter(family =>
    family.familyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    family.parents.some(p => {
      if (p.parent && typeof p.parent === 'object') {
        return p.parent.fullname?.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    })
  );

  const confirmDeleteFamily = (family: Family) => {
    setSelectedFamily(family);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedFamily) {
      await handleDeleteFamily(selectedFamily._id);
      setIsDeleteDialogOpen(false);
      setSelectedFamily(null);
    }
  };

  return (
    <div className="w-full mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Danh sách gia đình</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={refreshData} disabled={loading}>
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                    Đang tải...
                  </>
                ) : (
                  <>Làm mới</>
                )}
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>Thêm gia đình</Button>
            </div>
          </div>
          <CardDescription>Quản lý thông tin gia đình học sinh</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Tìm kiếm theo mã gia đình hoặc tên phụ huynh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-lg">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã gia đình</TableHead>
                    <TableHead>Học sinh</TableHead>
                    <TableHead>Thông tin phụ huynh</TableHead>
                    <TableHead>Địa chỉ</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFamilies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        Không có dữ liệu gia đình
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFamilies.flatMap((family) => {
                      // Nếu không có học sinh, hiển thị một dòng duy nhất
                      if (!family.students || family.students.length === 0) {
                        return (
                          <TableRow key={family._id}>
                            <TableCell className="font-medium" rowSpan={1}>{family.familyCode}</TableCell>
                            <TableCell>Chưa có học sinh</TableCell>
                            <TableCell>
                              {family.parents && Array.isArray(family.parents) && family.parents.length > 0
                                ? family.parents.map((p, idx) => (
                                  <div key={idx} className="py-3 mb-2 border-b border-gray-200 last:border-b-0 last:mb-0">
                                    {typeof p.parent === 'object'
                                      ? formatParentInfo(p)
                                      : <span className="italic text-gray-500">Chưa có thông tin phụ huynh</span>
                                    }
                                  </div>
                                ))
                                : 'Chưa thiết lập'}
                            </TableCell>
                            <TableCell>{family.address}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => editFamily(family)}
                              >
                                Sửa
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => confirmDeleteFamily(family)}
                              >
                                Xóa
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      // Nếu có học sinh, mỗi học sinh một dòng
                      return family.students.map((student, studentIndex) => (
                        <TableRow key={`${family._id}-${student._id}`}>
                          {/* Chỉ hiển thị mã gia đình ở dòng đầu tiên, các dòng còn lại để trống */}
                          {studentIndex === 0 ? (
                            <TableCell className="font-medium" rowSpan={family.students.length}>{family.familyCode}</TableCell>
                          ) : null}

                          <TableCell>{student.name} ({student.studentCode})</TableCell>

                          {/* Chỉ hiển thị thông tin phụ huynh ở dòng đầu tiên, các dòng còn lại để trống */}
                          {studentIndex === 0 ? (
                            <TableCell rowSpan={family.students.length}>
                              {family.parents && Array.isArray(family.parents) && family.parents.length > 0
                                ? family.parents.map((p, idx) => (
                                  <div key={idx} className="py-3 mb-2 border-b border-gray-200 last:border-b-0 last:mb-0">
                                    {typeof p.parent === 'object'
                                      ? formatParentInfo(p)
                                      : <span className="italic text-gray-500">Chưa có thông tin phụ huynh</span>
                                    }
                                  </div>
                                ))
                                : 'Chưa thiết lập'}
                            </TableCell>
                          ) : null}

                          {/* Chỉ hiển thị địa chỉ ở dòng đầu tiên */}
                          {studentIndex === 0 ? (
                            <TableCell rowSpan={family.students.length}>{family.address}</TableCell>
                          ) : null}

                          {/* Luôn hiển thị ô thao tác cho mỗi học sinh (không dùng rowSpan, không điều kiện) */}
                          <TableCell className="text-right space-x-2">
                            {studentIndex === 0 && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => editFamily(family)}
                                >
                                  Sửa
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => confirmDeleteFamily(family)}
                                >
                                  Xóa
                                </Button>
                              </>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveStudent(family._id, student._id)}
                            >
                              Xóa HS
                            </Button>
                          </TableCell>
                        </TableRow>
                      ));
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog thêm gia đình mới */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Thêm gia đình mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin gia đình mới
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="familyCode" className="text-right">
                Mã gia đình
              </Label>
              <Input
                id="familyCode"
                value={formData.familyCode}
                onChange={(e) => setFormData(prev => ({ ...prev, familyCode: e.target.value }))}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Địa chỉ
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="col-span-3"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Danh sách phụ huynh</h3>
                <Button type="button" variant="outline" onClick={handleAddParent}>
                  Thêm phụ huynh
                </Button>
              </div>
              {formData.parents.map((parent, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-md">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Phụ huynh {index + 1}</h4>
                    {formData.parents.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveParent(index)}
                      >
                        Xóa
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`parent-fullname-${index}`} className="text-right">
                      Họ và tên
                    </Label>
                    <Input
                      id={`parent-fullname-${index}`}
                      value={parent.fullname}
                      onChange={(e) => handleParentChange(index, 'fullname', e.target.value)}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`parent-phone-${index}`} className="text-right">
                      Số điện thoại
                    </Label>
                    <Input
                      id={`parent-phone-${index}`}
                      value={parent.phone}
                      onChange={(e) => handleParentChange(index, 'phone', e.target.value)}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`parent-email-${index}`} className="text-right">
                      Email
                    </Label>
                    <Input
                      id={`parent-email-${index}`}
                      value={parent.email}
                      onChange={(e) => handleParentChange(index, 'email', e.target.value)}
                      className="col-span-3"
                      type="email"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`parent-relationship-${index}`} className="text-right">
                      Quan hệ
                    </Label>
                    <Select
                      value={parent.relationship}
                      onValueChange={(value) => handleParentChange(index, 'relationship', value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Chọn quan hệ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bố">Bố</SelectItem>
                        <SelectItem value="Mẹ">Mẹ</SelectItem>
                        <SelectItem value="Khác">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Tài khoản</Label>
                    <div className="col-span-3 flex items-center space-x-2">
                      {parent.userId ? (
                        <>
                          <span>
                            {parent.active ? (
                              <span className="text-green-600 font-semibold">Đang hoạt động</span>
                            ) : (
                              <span className="text-red-600 font-semibold">Đã khóa</span>
                            )}
                          </span>
                          <Switch
                            checked={!!parent.active}
                            onCheckedChange={checked => handleToggleActive(parent.userId!, checked)}
                          />
                        </>
                      ) : (
                        <>
                          <Checkbox
                            id={`parent-create-user-${index}`}
                            checked={parent.createUser}
                            onCheckedChange={(checked) => handleParentChange(index, 'createUser', !!checked)}
                          />
                          <Label htmlFor={`parent-create-user-${index}`} className="cursor-pointer">
                            Tạo tài khoản phụ huynh
                          </Label>
                        </>
                      )}
                    </div>
                  </div>

                  {parent.createUser && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`parent-password-${index}`} className="text-right">Mật khẩu</Label>
                      <div className="col-span-3 flex gap-2">
                        <Input
                          id={`parent-password-${index}`}
                          type="text"
                          value={parent.password}
                          onChange={(e) => handleParentChange(index, 'password', e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const random = Math.random().toString(36).slice(-8);
                            handleParentChange(index, 'password', random);
                          }}
                        >
                          Tạo ngẫu nhiên
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateFamily}>
              Thêm mới
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog cập nhật gia đình */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Cập nhật thông tin gia đình</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin gia đình
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-familyCode" className="text-right">
                Mã gia đình
              </Label>
              <Input
                id="edit-familyCode"
                value={formData.familyCode}
                onChange={(e) => setFormData(prev => ({ ...prev, familyCode: e.target.value }))}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-address" className="text-right">
                Địa chỉ
              </Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="col-span-3"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Danh sách phụ huynh</h3>
                <Button type="button" variant="outline" onClick={handleAddParent}>
                  Thêm phụ huynh
                </Button>
              </div>
              {formData.parents.map((parent, index) => {
                const isHasUser = !!parent.userId;

                return (
                  <div key={index} className="space-y-4 p-4 border rounded-md">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Phụ huynh {index + 1}</h4>
                      {formData.parents.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveParent(index)}
                        >
                          Xóa
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`edit-parent-fullname-${index}`} className="text-right">
                        Họ và tên
                      </Label>
                      <Input
                        id={`edit-parent-fullname-${index}`}
                        value={parent.fullname}
                        onChange={(e) => handleParentChange(index, 'fullname', e.target.value)}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`edit-parent-phone-${index}`} className="text-right">
                        Số điện thoại
                      </Label>
                      <Input
                        id={`edit-parent-phone-${index}`}
                        value={parent.phone}
                        onChange={(e) => handleParentChange(index, 'phone', e.target.value)}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`edit-parent-email-${index}`} className="text-right">
                        Email
                      </Label>
                      <Input
                        id={`edit-parent-email-${index}`}
                        value={parent.email}
                        onChange={(e) => handleParentChange(index, 'email', e.target.value)}
                        className="col-span-3"
                        type="email"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`edit-parent-relationship-${index}`} className="text-right">
                        Quan hệ
                      </Label>
                      <Select
                        value={parent.relationship}
                        onValueChange={(value) => handleParentChange(index, 'relationship', value)}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Chọn quan hệ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bố">Bố</SelectItem>
                          <SelectItem value="Mẹ">Mẹ</SelectItem>
                          <SelectItem value="Khác">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Tài khoản</Label>
                      <div className="col-span-3 flex items-center space-x-2">
                        {isHasUser ? (
                          <>
                            <span>
                              {parent.active ? (
                                <span className="text-green-600 ">Đang hoạt động</span>
                              ) : (
                                <span className="text-red-600 ">Đã khóa</span>
                              )}
                            </span>
                          </>
                        ) : (
                          <>
                            <Checkbox
                              id={`edit-parent-create-user-${index}`}
                              checked={parent.createUser}
                              onCheckedChange={(checked) => handleParentChange(index, 'createUser', !!checked)}
                            />
                            <Label htmlFor={`edit-parent-create-user-${index}`} className="cursor-pointer">
                              Tạo tài khoản phụ huynh
                            </Label>
                          </>
                        )}
                      </div>
                    </div>

                    {parent.createUser && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`edit-parent-password-${index}`} className="text-right">Mật khẩu</Label>
                        <div className="col-span-3 flex gap-2">
                          <Input
                            id={`edit-parent-password-${index}`}
                            type="text"
                            value={parent.password}
                            onChange={(e) => handleParentChange(index, 'password', e.target.value)}
                            required
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const random = Math.random().toString(36).slice(-8);
                              handleParentChange(index, 'password', random);
                            }}
                          >
                            Tạo ngẫu nhiên
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateFamily}>
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa gia đình */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa gia đình</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa gia đình này?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleConfirmDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyList;

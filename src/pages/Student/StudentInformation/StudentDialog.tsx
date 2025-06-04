import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../../../components/ui/tabs";
import { Checkbox } from "../../../components/ui/checkbox";
import { format } from 'date-fns';
import { useToast } from "../../../hooks/use-toast";
import axios from 'axios';
import { API_ENDPOINTS } from '../../../lib/config';
import { Combobox } from '../../../components/ui/combobox';

interface Parent {
    _id?: string;
    fullname: string;
    phone: string;
    email: string;
    createAccount?: boolean;
    password?: string;
    relationship?: "Bố" | "Mẹ" | "Khác";
}

interface StudentFormData {
    _id?: string;
    studentCode: string;
    name: string;
    gender: 'male' | 'female' | 'other';
    birthDate: string;
    address: string;
    email: string;
    parents: Parent[];
    status: 'active' | 'transferred' | 'dropped';
    avatar?: File | string;
    family?: string;
}

interface Family {
    _id: string;
    familyCode: string;
    parents: {
        parent: Parent;
        relationship: string;
    }[];
    students: {
        _id: string;
        studentCode: string;
        name: string;
    }[];
    address: string;
}

interface StudentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: StudentFormData) => void;
    onDelete?: (studentId: string) => void;
    mode: 'create' | 'edit';
    studentData?: StudentFormData;
}

// Thêm interface riêng cho parent trong dialog tạo mới gia đình
interface FamilyParentForm {
    fullname: string;
    phone: string;
    email: string;
    relationship: "Bố" | "Mẹ" | "Khác";
    createUser: boolean;
    password: string;
}

const StudentDialog = ({ open, onOpenChange, onSubmit, onDelete, mode, studentData }: StudentDialogProps) => {
    const defaultFormData: StudentFormData = {
        studentCode: '',
        name: '',
        gender: 'male',
        birthDate: format(new Date(), 'yyyy-MM-dd'),
        address: '',
        email: '',
        parents: [{
            fullname: '',
            phone: '',
            email: '',
            createAccount: false,
            password: '',
        }],
        status: 'active',
        avatar: undefined
    };

    const [formData, setFormData] = useState<StudentFormData>(defaultFormData);
    const [activeTab, setActiveTab] = useState<string>("basic");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [families, setFamilies] = useState<Family[]>([]);
    const [selectedFamilyId, setSelectedFamilyId] = useState<string | undefined>(undefined);
    const [family, setFamily] = useState<Family | null>(null);
    const [loading, setLoading] = useState(false);
    const [showCreateFamily, setShowCreateFamily] = useState(false);
    const [familyFormData, setFamilyFormData] = useState<{
        familyCode: string;
        parents: FamilyParentForm[];
        address: string;
    }>({
        familyCode: '',
        parents: [{
            fullname: '',
            phone: '',
            email: '',
            relationship: 'Bố',
            createUser: false,
            password: ''
        }],
        address: ''
    });
    const { toast } = useToast();

    // Cập nhật form khi dialog mở và có studentData
    useEffect(() => {
        if (open && studentData) {
            setFormData({
                ...studentData,
                birthDate: studentData.birthDate ? format(new Date(studentData.birthDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                parents: studentData.parents && studentData.parents.length > 0
                    ? studentData.parents.map(parent => ({
                        ...parent,
                        createAccount: false,
                        password: '',
                    }))
                    : [{
                        fullname: '',
                        phone: '',
                        email: '',
                        createAccount: false,
                        password: '',
                    }]
            });

            // Nếu student có family, cập nhật selectedFamilyId
            if (studentData.family) {
                setSelectedFamilyId(studentData.family.toString());
            }
        } else if (!open) {
            // Reset form khi dialog đóng
            setFormData(defaultFormData);
            setActiveTab("basic");
            setSelectedFamilyId(undefined);
        }
    }, [open, studentData]);

    // Fetch danh sách gia đình khi mở dialog
    useEffect(() => {
        if (open) {
            axios.get(API_ENDPOINTS.FAMILIES).then(res => {
                setFamilies(res.data);

                // Nếu đã có selectedFamilyId (học sinh có gia đình)
                // tự động chọn family sau khi fetch data
                if (selectedFamilyId) {
                    const fam = res.data.find((f: Family) => f._id === selectedFamilyId);
                    if (fam) {
                        setFamily(fam);
                    }
                }
            });
        }
    }, [open, selectedFamilyId]);

    // Khi chọn gia đình từ Combobox
    useEffect(() => {
        if (selectedFamilyId) {
            const fam = families.find(f => f._id === selectedFamilyId) || null;
            setFamily(fam);
            if (fam) {
                setFormData(prev => ({
                    ...prev,
                    family: selectedFamilyId,
                    parents: fam.parents
                        .filter(p => p.parent)
                        .map((p) => ({
                            fullname: p.parent.fullname,
                            phone: p.parent.phone,
                            email: p.parent.email,
                            createAccount: false,
                            password: '',
                        }))
                }));
            }
        } else {
            setFamily(null);
        }
    }, [selectedFamilyId, families]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (name: string, value: string): void => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        onSubmit(formData);
    };

    // Dialog tạo mới gia đình (rút gọn từ Family.tsx)
    const handleCreateFamilySubmit = async () => {
        try {
            setLoading(true);
            // Tạo user cho từng phụ huynh nếu được chọn
            const parentsWithUsers = await Promise.all(
                familyFormData.parents.map(async (parent) => {
                    if (parent.createUser) {
                        // Tạo user mới
                        const userResponse = await axios.post(API_ENDPOINTS.USERS, {
                            username: parent.phone,
                            password: parent.password,
                            email: parent.email,
                            fullname: parent.fullname,
                            role: 'parent'
                        });
                        // Tạo parent mới với user vừa tạo
                        const parentResponse = await axios.post(API_ENDPOINTS.PARENTS, {
                            user: userResponse.data._id,
                            fullname: parent.fullname,
                            phone: parent.phone,
                            email: parent.email
                        });
                        return {
                            parent: parentResponse.data._id,
                            relationship: parent.relationship
                        };
                    }
                    return {
                        fullname: parent.fullname,
                        phone: parent.phone,
                        email: parent.email,
                        relationship: parent.relationship
                    };
                })
            );
            // Tạo gia đình với thông tin phụ huynh đã được cập nhật
            const res = await axios.post(API_ENDPOINTS.FAMILIES, {
                familyCode: familyFormData.familyCode,
                parents: parentsWithUsers,
                address: familyFormData.address
            });
            toast({
                title: "Thành công",
                description: "Thêm gia đình mới thành công",
            });
            setShowCreateFamily(false);
            setFamilies(prev => [...prev, res.data]);
            setSelectedFamilyId(res.data._id);

            // Thêm family vào formData
            setFormData(prev => ({
                ...prev,
                family: res.data._id
            }));
        } catch (err) {
            console.error('Lỗi khi tạo gia đình:', err);
            toast({
                title: "Lỗi",
                description: "Không thể thêm gia đình. Vui lòng thử lại sau.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {mode === 'create' && 'Thêm học sinh mới'}
                            {mode === 'edit' && 'Cập nhật thông tin học sinh'}
                        </DialogTitle>
                        <DialogDescription>
                            {mode === 'create' && 'Nhập thông tin học sinh mới'}
                            {mode === 'edit' && 'Cập nhật thông tin học sinh'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid grid-cols-2 mb-4">
                                <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
                                <TabsTrigger value="parents">Thông tin phụ huynh</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="studentCode" className="text-right">
                                        Mã học sinh
                                    </Label>
                                    <Input
                                        id="studentCode"
                                        name="studentCode"
                                        value={formData.studentCode}
                                        onChange={handleInputChange}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Họ và tên
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="gender" className="text-right">
                                        Giới tính
                                    </Label>
                                    <Select
                                        name="gender"
                                        value={formData.gender}
                                        onValueChange={(value) => handleSelectChange('gender', value)}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Chọn giới tính" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Nam</SelectItem>
                                            <SelectItem value="female">Nữ</SelectItem>
                                            <SelectItem value="other">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="birthDate" className="text-right">
                                        Ngày sinh
                                    </Label>
                                    <Input
                                        id="birthDate"
                                        name="birthDate"
                                        type="date"
                                        value={formData.birthDate}
                                        onChange={handleInputChange}
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
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="email" className="text-right">
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="status" className="text-right">
                                        Trạng thái
                                    </Label>
                                    <Select
                                        name="status"
                                        value={formData.status}
                                        onValueChange={(value) => handleSelectChange('status', value)}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Chọn trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Đang học</SelectItem>
                                            <SelectItem value="transferred">Đã chuyển trường</SelectItem>
                                            <SelectItem value="dropped">Đã nghỉ học</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="avatar" className="text-right">
                                        Ảnh học sinh
                                    </Label>
                                    <div className="col-span-3 space-y-2">
                                        <Input
                                            id="avatar"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) =>
                                                setFormData(prev => ({ ...prev, avatar: e.target.files?.[0] }))
                                            }
                                        />
                                        {formData.avatar && typeof formData.avatar !== 'string' && (
                                            <img
                                                src={URL.createObjectURL(formData.avatar)}
                                                alt="preview"
                                                className="h-24 w-24 object-cover rounded"
                                            />
                                        )}
                                        {typeof formData.avatar === 'string' && formData.avatar && (
                                            <img
                                                src={formData.avatar}
                                                alt="preview"
                                                className="h-24 w-24 object-cover rounded"
                                            />
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="parents" className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label>Mã gia đình</Label>
                                        <Button type="button" onClick={() => setShowCreateFamily(true)}>
                                            Tạo gia đình mới
                                        </Button>
                                    </div>
                                    <Combobox
                                        options={families.map(f => ({
                                            value: f._id,
                                            label: `${f.familyCode} - ${f.parents.map(p => p.parent?.fullname || "Không có tên").join(', ')}`
                                        }))}
                                        value={selectedFamilyId}
                                        onSelect={setSelectedFamilyId}
                                        placeholder="Chọn hoặc tìm kiếm gia đình..."
                                        searchPlaceholder="Tìm kiếm mã hoặc tên phụ huynh..."
                                    />
                                    {family && (
                                        <div className="space-y-4 p-4 border rounded-md">
                                            <h3 className="font-medium">Thông tin gia đình</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Mã gia đình</Label>
                                                    <p>{family.familyCode}</p>
                                                </div>
                                                <div>
                                                    <Label>Địa chỉ</Label>
                                                    <p>{family.address}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <Label>Danh sách phụ huynh</Label>
                                                <div className="mt-2 space-y-2">
                                                    {family.parents.filter(p => p.parent).length === 0 ? (
                                                        <div className="italic text-gray-500">Chưa có phụ huynh</div>
                                                    ) : (
                                                        family.parents.filter(p => p.parent).map((p, index) => (
                                                            <div key={index} className="p-2 border rounded">
                                                                <p className="font-medium">{p.parent.fullname || "Không có tên"}</p>
                                                                <p>Quan hệ: {p.relationship}</p>
                                                                <p>SĐT: {p.parent.phone || "Không có số"}</p>
                                                                <p>Email: {p.parent.email || "Không có email"}</p>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <Label>Học sinh trong gia đình</Label>
                                                <div className="mt-2 space-y-2">
                                                    {family.students.map((s) => (
                                                        <div key={s._id} className="p-2 border rounded">
                                                            <p className="font-medium">{s.name}</p>
                                                            <p>Mã học sinh: {s.studentCode}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>

                        <DialogFooter className="mt-6 flex space-x-2 justify-between">
                            <div>
                                {mode === 'edit' && onDelete && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => setIsDeleteDialogOpen(true)}
                                    >
                                        Xóa học sinh
                                    </Button>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Hủy
                                </Button>
                                <Button type="submit">
                                    {mode === 'create' ? 'Thêm mới' : 'Cập nhật'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog tạo mới gia đình */}
            <Dialog open={showCreateFamily} onOpenChange={setShowCreateFamily}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Thêm gia đình mới</DialogTitle>
                        <DialogDescription>Nhập thông tin gia đình mới</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="familyCode" className="text-right">Mã gia đình</Label>
                            <Input
                                id="familyCode"
                                value={familyFormData.familyCode}
                                onChange={e => setFamilyFormData(prev => ({ ...prev, familyCode: e.target.value }))}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">Địa chỉ</Label>
                            <Input
                                id="address"
                                value={familyFormData.address}
                                onChange={e => setFamilyFormData(prev => ({ ...prev, address: e.target.value }))}
                                className="col-span-3"
                            />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium">Danh sách phụ huynh</h3>
                                <Button type="button" variant="outline" onClick={() => setFamilyFormData(prev => ({ ...prev, parents: [...prev.parents, { fullname: '', phone: '', email: '', relationship: 'Bố', createUser: false, password: '' }] }))}>
                                    Thêm phụ huynh
                                </Button>
                            </div>
                            {familyFormData.parents.map((parent, index) => (
                                <div key={index} className="space-y-4 p-4 border rounded-md">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-medium">Phụ huynh {index + 1}</h4>
                                        {familyFormData.parents.length > 1 && (
                                            <Button type="button" variant="outline" size="sm" onClick={() => setFamilyFormData(prev => ({ ...prev, parents: prev.parents.filter((_, i) => i !== index) }))}>
                                                Xóa
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor={`parent-fullname-${index}`} className="text-right">Họ và tên</Label>
                                        <Input
                                            id={`parent-fullname-${index}`}
                                            value={parent.fullname}
                                            onChange={e => setFamilyFormData(prev => { const updated = [...prev.parents]; updated[index] = { ...updated[index], fullname: e.target.value }; return { ...prev, parents: updated }; })}
                                            className="col-span-3"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor={`parent-phone-${index}`} className="text-right">Số điện thoại</Label>
                                        <Input
                                            id={`parent-phone-${index}`}
                                            value={parent.phone}
                                            onChange={e => setFamilyFormData(prev => { const updated = [...prev.parents]; updated[index] = { ...updated[index], phone: e.target.value }; return { ...prev, parents: updated }; })}
                                            className="col-span-3"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor={`parent-email-${index}`} className="text-right">Email</Label>
                                        <Input
                                            id={`parent-email-${index}`}
                                            value={parent.email}
                                            onChange={e => setFamilyFormData(prev => { const updated = [...prev.parents]; updated[index] = { ...updated[index], email: e.target.value }; return { ...prev, parents: updated }; })}
                                            className="col-span-3"
                                            type="email"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor={`parent-relationship-${index}`} className="text-right">Quan hệ</Label>
                                        <Select
                                            value={parent.relationship}
                                            onValueChange={value => setFamilyFormData(prev => { const updated = [...prev.parents]; updated[index] = { ...updated[index], relationship: value as "Bố" | "Mẹ" | "Khác" }; return { ...prev, parents: updated }; })}
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
                                            <Checkbox
                                                id={`parent-create-user-${index}`}
                                                checked={parent.createUser}
                                                onCheckedChange={checked => setFamilyFormData(prev => { const updated = [...prev.parents]; updated[index] = { ...updated[index], createUser: !!checked }; return { ...prev, parents: updated }; })}
                                            />
                                            <Label htmlFor={`parent-create-user-${index}`} className="cursor-pointer">Tạo tài khoản phụ huynh</Label>
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
                                                    onChange={e => setFamilyFormData(prev => { const updated = [...prev.parents]; updated[index] = { ...updated[index], password: e.target.value }; return { ...prev, parents: updated }; })}
                                                    required
                                                />
                                                <Button type="button" variant="outline" onClick={() => setFamilyFormData(prev => { const updated = [...prev.parents]; updated[index] = { ...updated[index], password: Math.random().toString(36).slice(-8) }; return { ...prev, parents: updated }; })}>
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
                        <Button type="button" variant="outline" onClick={() => setShowCreateFamily(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleCreateFamilySubmit} disabled={loading}>
                            Thêm mới
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog xác nhận xóa học sinh */}
            {mode === 'edit' && onDelete && formData._id && (
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa học sinh</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bạn có chắc chắn muốn xóa học sinh này? Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    onDelete(formData._id as string);
                                    setIsDeleteDialogOpen(false);
                                    onOpenChange(false);
                                }}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Xóa
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    );
};

export default StudentDialog; 
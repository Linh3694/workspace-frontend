import React, { useCallback, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox"
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "../../lib/toast";
import { DatePicker } from "../../components/ui/datepicker";
import { format } from "date-fns";
import type { AdmissionFormData, ParentFormData, EntranceTestRecord } from "../../types/admission";

interface ProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: AdmissionFormData) => void;
    mode: 'create' | 'edit';
    admissionData?: AdmissionFormData;
}

const schema = z.object({
    fullName: z.string().min(1, "Họ tên là bắt buộc"),
    dateOfBirth: z.string().min(1, "Ngày sinh là bắt buộc"),
    gender: z.string(),
    currentClass: z.string(),
    appliedClass: z.string().min(1, "Lớp đăng ký là bắt buộc"),
    currentSchool: z.string(),
    ace: z.array(z.string()),
    isChildOfStaff: z.boolean(),
    parents: z.array(z.object({
        fullName: z.string().min(1, "Họ tên phụ huynh là bắt buộc"),
        phone: z.string().min(1, "Số điện thoại là bắt buộc"),
        email: z.string().email("Email không hợp lệ"),
        relationship: z.string(),
        address: z.string(),
    })).min(1, "Phải có ít nhất một phụ huynh"),
    howParentLearned: z.string(),
    expectedSemester: z.string(),
    admissionSupport: z.string(),
    notes: z.string(),
    status: z.string(),
    followUpType: z.string(),
    followUpNote: z.string(),
    entranceTests: z.array(z.object({
        testDate: z.string(),
        result: z.enum(['Đạt', 'Không đạt']),
        note: z.string().optional()
    }))
});

const ProfileDialog = ({ open, onOpenChange, onSubmit, mode, admissionData }: ProfileDialogProps) => {
    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<AdmissionFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            fullName: '',
            dateOfBirth: '',
            gender: '',
            currentClass: '',
            appliedClass: '',
            currentSchool: '',
            ace: [],
            isChildOfStaff: false,
            parents: [],
            howParentLearned: '',
            expectedSemester: '',
            admissionSupport: '',
            notes: '',
            status: 'Follow up',
            followUpType: 'Cold',
            followUpNote: '',
            entranceTests: []
        },
    });

    const parents = watch('parents');
    const [parentFormData, setParentFormData] = React.useState<ParentFormData>({
        fullName: '',
        phone: '',
        email: '',
        relationship: '',
        address: ''
    });

    const [testFormData, setTestFormData] = React.useState<EntranceTestRecord>({
        testDate: '',
        result: 'Đạt',
        note: ''
    });

    useEffect(() => {
        if (open && admissionData) {
            reset(admissionData);
        } else if (!open) {
            reset({
                fullName: '',
                dateOfBirth: '',
                gender: '',
                currentClass: '',
                appliedClass: '',
                currentSchool: '',
                ace: [],
                isChildOfStaff: false,
                parents: [],
                howParentLearned: '',
                expectedSemester: '',
                admissionSupport: '',
                notes: '',
                status: 'Follow up',
                followUpType: 'Cold',
                followUpNote: '',
                entranceTests: []
            });
            setParentFormData({
                fullName: '',
                phone: '',
                email: '',
                relationship: '',
                address: ''
            });
            setTestFormData({
                testDate: '',
                result: 'Đạt',
                note: ''
            });
        }
    }, [open, admissionData, reset]);

    const handleParentInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setParentFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const handleSelectChange = useCallback((name: string, value: string): void => {
        setValue(name as keyof AdmissionFormData, value);
    }, [setValue]);

    const handleAddParent = useCallback((): void => {
        if (parentFormData.fullName && parentFormData.phone) {
            setValue('parents', [...parents, parentFormData]);
            setParentFormData({
                fullName: '',
                phone: '',
                email: '',
                relationship: '',
                address: ''
            });
        }
    }, [parentFormData, parents, setValue]);

    const handleRemoveParent = useCallback((index: number): void => {
        setValue('parents', parents.filter((_, i) => i !== index));
    }, [parents, setValue]);

    const handleTestInputChange = useCallback((name: keyof EntranceTestRecord, value: string) => {
        setTestFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const handleTestDateChange = useCallback((date: Date | undefined): void => {
        if (date) {
            setTestFormData(prev => ({
                ...prev,
                testDate: format(date, 'yyyy-MM-dd')
            }));
        }
    }, []);

    const handleAddTest = useCallback(() => {
        if (testFormData.testDate && testFormData.result) {
            const currentTests = watch('entranceTests') || [];
            setValue('entranceTests', [...currentTests, testFormData]);
            setTestFormData({
                testDate: '',
                result: 'Đạt',
                note: ''
            });
        } else {
            toast.error("Vui lòng nhập đầy đủ thời gian và kết quả kiểm tra");
        }
    }, [testFormData, setValue, watch]);

    const handleRemoveTest = useCallback((index: number) => {
        const currentTests = watch('entranceTests') || [];
        setValue('entranceTests', currentTests.filter((_, i) => i !== index));
    }, [watch, setValue]);

    const onSubmitForm = (data: AdmissionFormData) => {
        console.log('Form data:', data);
        console.log('Form errors:', errors);
        try {
            if (data.status === 'Test' && !data.entranceTests?.some(test => test.testDate && test.result)) {
                toast.error("Cần có ít nhất một bản ghi kiểm tra đầu vào có thời gian và kết quả");
                return;
            }

            if (mode === 'create' && !data.gender) {
                data.gender = 'Nam';
            }

            if (mode === 'edit' && admissionData) {
                data._id = admissionData._id;
                data.entranceTests = watch('entranceTests') || [];
            }

            onSubmit(data);
            
            if (mode === 'create') {
                reset({
                    fullName: '',
                    dateOfBirth: '',
                    gender: '',
                    currentClass: '',
                    appliedClass: '',
                    currentSchool: '',
                    ace: [],
                    isChildOfStaff: false,
                    parents: [],
                    howParentLearned: '',
                    expectedSemester: '',
                    admissionSupport: '',
                    notes: '',
                    status: 'Follow up',
                    followUpType: 'Cold',
                    followUpNote: '',
                    entranceTests: []
                });
                setParentFormData({
                    fullName: '',
                    phone: '',
                    email: '',
                    relationship: '',
                    address: ''
                });
                setTestFormData({
                    testDate: '',
                    result: 'Đạt',
                    note: ''
                });
            }
            onOpenChange(false);
            toast.success(mode === 'create' ? "Đã thêm hồ sơ tuyển sinh mới" : "Đã cập nhật hồ sơ tuyển sinh");
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error("Có lỗi xảy ra khi thêm hồ sơ");
        }
    };

    const onError = (errors: FieldErrors<AdmissionFormData>) => {
        console.error('Form validation errors:', errors);
        
        if (errors.parents?.[0]?.email?.message) {
            toast.error(errors.parents[0].email.message);
            return;
        }

        const firstErrorKey = Object.keys(errors)[0];
        const firstError = errors[firstErrorKey as keyof AdmissionFormData];
        if (firstError && typeof firstError === 'object' && 'message' in firstError) {
            toast.error(firstError.message as string);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="md:max-w-[700px] lg:max-w-[800px] max-h-[80vh] overflow-y-hidden hover:overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Thêm hồ sơ tuyển sinh mới' : 'Cập nhật hồ sơ tuyển sinh'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'create' ? 'Nhập thông tin hồ sơ tuyển sinh mới' : 'Cập nhật thông tin hồ sơ tuyển sinh'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmitForm, onError)} className="space-y-6">
                    <fieldset className="space-y-4 border p-4 rounded-lg">
                        <legend className="text-lg font-semibold">Thông tin học sinh</legend>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Họ và tên học sinh</Label>
                                <Input
                                    id="fullName"
                                    {...register("fullName")}
                                />
                                {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName.message}</p>}
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="currentSchool">Trường hiện tại</Label>
                            <Input
                                id="currentSchool"
                                {...register("currentSchool")}
                            />
                        </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                           <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    {...register("dateOfBirth")}
                                />
                                {errors.dateOfBirth && <p className="text-red-500 text-sm">{errors.dateOfBirth.message}</p>}
                            </div>
                          
                              <div className="space-y-2">
                                <Label htmlFor="currentClass">Lớp hiện tại</Label>
                                <Input
                                    id="currentClass"
                                    {...register("currentClass")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="appliedClass">Lớp đăng ký</Label>
                                <Input
                                    id="appliedClass"
                                    {...register("appliedClass")}
                                />
                                {errors.appliedClass && <p className="text-red-500 text-sm">{errors.appliedClass.message}</p>}
                            </div>
                              
                        </div>
                        {mode === 'edit' && admissionData?.status === 'Follow up' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Giới tính</Label>
                                        <Select
                                            value={watch("gender")}
                                            onValueChange={(value) => handleSelectChange('gender', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn giới tính" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Nam">Nam</SelectItem>
                                                <SelectItem value="Nữ">Nữ</SelectItem>
                                                <SelectItem value="Khác">Khác</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ace">Anh chị em tại trường</Label>
                                        <Select
                                            value={watch("ace")?.[0] || ""}
                                            onValueChange={(value) => setValue("ace", value ? [value] : [])}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn thông tin ACE" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Có ACE">Có ACE</SelectItem>
                                                <SelectItem value="Không có ACE">Không có ACE</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="isChildOfStaff"
                                        {...register("isChildOfStaff")}
                                        className="ml-2"
                                    />
                                    <Label htmlFor="isChildOfStaff">Con CBGV</Label>
                                </div>
                            </>
                        )}
                    </fieldset>

                    <fieldset className="space-y-4 border p-4 rounded-lg">
                        <legend className="text-lg font-semibold">Thông tin phụ huynh</legend>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="parentFullName">Họ tên phụ huynh</Label>
                                <Input
                                    id="parentFullName"
                                    name="fullName"
                                    value={parentFormData.fullName}
                                    onChange={handleParentInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parentPhone">Số điện thoại</Label>
                                <Input
                                    id="parentPhone"
                                    name="phone"
                                    value={parentFormData.phone}
                                    onChange={handleParentInputChange}
                                />
                            </div>
                       
                            <div className="space-y-2">
                                <Label htmlFor="parentEmail">Email</Label>
                                <Input
                                    id="parentEmail"
                                    name="email"
                                    type="email"
                                    value={parentFormData.email}
                                    onChange={handleParentInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parentRelationship">Quan hệ</Label>
                                <Input
                                    id="parentRelationship"
                                    name="relationship"
                                    value={parentFormData.relationship}
                                    onChange={handleParentInputChange}
                                />
                            </div>
                         </div>
                      
                        {(mode === 'edit' && admissionData?.status === 'Follow up') && (
                            <div className="space-y-2">
                                <Label htmlFor="parentAddress">Địa chỉ</Label>
                                <Input
                                    id="parentAddress"
                                    name="address"
                                    value={parentFormData.address}
                                    onChange={handleParentInputChange}
                                />
                            </div>
                        )}
                        <Button type="button" onClick={handleAddParent}>
                            Thêm phụ huynh
                        </Button>

                        {parents.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <Label>Danh sách phụ huynh</Label>
                                <div className="space-y-2">
                                    {parents.map((parent, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                                            <span>{parent.fullName} - {parent.relationship}</span>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleRemoveParent(index)}
                                            >
                                                Xóa
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {errors.parents && <p className="text-red-500 text-sm">{errors.parents.message}</p>}
                    </fieldset>

                    <div className="space-y-2">
                        <Label htmlFor="howParentLearned">Phụ huynh biết đến WSHN qua đâu</Label>
                        <Select
                            value={watch("howParentLearned")}
                            onValueChange={(value) => handleSelectChange('howParentLearned', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn nguồn" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Biết qua bạn bè">Biết qua bạn bè</SelectItem>
                                <SelectItem value="Chủ động tìm kiếm">Chủ động tìm kiếm</SelectItem>
                                <SelectItem value="CBGV Giới thiệu">CBGV Giới thiệu</SelectItem>
                                <SelectItem value="Facebook Wellspring">Facebook Wellspring</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {mode === 'edit' && ['After test', 'Offer', 'Paid'].includes(admissionData?.status || '') && (
                        <fieldset className="space-y-4 border p-4 rounded-lg">
                            <legend className="text-lg font-semibold">Thông tin tuyển sinh</legend>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="expectedSemester">Học kỳ dự kiến</Label>
                                    <Select
                                        value={watch("expectedSemester")}
                                        onValueChange={(value) => handleSelectChange('expectedSemester', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn học kỳ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Học kỳ 1">Học kỳ 1</SelectItem>
                                            <SelectItem value="Học kỳ 2">Học kỳ 2</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="admissionSupport">Hỗ trợ nhập học</Label>
                                    <Select
                                        value={watch("admissionSupport")}
                                        onValueChange={(value) => handleSelectChange('admissionSupport', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Đã nộp đủ">Đã nộp đủ</SelectItem>
                                            <SelectItem value="Đã nộp nhưng thiếu">Đã nộp nhưng thiếu</SelectItem>
                                            <SelectItem value="Chưa nộp">Chưa nộp</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="followUpType">Loại follow-up</Label>
                                <Select
                                    value={watch("followUpType")}
                                    onValueChange={(value) => handleSelectChange('followUpType', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn loại" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Cold">Cold</SelectItem>
                                        <SelectItem value="Warm">Warm</SelectItem>
                                        <SelectItem value="Hot">Hot</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="followUpNote">Ghi chú follow-up</Label>
                                <Textarea
                                    id="followUpNote"
                                    {...register("followUpNote")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Ghi chú chung</Label>
                                <Textarea
                                    id="notes"
                                    {...register("notes")}
                                />
                            </div>
                        </fieldset>
                    )}

                    {mode === 'edit' && (
                        <fieldset className="space-y-4 border p-4 rounded-lg">
                            <legend className="text-lg font-semibold">Thông tin kiểm tra đầu vào</legend>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="testDate">Thời gian kiểm tra</Label>
                                    <DatePicker 
                                        date={testFormData.testDate ? new Date(testFormData.testDate) : undefined}
                                        setDate={handleTestDateChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="testResult">Kết quả kiểm tra</Label>
                                    <Select
                                        value={testFormData.result}
                                        onValueChange={(value) => handleTestInputChange('result', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn kết quả" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Đạt">Đạt</SelectItem>
                                            <SelectItem value="Không đạt">Không đạt</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="testNote">Ghi chú kiểm tra</Label>
                                <Textarea
                                    id="testNote"
                                    value={testFormData.note}
                                    onChange={(e) => handleTestInputChange('note', e.target.value)}
                                />
                            </div>
                            <Button type="button" onClick={handleAddTest}>
                                Thêm kiểm tra
                            </Button>

                            {watch('entranceTests')?.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <Label>Danh sách kiểm tra</Label>
                                    <div className="space-y-2">
                                        {watch('entranceTests').map((test, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                                                <span>{test.testDate} - {test.result}</span>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleRemoveTest(index)}
                                                >
                                                    Xóa
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {errors.entranceTests && <p className="text-red-500 text-sm">{errors.entranceTests.message}</p>}
                        </fieldset>
                    )}

                    <DialogFooter>
                        <Button type="submit">
                            {mode === 'create' ? 'Thêm mới' : 'Cập nhật'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileDialog;
import React from 'react';
import { Button } from '../../../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

interface StudentExcel {
    studentCode: string;
    name: string;
    gender: 'male' | 'female' | 'other';
    birthDate: string;
    address: string;
    email: string;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
    status: 'active' | 'transferred' | 'dropped';
}

interface StudentImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpload: (students: StudentExcel[]) => Promise<void>;
    isLoading?: boolean;
    error?: string | null;
}

const StudentImportDialog = ({ open, onOpenChange, onUpload, isLoading, error }: StudentImportDialogProps) => {
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('file', file);
            await onUpload([]); // API sẽ xử lý file Excel
        } catch (err) {
            console.error('Lỗi khi tải file:', err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nhập danh sách học sinh từ Excel</DialogTitle>
                    <DialogDescription>
                        Nhập file Excel (.xlsx, .xls) chứa danh sách học sinh với các cột bắt buộc: Mã học sinh, Họ tên, Giới tính, Ngày sinh, Địa chỉ, Email, Tên phụ huynh, SĐT phụ huynh, Email phụ huynh, Trạng thái.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="file" className="text-right">
                            File Excel
                        </Label>
                        <Input
                            id="file"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileUpload}
                            className="col-span-3"
                            disabled={isLoading}
                        />
                    </div>
                    {error && (
                        <div className="text-red-500 text-sm">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">
                            File Mẫu
                        </Label>
                        <Button variant="outline" asChild>
                            <a href="/Template/student-example.xlsx" download>
                                Tải file mẫu
                            </a>
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default StudentImportDialog; 
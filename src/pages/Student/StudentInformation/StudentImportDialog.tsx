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
import { API_ENDPOINTS } from '../../../lib/config';

interface StudentImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const StudentImportDialog = ({ open, onOpenChange }: StudentImportDialogProps) => {
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            // Gửi file Excel trực tiếp đến API
            const formData = new FormData();
            formData.append('excelFile', file);

            const response = await fetch(`${API_ENDPOINTS.STUDENTS}/bulk-import-students`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Thông báo kết quả
            if (result.summary?.successful > 0) {
                alert(`Import thành công: ${result.summary.successful} học sinh\nLỗi: ${result.summary.failed} học sinh`);
            } else {
                alert(`Import thất bại. Chi tiết: ${result.message}`);
            }

            onOpenChange(false); // Đóng dialog

        } catch (err) {
            console.error('Lỗi khi tải file:', err);
            alert('Có lỗi xảy ra khi import file Excel');
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
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">
                            File Mẫu
                        </Label>
                        <Button variant="outline" asChild>
                            <a href="/Template/record-sample-students.xlsx" download>
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
import React from 'react';
import { Button } from '../../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

interface ExcelUser {
    username: string;
    email: string;
    role: string;
    fullname: string;
    password: string;
    active: boolean;
    school?: string;
}

interface UploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpload: (users: ExcelUser[]) => Promise<void>;
    isLoading?: boolean;
    error?: string | null;
}

const UploadDialog = ({ open, onOpenChange, onUpload, isLoading, error }: UploadDialogProps) => {
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('file', file);
            await onUpload([]); // TODO: Implement Excel parsing
        } catch (err) {
            console.error('Error uploading file:', err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nhập người dùng từ Excel</DialogTitle>
                    <DialogDescription>
                        Nhập file Excel (.xlsx, .xls) chứa danh sách người dùng với các cột bắt buộc: username, email, role, fullname, password và active.
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
                            <a href="/Template/user-example.xlsx" download>
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

export default UploadDialog;
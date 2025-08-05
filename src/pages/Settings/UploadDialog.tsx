import React, { useState } from 'react';
import * as XLSX from 'xlsx';
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
import { frappeApi } from "../../lib/frappe-api";
import { useToast } from "../../hooks/use-toast";

interface ExcelUser {
    email: string;
    full_name: string;
    first_name?: string;
    last_name?: string;
    password: string;
    user_role: string;
    username?: string;
    employee_code?: string;
    department?: string;
    job_title?: string;
    enabled: boolean;
    active: boolean;
}

interface UploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpload: (users: ExcelUser[]) => Promise<void>;
    isLoading?: boolean;
    error?: string | null;
}

const UploadDialog = ({ open, onOpenChange, onUpload, isLoading, error }: UploadDialogProps) => {
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadLoading(true);
        setUploadError(null);

        try {
            // Parse Excel file
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

            if (data.length === 0) {
                throw new Error('File Excel trống hoặc không có dữ liệu');
            }

            // Validate required columns
            const requiredColumns = ['Email', 'Full_Name', 'Password', 'User_Role', 'Enabled', 'Active'];
            const headers = Object.keys(data[0] || {});
            const missingColumns = requiredColumns.filter(col => !headers.includes(col));
            
            if (missingColumns.length > 0) {
                throw new Error(`Thiếu cột bắt buộc: ${missingColumns.join(', ')}`);
            }

            // Transform data to match Frappe API format
            const users: ExcelUser[] = data.map((row, index) => {
                const fullName = String(row.Full_Name || '').trim();
                const nameParts = fullName.split(' ');
                
                return {
                    email: String(row.Email || '').trim().toLowerCase(),
                    full_name: fullName,
                    first_name: nameParts[0] || '',
                    last_name: nameParts.slice(1).join(' ') || '',
                    password: String(row.Password || ''),
                    user_role: String(row.User_Role || 'User').trim(),
                    username: String(row.Username || '').trim() || undefined,
                    employee_code: String(row.Employee_Code || '').trim() || undefined,
                    department: String(row.Department || '').trim() || undefined,
                    job_title: String(row.Job_Title || '').trim() || undefined,
                    enabled: /true/i.test(String(row.Enabled || 'true')),
                    active: /true/i.test(String(row.Active || 'true'))
                };
            });

            // Validate data
            const invalidUsers = users.filter((user, index) => 
                !user.email || !user.full_name || !user.password
            );

            if (invalidUsers.length > 0) {
                throw new Error(`Có ${invalidUsers.length} dòng dữ liệu không hợp lệ (thiếu email, tên hoặc mật khẩu)`);
            }

            // Call Frappe API to create users in batch
            const response = await frappeApi.batchCreateUsers(users);
            
            if (response.status === 'success') {
                toast({
                    variant: "success",
                    title: "Thành công",
                    description: `Đã tạo thành công ${users.length} người dùng`,
                });
                onOpenChange(false);
                // Call parent onUpload to refresh the list
                await onUpload(users);
            }

        } catch (err) {
            console.error('Error uploading file:', err);
            const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định';
            setUploadError(errorMessage);
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: errorMessage,
            });
        } finally {
            setUploadLoading(false);
            // Reset file input
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nhập người dùng từ Excel</DialogTitle>
                    <DialogDescription>
                        Nhập file Excel (.xlsx, .xls) chứa danh sách người dùng với các cột bắt buộc: Email, Full_Name, Password, User_Role, Enabled, Active. 
                        Các cột tùy chọn: Username, Employee_Code, Department, Job_Title.
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
                            disabled={uploadLoading || isLoading}
                        />
                    </div>
                    {(uploadError || error) && (
                        <div className="text-red-500 text-sm">
                            {uploadError || error}
                        </div>
                    )}
                    {uploadLoading && (
                        <div className="text-blue-500 text-sm">
                            Đang xử lý file Excel và tạo người dùng...
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
                    <Button 
                        type="button" 
                        onClick={() => onOpenChange(false)}
                        disabled={uploadLoading}
                    >
                        {uploadLoading ? 'Đang xử lý...' : 'Đóng'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default UploadDialog;
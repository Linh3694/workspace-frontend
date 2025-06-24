export interface User {
  _id: string;
  fullname: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  permissions?: string[];
}

export type UserRole = 
  | 'superadmin'    // Quản trị viên - full access
  | 'admin'         // Phó Quản trị viên - full access
  | 'teacher'       // Giáo viên
  | 'parent'        // Phụ huynh
  | 'registrar'     // Phòng đăng ký
  | 'admission'     // Phòng tuyển sinh
  | 'bos'           // Ban điều hành trường
  | 'principal'     // Hiệu trưởng
  | 'service'       // Dịch vụ
  | 'technical'     // Kỹ thuật
  | 'marcom'        // Marketing & Communication
  | 'hr'            // Nhân sự
  | 'bod'           // Board of Directors
  | 'user'          // Người dùng thông thường
  | 'librarian';    // Thủ thư

export interface RolePermissions {
  [key: string]: string[];
}

export const ROLE_PERMISSIONS: RolePermissions = {
  superadmin: ['*'], // Full access
  admin: ['*'], // Full access
  librarian: [
    'application.tickets.user',
    'library', 
    'library.books',
    'library.activities',
  ],
  user: [
    'application.tickets.user'
  ]
};

export interface MenuItem {
  title: string;
  href: string;
  description: string;
  permission: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
  permission?: string;
} 
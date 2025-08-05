export interface User {
  _id: string;
  fullname: string;
  email: string;
  avatarUrl?: string;
  permissions?: string[];
  // Additional user info
  jobTitle?: string;
  department?: string;
  employeeCode?: string;
  username?: string;
  provider?: string;
  frappeRoles: string[];  // Frappe system roles
  microsoftId?: string;
  active?: boolean;
  accountEnabled?: boolean;
}

export interface RolePermissions {
  [key: string]: string[];
}

// Sử dụng trực tiếp Frappe roles cho permissions
export const FRAPPE_ROLE_PERMISSIONS: RolePermissions = {
  // Frappe system roles
  'System Manager': ['*'], // Full access
  'Administrator': ['*'], // Full access
  'All': [
    'students.*',
    'teaching.*',
    'academic.*',
    'library.*',
    'recruitment.*',
    'admission.*',
    'application.tickets.user',
    'settings.users'
  ],
  'User': [
    'students.info',
    'application.tickets.user',
    'library.books'
  ],
  'Guest': [
    'application.tickets.user'
  ],
 
};

// Legacy - giữ lại để backward compatibility
export const ROLE_PERMISSIONS = FRAPPE_ROLE_PERMISSIONS;

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
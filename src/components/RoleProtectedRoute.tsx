import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/auth';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  role?: string;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  children, 
  permission,
  role 
}) => {
  const { isAuthenticated, isLoading, hasPermission, hasRole, user } = useAuth();

  console.log('🔍 RoleProtectedRoute: State check', {
    isAuthenticated,
    isLoading,
    permission,
    role,
    user: user ? { fullname: user.fullname, role: user.role } : null
  });

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Đang kiểm tra quyền truy cập...</span>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('⚠️ RoleProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check specific permission if provided
  if (permission && !hasPermission(permission)) {
    console.log('❌ RoleProtectedRoute: Permission denied for:', permission);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn không có quyền truy cập vào trang này.</p>
        </div>
      </div>
    );
  }

  // Check specific role if provided
  if (role && !hasRole(role as UserRole)) {
    console.log('❌ RoleProtectedRoute: Role denied for:', role);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Vai trò của bạn không được phép truy cập trang này.</p>
        </div>
      </div>
    );
  }

  console.log('✅ RoleProtectedRoute: Access granted');
  return <>{children}</>;
};

export default RoleProtectedRoute; 
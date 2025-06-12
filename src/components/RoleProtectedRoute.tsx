import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/auth';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  roles?: UserRole[];
  fallback?: React.ReactNode;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  children, 
  permission, 
  roles, 
  fallback 
}) => {
  const { isAuthenticated, isLoading, hasPermission, hasRole, user } = useAuth();

  console.log('🛡️ RoleProtectedRoute: Checking access', {
    isAuthenticated,
    isLoading,
    user: user ? { fullname: user.fullname, role: user.role } : null,
    requiredPermission: permission,
    requiredRoles: roles
  });

  // Show loading while AuthContext is initializing
  if (isLoading) {
    console.log('⏳ RoleProtectedRoute: Still loading, showing spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    console.log('❌ RoleProtectedRoute: User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check permission if provided
  if (permission && !hasPermission(permission)) {
    console.log('❌ RoleProtectedRoute: Permission denied for:', permission);
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
          <p className="text-lg text-gray-600 mb-4">Bạn không có quyền truy cập trang này</p>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Check roles if provided
  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      console.log('❌ RoleProtectedRoute: Role denied. Required:', roles, 'Current:', user?.role);
      return fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
            <p className="text-lg text-gray-600 mb-4">Bạn không có quyền truy cập trang này</p>
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Quay lại
            </button>
          </div>
        </div>
      );
    }
  }

  console.log('✅ RoleProtectedRoute: Access granted');
  return <>{children}</>;
};

export default RoleProtectedRoute; 
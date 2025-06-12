import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { User, UserRole } from '../types/auth';
import { ROLE_PERMISSIONS } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (initialized.current) {
      console.log('🔍 AuthContext: Already initialized, skipping');
      return;
    }
    
    console.log('🔍 AuthContext: Initializing...');
    initialized.current = true;
    initializeAuth();
  }, []);

  const initializeAuth = () => {
    try {
      // Load user from localStorage on mount
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      console.log('🔍 AuthContext: Token exists:', !!token);
      console.log('🔍 AuthContext: User data exists:', !!userData);
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log('✅ AuthContext: User loaded from localStorage:', {
            fullname: parsedUser.fullname,
            role: parsedUser.role,
            email: parsedUser.email
          });
          
          // Set state synchronously
          setUser(parsedUser);
          setIsAuthenticated(true);
          setIsLoading(false);
          
          console.log('✅ AuthContext: State updated - authenticated:', true);
        } catch (error) {
          console.error('❌ AuthContext: Error parsing user data:', error);
          logout();
        }
      } else {
        console.log('⚠️ AuthContext: No token or user data found');
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ AuthContext: Initialization error:', error);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  // Debug effect to track authentication state changes
  useEffect(() => {
    console.log('🔄 AuthContext: Authentication state changed:', {
      isAuthenticated,
      isLoading,
      user: user ? { fullname: user.fullname, role: user.role } : null
    });
  }, [isAuthenticated, isLoading, user]);

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.role) {
      console.log('❌ hasPermission: No user or role');
      return false;
    }
    
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    console.log('🔍 hasPermission: Checking permission', permission, 'for role', user.role);
    console.log('🔍 hasPermission: Role permissions:', rolePermissions);
    
    // Admin has all permissions
    if (rolePermissions.includes('*')) {
      console.log('✅ hasPermission: Admin access granted');
      return true;
    }
    
    // Check exact permission
    if (rolePermissions.includes(permission)) {
      console.log('✅ hasPermission: Exact permission found');
      return true;
    }
    
    // Check wildcard permissions (e.g., 'students.*' matches 'students.info')
    const wildcardPermissions = rolePermissions.filter(p => p.endsWith('.*'));
    for (const wildcardPerm of wildcardPermissions) {
      const basePermission = wildcardPerm.replace('.*', '');
      if (permission.startsWith(basePermission + '.')) {
        console.log('✅ hasPermission: Wildcard permission matched');
        return true;
      }
    }
    
    console.log('❌ hasPermission: Permission denied');
    return false;
  };

  const hasRole = (role: UserRole): boolean => {
    const result = user?.role === role;
    console.log('🔍 hasRole: Checking role', role, 'current role:', user?.role, 'result:', result);
    return result;
  };

  const login = (userData: User) => {
    console.log('✅ AuthContext: Logging in user:', {
      fullname: userData.fullname,
      role: userData.role,
      email: userData.email
    });
    
    // Update localStorage first
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', 'authenticated');
    
    // Then update state
    setUser(userData);
    setIsAuthenticated(true);
    setIsLoading(false);
    
    console.log('✅ AuthContext: Login completed');
  };

  const logout = () => {
    console.log('🚪 AuthContext: Logging out user');
    
    // Clear localStorage first
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Then update state
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      hasPermission,
      hasRole,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
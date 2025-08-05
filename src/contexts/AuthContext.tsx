import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { User } from '../types/auth';
import { FRAPPE_ROLE_PERMISSIONS } from '../types/auth';
import { frappeApi } from '../services/frappe';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasFrappeRole: (role: string) => boolean;
  hasAnyFrappeRole: (roles: string[]) => boolean;
  login: (userData: User) => void;
  loginWithCredentials: (identifier: string, password: string) => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Removed MSAL configuration as we now use Frappe authentication

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (initialized.current) {
      return;
    }
        initialized.current = true;
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // First check for existing tokens
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          // Verify token is still valid by checking expiration
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          const isExpired = tokenPayload.exp && tokenPayload.exp < Date.now() / 1000;
          
          if (!isExpired) {
            const parsedUser = JSON.parse(userData);           
            
            setUser(parsedUser);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      // Try to get current user from Frappe only if we have a token
      if (token) {
        try {
          const currentUserResponse = await frappeApi.getCurrentUser();
          if (currentUserResponse.authenticated && currentUserResponse.user) {
            const frappeUser = currentUserResponse.user;
            // Sử dụng frappe_roles từ Frappe
            const frappeRoles = frappeUser.frappe_roles || [frappeUser.role];
            
            const user: User = {
              _id: frappeUser.email, // Use email as ID for now
              fullname: frappeUser.full_name,
              email: frappeUser.email,
              avatarUrl: undefined, // Can be added later
              permissions: undefined, // Can be added later
              frappeRoles: frappeRoles, // Store all Frappe roles
            };
            setUser(user);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        } catch {
          // Token might be expired, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsAuthenticated(false);
      setIsLoading(false);
      
    } catch {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  // Removed authenticateWithBackend as we now use Frappe authentication directly

  const loginWithCredentials = async (identifier: string, password: string) => {
    try {
      setIsLoading(true);
      
      const loginResponse = await frappeApi.login(identifier, password);
      
      // Convert FrappeUser to User
      const frappeUser = loginResponse.user;
      
      // Sử dụng frappe_roles từ Frappe
      const frappeRoles = frappeUser.frappe_roles || [frappeUser.role];
      
      const user: User = {
        _id: frappeUser.email, // Use email as ID for now
        fullname: frappeUser.full_name,
        email: frappeUser.email,
        avatarUrl: undefined, // Can be added later
        permissions: undefined, // Can be added later
        frappeRoles: frappeRoles, // Store all Frappe roles
      };
      
      // Store the system token and user data
      localStorage.setItem('token', loginResponse.token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const loginWithMicrosoft = async () => {
    try {
      setIsLoading(true);
      
      // Get redirect URL from Frappe
      const redirectData = await frappeApi.getMicrosoftLoginUrl();
      
      // Redirect to Microsoft login
      window.location.href = redirectData.redirect_url;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };



  const hasPermission = (permission: string): boolean => {
    if (!user || !user.frappeRoles || user.frappeRoles.length === 0) {
      return false;
    }
    
    // Kiểm tra tất cả Frappe roles của user
    for (const frappeRole of user.frappeRoles) {
      const rolePermissions = FRAPPE_ROLE_PERMISSIONS[frappeRole] || [];
      
      // Admin has all permissions
      if (rolePermissions.includes('*')) {
        return true;
      }
      
      // Check exact permission
      if (rolePermissions.includes(permission)) {
        return true;
      }
      
      // Check wildcard permissions (e.g., 'students.*' matches 'students.info')
      const wildcardPermissions = rolePermissions.filter((p: string) => p.endsWith('.*'));
      for (const wildcardPerm of wildcardPermissions) {
        const basePermission = wildcardPerm.replace('.*', '');
        if (permission.startsWith(basePermission + '.')) {
          return true;
        }
      }
    }
    
    return false;
  };

  const hasFrappeRole = (role: string): boolean => {
    return user?.frappeRoles?.includes(role) || false;
  };

  const hasAnyFrappeRole = (roles: string[]): boolean => {
    return roles.some(role => user?.frappeRoles?.includes(role)) || false;
  };

  const login = (userData: User) => {
    // Update localStorage and state
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Clear any callback processing flags
    sessionStorage.removeItem('microsoft_callback_processed');
    
    setUser(userData);
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  const logout = async () => {
    try {
      // Logout from Frappe
      await frappeApi.logout();
    } catch {
      // Ignore errors when logging out from server
    }
    
    // Clear localStorage and sessionStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    sessionStorage.removeItem('microsoft_callback_processed');
    
    // Update state
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
      hasFrappeRole,
      hasAnyFrappeRole,
      login,
      loginWithCredentials,
      loginWithMicrosoft,
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
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { PublicClientApplication, type SilentRequest } from '@azure/msal-browser';
import type { User, UserRole } from '../types/auth';
import { ROLE_PERMISSIONS } from '../types/auth';
import { API_ENDPOINTS } from '../lib/config';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  login: (userData: User) => void;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// MSAL Configuration
const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '38b5b315-9e8e-4ca8-9b2e-3c0a3b7e9c29',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MICROSOFT_TENANT_ID || 'common'}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage' as const,
    storeAuthStateInCookie: false,
  }
};

// Create a single MSAL instance
let msalInstance: PublicClientApplication | null = null;

const getMsalInstance = async () => {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
  }
  return msalInstance;
};

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
      
      if (token && userData && token !== 'authenticated') {
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

      // Try silent Microsoft authentication
      try {
        const pca = await getMsalInstance();
        const account = pca.getAllAccounts()[0];
        
        if (account) {
          
          const silentRequest: SilentRequest = {
            scopes: ['openid', 'profile', 'email', 'User.Read'],
            account: account,
          };

          const response = await pca.acquireTokenSilent(silentRequest);
          
          if (response.accessToken) {
            await authenticateWithBackend(response.accessToken);
            return;
          }
        }
      } catch {
        // This is expected when user needs to login again
      }
      setIsAuthenticated(false);
      setIsLoading(false);
      
    } catch {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const authenticateWithBackend = async (msToken: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.MICROSOFT_LOGIN, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${msToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Store the system token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('token', data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        throw new Error(data.message || 'Backend authentication failed');
      }
    } catch (error) {
      await logout();
      throw error;
    }
  };

  const loginWithMicrosoft = async () => {
    try {
      setIsLoading(true);
      const pca = await getMsalInstance();

      const loginRequest = {
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        prompt: 'select_account' as const
      };

      const response = await pca.loginPopup(loginRequest);
      
      if (response.accessToken) {
        await authenticateWithBackend(response.accessToken);
      } else {
        throw new Error('No access token received from Microsoft');
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };



  const hasPermission = (permission: string): boolean => {
    if (!user || !user.role) {
      return false;
    }
    
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    
    // Admin has all permissions
    if (rolePermissions.includes('*')) {
      return true;
    }
    
    // Check exact permission
    if (rolePermissions.includes(permission)) {
      return true;
    }
    
    // Check wildcard permissions (e.g., 'students.*' matches 'students.info')
    const wildcardPermissions = rolePermissions.filter(p => p.endsWith('.*'));
    for (const wildcardPerm of wildcardPermissions) {
      const basePermission = wildcardPerm.replace('.*', '');
      if (permission.startsWith(basePermission + '.')) {
        return true;
      }
    }
    
    return false;
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const login = (userData: User) => {
    // Update localStorage and state
    localStorage.setItem('user', JSON.stringify(userData));
    
    setUser(userData);
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  const logout = async () => {
    try {
      // Clear MSAL cache
      const pca = await getMsalInstance();
      const accounts = pca.getAllAccounts();
      
      if (accounts.length > 0) {
        // Clear local cache
        pca.clearCache();
      }
    } catch {
      // Ignore errors when clearing cache
    }
    
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    
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
      hasRole,
      login,
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
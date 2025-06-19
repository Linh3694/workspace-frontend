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
      console.log('🔍 AuthContext: Already initialized, skipping');
      return;
    }
    
    console.log('🔍 AuthContext: Initializing...');
    initialized.current = true;
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // First check for existing tokens
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      console.log('🔍 AuthContext: Checking stored tokens:', { 
        hasToken: !!token, 
        hasUserData: !!userData,
        tokenSample: token ? token.substring(0, 20) + '...' : null
      });
      
      if (token && userData && token !== 'authenticated') {
        try {
          // Verify token is still valid by checking expiration
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          const isExpired = tokenPayload.exp && tokenPayload.exp < Date.now() / 1000;
          
          if (!isExpired) {
            const parsedUser = JSON.parse(userData);
            console.log('✅ AuthContext: Valid token found, user restored:', {
              fullname: parsedUser.fullname,
              role: parsedUser.role
            });
            
            setUser(parsedUser);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          } else {
            console.log('⚠️ AuthContext: Token expired, clearing storage');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('❌ AuthContext: Error parsing stored data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      // Try silent Microsoft authentication
      try {
        const pca = await getMsalInstance();
        const account = pca.getAllAccounts()[0];
        
        if (account) {
          console.log('🔍 AuthContext: Found MSAL account, attempting silent auth...');
          
          const silentRequest: SilentRequest = {
            scopes: ['openid', 'profile', 'email', 'User.Read'],
            account: account,
          };

          const response = await pca.acquireTokenSilent(silentRequest);
          
          if (response.accessToken) {
            console.log('✅ AuthContext: Silent token acquired, authenticating with backend...');
            await authenticateWithBackend(response.accessToken);
            return;
          }
        }
      } catch (silentError) {
        console.log('⚠️ AuthContext: Silent authentication failed:', silentError);
        // This is expected when user needs to login again
      }

      // No valid authentication found
      console.log('⚠️ AuthContext: No valid authentication found');
      setIsAuthenticated(false);
      setIsLoading(false);
      
    } catch (error) {
      console.error('❌ AuthContext: Initialization error:', error);
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
        console.log('✅ AuthContext: Backend authentication successful');
        
        // Store the system token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setUser(data.user);
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        throw new Error(data.message || 'Backend authentication failed');
      }
    } catch (error) {
      console.error('❌ AuthContext: Backend authentication error:', error);
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
      console.error('❌ AuthContext: Microsoft login error:', error);
      setIsLoading(false);
      throw error;
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
    
    // Update localStorage and state
    localStorage.setItem('user', JSON.stringify(userData));
    
    setUser(userData);
    setIsAuthenticated(true);
    setIsLoading(false);
    
    console.log('✅ AuthContext: Login completed');
  };

  const logout = async () => {
    console.log('🚪 AuthContext: Logging out user');
    
    try {
      // Clear MSAL cache
      const pca = await getMsalInstance();
      const accounts = pca.getAllAccounts();
      
      if (accounts.length > 0) {
        // Clear local cache
        pca.clearCache();
      }
    } catch (error) {
      console.error('⚠️ AuthContext: Error clearing MSAL cache:', error);
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
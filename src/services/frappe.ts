/**
 * Frappe API Service
 * Provides base functionality for making API calls to Frappe backend
 */

import { AUTH_ENDPOINTS, FRAPPE_API_ENDPOINTS, FRAPPE_API_URL } from '../config/api';

export interface FrappeResponse<T = any> {
  message: T;
  doc?: any;
  docs?: any[];
  exc?: string;
  exc_type?: string;
  exception?: string;
}

export interface FrappeLoginResponse {
  status: string;
  message: string;
  user: {
    email: string;
    username: string;
    full_name: string;
    job_title?: string;
    department?: string;
    role: string;
    user_role?: string; // Custom role từ ERP User Profile
    frappe_roles?: string[]; // Frappe system roles
    provider: string;
  };
  token: string;
  expires_in: number;
}

export interface FrappeUser {
  email: string;
  username: string;
  full_name: string;
  job_title?: string;
  department?: string;
  role: string;
  user_role?: string; // Custom role từ ERP User Profile
  frappe_roles?: string[]; // Frappe system roles
  provider: string;
  active: boolean;
  last_login?: string;
  last_seen?: string;
}

class FrappeApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = FRAPPE_API_URL;
  }

  /**
   * Get authorization headers with current token
   */
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Make a request to Frappe API method
   */
  async callMethod<T = any>(
    method: string,
    params: Record<string, any> = {},
    useAuth: boolean = true
  ): Promise<FrappeResponse<T>> {
    const url = `${this.baseUrl}/api/method/${method}`;
    const headers = useAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: FrappeResponse<T> = await response.json();

      // Check for Frappe exceptions
      if (data.exc || data.exception) {
        throw new Error(data.exception || data.exc || 'Server error occurred');
      }

      return data;
    } catch (error) {
      console.error('Frappe API call failed:', error);
      throw error;
    }
  }

  /**
   * Login with credentials
   */
  async login(identifier: string, password: string, provider: string = 'local'): Promise<FrappeLoginResponse> {
    const params = {
      email: identifier.includes('@') ? identifier : undefined,
      username: identifier.includes('@') ? undefined : identifier,
      password,
      provider,
    };

    const response = await this.callMethod<FrappeLoginResponse>(
      AUTH_ENDPOINTS.LOGIN,
      params,
      false
    );

    return response.message;
  }

  /**
   * Get Microsoft login redirect URL
   */
  async getMicrosoftLoginUrl(): Promise<{ redirect_url: string; state: string }> {
    const response = await this.callMethod<{ redirect_url: string; state: string }>(
      AUTH_ENDPOINTS.MICROSOFT_REDIRECT,
      {},
      false
    );

    return response.message;
  }

  /**
   * Handle Microsoft callback
   */
  async handleMicrosoftCallback(code: string, state: string): Promise<FrappeLoginResponse> {
    const response = await this.callMethod<FrappeLoginResponse>(
      AUTH_ENDPOINTS.MICROSOFT_LOGIN,
      { code, state },
      false
    );

    return response.message;
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<{ user: FrappeUser | null; authenticated: boolean }> {
    // Don't require auth for this call since it needs to work for guests too
    const token = localStorage.getItem('token');
    const response = await this.callMethod<{ user: FrappeUser | null; authenticated: boolean }>(
      AUTH_ENDPOINTS.CURRENT_USER,
      {},
      !!token // Only use auth if we have a token
    );

    return response.message;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await this.callMethod(AUTH_ENDPOINTS.LOGOUT);
    } catch (error) {
      // Even if logout fails on server, we should clear local storage
      console.warn('Server logout failed, but continuing with local logout:', error);
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(): Promise<{ token: string; expires_in: number }> {
    const response = await this.callMethod<{ token: string; expires_in: number }>(
      AUTH_ENDPOINTS.REFRESH_TOKEN
    );

    return response.message;
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.callMethod(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    await this.callMethod(AUTH_ENDPOINTS.RESET_PASSWORD, { email }, false);
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: Partial<FrappeUser>): Promise<void> {
    await this.callMethod(AUTH_ENDPOINTS.UPDATE_PROFILE, { profile_data: profileData });
  }

  /**
   * Upload file to Frappe
   */
  async uploadFile(file: File, folder?: string): Promise<{ file_url: string; file_name: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/api/method/upload_file`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.message;
  }
}

// Export singleton instance
export const frappeApi = new FrappeApiService();
export default frappeApi;
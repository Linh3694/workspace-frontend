import { FRAPPE_API_URL, USER_MANAGEMENT_ENDPOINTS } from '../config/api';

// Types for Frappe API
interface FrappeResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

interface UserData {
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  enabled?: boolean;
  user_role?: string;
  username?: string;
  employee_code?: string;
  department?: string;
  job_title?: string;
  active?: boolean;
  roles?: string[];
  provider?: string;
  [key: string]: unknown;
}

interface GetUsersResponse {
  status: 'success' | 'error';
  users: unknown[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Frappe API client specifically for Frappe backend
class FrappeApiClient {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = FRAPPE_API_URL;
  }

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        console.error('❌ Frappe API: Authentication failed');
        
        // Try to get detailed error message
        try {
          const errorData = await response.json();
          const errorMessage = errorData.message || errorData.exc || 'Authentication failed';
          
          // Check if it's a traceback error
          if (typeof errorData.exc === 'string' && errorData.exc.includes('AuthenticationError')) {
            throw new Error('JWT token authentication failed. Please login again.');
          }
          
          throw new Error(errorMessage);
        } catch (e) {
          if (e instanceof Error && e.message.includes('JWT token')) {
            throw e;
          }
          throw new Error('Authentication failed');
        }
      }

      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.exc || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Frappe API thường trả về data trong thuộc tính 'message'
    if (data.message !== undefined) {
      return data.message;
    }
    
    return data;
  }

  async callMethod<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const url = `${this.baseUrl}/api/method/${method}`;
    
    console.log('🔍 Frappe API callMethod:', {
      url,
      method: 'POST',
      params,
      headers: this.getHeaders()
    });
    
    // Sử dụng JSON body thay vì URL parameters
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });

    console.log('🔍 Frappe API response status:', response.status);
    
    return this.handleResponse<T>(response);
  }

  // User management methods
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    department?: string;
    active?: boolean;
  } = {}): Promise<GetUsersResponse> {
    console.log('🔍 Frappe API getUsers called with params:', params);
    const result = await this.callMethod<GetUsersResponse>(USER_MANAGEMENT_ENDPOINTS.USERS, params);
    console.log('🔍 Frappe API getUsers response:', result);
    return result;
  }

  async getUserById(userEmail: string): Promise<FrappeResponse> {
    return this.callMethod<FrappeResponse>(USER_MANAGEMENT_ENDPOINTS.USER_BY_ID, { user_email: userEmail });
  }

  async createUser(userData: UserData): Promise<FrappeResponse> {
    console.log('Creating user with data:', userData);
    
    // Gửi dữ liệu trực tiếp trong body
    const params = {
      ...userData // Gửi trực tiếp các field của userData
    };
    
    console.log('API params:', params);
    return this.callMethod<FrappeResponse>(USER_MANAGEMENT_ENDPOINTS.CREATE_USER, params);
  }

  async updateUser(userEmail: string, userData: Partial<UserData>): Promise<FrappeResponse> {
    console.log('Updating user:', userEmail, 'with data:', userData);
    
    // Gửi dữ liệu trực tiếp trong body, không cần JSON.stringify
    const params = {
      user_email: userEmail,
      ...userData // Gửi trực tiếp các field của userData
    };
    
    console.log('API params:', params);
    return this.callMethod<FrappeResponse>(USER_MANAGEMENT_ENDPOINTS.UPDATE_USER, params);
  }

  async deleteUser(userEmail: string) {
    return this.callMethod(USER_MANAGEMENT_ENDPOINTS.DELETE_USER, { user_email: userEmail });
  }

  async enableDisableUser(userEmail: string, enabled: boolean) {
    return this.callMethod(USER_MANAGEMENT_ENDPOINTS.ENABLE_DISABLE_USER, { 
      user_email: userEmail, 
      enabled: enabled 
    });
  }

  async resetUserPassword(userEmail: string) {
    return this.callMethod(USER_MANAGEMENT_ENDPOINTS.RESET_PASSWORD, { user_email: userEmail });
  }

  // Admin set password for user (directly update password without requiring current password)
  async setUserPassword(userEmail: string, newPassword: string): Promise<FrappeResponse> {
    console.log('Setting password for user:', userEmail);
    
    // Use UPDATE_USER API with password field since SET_PASSWORD is not deployed yet
    const params = {
      user_email: userEmail,
      password: newPassword
    };
    
    console.log('API params (using update_user):', params);
    return this.callMethod<FrappeResponse>(USER_MANAGEMENT_ENDPOINTS.UPDATE_USER, params);
  }

  async getUserRoles() {
    return this.callMethod(USER_MANAGEMENT_ENDPOINTS.USER_ROLES);
  }

  async getAllRoles() {
    return this.callMethod<string[]>(USER_MANAGEMENT_ENDPOINTS.ALL_ROLES);
  }

  async getUserStats() {
    return this.callMethod(USER_MANAGEMENT_ENDPOINTS.USER_STATS);
  }

  async batchCreateUsers(users: UserData[]): Promise<FrappeResponse> {
    return this.callMethod<FrappeResponse>(USER_MANAGEMENT_ENDPOINTS.BATCH_CREATE_USERS, { users: JSON.stringify(users) });
  }

  // File upload method for avatars
  async uploadFile(file: File, folder?: string): Promise<FrappeResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await fetch(`${this.baseUrl}/api/method/upload_file`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
      },
      body: formData,
    });

    return this.handleResponse(response);
  }
}

export const frappeApi = new FrappeApiClient();
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Frappe API configuration
const FRAPPE_API_BASE_URL = import.meta.env.VITE_FRAPPE_API_URL || 'http://localhost:8000';

// API response interface for Frappe
interface FrappeResponse<T = any> {
  message?: T;
  data?: T;
  exc?: string;
  _server_messages?: string;
}

// Pagination interface (compatible with old system)
interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

// Standard API response interface
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  pagination?: PaginationInfo;
  error?: string;
}

class FrappeApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: FRAPPE_API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `token ${token}`;
        }

        // Add timestamp to GET requests to prevent caching
        if (config.method === 'get') {
          const separator = config.url?.includes('?') ? '&' : '?';
          config.url = `${config.url}${separator}_t=${Date.now()}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse<FrappeResponse>) => {
        // Handle Frappe response format
        const data = response.data;
        
        // Check for Frappe errors
        if (data.exc) {
          throw new Error(data.exc);
        }

        if (data._server_messages) {
          try {
            const messages = JSON.parse(data._server_messages);
            const errorMessage = messages.find((msg: any) => 
              JSON.parse(msg).message && JSON.parse(msg).raise_exception
            );
            if (errorMessage) {
              throw new Error(JSON.parse(errorMessage).message);
            }
          } catch (e) {
            // If parsing fails, continue with normal flow
          }
        }

        // Return the message or data field from Frappe response
        return {
          ...response,
          data: data.message || data.data || data
        };
      },
      (error) => {
        // Handle different types of errors
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data;

          // Handle authentication errors
          if (status === 401 || status === 403) {
            this.handleAuthError();
            throw new Error('Authentication failed. Please login again.');
          }

          // Handle Frappe errors
          if (data && data.exc) {
            throw new Error(data.exc);
          }

          if (data && data._server_messages) {
            try {
              const messages = JSON.parse(data._server_messages);
              const errorMessage = messages.find((msg: any) => 
                JSON.parse(msg).message && JSON.parse(msg).raise_exception
              );
              if (errorMessage) {
                throw new Error(JSON.parse(errorMessage).message);
              }
            } catch (e) {
              // If parsing fails, use generic message
            }
          }

          throw new Error(data?.message || `HTTP Error: ${status}`);
        } else if (error.request) {
          throw new Error('Network error. Please check your connection.');
        } else {
          throw new Error(error.message || 'Unknown error occurred.');
        }
      }
    );
  }

  private getAuthToken(): string | null {
    // Get token from localStorage
    // Frappe uses format: api_key:api_secret or just session token
    return localStorage.getItem('frappe_token') || localStorage.getItem('token');
  }

  private handleAuthError() {
    // Clear auth tokens
    localStorage.removeItem('frappe_token');
    localStorage.removeItem('token');
    
    // Redirect to login if needed
    // This can be handled by the app's auth context
    window.dispatchEvent(new CustomEvent('auth-error'));
  }

  // Generic method caller for Frappe methods
  async callMethod<T = any>(
    method: string, 
    params: Record<string, any> = {},
    httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST'
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      method: httpMethod.toLowerCase() as any,
      url: `/api/method/${method}`,
    };

    if (httpMethod === 'GET') {
      config.params = params;
    } else {
      config.data = params;
    }

    const response = await this.axiosInstance.request<T>(config);
    return response.data;
  }

  // GET request helper
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const response = await this.axiosInstance.get<T>(endpoint, { params });
    return response.data;
  }

  // POST request helper
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await this.axiosInstance.post<T>(endpoint, data);
    return response.data;
  }

  // PUT request helper
  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await this.axiosInstance.put<T>(endpoint, data);
    return response.data;
  }

  // DELETE request helper
  async delete<T = any>(endpoint: string): Promise<T> {
    const response = await this.axiosInstance.delete<T>(endpoint);
    return response.data;
  }

  // File upload helper
  async uploadFile(file: File, fieldname: string = 'file'): Promise<string> {
    const formData = new FormData();
    formData.append(fieldname, file);

    const response = await this.axiosInstance.post('/api/method/upload_file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.file_url || response.data.message;
  }

  // Set auth token
  setAuthToken(token: string) {
    localStorage.setItem('frappe_token', token);
  }

  // Clear auth token
  clearAuthToken() {
    localStorage.removeItem('frappe_token');
    localStorage.removeItem('token');
  }
}

// Export singleton instance
export const frappeApi = new FrappeApiService();

// Export types
export type { ApiResponse, PaginationInfo, FrappeResponse };

// Export class for custom instances
export { FrappeApiService };
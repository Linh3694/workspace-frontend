import axios from 'axios';

// Định nghĩa kiểu cho window.__NEXT_DATA__
interface NextData {
  props: {
    pageProps: {
      apiUrl?: string;
    };
  };
}

declare global {
  interface Window {
    __NEXT_DATA__?: NextData;
  }
}

// Sử dụng Vite environment variables thay vì Next.js
const API_URL_VITE = import.meta.env.VITE_API_URL || 'https://api-dev.wellspring.edu.vn/api';

interface RequestOptions {
  headers?: Record<string, string>;
  [key: string]: unknown;
}

// Create axios instance
const api = axios.create({
  baseURL: API_URL_VITE,
  timeout: 10000,
});

// Create separate axios instance for file uploads with longer timeout
const fileUploadApi = axios.create({
  baseURL: API_URL_VITE,
  timeout: 600000, // 10 minutes for file uploads
});

// Token refresh logic
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  
  failedQueue = [];
};



// Function to apply interceptors to an axios instance
const applyInterceptors = (axiosInstance: typeof api) => {
  // Request interceptor to add token
  axiosInstance.interceptors.request.use(
    async (config) => {
      const token = localStorage.getItem('token');
      if (token && token !== 'authenticated') {
        // Check if token is expired
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          const isExpired = tokenPayload.exp && tokenPayload.exp < Date.now() / 1000;
          
          if (isExpired) {
            console.log('⚠️ API: Token expired, removing from storage');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return Promise.reject(new Error('Token expired'));
          }
          
          config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          console.error('❌ API: Error parsing token:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle token expiration
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, queue the request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Try to get a fresh token from MSAL
          const { PublicClientApplication } = await import('@azure/msal-browser');
          
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

          const pca = new PublicClientApplication(msalConfig);
          await pca.initialize();
          
          const account = pca.getAllAccounts()[0];
          
          if (account) {
            const silentRequest = {
              scopes: ['openid', 'profile', 'email', 'User.Read'],
              account: account,
            };

            const response = await pca.acquireTokenSilent(silentRequest);
            
            if (response.accessToken) {
              // Get new system token from backend
              const backendResponse = await fetch(`${API_URL_VITE}/auth/microsoft/login`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${response.accessToken}`,
                  'Content-Type': 'application/json',
                },
              });

              const backendData = await backendResponse.json();
              
              if (backendResponse.ok && backendData.success) {
                localStorage.setItem('token', backendData.token);
                localStorage.setItem('user', JSON.stringify(backendData.user));
                
                processQueue(null, backendData.token);
                
                // Retry the original request
                originalRequest.headers.Authorization = `Bearer ${backendData.token}`;
                return axiosInstance(originalRequest);
              }
            }
          }
        } catch (refreshError) {
          console.error('❌ API: Token refresh failed:', refreshError);
          processQueue(refreshError, null);
        } finally {
          isRefreshing = false;
        }

        // If refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      return Promise.reject(error);
    }
  );
};

// Apply interceptors to both instances
applyInterceptors(api);
applyInterceptors(fileUploadApi);

// API methods
const apiClient = {
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL_VITE}${endpoint}`, {
      ...options,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    try {
      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Return the data property if it exists
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        return responseData.data;
      }

      // If response is direct data
      return responseData;
    } catch (error) {
      console.error('Failed to parse response:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to parse server response');
    }
  },

  async post<T>(endpoint: string, body: unknown, options: RequestOptions = {}): Promise<T> {
    const token = localStorage.getItem('token');
    try {
      console.log('API POST request to:', endpoint);
      const response = await fetch(`${API_URL_VITE}${endpoint}`, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        body: JSON.stringify(body),
      });

      try {
        const responseData = await response.json();
        console.log('API Response data:', responseData);

        if (!response.ok) {
          const errorMessage = typeof responseData === 'object'
            ? responseData.message || responseData.error || `HTTP error! status: ${response.status}`
            : `HTTP error! status: ${response.status}`;
          console.error('API Error:', errorMessage, responseData);
          throw new Error(errorMessage);
        }

        // Return the data property if it exists and data is not null/undefined
        if (responseData && typeof responseData === 'object' && 'data' in responseData && responseData.data != null) {
          return responseData.data;
        }

        // If response is direct data
        return responseData;
      } catch (parseError) {
        console.error('Failed to parse response:', parseError, 'From endpoint:', endpoint);
        if (!response.ok) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        throw new Error(`Failed to parse server response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
    } catch (fetchError) {
      console.error('Fetch error:', fetchError, 'Endpoint:', endpoint);
      throw fetchError;
    }
  },

  async put<T>(endpoint: string, body: unknown, options: RequestOptions = {}): Promise<T> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL_VITE}${endpoint}`, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      body: JSON.stringify(body),
    });

    try {
      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Return the data property if it exists
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        return responseData.data;
      }

      // If response is direct data
      return responseData;
    } catch (error) {
      console.error('Failed to parse response:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to parse server response');
    }
  },

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL_VITE}${endpoint}`, {
      ...options,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    try {
      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Return the data property if it exists
      if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        return responseData.data;
      }

      // If response is direct data
      return responseData;
    } catch (error) {
      console.error('Failed to parse response:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to parse server response');
    }
  },
};

export { api, apiClient, fileUploadApi };

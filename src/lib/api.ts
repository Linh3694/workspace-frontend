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
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RequestOptions {
  headers?: Record<string, string>;
  [key: string]: unknown;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor để xử lý response
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor để xử lý request
api.interceptors.request.use(
  (config) => {
    // Nếu là FormData, không set Content-Type để axios tự xử lý
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // Thêm token vào header nếu có
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API methods
const apiClient = {
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}${endpoint}`, {
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
      const response = await fetch(`${API_URL}${endpoint}`, {
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
    const response = await fetch(`${API_URL}${endpoint}`, {
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
    const response = await fetch(`${API_URL}${endpoint}`, {
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

export { api, apiClient };

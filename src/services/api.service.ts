import { API_CONFIG, API_ENDPOINTS } from '@/config/api.config';
import { ApiResponse } from '@/types';

class ApiService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private getHeaders(contentType?: string): HeadersInit {
    const headers: HeadersInit = {
      ...API_CONFIG.HEADERS,
    };

    // Only set Content-Type if not FormData
    if (contentType && contentType !== 'multipart/form-data') {
      headers['Content-Type'] = contentType;
    }

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `Error: ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse response',
      };
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(options.headers?.['Content-Type'] as string),
          ...options.headers,
        },
        signal: controller.signal,
        credentials: 'include',
      });

      clearTimeout(timeoutId);
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timed out',
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: 'Unknown error occurred',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { 
      method: 'GET',
      headers: this.getHeaders('application/json')
    });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    const options: RequestInit = {
      method: 'POST',
    };

    if (isFormData) {
      // For FormData, let browser set Content-Type with boundary
      options.body = body;
    } else if (body) {
      options.headers = this.getHeaders('application/json');
      options.body = JSON.stringify(body);
    } else {
      options.headers = this.getHeaders('application/json');
    }

    return this.request<T>(endpoint, options);
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    const options: RequestInit = {
      method: 'PUT',
    };

    if (isFormData) {
      // For FormData, let browser set Content-Type with boundary
      options.body = body;
    } else if (body) {
      options.headers = this.getHeaders('application/json');
      options.body = JSON.stringify(body);
    } else {
      options.headers = this.getHeaders('application/json');
    }

    return this.request<T>(endpoint, options);
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers: this.getHeaders('application/json'),
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { 
      method: 'DELETE',
      headers: this.getHeaders('application/json')
    });
  }

  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.post<T>(endpoint, formData);
  }
}

export const apiService = new ApiService();
export { API_ENDPOINTS };
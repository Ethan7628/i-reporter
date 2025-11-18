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

  private getHeaders(contentType?: string, isFormData: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      ...API_CONFIG.HEADERS,
    };

    // Don't set Content-Type for FormData - let browser set it with boundary
    if (contentType && !isFormData) {
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
      // Handle empty responses (like 204 No Content)
      if (response.status === 204) {
        return {
          success: true,
        };
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `Error: ${response.status} ${response.statusText}`,
        };
      }

      return {
        success: true,
        data: data.data !== undefined ? data.data : data,
        message: data.message,
      };
    } catch (error) {
      // If JSON parsing fails but response is ok, return success
      if (response.ok) {
        return {
          success: true,
        };
      }
      
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

      const fullUrl = `${this.baseURL}${endpoint}`;
      
      if (import.meta.env.DEV) {
        console.log(`[API Service] ${options.method || 'GET'} ${fullUrl}`, options.body);
      }

      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...this.getHeaders(
            options.headers?.['Content-Type'] as string,
            options.body instanceof FormData
          ),
          ...options.headers,
        },
        signal: controller.signal,
        credentials: 'include',
      });

      clearTimeout(timeoutId);
      
      if (import.meta.env.DEV) {
        console.log(`[API Service] Response:`, response.status, response.statusText);
      }
      
      return this.handleResponse<T>(response);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[API Service] Request error:', error);
      }
      
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

    if (body) {
      if (isFormData) {
        // For FormData, don't set Content-Type - browser will set it with boundary
        options.body = body;
      } else {
        options.headers = this.getHeaders('application/json');
        options.body = JSON.stringify(body);
      }
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

    if (body) {
      if (isFormData) {
        options.body = body;
      } else {
        options.headers = this.getHeaders('application/json');
        options.body = JSON.stringify(body);
      }
    } else {
      options.headers = this.getHeaders('application/json');
    }

    return this.request<T>(endpoint, options);
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    const options: RequestInit = {
      method: 'PATCH',
    };

    if (body) {
      if (isFormData) {
        options.body = body;
      } else {
        options.headers = this.getHeaders('application/json');
        options.body = JSON.stringify(body);
      }
    } else {
      options.headers = this.getHeaders('application/json');
    }

    return this.request<T>(endpoint, options);
  }

  async delete<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const options: RequestInit = {
      method: 'DELETE',
    };

    if (data) {
      options.headers = this.getHeaders('application/json');
      options.body = JSON.stringify(data);
    } else {
      options.headers = this.getHeaders('application/json');
    }

    return this.request<T>(endpoint, options);
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

  // Enhanced upload method for multiple files
  async uploadMultipleFiles<T>(
    endpoint: string,
    files: File[],
    fieldName: string = 'files',
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();

    files.forEach((file, index) => {
      formData.append(`${fieldName}[${index}]`, file);
    });

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.post<T>(endpoint, formData);
  }

  // Method for uploading different media types to specific fields
  async uploadMediaFiles<T>(
    endpoint: string,
    files: { file: File; field: string }[],
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();

    files.forEach(({ file, field }) => {
      formData.append(field, file);
    });

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.post<T>(endpoint, formData);
  }

  // Progress tracking for large file uploads
  async uploadWithProgress<T>(
    endpoint: string,
    file: File,
    onProgress?: (progress: number) => void,
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      
      formData.append('file', file);

      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              success: true,
              data: response.data || response,
              message: response.message,
            });
          } catch (error) {
            resolve({
              success: false,
              error: 'Failed to parse response',
            });
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            resolve({
              success: false,
              error: error.error || error.message || `Error: ${xhr.status}`,
            });
          } catch {
            resolve({
              success: false,
              error: `Error: ${xhr.status} ${xhr.statusText}`,
            });
          }
        }
      });

      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Network error occurred',
        });
      });

      const token = this.getToken();
      xhr.open('POST', `${this.baseURL}${endpoint}`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  }
}

export const apiService = new ApiService();
export { API_ENDPOINTS };
import { API_CONFIG, API_ENDPOINTS } from '@/config/api.config';
import { ApiResponse, ApiError } from '@/types';

/**
 * API Service - Production Ready
 * Handles all HTTP requests to the backend with comprehensive error handling
 */
class ApiService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Safe method to check if headers object has Authorization property
   */
  private hasAuthorizationHeader(headers?: HeadersInit): boolean {
    if (!headers) return false;
    
    try {
      // Handle different header formats
      if (headers instanceof Headers) {
        return headers.has('Authorization');
      }
      
      if (Array.isArray(headers)) {
        // Handle array of [key, value] pairs
        return headers.some(([key]) => 
          key.toLowerCase() === 'authorization'
        );
      }
      
      if (typeof headers === 'object') {
        // Handle Record<string, string> or HeadersInit object
        return Object.keys(headers).some(key => 
          key.toLowerCase() === 'authorization'
        );
      }
      
      return false;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[API Service] Error checking authorization header:', error);
      }
      return false;
    }
  }

  /**
   * Build request headers
   */
  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      ...API_CONFIG.HEADERS,
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle API errors with dev mode logging
   */
  private handleError(error: unknown): ApiError {
    if (import.meta.env.DEV) {
      console.error('[API Service Error]', error);
    }
    
    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'NETWORK_ERROR',
      };
    }
    return {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  }

  /**
   * Log API request details in dev mode
   */
  private logRequest(method: string, endpoint: string, body?: unknown): void {
    if (import.meta.env.DEV) {
      console.group(`[API ${method}] ${endpoint}`);
      if (body) {
        console.log('Request body:', body);
      }
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  }

  /**
   * Log API response details in dev mode
   */
  private logResponse(endpoint: string, response: unknown, duration?: number): void {
    if (import.meta.env.DEV) {
      console.group(`[API Response] ${endpoint}`);
      console.log('Data:', response);
      if (duration) {
        console.log('Duration:', `${duration}ms`);
      }
      console.groupEnd();
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    // Log request in dev mode
    this.logRequest(options.method || 'GET', endpoint, options.body);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: this.getHeaders(!this.hasAuthorizationHeader(options.headers)),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
        
        if (import.meta.env.DEV) {
          console.error(`[API Error] ${endpoint}`, {
            status: response.status,
            statusText: response.statusText,
            message: errorMessage,
            data: data,
            duration: `${duration}ms`,
            url: `${this.baseURL}${endpoint}`
          });
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      // Log successful response in dev mode
      this.logResponse(endpoint, data, duration);

      // Extract data from backend response format
      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      if (import.meta.env.DEV) {
        console.error(`[API Request Failed] ${endpoint}`, {
          error: error,
          errorType: error instanceof Error ? error.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          duration: `${duration}ms`,
          url: `${this.baseURL}${endpoint}`
        });
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout - please try again',
        };
      }
      
      // Check for CORS errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        if (import.meta.env.DEV) {
          console.error(`[CORS Error] Possible CORS issue or backend not running`);
        }
        return {
          success: false,
          error: 'Cannot connect to server. Please ensure the backend is running.',
        };
      }
      
      const apiError = this.handleError(error);
      return {
        success: false,
        error: apiError.message,
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Upload file (multipart/form-data)
   */
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

    const token = this.getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Upload failed',
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      const apiError = this.handleError(error);
      return {
        success: false,
        error: apiError.message,
      };
    }
  }
}

export const apiService = new ApiService();
export { API_ENDPOINTS };
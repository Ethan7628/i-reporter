import { apiService, API_ENDPOINTS } from './api.service';
import { LoginCredentials, SignupCredentials, AuthResponse, User, VerifyOTPCredentials } from '@/types';

class AuthService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  private clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Login failed');
      }

      // Store the token if it exists in the response
      if (response.data.token) {
        this.setToken(response.data.token);
      }

      return response.data;
    } catch (error) {
      this.clearToken();
      throw error;
    }
  }

  async signup(credentials: SignupCredentials): Promise<{ message: string }> {
    try {
      const response = await apiService.post<{ message: string }>(
        API_ENDPOINTS.AUTH.SIGNUP,
        credentials
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Signup failed');
      }

      // Signup now only sends OTP, doesn't create user yet
      return response.data;
    } catch (error) {
      this.clearToken();
      throw error;
    }
  }

  async verifyOTP(credentials: VerifyOTPCredentials): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>(
        API_ENDPOINTS.AUTH.VERIFY_OTP,
        credentials
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'OTP verification failed');
      }

      // Store the token after successful OTP verification
      if (response.data.token) {
        this.setToken(response.data.token);
      }

      return response.data;
    } catch (error) {
      this.clearToken();
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiService.get<{ user: User }>(
        API_ENDPOINTS.AUTH.CURRENT_USER
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get user');
      }

      return response.data.user;
    } catch (error) {
      this.clearToken();
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearToken();
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const authService = new AuthService();
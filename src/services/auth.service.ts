/**
 * Authentication Service
 * 
 * Handles all authentication-related operations using the backend API.
 */

import { apiService, API_ENDPOINTS } from './api.service';
import { 
  User, 
  LoginCredentials, 
  SignupCredentials, 
  AuthResponse,
  loginSchema,
  signupSchema 
} from '@/types';

// Storage keys for client-side session
const AUTH_TOKEN_KEY = 'auth_token';
const CURRENT_USER_KEY = 'ireporter_current_user';

class AuthService {
  /**
   * Sign up a new user
   */
  async signup(credentials: SignupCredentials): Promise<{ user: User } | { error: string }> {
    try {
      // Validate input
      const validated = signupSchema.parse(credentials);

      const response = await apiService.post<AuthResponse>(
        API_ENDPOINTS.AUTH.SIGNUP,
        validated
      );

      if (!response.success || !response.data) {
        return { error: response.error || 'Signup failed' };
      }

      // Store auth token and user data
      if (response.data.token) {
        this.setAuthToken(response.data.token);
      }
      this.setCurrentUser(response.data.user);

      return { user: response.data.user };
    } catch (error) {
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: 'Signup failed. Please try again.' };
    }
  }

  /**
   * Log in a user
   */
  async login(credentials: LoginCredentials): Promise<{ user: User } | { error: string }> {
    try {
      // Validate input
      const validated = loginSchema.parse(credentials);

      const response = await apiService.post<AuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        validated
      );

      if (!response.success || !response.data) {
        return { error: response.error || 'Login failed' };
      }

      // Store auth token and user data
      if (response.data.token) {
        this.setAuthToken(response.data.token);
      }
      this.setCurrentUser(response.data.user);

      return { user: response.data.user };
    } catch (error) {
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: 'Login failed. Please try again.' };
    }
  }

  /**
   * Log out current user
   */
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint
      await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local data
      this.clearAuthToken();
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  /**
   * Get current authenticated user from backend
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiService.get<User>(API_ENDPOINTS.AUTH.CURRENT_USER);
      if (!response.success || !response.data) {
        return null;
      }
      this.setCurrentUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Get current user synchronously from local storage (for initial load)
   */
  getCurrentUserSync(): User | null {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Set authentication token
   */
  private setAuthToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  /**
   * Clear authentication token
   */
  private clearAuthToken(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  /**
   * Set current user in local storage
   */
  private setCurrentUser(user: User): void {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
}

export const authService = new AuthService();

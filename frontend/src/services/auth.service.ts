import { apiService, API_ENDPOINTS } from './api.service';
import {
  User,
  LoginCredentials,
  SignupCredentials,
  AuthResponse,
  loginSchema,
  signupSchema
} from '@/types';

/**
 * Authentication Service - Production Ready
 * Handles all auth operations with backend integration
 * NO MOCK DATA - All operations use real API calls
 */

// Storage keys for authentication tokens only
const AUTH_TOKEN_KEY = 'auth_token';
const CURRENT_USER_KEY = 'ireporter_current_user';

// Define proper response types
interface BackendAuthResponse {
  user: User;
  token: string;
}

interface BackendUserResponse {
  user: User;
}

class AuthService {
  /**
   * Sign up a new user
   */
  async signup(credentials: SignupCredentials): Promise<{ user: User } | { error: string }> {
    try {
      if (import.meta.env.DEV) {
        console.log('[Auth] Attempting signup for:', credentials.email);
      }

      // Validate input
      const validated = signupSchema.parse(credentials);

      const response = await apiService.post<BackendAuthResponse>(
        API_ENDPOINTS.AUTH.SIGNUP,
        validated
      );

      if (!response.success || !response.data) {
        if (import.meta.env.DEV) {
          console.error('[Auth] Signup failed:', response.error);
        }
        return { error: response.error || 'Signup failed. Please try again.' };
      }

      const authData = response.data;

      // Store auth token and user data
      if (authData.token) {
        this.setAuthToken(authData.token);
      }
      if (authData.user) {
        this.setCurrentUser(authData.user);
        if (import.meta.env.DEV) {
          console.log('[Auth] Signup successful for user:', authData.user.id);
        }
      }

      return { user: authData.user };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Auth] Signup error:', error);
      }
      
      if (error instanceof Error && error.message.includes('Network')) {
        return { error: 'Network error. Please check your connection and try again.' };
      }
      
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
      if (import.meta.env.DEV) {
        console.log('[Auth] Attempting login for:', credentials.email);
      }

      // Validate input
      const validated = loginSchema.parse(credentials);

      const response = await apiService.post<BackendAuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        validated
      );

      if (!response.success || !response.data) {
        if (import.meta.env.DEV) {
          console.error('[Auth] Login failed:', response.error);
        }
        return { error: response.error || 'Login failed. Please check your credentials.' };
      }

      const authData = response.data;

      // Store auth token and user data
      if (authData.token) {
        this.setAuthToken(authData.token);
      }
      if (authData.user) {
        this.setCurrentUser(authData.user);
        if (import.meta.env.DEV) {
          console.log('[Auth] Login successful for user:', authData.user.id);
        }
      }

      return { user: authData.user };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Auth] Login error:', error);
      }
      
      if (error instanceof Error && error.message.includes('Network')) {
        return { error: 'Network error. Please check your connection and try again.' };
      }
      
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
      if (import.meta.env.DEV) {
        console.log('[Auth] Logging out user');
      }
      
      // Call backend logout endpoint
      await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
      
      if (import.meta.env.DEV) {
        console.log('[Auth] Logout successful');
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Auth] Logout error:', error);
      }
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
      if (import.meta.env.DEV) {
        console.log('[Auth] Fetching current user from backend');
      }

      const response = await apiService.get<BackendUserResponse>(API_ENDPOINTS.AUTH.CURRENT_USER);
      if (!response.success || !response.data) {
        if (import.meta.env.DEV) {
          console.warn('[Auth] Failed to fetch current user:', response.error);
        }
        return null;
      }

      const userData = response.data.user;
      this.setCurrentUser(userData);
      
      if (import.meta.env.DEV) {
        console.log('[Auth] Current user fetched:', userData.id);
      }
      
      return userData;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Auth] Get current user error:', error);
      }
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
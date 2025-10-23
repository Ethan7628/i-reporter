/**
 * Authentication Service
 * 
 * Handles all authentication-related operations.
 * Currently uses mock data - will switch to real API when backend is ready.
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

// Mock storage keys
const USERS_KEY = 'ireporter_users';
const CURRENT_USER_KEY = 'ireporter_current_user';

class AuthService {
  /**
   * Sign up a new user
   */
  async signup(credentials: SignupCredentials): Promise<{ user: User } | { error: string }> {
    // Validate input
    const validated = signupSchema.parse(credentials);

    // TODO: Replace with real API call when ready
    // const response = await apiService.post<AuthResponse>(
    //   API_ENDPOINTS.AUTH.SIGNUP,
    //   validated
    // );
    // if (!response.success || !response.data) {
    //   return { error: response.error || 'Signup failed' };
    // }
    // this.setAuthToken(response.data.token);
    // return { user: response.data.user };

    // Mock implementation
    return this.mockSignup(validated);
  }

  /**
   * Log in a user
   */
  async login(credentials: LoginCredentials): Promise<{ user: User } | { error: string }> {
    // Validate input
    const validated = loginSchema.parse(credentials);

    // TODO: Replace with real API call when ready
    // const response = await apiService.post<AuthResponse>(
    //   API_ENDPOINTS.AUTH.LOGIN,
    //   validated
    // );
    // if (!response.success || !response.data) {
    //   return { error: response.error || 'Login failed' };
    // }
    // this.setAuthToken(response.data.token);
    // return { user: response.data.user };

    // Mock implementation
    return this.mockLogin(validated);
  }

  /**
   * Log out current user
   */
  async logout(): Promise<void> {
    // TODO: Replace with real API call when ready
    // await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
    
    this.clearAuthToken();
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    // TODO: Replace with real API call when ready
    // const response = await apiService.get<User>(API_ENDPOINTS.AUTH.CURRENT_USER);
    // if (!response.success || !response.data) {
    //   return null;
    // }
    // return response.data;

    // Mock implementation
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Get current user synchronously (for initial load)
   */
  getCurrentUserSync(): User | null {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Make a user admin (dev/testing only)
   */
  makeAdmin(email: string): void {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const userIndex = users.findIndex((u: User) => u.email === email);
    
    if (userIndex !== -1) {
      users[userIndex].role = 'admin';
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      const currentUser = this.getCurrentUserSync();
      if (currentUser?.email === email) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[userIndex]));
      }
    }
  }

  /**
   * Set authentication token
   */
  private setAuthToken(token?: string): void {
    if (token) {
      localStorage.setItem('auth_token', token);
    }
  }

  /**
   * Clear authentication token
   */
  private clearAuthToken(): void {
    localStorage.removeItem('auth_token');
  }

  // ============= MOCK IMPLEMENTATIONS (Remove when backend is ready) =============

  private mockSignup(data: SignupCredentials): { user: User } | { error: string } {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    if (users.find((u: User) => u.email === data.email)) {
      return { error: 'Email already registered' };
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'user',
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    return { user: newUser };
  }

  private mockLogin(data: LoginCredentials): { user: User } | { error: string } {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: User) => u.email === data.email);

    if (!user) {
      return { error: 'Invalid email or password' };
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return { user };
  }
}

export const authService = new AuthService();

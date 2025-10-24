import { z } from 'zod';
<<<<<<< HEAD
=======
import api, { setToken } from './api';
>>>>>>> ivan

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = loginSchema.extend({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
});

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
}

<<<<<<< HEAD
const USERS_KEY = 'ireporter_users';
const CURRENT_USER_KEY = 'ireporter_current_user';

export const mockAuth = {
  signup: (data: z.infer<typeof signupSchema>): { user: User } | { error: string } => {
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
  },

  login: (data: z.infer<typeof loginSchema>): { user: User } | { error: string } => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: User) => u.email === data.email);

    if (!user) {
      return { error: 'Invalid email or password' };
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return { user };
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  makeAdmin: (email: string) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const userIndex = users.findIndex((u: User) => u.email === email);
    
    if (userIndex !== -1) {
      users[userIndex].role = 'admin';
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      const currentUser = mockAuth.getCurrentUser();
      if (currentUser?.email === email) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[userIndex]));
      }
=======
export const mockAuth = {
  signup: async (data: z.infer<typeof signupSchema>): Promise<{ user: User } | { error: string }> => {
    try {
      const res = await api.post<{ user: User; token?: string }>('/auth/signup', data);
      if (res.token) setToken(res.token);
      return { user: res.user };
    } catch (err: any) {
      return { error: err.message || 'Signup failed' };
    }
  },

  login: async (data: z.infer<typeof loginSchema>): Promise<{ user: User } | { error: string }> => {
    try {
      const res = await api.post<{ user: User; token?: string }>('/auth/login', data);
      if (res.token) setToken(res.token);
      return { user: res.user };
    } catch (err: any) {
      return { error: err.message || 'Login failed' };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    setToken(null);
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const res = await api.get<{ user: User }>('/auth/me');
      return res.user;
    } catch {
      return null;
    }
  },

  makeAdmin: async (email: string) => {
    try {
      await api.post('/auth/make-admin', { email });
    } catch (e) {
      // ignore
>>>>>>> ivan
    }
  },
};

import { z } from 'zod';
import api, { setToken } from './api';

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

export const mockAuth = {
  signup: async (data: z.infer<typeof signupSchema>): Promise<{ user: User } | { error: string }> => {
    try {
      const res = await api.post<{ user: User; token?: string }>('/auth/signup', data);
      if (res.token) setToken(res.token);
      // persist current user for sync callers
      try { localStorage.setItem('ireporter_current_user', JSON.stringify(res.user)); } catch {}
      return { user: res.user };
    } catch (err: any) {
      return { error: err.message || 'Signup failed' };
    }
  },

  login: async (data: z.infer<typeof loginSchema>): Promise<{ user: User } | { error: string }> => {
    try {
      const res = await api.post<{ user: User; token?: string }>('/auth/login', data);
      if (res.token) setToken(res.token);
      try { localStorage.setItem('ireporter_current_user', JSON.stringify(res.user)); } catch {}
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

  // Keep a sync getter for compatibility with components that expect immediate value
  getCurrentUser: (() => {
    const sync = (): User | null => {
      try {
        const u = localStorage.getItem('ireporter_current_user');
        return u ? JSON.parse(u) : null;
      } catch {
        return null;
      }
    };

    // async variant also available as mockAuth.getCurrentUserAsync
    const asyncFn = async (): Promise<User | null> => {
      try {
        const res = await api.get<{ user: User }>('/auth/me');
        try { localStorage.setItem('ireporter_current_user', JSON.stringify(res.user)); } catch {}
        return res.user;
      } catch {
        return sync();
      }
    };

    // Return the sync function but attach the async one for explicit usage
    (sync as any).async = asyncFn;
    return sync as unknown as (() => User | null) & { async: () => Promise<User | null> };
  })(),

  makeAdmin: async (email: string) => {
    try {
      await api.post('/auth/make-admin', { email });
    } catch (e) {
      // ignore
    }
  },
};

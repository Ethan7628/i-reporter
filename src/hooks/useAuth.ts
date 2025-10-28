/**
 * Authentication Hook
 * 
 * Provides authentication state and methods to components with comprehensive error handling
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { User, LoginCredentials, SignupCredentials } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Load user on mount with error handling
    const loadUser = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First try to get user from localStorage for immediate UI
        const localUser = authService.getCurrentUserSync();
        setUser(localUser);
        
        // Then try to validate with backend
        if (localUser) {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            // Token might be invalid, clear local data
            setUser(null);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('ireporter_current_user');
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load user';
        setError(message);
        console.error('Error loading user:', err);
        
        // Clear invalid auth data
        setUser(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('ireporter_current_user');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Validate credentials exist
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      const result = await authService.login(credentials);
      
      if ('error' in result) {
        setError(result.error);
        toast({
          title: 'Login failed',
          description: result.error,
          variant: 'destructive',
        });
        return false;
      }

      setUser(result.user);
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${result.user.email}`,
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signup = useCallback(async (credentials: SignupCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Validate credentials exist
      if (!credentials.email || !credentials.password || !credentials.firstName || !credentials.lastName) {
        throw new Error('All fields are required');
      }

      const result = await authService.signup(credentials);
      
      if ('error' in result) {
        setError(result.error);
        toast({
          title: 'Signup failed',
          description: result.error,
          variant: 'destructive',
        });
        return false;
      }

      setUser(result.user);
      toast({
        title: 'Account created!',
        description: 'Welcome to iReporter',
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.logout();
      setUser(null);
      navigate('/landing');
      toast({
        title: 'Logged out',
        description: 'See you soon!',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      console.error('Logout error:', err);
      // Still clear user state even if logout fails
      setUser(null);
      navigate('/landing');
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  const requireAuth = useCallback((redirectTo = '/auth'): boolean => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to continue',
        variant: 'destructive',
      });
      navigate(redirectTo);
      return false;
    }
    return true;
  }, [user, navigate, toast]);

  const requireAdmin = useCallback((): boolean => {
    if (!user || user.role !== 'admin') {
      toast({
        title: 'Access denied',
        description: 'You need admin privileges',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return false;
    }
    return true;
  }, [user, navigate, toast]);

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    requireAuth,
    requireAdmin,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };
};
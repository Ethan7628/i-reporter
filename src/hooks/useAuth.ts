/**
 * Authentication Hook
 * 
 * Provides authentication state and methods to components
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { User, LoginCredentials, SignupCredentials } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Load user on mount
    const currentUser = authService.getCurrentUserSync();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const result = await authService.login(credentials);
      
      if ('error' in result) {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      const result = await authService.signup(credentials);
      
      if ('error' in result) {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    navigate('/landing');
    toast({
      title: 'Logged out',
      description: 'See you soon!',
    });
  };

  const requireAuth = (redirectTo = '/auth') => {
    if (!user) {
      navigate(redirectTo);
      return false;
    }
    return true;
  };

  const requireAdmin = () => {
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
  };

  return {
    user,
    loading,
    login,
    signup,
    logout,
    requireAuth,
    requireAdmin,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };
};

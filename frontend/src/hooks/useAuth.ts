import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { User, LoginCredentials, SignupCredentials, VerifyOTPCredentials } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const token = authService.getToken();
        
        if (token) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
        authService.logout(); // Clear invalid token
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authService.login(credentials);
      
      if (response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        
        toast({
          title: "Login successful!",
          description: `Welcome back, ${response.user.firstName}!`,
        });
        
        // Navigate to dashboard after successful login
        navigate('/dashboard', { replace: true });
        return true;
      }
      return false;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, navigate]);

  const signup = useCallback(async (credentials: SignupCredentials): Promise<{ success: boolean; message?: string }> => {
    try {
      setLoading(true);
      const response = await authService.signup(credentials);
      
      toast({
        title: "OTP Sent!",
        description: response.message || "Please check your email for the verification code.",
      });
      
      return { success: true, message: response.message };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      toast({
        title: "Signup failed",
        description: message,
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const verifyOTP = useCallback(async (credentials: VerifyOTPCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authService.verifyOTP(credentials);
      
      if (response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        
        toast({
          title: "Account created!",
          description: `Welcome, ${response.user.firstName}!`,
        });
        
        navigate('/dashboard', { replace: true });
        return true;
      }
      return false;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'OTP verification failed';
      toast({
        title: "Verification failed",
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, navigate]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      navigate('/auth', { replace: true });
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    }
  }, [toast, navigate]);

  const requireAuth = useCallback((): boolean => {
    if (!isAuthenticated) {
      navigate('/auth');
      return false;
    }
    return true;
  }, [isAuthenticated, navigate]);

  return {
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    verifyOTP,
    logout,
    requireAuth,
  };
};
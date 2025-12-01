import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, signupSchema } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Shield, Mail } from "lucide-react";
import { ZodError } from "zod";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, signup, verifyOTP, isAuthenticated, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'verify-otp'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    otp: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const validated = loginSchema.parse(formData);
        const success = await login(validated);
        if (success) navigate('/dashboard');
      } else if (mode === 'signup') {
        const validated = signupSchema.parse(formData);
        const result = await signup(validated);
        if (result.success) setMode('verify-otp');
      } else if (mode === 'verify-otp') {
        if (!formData.otp || formData.otp.length !== 6) {
          toast({ title: 'Invalid OTP', description: 'Enter 6-digit code', variant: 'destructive' });
          return;
        }
        await verifyOTP({ email: formData.email, otp: formData.otp });
      }
    } catch (error: unknown) {
      let description = 'Please check your input and try again';

      if (error instanceof ZodError) {
        description = error.errors?.[0]?.message ?? description;
      } else if (error instanceof Error) {
        description = error.message || description;
      }

      toast({ 
        title: 'Authentication error', 
        description, 
        variant: 'destructive' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-root">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="auth-root">
        <Card className="auth-card">
        <CardHeader className="auth-header">
          <div className="auth-logo">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="auth-title">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'verify-otp' && 'Verify Email'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' && 'Sign in to access your reports'}
            {mode === 'signup' && 'Join the fight against corruption'}
            {mode === 'verify-otp' && `Enter code sent to ${formData.email}`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="form-stack">
            {mode === 'verify-otp' ? (
              <>
                <div className="flex items-center justify-center mb-6">
                  <Mail className="h-16 w-16 text-primary" />
                </div>
                <div className="form-field">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input 
                    id="otp" 
                    type="text"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    value={formData.otp} 
                    onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })} 
                    required 
                    disabled={submitting}
                    className="text-center text-2xl tracking-widest"
                  />
                  <p className="text-sm text-muted-foreground mt-2">Check your email. Code expires in 10 minutes.</p>
                </div>
              </>
            ) : mode === 'signup' && (
              <>
                <div className="form-field">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={formData.firstName} 
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
                    required 
                    disabled={submitting}
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={formData.lastName} 
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
                    required 
                    disabled={submitting}
                  />
                </div>
              </>
            )}

            <div className="form-field">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                required 
                disabled={submitting}
              />
            </div>

            <div className="form-field">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={formData.password} 
                onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                required 
                disabled={submitting}
              />
            </div>

            <Button type="submit" className="auth-btn" disabled={submitting}>
              {submitting && 'Please wait...'}
              {!submitting && mode === 'login' && 'Sign In'}
              {!submitting && mode === 'signup' && 'Send Verification Code'}
              {!submitting && mode === 'verify-otp' && 'Verify & Create Account'}
            </Button>
          </form>

          <div className="auth-footer">
            {mode === 'verify-otp' ? (
              <p className="small-text">Didn't receive code?{' '}
                <button type="button" onClick={() => setMode('signup')} className="link-primary" disabled={submitting}>
                  Resend
                </button>
              </p>
            ) : mode === 'login' ? (
              <p className="small-text">Don't have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => setMode('signup')} 
                  className="link-primary"
                  disabled={submitting}
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="small-text">Already have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => setMode('login')} 
                  className="link-primary"
                  disabled={submitting}
                >
                  Sign in
                </button>
              </p>
            )}

            <div className="back-link">
              <Link to="/" className="muted-link">← Back to home</Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </ErrorBoundary>
  );
};

export default Auth;
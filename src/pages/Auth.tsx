import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/services/auth.service";
import { loginSchema, signupSchema } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";
import { ZodError } from "zod";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  useEffect(() => {
    const user = authService.getCurrentUserSync();
    if (user) navigate('/dashboard');
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === 'login') {
        const validated = loginSchema.parse(formData);
        const result = await authService.login(validated);

        if ('error' in result) {
          toast({ title: 'Login failed', description: result.error, variant: 'destructive' });
        } else {
          toast({ title: 'Welcome back!', description: `Logged in as ${result.user.email}` });
          navigate('/dashboard');
        }
      } else {
        const validated = signupSchema.parse(formData);
        const result = await authService.signup(validated);

        if ('error' in result) {
          toast({ title: 'Signup failed', description: result.error, variant: 'destructive' });
        } else {
          toast({ title: 'Account created!', description: 'Welcome to iReporter' });
          navigate('/dashboard');
        }
      }
    } catch (error: unknown) {
      let description = 'Please check your input';

      if (error instanceof ZodError) description = error.errors?.[0]?.message ?? description;
      else if (error instanceof Error) description = error.message || description;

      toast({ title: 'Validation error', description, variant: 'destructive' });
    }
  };

  return (
    <div className="auth-root">
      <Card className="auth-card">
        <CardHeader className="auth-header">
          <div className="auth-logo">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="auth-title">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</CardTitle>
          <CardDescription>
            {mode === 'login' ? 'Sign in to access your reports' : 'Join the fight against corruption'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="form-stack">
            {mode === 'signup' && (
              <>
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
            </div>

            <Button type="submit" className="auth-btn">{mode === 'login' ? 'Sign In' : 'Create Account'}</Button>
          </form>

          <div className="auth-footer">
            {mode === 'login' ? (
              <p className="small-text">Don't have an account?{' '}
                <button type="button" onClick={() => setMode('signup')} className="link-primary">Sign up</button>
              </p>
            ) : (
              <p className="small-text">Already have an account?{' '}
                <button type="button" onClick={() => setMode('login')} className="link-primary">Sign in</button>
              </p>
            )}

            <div className="back-link">
              <Link to="/" className="muted-link">← Back to home</Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

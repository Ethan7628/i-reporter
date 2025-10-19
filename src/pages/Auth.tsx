import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockAuth, loginSchema, signupSchema } from "@/lib/mock-auth";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { ZodError } from "zod";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const user = mockAuth.getCurrentUser();
    if (user) navigate('/dashboard');
  }, [navigate]);

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) {
        newErrors.email = 'Email is required';
      } else if (!emailRegex.test(value)) {
        newErrors.email = 'Please enter a valid email';
      } else {
        delete newErrors.email;
      }
    }

    if (field === 'password') {
      if (!value) {
        newErrors.password = 'Password is required';
      } else if (value.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      } else {
        delete newErrors.password;
      }
    }

    if (mode === 'signup') {
      if (field === 'firstName' && !value) {
        newErrors.firstName = 'First name is required';
      } else if (field === 'firstName') {
        delete newErrors.firstName;
      }

      if (field === 'lastName' && !value) {
        newErrors.lastName = 'Last name is required';
      } else if (field === 'lastName') {
        delete newErrors.lastName;
      }
    }

    setErrors(newErrors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === 'login') {
        const validated = loginSchema.parse(formData);
        const result = mockAuth.login(validated);

        if ('error' in result) {
          toast({ title: 'Login failed', description: result.error, variant: 'destructive' });
        } else {
          toast({ title: 'Welcome back!', description: `Logged in as ${result.user.email}` });
          navigate('/dashboard');
        }
      } else {
        const validated = signupSchema.parse(formData);
        const result = mockAuth.signup(validated);

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

  const passwordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '' };
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-destructive' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'bg-warning' };
    return { strength, label: 'Strong', color: 'bg-success' };
  };

  const passwordCheck = passwordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container flex min-h-screen flex-col items-center justify-center py-12">
        <Link
          to="/"
          className="mb-8 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-ring rounded-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-base">
              {mode === 'login'
                ? 'Sign in to access your reports and make a difference'
                : 'Join thousands fighting corruption and building accountability'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData({ ...formData, firstName: e.target.value });
                        validateField('firstName', e.target.value);
                      }}
                      onBlur={(e) => validateField('firstName', e.target.value)}
                      placeholder="John"
                      required
                      className={errors.firstName ? 'border-destructive focus-visible:ring-destructive' : ''}
                      aria-invalid={!!errors.firstName}
                      aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                    />
                    {errors.firstName && (
                      <p id="firstName-error" className="text-sm text-destructive">{errors.firstName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData({ ...formData, lastName: e.target.value });
                        validateField('lastName', e.target.value);
                      }}
                      onBlur={(e) => validateField('lastName', e.target.value)}
                      placeholder="Doe"
                      required
                      className={errors.lastName ? 'border-destructive focus-visible:ring-destructive' : ''}
                      aria-invalid={!!errors.lastName}
                      aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                    />
                    {errors.lastName && (
                      <p id="lastName-error" className="text-sm text-destructive">{errors.lastName}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    validateField('email', e.target.value);
                  }}
                  onBlur={(e) => validateField('email', e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      validateField('password', e.target.value);
                    }}
                    onBlur={(e) => validateField('password', e.target.value)}
                    placeholder={mode === 'login' ? 'Enter your password' : 'Create a strong password'}
                    required
                    className={errors.password ? 'border-destructive pr-10 focus-visible:ring-destructive' : 'pr-10'}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus-ring rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive">{errors.password}</p>
                )}

                {mode === 'signup' && formData.password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${passwordCheck.color}`}
                          style={{ width: `${(passwordCheck.strength / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{passwordCheck.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use 8+ characters with a mix of letters, numbers & symbols
                    </p>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full touch-target" size="lg">
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    {mode === 'login' ? 'New to iReporter?' : 'Already have an account?'}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setErrors({});
                  setFormData({ email: '', password: '', firstName: '', lastName: '' });
                }}
              >
                {mode === 'login' ? 'Create an account' : 'Sign in instead'}
              </Button>
            </div>

            {mode === 'signup' && (
              <div className="mt-6 rounded-lg border bg-muted/50 p-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-success" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Secure & Confidential</p>
                    <p className="text-muted-foreground">
                      Your data is encrypted and protected. We never share your information without consent.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Auth;

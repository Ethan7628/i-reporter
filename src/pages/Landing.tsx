import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertTriangle, FileCheck, MapPin, Shield, ArrowRight, CheckCircle2, Users, TrendingUp, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-background to-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 transition-smooth hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">iReporter</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild className="touch-target">
              <Link to="/auth?mode=signup">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative py-16 md:py-24 lg:py-32">
          <div className="container">
            <div className="mx-auto max-w-4xl text-center">
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
                Trusted by Citizens Nationwide
              </Badge>
              <h1 className="mb-6 text-balance">
                Your Voice Against Corruption
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
                Report corruption incidents and request government intervention to build a transparent, accountable society. Join thousands making a difference.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="touch-target text-base">
                  <Link to="/auth?mode=signup">
                    Start Reporting
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="touch-target text-base">
                  <Link to="/auth">View Dashboard</Link>
                </Button>
              </div>

              <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4 md:gap-8">
                <div className="text-center">
                  <div className="mb-2 text-3xl font-bold text-primary md:text-4xl">15K+</div>
                  <div className="text-sm text-muted-foreground">Reports Filed</div>
                </div>
                <div className="text-center">
                  <div className="mb-2 text-3xl font-bold text-primary md:text-4xl">8.2K</div>
                  <div className="text-sm text-muted-foreground">Cases Resolved</div>
                </div>
                <div className="text-center">
                  <div className="mb-2 text-3xl font-bold text-primary md:text-4xl">95%</div>
                  <div className="text-sm text-muted-foreground">User Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="mb-2 text-3xl font-bold text-primary md:text-4xl">24/7</div>
                  <div className="text-sm text-muted-foreground">Platform Access</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mb-12 text-center">
              <h2 className="mb-4">How It Works</h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Simple, secure, and effective process for civic engagement
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="relative overflow-hidden border-2 transition-smooth hover:border-primary hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
                    <AlertTriangle className="h-7 w-7 text-destructive" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Report Red-Flags</h3>
                  <p className="text-muted-foreground">
                    Flag corruption incidents with detailed evidence, location data, and supporting media for investigation.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-2 transition-smooth hover:border-primary hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10">
                    <FileCheck className="h-7 w-7 text-secondary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Request Intervention</h3>
                  <p className="text-muted-foreground">
                    Submit requests for government action on infrastructure issues and public services that need attention.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-2 transition-smooth hover:border-primary hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <MapPin className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Track Location</h3>
                  <p className="text-muted-foreground">
                    Attach precise geolocation to every report for accurate identification and faster response times.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-2 transition-smooth hover:border-primary hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
                    <Shield className="h-7 w-7 text-success" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Monitor Progress</h3>
                  <p className="text-muted-foreground">
                    Track your report status from submission through investigation to final resolution with real-time updates.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-muted py-16 md:py-24">
          <div className="container">
            <div className="mb-12 text-center">
              <h2 className="mb-4">Why Choose iReporter</h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Built with transparency, security, and accountability at its core
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">Secure & Private</h3>
                <p className="text-muted-foreground">
                  Your data is encrypted and protected. Report with confidence knowing your identity is secure.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">Verified System</h3>
                <p className="text-muted-foreground">
                  All reports are reviewed by authorized personnel ensuring legitimate concerns are addressed promptly.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10">
                  <TrendingUp className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">Proven Impact</h3>
                <p className="text-muted-foreground">
                  Thousands of resolved cases demonstrate our platform's effectiveness in driving real change.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container">
            <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardContent className="p-8 text-center md:p-12 lg:p-16">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h2 className="mb-4">Ready to Make a Difference?</h2>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                  Join thousands of citizens working towards a corruption-free society. Your voice matters, and every report contributes to positive change.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <Button asChild size="lg" className="touch-target text-base">
                    <Link to="/auth?mode=signup">
                      Create Your Account
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="touch-target text-base">
                    <Link to="/auth">Sign In</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/50 py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">iReporter</span>
              </div>
              <p className="mb-4 text-muted-foreground">
                Building accountability and transparency through civic engagement. Empowering citizens to report corruption and request government intervention.
              </p>
              <p className="text-sm text-muted-foreground">
                &copy; 2025 iReporter. All rights reserved.
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/auth" className="text-muted-foreground transition-colors hover:text-foreground">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/auth?mode=signup" className="text-muted-foreground transition-colors hover:text-foreground">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="text-muted-foreground">Help Center</span>
                </li>
                <li>
                  <span className="text-muted-foreground">Privacy Policy</span>
                </li>
                <li>
                  <span className="text-muted-foreground">Terms of Service</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

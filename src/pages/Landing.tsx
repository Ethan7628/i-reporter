import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertTriangle, FileCheck, MapPin, Shield } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">iReporter</h1>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/auth?mode=signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Your Voice Against Corruption
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Report corruption incidents and request government intervention to build a transparent, accountable society.
            </p>
            <Button size="lg" asChild>
              <Link to="/auth?mode=signup">Get Started</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <h4 className="font-semibold mb-2">Report Red-Flags</h4>
                <p className="text-sm text-muted-foreground">
                  Flag corruption incidents with evidence and location data
                </p>
              </div>

              <div className="text-center">
                <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileCheck className="h-8 w-8 text-secondary" />
                </div>
                <h4 className="font-semibold mb-2">Request Intervention</h4>
                <p className="text-sm text-muted-foreground">
                  Request government action on infrastructure and services
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Track Location</h4>
                <p className="text-sm text-muted-foreground">
                  Attach precise geolocation to every report
                </p>
              </div>

              <div className="text-center">
                <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-accent" />
                </div>
                <h4 className="font-semibold mb-2">Monitor Status</h4>
                <p className="text-sm text-muted-foreground">
                  Track your report from submission to resolution
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h3>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of citizens working towards a corruption-free society.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth?mode=signup">Create Your Account</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 iReporter. Building accountability together.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

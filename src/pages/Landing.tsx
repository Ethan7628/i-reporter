import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertTriangle, FileCheck, MapPin, Shield } from "lucide-react";

const Landing = () => {
  return (
    <div className="landing-root">
      {/* Hero Section */}
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="brand-title">iReporter</h1>
          </div>
          <div className="nav-actions">
            <Button variant="outline" asChild>
              <Link to="/auth" className="login-Btn">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/auth?mode=signup" className="signUp-Btn">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="hero-section">
          <div className="container hero-inner">
            <h2 className="hero-title">Your Voice Against Corruption</h2>
            <p className="hero-subtext">Report corruption incidents and request government intervention to build a transparent, accountable society.</p>
            <Button size="lg" asChild>
              <Link to="/auth?mode=signup" className="cta-Btn">Get Started</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="features-section">
          <div className="container">
            <h3 className="features-title">How It Works</h3>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <h4 className="feature-title">Report Red-Flags</h4>
                <p className="feature-desc">Flag corruption incidents with evidence and location data</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <FileCheck className="h-8 w-8 text-secondary" />
                </div>
                <h4 className="feature-title">Request Intervention</h4>
                <p className="feature-desc">Request government action on infrastructure and services</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h4 className="feature-title">Track Location</h4>
                <p className="feature-desc">Attach precise geolocation to every report</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <Shield className="h-8 w-8 text-accent" />
                </div>
                <h4 className="feature-title">Monitor Status</h4>
                <p className="feature-desc">Track your report from submission to resolution</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="container text-center">
            <h3 className="cta-title">Ready to Make a Difference?</h3>
            <p className="cta-desc">Join thousands of citizens working towards a corruption-free society.</p>
            <Button size="lg"  asChild>
              <Link to="/auth?mode=signup" className="cta-Btn">Create Your Account</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p className="footer-text">&copy; 2025 iReporter. Building accountability together.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockAuth } from "@/lib/mock-auth";
import { mockReports, Report } from "@/lib/mock-reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, LogOut, AlertTriangle, FileCheck, MapPin, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const statusColors = {
  draft: 'bg-muted',
  'under-investigation': 'bg-warning',
  rejected: 'bg-destructive',
  resolved: 'bg-secondary',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(mockAuth.getCurrentUser());
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setReports(mockReports.getUserReports(user.id));
  }, [user, navigate]);

  const handleLogout = () => {
    mockAuth.logout();
    setUser(null);
    navigate('/landing');
    toast({
      title: "Logged out",
      description: "See you soon!",
    });
  };

  const handleDelete = (id: string) => {
    try {
      mockReports.delete(id, user!.id);
      setReports(mockReports.getUserReports(user!.id));
      toast({
        title: "Report deleted",
        description: "Your report has been removed",
      });
    } catch (error: unknown) {
      let message = "An error occurred";
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        title: "Cannot delete",
        description: message,
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-root">
      <header className="site-header">
        <div className="container header-inner">
          <div className="header-row">
            <div className="brand">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="brand-title">iReporter</h1>
            </div>
            <div className="header-actions">
              <span className="user-info">{user.firstName} {user.lastName}{user.role === 'admin' && <Badge className="ml-2" variant="secondary">Admin</Badge>}</span>
              {user.role === 'admin' && <Button variant="outline" asChild><Link to="/admin">Admin Panel</Link></Button>}
              <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-5 w-5" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container page-content">
        <div className="page-row">
          <div className="page-title-block">
            <h2 className="page-title">My Reports</h2>
            <p className="page-subtext">Manage your corruption reports and intervention requests</p>
          </div>
          <div>
            <Button asChild>
              <Link to="/report/new"><Plus className="icon-left" />New Report</Link>
            </Button>
          </div>
        </div>

        {reports.length === 0 ? (
          <Card>
            <CardContent className="empty-state">
              <Shield className="empty-icon" />
              <h3 className="empty-title">No reports yet</h3>
              <p className="empty-subtext">Create your first report to start making a difference</p>
              <Button asChild><Link to="/report/new">Create Report</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="reports-list">
            {reports.map((report) => (
              <Card key={report.id} className="report-card">
                <CardHeader>
                  <div className="report-row">
                    <div className="report-main">
                      <div className="report-meta">
                        {report.type === 'red-flag' ? (
                          <AlertTriangle className="icon-destructive" />
                        ) : (
                          <FileCheck className="icon-secondary" />
                        )}
                        <Badge className={statusColors[report.status]}>{report.status}</Badge>
                      </div>
                      <CardTitle>{report.title}</CardTitle>
                      <CardDescription className="report-desc">{report.description.substring(0, 150)}...</CardDescription>
                    </div>
                    <div className="report-actions">
                      {!['under-investigation', 'rejected', 'resolved'].includes(report.status) && (
                        <>
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/report/${report.id}/edit`}><Edit className="h-4 w-4" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(report.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="report-details">
                    {report.location && (
                      <div className="report-location"><MapPin className="h-4 w-4" /><span>{report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}</span></div>
                    )}
                    <span className="report-created">Created: {new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

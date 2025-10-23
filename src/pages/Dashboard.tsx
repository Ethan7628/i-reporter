import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, LogOut, AlertTriangle, FileCheck, MapPin, Edit, Trash2 } from "lucide-react";
import { STATUS_COLORS } from "@/utils/constants";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { reports, deleteReport } = useReports(user?.id);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleDelete = async (id: string) => {
    if (user) {
      await deleteReport(id, user.id);
    }
  };

  if (authLoading) {
    return (
      <div className="dashboard-root">
        <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

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
              {user.role === 'admin' && <Button variant="outline" asChild><Link to="/admin" className="adminBtn">Admin Panel</Link></Button>}
              <Button variant="ghost" size="icon" onClick={logout}><LogOut className="h-5 w-5" /></Button>
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
              <Link to="/report/new" className="newReport-btn"><Plus className="icon-left" />New Report</Link>
            </Button>
          </div>
        </div>

        {reports.length === 0 ? (
          <Card>
            <CardContent className="empty-state">
              <Shield className="empty-icon" />
              <h3 className="empty-title">No reports yet</h3>
              <p className="empty-subtext">Create your first report to start making a difference</p>
              <Button asChild><Link to="/report/new" className="createReport-btn">Create Report</Link></Button>
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
                        <Badge className={STATUS_COLORS[report.status]}>{report.status}</Badge>
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

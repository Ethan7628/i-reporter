import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mockAuth } from "@/lib/mock-auth";
import { mockReports, Report, ReportStatus } from "@/lib/mock-reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, LogOut, AlertTriangle, FileCheck, MapPin, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const statusColors = {
  draft: 'bg-muted',
  'under-investigation': 'bg-warning',
  rejected: 'bg-destructive',
  resolved: 'bg-secondary',
};

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(mockAuth.getCurrentUser());
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (user.role !== 'admin') {
      toast({
        title: "Access denied",
        description: "You need admin privileges to access this page",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }

    setReports(mockReports.getAll());
  }, [user, navigate, toast]);

  const handleStatusChange = (reportId: string, newStatus: ReportStatus) => {
    mockReports.updateStatus(reportId, newStatus);
    setReports(mockReports.getAll());
    toast({
      title: "Status updated",
      description: `Report status changed to ${newStatus}`,
    });
  };

  const handleLogout = () => {
    mockAuth.logout();
    setUser(null);
    navigate('/landing');
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-root">
      <header className="site-header admin-header">
        <div className="container header-inner">
          <div className="header-row">
            <div className="brand">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="brand-title">iReporter Admin</h1>
            </div>
            <div className="header-actions">
              <span className="user-info">
                {user.firstName} {user.lastName}
                <Badge className="ml-2" variant="secondary">Admin</Badge>
              </span>
              <Button variant="outline" asChild>
                <Link to="/dashboard">My Dashboard</Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container page-content admin-content">
        <div className="page-header">
          <h2 className="page-title">All Reports</h2>
          <p className="page-subtext">Manage and update the status of all citizen reports</p>
        </div>

        {reports.length === 0 ? (
          <Card>
            <CardContent className="empty-state">
              <Shield className="empty-icon" />
              <h3 className="empty-title">No reports yet</h3>
              <p className="empty-subtext">Reports will appear here as citizens submit them</p>
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
                        <Badge variant="outline" className="report-type">{report.type}</Badge>
                        <Badge className={statusColors[report.status]}>{report.status}</Badge>
                      </div>
                      <CardTitle>{report.title}</CardTitle>
                      <CardDescription className="report-desc">{report.description.substring(0, 200)}...</CardDescription>
                    </div>
                    <div className="report-controls">
                      <Select value={report.status} onValueChange={(value) => handleStatusChange(report.id, value as ReportStatus)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="under-investigation">Under Investigation</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="report-details">
                    {report.location && (
                      <div className="report-location">
                        <MapPin className="h-4 w-4" />
                        <span>Location: {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}</span>
                      </div>
                    )}
                    {report.images.length > 0 && (
                      <>
                        <div className="report-images">
                          <ImageIcon className="h-4 w-4" />
                          <span>{report.images.length} image(s) attached</span>
                        </div>
                        <div className="report-images-grid">
                          {report.images.map((image, idx) => (
                            <div key={idx} className="report-image-thumbnail">
                              <img src={image} alt={`Report evidence ${idx + 1}`} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    <div className="report-meta-small">
                      <span>Created: {new Date(report.createdAt).toLocaleString()}</span>
                      <span>Updated: {new Date(report.updatedAt).toLocaleString()}</span>
                      <span>Report ID: {report.id.substring(0, 8)}</span>
                    </div>
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

export default Admin;

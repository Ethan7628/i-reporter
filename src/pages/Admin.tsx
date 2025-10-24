import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, LogOut, AlertTriangle, FileCheck, MapPin, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { STATUS_COLORS } from "@/utils/constants";
import { ReportStatus } from "@/types";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { reports, getAllReports, updateReportStatus } = useReports();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    if (!isAdmin) {
      toast({
        title: "Access denied",
        description: "You need admin privileges to access this page",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }

    getAllReports();
  }, [isAuthenticated, isAdmin, navigate, toast, getAllReports]);

  const handleStatusChange = async (reportId: string, newStatus: ReportStatus) => {
    await updateReportStatus(reportId, newStatus);
    await getAllReports();
    toast({
      title: "Status updated",
      description: `Report status changed to ${newStatus}`,
    });
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!isAuthenticated || !isAdmin) return null;

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
                        <Badge className={STATUS_COLORS[report.status]}>{report.status}</Badge>
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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mockAuth } from "@/lib/mock-auth";
import { mockReports, Report, ReportStatus } from "@/lib/mock-reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, LogOut, AlertTriangle, FileCheck, MapPin, Image as ImageIcon, Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const statusColors = {
  draft: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Draft' },
  'under-investigation': { bg: 'bg-warning/10 text-warning', text: 'text-warning', label: 'Under Investigation' },
  rejected: { bg: 'bg-destructive/10 text-destructive', text: 'text-destructive', label: 'Rejected' },
  resolved: { bg: 'bg-success/10 text-success', text: 'text-success', label: 'Resolved' },
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
      title: "Status updated successfully",
      description: `Report status changed to ${statusColors[newStatus].label}`,
    });
  };

  const handleLogout = () => {
    mockAuth.logout();
    setUser(null);
    navigate('/landing');
  };

  if (!user || user.role !== 'admin') return null;

  const stats = {
    total: reports.length,
    draft: reports.filter(r => r.status === 'draft').length,
    investigating: reports.filter(r => r.status === 'under-investigation').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 transition-smooth hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">iReporter Admin</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg bg-muted px-3 py-2 sm:flex">
              <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
              <Badge variant="secondary" className="text-xs">Admin</Badge>
            </div>

            <Button variant="outline" asChild size="sm">
              <Link to="/dashboard">My Dashboard</Link>
            </Button>

            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and update the status of all citizen reports
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draft}</div>
              <p className="text-xs text-muted-foreground">Pending review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investigating</CardTitle>
              <FileCheck className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.investigating}</div>
              <p className="text-xs text-muted-foreground">Under review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <Shield className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">Declined</p>
            </CardContent>
          </Card>
        </div>

        {reports.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
                <Shield className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">No reports yet</h3>
              <p className="max-w-sm text-muted-foreground">
                Reports will appear here as citizens submit them
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="transition-smooth hover:shadow-md">
                <CardHeader>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {report.type === 'red-flag' ? (
                          <div className="flex items-center gap-1.5 text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">Red-Flag</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-secondary">
                            <FileCheck className="h-4 w-4" />
                            <span className="text-sm font-medium">Intervention</span>
                          </div>
                        )}
                        <Badge className={statusColors[report.status].bg}>
                          {statusColors[report.status].label}
                        </Badge>
                      </div>

                      <div>
                        <CardTitle className="mb-2">{report.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {report.description}
                        </CardDescription>
                      </div>

                      <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                        {report.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
                            </span>
                          </div>
                        )}
                        {report.images.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <ImageIcon className="h-4 w-4 flex-shrink-0" />
                            <span>{report.images.length} attachment{report.images.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">Report #{report.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
                      <Select
                        value={report.status}
                        onValueChange={(value) => handleStatusChange(report.id, value as ReportStatus)}
                      >
                        <SelectTrigger className="w-full sm:w-[200px]">
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
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;

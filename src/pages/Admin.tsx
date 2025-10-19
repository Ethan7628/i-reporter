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
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary">iReporter Admin</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
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

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">All Reports</h2>
          <p className="text-muted-foreground">
            Manage and update the status of all citizen reports
          </p>
        </div>

        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No reports yet</h3>
              <p className="text-muted-foreground">
                Reports will appear here as citizens submit them
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {report.type === 'red-flag' ? (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        ) : (
                          <FileCheck className="h-5 w-5 text-secondary" />
                        )}
                        <Badge variant="outline" className="capitalize">
                          {report.type}
                        </Badge>
                        <Badge className={statusColors[report.status]}>
                          {report.status}
                        </Badge>
                      </div>
                      <CardTitle>{report.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {report.description.substring(0, 200)}...
                      </CardDescription>
                    </div>
                    <div className="min-w-[200px]">
                      <Select
                        value={report.status}
                        onValueChange={(value) => handleStatusChange(report.id, value as ReportStatus)}
                      >
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
                  <div className="space-y-2">
                    {report.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>
                          Location: {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
                        </span>
                      </div>
                    )}
                    {report.images.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                        <span>{report.images.length} image(s) attached</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
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

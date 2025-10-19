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
    } catch (error: any) {
      toast({
        title: "Cannot delete",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary">iReporter</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user.firstName} {user.lastName}
                {user.role === 'admin' && (
                  <Badge className="ml-2" variant="secondary">Admin</Badge>
                )}
              </span>
              {user.role === 'admin' && (
                <Button variant="outline" asChild>
                  <Link to="/admin">Admin Panel</Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">My Reports</h2>
            <p className="text-muted-foreground">
              Manage your corruption reports and intervention requests
            </p>
          </div>
          <Button asChild>
            <Link to="/report/new">
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Link>
          </Button>
        </div>

        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No reports yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first report to start making a difference
              </p>
              <Button asChild>
                <Link to="/report/new">Create Report</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {report.type === 'red-flag' ? (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        ) : (
                          <FileCheck className="h-5 w-5 text-secondary" />
                        )}
                        <Badge className={statusColors[report.status]}>
                          {report.status}
                        </Badge>
                      </div>
                      <CardTitle>{report.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {report.description.substring(0, 150)}...
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {!['under-investigation', 'rejected', 'resolved'].includes(report.status) && (
                        <>
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/report/${report.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(report.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {report.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
                        </span>
                      </div>
                    )}
                    <span>Created: {new Date(report.createdAt).toLocaleDateString()}</span>
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

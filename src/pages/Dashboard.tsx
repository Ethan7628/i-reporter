import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockAuth } from "@/lib/mock-auth";
import { mockReports, Report } from "@/lib/mock-reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, LogOut, AlertTriangle, FileCheck, MapPin, Edit, Trash2, Calendar, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusColors = {
  draft: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Draft' },
  'under-investigation': { bg: 'bg-warning/10 text-warning', text: 'text-warning', label: 'Under Investigation' },
  rejected: { bg: 'bg-destructive/10 text-destructive', text: 'text-destructive', label: 'Rejected' },
  resolved: { bg: 'bg-success/10 text-success', text: 'text-success', label: 'Resolved' },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(mockAuth.getCurrentUser());
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<string>('all');

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

  const filteredReports = filter === 'all'
    ? reports
    : reports.filter(r => r.status === filter);

  const stats = {
    total: reports.length,
    draft: reports.filter(r => r.status === 'draft').length,
    investigating: reports.filter(r => r.status === 'under-investigation').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 transition-smooth hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">iReporter</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg bg-muted px-3 py-2 sm:flex">
              <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
              {user.role === 'admin' && (
                <Badge variant="secondary" className="text-xs">Admin</Badge>
              )}
            </div>

            {user.role === 'admin' && (
              <Button variant="outline" asChild size="sm">
                <Link to="/admin">Admin Panel</Link>
              </Button>
            )}

            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold md:text-4xl">My Reports</h1>
            <p className="text-muted-foreground">
              Manage your corruption reports and intervention requests
            </p>
          </div>
          <Button asChild size="lg" className="touch-target">
            <Link to="/report/new">
              <Plus className="mr-2 h-5 w-5" />
              New Report
            </Link>
          </Button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draft}</div>
              <p className="text-xs text-muted-foreground">Pending submission</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investigating</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.investigating}</div>
              <p className="text-xs text-muted-foreground">Under review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <FileCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved}</div>
              <p className="text-xs text-muted-foreground">Successfully closed</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {filter === 'all' ? 'All Reports' : statusColors[filter as keyof typeof statusColors]?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setFilter('all')}>
                All Reports
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('draft')}>
                Draft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('under-investigation')}>
                Under Investigation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('resolved')}>
                Resolved
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('rejected')}>
                Rejected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {filter !== 'all' && (
            <span className="text-sm text-muted-foreground">
              Showing {filteredReports.length} of {reports.length} reports
            </span>
          )}
        </div>

        {filteredReports.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
                <Shield className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                {filter === 'all' ? 'No reports yet' : `No ${filter} reports`}
              </h3>
              <p className="mb-6 max-w-sm text-muted-foreground">
                {filter === 'all'
                  ? 'Create your first report to start making a difference in your community'
                  : `You don't have any reports with ${filter} status`
                }
              </p>
              {filter === 'all' && (
                <Button asChild size="lg">
                  <Link to="/report/new">
                    <Plus className="mr-2 h-5 w-5" />
                    Create Report
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="transition-smooth hover:shadow-md">
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {report.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            <span>{report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {!['under-investigation', 'rejected', 'resolved'].includes(report.status) && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/report/${report.id}/edit`}>
                            <Edit className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Edit</span>
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(report.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    )}
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

export default Dashboard;

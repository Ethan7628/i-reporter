import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { getMediaUrl, getMediaType } from "@/utils/image.utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, LogOut, AlertTriangle, FileCheck, MapPin, Image as ImageIcon, VideoIcon, RadioIcon, Users, BarChart3, Flag, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { STATUS_COLORS } from "@/utils/constants";
import { ReportStatus, MediaType, UserWithReportCount, AdminStats } from "@/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { apiService, API_ENDPOINTS } from "@/services/api.service";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { reports, getAllReports, updateReportStatus, loading: reportsLoading, error } = useReports();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("reports");

  // Users data state
  const [users, setUsers] = useState<UserWithReportCount[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (!authLoading && !isAdmin) {
      toast({
        title: "Access denied",
        description: "You need admin privileges to access this page",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }

    if (isAdmin) {
      getAllReports();
    }
  }, [isAuthenticated, isAdmin, navigate, toast, getAllReports, authLoading]);

  // Fetch users when users tab is active
  useEffect(() => {
    if (isAdmin && activeTab === "users") {
      fetchUsers();
      fetchStats();
    }
  }, [isAdmin, activeTab]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const response = await apiService.get<UserWithReportCount[]>(API_ENDPOINTS.ADMIN.GET_ALL_USERS);
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        setUsersError(response.error || 'Failed to fetch users');
      }
    } catch (err) {
      setUsersError('Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.get<AdminStats>(API_ENDPOINTS.ADMIN.GET_STATS);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleStatusChange = async (reportId: string, newStatus: ReportStatus) => {
    try {
      if (import.meta.env.DEV) {
        console.log('[Admin] Updating report status:', { reportId, newStatus });
      }

      const updatedReport = await updateReportStatus(reportId, newStatus);
      if (updatedReport) {
        await getAllReports();
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[Admin] Status update error:', err);
      }
      toast({
        title: "Status update failed",
        description: "There was a problem updating the report status",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      if (import.meta.env.DEV) {
        console.log('[Admin] User initiated logout');
      }
      await logout();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[Admin] Logout error:', err);
      }
      toast({
        title: 'Logout error',
        description: 'There was a problem logging out',
        variant: 'destructive',
      });
    }
  };

  const getMediaIcon = (mediaType: MediaType) => {
    switch (mediaType) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <VideoIcon className="h-4 w-4" />;
      case 'audio':
        return <RadioIcon className="h-4 w-4" />;
      case 'unknown':
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  if (authLoading) {
    return <LoadingSpinner fullScreen text="Loading admin panel..." />;
  }

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <ErrorBoundary>
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
                  {user!.firstName} {user!.lastName}
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
          {/* Stats Cards */}
          {stats && (
            <div className="user-stats-grid">
              <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="stats-card-content">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Users</p>
                      <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-secondary shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="stats-card-content">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-secondary/10 rounded-xl">
                      <BarChart3 className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Reports</p>
                      <p className="text-3xl font-bold text-foreground">{stats.totalReports}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-accent shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="stats-card-content">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/10 rounded-xl">
                      <FileCheck className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Resolved</p>
                      <p className="text-3xl font-bold text-foreground">{stats.reportsByStatus.resolved}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-destructive shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="stats-card-content">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-destructive/10 rounded-xl">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Under Investigation</p>
                      <p className="text-3xl font-bold text-foreground">{stats.reportsByStatus.underInvestigation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mb-6 tablist">
              <TabsTrigger value="reports" className="tabitem">
                <FileCheck className="h-4 w-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="users" className="tabitem">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
            </TabsList>

            {/* Reports Tab */}
            <TabsContent value="reports">
              <div className="page-header">
                <h2 className="page-title">All Reports</h2>
                <p className="page-subtext">Manage and update the status of all citizen reports</p>
              </div>

              {error && (
                <ErrorMessage
                  title="Error loading reports"
                  message={error}
                  onRetry={() => getAllReports()}
                />
              )}

              {reportsLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" text="Loading reports..." />
                </div>
              ) : reports.length === 0 ? (
                <Card>
                  <CardContent className="empty-state">
                    <Shield className="empty-icon" />
                    <h3 className="empty-title">No reports yet</h3>
                    <p className="empty-subtext">Reports will appear here as citizens submit them</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="reports-list">
                  {reports.map((report) => {
                    const mediaCounts = {
                      images: 0,
                      videos: 0,
                      audios: 0,
                    };

                    report.images?.forEach(media => {
                      const mediaType = getMediaType(media);
                      if (mediaType === 'image') mediaCounts.images++;
                      else if (mediaType === 'video') mediaCounts.videos++;
                      else if (mediaType === 'audio') mediaCounts.audios++;
                    });

                    const totalMedia = mediaCounts.images + mediaCounts.videos + mediaCounts.audios;

                    return (
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
                              <CardDescription className="report-desc">
                                {report.description.length > 200 ? (
                                  <>
                                    {isExpanded ? report.description : `${report.description.substring(0, 200)}...`}
                                    <button
                                      onClick={() => setIsExpanded(!isExpanded)}
                                      className="text-blue-500 hover:text-blue-700 ml-1 text-sm font-medium"
                                    >
                                      {isExpanded ? 'Read Less' : 'Read More'}
                                    </button>
                                  </>
                                ) : (
                                  report.description
                                )}
                              </CardDescription>
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
                            {totalMedia > 0 && (
                              <>
                                <div className="report-media-info">
                                  <div className="media-summary">
                                    <span className="media-count">{totalMedia} media file(s) attached:</span>
                                    {mediaCounts.images > 0 && (
                                      <Badge variant="outline" className="media-type-badge">
                                        <ImageIcon className="h-3 w-3 mr-1" />
                                        {mediaCounts.images} image{mediaCounts.images !== 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                    {mediaCounts.videos > 0 && (
                                      <Badge variant="outline" className="media-type-badge">
                                        <VideoIcon className="h-3 w-3 mr-1" />
                                        {mediaCounts.videos} video{mediaCounts.videos !== 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                    {mediaCounts.audios > 0 && (
                                      <Badge variant="outline" className="media-type-badge">
                                        <RadioIcon className="h-3 w-3 mr-1" />
                                        {mediaCounts.audios} audio{mediaCounts.audios !== 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="image-grid">
                                  {report.images.map((media, idx) => {
                                    const mediaType = getMediaType(media);
                                    return (
                                      <div key={idx} className="media-thumbnail">
                                        {mediaType === 'image' && (
                                          <img
                                            src={getMediaUrl(media)}
                                            alt={`Report evidence ${idx + 1}`}
                                            className="media-preview"
                                          />
                                        )}
                                        {mediaType === 'video' && (
                                          <div className="video-thumbnail">
                                            <video className="image-preview" controls>
                                              <source src={getMediaUrl(media)} type="video/mp4" />
                                            </video>
                                          </div>
                                        )}
                                        {mediaType === 'audio' && (
                                          <div className="audio-thumbnail">
                                            <audio controls>
                                              <source src={getMediaUrl(media)} type="audio/mpeg" />
                                            </audio>
                                          </div>
                                        )}
                                        <div className="media-type-indicator">
                                          {getMediaIcon(mediaType)}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                            <div className="report-meta-small">
                              <span>Created: {new Date(report.createdAt).toLocaleString()}</span>
                              <span>Updated: {new Date(report.updatedAt).toLocaleString()}</span>
                              <span>Report ID: {report.id.substring(0, 8)}</span>
                              <span>User ID: {report.userId.substring(0, 8)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="page-header">
                <h2 className="page-title">All Users</h2>
                <p className="page-subtext">View all registered users and their report statistics</p>
              </div>

              {usersError && (
                <ErrorMessage
                  title="Error loading users"
                  message={usersError}
                  onRetry={fetchUsers}
                />
              )}

              {usersLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" text="Loading users..." />
                </div>
              ) : users.length === 0 ? (
                <Card>
                  <CardContent className="empty-state">
                    <Users className="empty-icon" />
                    <h3 className="empty-title">No users yet</h3>
                    <p className="empty-subtext">Users will appear here once they register</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-lg border-0 overflow-hidden">
                  <CardHeader className="bg-muted/50 border-b">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Registered Users ({users.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="users-table-wrapper p-0">
                    <div className="users-table-container">
                      <Table className="users-data-table">      
                        <TableHeader>
                          <TableRow className="users-table-header">
                            <TableHead className="users-table-head users-col-user">User</TableHead>
                            <TableHead className="users-table-head users-col-email">Email</TableHead>
                            <TableHead className="users-table-head users-col-role">Role</TableHead>
                            <TableHead className="users-table-head users-col-redflags">
                              <div className="users-head-content">
                                <Flag className="h-4 w-4" />
                                <span>Red Flags</span>
                              </div>
                            </TableHead>
                            <TableHead className="users-table-head users-col-interventions">
                              <div className="users-head-content">
                                <Wrench className="h-4 w-4" />
                                <span>Interventions</span>
                              </div>
                            </TableHead>
                            <TableHead className="users-table-head users-col-total">Total</TableHead>
                            <TableHead className="users-table-head users-col-joined">Joined</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((u) => (
                            <TableRow key={u.id} className="users-table-row">
                              <TableCell className="users-table-cell users-cell-user" data-label="User">
                                <div className="user-avatar-cell">
                                  <div className="user-avatar">
                                    {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                                  </div>
                                  <div className="user-info">
                                    <div className="user-name">{u.firstName} {u.lastName}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="users-table-cell users-cell-email" data-label="Email">
                                {u.email}
                              </TableCell>
                              <TableCell className="users-table-cell users-cell-role" data-label="Role">
                                <Badge
                                  variant={u.role === 'admin' ? 'default' : 'outline'}
                                  className={`users-role-badge ${u.role === 'admin' ? 'users-role-admin' : 'users-role-user'}`}
                                >
                                  {u.role === 'admin' ? '🛡️ Admin' : 'User'}
                                </Badge>
                              </TableCell>
                              <TableCell className="users-table-cell users-cell-redflags" data-label="Red Flags">
                                <div className="users-stat-badge users-stat-danger">
                                  {u.redFlagReports}
                                </div>
                              </TableCell>
                              <TableCell className="users-table-cell users-cell-interventions" data-label="Interventions">
                                <div className="users-stat-badge users-stat-secondary">
                                  {u.interventionReports}
                                </div>
                              </TableCell>
                              <TableCell className="users-table-cell users-cell-total" data-label="Total">
                                <div className="users-stat-badge users-stat-primary">
                                  {u.totalReports}
                                </div>
                              </TableCell>
                              <TableCell className="users-table-cell users-cell-joined" data-label="Joined">
                                <div className="users-date-cell">
                                  <div className="date">{new Date(u.createdAt).toLocaleDateString()}</div>
                                  <div className="time">{new Date(u.createdAt).toLocaleTimeString()}</div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default Admin;

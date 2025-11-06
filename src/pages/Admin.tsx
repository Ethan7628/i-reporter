import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { getMediaUrl, getMediaType } from "@/utils/image.utils"; // Updated import
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, LogOut, AlertTriangle, FileCheck, MapPin, Image as ImageIcon, VideoIcon, RadioIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { STATUS_COLORS } from "@/utils/constants";
import { ReportStatus, MediaType } from "@/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { reports, getAllReports, updateReportStatus, loading: reportsLoading, error } = useReports();

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

  const handleStatusChange = async (reportId: string, newStatus: ReportStatus) => {
    try {
      if (import.meta.env.DEV) {
        console.log('[Admin] Updating report status:', { reportId, newStatus });
      }

      const updatedReport = await updateReportStatus(reportId, newStatus);
      if (updatedReport) {
        // Refresh the reports list to show updated status
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

  const getMediaTypeLabel = (mediaType: MediaType): string => {
    switch (mediaType) {
      case 'image':
        return 'image';
      case 'video':
        return 'video';
      case 'audio':
        return 'audio';
      default:
        return 'file';
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
                // Count media by type for better display
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
                                        className="image-preview"
                                      />
                                    )}
                                    {mediaType === 'video' && (
                                      <div className="video-thumbnail">
                                        <video className="image-preview"  controls>
                                          <source src={getMediaUrl(media)} type="video/mp4" />
                                        </video>
                                        {/* <div className="media-overlay">
                                          <VideoIcon className="h-6 w-6" />
                                        </div> */}
                                      </div>
                                    )}
                                    {mediaType === 'audio' && (
                                      <div className="audio-thumbnail">
                                        <audio className="image-preview" controls>
                                          <source src={getMediaUrl(media)} type="audio/mpeg" />
                                        </audio>
                                        {/* <div className="media-overlay">
                                          <RadioIcon className="h-6 w-6" />
                                        </div> */}
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
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default Admin;
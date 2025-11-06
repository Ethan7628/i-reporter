import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { getMediaUrl, getMediaType } from "@/utils/image.utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, LogOut, AlertTriangle, FileCheck, MapPin, Edit, Trash2, ImageIcon, VideoIcon, RadioIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { STATUS_COLORS } from "@/utils/constants";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { reports, getUserReports, deleteReport, loading: reportsLoading, error } = useReports();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }

    // Fetch reports if user is authenticated and has an ID
    if (isAuthenticated && user?.id) {
      if (import.meta.env.DEV) {
        console.log('[Dashboard] Fetching reports for user:', user.id);
      }
      getUserReports(user.id);
    }
  }, [isAuthenticated, user, navigate, getUserReports, authLoading]);

  const handleLogout = async () => {
    try {
      if (import.meta.env.DEV) {
        console.log('[Dashboard] User initiated logout');
      }
      await logout();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[Dashboard] Logout error:', err);
      }
      toast({
        title: 'Logout error',
        description: 'There was a problem logging out',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      if (import.meta.env.DEV) {
        console.log('[Dashboard] Deleting report:', id);
      }

      const success = await deleteReport(id);
      if (success && user) {
        await getUserReports(user.id);
        toast({
          title: "Report deleted",
          description: "Your report has been removed",
        });
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[Dashboard] Delete error:', err);
      }
      toast({
        title: "Delete failed",
        description: "There was a problem deleting the report",
        variant: "destructive",
      });
    }
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <VideoIcon className="h-4 w-4" />;
      case 'audio':
        return <RadioIcon className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  // Helper to count media by type for better display
  const getMediaCounts = (images: string[]) => {
    const counts = { images: 0, videos: 0, audios: 0 };
    images?.forEach(media => {
      const mediaType = getMediaType(media);
      if (mediaType === 'image') counts.images++;
      else if (mediaType === 'video') counts.videos++;
      else if (mediaType === 'audio') counts.audios++;
    });
    return counts;
  };

  if (authLoading) {
    return <LoadingSpinner fullScreen text="Loading your dashboard..." />;
  }

  if (!user) return null;

  return (
    <ErrorBoundary>
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
                <Link to="/report/new" className="newReport-btn"><Plus className="icon-left" />New Report</Link>
              </Button>
            </div>
          </div>

          {error && (
            <ErrorMessage
              title="Error loading reports"
              message={error}
              onRetry={() => user && getUserReports(user.id)}
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
                <p className="empty-subtext">Create your first report to start making a difference</p>
                <Button asChild><Link to="/report/new" className="createReport-btn">Create Report</Link></Button>
              </CardContent>
            </Card>
          ) : (
            <div className="reports-list">
              {reports.map((report) => {
                const mediaCounts = getMediaCounts(report.images);
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
                          <div className="report-location">
                            <MapPin className="h-4 w-4" />
                            <span>{report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}</span>
                          </div>
                        )}
                        {totalMedia > 0 && (
                          <div className="media-section">
                            <div className="media-section-header">
                              <span className="media-section-title">Media Evidence</span>
                              <div className="media-type-summary">
                                <Badge variant="outline" className="media-count">
                                  {totalMedia} {totalMedia === 1 ? 'file' : 'files'}
                                </Badge>
                                {mediaCounts.images > 0 && (
                                  <span className="media-type-count">
                                    <ImageIcon className="h-3 w-3" />
                                    {mediaCounts.images}
                                  </span>
                                )}
                                {mediaCounts.videos > 0 && (
                                  <span className="media-type-count">
                                    <VideoIcon className="h-3 w-3" />
                                    {mediaCounts.videos}
                                  </span>
                                )}
                                {mediaCounts.audios > 0 && (
                                  <span className="media-type-count">
                                    <RadioIcon className="h-3 w-3" />
                                    {mediaCounts.audios}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="image-grid">
                              {report.images.map((media, idx) => {
                                const mediaType = getMediaType(media);
                                return (
                                  <div key={idx} className="image-preview">
                                    {mediaType === 'image' && (
                                      <img
                                        src={getMediaUrl(media)}
                                        alt={`Evidence ${idx + 1}`}
                                        className="media-thumbnail"
                                      />
                                    )}
                                    {mediaType === 'video' && (
                                      <div className="video-thumbnail">
                                        <video className="media-thumbnail" autoPlay>
                                          <source src={getMediaUrl(media)} type="video/mp4" />
                                        </video>
                                        <div className="media-overlay">
                                          <VideoIcon className="h-6 w-6" />
                                        </div>
                                      </div>
                                    )}
                                    {mediaType === 'audio' && (
                                      <div className="audio-thumbnail">
                                        <audio className="image-preview" controls autoPlay>
                                          <source src={getMediaUrl(media)} type="audio/mpeg" />
                                        </audio>
                                        <div className="media-overlay">
                                          <RadioIcon className="h-6 w-6" />
                                        </div>
                                      </div>
                                    )}
                                    <div className="media-badge">
                                      {getMediaIcon(mediaType)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <span className="report-created">Created: {new Date(report.createdAt).toLocaleDateString()}</span>
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

export default Dashboard;
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { useToast } from "@/hooks/use-toast";
import { getMediaUrl, getMediaType } from "@/utils/image.utils"; // Updated import
import { reportSchema, Report } from "@/types";
import { FILE_CONSTRAINTS, VALIDATION_MESSAGES } from "@/utils/constants";
import { Shield, ArrowLeft, MapPin, Upload, X } from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const EditReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, requireAuth, loading: authLoading } = useAuth();
  const { getReport, updateReport: updateReportService, loading: reportLoading } = useReports();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: null as { lat: number; lng: number } | null,
  });
  const [existingMedia, setExistingMedia] = useState<string[]>([]);
  const [newMediaFiles, setNewMediaFiles] = useState<File[]>([]);
  const [newMediaPreviews, setNewMediaPreviews] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!requireAuth() || !id) {
      navigate('/dashboard');
      return;
    }

    const loadReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedReport = await getReport(id);

        if (!fetchedReport) {
          toast({
            title: "Report not found",
            description: "The report you're trying to edit doesn't exist",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }

        if (fetchedReport.userId !== user!.id) {
          toast({
            title: "Access denied",
            description: "You can only edit your own reports",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }

        if (['under-investigation', 'rejected', 'resolved'].includes(fetchedReport.status)) {
          toast({
            title: "Cannot edit",
            description: "This report cannot be edited in its current status",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }

        setReport(fetchedReport);
        setFormData({
          title: fetchedReport.title,
          description: fetchedReport.description,
          location: fetchedReport.location,
        });
        setExistingMedia(fetchedReport.images || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load report';
        setError(message);

        if (import.meta.env.DEV) {
          console.error('[EditReport] Load report error:', err);
        }

        toast({
          title: "Error loading report",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [id, authLoading, user, getReport, navigate, requireAuth, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach((file) => {
      // Check if we've reached the maximum number of media files
      const totalMedia = existingMedia.length + newMediaFiles.length + newFiles.length;
      if (totalMedia >= FILE_CONSTRAINTS.MAX_MEDIA_FILES) {
        toast({
          title: "Maximum media upload reached",
          description: VALIDATION_MESSAGES.TOO_MANY_MEDIA_FILES, // Updated message
          variant: "destructive",
        });
        return;
      }

      // Check file size
      if (file.size > FILE_CONSTRAINTS.MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: VALIDATION_MESSAGES.FILE_TOO_LARGE,
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!(
        file.type.startsWith('image/') ||
        file.type.startsWith("video/") ||
        file.type.startsWith("audio/")
      )) {
        toast({
          title: "Invalid file type",
          description: "Please upload only images, videos and audio files",
          variant: "destructive",
        });
        return;
      }

      newFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        newPreviews.push(base64);

        // Update previews when all files are processed
        if (newPreviews.length === newFiles.length) {
          setNewMediaPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setNewMediaFiles(prev => [...prev, ...newFiles]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeExistingMedia = (index: number) => {
    setExistingMedia(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewMedia = (index: number) => {
    setNewMediaFiles(prev => prev.filter((_, i) => i !== index));
    setNewMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !report) return;

    const totalMedia = existingMedia.length + newMediaFiles.length;
    if (totalMedia > FILE_CONSTRAINTS.MAX_MEDIA_FILES) {
      toast({
        title: "Too many media files",
        description: VALIDATION_MESSAGES.TOO_MANY_MEDIA_FILES, // Updated message
        variant: "destructive",
      });
      return;
    }

    try {
      // Validate form data
      const validated = reportSchema.parse({
        title: formData.title,
        description: formData.description,
        type: report.type,
      });

      console.log('Updating report with:', {
        title: validated.title,
        description: validated.description,
        location: formData.location,
        existingMediaCount: existingMedia.length,
        newMediaCount: newMediaFiles.length,
        newMediaNames: newMediaFiles.map(f => f.name)
      });

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', validated.title);
      formDataToSend.append('description', validated.description);

      if (formData.location) {
        formDataToSend.append('location', JSON.stringify(formData.location));
      }

      // Append existing media that should be kept
      if (existingMedia.length > 0) {
        formDataToSend.append('existingMedia', JSON.stringify(existingMedia));
      }

      // Append new media files with proper field names
      newMediaFiles.forEach((file) => {
        if (file.type.startsWith('image/')) {
          formDataToSend.append('images', file);
        } else if (file.type.startsWith('video/')) {
          formDataToSend.append('videos', file);
        } else if (file.type.startsWith('audio/')) {
          formDataToSend.append('audios', file);
        }
      });

      // DEBUG: Check what we're sending
      console.log('=== FRONTEND DEBUG ===');
      console.log('FormData entries:');
      for (const [key, value] of formDataToSend.entries()) {
        console.log(key, value instanceof File ? `File: ${value.name}` : value);
      }
      console.log('Is FormData?', formDataToSend instanceof FormData);
      console.log('=== END DEBUG ===');

      // Send the update with FormData
      const updatedReport = await updateReportService(id, formDataToSend);

      if (updatedReport) {
        toast({
          title: "Report updated",
          description: "Your changes have been saved successfully",
        });
        navigate('/dashboard');
      }
    } catch (error: unknown) {
      console.error('Error updating report:', error);
      let message = "Please check your input and try again";
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner fullScreen text="Loading report..." />;
  }

  if (error) {
    return (
      <div className="page-root">
        <header className="site-header">
          <div className="container header-inner">
            <div className="brand">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="brand-title">iReporter</h1>
            </div>
          </div>
        </header>
        <main className="container page-content">
          <ErrorMessage
            title="Error loading report"
            message={error}
            onRetry={() => window.location.reload()}
          />
          <Link to="/dashboard" className="btn btn-outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  if (!user || !report) return null;

  const totalMedia = existingMedia.length + newMediaFiles.length;

  return (
    <ErrorBoundary>
      <div className="page-root">
        <header className="site-header">
          <div className="container header-inner">
            <div className="brand">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="brand-title">iReporter</h1>
            </div>
          </div>
        </header>

        <main className="container page-content">
          <div className="form-container">
            <Link to="/dashboard" className="back-link">
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="page-header">
              <h2 className="page-title">Edit Report</h2>
              <p className="page-subtext">Update your report details or location</p>
            </div>

            <form onSubmit={handleSubmit} className="report-form" encType="multipart/form-data">
              {/* Title Input */}
              <div className="form-section">
                <label htmlFor="title" className="form-label">Title </label>
                <input
                  id="title"
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the issue"
                  required
                  minLength={10}
                />
              </div>

              {/* Description Textarea */}
              <div className="form-section">
                <label htmlFor="description" className="form-label">Description </label>
                <textarea
                  id="description"
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed information"
                  rows={6}
                  required
                  minLength={20}
                />
              </div>

              {/* Location Picker */}
              <div className="form-section">
                <label className="form-label form-label-icon">
                  <MapPin className="h-4 w-4" />
                  <span>Location (Optional)</span>
                </label>
                <button
                  type="button"
                  className="btn btn-outline btn-full"
                  onClick={() => setShowMap(!showMap)}
                >
                  {showMap ? 'Hide Map' : 'Pick Location on Map'}
                </button>
                {showMap && (
                  <div style={{ marginTop: 'var(--spacing-3)' }}>
                    <LocationPicker
                      location={formData.location}
                      onLocationChange={(location) => setFormData({ ...formData, location })}
                    />
                  </div>
                )}
                {formData.location && (
                  <p className="form-hint">
                    Selected: {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                  </p>
                )}
              </div>

              {/* Media Upload */}
              <div className="form-section">
                <label className="form-label">
                  Media (Optional, max {FILE_CONSTRAINTS.MAX_MEDIA_FILES}, audios, videos and images)
                  <span className="form-hint">
                    {totalMedia}/{FILE_CONSTRAINTS.MAX_MEDIA_FILES} Media selected
                  </span>
                </label>

                {/* Existing Media */}
                {existingMedia.length > 0 && (
                  <div className="existing-media-section">
                    <p className="form-hint">Existing Media:</p>
                    <div className="media-grid">
                      {existingMedia.map((media, index) => {
                        const mediaType = getMediaType(media);
                        return (
                          <div key={`existing-${index}`} className="media-preview">
                            {mediaType === 'image' && (
                              <img src={getMediaUrl(media)} alt={`Existing ${index + 1}`} />
                            )}
                            {mediaType === 'video' && (
                              <video controls>
                                <source src={getMediaUrl(media)} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            )}
                            {mediaType === 'audio' && (
                              <div className="audio-preview">
                                <audio controls>
                                  <source src={getMediaUrl(media)} type="audio/mpeg" />
                                  Your browser does not support the audio tag.
                                </audio>
                                <span>Audio File</span>
                              </div>
                            )}
                            <button
                              type="button"
                              className="media-remove-btn"
                              onClick={() => removeExistingMedia(index)}
                              aria-label="Remove existing media"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <div className="media-info">
                              Existing {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* New Media Upload */}
                <div className="media-upload-container">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={totalMedia >= FILE_CONSTRAINTS.MAX_MEDIA_FILES}
                  >
                    <Upload className="h-4 w-4" style={{ marginRight: 'var(--spacing-2)' }} />
                    {totalMedia >= FILE_CONSTRAINTS.MAX_MEDIA_FILES ? 'Maximum reached' : 'Add More Media'}
                  </button>

                  {/* New Media Previews */}
                  {newMediaPreviews.length > 0 && (
                    <div className="new-media-section">
                      <p className="form-hint">New media to add:</p>
                      <div className="media-grid">
                        {newMediaPreviews.map((preview, index) => {
                          const file = newMediaFiles[index];
                          const isImage = file?.type?.startsWith('image/');
                          const isVideo = file?.type?.startsWith('video/');
                          const isAudio = file?.type?.startsWith('audio/');

                          return (
                            <div key={`new-${index}`} className="media-preview">
                              {isImage && (
                                <img src={preview} alt={`New ${index + 1}`} />
                              )}
                              {isVideo && (
                                <video controls>
                                  <source src={preview} type={file.type} />
                                  Your browser does not support the video tag.
                                </video>
                              )}
                              {isAudio && (
                                <div className="audio-preview">
                                  <audio controls>
                                    <source src={preview} type={file.type} />
                                    Your browser does not support the audio tag.
                                  </audio>
                                  <span>Audio File</span>
                                </div>
                              )}
                              <button
                                type="button"
                                className="media-remove-btn"
                                onClick={() => removeNewMedia(index)}
                                aria-label="Remove new media"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <div className="media-info">
                                {file?.name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={reportLoading}
                >
                  {reportLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <Link to="/dashboard" className="btn btn-outline">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default EditReport;
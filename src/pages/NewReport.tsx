import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, FileCheck, ArrowLeft, MapPin, Upload, X } from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";
import { reportSchema } from "@/types";
import { FILE_CONSTRAINTS, VALIDATION_MESSAGES } from "@/utils/constants";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const NewReport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { createReport, loading: submitting } = useReports();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'red-flag' as 'red-flag' | 'intervention',
    location: null as { lat: number; lng: number } | null,
  });
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [allMediaFiles, setAllMediaFiles] = useState<File[]>([]);
  const [showMap, setShowMap] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate, authLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > FILE_CONSTRAINTS.MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: VALIDATION_MESSAGES.FILE_TOO_LARGE,
          variant: "destructive",
        });
        return;
      }

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

      setAllMediaFiles((prev) => [...prev, file]);

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setMediaFiles((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setAllMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (allMediaFiles.length > FILE_CONSTRAINTS.MAX_MEDIA_FILES) {
      toast({
        title: "Too many files",
        description: VALIDATION_MESSAGES.TOO_MANY_MEDIA_FILES,
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a report",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    try {
      const validated = reportSchema.parse({
        title: formData.title,
        description: formData.description,
        type: formData.type,
      });

      const fd = new FormData();
      fd.append('title', validated.title);
      fd.append('description', validated.description);
      fd.append('type', validated.type);
      if (formData.location) {
        fd.append('location', JSON.stringify(formData.location));
      }
      // Append all media files to the 'images' field (backend handles all media types)
      allMediaFiles.forEach((file) => {
        fd.append('images', file);
      });

      const report = await createReport(fd);

      if (report) {
        navigate('/dashboard');
      }
    } catch (error: unknown) {
      let message = "Please check your input";
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        title: "Validation error",
        description: message,
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!user) return null;

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
          <div className="form-container unique-form">
            <Link to="/dashboard" className="back-link">
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="page-header form-hero">
              <Shield className="form-hero-icon" />
              <h2 className="page-title">Create New Report</h2>
              <p className="page-subtext">Help build a transparent society. Your report makes a difference.</p>
            </div>

            <form onSubmit={handleSubmit} className="report-form">
              {/* Report Type Selection */}
              <div className="form-section">
                <label className="form-label">Report Type </label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="type"
                      value="red-flag"
                      checked={formData.type === 'red-flag'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'red-flag' | 'intervention' })}
                    />
                    <div className="radio-option-content">
                      <div className="radio-option-icon">
                        <AlertTriangle className="h-5 w-5" style={{ color: 'hsl(var(--destructive))' }} />
                      </div>
                      <div className="radio-option-text">
                        <div className="radio-option-title">Red-Flag</div>
                        <div className="radio-option-desc">Report corruption incidents</div>
                      </div>
                    </div>
                  </label>

                  <label className="radio-option">
                    <input
                      type="radio"
                      name="type"
                      value="intervention"
                      checked={formData.type === 'intervention'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'red-flag' | 'intervention' })}
                    />
                    <div className="radio-option-content">
                      <div className="radio-option-icon">
                        <FileCheck className="h-5 w-5" style={{ color: 'hsl(var(--secondary))' }} />
                      </div>
                      <div className="radio-option-text">
                        <div className="radio-option-title">Intervention</div>
                        <div className="radio-option-desc">Request government action</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Title Input */}
              <div className="form-section">
                <label htmlFor="title" className="form-label">Title </label>
                <input
                  id="title"
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the issue (min 10 characters)"
                  required
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
                  placeholder="Provide detailed information about the incident or intervention needed (min 20 characters)"
                  rows={6}
                  required
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
                <label className="form-label">Media (Optional, max 4, videos, audios and images)</label>
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
                    disabled={mediaFiles.length >= 4}
                  >
                    <Upload className="h-4 w-4" style={{ marginRight: 'var(--spacing-2)' }} />
                    Upload Media
                  </button>

                  {mediaFiles.length > 0 && (
                    <div className="media-grid">
                      {mediaFiles.map((preview, index) => {
                        const file = allMediaFiles[index];
                        const isImage = file?.type?.startsWith('image/');
                        const isVideo = file?.type?.startsWith('video/');
                        const isAudio = file?.type?.startsWith('audio/');

                        return (
                          <div key={index} className="media-preview">
                            {isImage && (
                              <img src={preview} alt={`Upload ${index + 1}`} />
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
                              className="image-remove-btn"
                              onClick={() => removeMedia(index)}
                              aria-label="Remove media"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Report'}
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

export default NewReport;
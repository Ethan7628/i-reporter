import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { useToast } from "@/hooks/use-toast";
import { reportSchema } from "@/types";
import { FILE_CONSTRAINTS, VALIDATION_MESSAGES } from "@/utils/constants";
import { Shield, AlertTriangle, FileCheck, ArrowLeft, MapPin, Upload, X } from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";

const NewReport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { createReport, updateReport } = useReports();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'red-flag' as 'red-flag' | 'intervention',
    location: null as { lat: number; lng: number } | null,
  });
  const [images, setImages] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > FILE_CONSTRAINTS.MAX_IMAGE_SIZE) {
        toast({
          title: "File too large",
          description: VALIDATION_MESSAGES.IMAGE_TOO_LARGE,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImages((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (images.length > FILE_CONSTRAINTS.MAX_IMAGES) {
      toast({
        title: "Too many images",
        description: VALIDATION_MESSAGES.TOO_MANY_IMAGES,
        variant: "destructive",
      });
      return;
    }

    try {
      const validated = reportSchema.parse(formData);
      const report = await createReport(validated, user.id);
      
      if (report && (formData.location || images.length > 0)) {
        await updateReport(report.id, {
          location: formData.location,
          images,
        });
      }
      
      navigate('/dashboard');
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
    return (
      <div className="page-root">
        <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

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
              <label className="form-label">Report Type *</label>
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
              <label htmlFor="title" className="form-label">Title *</label>
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
              <label htmlFor="description" className="form-label">Description *</label>
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

            {/* Image Upload */}
            <div className="form-section">
              <label className="form-label">Images (Optional, max 4)</label>
              <div className="image-upload-container">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn btn-outline btn-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={images.length >= 4}
                >
                  <Upload className="h-4 w-4" style={{ marginRight: 'var(--spacing-2)' }} />
                  Upload Images
                </button>
                
                {images.length > 0 && (
                  <div className="image-grid">
                    {images.map((img, index) => (
                      <div key={index} className="image-preview">
                        <img src={img} alt={`Upload ${index + 1}`} />
                        <button
                          type="button"
                          className="image-remove-btn"
                          onClick={() => removeImage(index)}
                          aria-label="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Create Report
              </button>
              <Link to="/dashboard" className="btn btn-outline">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default NewReport;

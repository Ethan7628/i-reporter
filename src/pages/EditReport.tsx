import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { mockAuth } from "@/lib/mock-auth";
import { mockReports, reportSchema } from "@/lib/mock-reports";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft, MapPin, Upload, X } from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";

const EditReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(mockAuth.getCurrentUser());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: null as { lat: number; lng: number } | null,
  });
  const [images, setImages] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!id) {
      navigate('/dashboard');
      return;
    }

    const report = mockReports.getById(id);
    if (!report) {
      toast({
        title: "Report not found",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }

    if (report.userId !== user.id) {
      toast({
        title: "Access denied",
        description: "You can only edit your own reports",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }

    if (['under-investigation', 'rejected', 'resolved'].includes(report.status)) {
      toast({
        title: "Cannot edit",
        description: "This report cannot be edited",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }

    setFormData({
      title: report.title,
      description: report.description,
      location: report.location,
    });
    setImages(report.images || []);
  }, [user, id, navigate, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Images must be less than 5MB",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length > 4) {
      toast({
        title: "Too many images",
        description: "Maximum 4 images allowed",
        variant: "destructive",
      });
      return;
    }

    try {
      const validated = reportSchema.parse({
        title: formData.title,
        description: formData.description,
        type: mockReports.getById(id!)?.type,
      });

      mockReports.update(id!, {
        title: validated.title,
        description: validated.description,
        location: formData.location,
        images,
      });

      toast({
        title: "Report updated!",
        description: "Your changes have been saved.",
      });

      navigate('/dashboard');
    } catch (error: unknown) {
      let message = "Please check your input";
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

  if (!user) return null;

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
        <div className="form-container">
          <Link to="/dashboard" className="back-link">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="page-header">
            <h2 className="page-title">Edit Report</h2>
            <p className="page-subtext">Update your report details or location</p>
          </div>

          <form onSubmit={handleSubmit} className="report-form">
            {/* Title Input */}
            <div className="form-section">
              <label htmlFor="title" className="form-label">Title *</label>
              <input
                id="title"
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of the issue"
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
                placeholder="Provide detailed information"
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
                Save Changes
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

export default EditReport;

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
<<<<<<< HEAD
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { useToast } from "@/hooks/use-toast";
import { reportSchema, Report } from "@/types";
import { FILE_CONSTRAINTS, VALIDATION_MESSAGES } from "@/utils/constants";
=======
import { mockAuth } from "@/lib/mock-auth";
import { mockReports, reportSchema } from "@/lib/mock-reports";
import { useToast } from "@/hooks/use-toast";
>>>>>>> ivan
import { Shield, ArrowLeft, MapPin, Upload, X } from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";

const EditReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
<<<<<<< HEAD
  const { user, requireAuth } = useAuth();
  const { getReport, updateReport: updateReportService } = useReports();
=======
  const [user, setUser] = useState(mockAuth.getCurrentUser());
>>>>>>> ivan
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: null as { lat: number; lng: number } | null,
  });
  const [images, setImages] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
<<<<<<< HEAD
  const [report, setReport] = useState<Report | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!requireAuth() || !id) {
=======
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!id) {
>>>>>>> ivan
      navigate('/dashboard');
      return;
    }

<<<<<<< HEAD
    const loadReport = async () => {
      const fetchedReport = await getReport(id);
      
      if (!fetchedReport) {
        navigate('/dashboard');
        return;
      }

      if (fetchedReport.userId !== user!.id) {
        navigate('/dashboard');
        return;
      }

      if (['under-investigation', 'rejected', 'resolved'].includes(fetchedReport.status)) {
        navigate('/dashboard');
        return;
      }

      setReport(fetchedReport);
      setFormData({
        title: fetchedReport.title,
        description: fetchedReport.description,
        location: fetchedReport.location,
      });
      setImages(fetchedReport.images || []);
    };

    loadReport();
  }, [id]);
=======
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
>>>>>>> ivan

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
<<<<<<< HEAD
      if (file.size > FILE_CONSTRAINTS.MAX_IMAGE_SIZE) {
        toast({
          title: "File too large",
          description: VALIDATION_MESSAGES.IMAGE_TOO_LARGE,
=======
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Images must be less than 5MB",
>>>>>>> ivan
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

<<<<<<< HEAD
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !report) return;

    if (images.length > FILE_CONSTRAINTS.MAX_IMAGES) {
      toast({
        title: "Too many images",
        description: VALIDATION_MESSAGES.TOO_MANY_IMAGES,
=======
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length > 4) {
      toast({
        title: "Too many images",
        description: "Maximum 4 images allowed",
>>>>>>> ivan
        variant: "destructive",
      });
      return;
    }

    try {
      const validated = reportSchema.parse({
        title: formData.title,
        description: formData.description,
<<<<<<< HEAD
        type: report.type,
      });

      await updateReportService(id, {
=======
        type: mockReports.getById(id!)?.type,
      });

      mockReports.update(id!, {
>>>>>>> ivan
        title: validated.title,
        description: validated.description,
        location: formData.location,
        images,
      });

<<<<<<< HEAD
=======
      toast({
        title: "Report updated!",
        description: "Your changes have been saved.",
      });

>>>>>>> ivan
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

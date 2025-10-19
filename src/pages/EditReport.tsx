import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { mockAuth } from "@/lib/mock-auth";
import { mockReports, reportSchema } from "@/lib/mock-reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft, MapPin, Upload, X, Image as ImageIcon, Check } from "lucide-react";
import { Link } from "react-router-dom";
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
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    if (field === 'title') {
      if (!value) {
        newErrors.title = 'Title is required';
      } else if (value.length < 10) {
        newErrors.title = 'Title must be at least 10 characters';
      } else {
        delete newErrors.title;
      }
    }

    if (field === 'description') {
      if (!value) {
        newErrors.description = 'Description is required';
      } else if (value.length < 20) {
        newErrors.description = 'Description must be at least 20 characters';
      } else {
        delete newErrors.description;
      }
    }

    setErrors(newErrors);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 5MB limit`,
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImages((prev) => {
          if (prev.length >= 4) {
            toast({
              title: "Maximum images reached",
              description: "You can only upload up to 4 images",
              variant: "destructive",
            });
            return prev;
          }
          return [...prev, base64];
        });
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

    validateField('title', formData.title);
    validateField('description', formData.description);

    if (formData.title.length < 10 || formData.description.length < 20) {
      toast({
        title: "Validation error",
        description: "Please fill all required fields correctly",
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
        title: "Report updated successfully!",
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

  const isFormValid = formData.title.length >= 10 && formData.description.length >= 20;

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
        </div>
      </header>

      <main className="container py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold md:text-4xl">Edit Report</h1>
            <p className="text-muted-foreground">
              Update your report details or add additional information
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
              <CardDescription>
                Fields marked with <span className="text-destructive">*</span> are required.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      validateField('title', e.target.value);
                    }}
                    onBlur={(e) => validateField('title', e.target.value)}
                    placeholder="Brief, descriptive title for your report"
                    className={errors.title ? 'border-destructive focus-visible:ring-destructive' : ''}
                    aria-invalid={!!errors.title}
                    aria-describedby={errors.title ? 'title-error' : 'title-hint'}
                  />
                  {errors.title ? (
                    <p id="title-error" className="text-sm text-destructive">{errors.title}</p>
                  ) : (
                    <p id="title-hint" className="text-sm text-muted-foreground">
                      {formData.title.length}/10 characters minimum
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      validateField('description', e.target.value);
                    }}
                    onBlur={(e) => validateField('description', e.target.value)}
                    placeholder="Provide detailed information"
                    rows={6}
                    className={errors.description ? 'border-destructive focus-visible:ring-destructive resize-none' : 'resize-none'}
                    aria-invalid={!!errors.description}
                    aria-describedby={errors.description ? 'description-error' : 'description-hint'}
                  />
                  {errors.description ? (
                    <p id="description-error" className="text-sm text-destructive">{errors.description}</p>
                  ) : (
                    <p id="description-hint" className="text-sm text-muted-foreground">
                      {formData.description.length}/20 characters minimum
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <Label className="text-base font-semibold">Location (Optional)</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add or update the location of the incident
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMap(!showMap)}
                    className="w-full"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {showMap ? 'Hide Map' : 'Pick Location on Map'}
                  </Button>
                  {showMap && (
                    <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-1">
                      <LocationPicker
                        location={formData.location}
                        onLocationChange={(location) => setFormData({ ...formData, location })}
                      />
                    </div>
                  )}
                  {formData.location && (
                    <div className="flex items-center gap-2 rounded-lg border bg-success/5 p-3 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-success">
                        Location set: {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    <Label className="text-base font-semibold">Images (Optional, max 4)</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Update or add supporting images. Each file must be under 5MB.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    aria-label="Upload images"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                    disabled={images.length >= 4}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {images.length >= 4 ? 'Maximum Images Reached' : 'Upload Images'}
                  </Button>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {images.map((img, index) => (
                        <div key={index} className="group relative aspect-video overflow-hidden rounded-lg border-2 border-muted">
                          <img
                            src={img}
                            alt={`Upload ${index + 1}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => removeImage(index)}
                            aria-label={`Remove image ${index + 1}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
                  <Button
                    type="submit"
                    className="flex-1 touch-target"
                    size="lg"
                    disabled={!isFormValid}
                  >
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" size="lg" asChild className="touch-target">
                    <Link to="/dashboard">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EditReport;

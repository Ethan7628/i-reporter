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
import { Shield, ArrowLeft, MapPin, Upload, X } from "lucide-react";
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
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Please check your input",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">iReporter</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Report</CardTitle>
            <CardDescription>
              Update your report details or location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed information"
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location (Optional)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMap(!showMap)}
                  className="w-full"
                >
                  {showMap ? 'Hide Map' : 'Pick Location on Map'}
                </Button>
                {showMap && (
                  <LocationPicker
                    location={formData.location}
                    onLocationChange={(location) => setFormData({ ...formData, location })}
                  />
                )}
                {formData.location && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label>Images (Optional, max 4)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={images.length >= 4}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Images
                </Button>
                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1">
                  Save Changes
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/dashboard">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EditReport;

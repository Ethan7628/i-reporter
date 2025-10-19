import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { mockAuth } from "@/lib/mock-auth";
import { mockReports, reportSchema } from "@/lib/mock-reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, FileCheck, ArrowLeft, MapPin, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";
import { LocationPicker } from "@/components/LocationPicker";

const NewReport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(mockAuth.getCurrentUser());
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
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

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
      const validated = reportSchema.parse(formData);
      const report = mockReports.create(validated, user!.id);
      
      if (formData.location || images.length > 0) {
        mockReports.update(report.id, {
          location: formData.location,
          images,
        });
      }
      
      toast({
        title: "Report created!",
        description: "Your report has been submitted successfully.",
      });
      
      navigate('/dashboard');
    } catch (error: unknown) {
      let message = "Please check your input";
      type ValidationError = { errors: { message?: string }[] };
      if (
        error &&
        typeof error === "object" &&
        "errors" in error &&
        Array.isArray((error as ValidationError).errors)
      ) {
        message = (error as ValidationError).errors?.[0]?.message || message;
      }
      toast({
        title: "Validation error",
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

      <main className="container page-content max-width-md">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/dashboard"><ArrowLeft className="icon-left" />Back to Dashboard</Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Report</CardTitle>
            <CardDescription>
              Report corruption or request government intervention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label>Report Type</Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={(value) => 
                    setFormData({ ...formData, type: value as 'red-flag' | 'intervention' })
                  }
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="red-flag" id="red-flag" />
                    <Label htmlFor="red-flag" className="flex items-center gap-2 cursor-pointer flex-1">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <div>
                        <div className="font-semibold">Red-Flag</div>
                        <div className="text-sm text-muted-foreground">
                          Report corruption incidents
                        </div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="intervention" id="intervention" />
                    <Label htmlFor="intervention" className="flex items-center gap-2 cursor-pointer flex-1">
                      <FileCheck className="h-5 w-5 text-secondary" />
                      <div>
                        <div className="font-semibold">Intervention</div>
                        <div className="text-sm text-muted-foreground">
                          Request government action
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the issue (min 10 characters)"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed information about the incident or intervention needed (min 20 characters)"
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
                  Create Report
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

export default NewReport;

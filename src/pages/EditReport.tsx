import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { mockAuth } from "@/lib/mock-auth";
import { mockReports, reportSchema } from "@/lib/mock-reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

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
  const [locationInput, setLocationInput] = useState({ lat: '', lng: '' });

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

    if (report.location) {
      setLocationInput({
        lat: report.location.lat.toString(),
        lng: report.location.lng.toString(),
      });
    }
  }, [user, id, navigate, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = reportSchema.parse({
        title: formData.title,
        description: formData.description,
        type: mockReports.getById(id!)?.type,
      });

      let location = formData.location;
      if (locationInput.lat && locationInput.lng) {
        const lat = parseFloat(locationInput.lat);
        const lng = parseFloat(locationInput.lng);
        
        if (isNaN(lat) || isNaN(lng)) {
          toast({
            title: "Invalid location",
            description: "Please enter valid coordinates",
            variant: "destructive",
          });
          return;
        }

        location = { lat, lng };
      }

      mockReports.update(id!, {
        title: validated.title,
        description: validated.description,
        location,
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lat" className="text-sm text-muted-foreground">
                      Latitude
                    </Label>
                    <Input
                      id="lat"
                      type="number"
                      step="any"
                      value={locationInput.lat}
                      onChange={(e) => setLocationInput({ ...locationInput, lat: e.target.value })}
                      placeholder="e.g., -1.2921"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lng" className="text-sm text-muted-foreground">
                      Longitude
                    </Label>
                    <Input
                      id="lng"
                      type="number"
                      step="any"
                      value={locationInput.lng}
                      onChange={(e) => setLocationInput({ ...locationInput, lng: e.target.value })}
                      placeholder="e.g., 36.8219"
                    />
                  </div>
                </div>
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

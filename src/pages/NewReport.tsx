import { useState, useEffect } from "react";
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
import { Shield, AlertTriangle, FileCheck, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const NewReport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(mockAuth.getCurrentUser());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'red-flag' as 'red-flag' | 'intervention',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = reportSchema.parse(formData);
      const report = mockReports.create(validated, user!.id);
      
      toast({
        title: "Report created!",
        description: "Your report has been submitted successfully.",
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Validation error",
        description: error.errors?.[0]?.message || "Please check your input",
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

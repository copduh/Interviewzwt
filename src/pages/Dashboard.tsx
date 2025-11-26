import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, Plus, Briefcase, Code, Server, Rocket, Settings, Palette } from "lucide-react";

interface Profile {
  credits: number;
  full_name: string;
  email: string;
}

interface JobRole {
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  icon: string;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    fetchJobRoles();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  const fetchJobRoles = async () => {
    const { data, error } = await supabase
      .from("job_roles")
      .select("*")
      .order("category");

    if (error) {
      console.error("Error fetching job roles:", error);
    } else {
      setJobRoles(data || []);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const startInterview = (jobRoleId: string) => {
    if (profile && profile.credits <= 0) {
      toast({
        title: "No credits remaining",
        description: "Please purchase more credits to continue.",
        variant: "destructive",
      });
      return;
    }
    navigate(`/interview/${jobRoleId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getIconComponent = (icon: string) => {
    const icons: { [key: string]: any } = {
      '💻': Code,
      '⚙️': Settings,
      '🚀': Rocket,
      '🔧': Server,
      '📊': Briefcase,
      '🎨': Palette,
    };
    const IconComponent = icons[icon] || Briefcase;
    return <IconComponent className="h-6 w-6" />;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              InterviewPrep AI
            </h1>
            <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name}!</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">Credits Remaining</p>
              <Badge variant="outline" className="text-lg font-bold">
                {profile?.credits || 0}
              </Badge>
            </div>
            <Button onClick={handleLogout} variant="outline" size="icon">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Choose Your Interview</h2>
            <p className="text-muted-foreground">Select a job role to start practicing</p>
          </div>
          <Button
            onClick={() => navigate("/custom-job")}
            className="bg-gradient-accent hover:opacity-90 transition-smooth"
          >
            <Plus className="mr-2 h-4 w-4" />
            Custom Job Description
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobRoles.map((role) => (
            <Card
              key={role.id}
              className="hover:shadow-primary transition-smooth cursor-pointer group"
              onClick={() => startInterview(role.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-smooth">
                    {getIconComponent(role.icon)}
                  </div>
                  <Badge variant="secondary">{role.category}</Badge>
                </div>
                <CardTitle className="mt-4">{role.title}</CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {role.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {role.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{role.skills.length - 3} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <CardTitle>Need More Credits?</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Get more interview sessions to continue practicing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="secondary"
              onClick={() => navigate("/pricing")}
              className="font-semibold"
            >
              View Pricing
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;

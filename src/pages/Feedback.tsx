import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, TrendingUp, Home, FileText } from "lucide-react";

interface InterviewSession {
  resume_score: number;
  resume_feedback: string;
  interview_score: number;
  interview_feedback: string;
  job_roles: {
    title: string;
  };
}

const Feedback = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("interview_sessions")
        .select(`
          *,
          job_roles (
            title
          )
        `)
        .eq("id", sessionId)
        .single();

      if (error) throw error;
      setSession(data);
    } catch (error: any) {
      console.error("Error fetching session:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Session Not Found</CardTitle>
            <CardDescription>The interview session could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overallScore = Math.round((session.resume_score + session.interview_score) / 2);
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-accent";
    if (score >= 60) return "text-primary";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            InterviewPrep AI
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <Home className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <Card className="mb-6 bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl">Interview Complete!</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  {session.job_roles.title}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-foreground/80 mb-1">Overall Score</p>
                <p className={`text-5xl font-bold`}>
                  {overallScore}%
                </p>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="text-lg py-2 px-4">
                  {overallScore >= 80 ? "Excellent" : overallScore >= 60 ? "Good" : "Needs Improvement"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>Resume Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Match Score</span>
                  <span className={`text-2xl font-bold ${getScoreColor(session.resume_score)}`}>
                    {session.resume_score}%
                  </span>
                </div>
                <Progress value={session.resume_score} className="h-2" />
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-sm">Feedback</h4>
                <p className="text-sm text-muted-foreground">{session.resume_feedback}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Interview Performance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Interview Score</span>
                  <span className={`text-2xl font-bold ${getScoreColor(session.interview_score)}`}>
                    {session.interview_score}%
                  </span>
                </div>
                <Progress value={session.interview_score} className="h-2" />
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-sm">Feedback</h4>
                <p className="text-sm text-muted-foreground">{session.interview_feedback}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>Continue improving your interview skills</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-gradient-primary hover:opacity-90"
              >
                Practice Another Role
              </Button>
              <Button
                onClick={() => navigate("/pricing")}
                variant="outline"
              >
                Get More Credits
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Feedback;

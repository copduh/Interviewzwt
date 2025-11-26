import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient, { getToken } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, ArrowRight, CheckCircle2 } from "lucide-react";
import { extractTextFromPDF } from "@/utils/pdfExtractor";

interface JobRole {
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
}

const Interview = () => {
  const { jobRoleId } = useParams();
  const [jobRole, setJobRole] = useState<JobRole | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "analyzing" | "ready" | "error">("upload");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    score: number;
    feedback: string;
  } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchJobRole();
  }, [jobRoleId]);

  const checkAuth = async () => {
    try {
      await apiClient.me();
    } catch (error) {
      navigate('/auth');
    }
  };

  const fetchJobRole = async () => {
    try {
      const { jobRole } = await apiClient.fetchJobRole(jobRoleId as string);
      setJobRole(jobRole);
    } catch (error: any) {
      console.error('Error fetching job role:', error.message || error);
      toast({ title: 'Error', description: 'Failed to load job role', variant: 'destructive' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "application/pdf" || file.type === "application/msword")) {
      setResumeFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or DOC file",
        variant: "destructive",
      });
    }
  };

  const analyzeResume = async () => {
    if (!resumeFile) return;
    setStep('analyzing');
    try {
      // ensure user is authenticated
      await apiClient.me();

      // create interview session
      const { session } = await apiClient.createSession(jobRoleId as string);
      setSessionId(session.id);

      // upload resume to server
      const token = getToken();
      const formData = new FormData();
      formData.append('file', resumeFile as File);
      formData.append('sessionId', session.id);
      const uploadResp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/upload`, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!uploadResp.ok) throw new Error('Upload failed');
      const { filePath } = await uploadResp.json();

      // Extract text from PDF or file
      let fileText = '';
      if ((resumeFile as File).type === 'application/pdf') {
        fileText = await extractTextFromPDF(resumeFile as File);
      } else {
        fileText = await resumeFile.text();
      }

      // analyze using server function
      const { score, feedback } = await apiClient.analyzeResume({ resumeText: fileText, jobDescription: jobRole?.description || '', jobTitle: jobRole?.title || '' });

      // update session
      await apiClient.updateSession(session.id, { resume_score: score, resume_feedback: feedback, status: 'resume_uploaded', resumePath: filePath });

      setAnalysisResult({ score, feedback });
      setStep('ready');
      toast({ title: 'Resume analyzed!', description: 'Your resume has been successfully analyzed.' });
    } catch (error: any) {
      console.error('Error analyzing resume:', error);
      setAnalysisError(error.message || 'Analysis failed');
      setStep('error');
      toast({ title: 'Error', description: 'Analysis failed, but you can still continue to the interview' });
    }
  };

  const startVoiceInterview = () => {
    if (sessionId) {
      navigate(`/voice-interview/${sessionId}`);
    }
  };

  if (!jobRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            ← Back to Dashboard
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{jobRole.title}</CardTitle>
            <CardDescription>{jobRole.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Key Requirements</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {jobRole.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {jobRole.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {step === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Resume</CardTitle>
              <CardDescription>
                Upload your resume to get personalized feedback and match scoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload">
                  <Button variant="outline" asChild>
                    <span>
                      <FileText className="mr-2 h-4 w-4" />
                      Choose File
                    </span>
                  </Button>
                </label>
                {resumeFile && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selected: {resumeFile.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Button
                  onClick={analyzeResume}
                  disabled={!resumeFile}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  Analyze Resume
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const { session } = await apiClient.createSession(jobRoleId as string);
                      setSessionId(session.id);
                      navigate(`/voice-interview/${session.id}`);
                    } catch (error) {
                      toast({ title: 'Error', description: 'Could not create session', variant: 'destructive' });
                    }
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Skip Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "analyzing" && (
          <Card>
            <CardHeader>
              <CardTitle>Analyzing Your Resume</CardTitle>
              <CardDescription>
                Please wait while we analyze your resume against the job requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <Progress value={66} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                This usually takes 10-15 seconds...
              </p>
            </CardContent>
          </Card>
        )}

        {step === "error" && (
          <div className="space-y-6">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle>Analysis Unsuccessful</CardTitle>
                <CardDescription>
                  We couldn't analyze your resume, but you can still continue with the interview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-muted-foreground">{analysisError}</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep("upload")}
                    variant="outline"
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={startVoiceInterview}
                    className="flex-1 bg-gradient-primary hover:opacity-90"
                  >
                    Continue to Interview
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "ready" && analysisResult && (
          <div className="space-y-6">
            <Card className="border-accent">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-accent" />
                  <CardTitle>Resume Analysis Complete</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Match Score</span>
                    <span className="text-2xl font-bold text-accent">
                      {analysisResult.score}%
                    </span>
                  </div>
                  <Progress value={analysisResult.score} className="h-2" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Feedback</h3>
                  <p className="text-sm text-muted-foreground">{analysisResult.feedback}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-primary text-primary-foreground">
              <CardHeader>
                <CardTitle>Ready to Start Your Interview?</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Begin your AI-powered voice interview now
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={startVoiceInterview}
                  variant="secondary"
                  size="lg"
                  className="w-full font-semibold"
                >
                  Start Voice Interview
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Interview;

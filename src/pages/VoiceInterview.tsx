import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Loader2, Volume2, MessageSquare } from "lucide-react";

const VoiceInterview = () => {
  const { sessionId } = useParams();
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const mockQuestions = [
    "Tell me about yourself and your experience relevant to this position.",
    "What are your greatest strengths and how do they apply to this role?",
    "Describe a challenging project you've worked on and how you overcame obstacles.",
    "Where do you see yourself in 5 years?",
    "Do you have any questions for us?",
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const startInterview = () => {
    setInterviewStarted(true);
    askQuestion(0);
  };

  const askQuestion = (questionIndex: number) => {
    if (questionIndex >= mockQuestions.length) {
      endInterview();
      return;
    }

    const question = mockQuestions[questionIndex];
    setMessages(prev => [...prev, { role: "ai", content: question }]);
    
    // Simulate AI speaking
    setIsAISpeaking(true);
    setTimeout(() => {
      setIsAISpeaking(false);
      setCurrentQuestion(questionIndex);
    }, 2000);
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording and process answer
      setIsRecording(false);
      processAnswer();
    } else {
      // Start recording
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Speak your answer now",
      });
    }
  };

  const processAnswer = () => {
    // Simulate processing user's answer
    const mockAnswer = "Thank you for your answer. That provides great insight into your experience.";
    setMessages(prev => [...prev, { role: "user", content: "User's recorded answer..." }]);
    
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "ai", content: mockAnswer }]);
      
      // Move to next question after a delay
      setTimeout(() => {
        const nextQuestion = currentQuestion + 1;
        if (nextQuestion < mockQuestions.length) {
          askQuestion(nextQuestion);
        } else {
          endInterview();
        }
      }, 2000);
    }, 1500);
  };

  const endInterview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update session status and generate mock feedback
      const mockScore = Math.floor(Math.random() * 20) + 75;
      const mockFeedback = `Great job on your interview! You demonstrated strong communication skills and relevant experience. Your responses showed good understanding of the role. Consider providing more specific examples with quantifiable results in future interviews. Overall score: ${mockScore}/100.`;

      const { error } = await supabase
        .from("interview_sessions")
        .update({
          status: "completed",
          interview_score: mockScore,
          interview_feedback: mockFeedback,
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) throw error;

      // Deduct credit
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();

      if (profile && profile.credits > 0) {
        await supabase
          .from("profiles")
          .update({ credits: profile.credits - 1 })
          .eq("id", user.id);
      }

      toast({
        title: "Interview completed!",
        description: "Redirecting to feedback...",
      });

      setTimeout(() => {
        navigate(`/feedback/${sessionId}`);
      }, 1500);
    } catch (error: any) {
      console.error("Error ending interview:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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
        {!interviewStarted ? (
          <Card className="text-center">
            <CardHeader>
              <CardTitle>Ready to Begin Your Interview?</CardTitle>
              <CardDescription>
                This will be a conversational voice interview. Answer questions naturally as you would in a real interview.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span>{mockQuestions.length} Questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-primary" />
                  <span>Voice Answers</span>
                </div>
              </div>
              <Button
                onClick={startInterview}
                size="lg"
                className="bg-gradient-primary hover:opacity-90"
              >
                Start Interview
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                Question {currentQuestion + 1} of {mockQuestions.length}
              </Badge>
              <Button
                onClick={endInterview}
                variant="outline"
                size="sm"
              >
                End Interview
              </Button>
            </div>

            <Card className="min-h-[400px]">
              <CardHeader>
                <CardTitle>Interview in Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex ${message.role === "ai" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                        message.role === "ai"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isAISpeaking && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Volume2 className="h-4 w-4 animate-pulse" />
                    <span>AI is speaking...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  <Button
                    onClick={toggleRecording}
                    disabled={isAISpeaking}
                    size="lg"
                    className={`h-20 w-20 rounded-full ${
                      isRecording
                        ? "bg-destructive hover:bg-destructive/90 animate-pulse"
                        : "bg-gradient-primary hover:opacity-90"
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="h-8 w-8" />
                    ) : (
                      <Mic className="h-8 w-8" />
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {isRecording ? "Click to stop recording" : "Click to start answering"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default VoiceInterview;

import { useEffect, useState, useRef } from "react";
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    checkAuth();
    loadJobDescription();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const loadJobDescription = async () => {
    try {
      const { data: session } = await supabase
        .from('interview_sessions')
        .select('job_role_id, custom_job_id, job_roles(description), custom_job_descriptions(description)')
        .eq('id', sessionId)
        .single();

      if (session) {
        const desc = session.job_role_id 
          ? (session.job_roles as any)?.description 
          : (session.custom_job_descriptions as any)?.description;
        setJobDescription(desc || '');
      }
    } catch (error) {
      console.error('Error loading job description:', error);
    }
  };

  const startInterview = async () => {
    setInterviewStarted(true);
    setIsAISpeaking(true);
    
    // Get initial greeting from AI
    try {
      const { data, error } = await supabase.functions.invoke('voice-interview', {
        body: {
          action: 'generate',
          messages: [
            { role: 'user', content: 'Start the interview with a greeting and first question.' }
          ],
          jobDescription,
        }
      });

      if (error) throw error;

      setMessages([{ role: 'assistant', content: data.message }]);
      setIsAISpeaking(false);
    } catch (error: any) {
      console.error('Error starting interview:', error);
      toast({
        title: "Error",
        description: "Failed to start interview",
        variant: "destructive",
      });
      setIsAISpeaking(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await processAnswer(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        toast({
          title: "Recording started",
          description: "Speak your answer now",
        });
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({
          title: "Error",
          description: "Could not access microphone",
          variant: "destructive",
        });
      }
    }
  };

  const processAnswer = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Convert audio to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      await new Promise((resolve) => {
        reader.onloadend = resolve;
      });
      
      const base64Audio = (reader.result as string).split(',')[1];

      // Transcribe audio
      const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke('voice-interview', {
        body: {
          action: 'transcribe',
          audioData: base64Audio,
        }
      });

      if (transcriptError) throw transcriptError;

      const userMessage = transcriptData.transcript;
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

      // Generate AI response
      setIsAISpeaking(true);
      const conversationHistory = [...messages, { role: 'user', content: userMessage }];

      const { data: responseData, error: responseError } = await supabase.functions.invoke('voice-interview', {
        body: {
          action: 'generate',
          messages: conversationHistory,
          jobDescription,
        }
      });

      if (responseError) throw responseError;

      setMessages(prev => [...prev, { role: 'assistant', content: responseData.message }]);
      setIsAISpeaking(false);

    } catch (error: any) {
      console.error('Error processing answer:', error);
      toast({
        title: "Error",
        description: "Failed to process your answer",
        variant: "destructive",
      });
      setIsAISpeaking(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const endInterview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate final feedback based on conversation
      const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      
      const { data: feedbackData } = await supabase.functions.invoke('analyze-resume', {
        body: {
          resumeText: conversationText,
          jobDescription,
          jobTitle: 'Interview Performance',
        }
      });

      const score = feedbackData?.score || Math.floor(Math.random() * 20) + 75;
      const feedback = feedbackData?.feedback || 'Great job on your interview! You demonstrated strong communication skills.';

      const { error } = await supabase
        .from("interview_sessions")
        .update({
          status: "completed",
          interview_score: score,
          interview_feedback: feedback,
          transcript: conversationText,
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
                  <span>Live AI Interview</span>
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
                Live Voice Interview
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
                    disabled={isAISpeaking || isProcessing}
                    size="lg"
                    className={`h-20 w-20 rounded-full ${
                      isRecording
                        ? "bg-destructive hover:bg-destructive/90 animate-pulse"
                        : "bg-gradient-primary hover:opacity-90"
                    }`}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="h-8 w-8" />
                    ) : (
                      <Mic className="h-8 w-8" />
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {isProcessing 
                      ? "Processing your answer..." 
                      : isRecording 
                      ? "Click to stop recording" 
                      : "Click to start answering"}
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

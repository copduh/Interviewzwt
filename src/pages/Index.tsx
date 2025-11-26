import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, FileText, TrendingUp, Zap, Users, Award } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Mic,
      title: "Voice Interviews",
      description: "Practice with AI-powered voice interviews that simulate real scenarios",
    },
    {
      icon: FileText,
      title: "Resume Analysis",
      description: "Get instant feedback on how well your resume matches job requirements",
    },
    {
      icon: TrendingUp,
      title: "Performance Tracking",
      description: "Track your progress and see improvement over time",
    },
    {
      icon: Zap,
      title: "Instant Feedback",
      description: "Receive detailed feedback immediately after each interview",
    },
  ];

  const stats = [
    { icon: Users, value: "10K+", label: "Active Users" },
    { icon: Award, value: "50K+", label: "Interviews Completed" },
    { icon: TrendingUp, value: "92%", label: "Success Rate" },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            InterviewPrep AI
          </h1>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button
              onClick={() => navigate("/auth")}
              className="bg-gradient-primary hover:opacity-90"
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="outline" className="text-sm px-4 py-2">
              🎉 Get 10 free interview sessions on signup
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold leading-tight">
              Master Your Next Interview with{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                AI-Powered Practice
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Practice real interview scenarios, get instant feedback on your resume and performance, and land your dream job with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="bg-gradient-primary hover:opacity-90 text-lg px-8"
              >
                Start Practicing Free
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Watch Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {stats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <Card key={stat.label} className="text-center">
                  <CardContent className="pt-6">
                    <div className="inline-flex p-3 rounded-lg bg-primary/10 text-primary mb-4">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="text-4xl font-bold mb-2">{stat.value}</div>
                    <div className="text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Everything You Need to Ace Your Interview
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our comprehensive platform provides all the tools you need to prepare effectively
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={feature.title} className="hover:shadow-lg transition-smooth">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary h-fit">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <Card className="max-w-4xl mx-auto bg-gradient-primary text-primary-foreground">
            <CardContent className="pt-12 pb-12 text-center">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Land Your Dream Job?
              </h3>
              <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                Join thousands of successful candidates who used InterviewPrep AI to prepare and succeed
              </p>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate("/auth")}
                className="text-lg px-8 font-semibold"
              >
                Get Started with 10 Free Credits
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 InterviewPrep AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Zap, TrendingUp, Star } from "lucide-react";

const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const pricingPlans = [
    {
      name: "Starter",
      price: 9,
      credits: 10,
      icon: Zap,
      popular: false,
      features: [
        "10 interview sessions",
        "Resume analysis",
        "Voice interviews",
        "Instant feedback",
        "Valid for 3 months",
      ],
    },
    {
      name: "Pro",
      price: 24,
      credits: 30,
      icon: TrendingUp,
      popular: true,
      features: [
        "30 interview sessions",
        "Resume analysis",
        "Voice interviews",
        "Instant feedback",
        "Priority support",
        "Valid for 6 months",
      ],
    },
    {
      name: "Premium",
      price: 49,
      credits: 100,
      icon: Star,
      popular: false,
      features: [
        "100 interview sessions",
        "Resume analysis",
        "Voice interviews",
        "Instant feedback",
        "Priority support",
        "Custom job descriptions",
        "Valid for 12 months",
      ],
    },
  ];

  const handlePurchase = (planName: string) => {
    toast({
      title: "Coming soon!",
      description: `${planName} plan purchase will be available soon. This is a demo version.`,
    });
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

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get more interview credits and continue improving your skills. All plans include full access to our AI-powered interview platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <Card
                key={plan.name}
                className={`relative ${
                  plan.popular
                    ? "border-primary shadow-primary"
                    : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="bg-gradient-primary text-primary-foreground px-6 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <div className="mx-auto p-3 rounded-lg bg-primary/10 text-primary w-fit mb-4">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                      <span className="text-muted-foreground ml-2">one-time</span>
                    </div>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-lg">
                        {plan.credits} Credits
                      </Badge>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handlePurchase(plan.name)}
                    className={`w-full ${
                      plan.popular
                        ? "bg-gradient-primary hover:opacity-90"
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Purchase {plan.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-12 max-w-4xl mx-auto bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-2xl">Enterprise Solutions</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Need interview prep for your entire team? We offer custom solutions for organizations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                toast({
                  title: "Contact us",
                  description: "Enterprise inquiries: enterprise@interviewprep.ai",
                });
              }}
            >
              Contact Sales
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Pricing;

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const PaymentsReturn = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditsAdded, setCreditsAdded] = useState<number | null>(null);

  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const token = qp.get('token') || qp.get('orderID') || qp.get('orderId');
    if (!token) {
      setError('No order token found in URL');
      setLoading(false);
      return;
    }

    const capture = async () => {
      try {
        setLoading(true);
        const resp = await apiClient.capturePayPalOrder(token);
        // resp may include user with updated credits
        if (resp.user && typeof resp.user.credits === 'number') {
          setCreditsAdded(resp.user.credits);
          toast({ title: 'Purchase successful', description: 'Your credits have been updated.' });
        } else if (resp.order) {
          // Try to parse credits from order purchase_units
          const pu = resp.order.purchase_units && resp.order.purchase_units[0];
          const credits = pu?.custom_id ? Number(pu.custom_id) : null;
          if (credits) setCreditsAdded(credits);
          toast({ title: 'Purchase captured', description: 'Thank you for your purchase.' });
        } else {
          toast({ title: 'Purchase captured', description: 'Thank you.' });
        }
        // Refresh profile state in app by dispatching auth-change
        window.dispatchEvent(new Event('auth-change'));
        setLoading(false);
        setTimeout(() => navigate('/dashboard'), 1500);
      } catch (err: any) {
        console.error('Capture error:', err);
        setError(err.message || 'Failed to capture order');
        toast({ title: 'Error', description: err.message || 'Failed to capture order', variant: 'destructive' });
        setLoading(false);
      }
    };

    capture();
  }, [location.search, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card>
        <CardHeader>
          <CardTitle>Processing Purchase</CardTitle>
          <CardDescription>Finalizing your payment and updating credits.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm">Finalizing your order — please wait...</p>
          ) : error ? (
            <div className="space-y-4">
              <p className="text-sm text-destructive">{error}</p>
              <div className="flex gap-2">
                <Button onClick={() => navigate('/pricing')}>Back to Pricing</Button>
                <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm">Purchase completed successfully.</p>
              {creditsAdded !== null && (
                <p className="text-sm">Credits updated: {creditsAdded}</p>
              )}
              <div className="flex gap-2">
                <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentsReturn;

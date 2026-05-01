import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2, Calendar, Loader2, ArrowRight, Crown, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { secureApiClient } from '@/lib/secureApiClient';

interface SubscriptionStatus {
  plan: 'FREE' | 'MONTHLY' | 'YEARLY';
  status: string;
  start_date: string | null;
  end_date: string | null;
  days_remaining: number | null;
  is_locked: boolean;
  prices: { FREE: number; MONTHLY: number; YEARLY: number };
}

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Free Trial',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const data = await secureApiClient.get<SubscriptionStatus>('/subscriptions/status/');
      setStatus(data);
    } catch {
      toast.error('Failed to load subscription info.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleUpgrade = async (plan: 'MONTHLY' | 'YEARLY') => {
    setUpgrading(plan);
    try {
      const data = await secureApiClient.post<{ message: string; subscription: SubscriptionStatus }>(
        '/subscriptions/upgrade/',
        { plan }
      );
      setStatus(data.subscription);
      toast.success(data.message || `Upgraded to ${PLAN_LABELS[plan]}!`);
    } catch (err: any) {
      toast.error(err.message || 'Upgrade failed. Please contact support.');
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isLocked = status?.is_locked;
  const currentPlan = status?.plan ?? 'FREE';
  const daysLeft = status?.days_remaining ?? 0;
  const endDate = status?.end_date;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Crown className="w-6 h-6 text-primary" />
          Subscription
        </h1>
        <p className="text-muted-foreground mt-1">Manage your school's subscription plan.</p>
      </div>

      {/* Current status card */}
      <div className={cn(
        'rounded-xl border-2 p-6',
        isLocked ? 'border-destructive bg-destructive/5' : 'border-primary bg-primary/5'
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Current Plan
            </p>
            <p className="text-2xl font-extrabold text-foreground">
              {PLAN_LABELS[currentPlan]}
            </p>
            {endDate && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Calendar className="w-3.5 h-3.5" />
                {isLocked ? 'Expired' : 'Renews'} on {endDate}
              </p>
            )}
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1">
            {isLocked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-semibold">
                <AlertTriangle className="w-4 h-4" />
                Locked
              </span>
            ) : currentPlan === 'FREE' ? (
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
                  <Calendar className="w-4 h-4" />
                  {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                </span>
                {daysLeft <= 3 && (
                  <p className="text-xs text-amber-600 mt-1">Trial ending soon!</p>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade options */}
      {(isLocked || currentPlan === 'FREE' || currentPlan === 'MONTHLY') && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {isLocked ? 'Upgrade to Regain Access' : 'Upgrade Your Plan'}
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Monthly */}
            {currentPlan !== 'MONTHLY' && currentPlan !== 'YEARLY' && (
              <div className="rounded-xl border-2 border-primary p-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">Monthly</p>
                  <p className="text-3xl font-extrabold text-foreground">KES 400</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>
                <ul className="space-y-1.5 text-sm text-foreground/80">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Full access</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Unlimited students & teachers</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> PDF reports</li>
                </ul>
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade('MONTHLY')}
                  disabled={!!upgrading}
                >
                  {upgrading === 'MONTHLY' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Upgrade to Monthly
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Yearly */}
            {currentPlan !== 'YEARLY' && (
              <div className="rounded-xl border-2 border-secondary p-5 space-y-4 relative overflow-hidden">
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold bg-green-500 text-white">
                  SAVE KES 400
                </span>
                <div>
                  <p className="text-xs font-semibold text-secondary uppercase tracking-wide">Yearly</p>
                  <p className="text-3xl font-extrabold text-foreground">KES 4,400</p>
                  <p className="text-sm text-muted-foreground">per year · pay 11 months</p>
                </div>
                <ul className="space-y-1.5 text-sm text-foreground/80">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Everything in Monthly</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> 1 month FREE</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Priority support</li>
                </ul>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => handleUpgrade('YEARLY')}
                  disabled={!!upgrading}
                >
                  {upgrading === 'YEARLY' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Upgrade to Yearly
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            After choosing a plan, our team will contact you to confirm payment.
            Contact us: <a href="mailto:support@schoolreport.co.ke" className="text-primary hover:underline">support@schoolreport.co.ke</a>
          </p>
        </div>
      )}

      {currentPlan === 'YEARLY' && !isLocked && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-green-800 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">You're on the best plan!</p>
            <p className="text-sm mt-0.5">Your yearly subscription is active. Enjoy 12 months of full access.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;

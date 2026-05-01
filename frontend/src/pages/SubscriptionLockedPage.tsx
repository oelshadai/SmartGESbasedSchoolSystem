import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, Lock, ArrowRight, Phone, Mail } from 'lucide-react';

const SubscriptionLockedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-8 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="p-5 rounded-full bg-destructive/10 border-2 border-destructive/20">
              <Lock className="h-14 w-14 text-destructive" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-foreground">
            Your Free Trial Has Ended
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Your 14-day free trial has expired. Upgrade your plan to regain full
            access to all platform features.
          </p>
        </div>

        {/* Plans summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {/* Monthly */}
          <div className="rounded-xl border-2 border-primary p-5 bg-primary/5">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Monthly</p>
            <p className="text-2xl font-extrabold text-foreground">KES 400</p>
            <p className="text-sm text-muted-foreground mb-3">per month</p>
            <ul className="space-y-1 text-sm text-foreground/80">
              <li>✓ Full platform access</li>
              <li>✓ Unlimited students</li>
              <li>✓ PDF reports</li>
            </ul>
          </div>

          {/* Yearly */}
          <div className="rounded-xl border-2 border-secondary p-5 bg-secondary/5 relative overflow-hidden">
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold bg-green-500 text-white">
              SAVE KES 400
            </span>
            <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-1">Yearly</p>
            <p className="text-2xl font-extrabold text-foreground">KES 4,400</p>
            <p className="text-sm text-muted-foreground mb-3">per year (11 months price)</p>
            <ul className="space-y-1 text-sm text-foreground/80">
              <li>✓ Everything in Monthly</li>
              <li>✓ 1 month FREE</li>
              <li>✓ Priority support</li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full text-base"
            onClick={() => navigate('/school/subscription')}
          >
            Upgrade Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <p className="text-sm text-muted-foreground">
            Need help? Contact us:
          </p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <a href="tel:+254700000000" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Phone className="h-3.5 w-3.5" />
              +254 700 000 000
            </a>
            <a href="mailto:support@schoolreport.co.ke" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Mail className="h-3.5 w-3.5" />
              support@schoolreport.co.ke
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionLockedPage;

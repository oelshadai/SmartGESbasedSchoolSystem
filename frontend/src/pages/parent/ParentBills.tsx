import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, DollarSign, ArrowRight } from 'lucide-react';

interface ChildInfo { student_id: string; name: string; relationship: string; }

const ParentBills = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const children: ChildInfo[] = (user as any)?.children || [];

  if (children.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Bills</h1>
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">
          No children linked to your account.
        </CardContent></Card>
      </div>
    );
  }

  if (children.length === 1) {
    navigate(`/parent/bills/${children[0].student_id}`, { replace: true });
    return null;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Bills</h1>
        <p className="text-muted-foreground text-sm mt-1">Select a child to view their fee bills</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {children.map(c => (
          <Card key={c.student_id} className="hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => navigate(`/parent/bills/${c.student_id}`)}>
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <GraduationCap className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.student_id}</p>
                  <Badge variant="secondary" className="text-xs mt-1">{c.relationship}</Badge>
                </div>
              </div>
              <Button size="sm" variant="outline" className="gap-1 shrink-0">
                <DollarSign className="h-3.5 w-3.5" /> View Bills
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ParentBills;

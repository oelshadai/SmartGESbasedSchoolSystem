import React from 'react';
import StudentPromotionSystem from '@/components/StudentPromotionSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function PromotionPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Promotion</h1>
          <p className="text-foreground mt-2">
            Promote students to the next class level or graduate them after completing their studies.
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Promotion Guidelines:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Students need minimum 75% attendance to be eligible for promotion</li>
            <li>• Academic performance should be at least 50% average across subjects</li>
            <li>• Third term must be completed before bulk class promotion</li>
            <li>• Use "Force Promotion" to override eligibility requirements</li>
            <li>• Basic 9 students will be marked as graduated</li>
          </ul>
        </AlertDescription>
      </Alert>

      <StudentPromotionSystem />

      <Card>
        <CardHeader>
          <CardTitle>Promotion History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">
            View detailed promotion history and reports in the Reports section.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
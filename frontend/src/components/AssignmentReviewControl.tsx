import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  EyeOff, 
  Settings, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Info
} from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';
import { toast } from 'sonner';

interface ReviewSettings {
  assignment_id: number;
  assignment_title: string;
  allow_review: boolean;
  review_available_after: string;
  review_enabled_at: string | null;
  total_submissions: number;
  students_can_review: number;
}

interface AssignmentReviewControlProps {
  assignmentId: number;
  assignmentTitle: string;
  onSettingsChange?: () => void;
}

const reviewOptions = [
  {
    value: 'IMMEDIATE',
    label: 'Immediately after submission',
    description: 'Students can review as soon as they submit',
    icon: Clock
  },
  {
    value: 'GRADED',
    label: 'After teacher grades',
    description: 'Students can review only after you grade their work',
    icon: CheckCircle
  },
  {
    value: 'MANUAL',
    label: 'Manual teacher control',
    description: 'You control exactly when students can review',
    icon: Settings
  },
  {
    value: 'NEVER',
    label: 'Never allow review',
    description: 'Students cannot review this assignment',
    icon: EyeOff
  }
];

const AssignmentReviewControl = ({ 
  assignmentId, 
  assignmentTitle, 
  onSettingsChange 
}: AssignmentReviewControlProps) => {
  const [settings, setSettings] = useState<ReviewSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen, assignmentId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await secureApiClient.get(`/assignments/teacher/${assignmentId}/review-settings/`);
      setSettings(response);
    } catch (error) {
      console.error('Failed to fetch review settings:', error);
      toast.error('Failed to load review settings');
    } finally {
      setLoading(false);
    }
  };

  const updateReviewSettings = async (allowReview: boolean, reviewSetting?: string) => {
    try {
      setSaving(true);
      const action = allowReview ? 'enable' : 'disable';
      
      await secureApiClient.post(`/assignments/teacher/${assignmentId}/toggle-review/`, {
        action,
        review_setting: reviewSetting || settings?.review_available_after
      });

      toast.success(
        allowReview 
          ? 'Review access enabled for students' 
          : 'Review access disabled for students'
      );

      // Refresh settings
      await fetchSettings();
      onSettingsChange?.();
    } catch (error) {
      console.error('Failed to update review settings:', error);
      toast.error('Failed to update review settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReview = async (enabled: boolean) => {
    await updateReviewSettings(enabled);
  };

  const handleReviewSettingChange = async (newSetting: string) => {
    if (settings?.allow_review) {
      await updateReviewSettings(true, newSetting);
    } else {
      // Just update the setting without enabling
      setSettings(prev => prev ? { ...prev, review_available_after: newSetting } : null);
    }
  };

  const enableManualReview = async () => {
    await updateReviewSettings(true, 'MANUAL');
  };

  const getStatusBadge = () => {
    if (!settings?.allow_review) {
      return <Badge variant="destructive"><EyeOff className="h-3 w-3 mr-1" />Disabled</Badge>;
    }

    const option = reviewOptions.find(opt => opt.value === settings.review_available_after);
    const IconComponent = option?.icon || Eye;

    return (
      <Badge variant="default">
        <IconComponent className="h-3 w-3 mr-1" />
        {option?.label || 'Enabled'}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Review Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Review Settings: {assignmentTitle}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : settings ? (
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  Current Status
                  {getStatusBadge()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground">Total Submissions</div>
                    <div className="text-lg font-semibold">{settings.total_submissions}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Can Review Now</div>
                    <div className="text-lg font-semibold text-green-600">{settings.students_can_review}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Toggle */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Allow Student Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow-review" className="text-sm font-medium">
                      Enable review access for students
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Students can see their answers, correct answers, and feedback
                    </p>
                  </div>
                  <Switch
                    id="allow-review"
                    checked={settings.allow_review}
                    onCheckedChange={handleToggleReview}
                    disabled={saving}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Review Timing Settings */}
            {settings.allow_review && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">When Can Students Review?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select 
                    value={settings.review_available_after} 
                    onValueChange={handleReviewSettingChange}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reviewOptions.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-muted-foreground">{option.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {/* Manual Control Actions */}
                  {settings.review_available_after === 'MANUAL' && (
                    <div className="space-y-3">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Manual Control:</strong> You decide exactly when students can review.
                          {settings.review_enabled_at ? (
                            <span className="block mt-1 text-green-600">
                              ✓ Review enabled on {new Date(settings.review_enabled_at).toLocaleString()}
                            </span>
                          ) : (
                            <span className="block mt-1 text-orange-600">
                              ⚠ Review not yet enabled for students
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>

                      {!settings.review_enabled_at && (
                        <Button 
                          onClick={enableManualReview}
                          disabled={saving}
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Enable Review Now
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Info for other settings */}
                  {settings.review_available_after === 'IMMEDIATE' && (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Students can review immediately after submitting. Good for practice quizzes.
                      </AlertDescription>
                    </Alert>
                  )}

                  {settings.review_available_after === 'GRADED' && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Students can review only after you grade their work. Recommended for most assignments.
                      </AlertDescription>
                    </Alert>
                  )}

                  {settings.review_available_after === 'NEVER' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Students will never be able to review this assignment. Use for high-stakes assessments.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Student Impact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Student Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  {settings.allow_review ? (
                    <>
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Students can see their submitted answers</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Students can see correct answers and explanations</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Students can read your feedback and comments</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Students can download their submitted files</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-red-600">
                        <EyeOff className="h-4 w-4" />
                        <span>Students cannot review their submissions</span>
                      </div>
                      <div className="flex items-center gap-2 text-red-600">
                        <EyeOff className="h-4 w-4" />
                        <span>Students cannot see correct answers</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Info className="h-4 w-4" />
                        <span>Students can still see their scores and grades</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            Failed to load review settings
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentReviewControl;
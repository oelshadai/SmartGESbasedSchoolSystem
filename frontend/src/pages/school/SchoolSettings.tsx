import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, School, BookOpen, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import secureApiClient from '@/lib/secureApiClient';
import ReportPreviewModal from '@/components/ReportPreviewModal';

interface SchoolSettings {
  id: number;
  name: string;
  address: string;
  location: string;
  phone_number: string;
  email: string;
  logo?: string;
  motto: string;
  website?: string;
  current_academic_year: string;
  current_term?: number;
  score_entry_mode: 'CLASS_TEACHER' | 'SUBJECT_TEACHER';
  report_template: string;
  show_class_average: boolean;
  show_position_in_class: boolean;
  show_attendance: boolean;
  show_behavior_comments: boolean;
  class_teacher_signature_required: boolean;
  show_student_photos: boolean;
  show_headteacher_signature: boolean;
  grade_scale_a_min: number;
  grade_scale_b_min: number;
  grade_scale_c_min: number;
  grade_scale_d_min: number;
  grade_scale_f_min: number;
  term_closing_date?: string;
  term_reopening_date?: string;
  show_promotion_on_terminal: boolean;
}

interface Term {
  id: number;
  name: string;
  display_name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

const SchoolSettings = () => {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [settingsResponse, termsResponse] = await Promise.all([
        secureApiClient.get('/schools/settings/'),
        secureApiClient.get('/schools/terms/')
      ]);
      setSettings(settingsResponse);
      setTerms(termsResponse.results || termsResponse || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
      toast.error('Failed to load school settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      
      // Validate grade scales before sending
      const { grade_scale_a_min, grade_scale_b_min, grade_scale_c_min, grade_scale_d_min, grade_scale_f_min } = settings;
      if (!(grade_scale_a_min > grade_scale_b_min && grade_scale_b_min > grade_scale_c_min && grade_scale_c_min > grade_scale_d_min && grade_scale_d_min > grade_scale_f_min && grade_scale_f_min >= 0)) {
        toast.error('Grade scale values must be in descending order: A > B > C > D > F >= 0');
        return;
      }
      
      // Exclude logo from settings save (logo is handled separately via file upload)
      const { logo, ...settingsToSave } = settings;
      
      await secureApiClient.patch('/schools/settings/', settingsToSave);
      toast.success('School settings updated successfully');
    } catch (err: any) {
      console.error('Save error:', err);
      console.error('Error response:', err.response?.data);
      
      // Extract validation errors from different possible response formats
      let errorMessage = 'Failed to save settings';
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors.join(', ') : data.non_field_errors;
        } else {
          // Handle field-specific errors (including arrays)
          const fieldErrors = Object.entries(data)
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return `${key}: ${value.join(', ')}`;
              } else if (typeof value === 'string') {
                return `${key}: ${value}`;
              }
              return null;
            })
            .filter(Boolean)
            .join('; ');
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SchoolSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const getCurrentTermDisplay = () => {
    if (!settings.current_term || !terms.length) return '';
    const currentTerm = terms.find(term => term.id === settings.current_term);
    if (!currentTerm) return '';
    return currentTerm.name === 'FIRST' ? '1' : 
           currentTerm.name === 'SECOND' ? '2' : 
           currentTerm.name === 'THIRD' ? '3' : '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="text-center text-red-500 p-8">
        {error || 'Failed to load settings'}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">School Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your school's profile and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              School Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>School Name</Label>
              <Input 
                value={settings.name} 
                onChange={(e) => updateSetting('name', e.target.value)}
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                value={settings.email} 
                onChange={(e) => updateSetting('email', e.target.value)}
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input 
                value={settings.phone_number} 
                onChange={(e) => updateSetting('phone_number', e.target.value)}
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea 
                value={settings.address} 
                onChange={(e) => updateSetting('address', e.target.value)}
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input 
                value={settings.location} 
                onChange={(e) => updateSetting('location', e.target.value)}
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Motto</Label>
              <Input 
                value={settings.motto} 
                onChange={(e) => updateSetting('motto', e.target.value)}
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Logo</Label>
              <Input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append('logo', file);
                    // Handle logo upload
                    secureApiClient.patch('/schools/settings/', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    }).then(() => {
                      toast.success('Logo uploaded successfully');
                      fetchSettings(); // Refresh to get new logo URL
                    }).catch(() => {
                      toast.error('Failed to upload logo');
                    });
                  }
                }}
                className="mt-1" 
              />
              {settings.logo && (
                <div className="mt-2">
                  <img 
                    src={settings.logo} 
                    alt="School Logo" 
                    className="h-16 w-16 object-contain border rounded" 
                  />
                </div>
              )}
            </div>
            <div>
              <Label>Website</Label>
              <Input 
                value={settings.website || ''} 
                onChange={(e) => updateSetting('website', e.target.value)}
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Principal Signature</Label>
              <Input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append('principal_signature', file);
                    secureApiClient.patch('/schools/settings/', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    }).then(() => {
                      toast.success('Principal signature uploaded successfully');
                      fetchSettings();
                    }).catch(() => {
                      toast.error('Failed to upload signature');
                    });
                  }
                }}
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Preview Terminal Report</Label>
              <Button 
                variant="outline" 
                className="mt-1 w-full"
                onClick={() => {
                  // Check if user is authenticated
                  const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
                  if (!token) {
                    toast.error('Please log in to preview reports');
                    return;
                  }
                  setShowPreviewModal(true);
                }}
              >
                Preview Report Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Academic Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Academic Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Current Academic Year</Label>
              <Input 
                value={settings.current_academic_year} 
                onChange={(e) => updateSetting('current_academic_year', e.target.value)}
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Current Term</Label>
              <Select 
                value={getCurrentTermDisplay()} 
                onValueChange={(value) => {
                  // Find the term ID based on the selected term name
                  const selectedTerm = terms.find(term => {
                    const termNumber = term.name === 'FIRST' ? '1' : 
                                     term.name === 'SECOND' ? '2' : 
                                     term.name === 'THIRD' ? '3' : '';
                    return termNumber === value;
                  });
                  updateSetting('current_term', selectedTerm ? selectedTerm.id : null);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select current term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Term</SelectItem>
                  <SelectItem value="2">2nd Term</SelectItem>
                  <SelectItem value="3">3rd Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Score Entry Mode</Label>
              <Select 
                value={settings.score_entry_mode} 
                onValueChange={(value) => updateSetting('score_entry_mode', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLASS_TEACHER">Class Teacher Mode</SelectItem>
                  <SelectItem value="SUBJECT_TEACHER">Subject Teacher Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Term Closing Date</Label>
              <Input 
                type="date"
                value={settings.term_closing_date || ''} 
                onChange={(e) => updateSetting('term_closing_date', e.target.value)}
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Term Reopening Date</Label>
              <Input 
                type="date"
                value={settings.term_reopening_date || ''} 
                onChange={(e) => updateSetting('term_reopening_date', e.target.value)}
                className="mt-1" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Report Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Report Template</Label>
              <Select 
                value={settings.report_template} 
                onValueChange={(value) => updateSetting('report_template', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard Template</SelectItem>
                  <SelectItem value="DETAILED">Detailed Template</SelectItem>
                  <SelectItem value="COMPACT">Compact Template</SelectItem>
                  <SelectItem value="GHANA_EDUCATION_SERVICE">Ghana Education Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Show Class Average</Label>
                <p className="text-xs text-muted-foreground">Display class average on reports</p>
              </div>
              <Switch 
                checked={settings.show_class_average} 
                onCheckedChange={(checked) => updateSetting('show_class_average', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Show Position in Class</Label>
                <p className="text-xs text-muted-foreground">Display student ranking</p>
              </div>
              <Switch 
                checked={settings.show_position_in_class} 
                onCheckedChange={(checked) => updateSetting('show_position_in_class', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Show Attendance</Label>
                <p className="text-xs text-muted-foreground">Include attendance on reports</p>
              </div>
              <Switch 
                checked={settings.show_attendance} 
                onCheckedChange={(checked) => updateSetting('show_attendance', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Show Behavior Comments</Label>
                <p className="text-xs text-muted-foreground">Include behavior records</p>
              </div>
              <Switch 
                checked={settings.show_behavior_comments} 
                onCheckedChange={(checked) => updateSetting('show_behavior_comments', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Grade Scale */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Scale Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label>Grade A (Min %)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  max="100"
                  value={settings.grade_scale_a_min} 
                  onChange={(e) => updateSetting('grade_scale_a_min', parseInt(e.target.value))}
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>Grade B (Min %)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  max="100"
                  value={settings.grade_scale_b_min} 
                  onChange={(e) => updateSetting('grade_scale_b_min', parseInt(e.target.value))}
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>Grade C (Min %)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  max="100"
                  value={settings.grade_scale_c_min} 
                  onChange={(e) => updateSetting('grade_scale_c_min', parseInt(e.target.value))}
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>Grade D (Min %)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  max="100"
                  value={settings.grade_scale_d_min} 
                  onChange={(e) => updateSetting('grade_scale_d_min', parseInt(e.target.value))}
                  className="mt-1" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <ReportPreviewModal 
        isOpen={showPreviewModal} 
        onClose={() => setShowPreviewModal(false)} 
      />
    </div>
  );
};

export default SchoolSettings;

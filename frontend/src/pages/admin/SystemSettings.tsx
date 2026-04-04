import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, BookOpen, FileText, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Term {
  id: number;
  name: string;
  display_name: string;
  academic_year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface SchoolSettings {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  address: string;
  location: string;
  motto: string;
  logo: string | null;
  website: string;
  principal_signature: string | null;
  current_academic_year: string;
  current_term: number | null;
  score_entry_mode: string;
  report_template: string;
  show_class_average: boolean;
  show_position_in_class: boolean;
  show_attendance: boolean;
  show_behavior_comments: boolean;
  show_student_photos: boolean;
  show_headteacher_signature: boolean;
  class_teacher_signature_required: boolean;
  term_closing_date: string | null;
  term_reopening_date: string | null;
  grade_scale_a_min: number;
  grade_scale_b_min: number;
  grade_scale_c_min: number;
  grade_scale_d_min: number;
  grade_scale_f_min: number;
}

const SystemSettings = () => {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchTerms();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/schools/settings/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
      setLoading(false);
    }
  };

  const fetchTerms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/schools/terms/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTerms(response.data);
    } catch (error) {
      console.error('Error fetching terms:', error);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/api/schools/settings/`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SchoolSettings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading settings...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-red-400 text-xl">Failed to load settings</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">System Settings</h1>
            <p className="text-slate-400 text-lg">Configure school settings and preferences</p>
          </div>
          {message && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
              message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span>{message.text}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* School Profile */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                  <BookOpen className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">School Profile</h3>
                  <p className="text-slate-400 text-sm">Basic school information</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300 text-sm font-medium">School Name</Label>
                <Input 
                  value={settings.name || ''} 
                  onChange={(e) => updateSetting('name', e.target.value)}
                  className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white" 
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm font-medium">Email</Label>
                <Input 
                  type="email"
                  value={settings.email || ''} 
                  onChange={(e) => updateSetting('email', e.target.value)}
                  className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white" 
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm font-medium">Phone</Label>
                <Input 
                  value={settings.phone_number || ''} 
                  onChange={(e) => updateSetting('phone_number', e.target.value)}
                  className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white" 
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm font-medium">Location</Label>
                <Input 
                  value={settings.location || ''} 
                  onChange={(e) => updateSetting('location', e.target.value)}
                  className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white" 
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-slate-300 text-sm font-medium">Address</Label>
                <Input 
                  value={settings.address || ''} 
                  onChange={(e) => updateSetting('address', e.target.value)}
                  className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white" 
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm font-medium">Motto</Label>
                <Input 
                  value={settings.motto || ''} 
                  onChange={(e) => updateSetting('motto', e.target.value)}
                  placeholder="e.g., Labour omnia vincit"
                  className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white" 
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm font-medium">Website</Label>
                <Input 
                  value={settings.website || ''} 
                  onChange={(e) => updateSetting('website', e.target.value)}
                  placeholder="https://"
                  className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white" 
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm font-medium">School Logo</Label>
                <Input 
                  type="file"
                  accept="image/*"
                  className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white" 
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm font-medium">Principal Signature</Label>
                <Input 
                  type="file"
                  accept="image/*"
                  className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Academic Settings */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                <BookOpen className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Academic Settings</h3>
                <p className="text-slate-400 text-sm">Configure academic year and terms</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 text-sm font-medium">Current Academic Year</Label>
                <Input 
                  value={settings.current_academic_year || ''} 
                  onChange={(e) => updateSetting('current_academic_year', e.target.value)}
                  placeholder="e.g., 2024/2025"
                  className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white" 
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm font-medium">Current Term</Label>
                <Select 
                  value={settings.current_term?.toString() || ''} 
                  onValueChange={(value) => updateSetting('current_term', parseInt(value))}
                >
                  <SelectTrigger className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white">
                    <SelectValue placeholder="Select current term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id.toString()}>
                        {term.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-sm font-medium">Score Entry Mode</Label>
                <Select 
                  value={settings.score_entry_mode} 
                  onValueChange={(value) => updateSetting('score_entry_mode', value)}
                >
                  <SelectTrigger className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLASS_TEACHER">Class Teacher Mode</SelectItem>
                    <SelectItem value="SUBJECT_TEACHER">Subject Teacher Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-sm font-medium">Term Closing Date</Label>
                <Input 
                  type="date"
                  value={settings.term_closing_date || ''} 
                  onChange={(e) => updateSetting('term_closing_date', e.target.value)}
                  className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white" 
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm font-medium">Term Reopening Date</Label>
                <Input 
                  type="date"
                  value={settings.term_reopening_date || ''} 
                  onChange={(e) => updateSetting('term_reopening_date', e.target.value)}
                  className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white" 
                />
              </div>
            </div>
          </div>

          {/* Report Settings */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <FileText className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Report Settings</h3>
                <p className="text-slate-400 text-sm">Configure report card display</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 text-sm font-medium">Report Template</Label>
                <Select 
                  value={settings.report_template} 
                  onValueChange={(value) => updateSetting('report_template', value)}
                >
                  <SelectTrigger className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white">
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
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                  <Label className="text-slate-300">Show Class Average</Label>
                  <Switch 
                    checked={settings.show_class_average} 
                    onCheckedChange={(checked) => updateSetting('show_class_average', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                  <Label className="text-slate-300">Show Position in Class</Label>
                  <Switch 
                    checked={settings.show_position_in_class} 
                    onCheckedChange={(checked) => updateSetting('show_position_in_class', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                  <Label className="text-slate-300">Show Attendance</Label>
                  <Switch 
                    checked={settings.show_attendance} 
                    onCheckedChange={(checked) => updateSetting('show_attendance', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                  <Label className="text-slate-300">Show Behavior Comments</Label>
                  <Switch 
                    checked={settings.show_behavior_comments} 
                    onCheckedChange={(checked) => updateSetting('show_behavior_comments', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                  <Label className="text-slate-300">Show Student Photos</Label>
                  <Switch 
                    checked={settings.show_student_photos} 
                    onCheckedChange={(checked) => updateSetting('show_student_photos', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                  <Label className="text-slate-300">Show Headteacher Signature</Label>
                  <Switch 
                    checked={settings.show_headteacher_signature} 
                    onCheckedChange={(checked) => updateSetting('show_headteacher_signature', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Grading Scale Settings */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <BarChart3 className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Grading Scale</h3>
                <p className="text-slate-400 text-sm">Configure minimum scores for each grade</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label className="text-slate-300 text-sm font-medium">Grade A (Min)</Label>
                <Input 
                  type="number" 
                  value={settings.grade_scale_a_min} 
                  onChange={(e) => updateSetting('grade_scale_a_min', parseInt(e.target.value))}
                  className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white" 
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm font-medium">Grade B (Min)</Label>
                <Input 
                  type="number" 
                  value={settings.grade_scale_b_min} 
                  onChange={(e) => updateSetting('grade_scale_b_min', parseInt(e.target.value))}
                  className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white" 
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm font-medium">Grade C (Min)</Label>
                <Input 
                  type="number" 
                  value={settings.grade_scale_c_min} 
                  onChange={(e) => updateSetting('grade_scale_c_min', parseInt(e.target.value))}
                  className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white" 
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm font-medium">Grade D (Min)</Label>
                <Input 
                  type="number" 
                  value={settings.grade_scale_d_min} 
                  onChange={(e) => updateSetting('grade_scale_d_min', parseInt(e.target.value))}
                  className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white" 
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm font-medium">Grade F (Min)</Label>
                <Input 
                  type="number" 
                  value={settings.grade_scale_f_min} 
                  onChange={(e) => updateSetting('grade_scale_f_min', parseInt(e.target.value))}
                  className="mt-2 h-12 bg-slate-800/50 border-slate-700/50 text-white" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="h-12 px-8 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-xl shadow-lg"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;

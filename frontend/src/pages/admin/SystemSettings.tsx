import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Save, BookOpen, FileText, BarChart3, Settings2,
  Calendar, GraduationCap, Loader2, School, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import secureApiClient from '@/lib/secureApiClient';

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

  useEffect(() => {
    Promise.all([fetchSettings(), fetchTerms()]).finally(() => setLoading(false));
  }, []);

  const fetchSettings = async () => {
    try {
      const data: SchoolSettings = await secureApiClient.get('/schools/settings/');
      setSettings(data);
    } catch {
      toast.error('Failed to load settings');
    }
  };

  const fetchTerms = async () => {
    try {
      const response = await secureApiClient.get('/schools/terms/');
      const termList: Term[] = Array.isArray(response) ? response : response.results ?? [];
      setTerms(termList);
    } catch {
      // non-critical
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await secureApiClient.patch('/schools/settings/', settings);
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SchoolSettings, value: any) => {
    if (settings) setSettings({ ...settings, [key]: value });
  };

  // ---- Derived summary values ----
  const currentTermObj = terms.find(t => t.id === settings?.current_term);
  const stats = [
    {
      label: 'Academic Year',
      value: settings?.current_academic_year || '—',
      icon: Calendar,
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/20',
      glow: 'shadow-blue-500/10',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Current Term',
      value: currentTermObj?.display_name ?? (settings?.current_term ? `Term ${settings.current_term}` : 'Not set'),
      icon: Layers,
      bg: 'bg-purple-500/20',
      border: 'border-purple-500/20',
      glow: 'shadow-purple-500/10',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Score Entry Mode',
      value: settings?.score_entry_mode === 'CLASS_TEACHER' ? 'Class Teacher' : settings?.score_entry_mode === 'SUBJECT_TEACHER' ? 'Subject Teacher' : '—',
      icon: GraduationCap,
      bg: 'bg-cyan-500/20',
      border: 'border-cyan-500/20',
      glow: 'shadow-cyan-500/10',
      gradient: 'from-cyan-500 to-teal-500',
    },
    {
      label: 'Report Template',
      value: settings?.report_template?.replace(/_/g, ' ') ?? '—',
      icon: FileText,
      bg: 'bg-green-500/20',
      border: 'border-green-500/20',
      glow: 'shadow-green-500/10',
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  // ---- Reusable styled input ----
  const FieldInput = ({ label, value, onChange, type = 'text', placeholder = '', span2 = false }: {
    label: string; value: string; onChange: (v: string) => void;
    type?: string; placeholder?: string; span2?: boolean;
  }) => (
    <div className={span2 ? 'md:col-span-2' : ''}>
      <Label className="text-slate-300 text-sm font-medium">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 h-11 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
      />
    </div>
  );

  const SwitchRow = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl transition-colors">
      <Label className="text-slate-300 text-sm cursor-pointer">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );

  const SectionCard = ({ icon: Icon, iconClass, title, subtitle, gradient, children }: {
    icon: any; iconClass: string; title: string; subtitle: string;
    gradient: string; children: React.ReactNode;
  }) => (
    <div className="relative group bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 hover:border-slate-700/50 transition-all duration-300 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient.replace('from-', 'from-').replace('to-', 'to-')}/20 bg-opacity-20`}>
          <Icon className={`h-5 w-5 ${iconClass}`} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-slate-400 text-xs">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );

  // ---- Loading skeleton ----
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="relative p-6 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 bg-slate-800/60" />
            <Skeleton className="h-5 w-80 bg-slate-800/40" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl bg-slate-800/60" />)}
          </div>
          <Skeleton className="h-96 rounded-2xl bg-slate-800/60" />
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative p-6 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
                <Settings2 className="h-5 w-5 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">System Settings</h1>
            </div>
            <p className="text-slate-400 text-sm pl-12">Configure school preferences, academic setup, and report options</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-11 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Saving…' : 'Save Settings'}
          </Button>
        </div>

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(stat => (
            <div key={stat.label} className={`relative group rounded-2xl border ${stat.border} bg-slate-900/60 backdrop-blur-xl p-5 shadow-xl ${stat.glow} hover:scale-[1.02] transition-all duration-300 overflow-hidden`}>
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
              <div className={`absolute -top-6 -right-6 w-20 h-20 ${stat.bg} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
              <div className="relative flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-slate-400 text-xs mb-1.5">{stat.label}</p>
                  <p className="text-white font-semibold text-sm leading-tight truncate">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bg} border ${stat.border} shrink-0 ml-2`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabbed settings ── */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 p-1 rounded-xl h-auto flex-wrap">
            <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-2 text-sm gap-1.5">
              <School className="h-3.5 w-3.5" />School Profile
            </TabsTrigger>
            <TabsTrigger value="academic" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-2 text-sm gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />Academic
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-2 text-sm gap-1.5">
              <FileText className="h-3.5 w-3.5" />Reports
            </TabsTrigger>
            <TabsTrigger value="grading" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4 py-2 text-sm gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />Grading Scale
            </TabsTrigger>
          </TabsList>

          {/* ── School Profile tab ── */}
          <TabsContent value="profile">
            <SectionCard
              icon={School}
              iconClass="text-cyan-400"
              title="School Profile"
              subtitle="Basic school information and contact details"
              gradient="from-cyan-500 to-blue-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldInput label="School Name" value={settings.name || ''} onChange={v => updateSetting('name', v)} />
                <FieldInput label="Email" value={settings.email || ''} onChange={v => updateSetting('email', v)} type="email" />
                <FieldInput label="Phone" value={settings.phone_number || ''} onChange={v => updateSetting('phone_number', v)} />
                <FieldInput label="Location" value={settings.location || ''} onChange={v => updateSetting('location', v)} />
                <FieldInput label="Address" value={settings.address || ''} onChange={v => updateSetting('address', v)} span2 />
                <FieldInput label="School Motto" value={settings.motto || ''} onChange={v => updateSetting('motto', v)} placeholder="e.g., Labour omnia vincit" />
                <FieldInput label="Website" value={settings.website || ''} onChange={v => updateSetting('website', v)} placeholder="https://" />
                <div>
                  <Label className="text-slate-300 text-sm font-medium">School Logo</Label>
                  <Input type="file" accept="image/*" className="mt-2 h-11 bg-slate-800/50 border-slate-700/50 text-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white file:text-xs" />
                  {settings.logo && (
                    <p className="text-xs text-slate-500 mt-1 truncate">Current: {settings.logo.split('/').pop()}</p>
                  )}
                </div>
                <div>
                  <Label className="text-slate-300 text-sm font-medium">Principal Signature</Label>
                  <Input type="file" accept="image/*" className="mt-2 h-11 bg-slate-800/50 border-slate-700/50 text-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white file:text-xs" />
                  {settings.principal_signature && (
                    <p className="text-xs text-slate-500 mt-1 truncate">Current: {settings.principal_signature.split('/').pop()}</p>
                  )}
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          {/* ── Academic tab ── */}
          <TabsContent value="academic">
            <SectionCard
              icon={BookOpen}
              iconClass="text-blue-400"
              title="Academic Settings"
              subtitle="Configure the active academic year, term, and score entry mode"
              gradient="from-blue-500 to-cyan-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldInput
                  label="Current Academic Year"
                  value={settings.current_academic_year || ''}
                  onChange={v => updateSetting('current_academic_year', v)}
                  placeholder="e.g., 2025/2026"
                />
                <div>
                  <Label className="text-slate-300 text-sm font-medium">Current Term</Label>
                  <Select
                    value={settings.current_term?.toString() || ''}
                    onValueChange={v => updateSetting('current_term', parseInt(v))}
                  >
                    <SelectTrigger className="mt-2 h-11 bg-slate-800/50 border-slate-700/50 text-white">
                      <SelectValue placeholder="Select current term" />
                    </SelectTrigger>
                    <SelectContent>
                      {terms.map(term => (
                        <SelectItem key={term.id} value={term.id.toString()}>
                          <span className="flex items-center gap-2">
                            {term.display_name}
                            {term.is_current && <Badge variant="secondary" className="text-xs py-0">active</Badge>}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300 text-sm font-medium">Score Entry Mode</Label>
                  <Select value={settings.score_entry_mode} onValueChange={v => updateSetting('score_entry_mode', v)}>
                    <SelectTrigger className="mt-2 h-11 bg-slate-800/50 border-slate-700/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLASS_TEACHER">Class Teacher Mode</SelectItem>
                      <SelectItem value="SUBJECT_TEACHER">Subject Teacher Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <FieldInput
                  label="Term Closing Date"
                  value={settings.term_closing_date || ''}
                  onChange={v => updateSetting('term_closing_date', v)}
                  type="date"
                />
                <FieldInput
                  label="Term Reopening Date"
                  value={settings.term_reopening_date || ''}
                  onChange={v => updateSetting('term_reopening_date', v)}
                  type="date"
                />
              </div>
            </SectionCard>
          </TabsContent>

          {/* ── Reports tab ── */}
          <TabsContent value="reports">
            <SectionCard
              icon={FileText}
              iconClass="text-purple-400"
              title="Report Card Settings"
              subtitle="Control what appears on generated report cards"
              gradient="from-purple-500 to-pink-500"
            >
              <div className="space-y-5">
                <div>
                  <Label className="text-slate-300 text-sm font-medium">Report Template</Label>
                  <Select value={settings.report_template} onValueChange={v => updateSetting('report_template', v)}>
                    <SelectTrigger className="mt-2 h-11 bg-slate-800/50 border-slate-700/50 text-white">
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
                <div className="space-y-2">
                  <SwitchRow label="Show Class Average" checked={settings.show_class_average} onChange={v => updateSetting('show_class_average', v)} />
                  <SwitchRow label="Show Position in Class" checked={settings.show_position_in_class} onChange={v => updateSetting('show_position_in_class', v)} />
                  <SwitchRow label="Show Attendance" checked={settings.show_attendance} onChange={v => updateSetting('show_attendance', v)} />
                  <SwitchRow label="Show Behavior Comments" checked={settings.show_behavior_comments} onChange={v => updateSetting('show_behavior_comments', v)} />
                  <SwitchRow label="Show Student Photos" checked={settings.show_student_photos} onChange={v => updateSetting('show_student_photos', v)} />
                  <SwitchRow label="Show Headteacher Signature" checked={settings.show_headteacher_signature} onChange={v => updateSetting('show_headteacher_signature', v)} />
                  <SwitchRow label="Require Class Teacher Signature" checked={settings.class_teacher_signature_required} onChange={v => updateSetting('class_teacher_signature_required', v)} />
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          {/* ── Grading Scale tab ── */}
          <TabsContent value="grading">
            <SectionCard
              icon={BarChart3}
              iconClass="text-green-400"
              title="Grading Scale"
              subtitle="Set minimum scores for each letter grade"
              gradient="from-green-500 to-emerald-500"
            >
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Grade A', key: 'grade_scale_a_min' as const, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
                  { label: 'Grade B', key: 'grade_scale_b_min' as const, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                  { label: 'Grade C', key: 'grade_scale_c_min' as const, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
                  { label: 'Grade D', key: 'grade_scale_d_min' as const, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
                  { label: 'Grade F', key: 'grade_scale_f_min' as const, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                ].map(g => (
                  <div key={g.key} className={`rounded-xl border p-4 ${g.bg} text-center`}>
                    <p className={`text-xs font-semibold mb-2 ${g.color}`}>{g.label}</p>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={settings[g.key]}
                      onChange={e => updateSetting(g.key, parseInt(e.target.value) || 0)}
                      className="h-10 bg-slate-800/50 border-slate-700/50 text-white text-center text-lg font-bold px-2"
                    />
                    <p className="text-slate-500 text-xs mt-1.5">min score</p>
                  </div>
                ))}
              </div>

              {/* Visual grade bar */}
              <div className="mt-6 p-4 bg-slate-800/30 rounded-xl">
                <p className="text-slate-400 text-xs font-medium mb-3">Grade Distribution Preview</p>
                <div className="flex rounded-lg overflow-hidden h-6 text-xs font-bold">
                  <div className="bg-green-500/70 flex items-center justify-center text-white" style={{ width: `${100 - settings.grade_scale_a_min}%` }}>A</div>
                  <div className="bg-blue-500/70 flex items-center justify-center text-white" style={{ width: `${settings.grade_scale_a_min - settings.grade_scale_b_min}%` }}>B</div>
                  <div className="bg-yellow-500/70 flex items-center justify-center text-white" style={{ width: `${settings.grade_scale_b_min - settings.grade_scale_c_min}%` }}>C</div>
                  <div className="bg-orange-500/70 flex items-center justify-center text-white" style={{ width: `${settings.grade_scale_c_min - settings.grade_scale_d_min}%` }}>D</div>
                  <div className="bg-red-500/70 flex items-center justify-center text-white flex-1">F</div>
                </div>
                <div className="flex justify-between text-slate-500 text-xs mt-1">
                  <span>0</span><span>50</span><span>100</span>
                </div>
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>

        {/* ── Bottom save ── */}
        <div className="flex justify-end pb-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-11 px-8 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Saving…' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;

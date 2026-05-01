import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Save, Users, Shield, Loader2, Trash2, Eye, EyeOff,
  AlertCircle, RefreshCw, GraduationCap, Link2, UserPlus, Copy, CheckCircle2,
  Phone, Mail, X, UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import secureApiClient from '@/lib/secureApiClient';

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------
interface PortalSettings {
  parent_portal_enabled: boolean;
  parent_can_view_grades: boolean;
  parent_can_view_attendance: boolean;
  parent_can_view_fees: boolean;
  parent_can_view_reports: boolean;
  parent_can_pay_fees_online: boolean;
  parent_can_message_teachers: boolean;
  parent_support_email: string;
  paystack_public_key: string;
  paystack_secret_key_saved: boolean;
}

interface ChildLink {
  link_id: number;
  student_id: string;
  student_name: string;
  class: string;
  relationship: string;
  is_primary_guardian: boolean;
}

interface ParentAccount {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  is_active: boolean;
  role?: string;
  children: ChildLink[];
}

interface StudentWithoutParent {
  id: number;
  student_id: string;
  name: string;
  class: string;
  guardian_name: string;
  guardian_email: string;
  guardian_phone: string;
}

interface GeneratedCreds {
  student_name: string;
  parent_name: string;
  email: string;
  password: string | null;
}

// -------------------------------------------------------------------------
// Default state
// -------------------------------------------------------------------------
const DEFAULT_SETTINGS: PortalSettings = {
  parent_portal_enabled: false,
  parent_can_view_grades: true,
  parent_can_view_attendance: true,
  parent_can_view_fees: true,
  parent_can_view_reports: true,
  parent_can_pay_fees_online: false,
  parent_can_message_teachers: false,
  parent_support_email: '',
  paystack_public_key: '',
  paystack_secret_key_saved: false,
};

// -------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------
const ParentPortalSettings = () => {
  const [section, setSection] = useState<'settings' | 'accounts'>('settings');

  // ---- Settings state ----
  const [settings, setSettings] = useState<PortalSettings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [newSecretKey, setNewSecretKey] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  // ---- Accounts: students without parent ----
  const [studentsWithout, setStudentsWithout] = useState<StudentWithoutParent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [creatingForId, setCreatingForId] = useState<string | null>(null);
  const [generatedCreds, setGeneratedCreds] = useState<GeneratedCreds | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Inline manual-entry form for students with no guardian email
  const [manualFormId, setManualFormId] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState({
    email: '', first_name: '', last_name: '', phone_number: '', relationship: 'Guardian',
  });

  // ---- Accounts: existing parents ----
  const [parents, setParents] = useState<ParentAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  // Detail view modal
  const [viewParent, setViewParent] = useState<ParentAccount | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetResult, setResetResult] = useState<{ email: string; new_password: string } | null>(null);

  // Link child form
  const [linkingParentId, setLinkingParentId] = useState<number | null>(null);
  const [linkStudentId, setLinkStudentId] = useState('');
  const [linkRelationship, setLinkRelationship] = useState('Guardian');
  const [linkSaving, setLinkSaving] = useState(false);

  // ---- Load on section switch ----
  useEffect(() => { loadSettings(); }, []);
  useEffect(() => {
    if (section === 'accounts') {
      loadStudentsWithout();
      loadParents();
    }
  }, [section]);

  // ---- Settings ----
  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const resp = await secureApiClient.get('/schools/parent-portal-settings/');
      setSettings(resp || DEFAULT_SETTINGS);
    } catch {
      toast.error('Failed to load portal settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      const payload: Record<string, unknown> = { ...settings };
      delete payload.paystack_secret_key_saved;
      if (newSecretKey.trim()) payload.paystack_secret_key = newSecretKey.trim();
      const resp: any = await secureApiClient.patch('/schools/parent-portal-settings/', payload);
      // Backend returns { message, data: {...settings} }
      setSettings(resp?.data ?? resp);
      setNewSecretKey('');
      toast.success('Parent portal settings saved');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e.message || 'Save failed');
    } finally {
      setSettingsSaving(false);
    }
  };

  // ---- Students without parent accounts ----
  const loadStudentsWithout = async () => {
    setStudentsLoading(true);
    try {
      const resp = await secureApiClient.get('/schools/parent-accounts/students_without_parent/');
      setStudentsWithout(Array.isArray(resp) ? resp : (resp.data || []));
    } catch {
      toast.error('Failed to load students list');
    } finally {
      setStudentsLoading(false);
    }
  };

  const createForStudent = async (
    student: StudentWithoutParent,
    overrides?: { email: string; first_name: string; last_name: string; phone_number: string; relationship: string }
  ) => {
    setCreatingForId(student.student_id);
    try {
      const resp = await secureApiClient.post('/schools/parent-accounts/create_for_student/', {
        student_id: student.student_id,
        ...(overrides ?? {}),
      });
      const data: any = resp;
      setGeneratedCreds({
        student_name: student.name,
        parent_name: overrides?.first_name
          ? `${overrides.first_name} ${overrides.last_name}`.trim()
          : student.guardian_name || data.email,
        email: data.email,
        password: data.generated_password,
      });
      setManualFormId(null);
      setManualForm({ email: '', first_name: '', last_name: '', phone_number: '', relationship: 'Guardian' });
      loadStudentsWithout();
      loadParents();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e.message || 'Failed to create account');
    } finally {
      setCreatingForId(null);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  // ---- Existing parents ----
  const loadParents = async () => {
    setAccountsLoading(true);
    try {
      const resp = await secureApiClient.get('/schools/parent-accounts/');
      setParents(Array.isArray(resp) ? resp : (resp.data || []));
    } catch {
      toast.error('Failed to load parent accounts');
    } finally {
      setAccountsLoading(false);
    }
  };

  const linkChild = async (parentId: number) => {
    if (!linkStudentId.trim()) { toast.error('Enter a student ID'); return; }
    setLinkSaving(true);
    try {
      await secureApiClient.post('/schools/parent-accounts/link_child/', {
        parent_id: parentId, student_id: linkStudentId.trim(), relationship: linkRelationship,
      });
      toast.success('Child linked');
      setLinkingParentId(null); setLinkStudentId(''); setLinkRelationship('Guardian');
      loadParents();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e.message || 'Failed to link child');
    } finally {
      setLinkSaving(false);
    }
  };

  const unlinkChild = async (linkId: number) => {
    if (!confirm('Remove this parent–child link?')) return;
    try {
      await secureApiClient.delete('/schools/parent-accounts/unlink_child/', { data: { link_id: linkId } });
      toast.success('Link removed');
      loadParents();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to remove link');
    }
  };

  const deleteParent = async (parentId: number, name: string, role?: string) => {
    const isDualRole = role && role !== 'PARENT';
    const msg = isDualRole
      ? `Remove parent links for ${name}? Their ${role} account will be kept.`
      : `Delete account for ${name}? This cannot be undone.`;
    if (!confirm(msg)) return;
    try {
      const resp: any = await secureApiClient.delete(`/schools/parent-accounts/${parentId}/`);
      if (resp?.deleted === false) {
        toast.success(`Parent links removed. ${name}'s account was kept (${role} role).`);
      } else {
        toast.success('Parent account deleted');
      }
      setParents(prev => prev.filter(p => p.id !== parentId));
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to delete account');
    }
  };

  const resetParentPassword = async (parentId: number) => {
    setResettingPassword(true);
    setResetResult(null);
    try {
      const resp = await secureApiClient.post('/schools/parent-accounts/reset_password/', { parent_id: parentId });
      setResetResult(resp as any);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const toggle = (key: keyof PortalSettings) =>
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  // =========================================================================
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Parent Portal Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure what parents can access and manage parent accounts
        </p>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-2">
        <Button
          variant={section === 'settings' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSection('settings')}
        >
          <Shield className="h-4 w-4 mr-1" /> Portal Configuration
        </Button>
        <Button
          variant={section === 'accounts' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSection('accounts')}
        >
          <Users className="h-4 w-4 mr-1" /> Parent Accounts
        </Button>
      </div>

      {/* ================================================================
          SECTION 1 — Portal Configuration
          ================================================================ */}
      {section === 'settings' && (
        <div className="space-y-5">
          {settingsLoading ? (
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <>
              {/* Master switch */}
              <Card className={settings.parent_portal_enabled ? 'border-green-400' : 'border-dashed'}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-base">Enable Parent Portal</p>
                      <p className="text-sm text-muted-foreground">
                        Master switch — when off, no parent login is possible
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={settings.parent_portal_enabled ? 'default' : 'secondary'}>
                        {settings.parent_portal_enabled ? 'ACTIVE' : 'DISABLED'}
                      </Badge>
                      <Switch
                        checked={settings.parent_portal_enabled}
                        onCheckedChange={() => toggle('parent_portal_enabled')}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Access */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" /> What Parents Can See
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {([
                      ['parent_can_view_grades', 'View Grades & Scores', 'CA and exam scores per subject'],
                      ['parent_can_view_attendance', 'View Attendance', 'Daily and term attendance records'],
                      ['parent_can_view_fees', 'View Fee Status', 'Outstanding balance and payment history'],
                      ['parent_can_view_reports', 'Download Report Cards', 'PDF report cards per term'],
                    ] as [keyof PortalSettings, string, string][]).map(([key, label, desc]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <Label>{label}</Label>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <Switch checked={!!settings[key]} onCheckedChange={() => toggle(key)} />
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Message Teachers</Label>
                        <p className="text-xs text-muted-foreground">Parents can send messages to their child's teachers</p>
                      </div>
                      <Switch checked={settings.parent_can_message_teachers} onCheckedChange={() => toggle('parent_can_message_teachers')} />
                    </div>
                  </CardContent>
                </Card>

                {/* Payments */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Online Fee Payments (Paystack)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Online Payments</Label>
                        <p className="text-xs text-muted-foreground">
                          Parents pay via Paystack (MoMo, Visa, etc.)
                        </p>
                      </div>
                      <Switch
                        checked={settings.parent_can_pay_fees_online}
                        onCheckedChange={() => toggle('parent_can_pay_fees_online')}
                      />
                    </div>

                    {settings.parent_can_pay_fees_online && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <Label>Paystack Public Key</Label>
                          <Input
                            placeholder="pk_live_... or pk_test_..."
                            value={settings.paystack_public_key}
                            onChange={e => setSettings(s => ({ ...s, paystack_public_key: e.target.value }))}
                          />
                          <p className="text-xs text-muted-foreground">Visible in the browser — safe to expose</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Paystack Secret Key</Label>
                          <div className="relative">
                            <Input
                              type={showSecret ? 'text' : 'password'}
                              placeholder={settings.paystack_secret_key_saved ? '••••••••••••• (saved)' : 'sk_live_... or sk_test_...'}
                              value={newSecretKey}
                              onChange={e => setNewSecretKey(e.target.value)}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-2.5 text-muted-foreground"
                              onClick={() => setShowSecret(s => !s)}
                            >
                              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Stored server-side only, never sent to the browser.
                            {settings.paystack_secret_key_saved && ' Leave blank to keep existing key.'}
                          </p>
                          {settings.parent_can_pay_fees_online && !settings.paystack_secret_key_saved && !newSecretKey && (
                            <Alert variant="destructive" className="py-2">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-xs">Secret key required for online payments.</AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </>
                    )}

                    <Separator />
                    <div className="space-y-2">
                      <Label>Parent Support Email</Label>
                      <Input
                        type="email"
                        placeholder="parents@yourschool.edu.gh"
                        value={settings.parent_support_email}
                        onChange={e => setSettings(s => ({ ...s, parent_support_email: e.target.value }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveSettings} disabled={settingsSaving}>
                  {settingsSaving
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                    : <><Save className="h-4 w-4 mr-2" />Save Settings</>}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ================================================================
          SECTION 2 — Parent Accounts
          ================================================================ */}
      {section === 'accounts' && (
        <div className="space-y-6">

          {/* ---- Students without a parent account ---- */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-orange-500" />
                    Students Without a Parent Account
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    When you add a student with a guardian email, the parent account is created automatically.
                    Use this list for existing students who were added before the parent portal.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={loadStudentsWithout} disabled={studentsLoading}>
                  <RefreshCw className={`h-3 w-3 mr-1 ${studentsLoading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : studentsWithout.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-60" />
                  <p className="text-sm font-medium">All students have parent accounts</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {studentsWithout.map(s => (
                    <div key={s.student_id} className="rounded-lg border bg-muted/20 p-3 space-y-0">
                      {/* Info + button row */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
                          <div>
                            <p className="font-medium text-sm truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.student_id}{s.class && ` · ${s.class}`}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Guardian</p>
                            <p className="text-sm truncate">{s.guardian_name || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            {s.guardian_email
                              ? <p className="text-sm text-blue-600 truncate">{s.guardian_email}</p>
                              : <p className="text-xs text-orange-500 italic">No email on file</p>
                            }
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="text-sm">{s.guardian_phone || '—'}</p>
                          </div>
                        </div>

                        {s.guardian_email ? (
                          <Button
                            size="sm"
                            disabled={creatingForId === s.student_id}
                            onClick={() => createForStudent(s)}
                          >
                            {creatingForId === s.student_id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <><UserPlus className="h-3 w-3 mr-1" />Create Account</>
                            }
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant={manualFormId === s.student_id ? 'secondary' : 'outline'}
                            onClick={() => {
                              if (manualFormId === s.student_id) {
                                setManualFormId(null);
                              } else {
                                setManualFormId(s.student_id);
                                setManualForm({
                                  email: '',
                                  first_name: s.guardian_name?.split(' ')[0] ?? '',
                                  last_name: s.guardian_name?.split(' ').slice(1).join(' ') ?? '',
                                  phone_number: s.guardian_phone ?? '',
                                  relationship: 'Guardian',
                                });
                              }
                            }}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            {manualFormId === s.student_id ? 'Cancel' : 'Add Parent'}
                          </Button>
                        )}
                      </div>

                      {/* Inline form for students without a guardian email */}
                      {manualFormId === s.student_id && (
                        <div className="border-t mt-3 pt-3 space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Parent / Guardian Details
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Email <span className="text-red-500">*</span></Label>
                              <Input
                                className="h-8 text-sm"
                                type="email"
                                placeholder="parent@example.com"
                                value={manualForm.email}
                                onChange={e => setManualForm(f => ({ ...f, email: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Relationship</Label>
                              <Input
                                className="h-8 text-sm"
                                placeholder="Mother / Father / Guardian"
                                value={manualForm.relationship}
                                onChange={e => setManualForm(f => ({ ...f, relationship: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">First Name</Label>
                              <Input
                                className="h-8 text-sm"
                                placeholder="First name"
                                value={manualForm.first_name}
                                onChange={e => setManualForm(f => ({ ...f, first_name: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Last Name</Label>
                              <Input
                                className="h-8 text-sm"
                                placeholder="Last name"
                                value={manualForm.last_name}
                                onChange={e => setManualForm(f => ({ ...f, last_name: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Phone (optional)</Label>
                              <Input
                                className="h-8 text-sm"
                                placeholder="+233 ..."
                                value={manualForm.phone_number}
                                onChange={e => setManualForm(f => ({ ...f, phone_number: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              disabled={!manualForm.email.trim() || creatingForId === s.student_id}
                              onClick={() => createForStudent(s, manualForm)}
                            >
                              {creatingForId === s.student_id
                                ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Creating…</>
                                : <><UserPlus className="h-3 w-3 mr-1" />Create Parent Account</>
                              }
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setManualFormId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ---- Existing parent accounts ---- */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" /> Existing Parent Accounts
                </CardTitle>
                <Button size="sm" variant="outline" onClick={loadParents} disabled={accountsLoading}>
                  <RefreshCw className={`h-3 w-3 mr-1 ${accountsLoading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {accountsLoading ? (
                <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
              ) : parents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No parent accounts yet. They are created automatically when students are added with a guardian email.
                </div>
              ) : (
                <div className="space-y-3">
                  {parents.map(parent => (
                    <div key={parent.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{parent.name}</span>
                            <Badge variant={parent.is_active ? 'default' : 'secondary'} className="text-xs">
                              {parent.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {parent.role && parent.role !== 'PARENT' && (
                              <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">
                                {parent.role.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {parent.email} {parent.phone_number && `· ${parent.phone_number}`}
                          </p>

                          {/* Children */}
                          <div className="mt-3 space-y-1">
                            {parent.children.length === 0 && (
                              <p className="text-xs text-muted-foreground italic">No children linked</p>
                            )}
                            {parent.children.map(child => (
                              <div key={child.link_id} className="flex items-center gap-2 text-sm bg-muted/40 rounded px-3 py-1.5">
                                <GraduationCap className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="font-medium">{child.student_name}</span>
                                <span className="text-muted-foreground text-xs">({child.student_id})</span>
                                {child.class && <span className="text-muted-foreground text-xs">· {child.class}</span>}
                                <span className="text-xs text-blue-600 ml-1">{child.relationship}</span>
                                {child.is_primary_guardian && <Badge variant="outline" className="text-xs py-0">Primary</Badge>}
                                <button
                                  className="ml-auto text-red-500 hover:text-red-700"
                                  onClick={() => unlinkChild(child.link_id)}
                                  title="Remove link"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Link child inline form */}
                          {linkingParentId === parent.id ? (
                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                              <Input
                                className="h-8 w-36 text-sm"
                                placeholder="Student ID"
                                value={linkStudentId}
                                onChange={e => setLinkStudentId(e.target.value.toUpperCase())}
                              />
                              <Input
                                className="h-8 w-32 text-sm"
                                placeholder="Relationship"
                                value={linkRelationship}
                                onChange={e => setLinkRelationship(e.target.value)}
                              />
                              <Button size="sm" className="h-8" onClick={() => linkChild(parent.id)} disabled={linkSaving}>
                                {linkSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Link'}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8" onClick={() => setLinkingParentId(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <button
                              className="mt-2 text-xs text-primary flex items-center gap-1 hover:underline"
                              onClick={() => { setLinkingParentId(parent.id); setLinkStudentId(''); setLinkRelationship('Guardian'); }}
                            >
                              <Link2 className="h-3 w-3" /> Link another child
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => { setResetResult(null); setViewParent(parent); }}
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => deleteParent(parent.id, parent.name, parent.role)}
                            title="Delete account"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================================================================
          Parent detail modal
          ================================================================ */}
      {viewParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => { setViewParent(null); setResetResult(null); }}>
          <Card className="w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    {viewParent.name}
                  </CardTitle>
                  <Badge
                    variant={viewParent.is_active ? 'default' : 'secondary'}
                    className="mt-1.5 text-xs"
                  >
                    {viewParent.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {viewParent.role && viewParent.role !== 'PARENT' && (
                    <Badge variant="outline" className="mt-1.5 ml-1 text-xs border-amber-400 text-amber-700">
                      Also: {viewParent.role.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setViewParent(null); setResetResult(null); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact info */}
              <div className="rounded-lg bg-muted/40 border p-3 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Contact Information</h4>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{viewParent.email || <span className="italic text-muted-foreground">No email</span>}</span>
                  {viewParent.email && (
                    <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => copyToClipboard(viewParent.email, 'view-email')}>
                      {copiedField === 'view-email' ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
                {viewParent.phone_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{viewParent.phone_number}</span>
                    <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => copyToClipboard(viewParent.phone_number, 'view-phone')}>
                      {copiedField === 'view-phone' ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Credentials */}
              <div className="rounded-lg bg-muted/40 border p-3 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Portal Credentials</h4>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Login Email</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background border rounded px-3 py-1.5 text-sm font-mono">{viewParent.email}</code>
                    <button className="text-muted-foreground hover:text-foreground" onClick={() => copyToClipboard(viewParent.email, 'cred-email')}>
                      {copiedField === 'cred-email' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {resetResult ? (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">New Password</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-background border rounded px-3 py-1.5 text-sm font-mono">{resetResult.new_password}</code>
                      <button className="text-muted-foreground hover:text-foreground" onClick={() => copyToClipboard(resetResult!.new_password, 'cred-pass')}>
                        {copiedField === 'cred-pass' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded p-2">
                      Save this password now — it will not be shown again.
                    </p>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={resettingPassword}
                    onClick={() => resetParentPassword(viewParent.id)}
                  >
                    {resettingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <EyeOff className="h-3.5 w-3.5 mr-1" />}
                    Reset Password
                  </Button>
                )}
              </div>

              {/* Linked children */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Linked Children ({viewParent.children.length})
                </h4>
                {viewParent.children.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-4">No children linked to this account</p>
                ) : (
                  <div className="space-y-2">
                    {viewParent.children.map(child => (
                      <div key={child.link_id} className="rounded-lg border bg-card p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                            <div>
                              <p className="font-semibold text-sm">{child.student_name}</p>
                              <p className="text-xs text-muted-foreground">{child.student_id}{child.class ? ` · ${child.class}` : ''}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {child.is_primary_guardian && (
                              <Badge variant="outline" className="text-xs py-0">Primary</Badge>
                            )}
                            <Badge variant="secondary" className="text-xs py-0">{child.relationship}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setViewParent(null);
                    setLinkingParentId(viewParent.id);
                    setLinkStudentId('');
                    setLinkRelationship('Guardian');
                  }}
                >
                  <Link2 className="h-4 w-4 mr-1" /> Link Child
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => { setViewParent(null); deleteParent(viewParent.id, viewParent.name, viewParent.role); }}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================================================================
          Generated credentials modal
          ================================================================ */}
      {generatedCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" /> Parent Account Created
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                An account has been created for <strong>{generatedCreds.parent_name}</strong> (guardian of <strong>{generatedCreds.student_name}</strong>).
                Share the login details below with them.
              </p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Email / Username</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">{generatedCreds.email}</code>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyToClipboard(generatedCreds.email, 'email')}>
                      {copiedField === 'email' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {generatedCreds.password ? (
                  <div>
                    <Label className="text-xs text-muted-foreground">Generated Password</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">{generatedCreds.password}</code>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyToClipboard(generatedCreds.password!, 'pass')}>
                        {copiedField === 'pass' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription className="text-xs">
                      This guardian's email already had an account — they were just linked to the student. No new password was generated.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded p-2">
                Save this password now — it will not be shown again. The parent should change it after first login.
              </p>
              <Button className="w-full" onClick={() => setGeneratedCreds(null)}>Done</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ParentPortalSettings;

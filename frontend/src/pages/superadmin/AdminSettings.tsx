import { useEffect, useState } from 'react';
import {
  Settings, Globe, Shield, Bell, Database, Key, Save, Loader2,
  RefreshCw, AlertTriangle, CheckCircle, ToggleLeft, ToggleRight,
  Mail, MessageSquare, Clock, Users, Lock, Eye, EyeOff, Zap, Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import secureApiClient from '@/lib/secureApiClient';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Settings {
  platformName: string;
  supportEmail: string;
  maxSchools: string;
  maintenanceMode: boolean;
  registrationOpen: boolean;
  emailNotifications: boolean;
  smsAlerts: boolean;
  auditLogging: boolean;
  twoFactorRequired: boolean;
  sessionTimeout: string;
  apiRateLimit: string;
  passwordMinLength: string;
  allowPasswordReset: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smsProvider: string;
  smsApiKey: string;
  dbBackupEnabled: boolean;
  dbBackupInterval: string;
  maxFileUploadMb: string;
}

// ── Sub-components ────────────────────────────────────────────────────────────
const Toggle = ({ enabled, onChange, disabled }: { enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
      enabled ? 'bg-blue-600' : 'bg-slate-700'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const Field = ({
  label, description, children, danger
}: {
  label: string; description?: string; children: React.ReactNode; danger?: boolean
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 py-3 border-b border-slate-800/40 last:border-0">
    <div className="sm:w-64 shrink-0">
      <p className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-slate-200'}`}>{label}</p>
      {description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

const SectionCard = ({
  icon: Icon, title, subtitle, accent, children
}: {
  icon: any; title: string; subtitle: string;
  accent: { gradient: string; border: string; bg: string; iconColor: string; topBar: string };
  children: React.ReactNode;
}) => (
  <div className={`relative rounded-2xl border ${accent.border} bg-slate-900/60 backdrop-blur-sm overflow-hidden`}>
    <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accent.topBar} opacity-60`} />
    <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800/50 bg-slate-800/20">
      <div className={`p-2 rounded-xl ${accent.bg} border ${accent.border}`}>
        <Icon className={`h-4 w-4 ${accent.iconColor}`} />
      </div>
      <div>
        <h2 className="font-semibold text-white text-sm">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
    <div className="px-5 py-1">{children}</div>
  </div>
);

const inputCls = "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 h-9 text-sm";

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminSettings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [showSmsKey, setShowSmsKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'integrations' | 'system'>('general');

  const [settings, setSettings] = useState<Settings>({
    platformName: 'SmartGES',
    supportEmail: 'oelshadai565@gmail.com',
    maxSchools: '500',
    maintenanceMode: false,
    registrationOpen: true,
    emailNotifications: true,
    smsAlerts: false,
    auditLogging: true,
    twoFactorRequired: false,
    sessionTimeout: '60',
    apiRateLimit: '1000',
    passwordMinLength: '8',
    allowPasswordReset: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smsProvider: 'Arkesel',
    smsApiKey: '',
    dbBackupEnabled: true,
    dbBackupInterval: '24',
    maxFileUploadMb: '10',
  });

  useEffect(() => {
    secureApiClient.get<any>('/auth/superadmin/settings/').then((data) => {
      setSettings(current => ({
        ...current,
        platformName: data.platform_name ?? current.platformName,
        supportEmail: data.support_email ?? current.supportEmail,
        maxSchools: String(data.max_schools ?? current.maxSchools),
        maintenanceMode: data.maintenance_mode ?? current.maintenanceMode,
        registrationOpen: data.registration_open ?? current.registrationOpen,
        emailNotifications: data.email_notifications ?? current.emailNotifications,
        smsAlerts: data.sms_alerts ?? current.smsAlerts,
        auditLogging: data.audit_logging ?? current.auditLogging,
        twoFactorRequired: data.two_factor_required ?? current.twoFactorRequired,
        sessionTimeout: String(data.session_timeout_minutes ?? current.sessionTimeout),
        apiRateLimit: String(data.api_rate_limit ?? current.apiRateLimit),
        passwordMinLength: String(data.password_min_length ?? current.passwordMinLength),
        allowPasswordReset: data.allow_password_reset ?? current.allowPasswordReset,
        dbBackupEnabled: data.db_backup_enabled ?? current.dbBackupEnabled,
        dbBackupInterval: String(data.db_backup_interval_hours ?? current.dbBackupInterval),
        maxFileUploadMb: String(data.max_file_upload_mb ?? current.maxFileUploadMb),
      }));
    }).catch((error: any) => {
      toast({ title: 'Could not load settings', description: error.message, variant: 'destructive' });
    });
  }, []);

  const set = (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings(s => ({ ...s, [key]: e.target.value }));

  const toggle = (key: keyof Settings) => (v: boolean) =>
    setSettings(s => ({ ...s, [key]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await secureApiClient.patch('/auth/superadmin/settings/', {
        platform_name: settings.platformName,
        support_email: settings.supportEmail,
        max_schools: Number(settings.maxSchools),
        maintenance_mode: settings.maintenanceMode,
        registration_open: settings.registrationOpen,
        email_notifications: settings.emailNotifications,
        sms_alerts: settings.smsAlerts,
        audit_logging: settings.auditLogging,
        two_factor_required: settings.twoFactorRequired,
        session_timeout_minutes: Number(settings.sessionTimeout),
        api_rate_limit: Number(settings.apiRateLimit),
        password_min_length: Number(settings.passwordMinLength),
        allow_password_reset: settings.allowPasswordReset,
        db_backup_enabled: settings.dbBackupEnabled,
        db_backup_interval_hours: Number(settings.dbBackupInterval),
        max_file_upload_mb: Number(settings.maxFileUploadMb),
      });
      toast({ title: 'Settings saved', description: 'Platform configuration has been updated successfully.' });
    } catch (error: any) {
      toast({ title: 'Could not save settings', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'general',       label: 'General',       icon: Globe },
    { key: 'security',      label: 'Security',      icon: Shield },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'integrations',  label: 'Integrations',  icon: Zap },
    { key: 'system',        label: 'System',        icon: Server },
  ] as const;

  const accents = {
    blue:   { gradient: 'from-blue-500 to-cyan-400',    border: 'border-blue-500/20',   bg: 'bg-blue-500/10',   iconColor: 'text-blue-400',   topBar: 'from-blue-500 to-cyan-400' },
    red:    { gradient: 'from-red-500 to-orange-400',   border: 'border-red-500/20',    bg: 'bg-red-500/10',    iconColor: 'text-red-400',    topBar: 'from-red-500 to-orange-400' },
    purple: { gradient: 'from-purple-500 to-violet-400',border: 'border-purple-500/20', bg: 'bg-purple-500/10', iconColor: 'text-purple-400', topBar: 'from-purple-500 to-violet-400' },
    amber:  { gradient: 'from-amber-500 to-yellow-400', border: 'border-amber-500/20',  bg: 'bg-amber-500/10',  iconColor: 'text-amber-400',  topBar: 'from-amber-500 to-yellow-400' },
    green:  { gradient: 'from-green-500 to-emerald-400',border: 'border-green-500/20',  bg: 'bg-green-500/10',  iconColor: 'text-green-400',  topBar: 'from-green-500 to-emerald-400' },
    cyan:   { gradient: 'from-cyan-500 to-sky-400',     border: 'border-cyan-500/20',   bg: 'bg-cyan-500/10',   iconColor: 'text-cyan-400',   topBar: 'from-cyan-500 to-sky-400' },
    slate:  { gradient: 'from-slate-500 to-slate-400',  border: 'border-slate-700/50',  bg: 'bg-slate-700/30',  iconColor: 'text-slate-400',  topBar: 'from-slate-600 to-slate-500' },
  };

  return (
    <div className="flex flex-col w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-full relative">
      {/* Background effects */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      <div className="hidden sm:block absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
            <p className="text-slate-400 text-sm mt-0.5">Platform-wide configuration and preferences</p>
          </div>
          <div className="flex items-center gap-2">
            {settings.maintenanceMode && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs text-amber-400 font-medium">Maintenance Mode ON</span>
              </div>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white gap-2 shadow-lg shadow-blue-500/20"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Maintenance Mode Banner */}
        {settings.maintenanceMode && (
          <div className="relative rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm p-4 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 opacity-60" />
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-300 text-sm">Maintenance Mode is Active</h3>
                <p className="text-xs text-amber-400/80 mt-0.5">All non-admin users are currently blocked from accessing the platform.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 flex-1 justify-center ${
                activeTab === key
                  ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border border-blue-500/30 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── GENERAL ── */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <SectionCard icon={Globe} title="Platform" subtitle="Core platform identity and access" accent={accents.blue}>
              <Field label="Platform Name" description="Displayed across the UI and emails">
                <Input value={settings.platformName} onChange={set('platformName')} className={inputCls} placeholder="SmartGES" />
              </Field>
              <Field label="Support Email" description="Receives user support requests">
                <Input value={settings.supportEmail} onChange={set('supportEmail')} className={inputCls} placeholder="support@example.com" />
              </Field>
              <Field label="Max Schools" description="Maximum number of schools allowed to register">
                <Input type="number" value={settings.maxSchools} onChange={set('maxSchools')} className={`${inputCls} w-32`} />
              </Field>
            </SectionCard>

            <SectionCard icon={Users} title="Access Control" subtitle="Registration and platform availability" accent={accents.purple}>
              <Field label="Open Registration" description="Allow new schools to self-register on the platform">
                <div className="flex items-center gap-3">
                  <Toggle enabled={settings.registrationOpen} onChange={toggle('registrationOpen')} />
                  <Badge className={settings.registrationOpen ? 'bg-green-500/20 text-green-400 border border-green-500/30 text-xs' : 'bg-slate-700/50 text-slate-400 border border-slate-600 text-xs'}>
                    {settings.registrationOpen ? 'Open' : 'Closed'}
                  </Badge>
                </div>
              </Field>
              <Field label="Maintenance Mode" description="Block all non-admin access to the platform" danger={settings.maintenanceMode}>
                <div className="flex items-center gap-3">
                  <Toggle enabled={settings.maintenanceMode} onChange={toggle('maintenanceMode')} />
                  <Badge className={settings.maintenanceMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs' : 'bg-slate-700/50 text-slate-400 border border-slate-600 text-xs'}>
                    {settings.maintenanceMode ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </Field>
            </SectionCard>
          </div>
        )}

        {/* ── SECURITY ── */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <SectionCard icon={Lock} title="Authentication" subtitle="Login and session security policies" accent={accents.red}>
              <Field label="Require 2FA" description="Enforce two-factor authentication for all admin accounts">
                <div className="flex items-center gap-3">
                  <Toggle enabled={settings.twoFactorRequired} onChange={toggle('twoFactorRequired')} />
                  <Badge className={settings.twoFactorRequired ? 'bg-green-500/20 text-green-400 border border-green-500/30 text-xs' : 'bg-slate-700/50 text-slate-400 border border-slate-600 text-xs'}>
                    {settings.twoFactorRequired ? 'Enforced' : 'Optional'}
                  </Badge>
                </div>
              </Field>
              <Field label="Allow Password Reset" description="Let users reset their password via email">
                <Toggle enabled={settings.allowPasswordReset} onChange={toggle('allowPasswordReset')} />
              </Field>
              <Field label="Minimum Password Length" description="Minimum characters required for all passwords">
                <Input type="number" value={settings.passwordMinLength} onChange={set('passwordMinLength')} className={`${inputCls} w-24`} min={6} max={32} />
              </Field>
              <Field label="Session Timeout (minutes)" description="Auto-logout users after this period of inactivity">
                <Input type="number" value={settings.sessionTimeout} onChange={set('sessionTimeout')} className={`${inputCls} w-24`} />
              </Field>
            </SectionCard>

            <SectionCard icon={Eye} title="Audit & Monitoring" subtitle="Track and log platform activity" accent={accents.amber}>
              <Field label="Audit Logging" description="Record all admin actions and system events">
                <div className="flex items-center gap-3">
                  <Toggle enabled={settings.auditLogging} onChange={toggle('auditLogging')} />
                  <Badge className={settings.auditLogging ? 'bg-green-500/20 text-green-400 border border-green-500/30 text-xs' : 'bg-red-500/20 text-red-400 border border-red-500/30 text-xs'}>
                    {settings.auditLogging ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </Field>
              <Field label="API Rate Limit (req/min)" description="Maximum API requests per IP per minute">
                <Input type="number" value={settings.apiRateLimit} onChange={set('apiRateLimit')} className={`${inputCls} w-32`} />
              </Field>
            </SectionCard>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <SectionCard icon={Mail} title="Email Notifications" subtitle="System-generated email alerts" accent={accents.blue}>
              <Field label="Email Notifications" description="Send automated emails for key system events">
                <div className="flex items-center gap-3">
                  <Toggle enabled={settings.emailNotifications} onChange={toggle('emailNotifications')} />
                  <Badge className={settings.emailNotifications ? 'bg-green-500/20 text-green-400 border border-green-500/30 text-xs' : 'bg-slate-700/50 text-slate-400 border border-slate-600 text-xs'}>
                    {settings.emailNotifications ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </Field>
            </SectionCard>

            <SectionCard icon={MessageSquare} title="SMS Notifications" subtitle="Text message alerts via Arkesel" accent={accents.green}>
              <Field label="SMS Alerts" description="Send SMS notifications to school admins and parents">
                <div className="flex items-center gap-3">
                  <Toggle enabled={settings.smsAlerts} onChange={toggle('smsAlerts')} />
                  <Badge className={settings.smsAlerts ? 'bg-green-500/20 text-green-400 border border-green-500/30 text-xs' : 'bg-slate-700/50 text-slate-400 border border-slate-600 text-xs'}>
                    {settings.smsAlerts ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </Field>
            </SectionCard>
          </div>
        )}

        {/* ── INTEGRATIONS ── */}
        {activeTab === 'integrations' && (
          <div className="space-y-4">
            <SectionCard icon={Mail} title="SMTP / Email" subtitle="Outbound email delivery configuration" accent={accents.blue}>
              <Field label="SMTP Host" description="Mail server hostname">
                <Input value={settings.smtpHost} onChange={set('smtpHost')} className={inputCls} placeholder="smtp.gmail.com" />
              </Field>
              <Field label="SMTP Port">
                <Input type="number" value={settings.smtpPort} onChange={set('smtpPort')} className={`${inputCls} w-28`} placeholder="587" />
              </Field>
              <Field label="SMTP Username">
                <Input value={settings.smtpUser} onChange={set('smtpUser')} className={inputCls} placeholder="your-email@gmail.com" />
              </Field>
              <Field label="SMTP Password">
                <div className="relative">
                  <Input
                    type={showSmtpPass ? 'text' : 'password'}
                    value={settings.smtpPassword}
                    onChange={set('smtpPassword')}
                    className={`${inputCls} pr-10`}
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showSmtpPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
            </SectionCard>

            <SectionCard icon={MessageSquare} title="SMS Provider" subtitle="Arkesel SMS gateway configuration" accent={accents.green}>
              <Field label="Provider" description="SMS gateway service">
                <Input value={settings.smsProvider} onChange={set('smsProvider')} className={inputCls} placeholder="Arkesel" />
              </Field>
              <Field label="API Key" description="Your Arkesel API key">
                <div className="relative">
                  <Input
                    type={showSmsKey ? 'text' : 'password'}
                    value={settings.smsApiKey}
                    onChange={set('smsApiKey')}
                    className={`${inputCls} pr-10`}
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmsKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showSmsKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
            </SectionCard>
          </div>
        )}

        {/* ── SYSTEM ── */}
        {activeTab === 'system' && (
          <div className="space-y-4">
            <SectionCard icon={Database} title="Database & Backups" subtitle="Automated backup configuration" accent={accents.cyan}>
              <Field label="Automated Backups" description="Periodically back up the database">
                <div className="flex items-center gap-3">
                  <Toggle enabled={settings.dbBackupEnabled} onChange={toggle('dbBackupEnabled')} />
                  <Badge className={settings.dbBackupEnabled ? 'bg-green-500/20 text-green-400 border border-green-500/30 text-xs' : 'bg-slate-700/50 text-slate-400 border border-slate-600 text-xs'}>
                    {settings.dbBackupEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </Field>
              <Field label="Backup Interval (hours)" description="How often to run automated backups">
                <Input
                  type="number"
                  value={settings.dbBackupInterval}
                  onChange={set('dbBackupInterval')}
                  disabled={!settings.dbBackupEnabled}
                  className={`${inputCls} w-24`}
                />
              </Field>
            </SectionCard>

            <SectionCard icon={Server} title="Storage & Uploads" subtitle="File handling limits" accent={accents.purple}>
              <Field label="Max File Upload Size (MB)" description="Maximum allowed file size per upload">
                <Input type="number" value={settings.maxFileUploadMb} onChange={set('maxFileUploadMb')} className={`${inputCls} w-24`} />
              </Field>
            </SectionCard>

            {/* Danger Zone */}
            <div className="relative rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-400 opacity-60" />
              <div className="flex items-center gap-3 px-5 py-4 border-b border-red-500/10 bg-red-500/5">
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-red-400 text-sm">Danger Zone</h2>
                  <p className="text-xs text-slate-500">Irreversible actions — proceed with caution</p>
                </div>
              </div>
              <div className="px-5 py-4 space-y-3">
                {[
                  { label: 'Clear Audit Logs', sub: 'Permanently delete all audit log entries', btnLabel: 'Clear Logs', btnClass: 'border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50' },
                  { label: 'Reset Platform Settings', sub: 'Restore all settings to factory defaults', btnLabel: 'Reset', btnClass: 'border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50' },
                ].map(action => (
                  <div key={action.label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{action.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{action.sub}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`shrink-0 bg-transparent ${action.btnClass}`}
                      onClick={() => toast({ title: 'Confirmation required', description: 'This feature requires additional confirmation.', variant: 'destructive' })}
                    >
                      {action.btnLabel}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Save footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle className="h-3.5 w-3.5 text-slate-600" />
            Changes are applied immediately after saving
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white gap-2 shadow-lg shadow-blue-500/20"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

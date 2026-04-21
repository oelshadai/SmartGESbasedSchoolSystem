import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { secureApiClient } from '@/lib/secureApiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  User, Mail, Phone, School, GraduationCap, KeyRound,
  Eye, EyeOff, Loader2, ShieldCheck,
} from 'lucide-react';

interface ChildInfo { student_id: string; name: string; relationship: string; }

const ParentProfile = () => {
  const user = useAuthStore((s) => s.user);
  const children: ChildInfo[] = (user as any)?.children || [];

  // Change password form
  const [oldPassword, setOldPassword]     = useState('');
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld]             = useState(false);
  const [showNew, setShowNew]             = useState(false);
  const [saving, setSaving]               = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await secureApiClient.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      toast.success('Password changed successfully');
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.response?.data?.detail || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const fullName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.email || 'Parent'
    : 'Parent';

  return (
    <div className="space-y-6 p-4 sm:p-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Your account details and linked children</p>
      </div>

      {/* Profile card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar initials */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
              <span className="text-white text-xl font-bold">
                {(user?.first_name?.[0] ?? user?.email?.[0] ?? 'P').toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-lg">{fullName}</p>
              <Badge variant="secondary" className="text-xs mt-0.5">
                <ShieldCheck className="h-3 w-3 mr-1" /> Parent / Guardian
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email
              </Label>
              <p className="text-sm font-medium">{user?.email || '—'}</p>
            </div>
            {(user as any)?.phone_number && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone
                </Label>
                <p className="text-sm font-medium">{(user as any).phone_number}</p>
              </div>
            )}
            {user?.school && (
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <School className="h-3 w-3" /> School
                </Label>
                <p className="text-sm font-medium">{user.school.name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Linked children */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> Linked Children ({children.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {children.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No children linked to your account. Contact the school admin.
            </p>
          ) : (
            <div className="space-y-2">
              {children.map(c => (
                <div key={c.student_id} className="flex items-center gap-3 rounded-lg border px-4 py-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.student_id}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{c.relationship}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="old-pass" className="text-sm">Current Password</Label>
            <div className="relative">
              <Input
                id="old-pass"
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowOld(v => !v)}
              >
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-pass" className="text-sm">New Password</Label>
            <div className="relative">
              <Input
                id="new-pass"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowNew(v => !v)}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-pass" className="text-sm">Confirm New Password</Label>
            <Input
              id="confirm-pass"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={saving || !oldPassword || !newPassword || !confirmPassword}
            className="w-full sm:w-auto"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentProfile;

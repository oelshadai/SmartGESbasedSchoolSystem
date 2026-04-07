import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, User, BookOpen, Loader2, AlertCircle, Clock } from 'lucide-react';
import { teacherService, type TeacherProfile, type UpdateTeacherProfile, type ChangePasswordRequest } from '@/services/teacherService';
import { secureApiClient } from '@/lib/secureApiClient';
import { useAuthStore } from '@/stores/authStore';

const TeacherProfile = () => {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  
  // Form states
  const [formData, setFormData] = useState<UpdateTeacherProfile>({
    first_name: '',
    last_name: '',
    phone_number: '',
    emergency_contact: '',
    address: '',
    qualification: ''
  });
  
  const [passwordData, setPasswordData] = useState<ChangePasswordRequest>({
    current_password: '',
    new_password: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const [profileData, pendingRes] = await Promise.all([
        teacherService.getProfile(),
        secureApiClient.get('/students/auth/teacher-pending-profile-change/').catch(() => null),
      ]);
      setProfile(profileData);
      setPendingRequest(pendingRes ?? null);
      
      // Initialize form data
      setFormData({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone_number: profileData.phone_number || '',
        emergency_contact: profileData.emergency_contact || '',
        address: profileData.address || '',
        qualification: profileData.qualification || ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await secureApiClient.post('/students/auth/teacher-request-profile-change/', formData);
      setSuccess('Change request submitted — awaiting admin approval.');
      setPendingRequest({ requested_changes: formData, created_at: new Date().toISOString() });
      
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit change request');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (passwordData.new_password !== confirmPassword) {
        setError('New passwords do not match');
        return;
      }
      
      if (passwordData.new_password.length < 8) {
        setError('New password must be at least 8 characters long');
        return;
      }
      
      setChangingPassword(true);
      setError('');
      setSuccess('');
      
      await teacherService.changePassword(passwordData);
      setSuccess('Password changed successfully!');
      
      // Clear password fields
      setPasswordData({ current_password: '', new_password: '' });
      setConfirmPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-center">
        <div>
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground mb-4">Unable to load your profile information.</p>
          <Button onClick={loadProfile}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">View and update your profile information</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">
          {success}
        </div>
      )}

      <div className="stat-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
            {getInitials(profile.first_name, profile.last_name)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{profile.full_name}</h2>
            <p className="text-muted-foreground">Teacher · {user?.school?.name || 'School'}</p>
            <p className="text-xs text-muted-foreground mt-1">Joined: {formatDate(profile.hire_date)}</p>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            Profile Information
          </h3>
          {pendingRequest && (
            <Alert className="border-amber-200 bg-amber-50 py-2 px-3">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-xs">
                Profile update <strong>pending admin approval</strong>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <User className="h-4 w-4" /> Personal Information
          </h3>
          <div className="space-y-3">
            <div>
              <Label>First Name</Label>
              <Input 
                value={formData.first_name} 
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input 
                value={formData.last_name} 
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input 
                value={formData.phone_number} 
                onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Emergency Contact</Label>
              <Input 
                value={formData.emergency_contact} 
                onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea 
                value={formData.address} 
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="mt-1" 
              />
            </div>
          </div>
        </div>

        <div className="stat-card space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Teaching Details
          </h3>
          <div className="space-y-3">
            <div>
              <Label>Email</Label>
              <Input value={profile.email} disabled className="mt-1" />
            </div>
            <div>
              <Label>Employee ID</Label>
              <Input value={profile.employee_id} disabled className="mt-1" />
            </div>
            <div>
              <Label>Qualification</Label>
              <Input 
                value={formData.qualification} 
                onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Experience (Years)</Label>
              <Input value={profile.experience_years.toString()} disabled className="mt-1" />
            </div>
            <div>
              <Label>Specializations</Label>
              <Input 
                value={profile.specializations_detail.map(s => s.name).join(', ') || 'None'} 
                disabled 
                className="mt-1" 
              />
            </div>
            {profile.assigned_class && (
              <div>
                <Label>Assigned Class</Label>
                <Input value={profile.assigned_class} disabled className="mt-1" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="stat-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Change Password</h3>
          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">No approval needed</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Current Password</Label>
            <Input 
              type="password" 
              value={passwordData.current_password}
              onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
              className="mt-1" 
            />
          </div>
          <div>
            <Label>New Password</Label>
            <Input 
              type="password" 
              value={passwordData.new_password}
              onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
              className="mt-1" 
            />
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1" 
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={handleChangePassword}
            disabled={changingPassword || !passwordData.current_password || !passwordData.new_password || !confirmPassword}
            variant="outline"
          >
            {changingPassword ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Change Password
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Changes will be reviewed by admin before taking effect.</p>
        <Button onClick={handleSaveProfile} disabled={saving || !!pendingRequest}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? 'Submitting…' : pendingRequest ? 'Request Pending' : 'Request Changes'}
        </Button>
      </div>
    </div>
  );
};

export default TeacherProfile;

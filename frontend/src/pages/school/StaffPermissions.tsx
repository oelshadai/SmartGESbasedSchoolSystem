import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Shield, DollarSign, CalendarDays, Plus, Trash2, Loader2,
  UserCheck, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { staffPermissionService, type StaffPermission, type TeacherListItem } from '@/services/staffPermissionService';
import { feeService, type FeeType } from '@/services/feeService';
import { secureApiClient } from '@/lib/secureApiClient';
import { useAuthStore } from '@/stores/authStore';

interface ClassItem {
  id: number;
  full_name: string;
  level: string;
}

type Tab = 'fee' | 'cover';

const StaffPermissions = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('fee');

  // School master toggle
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [masterToggling, setMasterToggling] = useState(false);

  // Data
  const [permissions, setPermissions] = useState<StaffPermission[]>([]);
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form state
  const [addingFee, setAddingFee] = useState(false);
  const [addingCover, setAddingCover] = useState(false);
  const [newFeeTeacherId, setNewFeeTeacherId] = useState('');
  const [newFeeTypeIds, setNewFeeTypeIds] = useState<number[]>([]);
  const [newCoverTeacherId, setNewCoverTeacherId] = useState('');
  const [newCoverClassIds, setNewCoverClassIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // Expanded rows
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [perms, tList, ftList, clsList, schoolData] = await Promise.all([
        staffPermissionService.list(),
        staffPermissionService.getTeachersList(),
        feeService.getFeeTypes(),
        secureApiClient.get('/schools/classes/'),
        secureApiClient.get('/schools/settings/'),
      ]);
      setPermissions(Array.isArray(perms) ? perms : (perms as any).results || []);
      setTeachers(Array.isArray(tList) ? tList : []);
      setFeeTypes((Array.isArray(ftList) ? ftList : []).filter((f: FeeType) => f.is_active && !f.parent_fee_type));
      const clsArray = Array.isArray(clsList) ? clsList : (clsList as any).results || [];
      setClasses(clsArray);
      setMasterEnabled((schoolData as any).special_fee_collection_enabled ?? true);
    } catch (e: any) {
      toast.error('Failed to load staff permissions');
    } finally {
      setLoading(false);
    }
  };

  const toggleMaster = async (val: boolean) => {
    setMasterToggling(true);
    try {
      await staffPermissionService.toggleSchoolMaster(val);
      setMasterEnabled(val);
      toast.success(val ? 'Fee collection enabled for special teachers' : 'Fee collection disabled school-wide');
    } catch {
      toast.error('Failed to update master toggle');
    } finally {
      setMasterToggling(false);
    }
  };

  const toggleTeacherFee = async (perm: StaffPermission, val: boolean) => {
    try {
      await staffPermissionService.toggleTeacher(perm.id, val);
      setPermissions(prev => prev.map(p => p.id === perm.id ? { ...p, fee_collection_enabled: val } : p));
      toast.success(`Fee collection ${val ? 'enabled' : 'disabled'} for ${perm.teacher_name}`);
    } catch {
      toast.error('Failed to toggle');
    }
  };

  const toggleFeeTypeSelection = (id: number, arr: number[], setter: (v: number[]) => void) => {
    setter(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
  };

  const toggleClassSelection = (id: number, arr: number[], setter: (v: number[]) => void) => {
    setter(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
  };

  const assignFeeCollector = async () => {
    if (!newFeeTeacherId) { toast.error('Select a teacher'); return; }
    setSaving(true);
    try {
      const existing = permissions.find(p => String(p.teacher) === newFeeTeacherId);
      if (existing) {
        await staffPermissionService.update(existing.id, {
          can_collect_fees: true,
          fee_collection_enabled: true,
          collect_fee_type_ids: newFeeTypeIds,
        });
      } else {
        await staffPermissionService.create({
          teacher: parseInt(newFeeTeacherId),
          can_collect_fees: true,
          fee_collection_enabled: true,
          collect_fee_type_ids: newFeeTypeIds,
          can_cover_attendance: false,
          cover_class_ids: [],
        });
      }
      toast.success('Fee collector assigned');
      setAddingFee(false);
      setNewFeeTeacherId('');
      setNewFeeTypeIds([]);
      await loadAll();
    } catch (e: any) {
      toast.error(e.message || 'Failed to assign');
    } finally {
      setSaving(false);
    }
  };

  const assignCoverTeacher = async () => {
    if (!newCoverTeacherId) { toast.error('Select a teacher'); return; }
    if (newCoverClassIds.length === 0) { toast.error('Select at least one class'); return; }
    setSaving(true);
    try {
      const existing = permissions.find(p => String(p.teacher) === newCoverTeacherId);
      if (existing) {
        await staffPermissionService.update(existing.id, {
          can_cover_attendance: true,
          cover_class_ids: newCoverClassIds,
        });
      } else {
        await staffPermissionService.create({
          teacher: parseInt(newCoverTeacherId),
          can_collect_fees: false,
          fee_collection_enabled: false,
          collect_fee_type_ids: [],
          can_cover_attendance: true,
          cover_class_ids: newCoverClassIds,
        });
      }
      toast.success('Cover teacher assigned');
      setAddingCover(false);
      setNewCoverTeacherId('');
      setNewCoverClassIds([]);
      await loadAll();
    } catch (e: any) {
      toast.error(e.message || 'Failed to assign');
    } finally {
      setSaving(false);
    }
  };

  const removePermission = async (perm: StaffPermission) => {
    if (!confirm(`Remove all special permissions for ${perm.teacher_name}?`)) return;
    try {
      await staffPermissionService.remove(perm.id);
      setPermissions(prev => prev.filter(p => p.id !== perm.id));
      toast.success('Permission removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const feePerms = permissions.filter(p => p.can_collect_fees);
  const coverPerms = permissions.filter(p => p.can_cover_attendance);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading staff permissions…
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Staff Permissions</h1>
          <p className="text-sm text-muted-foreground">Assign special fee collection and attendance cover roles to teachers</p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2">
        {([['fee', 'Fee Collectors', <DollarSign className="h-4 w-4" />], ['cover', 'Attendance Cover', <CalendarDays className="h-4 w-4" />]] as const).map(([key, label, icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as Tab)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              activeTab === key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
            }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── FEE COLLECTORS TAB ── */}
      {activeTab === 'fee' && (
        <div className="space-y-4">
          {/* Master toggle */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">School-wide Fee Collection</p>
                  <p className="text-sm text-muted-foreground">
                    Master switch — turn off to remove the Fee Collection page from all special teachers at once
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {masterToggling && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  <Switch
                    checked={masterEnabled}
                    onCheckedChange={toggleMaster}
                    disabled={masterToggling}
                  />
                  <Badge variant={masterEnabled ? 'default' : 'secondary'}>
                    {masterEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* List */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Assigned Fee Collectors ({feePerms.length})
                </CardTitle>
                <Button size="sm" onClick={() => setAddingFee(v => !v)}>
                  <Plus className="h-4 w-4 mr-1" /> Assign Teacher
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Add form */}
              {addingFee && (
                <div className="rounded-lg border border-primary/30 bg-muted/20 p-4 space-y-3">
                  <p className="text-sm font-medium">New Fee Collector</p>
                  <div className="space-y-1">
                    <Label>Teacher</Label>
                    <Select value={newFeeTeacherId} onValueChange={setNewFeeTeacherId}>
                      <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                      <SelectContent>
                        {teachers.map(t => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Fee Types <span className="text-muted-foreground font-normal text-xs">(leave all unchecked = all active types)</span></Label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {feeTypes.map(ft => (
                        <button
                          key={ft.id}
                          type="button"
                          onClick={() => toggleFeeTypeSelection(ft.id, newFeeTypeIds, setNewFeeTypeIds)}
                          className={`px-3 py-1 rounded-full text-xs border font-medium transition-colors ${
                            newFeeTypeIds.includes(ft.id)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-white border-gray-200 hover:border-primary'
                          }`}
                        >
                          {ft.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={assignFeeCollector} disabled={saving}>
                      {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Assign
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAddingFee(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {feePerms.length === 0 && !addingFee && (
                <p className="text-sm text-muted-foreground text-center py-4">No special fee collectors assigned yet.</p>
              )}

              {feePerms.map(perm => {
                const assignedTypes = perm.collect_fee_type_ids.length > 0
                  ? feeTypes.filter(f => perm.collect_fee_type_ids.includes(f.id))
                  : null;
                return (
                  <div key={perm.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{perm.teacher_name}</p>
                        <p className="text-xs text-muted-foreground">{perm.teacher_email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={perm.fee_collection_enabled}
                          onCheckedChange={(v) => toggleTeacherFee(perm, v)}
                        />
                        <Badge variant={perm.fee_collection_enabled ? 'default' : 'secondary'} className="text-xs">
                          {perm.fee_collection_enabled ? 'Active' : 'Off'}
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => removePermission(perm)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {assignedTypes
                        ? assignedTypes.map(f => (
                            <Badge key={f.id} variant="outline" className="text-xs">{f.name}</Badge>
                          ))
                        : <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-300">All fee types</Badge>
                      }
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── ATTENDANCE COVER TAB ── */}
      {activeTab === 'cover' && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Cover Teachers ({coverPerms.length})
              </CardTitle>
              <Button size="sm" onClick={() => setAddingCover(v => !v)}>
                <Plus className="h-4 w-4 mr-1" /> Assign Cover Teacher
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Cover teachers can take attendance for their assigned classes in addition to their own. Only enable when the class teacher is absent.</span>
            </div>

            {/* Add form */}
            {addingCover && (
              <div className="rounded-lg border border-primary/30 bg-muted/20 p-4 space-y-3">
                <p className="text-sm font-medium">New Cover Assignment</p>
                <div className="space-y-1">
                  <Label>Teacher</Label>
                  <Select value={newCoverTeacherId} onValueChange={setNewCoverTeacherId}>
                    <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                    <SelectContent>
                      {teachers.map(t => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Classes to Cover</Label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {classes.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleClassSelection(c.id, newCoverClassIds, setNewCoverClassIds)}
                        className={`px-3 py-1 rounded-full text-xs border font-medium transition-colors ${
                          newCoverClassIds.includes(c.id)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-white border-gray-200 hover:border-primary'
                        }`}
                      >
                        {c.full_name || c.level}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={assignCoverTeacher} disabled={saving}>
                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Assign
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAddingCover(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {coverPerms.length === 0 && !addingCover && (
              <p className="text-sm text-muted-foreground text-center py-4">No cover teachers assigned yet.</p>
            )}

            {coverPerms.map(perm => (
              <div key={perm.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{perm.teacher_name}</p>
                    <p className="text-xs text-muted-foreground">{perm.teacher_email}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => removePermission(perm)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {perm.cover_class_ids.length > 0
                    ? classes
                        .filter(c => perm.cover_class_ids.includes(c.id))
                        .map(c => (
                          <Badge key={c.id} variant="outline" className="text-xs">{c.full_name || c.level}</Badge>
                        ))
                    : <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">All classes</Badge>
                  }
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StaffPermissions;

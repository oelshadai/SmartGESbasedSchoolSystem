import { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Edit, Calendar, Plus, Star, Loader2, BookOpen, Sparkles } from 'lucide-react';
import secureApiClient from '@/lib/secureApiClient';
import { toast } from 'sonner';

interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface Term {
  id: number;
  academic_year: number;
  academic_year_name: string;
  display_name: string;
  name: 'FIRST' | 'SECOND' | 'THIRD';
  start_date: string;
  end_date: string;
  is_current: boolean;
  total_days: number;
}

interface SchoolSettings {
  current_academic_year: string;
  current_term: number | null;
}

const TERM_LABELS: Record<string, string> = {
  FIRST: 'First Term',
  SECOND: 'Second Term',
  THIRD: 'Third Term',
};

const AcademicYearManagement = () => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Year modal
  const [yearModal, setYearModal] = useState(false);
  const [editYear, setEditYear] = useState<AcademicYear | null>(null);
  const [yearForm, setYearForm] = useState({ name: '', start_date: '', end_date: '' });
  const [yearSaving, setYearSaving] = useState(false);

  // Term modal
  const [termModal, setTermModal] = useState(false);
  const [editTerm, setEditTerm] = useState<Term | null>(null);
  const [termForm, setTermForm] = useState({ academic_year: '', name: 'FIRST', start_date: '', end_date: '', total_days: '' });
  const [termSaving, setTermSaving] = useState(false);

  const [settingCurrent, setSettingCurrent] = useState<number | null>(null);
  const [settingCurrentYear, setSettingCurrentYear] = useState<number | null>(null);
  const [aiCalendarLoading, setAiCalendarLoading] = useState(false);
  const [aiTerms, setAiTerms] = useState<Array<{ name: 'FIRST' | 'SECOND' | 'THIRD'; start_date: string; end_date: string; total_days: number }>>([]);
  const [aiSourceNote, setAiSourceNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [yRes, tRes, sRes] = await Promise.all([
        secureApiClient.get('/schools/academic-years/'),
        secureApiClient.get('/schools/terms/'),
        secureApiClient.get('/schools/settings/'),
      ]);
      const yearList: AcademicYear[] = Array.isArray(yRes) ? yRes : yRes.results ?? [];
      const termList: Term[] = Array.isArray(tRes) ? tRes : tRes.results ?? [];
      setYears(yearList);
      setTerms(termList);
      setSchoolSettings({
        current_academic_year: sRes.current_academic_year || '',
        current_term: sRes.current_term || null,
      });
    } catch {
      toast.error('Failed to load academic data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ---- Academic Year ----
  const openAddYear = () => {
    setEditYear(null);
    const nextStartYear = new Date().getFullYear();
    setYearForm({ name: `${nextStartYear}/${nextStartYear + 1}`, start_date: '', end_date: '' });
    setAiTerms([]);
    setAiSourceNote('');
    setYearModal(true);
  };

  const suggestGesCalendar = async () => {
    const academicYear = yearForm.name.trim();
    if (!academicYear) {
      toast.error('Enter an academic year first, for example 2026/2027');
      return;
    }
    setAiCalendarLoading(true);
    try {
      const suggestion = await secureApiClient.post('/schools/academic-years/ai-ges-calendar/', { academic_year: academicYear }) as any;
      setYearForm({ name: suggestion.academic_year || academicYear, start_date: suggestion.start_date || '', end_date: suggestion.end_date || '' });
      setAiTerms(suggestion.terms || []);
      setAiSourceNote(suggestion.source_note || 'Confirm dates against the latest GES circular before publishing.');
      toast.success('GES calendar suggested. Review the dates before saving.');
    } catch (e: any) {
      toast.error(e?.message || 'Could not generate a GES calendar suggestion');
    } finally {
      setAiCalendarLoading(false);
    }
  };

  const openEditYear = (y: AcademicYear) => {
    setEditYear(y);
    setYearForm({ name: y.name, start_date: y.start_date, end_date: y.end_date });
    setYearModal(true);
  };

  const saveYear = async () => {
    if (!yearForm.name || !yearForm.start_date || !yearForm.end_date) {
      toast.error('Please fill all fields'); return;
    }
    if (!editYear && years.some(year => year.name.toLowerCase() === yearForm.name.trim().toLowerCase())) {
      toast.error('This academic year already exists. Edit the existing year instead.');
      return;
    }
    setYearSaving(true);
    try {
      if (editYear) {
        await secureApiClient.patch(`/schools/academic-years/${editYear.id}/`, yearForm);
        toast.success('Academic year updated');
      } else {
        const createdYear = await secureApiClient.post('/schools/academic-years/', yearForm) as any;
        if (aiTerms.length === 3 && createdYear?.id) {
          await Promise.all(aiTerms.map(term => secureApiClient.post('/schools/terms/', {
            academic_year: createdYear.id,
            name: term.name,
            start_date: term.start_date,
            end_date: term.end_date,
            total_days: term.total_days || 0,
          })));
        }
        toast.success('Academic year created');
      }
      setYearModal(false);
      setAiTerms([]);
      setAiSourceNote('');
      load();
    } catch (e: any) {
      const msg = e?.response?.data ? Object.values(e.response.data).flat().join(' ') : 'Failed to save';
      toast.error(msg as string);
    } finally {
      setYearSaving(false);
    }
  };

  // ---- Term ----
  const openAddTerm = () => {
    setEditTerm(null);
    setTermForm({ academic_year: years[0]?.id?.toString() ?? '', name: 'FIRST', start_date: '', end_date: '', total_days: '' });
    setTermModal(true);
  };

  const openEditTerm = (t: Term) => {
    setEditTerm(t);
    setTermForm({
      academic_year: t.academic_year.toString(),
      name: t.name,
      start_date: t.start_date,
      end_date: t.end_date,
      total_days: t.total_days.toString(),
    });
    setTermModal(true);
  };

  const saveTerm = async () => {
    if (!termForm.academic_year || !termForm.start_date || !termForm.end_date) {
      toast.error('Please fill all required fields'); return;
    }
    setTermSaving(true);
    try {
      const payload = {
        academic_year: parseInt(termForm.academic_year),
        name: termForm.name,
        start_date: termForm.start_date,
        end_date: termForm.end_date,
        total_days: termForm.total_days ? parseInt(termForm.total_days) : 0,
      };
      if (editTerm) {
        await secureApiClient.patch(`/schools/terms/${editTerm.id}/`, payload);
        toast.success('Term updated');
      } else {
        await secureApiClient.post('/schools/terms/', payload);
        toast.success('Term created');
      }
      setTermModal(false);
      load();
    } catch (e: any) {
      const msg = e?.response?.data ? Object.values(e.response.data).flat().join(' ') : 'Failed to save';
      toast.error(msg as string);
    } finally {
      setTermSaving(false);
    }
  };

  const setCurrentTerm = async (termId: number) => {
    setSettingCurrent(termId);
    try {
      await secureApiClient.post(`/schools/terms/${termId}/set_current/`);
      toast.success('Active term updated');
      load();
    } catch {
      toast.error('Failed to set active term');
    } finally {
      setSettingCurrent(null);
    }
  };

  const setCurrentAcademicYear = async (yearName: string) => {
    setSettingCurrentYear(years.find(y => y.name === yearName)?.id || null);
    try {
      await secureApiClient.patch('/schools/settings/', {
        current_academic_year: yearName
      });
      toast.success('Current academic year updated');
      load();
    } catch {
      toast.error('Failed to set current academic year');
    } finally {
      setSettingCurrentYear(null);
    }
  };

  const yearStatusBadge = (y: AcademicYear) => {
    if (y.is_current) return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Current</Badge>;
    const now = new Date();
    const end = new Date(y.end_date);
    if (end < now) return <Badge variant="outline" className="bg-muted text-muted-foreground border-border">Completed</Badge>;
    return <Badge variant="outline" className="bg-info/10 text-info border-info/20">Upcoming</Badge>;
  };

  const termStatusBadge = (t: Term) => {
    if (t.is_current) return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Active</Badge>;
    const now = new Date();
    const end = new Date(t.end_date);
    if (end < now) return <Badge variant="outline" className="bg-muted text-muted-foreground border-border">Completed</Badge>;
    return <Badge variant="outline" className="bg-info/10 text-info border-info/20">Upcoming</Badge>;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Academic Year Management"
        description="Configure academic years and terms for your school"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={openAddYear}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              <span className="text-xs sm:text-sm">GES AI Setup</span>
            </Button>
            <Button size="sm" onClick={openAddYear}>
              <Plus className="h-4 w-4 mr-1.5" />
              <span className="text-xs sm:text-sm">New Academic Year</span>
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <>
          {/* Academic Years */}
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" /> Academic Years
              </CardTitle>
              <Button size="sm" variant="outline" onClick={openAddYear}>
                <Plus className="h-4 w-4 mr-1" /> Add Year
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {years.length === 0 ? (
                <p className="text-muted-foreground text-sm px-6 py-8 text-center">No academic years yet. Add one to get started.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Academic Year</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Start Date</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">End Date</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Terms</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {years.map(y => {
                        const termCount = terms.filter(t => t.academic_year === y.id).length;
                        return (
                          <tr key={y.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="px-4 py-3 font-medium text-foreground">{y.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{y.start_date}</td>
                            <td className="px-4 py-3 text-muted-foreground">{y.end_date}</td>
                            <td className="px-4 py-3 text-foreground">{termCount}</td>
                            <td className="px-4 py-3">{yearStatusBadge(y)}</td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditYear(y)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Terms */}
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" /> Terms / Semesters
              </CardTitle>
              <Button size="sm" variant="outline" onClick={openAddTerm} disabled={years.length === 0}>
                <Plus className="h-4 w-4 mr-1" /> Add Term
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {terms.length === 0 ? (
                <p className="text-muted-foreground text-sm px-6 py-8 text-center">No terms yet. Add a term to an academic year.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Term</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Academic Year</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Start Date</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">End Date</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">School Days</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {terms.map(t => (
                        <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-3 font-medium text-foreground">{TERM_LABELS[t.name] ?? t.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{t.academic_year_name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{t.start_date}</td>
                          <td className="px-4 py-3 text-muted-foreground">{t.end_date}</td>
                          <td className="px-4 py-3 text-foreground">{t.total_days || '—'}</td>
                          <td className="px-4 py-3">{termStatusBadge(t)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {!t.is_current && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-muted-foreground hover:text-success"
                                  onClick={() => setCurrentTerm(t.id)}
                                  disabled={settingCurrent === t.id}
                                >
                                  {settingCurrent === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Star className="h-3 w-3 mr-1" />}
                                  Set Active
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditTerm(t)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Current Academic Settings */}
      {schoolSettings && years.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4" /> Current Academic Settings
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Set the active academic year and term for your school. This affects report generation and system-wide academic operations.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Current Academic Year</Label>
                <Select 
                  value={schoolSettings.current_academic_year} 
                  onValueChange={setCurrentAcademicYear}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year.id} value={year.name}>
                        <div className="flex items-center gap-2">
                          {year.name}
                          {year.name === schoolSettings.current_academic_year && (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">Current</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Current Term</Label>
                <Select 
                  value={schoolSettings.current_term?.toString() || ''} 
                  onValueChange={(value) => setCurrentTerm(parseInt(value))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select current term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms
                      .filter(term => term.academic_year_name === schoolSettings.current_academic_year)
                      .map(term => (
                        <SelectItem key={term.id} value={term.id.toString()}>
                          <div className="flex items-center gap-2">
                            {term.display_name}
                            {term.is_current && (
                              <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">Active</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-info/10 border border-info/20">
                  <Calendar className="h-4 w-4 text-info" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">Academic Status</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><strong>Active Year:</strong> {schoolSettings.current_academic_year || 'Not set'}</p>
                    <p><strong>Active Term:</strong> {terms.find(t => t.id === schoolSettings.current_term)?.display_name || 'Not set'}</p>
                    <p><strong>Total Terms:</strong> {terms.filter(t => t.academic_year_name === schoolSettings.current_academic_year).length}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Academic Year Modal */}
      <Dialog open={yearModal} onOpenChange={setYearModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editYear ? 'Edit Academic Year' : 'New Academic Year'}</DialogTitle>
            <DialogDescription>
              Add dates manually or generate a GES-style proposal for review before saving.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editYear && (
              <Button type="button" variant="outline" className="w-full" onClick={suggestGesCalendar} disabled={aiCalendarLoading}>
                {aiCalendarLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Suggest GES Calendar with AI
              </Button>
            )}
            <div>
              <Label>Year Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. 2025/2026"
                value={yearForm.name}
                onChange={e => setYearForm(f => ({ ...f, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={yearForm.start_date} onChange={e => setYearForm(f => ({ ...f, start_date: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>End Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={yearForm.end_date} onChange={e => setYearForm(f => ({ ...f, end_date: e.target.value }))} className="mt-1" />
              </div>
            </div>
            {aiTerms.length === 3 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 space-y-2">
                <p className="text-sm font-semibold text-[#0f2a5e]">Proposed GES term dates</p>
                {aiTerms.map(term => (
                  <div key={term.name} className="flex items-center justify-between gap-2 text-xs text-[#0f2a5e]">
                    <span className="font-medium">{TERM_LABELS[term.name]}</span>
                    <span>{term.start_date} to {term.end_date} ({term.total_days} days)</span>
                  </div>
                ))}
                <p className="text-[11px] text-slate-600">{aiSourceNote}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setYearModal(false)}>Cancel</Button>
            <Button onClick={saveYear} disabled={yearSaving}>
              {yearSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editYear ? 'Save Changes' : 'Create Year'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Term Modal */}
      <Dialog open={termModal} onOpenChange={setTermModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTerm ? 'Edit Term' : 'New Term'}</DialogTitle>
            <DialogDescription>Configure the term dates and school-day total.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Academic Year <span className="text-destructive">*</span></Label>
              <Select value={termForm.academic_year} onValueChange={v => setTermForm(f => ({ ...f, academic_year: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y.id} value={y.id.toString()}>{y.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Term <span className="text-destructive">*</span></Label>
              <Select value={termForm.name} onValueChange={v => setTermForm(f => ({ ...f, name: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIRST">First Term</SelectItem>
                  <SelectItem value="SECOND">Second Term</SelectItem>
                  <SelectItem value="THIRD">Third Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={termForm.start_date} onChange={e => setTermForm(f => ({ ...f, start_date: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>End Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={termForm.end_date} onChange={e => setTermForm(f => ({ ...f, end_date: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Total School Days</Label>
              <Input
                type="number"
                placeholder="e.g. 60"
                value={termForm.total_days}
                onChange={e => setTermForm(f => ({ ...f, total_days: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTermModal(false)}>Cancel</Button>
            <Button onClick={saveTerm} disabled={termSaving}>
              {termSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editTerm ? 'Save Changes' : 'Create Term'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AcademicYearManagement;

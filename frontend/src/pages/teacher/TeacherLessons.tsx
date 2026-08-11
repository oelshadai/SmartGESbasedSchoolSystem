import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { secureApiClient } from '@/lib/secureApiClient';
import { toast } from 'sonner';
import {
  CalendarDays,
  BookOpen,
  Clock,
  Link2,
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import ResourcePreview from '@/components/ResourcePreview';

interface Slot {
  id: number;
  day: string;
  day_label: string;
  start_time: string;
  end_time: string;
  subject: string;
  teacher: string | null;
  room: string;
  notes: string;
  resources: LessonResource[];
}

interface DayGroup {
  day: string;
  day_label: string;
  slots: Slot[];
}

interface ClassOption {
  id: number;
  name: string;
}

type ResourceType = 'video' | 'audio' | 'image' | 'document' | 'file';

interface LessonResource {
  id: number;
  title: string;
  description: string;
  url: string;
  original_filename: string;
  content_type: string;
  resource_type: ResourceType;
  uploaded_at: string;
  expires_at: string | null;
}

const sanitizeRoomName = (value: string) =>
  value
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9\-_]/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();

const buildMeetingRoom = (className: string, slot: Slot) => {
  return sanitizeRoomName(
    `SmartSchool-${className}-${slot.subject}-${slot.day}-${slot.start_time}`
  );
};

const TeacherLessons = () => {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [timetable, setTimetable] = useState<DayGroup[]>([]);
  const [classResources, setClassResources] = useState<LessonResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [expandedDay, setExpandedDay] = useState<string | null>('MON');
  const [activeMeetingSlot, setActiveMeetingSlot] = useState<Slot | null>(null);
  const [previewResource, setPreviewResource] = useState<LessonResource | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadDialogMode, setUploadDialogMode] = useState<'class' | 'slot'>('class');
  const [uploadDialogSlot, setUploadDialogSlot] = useState<Slot | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');

  const handlePreviewResource = (resource: LessonResource) => setPreviewResource(resource);
  const handleClosePreview = () => setPreviewResource(null);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await secureApiClient.get('/timetable/teacher/');
      const list: ClassOption[] = Array.isArray(res) ? res : res?.results ?? [];
      setClasses(list);
      if (list.length > 0) setSelectedClass((prev) => prev ?? list[0].id);
    } catch {
      toast.error('Unable to load your classes.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async (classId: number, silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const res = await secureApiClient.get(`/timetable/teacher/?class_id=${classId}`);
      setTimetable(res?.timetable ?? []);
      setNoteDrafts(
        (res?.timetable ?? []).reduce((acc: Record<number, string>, day: DayGroup) => {
          day.slots.forEach((slot) => {
            acc[slot.id] = slot.notes || '';
          });
          return acc;
        }, {})
      );
      setClassResources(res?.class_resources ?? []);
    } catch {
      toast.error('Unable to load timetable for this class.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) fetchTimetable(selectedClass);
  }, [selectedClass]);

  const selectedClassName = useMemo(() => {
    return classes.find((cls) => cls.id === selectedClass)?.name || '';
  }, [classes, selectedClass]);

  const meetingUrl = activeMeetingSlot
    ? `https://meet.jit.si/${buildMeetingRoom(selectedClassName, activeMeetingSlot)}#config.defaultLanguage="en"&config.overrides.preferredLanguage="en"&config.lang="en"&interfaceConfig.DEFAULT_LANGUAGE="en"`
    : null;

  const handleSaveNotes = async (slotId: number) => {
    const notes = noteDrafts[slotId] ?? '';
    setRefreshing(true);
    try {
      await secureApiClient.put(`/timetable/teacher/${slotId}/`, { notes });
      toast.success('Lesson notes updated');
      if (selectedClass) fetchTimetable(selectedClass, true);
    } catch {
      toast.error('Failed to save lesson notes');
    } finally {
      setRefreshing(false);
    }
  };

  const handleJoinVideo = (slot: Slot) => {
    setActiveMeetingSlot(slot);
  };

  const handleFileUpload = async (slot: Slot, file: File, title = '', description = '') => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    try {
      const res = await secureApiClient.post(`/timetable/teacher/${slot.id}/upload_resource/`, formData);
      toast.success('Resource uploaded');
      if (selectedClass) fetchTimetable(selectedClass, true);
      return res;
    } catch (err: any) {
      toast.error(err?.message || err?.response?.data?.error || 'Upload failed');
      throw err;
    }
  };

  const handleClassUpload = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('class_id', String(selectedClass));
    if (uploadTitle) form.append('title', uploadTitle);
    if (uploadDescription) form.append('description', uploadDescription);
    try {
      await secureApiClient.post('/timetable/teacher/upload_to_class/', form);
      toast.success('Resource uploaded to class');
      if (selectedClass) fetchTimetable(selectedClass, true);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Upload failed');
      throw err;
    }
  };

  const openUploadDialog = (mode: 'class' | 'slot', slot?: Slot) => {
    setUploadDialogMode(mode);
    setUploadDialogSlot(slot ?? null);
    setUploadTitle('');
    setUploadDescription('');
    setUploadFile(null);
    setUploadDialogOpen(true);
  };

  const closeUploadDialog = () => {
    setUploadDialogOpen(false);
    setUploadDialogSlot(null);
    setUploadFile(null);
    setUploadTitle('');
    setUploadDescription('');
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      if (uploadDialogMode === 'class') {
        await handleClassUpload(uploadFile);
      } else if (uploadDialogMode === 'slot' && uploadDialogSlot) {
        await handleFileUpload(uploadDialogSlot, uploadFile, uploadTitle, uploadDescription);
      }
      closeUploadDialog();
    } catch {
      // error is handled in the upload functions
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    if (!confirm('Delete this resource? This cannot be undone.')) return;
    try {
      await secureApiClient.delete(`/timetable/resource/${resourceId}/`);
      toast.success('Resource deleted');
      if (selectedClass) fetchTimetable(selectedClass, true);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to delete resource');
    }
  };

  const handleReplaceResource = async (resource: LessonResource, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      await secureApiClient.put(`/timetable/resource/${resource.id}/`, formData);
      toast.success('Resource updated');
      if (selectedClass) fetchTimetable(selectedClass, true);
    } catch (err: any) {
      toast.error(err?.message || err?.response?.data?.error || 'Update failed');
      throw err;
    }
  };

  const handleOpenExternalMeeting = () => {
    if (!activeMeetingSlot) return;
    window.open(meetingUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMeetingLink = async () => {
    if (!activeMeetingSlot) return;
    try {
      await navigator.clipboard.writeText(meetingUrl || '');
      toast.success('Meeting link copied');
    } catch {
      toast.error('Could not copy the meeting link');
    }
  };

  const handleCopyLink = async (slot: Slot) => {
    const room = buildMeetingRoom(selectedClassName, slot);
    const url = `https://meet.jit.si/${room}#config.defaultLanguage="en"&config.overrides.preferredLanguage="en"&config.lang="en"&interfaceConfig.DEFAULT_LANGUAGE="en"`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Lesson link copied');
    } catch {
      toast.error('Could not copy the meeting link');
    }
  };

  const totalLessons = timetable.reduce((total, day) => total + day.slots.length, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24 space-y-5 overflow-x-hidden">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Teacher Lessons</h1>
            <p className="text-xs text-muted-foreground">Review your lesson notes and start video sessions.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="ghost" size="icon" onClick={() => selectedClass && fetchTimetable(selectedClass, true)} disabled={refreshing}>
            <Loader2 className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="gap-2" onClick={() => setExpandedDay(null)}>
            <BookOpen className="h-4 w-4" /> Reset view
          </Button>

          <Button size="sm" variant="outline" onClick={() => openUploadDialog('class')}>
            Upload resource
          </Button>
        </div>
      </div>

      {classes.length > 1 && (
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
          {classes.map((cls) => (
            <button
              key={cls.id}
              type="button"
              onClick={() => setSelectedClass(cls.id)}
              className={`shrink-0 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                selectedClass === cls.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-slate-800'
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Selected class</p>
          <p className="text-base font-semibold text-foreground">{selectedClassName || 'No class selected'}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-2xl bg-muted p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Lessons this week</p>
            <p className="text-2xl font-bold text-foreground">{totalLessons}</p>
          </div>
          <div className="rounded-2xl bg-muted p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Teacher notes</p>
            <p className="text-2xl font-bold text-foreground">{Object.values(noteDrafts).filter(Boolean).length}</p>
          </div>
        </div>
      </div>

      {classResources.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-foreground">Class resources</p>
              <p className="text-sm text-muted-foreground">Uploaded resources available to the whole class.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {classResources.map((resource) => (
              <div key={resource.id} className="rounded-2xl border border-border p-4 hover:bg-slate-800">
                <div className="flex flex-col gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{resource.title || resource.original_filename}</p>
                    {resource.description ? (
                      <p className="text-sm text-muted-foreground truncate">{resource.description}</p>
                    ) : null}
                    <span className="mt-1 inline-block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      {({
                        video: 'Video',
                        audio: 'Audio',
                        image: 'Image',
                        document: 'Document',
                        file: 'File',
                      } as Record<ResourceType, string>)[resource.resource_type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => handlePreviewResource(resource)}>
                      Preview
                    </Button>
                    <input
                      id={`resource-replace-${resource.id}`}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        handleReplaceResource(resource, f).catch(() => {});
                        e.currentTarget.value = '';
                      }}
                    />
                    <Button size="sm" variant="outline" onClick={() => document.getElementById(`resource-replace-${resource.id}`)?.click()}>
                      Replace
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteResource(resource.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(resource.uploaded_at).toLocaleDateString()}</span>
                  {resource.expires_at ? <span>Expires {new Date(resource.expires_at).toLocaleDateString()}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {previewResource ? (
        <ResourcePreview resource={previewResource} onClose={handleClosePreview} />
      ) : null}

      <Dialog open={uploadDialogOpen} onOpenChange={(open) => !open && closeUploadDialog()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {uploadDialogMode === 'class'
                ? 'Upload class resource'
                : `Upload lesson resource for ${uploadDialogSlot?.subject || 'lesson'}`}
            </DialogTitle>
            <DialogDescription>
              Select a file and add optional metadata before uploading it for students.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label htmlFor="upload-file" className="mb-2 block text-sm font-medium text-foreground">
                File
              </Label>
              <Input
                id="upload-file"
                type="file"
                accept="video/*,audio/*,image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0] ?? null;
                  setUploadFile(file);
                }}
              />
              {uploadFile ? (
                <p className="mt-2 text-sm text-muted-foreground">Selected: {uploadFile.name}</p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Choose the file you want to upload.</p>
              )}
            </div>
            <div>
              <Label htmlFor="upload-title" className="mb-2 block text-sm font-medium text-foreground">
                Title
              </Label>
              <Input
                id="upload-title"
                value={uploadTitle}
                onChange={(event) => setUploadTitle(event.target.value)}
                placeholder="Optional title for students"
              />
            </div>
            <div>
              <Label htmlFor="upload-description" className="mb-2 block text-sm font-medium text-foreground">
                Description
              </Label>
              <Textarea
                id="upload-description"
                value={uploadDescription}
                onChange={(event) => setUploadDescription(event.target.value)}
                placeholder="Optional description to help students understand the resource"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeUploadDialog}>
              Cancel
            </Button>
            <Button type="button" onClick={handleUploadSubmit} disabled={!uploadFile}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-3xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Live lesson room</p>
            <p className="text-sm text-muted-foreground">Start a shared Jitsi session inside the app so students and colleagues join the same room.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="gap-2" disabled={!activeMeetingSlot} onClick={handleOpenExternalMeeting}>
              <Link2 className="h-4 w-4" /> Open in new tab
            </Button>
            <Button size="sm" variant="outline" className="gap-2" disabled={!activeMeetingSlot} onClick={handleCopyMeetingLink}>
              <Link2 className="h-4 w-4" /> Copy room link
            </Button>
          </div>
        </div>
        {activeMeetingSlot ? (
          <div className="mt-4 rounded-3xl overflow-hidden border border-border bg-black">
            <iframe
              title="Live Lesson Meeting"
              src={meetingUrl || ''}
              className="h-[540px] w-full"
              allow="camera; microphone; fullscreen; display-capture"
            />
          </div>
        ) : (
          <div className="mt-4 rounded-3xl border border-dashed border-border bg-slate-950/70 p-6 text-center text-sm text-muted-foreground">
            Select a lesson below to embed the live video meeting inside the app.
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading lessons…</p>
        </div>
      ) : totalLessons === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-8 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm font-semibold text-foreground">No lessons available</p>
          <p className="mt-2 text-xs text-muted-foreground">Add or manage timetable slots from the timetable page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {timetable.map((dayGroup) => {
            const isOpen = expandedDay === dayGroup.day;
            return (
              <div key={dayGroup.day} className="rounded-3xl border border-border overflow-hidden bg-card">
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-800/50"
                  onClick={() => setExpandedDay(isOpen ? null : dayGroup.day)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {dayGroup.day}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{dayGroup.day_label}</p>
                      <p className="text-xs text-muted-foreground">{dayGroup.slots.length} lessons</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-muted text-muted-foreground">{dayGroup.slots.length}</Badge>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="divide-y divide-border">
                    {dayGroup.slots.map((slot, index) => (
                      <div key={slot.id} className={`px-4 py-4 ${index < dayGroup.slots.length - 1 ? 'border-t border-border' : ''}`}>
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="rounded-full bg-slate-800/70 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                                {slot.start_time} — {slot.end_time}
                              </span>
                              <Badge className="bg-primary/10 text-primary border-primary/20">{slot.room || 'No room'}</Badge>
                            </div>
                            <div className="mt-3 flex flex-col gap-2">
                              <p className="text-base font-semibold text-foreground">{slot.subject}</p>
                              <p className="text-sm text-muted-foreground">{slot.teacher ?? 'Teacher not assigned'}</p>
                              {slot.notes ? (
                                <p className="rounded-2xl bg-slate-900/80 p-3 text-sm text-slate-200">{slot.notes}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground">No notes yet.</p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 shrink-0 text-right">
                            <Button variant="secondary" size="sm" className="gap-2" onClick={() => handleJoinVideo(slot)}>
                              <Link2 className="h-4 w-4" /> Start Video
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleCopyLink(slot)}>
                              <Link2 className="h-4 w-4" /> Copy Link
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                          <div>
                            <Label className="text-xs text-muted-foreground">Lesson notes</Label>
                            <Textarea
                              value={noteDrafts[slot.id] ?? ''}
                              onChange={(event) => setNoteDrafts((prev) => ({ ...prev, [slot.id]: event.target.value }))}
                              placeholder="Write notes for this lesson"
                              maxLength={255}
                              className="mt-1 min-h-[3rem] bg-slate-900/80"
                            />
                          </div>
                          <div className="flex flex-col gap-2 justify-end">
                            <Button
                              size="sm"
                              className="gap-2"
                              onClick={() => handleSaveNotes(slot.id)}
                              disabled={refreshing}
                            >
                              <Save className="h-4 w-4" /> Save notes
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-2"
                              onClick={() => setNoteDrafts((prev) => ({ ...prev, [slot.id]: slot.notes || '' }))}
                            >
                              <Trash2 className="h-4 w-4" /> Reset
                            </Button>
                            <div className="mt-2 flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openUploadDialog('slot', slot)}
                              >
                                Upload resource
                              </Button>
                            </div>
                            {slot.resources && slot.resources.length > 0 && (
                              <div className="w-full mt-2">
                                <p className="text-xs text-muted-foreground mb-1">Resources</p>
                                <div className="flex flex-col gap-2">
                                  {slot.resources.map((r: any) => (
                                    <div key={r.id} className="inline-flex flex-col gap-2 rounded-xl border border-border p-3 hover:bg-slate-800">
                                      <div className="flex items-center justify-between gap-2">
                                        <a
                                          href={r.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="truncate text-sm"
                                        >
                                          {r.title || r.original_filename}
                                        </a>
                                        <span className="text-[10px] text-muted-foreground">{r.resource_type}</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs text-muted-foreground">{new Date(r.uploaded_at).toLocaleDateString()}</span>
                                        <div className="flex items-center gap-2">
                                          <input
                                            id={`resource-replace-${r.id}`}
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => {
                                              const f = e.target.files?.[0];
                                              if (!f) return;
                                              handleReplaceResource(r, f).catch(() => {});
                                              e.currentTarget.value = '';
                                            }}
                                          />
                                          <Button size="sm" variant="outline" onClick={() => document.getElementById(`resource-replace-${r.id}`)?.click()}>
                                            Replace
                                          </Button>
                                          <Button size="sm" variant="destructive" onClick={() => handleDeleteResource(r.id)}>
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherLessons;

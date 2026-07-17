import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Pin, Plus, Edit, Trash2, MessageSquare } from 'lucide-react';
import secureApiClient from '@/lib/secureApiClient';

interface Announcement {
  id: number;
  title: string;
  content: string;
  audience: string;
  is_pinned: boolean;
  author_name: string;
  created_at: string;
}

const audienceColors: Record<string, string> = {
  ALL: 'bg-info/10 text-info border-info/20',
  STUDENTS: 'bg-success/10 text-success border-success/20',
  TEACHERS: 'bg-secondary/10 text-secondary border-secondary/20',
  PARENTS: 'bg-accent/10 text-accent border-accent/20',
};

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    audience: 'select-audience',
    is_pinned: false,
    send_sms_to_parents: false,
  });
  const [smsResult, setSmsResult] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const fetchAnnouncements = async () => {
    try {
      const response = await secureApiClient.get('/announcements/');
      setAnnouncements(Array.isArray(response) ? response : response.results || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content || form.audience === 'select-audience') return;
    
    setSubmitting(true);
    setSmsResult(null);
    try {
      if (editingAnnouncement) {
        await secureApiClient.put(`/announcements/${editingAnnouncement.id}/`, form);
      } else {
        const res = await secureApiClient.post('/announcements/', form) as any;
        if (form.send_sms_to_parents) {
          if (res?.sms_note) {
            setSmsResult(res.sms_note);
          } else if (typeof res?.sms_sent === 'number') {
            setSmsResult(res.sms_sent > 0 ? `SMS sent to ${res.sms_sent} parent(s).` : 'No parent phone numbers found.');
          }
        }
      }
      setShowDialog(false);
      setForm({ title: '', content: '', audience: 'select-audience', is_pinned: false, send_sms_to_parents: false });
      setEditingAnnouncement(null);
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to save announcement:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setForm({
      title: announcement.title,
      content: announcement.content,
      audience: announcement.audience,
      is_pinned: announcement.is_pinned
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await secureApiClient.delete(`/announcements/${id}/`);
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  if (loading) {
    return <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground">Loading announcements...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground mt-1">Create and manage school announcements</p>
        </div>
        <Button onClick={() => {
          setEditingAnnouncement(null);
          setForm({ title: '', content: '', audience: 'select-audience', is_pinned: false, send_sms_to_parents: false });
          setShowDialog(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>
      
      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className={`stat-card ${a.is_pinned ? 'border-secondary/30' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {a.is_pinned && <Pin className="h-3.5 w-3.5 text-secondary" />}
                  <h3 className="font-semibold text-foreground">{a.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs text-muted-foreground">By {a.author_name}</span>
                  <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={audienceColors[a.audience]}>
                  {a.audience === 'ALL' ? 'All' : a.audience.charAt(0) + a.audience.slice(1).toLowerCase()}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => handleEdit(a)} title="Edit announcement">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(a.id)} title="Delete announcement">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No announcements yet</div>
        )}
      </div>

      {smsResult && (
        <div className="rounded-lg border border-info/30 bg-info/10 text-info px-4 py-2 text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4 shrink-0" />
          {smsResult}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
            <DialogDescription>{editingAnnouncement ? 'Update the announcement details.' : 'Send an announcement to students, teachers, or both.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input value={form.title} onChange={e => setForm(prev => ({...prev, title: e.target.value}))} placeholder="Announcement title" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Content *</label>
              <Textarea value={form.content} onChange={e => setForm(prev => ({...prev, content: e.target.value}))} placeholder="Announcement content" rows={4} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Audience *</label>
              <Select value={form.audience} onValueChange={value => setForm(prev => ({...prev, audience: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select-audience">Select Audience</SelectItem>
                  <SelectItem value="ALL">All (Students & Teachers)</SelectItem>
                  <SelectItem value="STUDENTS">Students Only</SelectItem>
                  <SelectItem value="TEACHERS">Teachers Only</SelectItem>
                  <SelectItem value="PARENTS">Parents Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="pinned" checked={form.is_pinned} onCheckedChange={checked => setForm(prev => ({...prev, is_pinned: !!checked}))} />
              <label htmlFor="pinned" className="text-sm font-medium">Pin this announcement</label>
            </div>
            {!editingAnnouncement && (form.audience === 'ALL' || form.audience === 'PARENTS') && (
              <div className="flex items-center space-x-2 rounded-md border border-info/30 bg-info/5 px-3 py-2">
                <Checkbox
                  id="sms-parents"
                  checked={form.send_sms_to_parents}
                  onCheckedChange={checked => setForm(prev => ({...prev, send_sms_to_parents: !!checked}))}
                />
                <div>
                  <label htmlFor="sms-parents" className="text-sm font-medium cursor-pointer flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Also send SMS to parents
                  </label>
                  <p className="text-xs text-muted-foreground">Requires SMS to be enabled in school settings</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={submitting || !form.title || !form.content || form.audience === 'select-audience'}>
              {submitting ? (editingAnnouncement ? 'Updating...' : 'Creating...') : (editingAnnouncement ? 'Update Announcement' : 'Create Announcement')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Announcements;
import { useState, useEffect } from 'react';
import { Plus, Send, Trash2, Edit, Pin, Users, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { secureApiClient } from '@/lib/secureApiClient';
import { toast } from 'sonner';

interface Announcement {
  id: number;
  title: string;
  content: string;
  audience: string;
  is_pinned: boolean;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

const AnnouncementsManagement = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    audience: 'ALL',
    is_pinned: false,
    send_sms_to_parents: false
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await secureApiClient.get('/announcements/announcements/');
      setAnnouncements(response || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAnnouncement) {
        await secureApiClient.put(`/announcements/announcements/${editingAnnouncement.id}/`, formData);
        toast.success('Announcement updated successfully');
      } else {
        const response = await secureApiClient.post('/announcements/announcements/', formData);
        if (response.sms_sent) {
          toast.success(`Announcement created and SMS sent to ${response.sms_sent} parents`);
        } else {
          toast.success('Announcement created successfully');
        }
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (error: any) {
      console.error('Failed to save announcement:', error);
      toast.error(error.response?.data?.error || 'Failed to save announcement');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await secureApiClient.delete(`/announcements/announcements/${id}/`);
      toast.success('Announcement deleted successfully');
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      audience: announcement.audience,
      is_pinned: announcement.is_pinned,
      send_sms_to_parents: false
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      audience: 'ALL',
      is_pinned: false,
      send_sms_to_parents: false
    });
    setEditingAnnouncement(null);
  };

  const getAudienceBadge = (audience: string) => {
    const colors: Record<string, string> = {
      ALL: 'bg-blue-100 text-blue-800',
      STUDENTS: 'bg-green-100 text-green-800',
      TEACHERS: 'bg-purple-100 text-purple-800',
      PARENTS: 'bg-orange-100 text-orange-800'
    };
    return colors[audience] || colors.ALL;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Announcements & Notifications</h1>
          <p className="text-muted-foreground">Manage school-wide announcements</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Announcement title"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Announcement content"
                  rows={5}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Target Audience</label>
                <Select
                  value={formData.audience}
                  onValueChange={(value) => setFormData({ ...formData, audience: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Users</SelectItem>
                    <SelectItem value="STUDENTS">Students Only</SelectItem>
                    <SelectItem value="TEACHERS">Teachers Only</SelectItem>
                    <SelectItem value="PARENTS">Parents Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pinned"
                  checked={formData.is_pinned}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked as boolean })}
                />
                <label htmlFor="pinned" className="text-sm font-medium cursor-pointer">
                  Pin this announcement
                </label>
              </div>

              {!editingAnnouncement && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send_sms"
                    checked={formData.send_sms_to_parents}
                    onCheckedChange={(checked) => setFormData({ ...formData, send_sms_to_parents: checked as boolean })}
                  />
                  <label htmlFor="send_sms" className="text-sm font-medium cursor-pointer">
                    Send SMS to parents
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Send className="h-4 w-4 mr-2" />
                  {editingAnnouncement ? 'Update' : 'Create'} Announcement
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Loading announcements...</p>
            </CardContent>
          </Card>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">No announcements yet. Create your first announcement!</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className={announcement.is_pinned ? 'border-blue-500 border-2' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.is_pinned && (
                        <Pin className="h-4 w-4 text-blue-600" />
                      )}
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge className={getAudienceBadge(announcement.audience)}>
                        <Users className="h-3 w-3 mr-1" />
                        {announcement.audience}
                      </Badge>
                      <span>•</span>
                      <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                      {announcement.created_by_name && (
                        <>
                          <span>•</span>
                          <span>By {announcement.created_by_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(announcement)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementsManagement;

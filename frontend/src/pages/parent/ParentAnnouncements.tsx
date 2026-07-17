import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { secureApiClient } from '@/lib/secureApiClient';
import { Bell, Pin, Loader2, AlertCircle, RefreshCw, Megaphone, Users, GraduationCap } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  audience: 'ALL' | 'STUDENTS' | 'TEACHERS' | 'PARENTS';
  is_pinned: boolean;
  author_name: string;
  created_at: string;
  updated_at: string;
}

const audienceStyle: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  ALL:      { label: 'Everyone',  className: 'bg-blue-100 text-blue-700',    icon: <Users className="h-3 w-3" /> },
  STUDENTS: { label: 'Students',  className: 'bg-green-100 text-green-700',  icon: <GraduationCap className="h-3 w-3" /> },
  TEACHERS: { label: 'Teachers',  className: 'bg-purple-100 text-purple-700',icon: <Users className="h-3 w-3" /> },
  PARENTS:  { label: 'Parents',   className: 'bg-orange-100 text-orange-700',icon: <Users className="h-3 w-3" /> },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const ParentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchAnnouncements = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await secureApiClient.get('/announcements/');
      const list = Array.isArray(res) ? res : (res?.results ?? []);
      setAnnouncements(list);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const pinned = announcements.filter(a => a.is_pinned);
  const regular = announcements.filter(a => !a.is_pinned);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground p-6">
      <Loader2 className="h-5 w-5 animate-spin" />
      <p className="text-sm">Loading announcements…</p>
    </div>
  );

  if (error) return (
    <div className="p-6 flex flex-col items-center gap-4 text-center">
      <AlertCircle className="h-8 w-8 text-red-400" />
      <p className="text-sm text-red-600">{error}</p>
      <Button onClick={() => fetchAnnouncements()}>Try Again</Button>
    </div>
  );

  const AnnouncementCard = ({ a }: { a: Announcement }) => {
    const aud = audienceStyle[a.audience] ?? audienceStyle.ALL;
    const isOpen = expanded === a.id;
    const preview = a.content.length > 160 ? a.content.slice(0, 160) + '…' : a.content;

    return (
      <div
        className={`rounded-xl border bg-card transition-shadow hover:shadow-sm cursor-pointer ${a.is_pinned ? 'border-amber-300 bg-amber-50/30' : ''}`}
        onClick={() => setExpanded(isOpen ? null : a.id)}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${a.is_pinned ? 'bg-amber-100' : 'bg-primary/10'}`}>
              {a.is_pinned ? <Pin className="h-4 w-4 text-amber-600" /> : <Megaphone className="h-4 w-4 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <h3 className="font-semibold text-sm leading-tight">{a.title}</h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  {a.is_pinned && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs py-0">Pinned</Badge>}
                  <Badge variant="outline" className={`text-xs py-0 flex items-center gap-1 ${aud.className}`}>
                    {aud.icon} {aud.label}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{a.author_name} · {formatDate(a.created_at)}</p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {isOpen ? a.content : preview}
              </p>
              {a.content.length > 160 && (
                <button className="text-xs text-primary mt-1 hover:underline">
                  {isOpen ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" /> Announcements
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {announcements.length} announcement{announcements.length !== 1 ? 's' : ''} from school
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => fetchAnnouncements(true)} disabled={refreshing}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
          <Bell className="h-10 w-10 opacity-20" />
          <p className="text-sm font-medium">No announcements yet</p>
          <p className="text-xs text-center max-w-xs">School announcements will appear here when published.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {pinned.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Pin className="h-3 w-3" /> Pinned
              </h2>
              {pinned.map(a => <AnnouncementCard key={a.id} a={a} />)}
            </div>
          )}
          {regular.length > 0 && (
            <div className="space-y-3">
              {pinned.length > 0 && (
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent</h2>
              )}
              {regular.map(a => <AnnouncementCard key={a.id} a={a} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParentAnnouncements;

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
  ALL:      { label: 'Everyone',  className: 'bg-blue-100 text-blue-700',   icon: <Users className="h-3 w-3" /> },
  STUDENTS: { label: 'Students',  className: 'bg-green-100 text-green-700', icon: <GraduationCap className="h-3 w-3" /> },
  TEACHERS: { label: 'Teachers',  className: 'bg-purple-100 text-purple-700', icon: <Users className="h-3 w-3" /> },
  PARENTS:  { label: 'Parents',   className: 'bg-orange-100 text-orange-700', icon: <Users className="h-3 w-3" /> },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const StudentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchAnnouncements = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading announcements…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-center text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => fetchAnnouncements()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Announcements</h1>
            <p className="text-xs text-muted-foreground">{announcements.length} active</p>
          </div>
        </div>
        <Button
          variant="ghost" size="icon"
          onClick={() => fetchAnnouncements(true)}
          disabled={refreshing}
          className="h-9 w-9"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Megaphone className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No announcements yet</p>
          <p className="text-xs text-muted-foreground">Check back later for updates from your school</p>
        </div>
      ) : (
        <>
          {/* Pinned */}
          {pinned.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Pin className="h-3 w-3" /> Pinned
              </p>
              {pinned.map(a => (
                <AnnouncementCard
                  key={a.id}
                  announcement={a}
                  expanded={expanded === a.id}
                  onToggle={() => setExpanded(expanded === a.id ? null : a.id)}
                />
              ))}
            </div>
          )}

          {/* Regular */}
          {regular.length > 0 && (
            <div className="space-y-2">
              {pinned.length > 0 && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Recent
                </p>
              )}
              {regular.map(a => (
                <AnnouncementCard
                  key={a.id}
                  announcement={a}
                  expanded={expanded === a.id}
                  onToggle={() => setExpanded(expanded === a.id ? null : a.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const AnnouncementCard = ({
  announcement: a,
  expanded,
  onToggle,
}: {
  announcement: Announcement;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const aud = audienceStyle[a.audience] ?? audienceStyle.ALL;
  const isLong = a.content.length > 120;

  return (
    <div
      className={`bg-card border rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform ${
        a.is_pinned ? 'border-primary/30 bg-primary/5' : 'border-border'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        {/* icon */}
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
          a.is_pinned ? 'bg-primary/10' : 'bg-muted'
        }`}>
          {a.is_pinned
            ? <Pin className="h-4 w-4 text-primary" />
            : <Megaphone className="h-4 w-4 text-muted-foreground" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-foreground leading-snug">{a.title}</p>
            {a.is_pinned && (
              <Badge className="bg-primary/10 text-primary border-0 text-[10px] shrink-0">Pinned</Badge>
            )}
          </div>

          {/* content — truncated unless expanded */}
          <p className={`text-xs text-muted-foreground mt-1 leading-relaxed ${!expanded && isLong ? 'line-clamp-2' : ''}`}>
            {a.content}
          </p>
          {isLong && (
            <p className="text-xs text-primary font-medium mt-1">
              {expanded ? 'Show less' : 'Read more'}
            </p>
          )}

          {/* meta row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${aud.className}`}>
              {aud.icon} {aud.label}
            </span>
            <span className="text-[10px] text-muted-foreground">{a.author_name}</span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] text-muted-foreground">{formatDate(a.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAnnouncements;

import { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, BookOpen, CalendarDays, DollarSign, Megaphone, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  attendance: <CalendarDays className="h-3.5 w-3.5 text-blue-400" />,
  assignment: <BookOpen className="h-3.5 w-3.5 text-purple-400" />,
  fee:        <DollarSign className="h-3.5 w-3.5 text-yellow-400" />,
  general:    <Megaphone className="h-3.5 w-3.5 text-green-400" />,
  warning:    <Info className="h-3.5 w-3.5 text-red-400" />,
};

const TYPE_BG: Record<string, string> = {
  attendance: 'border-blue-500/30 bg-blue-500/10',
  assignment: 'border-purple-500/30 bg-purple-500/10',
  fee:        'border-yellow-500/30 bg-yellow-500/10',
  general:    'border-green-500/30 bg-green-500/10',
  warning:    'border-red-500/30 bg-red-500/10',
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

interface Props {
  notifications?: Notification[];
  autoFetch?: boolean;
}

const NotificationCarousel = ({ notifications: externalNotifs, autoFetch = false }: Props) => {
  const [notifications, setNotifications] = useState<Notification[]>(externalNotifs ?? []);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await secureApiClient.get<{ results?: Notification[] } | Notification[]>(
        '/notifications/notifications/?ordering=-created_at&page_size=20'
      );
      const list: Notification[] = Array.isArray(data) ? data : (data.results ?? []);
      setNotifications(list);
    } catch {}
  }, []);

  useEffect(() => {
    if (autoFetch) fetchNotifications();
  }, [autoFetch, fetchNotifications]);

  useEffect(() => {
    if (externalNotifs) setNotifications(externalNotifs);
  }, [externalNotifs]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection('left');
      setAnimating(true);
      setTimeout(() => {
        setCurrent(c => (c + 1) % notifications.length);
        setAnimating(false);
      }, 300);
    }, 4000);
  }, [notifications.length]);

  useEffect(() => {
    if (notifications.length <= 1) return;
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [notifications.length, startTimer]);

  const go = (dir: 'prev' | 'next') => {
    if (animating || notifications.length <= 1) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const d = dir === 'next' ? 'left' : 'right';
    setDirection(d);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(c =>
        dir === 'next'
          ? (c + 1) % notifications.length
          : (c - 1 + notifications.length) % notifications.length
      );
      setAnimating(false);
      startTimer();
    }, 300);
  };

  const unread = notifications.filter(n => !n.read).length;

  if (notifications.length === 0) return null;

  const n = notifications[current];
  const bg = TYPE_BG[n.type] ?? TYPE_BG.general;

  return (
    <div className={`relative rounded-xl border ${bg} px-3 py-2.5 flex items-center gap-2 overflow-hidden`}>
      {/* Bell + unread badge */}
      <div className="shrink-0 relative">
        <Bell className="h-4 w-4 text-foreground/60" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-red-500 text-[8px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>

      {/* Type icon */}
      <div className="shrink-0">{TYPE_ICON[n.type] ?? TYPE_ICON.general}</div>

      {/* Sliding content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div
          key={n.id}
          style={{
            animation: animating
              ? `slide-${direction}-out 0.3s ease forwards`
              : `slide-${direction}-in 0.3s ease forwards`,
          }}
        >
          <p className={`text-xs font-semibold truncate ${!n.read ? 'text-foreground' : 'text-foreground/70'}`}>
            {n.title}
          </p>
          {/* Scrolling marquee for message */}
          <div className="overflow-hidden relative">
            <p
              className="text-[10px] text-muted-foreground whitespace-nowrap"
              style={{ animation: `marquee ${Math.max(8, n.message.length * 0.12)}s linear infinite` }}
            >
              {n.message}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{n.message}
            </p>
          </div>
        </div>
      </div>

      {/* Time */}
      <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">{timeAgo(n.created_at)}</span>

      {/* Nav arrows */}
      {notifications.length > 1 && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => go('prev')} className="p-0.5 rounded hover:bg-black/10 transition-colors">
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <span className="text-[10px] text-muted-foreground w-8 text-center">
            {current + 1}/{notifications.length}
          </span>
          <button onClick={() => go('next')} className="p-0.5 rounded hover:bg-black/10 transition-colors">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Unread dot */}
      {!n.read && (
        <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
      )}


    </div>
  );
};

export default NotificationCarousel;

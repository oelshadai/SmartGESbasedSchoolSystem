import { useState, useEffect } from 'react';
import { Mail, MailOpen, Loader2, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { secureApiClient } from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';

interface InboxMessage {
  id: number;
  sender_name: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export default function SchoolAdminMessages() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [marking, setMarking] = useState<number | null>(null);

  useEffect(() => { fetchInbox(); }, []);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const res = await secureApiClient.get('/auth/superadmin/messages/inbox/');
      setMessages(res.messages || []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openMessage = async (msg: InboxMessage) => {
    setExpanded(expanded === msg.id ? null : msg.id);
    if (!msg.is_read) {
      setMarking(msg.id);
      try {
        await secureApiClient.patch(`/auth/superadmin/messages/${msg.id}/read/`, {});
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
      } catch {
        // silently ignore
      } finally {
        setMarking(null);
      }
    }
  };

  const unread = messages.filter(m => !m.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Messages from Admin
            {unread > 0 && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                {unread} new
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Direct messages from the platform administrator
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInbox}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Bell className="h-10 w-10 opacity-30" />
          <p className="text-sm">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(msg => (
            <div
              key={msg.id}
              onClick={() => openMessage(msg)}
              className={`bg-card border rounded-xl p-4 cursor-pointer transition-colors ${
                msg.is_read
                  ? 'border-border hover:border-primary/30'
                  : 'border-orange-500/40 bg-orange-500/5 hover:border-orange-500/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {marking === msg.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
                  ) : msg.is_read ? (
                    <MailOpen className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Mail className="h-4 w-4 text-orange-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-medium truncate ${!msg.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {msg.subject}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        From: <span className="text-foreground">{msg.sender_name}</span>
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {!msg.is_read && (
                        <span className="inline-block w-2 h-2 rounded-full bg-orange-500" />
                      )}
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {expanded === msg.id && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {msg.body}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
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
}

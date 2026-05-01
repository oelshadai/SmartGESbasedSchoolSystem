import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Loader2, MailOpen, Mail, CheckCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { secureApiClient } from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';

interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  school: string;
  is_active: boolean;
}

interface SentMessage {
  id: number;
  recipient_id: number;
  recipient_name: string;
  recipient_email: string;
  recipient_school: string;
  subject: string;
  body: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export default function AdminMessages() {
  const { toast } = useToast();
  const location = useLocation();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [sending, setSending] = useState(false);

  const preselect = (location.state as any)?.preselect;
  const [recipientId, setRecipientId] = useState(preselect ? String(preselect) : '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [search, setSearch] = useState('');
  const [selectedMsg, setSelectedMsg] = useState<SentMessage | null>(null);

  useEffect(() => {
    fetchAdmins();
    fetchMessages();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await secureApiClient.get('/auth/superadmin/admins/');
      setAdmins(res.admins || []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoadingAdmins(false);
    }
  };

  const fetchMessages = async () => {
    setLoadingMsgs(true);
    try {
      const res = await secureApiClient.get('/auth/superadmin/messages/');
      setMessages(res.messages || []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoadingMsgs(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      await secureApiClient.post('/auth/superadmin/messages/', {
        recipient_id: Number(recipientId),
        subject: subject.trim(),
        body: body.trim(),
      });
      toast({ title: 'Message sent', description: 'The admin has been notified.' });
      setRecipientId('');
      setSubject('');
      setBody('');
      fetchMessages();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const filtered = messages.filter(m =>
    m.recipient_name.toLowerCase().includes(search.toLowerCase()) ||
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    m.recipient_school.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm text-muted-foreground">Send direct messages to school admins and principals</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Compose panel */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Send className="h-4 w-4 text-orange-400" />
            Compose Message
          </h2>
          <form onSubmit={sendMessage} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Recipient *</Label>
              {loadingAdmins ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading admins...
                </div>
              ) : (
                <select
                  value={recipientId}
                  onChange={e => setRecipientId(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                >
                  <option value="">Select an admin...</option>
                  {admins.map(a => (
                    <option key={a.id} value={a.id} disabled={!a.is_active}>
                      {a.name} — {a.school} {!a.is_active ? '(inactive)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Subject *</Label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Message subject"
                maxLength={255}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Message *</Label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your message here..."
                required
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
            </div>

            <Button
              type="submit"
              disabled={sending}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            >
              {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : <><Send className="mr-2 h-4 w-4" /> Send Message</>}
            </Button>
          </form>
        </div>

        {/* Sent messages list */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold flex items-center gap-2">
              <MailOpen className="h-4 w-4 text-orange-400" />
              Sent Messages
              <Badge variant="outline" className="text-xs">{messages.length}</Badge>
            </h2>
            <div className="relative w-52">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 h-8 text-xs" />
            </div>
          </div>

          {loadingMsgs ? (
            <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-16 text-sm">No messages sent yet.</div>
          ) : (
            <div className="space-y-2">
              {filtered.map(msg => (
                <div
                  key={msg.id}
                  onClick={() => setSelectedMsg(selectedMsg?.id === msg.id ? null : msg)}
                  className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-orange-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {msg.is_read
                          ? <MailOpen className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          : <Mail className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />}
                        <p className="font-medium text-sm truncate">{msg.subject}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        To: <span className="text-foreground">{msg.recipient_name}</span> · {msg.recipient_school}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </p>
                      {msg.is_read ? (
                        <span className="text-[10px] text-green-500 flex items-center gap-0.5 justify-end mt-0.5">
                          <CheckCircle className="h-3 w-3" /> Read
                        </span>
                      ) : (
                        <span className="text-[10px] text-orange-400 mt-0.5 block">Unread</span>
                      )}
                    </div>
                  </div>

                  {/* Expanded body */}
                  {selectedMsg?.id === msg.id && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                      {msg.read_at && (
                        <p className="text-[11px] text-muted-foreground mt-2">
                          Read on {new Date(msg.read_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

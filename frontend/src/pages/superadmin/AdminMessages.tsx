import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Loader2, MailOpen, Mail, CheckCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import secureApiClient from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';

interface Admin { id: number; name: string; email: string; role: string; school: string; is_active: boolean; }
interface SentMessage { id: number; recipient_id: number; recipient_name: string; recipient_email: string; recipient_school: string; subject: string; body: string; is_read: boolean; read_at: string | null; created_at: string; }

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

  useEffect(() => { fetchAdmins(); fetchMessages(); }, []);

  const fetchAdmins = async () => {
    try {
      const res = await secureApiClient.get('/auth/superadmin/admins/');
      setAdmins(res.admins || []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setLoadingAdmins(false); }
  };

  const fetchMessages = async () => {
    setLoadingMsgs(true);
    try {
      const res = await secureApiClient.get('/auth/superadmin/messages/');
      setMessages(res.messages || []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setLoadingMsgs(false); }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      await secureApiClient.post('/auth/superadmin/messages/', { recipient_id: Number(recipientId), subject: subject.trim(), body: body.trim() });
      toast({ title: 'Message sent', description: 'The admin has been notified.' });
      setRecipientId(''); setSubject(''); setBody('');
      fetchMessages();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setSending(false); }
  };

  const filtered = messages.filter(m =>
    m.recipient_name.toLowerCase().includes(search.toLowerCase()) ||
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    m.recipient_school.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-full relative">
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      <div className="hidden sm:block absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Messages</h1>
          <p className="text-slate-400 text-sm mt-0.5">Send direct messages to school admins and principals</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Compose panel */}
          <div className="lg:col-span-2 relative rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm p-5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-400 opacity-60" />
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Send className="h-4 w-4 text-orange-400" /> Compose Message
            </h2>
            <form onSubmit={sendMessage} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Recipient *</label>
                {loadingAdmins ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading admins...
                  </div>
                ) : (
                  <select
                    value={recipientId}
                    onChange={e => setRecipientId(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40"
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
                <label className="text-sm font-medium text-slate-300">Subject *</label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Message subject" maxLength={255} required className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-orange-500/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Message *</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Write your message here..."
                  required rows={6}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm resize-none placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                />
              </div>
              <Button type="submit" disabled={sending} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white">
                {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : <><Send className="mr-2 h-4 w-4" /> Send Message</>}
              </Button>
            </form>
          </div>

          {/* Sent messages */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <MailOpen className="h-4 w-4 text-orange-400" />
                Sent Messages
                <Badge className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">{messages.length}</Badge>
              </h2>
              <div className="relative w-full sm:w-52">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 h-8 text-xs bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500" />
              </div>
            </div>

            {loadingMsgs ? (
              <div className="flex justify-center py-12">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl" />
                  <div className="relative w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                  </div>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <MailOpen className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No messages sent yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(msg => (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMsg(selectedMsg?.id === msg.id ? null : msg)}
                    className="group relative rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm p-4 cursor-pointer hover:border-orange-500/30 transition-all overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-400 opacity-0 group-hover:opacity-60 transition-opacity" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {msg.is_read
                            ? <MailOpen className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                            : <Mail className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />}
                          <p className="font-medium text-sm text-white truncate">{msg.subject}</p>
                        </div>
                        <p className="text-xs text-slate-500">
                          To: <span className="text-slate-300">{msg.recipient_name}</span> · {msg.recipient_school}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-slate-600 whitespace-nowrap">{new Date(msg.created_at).toLocaleDateString()}</p>
                        {msg.is_read
                          ? <span className="text-[10px] text-green-400 flex items-center gap-0.5 justify-end mt-0.5"><CheckCircle className="h-3 w-3" /> Read</span>
                          : <span className="text-[10px] text-orange-400 mt-0.5 block">Unread</span>}
                      </div>
                    </div>
                    {selectedMsg?.id === msg.id && (
                      <div className="mt-3 pt-3 border-t border-slate-800/60">
                        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                        {msg.read_at && <p className="text-[11px] text-slate-600 mt-2">Read on {new Date(msg.read_at).toLocaleString()}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

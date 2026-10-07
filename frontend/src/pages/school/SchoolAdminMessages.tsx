import { useState, useEffect, useCallback } from 'react';
import { Mail, MailOpen, Loader2, Bell, MessageSquare, Send, CheckCircle2, AlertCircle, Copy, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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

interface SmsLog {
  id: number;
  sms_type: string;
  status: 'success' | 'partial' | 'failed' | 'pending' | string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  no_phone_count: number;
  message_preview: string;
  created_at: string;
  details?: SmsLogRecipientDetail[];
}

interface SmsLogRecipientDetail {
  student?: string;
  name?: string;
  guardian_phone?: string | null;
  phone?: string;
  result?: string;
  status?: 'sent' | 'failed' | 'pending' | 'would_send' | string;
  reason?: string;
  failure_reason?: string;
}

interface GuardianWard {
  student_id: number;
  name: string;
  class_id: number | null;
  class_name: string;
}

interface SmsRecipient {
  phone: string;
  name: string;
  wards?: GuardianWard[];
}

interface SchoolClass {
  id: number;
  full_name: string;
  level?: string;
  level_display?: string;
  section?: string;
}

const getSmsErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object') {
    const errorRecord = error as Record<string, unknown>;
    const response = errorRecord.response;
    const responseData = response && typeof response === 'object'
      ? (response as Record<string, unknown>).data
      : undefined;

    if (responseData && typeof responseData === 'object') {
      const data = responseData as Record<string, unknown>;
      for (const key of ['error', 'detail', 'message']) {
        if (typeof data[key] === 'string') return data[key];
      }
    }

    if (error instanceof Error && error.message) return error.message;
  }

  return 'The SMS request failed. Please try again.';
};

export default function SchoolAdminMessages() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('inbox');
  
  // Inbox state
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [marking, setMarking] = useState<number | null>(null);

  // SMS logs state
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [smsLogsLoading, setSmsLogsLoading] = useState(false);
  const [smsLogsExpanded, setSmsLogsExpanded] = useState<number | null>(null);

  // Send SMS state
  const [recipients, setRecipients] = useState<SmsRecipient[]>([
    { phone: '', name: '' }
  ]);
  const [smsMessage, setSmsMessage] = useState('');
  const [sendingMode, setSendingMode] = useState<'preview' | 'send' | null>(null);

  // Saved parents state
  const [savedParents, setSavedParents] = useState<SmsRecipient[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const [savedParentsLoading, setSavedParentsLoading] = useState(false);
  const [savedParentsFilter, setSavedParentsFilter] = useState('');
  const [savedParentsClassFilter, setSavedParentsClassFilter] = useState('all');
  const [showSavedParents, setShowSavedParents] = useState(false);

  const filteredSavedParents = savedParents.flatMap(parent => {
    const matchingWards = (parent.wards || []).filter(ward =>
      savedParentsClassFilter === 'all'
      || (savedParentsClassFilter === 'no-class' && ward.class_id === null)
      || String(ward.class_id) === savedParentsClassFilter
    );
    if (savedParentsClassFilter !== 'all' && matchingWards.length === 0) return [];
    const search = savedParentsFilter.trim().toLowerCase();
    const matchesSearch = !search
      || parent.name.toLowerCase().includes(search)
      || parent.phone.toLowerCase().includes(search)
      || matchingWards.some(ward =>
        ward.name.toLowerCase().includes(search) ||
        ward.class_name.toLowerCase().includes(search)
      );
    return matchesSearch ? [{ ...parent, wards: matchingWards }] : [];
  });

  const recipientPhoneKey = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('0') && digits.length === 10
      ? `233${digits.slice(1)}`
      : digits;
  };

  const isParentAdded = (parent: SmsRecipient) => {
    const phoneKey = recipientPhoneKey(parent.phone);
    return recipients.some(recipient =>
      phoneKey && recipientPhoneKey(recipient.phone) === phoneKey
    );
  };

  useEffect(() => { 
    fetchInbox();
    if (activeTab === 'sms-logs') {
      fetchSmsLogs();
    }
    if (activeTab === 'send-sms' && savedParents.length === 0) {
      fetchSavedParents();
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'sms-logs') {
      fetchSmsLogs();
    } else if (activeTab === 'send-sms') {
      if (savedParents.length === 0) {
        fetchSavedParents();
      }
    }
  }, [activeTab]);

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

  const fetchSmsLogs = async () => {
    setSmsLogsLoading(true);
    try {
      const allLogs: SmsLog[] = [];
      let page = 1;
      let response: any;
      do {
        response = await secureApiClient.get<any>(
          `/notifications/sms-logs/?ordering=-created_at&page=${page}`
        );
        if (Array.isArray(response)) {
          allLogs.push(...response);
          break;
        }
        allLogs.push(...(response.results || []));
        page += 1;
      } while (response.next);
      setSmsLogs(allLogs);
    } catch (e: any) {
      toast({ title: 'Error loading SMS logs', description: e.message, variant: 'destructive' });
    } finally {
      setSmsLogsLoading(false);
    }
  };

  const fetchSavedParents = async () => {
    setSavedParentsLoading(true);
    try {
      const [res, classRes] = await Promise.all([
        secureApiClient.get<any>('/students/guardians/'),
        secureApiClient.get<any>('/schools/classes/'),
      ]);
      const parents = Array.isArray(res) ? res : res.results || [];
      const classes = Array.isArray(classRes) ? classRes : classRes.results || [];
      setSavedParents(parents);
      setSchoolClasses(classes.map((schoolClass: SchoolClass) => ({
        ...schoolClass,
        full_name: schoolClass.full_name
          || `${schoolClass.level_display || schoolClass.level || ''} ${schoolClass.section || ''}`.trim(),
      })));
    } catch (e: any) {
      toast({ title: 'Error loading parents', description: e.message, variant: 'destructive' });
    } finally {
      setSavedParentsLoading(false);
    }
  };

  const addRecipientFromParent = (parent: SmsRecipient) => {
    const phoneKey = recipientPhoneKey(parent.phone);
    if (!phoneKey) return;
    setRecipients(current => current.some(recipient =>
      recipientPhoneKey(recipient.phone) === phoneKey
    ) ? current : [...current, parent]);
  };

  const addAllVisibleParents = () => {
    setRecipients(current => {
      const addedPhoneKeys = new Set(
        current.map(recipient => recipientPhoneKey(recipient.phone)).filter(Boolean)
      );
      const newRecipients = filteredSavedParents.filter(parent => {
        const phoneKey = recipientPhoneKey(parent.phone);
        if (!phoneKey || addedPhoneKeys.has(phoneKey)) return false;
        addedPhoneKeys.add(phoneKey);
        return true;
      });
      return newRecipients.length ? [...current, ...newRecipients] : current;
    });
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

  const addRecipient = () => {
    setRecipients([...recipients, { phone: '', name: '' }]);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, field: 'phone' | 'name', value: string) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const sendDirectSms = async (dryRun: boolean) => {
    // Validate
    const validRecipients = recipients.filter(r => r.phone.trim());
    if (validRecipients.length === 0) {
      toast({
        title: 'No recipients selected',
        description: 'Please add at least one recipient with a phone number.',
        variant: 'destructive',
      });
      return;
    }
    if (!smsMessage.trim()) {
      toast({
        title: 'Message required',
        description: 'Please enter a message before continuing.',
        variant: 'destructive',
      });
      return;
    }

    setSendingMode(dryRun ? 'preview' : 'send');
    try {
      const payload = {
        recipients: validRecipients,
        message: smsMessage.trim(),
        dry_run: dryRun,
      };

      const result = await secureApiClient.post<any>(
        '/notifications/sms-logs/send_direct_sms/',
        payload,
        { timeout: 300_000 }
      );

      if (dryRun) {
        toast({
          title: 'SMS preview',
          description: `${result.sent}/${result.total} selected recipient(s) would receive this SMS.`,
        });
      } else {
        // Confirm sent
        const parts = [`SMS sent to ${result.sent} recipient(s)`];
        if (result.failed > 0) parts.push(`${result.failed} failed`);
        toast({ title: 'SMS sent', description: parts.join('. ') });
        
        // Reset form
        setRecipients([{ phone: '', name: '' }]);
        setSmsMessage('');
        
        // Refresh logs
        await fetchSmsLogs();
      }
    } catch (e: unknown) {
      const errorRecord = e && typeof e === 'object'
        ? e as Record<string, unknown>
        : undefined;
      const isConnectionFailure = Boolean(
        errorRecord && !errorRecord.response
      );
      if (isConnectionFailure) {
        void fetchSmsLogs();
      }
      toast({
        title: dryRun ? 'SMS preview failed' : 'SMS could not be sent',
        description: isConnectionFailure
          ? `${getSmsErrorMessage(e)} Some messages may already have been accepted. Check SMS History before retrying.`
          : getSmsErrorMessage(e),
        variant: 'destructive',
      });
    } finally {
      setSendingMode(null);
    }
  };

  const unread = messages.filter(m => !m.is_read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messages & SMS</h1>
          <p className="text-sm text-foreground/70">Manage messages and SMS communications</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="messages-tabs-list grid w-full grid-cols-3">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Inbox
            {unread > 0 && (
              <Badge variant="secondary" className="ml-1">{unread}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="send-sms" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send SMS
          </TabsTrigger>
          <TabsTrigger value="sms-logs" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS History
          </TabsTrigger>
        </TabsList>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-foreground">Messages from Admin</h2>
              <p className="text-sm text-foreground/70">Direct messages from the platform administrator</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchInbox}
              className="bg-foreground/5 border-foreground/20 text-foreground hover:bg-foreground/10 hover:text-foreground font-medium"
            >
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-foreground/60 gap-3">
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
                        <MailOpen className="h-4 w-4 text-foreground/60" />
                      ) : (
                        <Mail className="h-4 w-4 text-orange-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm font-medium truncate ${!msg.is_read ? 'text-foreground' : 'text-foreground/70'}`}>
                            {msg.subject}
                          </p>
                          <p className="text-xs text-foreground/60 mt-0.5">
                            From: <span className="text-foreground">{msg.sender_name}</span>
                          </p>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                          {!msg.is_read && (
                            <span className="inline-block w-2 h-2 rounded-full bg-orange-500" />
                          )}
                          <p className="text-xs text-foreground/60 whitespace-nowrap">
                            {new Date(msg.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {expanded === msg.id && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                            {msg.body}
                          </p>
                          <p className="text-[11px] text-foreground/60 mt-2">
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
        </TabsContent>

        {/* Send SMS Tab */}
        <TabsContent value="send-sms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Send className="h-5 w-5" />
                Send SMS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Message *</Label>
                <Textarea
                  placeholder="Enter SMS message text..."
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  rows={4}
                  className="text-foreground placeholder:text-foreground/50"
                />
                <p className="text-xs text-foreground/60">{smsMessage.length}/160 chars per SMS segment</p>
              </div>

              {/* Saved Parents Section */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground font-medium">Quick Add Parent</Label>
                  <Button 
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowSavedParents(!showSavedParents);
                      if (!showSavedParents && savedParents.length === 0) {
                        fetchSavedParents();
                      }
                    }}
                    className="bg-foreground/5 border-foreground/20 text-foreground hover:bg-foreground/10 font-medium"
                  >
                    {showSavedParents ? 'Hide' : 'Show'} Parent Directory
                  </Button>
                </div>
                
                {showSavedParents && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Search by ward, parent, or phone..."
                      value={savedParentsFilter}
                      onChange={(e) => setSavedParentsFilter(e.target.value)}
                      className="text-foreground placeholder:text-foreground/50"
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label htmlFor="parent-class-filter" className="text-sm text-foreground/70 shrink-0">
                        Filter by class
                      </Label>
                      <select
                        id="parent-class-filter"
                        value={savedParentsClassFilter}
                        onChange={(e) => setSavedParentsClassFilter(e.target.value)}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                      >
                        <option value="all">All classes</option>
                        <option value="no-class">No class assigned</option>
                        {schoolClasses.map(schoolClass => (
                          <option key={schoolClass.id} value={String(schoolClass.id)}>
                            {schoolClass.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {savedParentsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-foreground/60" />
                      </div>
                    ) : savedParents.length === 0 ? (
                      <p className="text-sm text-foreground/60 py-4 text-center">No parents found in system.</p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-foreground/60">
                            {filteredSavedParents.length} parent{filteredSavedParents.length === 1 ? '' : 's'} match
                            {savedParentsFilter ? ' your search' : ''}
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={addAllVisibleParents}
                            disabled={!filteredSavedParents.some(parent => !isParentAdded(parent))}
                            className="bg-foreground/5 border-foreground/20 text-foreground hover:bg-foreground/10 font-medium"
                          >
                            Add all matching ({filteredSavedParents.filter(parent => !isParentAdded(parent)).length})
                          </Button>
                        </div>
                        <div className="max-h-64 overflow-y-auto border rounded-lg bg-muted/30">
                          {filteredSavedParents.length === 0 ? (
                            <p className="text-sm text-foreground/60 py-4 text-center">No parents match your search.</p>
                          ) : filteredSavedParents.map((parent) => {
                            const added = isParentAdded(parent);
                            return (
                              <button
                                key={recipientPhoneKey(parent.phone) || parent.phone}
                                type="button"
                                onClick={() => addRecipientFromParent(parent)}
                                disabled={added}
                                aria-pressed={added}
                                className={`w-full text-left px-3 py-2 border-b last:border-b-0 transition-colors flex items-center justify-between group ${
                                  added
                                    ? 'bg-primary/10 cursor-default'
                                    : 'hover:bg-muted/50'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground truncate">{parent.name}</p>
                                  <p className="text-xs text-foreground/60 truncate">{parent.phone}</p>
                                  <div className="mt-2 space-y-1">
                                    {parent.wards?.length ? parent.wards.map(ward => (
                                      <div key={ward.student_id} className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-xs text-foreground/80">{ward.name}</span>
                                        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                                          {ward.class_name}
                                        </Badge>
                                      </div>
                                    )) : (
                                      <span className="text-xs text-foreground/60">Ward details unavailable</span>
                                    )}
                                  </div>
                                </div>
                                <span className={`text-xs whitespace-nowrap ml-2 flex items-center gap-1 ${
                                  added ? 'text-primary font-medium' : 'text-foreground/60 group-hover:text-foreground'
                                }`}>
                                  {added ? <><CheckCircle2 className="h-3.5 w-3.5" /> Added</> : '+ Add'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Recipients *</Label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recipients.map((recipient, idx) => (
                    <div key={idx} className="flex gap-2 items-end">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Phone number"
                          value={recipient.phone}
                          onChange={(e) => updateRecipient(idx, 'phone', e.target.value)}
                          aria-label={`Recipient ${idx + 1} phone number`}
                          className="text-foreground placeholder:text-foreground/50"
                        />
                        <Input
                          placeholder="Name (optional)"
                          value={recipient.name}
                          onChange={(e) => updateRecipient(idx, 'name', e.target.value)}
                          className="text-foreground placeholder:text-foreground/50"
                        />
                      </div>
                      {recipients.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRecipient(idx)}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950 font-medium shrink-0"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addRecipient}
                  className="w-full bg-foreground/5 border-foreground/20 text-foreground hover:bg-foreground/10 hover:text-foreground font-medium"
                >
                  + Add Recipient
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => sendDirectSms(true)}
                  disabled={sendingMode !== null || !smsMessage.trim() || recipients.filter(r => r.phone.trim()).length === 0}
                  className="bg-foreground/5 border-foreground/20 text-foreground hover:bg-foreground/10 hover:text-foreground font-medium"
                >
                  {sendingMode === 'preview' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Preview
                </Button>
                <Button
                  onClick={() => sendDirectSms(false)}
                  disabled={sendingMode !== null || !smsMessage.trim() || recipients.filter(r => r.phone.trim()).length === 0}
                  className="sm:flex-1 font-medium"
                >
                  {sendingMode === 'send' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Send SMS
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Logs Tab */}
        <TabsContent value="sms-logs" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-foreground">SMS Sent History</h2>
              <p className="text-sm text-foreground/70">View all sent SMS messages and fee reminders</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchSmsLogs}
              className="bg-foreground/5 border-foreground/20 text-foreground hover:bg-foreground/10 hover:text-foreground font-medium"
            >
              Refresh
            </Button>
          </div>

          {smsLogsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : smsLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-foreground/60 gap-3">
              <MessageSquare className="h-10 w-10 opacity-30" />
              <p className="text-sm">No SMS sent yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {smsLogs.map(log => (
                <Card key={log.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSmsLogsExpanded(smsLogsExpanded === log.id ? null : log.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {log.status === 'success' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : log.status === 'partial' ? (
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                          ) : log.status === 'pending' ? (
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-sm">
                              {log.sms_type === 'fee_reminder'
                                ? '📋 Fee Reminder'
                                : log.sms_type === 'attendance'
                                  ? '📣 Attendance Alert'
                                  : '📱 Direct SMS'}
                            </h3>
                              <Badge variant={log.status === 'success' ? 'default' : log.status === 'partial' || log.status === 'pending' ? 'secondary' : 'destructive'}>
                              {log.status.toUpperCase()}
                            </Badge>
                              <Badge variant="outline" className="text-xs">
                                {log.total_recipients} recipient{log.total_recipients === 1 ? '' : 's'}
                              </Badge>
                            {log.total_recipients > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {log.sent_count} accepted · {log.failed_count} failed
                                {log.status === 'pending'
                                  ? ` · ${Math.max(0, log.total_recipients - log.sent_count - log.failed_count)} pending`
                                  : ''}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-foreground/70 mt-1">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                          <p className="text-sm text-foreground/70 mt-2 line-clamp-2">
                            "{log.message_preview}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {smsLogsExpanded === log.id && log.details && log.details.length > 0 && (
                      <div className="mt-4 pt-4 border-t space-y-2">
                        <p className="text-xs font-medium text-foreground/70">
                          Recipient results (accepted means submitted successfully to the SMS provider, not confirmed handset delivery):
                        </p>
                        <div className="max-h-48 overflow-y-auto space-y-2 text-xs">
                          {log.details.map((detail, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                              <div>
                                <p className="font-medium text-foreground">{detail.student || detail.name}</p>
                                <p className="text-foreground/70">{detail.guardian_phone || detail.phone}</p>
                                {(detail.reason || detail.failure_reason) && (
                                  <p className="text-destructive mt-1">{detail.reason || detail.failure_reason}</p>
                                )}
                              </div>
                              <Badge variant={
                                detail.result === 'sent' || detail.status === 'sent' || detail.status === 'would_send'
                                  ? 'default'
                                  : detail.status === 'pending'
                                    ? 'secondary'
                                    : 'destructive'
                              }>
                                {detail.result === 'sent' || detail.status === 'sent'
                                  ? '✓ Accepted by provider'
                                  : detail.result === 'would_send' || detail.status === 'would_send'
                                    ? 'Preview'
                                    : detail.status === 'pending'
                                      ? 'In progress'
                                      : '✕ Failed'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

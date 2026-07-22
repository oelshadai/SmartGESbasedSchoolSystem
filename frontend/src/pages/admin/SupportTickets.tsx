import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageSquare, Eye, Search, Clock, AlertTriangle, CheckCircle2,
  XCircle, RefreshCw, Mail, Calendar, User, Building, X, Send,
  Loader2, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { supportService, SupportTicket } from '@/services/supportService';

// ── Config ────────────────────────────────────────────────────────────────────

const PRIORITY_CFG: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  critical: { bg: 'bg-red-500/20',    text: 'text-red-400',    border: 'border-red-500/30',    icon: AlertTriangle },
  high:     { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', icon: AlertTriangle },
  medium:   { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: Clock },
  low:      { bg: 'bg-green-500/20',  text: 'text-green-400',  border: 'border-green-500/30',  icon: CheckCircle2 },
};

const STATUS_CFG: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
  open:        { bg: 'bg-blue-500/20',   text: 'text-blue-400',   border: 'border-blue-500/30',   icon: MessageSquare, label: 'Open' },
  in_progress: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', icon: Clock,         label: 'In Progress' },
  resolved:    { bg: 'bg-green-500/20',  text: 'text-green-400',  border: 'border-green-500/30',  icon: CheckCircle2,  label: 'Resolved' },
  closed:      { bg: 'bg-gray-500/20',   text: 'text-slate-400',  border: 'border-gray-500/30',   icon: XCircle,       label: 'Closed' },
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// ── Component ─────────────────────────────────────────────────────────────────

const SupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Detail / reply modal
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('in_progress');
  const [replying, setReplying] = useState(false);

  // Inline status/priority dropdown
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supportService.getAllTickets({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        priority: filterPriority !== 'all' ? filterPriority : undefined,
        search: search.trim() || undefined,
      });
      setTickets(data);
    } catch {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority, search]);

  useEffect(() => { load(); }, [load]);

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    setReplying(true);
    try {
      const updated = await supportService.replyToTicket(selected.id, replyText.trim(), replyStatus);
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      setSelected(updated);
      setReplyText('');
      toast.success('Reply sent successfully');
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (ticket: SupportTicket, newStatus: string) => {
    setUpdatingId(ticket.id);
    try {
      const updated = await supportService.updateStatus(ticket.id, newStatus, undefined);
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      if (selected?.id === updated.id) setSelected(updated);
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePriorityChange = async (ticket: SupportTicket, newPriority: string) => {
    setUpdatingId(ticket.id);
    try {
      const updated = await supportService.updateStatus(ticket.id, undefined, newPriority);
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      if (selected?.id === updated.id) setSelected(updated);
      toast.success('Priority updated');
    } catch {
      toast.error('Failed to update priority');
    } finally {
      setUpdatingId(null);
    }
  };

  const openTicket = (ticket: SupportTicket) => {
    setSelected(ticket);
    setReplyText('');
    setReplyStatus(ticket.status === 'open' ? 'in_progress' : ticket.status);
  };

  // Stats
  const stats = [
    { label: 'Open',        value: tickets.filter(t => t.status === 'open').length,        gradient: 'from-blue-500 to-cyan-500',    border: 'border-blue-500/20',   bg: 'bg-blue-500/20',   glow: 'shadow-blue-500/10',   icon: MessageSquare },
    { label: 'In Progress', value: tickets.filter(t => t.status === 'in_progress').length,  gradient: 'from-purple-500 to-pink-500',  border: 'border-purple-500/20', bg: 'bg-purple-500/20', glow: 'shadow-purple-500/10', icon: Clock },
    { label: 'Resolved',    value: tickets.filter(t => t.status === 'resolved').length,     gradient: 'from-green-500 to-emerald-500',border: 'border-green-500/20',  bg: 'bg-green-500/20',  glow: 'shadow-green-500/10',  icon: CheckCircle2 },
    { label: 'Critical',    value: tickets.filter(t => t.priority === 'critical').length,   gradient: 'from-red-500 to-orange-500',   border: 'border-red-500/20',    bg: 'bg-red-500/20',    glow: 'shadow-red-500/10',    icon: AlertTriangle },
  ];

  return (
    <div className="flex flex-col w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative min-h-screen">
      {/* Background */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      <div className="hidden sm:block absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Support Tickets</h1>
            <p className="text-slate-400 mt-1">Manage and respond to support requests from schools</p>
          </div>
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`relative group rounded-2xl border ${stat.border} bg-slate-900/60 backdrop-blur-xl p-5 shadow-xl ${stat.glow} hover:scale-[1.02] transition-all duration-300 overflow-hidden`}>
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient} opacity-70 group-hover:opacity-100 transition-opacity`} />
                <div className={`absolute -top-6 -right-6 w-20 h-20 ${stat.bg} rounded-full blur-2xl opacity-60`} />
                <div className="relative">
                  <div className={`inline-flex p-2.5 rounded-xl ${stat.bg} border ${stat.border} mb-3`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-white">{loading ? '—' : stat.value}</p>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by subject, school, or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="h-10 px-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="h-10 px-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 overflow-hidden">
          <div className="p-5 border-b border-slate-800/50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">All Tickets</h3>
              <p className="text-slate-400 text-sm mt-0.5">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full bg-slate-800/50" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-16 text-center">
              <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No tickets found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {tickets.map(ticket => {
                const pCfg = PRIORITY_CFG[ticket.priority] ?? PRIORITY_CFG.medium;
                const sCfg = STATUS_CFG[ticket.status] ?? STATUS_CFG.open;
                const PIcon = pCfg.icon;
                const SIcon = sCfg.icon;
                const isUpdating = updatingId === ticket.id;

                return (
                  <div key={ticket.id} className="p-5 hover:bg-slate-800/30 transition-colors group">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <MessageSquare className="h-5 w-5 text-blue-400" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                              #{ticket.id} — {ticket.subject}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                              {ticket.school_name && (
                                <span className="flex items-center gap-1"><Building className="h-3 w-3" />{ticket.school_name}</span>
                              )}
                              <span className="flex items-center gap-1"><User className="h-3 w-3" />{ticket.submitter_name}</span>
                              <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{ticket.submitter_email}</span>
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(ticket.created_at)}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Status dropdown */}
                            <div className="relative">
                              <select
                                value={ticket.status}
                                disabled={isUpdating}
                                onChange={e => handleStatusChange(ticket, e.target.value)}
                                className={`h-7 pl-2 pr-6 text-xs rounded-lg border ${sCfg.bg} ${sCfg.text} ${sCfg.border} bg-transparent outline-none cursor-pointer appearance-none`}
                              >
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                              </select>
                              <ChevronDown className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none ${sCfg.text}`} />
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-3 text-xs border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                              onClick={() => openTicket(ticket)}
                            >
                              <Eye className="h-3 w-3 mr-1" /> View & Reply
                            </Button>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${pCfg.bg} ${pCfg.text} border ${pCfg.border}`}>
                            <PIcon className="h-3 w-3" />{ticket.priority}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${sCfg.bg} ${sCfg.text} border ${sCfg.border}`}>
                            <SIcon className="h-3 w-3" />{sCfg.label}
                          </span>
                          {ticket.admin_reply && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/20 text-teal-400 border border-teal-500/30">
                              <CheckCircle2 className="h-3 w-3" /> Replied
                            </span>
                          )}
                        </div>

                        {/* Message preview */}
                        <p className="text-slate-400 text-sm mt-2 line-clamp-2">{ticket.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Detail / Reply Modal ─────────────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between p-5 border-b border-slate-800">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-xs text-slate-400 mb-1">Ticket #{selected.id}</p>
                <h2 className="text-lg font-bold text-white leading-tight">{selected.subject}</h2>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                  {selected.school_name && (
                    <span className="flex items-center gap-1"><Building className="h-3 w-3" />{selected.school_name}</span>
                  )}
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{selected.submitter_name}</span>
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{selected.submitter_email}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDateTime(selected.created_at)}</span>
                </div>
              </div>
              <button
                className="text-slate-400 hover:text-white transition-colors shrink-0"
                onClick={() => setSelected(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* Priority & Status controls */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Priority:</span>
                  <select
                    value={selected.priority}
                    onChange={e => handlePriorityChange(selected, e.target.value)}
                    className="h-7 px-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Status:</span>
                  <select
                    value={selected.status}
                    onChange={e => handleStatusChange(selected, e.target.value)}
                    className="h-7 px-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Original message */}
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Message from {selected.submitter_name}</p>
                <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{selected.message}</p>
              </div>

              {/* Existing reply */}
              {selected.admin_reply && (
                <div className="rounded-xl bg-teal-500/10 border border-teal-500/30 p-4">
                  <p className="text-xs font-semibold text-teal-400 uppercase tracking-wide mb-2">
                    Your Reply {selected.replied_at && `· ${fmtDateTime(selected.replied_at)}`}
                  </p>
                  <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{selected.admin_reply}</p>
                </div>
              )}

              {/* Reply form */}
              {selected.status !== 'closed' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {selected.admin_reply ? 'Update Reply' : 'Write a Reply'}
                  </p>
                  <Textarea
                    placeholder="Type your response to the school admin..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    className="min-h-[120px] bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 resize-none focus:border-blue-500"
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Mark as:</span>
                      <select
                        value={replyStatus}
                        onChange={e => setReplyStatus(e.target.value)}
                        className="h-8 px-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white outline-none"
                      >
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <Button
                      className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={!replyText.trim() || replying}
                      onClick={handleReply}
                    >
                      {replying
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</>
                        : <><Send className="h-4 w-4 mr-2" />Send Reply</>
                      }
                    </Button>
                  </div>
                </div>
              )}

              {selected.status === 'closed' && (
                <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-4 text-center">
                  <XCircle className="h-6 w-6 text-slate-500 mx-auto mb-1" />
                  <p className="text-slate-400 text-sm">This ticket is closed. Change the status to reopen it.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;

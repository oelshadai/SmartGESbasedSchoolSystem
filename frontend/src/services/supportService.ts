import secureApiClient from '@/lib/secureApiClient';

export interface SupportTicket {
  id: number;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  school_name: string;
  submitter_name: string;
  submitter_email: string;
  admin_reply: string;
  replied_at: string | null;
  replied_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  search?: string;
}

export const supportService = {
  async createTicket(data: { subject: string; message: string; priority?: string }) {
    return secureApiClient.post('/notifications/support-tickets/', data);
  },

  async getMyTickets(): Promise<SupportTicket[]> {
    const resp = await secureApiClient.get('/notifications/support-tickets/');
    return Array.isArray(resp) ? resp : (resp as any).results ?? [];
  },

  async getAllTickets(filters: TicketFilters = {}): Promise<SupportTicket[]> {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.search) params.set('search', filters.search);
    const query = params.toString();
    const resp = await secureApiClient.get(`/notifications/support-tickets/${query ? `?${query}` : ''}`);
    return Array.isArray(resp) ? resp : (resp as any).results ?? [];
  },

  async replyToTicket(id: number, reply: string, status: string): Promise<SupportTicket> {
    return secureApiClient.post(`/notifications/support-tickets/${id}/reply/`, { reply, status }) as any;
  },

  async updateStatus(id: number, status?: string, priority?: string): Promise<SupportTicket> {
    return secureApiClient.patch(`/notifications/support-tickets/${id}/update_status/`, { status, priority }) as any;
  },
};

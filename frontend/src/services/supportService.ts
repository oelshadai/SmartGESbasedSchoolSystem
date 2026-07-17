import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface SupportTicket {
  id?: number;
  subject: string;
  message: string;
  status?: string;
  created_at?: string;
}

export const supportService = {
  async createTicket(ticket: Omit<SupportTicket, 'id' | 'status' | 'created_at'>) {
    const token = localStorage.getItem('access_token');
    const response = await axios.post(
      `${API_BASE_URL}/notifications/support-tickets/`,
      ticket,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  async getTickets() {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(
      `${API_BASE_URL}/notifications/support-tickets/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },
};
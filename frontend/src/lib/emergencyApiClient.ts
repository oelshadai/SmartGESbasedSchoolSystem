// Emergency API Client - Simplified version to fix timeout issues
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Simple API client without complex interceptors
const emergencyApiClient = axios.create({
  baseURL: API_BASE,
  timeout: 5000, // 5 seconds only
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Emergency auth service
export const emergencyAuthService = {
  async testConnection() {
    try {
      const response = await emergencyApiClient.get('/auth/csrf-token/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async studentLogin(studentId: string, password: string) {
    try {
      const response = await emergencyApiClient.post('/auth/student-login/', {
        student_id: studentId,
        password: password
      });
      
      // Store tokens
      if (response.data.access) {
        sessionStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        sessionStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Student login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  },

  async teacherLogin(email: string, password: string) {
    try {
      const response = await emergencyApiClient.post('/auth/teacher-login/', {
        email: email,
        password: password
      });
      
      // Store tokens
      if (response.data.access) {
        sessionStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        sessionStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Teacher login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  },

  async adminLogin(email: string, password: string) {
    try {
      const response = await emergencyApiClient.post('/auth/admin-login/', {
        email: email,
        password: password
      });
      
      // Store tokens
      if (response.data.access) {
        sessionStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        sessionStorage.setItem('user_data', JSON.stringify(response.data.user));
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Admin login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }
};

export default emergencyApiClient;
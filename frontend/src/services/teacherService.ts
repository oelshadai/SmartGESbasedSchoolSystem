import { secureApiClient } from '@/lib/secureApiClient';

export interface TeacherProfile {
  id: number;
  user_id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  full_name: string;
  hire_date: string;
  qualification?: string;
  experience_years: number;
  emergency_contact?: string;
  address?: string;
  is_class_teacher: boolean;
  is_active: boolean;
  specializations_detail: Array<{
    id: number;
    name: string;
  }>;
  assigned_class?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateTeacherProfile {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  emergency_contact?: string;
  address?: string;
  qualification?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export const teacherService = {
  // Get current teacher's profile
  getProfile: async (): Promise<TeacherProfile> => {
    const data = await secureApiClient.get<TeacherProfile>('/teachers/profile/');
    return data;
  },

  // Update teacher profile
  updateProfile: async (profileData: UpdateTeacherProfile): Promise<TeacherProfile> => {
    const data = await secureApiClient.patch<TeacherProfile>('/teachers/profile/', profileData);
    return data;
  },

  // Change password
  changePassword: async (passwordData: ChangePasswordRequest): Promise<void> => {
    await secureApiClient.post('/auth/change-password/', passwordData);
  },

  // Get teacher dashboard stats
  getDashboardStats: async () => {
    const data = await secureApiClient.get('/teachers/dashboard_stats/');
    return data;
  },

  // Get teacher assignments
  getAssignments: async () => {
    const data = await secureApiClient.get('/teachers/assignments/');
    return data;
  }
};
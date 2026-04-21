export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface ChildInfo {
  student_id: string;
  name: string;
  relationship: string;
}

export interface User {
  id: number;
  email?: string;
  username?: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number?: string;
  school?: {
    id: number;
    name: string;
  };
  children?: ChildInfo[];
}

export interface School {
  id: number;
  name: string;
  address: string;
  email: string;
  logo?: string;
  current_academic_year: string;
  score_entry_mode: string;
  report_template: string;
}

export interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  current_class: {
    id: number;
    level: string;
    section: string;
  };
  username: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  assignment_type: 'QUIZ' | 'HOMEWORK' | 'PROJECT' | 'EXAM';
  due_date: string;
  max_score: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  is_timed: boolean;
  time_limit?: number;
  questions?: Question[];
  subject?: string;
  created_at?: string;
}

export interface Question {
  id: number;
  question_text: string;
  question_type: 'mcq' | 'short_answer' | 'essay';
  options?: QuestionOption[];
}

export interface QuestionOption {
  id?: number;
  option_text: string;
  is_correct: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface DashboardStats {
  total_students?: number;
  total_teachers?: number;
  total_classes?: number;
  total_schools?: number;
  total_assignments?: number;
  pending_submissions?: number;
  average_score?: number;
}

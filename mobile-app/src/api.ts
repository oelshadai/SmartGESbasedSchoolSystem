import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api').replace(/\/+$/, '');
const ACCESS_KEY = 'smartges_access_token';
const REFRESH_KEY = 'smartges_refresh_token';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export type StudentProfile = {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  student_id: string;
  class: string;
  school: string;
  email?: string | null;
};

export type GradeReport = {
  id: number;
  term: string;
  academic_year: string;
  class_name: string;
  average_score: number;
  class_position: number;
  total_students: number;
  teacher_remarks?: string;
  subjects: Array<{
    subject_name: string;
    ca_score: number;
    exam_score: number;
    total_score: number;
    grade: string;
    remark?: string;
  }>;
};

export type StudentAssignment = {
  id: number;
  title: string;
  description?: string;
  subject_name: string;
  assignment_type: string;
  due_date?: string | null;
  points: number;
  status: string;
  score?: number | null;
};

export type PublishedReport = {
  id: number;
  term_name: string;
  academic_year: string;
  status: string;
  published_at?: string | null;
  pdf_url?: string | null;
};

type LoginResponse = {
  access: string;
  refresh: string;
  user: { id: number; first_name: string; last_name: string; role: string };
};

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.text();
  let data: any = null;
  if (body) {
    try {
      data = JSON.parse(body);
    } catch {
      data = { detail: body.slice(0, 180) };
    }
  }
  if (!response.ok) {
    throw new Error(data?.error || data?.detail || `Request failed (${response.status})`);
  }
  return data as T;
}

async function saveTokens(access: string, refresh: string): Promise<void> {
  accessToken = access;
  refreshToken = refresh;
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, access),
    SecureStore.setItemAsync(REFRESH_KEY, refresh),
  ]);
}

async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    const tokens = await parseResponse<{ access: string; refresh?: string }>(response);
    await saveTokens(tokens.access, tokens.refresh || refreshToken);
    return true;
  } catch {
    await clearTokens();
    return false;
  }
}

export async function restoreSession(): Promise<boolean> {
  const [storedAccess, storedRefresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  accessToken = storedAccess;
  refreshToken = storedRefresh;
  return Boolean(accessToken && refreshToken);
}

export async function signIn(studentId: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/student-login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ student_id: studentId.trim(), password }),
  });
  const data = await parseResponse<LoginResponse>(response);
  await saveTokens(data.access, data.refresh);
  return data;
}

export async function signOut(): Promise<void> {
  await clearTokens();
}

export async function apiGet<T>(path: string): Promise<T> {
  const request = () => fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  let response = await request();
  if (response.status === 401 && await refreshAccessToken()) {
    response = await request();
  }
  return parseResponse<T>(response);
}

export { API_BASE_URL };

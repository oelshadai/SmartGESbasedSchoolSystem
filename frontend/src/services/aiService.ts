import secureApiClient from '@/lib/secureApiClient';

export interface RiskProfile {
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW' | 'EXCELLING';
  attendance_score: number;
  academic_score: number;
  fee_score: number;
  risk_factors: string[];
  recommendations: string[];
}

export interface ClassRiskSummary {
  HIGH: number;
  MEDIUM: number;
  LOW: number;
  EXCELLING: number;
  students: { id: number; name: string; risk_level: string; attendance_score: number; academic_score: number }[];
}

export interface AttendancePattern {
  pattern_type: 'REGULAR_ABSENCE' | 'DECLINING' | 'IMPROVING' | 'CONSISTENT';
  absent_day: string | null;
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  consecutive_absences: number;
  late_count: number;
  alert_needed: boolean;
}

export interface AcademicTrend {
  overall_trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  percentage_change: number;
  best_subject: string | null;
  worst_subject: string | null;
  subjects_declined: { name: string; previous: number; current: number; change: number }[];
  subjects_improved: { name: string; previous: number; current: number; change: number }[];
  alert_needed: boolean;
  alert_reason: string | null;
}

export interface FeeRisk {
  default_risk: 'HIGH' | 'MEDIUM' | 'LOW';
  previous_defaults: number;
  days_until_due: number | null;
  balance_remaining: number;
  recommended_action: string;
  best_sms_day: string;
}

export type AlertType = 'ATTENDANCE_LOW' | 'EXAM_POOR' | 'FEE_REMINDER' | 'RISK_ALERT' | 'POSITIVE_FEEDBACK';

const ai = {
  getRiskProfile: (studentId: number, termId: number) =>
    secureApiClient.get<RiskProfile>(`/ai/students/${studentId}/risk/?term_id=${termId}`),

  getClassRiskSummary: (classId: number, termId: number) =>
    secureApiClient.get<ClassRiskSummary>(`/ai/classes/${classId}/risk-summary/?term_id=${termId}`),

  getAttendancePatterns: (studentId: number, termId: number) =>
    secureApiClient.get<AttendancePattern>(`/ai/students/${studentId}/attendance-patterns/?term_id=${termId}`),

  getAcademicTrends: (studentId: number, termId: number) =>
    secureApiClient.get<AcademicTrend>(`/ai/students/${studentId}/academic-trends/?term_id=${termId}`),

  getFeeRisk: (studentId: number, termId: number) =>
    secureApiClient.get<FeeRisk>(`/ai/students/${studentId}/fee-risk/?term_id=${termId}`),

  previewSmartSms: (studentId: number, termId: number, alertType: AlertType, data: Record<string, unknown>) =>
    secureApiClient.post<{ message: string; recipient: string; sent: boolean }>(
      `/ai/students/${studentId}/smart-sms/`,
      { term_id: termId, alert_type: alertType, data, send: false }
    ),

  sendSmartSms: (studentId: number, termId: number, alertType: AlertType, data: Record<string, unknown>) =>
    secureApiClient.post<{ message: string; recipient: string; sent: boolean; status: string }>(
      `/ai/students/${studentId}/smart-sms/`,
      { term_id: termId, alert_type: alertType, data, send: true }
    ),

  generateStudentReport: (studentId: number, termId: number) =>
    secureApiClient.post<{ report: string }>(`/ai/students/${studentId}/generate-report/`, { term_id: termId }),

  generateLessonPlan: (subject: string, topic: string, classLevel: string, durationMinutes: number) =>
    secureApiClient.post<{ lesson_plan: Record<string, unknown> }>('/ai/lesson-plan/', {
      subject, topic, class_level: classLevel, duration_minutes: durationMinutes,
    }),

  generateClassInsights: (classId: number, termId: number) =>
    secureApiClient.post<{ insights: string }>(`/ai/classes/${classId}/insights/`, { term_id: termId }),
};

export default ai;

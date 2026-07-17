import { secureApiClient } from '@/lib/secureApiClient';

export interface StudentValidationResult {
  isValid: boolean;
  student?: {
    id: string;
    name: string;
    email: string;
    class_name: string;
    status: string;
  };
  errors?: string[];
}

export class StudentValidationService {
  
  static async validateStudent(studentData: {
    student_id: string;
    email: string;
    phone?: string;
  }): Promise<StudentValidationResult> {
    try {
      const response = await secureApiClient.post('/students/validate/', {
        student_id: studentData.student_id,
        email: studentData.email,
        phone: studentData.phone
      });

      return {
        isValid: true,
        student: response.data.student
      };
    } catch (error: any) {
      const errors = error.response?.data?.errors || ['Validation failed'];
      return {
        isValid: false,
        errors
      };
    }
  }

  static async checkStudentExists(studentId: string): Promise<boolean> {
    try {
      const response = await secureApiClient.get(`/students/check/${studentId}/`);
      return response.data.exists;
    } catch {
      return false;
    }
  }
}

export default StudentValidationService;
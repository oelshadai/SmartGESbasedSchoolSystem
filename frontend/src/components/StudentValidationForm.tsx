import React from 'react';
import { SecureForm } from './SecureForm';
import { SecurityUtils } from '@/lib/securityUtils';

interface StudentValidationFormProps {
  onValidate: (studentData: StudentValidationData) => Promise<void>;
  className?: string;
}

interface StudentValidationData {
  student_id: string;
  email: string;
  phone?: string;
}

export const StudentValidationForm: React.FC<StudentValidationFormProps> = ({
  onValidate,
  className = ''
}) => {
  const formFields = [
    {
      name: 'student_id',
      label: 'Student ID',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter student ID (e.g., STU001)',
      validation: (value: string) => {
        if (!SecurityUtils.isValidStudentId(value)) {
          return { isValid: false, error: 'Student ID must be 3-10 alphanumeric characters' };
        }
        return { isValid: true };
      }
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email' as const,
      required: true,
      placeholder: 'student@school.edu'
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel' as const,
      placeholder: '+1234567890',
      validation: (value: string) => {
        if (value && !/^\+?[\d\s-()]{10,15}$/.test(value)) {
          return { isValid: false, error: 'Invalid phone number format' };
        }
        return { isValid: true };
      }
    }
  ];

  return (
    <SecureForm
      fields={formFields}
      onSubmit={onValidate}
      submitLabel="Validate Student"
      className={className}
      enableCSRF={true}
      rateLimitKey="student_validation"
      maxSubmissions={3}
      submissionWindow={300000} // 5 minutes
    />
  );
};

export default StudentValidationForm;
import React, { useState, useCallback, FormEvent } from 'react';
import { SecurityUtils, SecureFormUtils, SecurityMonitor } from '@/lib/securityUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Shield } from 'lucide-react';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'file';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  placeholder?: string;
  accept?: string; // For file inputs
  validation?: (value: any) => { isValid: boolean; error?: string };
}

interface SecureFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => Promise<void>;
  submitLabel?: string;
  className?: string;
  enableCSRF?: boolean;
  rateLimitKey?: string;
  maxSubmissions?: number;
  submissionWindow?: number; // in milliseconds
}

export const SecureForm: React.FC<SecureFormProps> = ({
  fields,
  onSubmit,
  submitLabel = 'Submit',
  className = '',
  enableCSRF = true,
  rateLimitKey,
  maxSubmissions = 5,
  submissionWindow = 60000 // 1 minute
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [csrfToken, setCsrfToken] = useState<string>('');

  // Rate limiter for form submissions
  const rateLimiter = rateLimitKey 
    ? SecurityUtils.createRateLimiter(maxSubmissions, submissionWindow)
    : null;

  // Handle input changes with real-time validation
  const handleInputChange = useCallback((fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear previous error
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }

    // Real-time validation
    const field = fields.find(f => f.name === fieldName);
    if (field && value) {
      const validation = validateField(field, value);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, [fieldName]: validation.error || 'Invalid input' }));
      }
    }
  }, [fields, errors]);

  // Validate individual field
  const validateField = (field: FormField, value: any): { isValid: boolean; error?: string } => {
    // Custom validation first
    if (field.validation) {
      const customResult = field.validation(value);
      if (!customResult.isValid) {
        return customResult;
      }
    }

    // Student ID specific validation
    if (field.name === 'student_id' || field.name === 'studentId') {
      if (!SecurityUtils.isValidStudentId(value)) {
        return { isValid: false, error: 'Invalid student ID format (3-10 alphanumeric characters)' };
      }
    }

    // Built-in validation rules
    const rules = {
      required: field.required,
      minLength: field.minLength,
      maxLength: field.maxLength,
      pattern: field.pattern,
      email: field.type === 'email'
    };

    return SecureFormUtils.validateFormField(field.label, value, rules);
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const value = formData[field.name];
      const validation = validateField(field, value);
      
      if (!validation.isValid) {
        newErrors[field.name] = validation.error || 'Invalid input';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle file uploads securely
  const handleFileChange = (fieldName: string, file: File | null) => {
    if (!file) {
      handleInputChange(fieldName, null);
      return;
    }

    const validation = SecurityUtils.validateFile(file);
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, [fieldName]: validation.error || 'Invalid file' }));
      return;
    }

    handleInputChange(fieldName, file);
  };

  // Generate CSRF token
  const generateCSRFToken = useCallback(() => {
    if (enableCSRF) {
      const token = SecurityUtils.generateSecureId(32);
      setCsrfToken(token);
      return token;
    }
    return '';
  }, [enableCSRF]);

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Rate limiting check
    if (rateLimiter && rateLimitKey && !rateLimiter(rateLimitKey)) {
      setSubmitError('Too many submission attempts. Please wait before trying again.');
      SecurityMonitor.logSecurityEvent('rate_limit_exceeded', { key: rateLimitKey });
      return;
    }

    // Validate form
    if (!validateForm()) {
      setSubmitError('Please correct the errors above.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Sanitize form data
      const sanitizedData = SecureFormUtils.sanitizeFormData(formData);
      
      // Add CSRF token if enabled
      if (enableCSRF) {
        const token = generateCSRFToken();
        sanitizedData._csrf_token = token;
      }

      // Log security event
      SecurityMonitor.logSecurityEvent('form_submission', {
        fields: fields.map(f => f.name),
        hasFiles: fields.some(f => f.type === 'file' && formData[f.name])
      });

      await onSubmit(sanitizedData);
      
      // Clear form on successful submission
      setFormData({});
      setErrors({});
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Submission failed';
      setSubmitError(errorMessage);
      
      SecurityMonitor.logSecurityEvent('form_submission_error', {
        error: errorMessage,
        fields: fields.map(f => f.name)
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render form field
  const renderField = (field: FormField) => {
    const fieldError = errors[field.name];
    const fieldValue = formData[field.name] || '';

    if (field.type === 'file') {
      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name} className="flex items-center gap-2">
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id={field.name}
            type="file"
            accept={field.accept}
            onChange={(e) => handleFileChange(field.name, e.target.files?.[0] || null)}
            className={fieldError ? 'border-red-500' : ''}
          />
          {fieldError && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {fieldError}
            </p>
          )}
        </div>
      );
    }

    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={field.name} className="flex items-center gap-2">
          {field.label}
          {field.required && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id={field.name}
          type={field.type}
          value={fieldValue}
          onChange={(e) => handleInputChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          minLength={field.minLength}
          maxLength={field.maxLength}
          pattern={field.pattern?.source}
          className={fieldError ? 'border-red-500' : ''}
          autoComplete={field.type === 'password' ? 'current-password' : 'off'}
        />
        {fieldError && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {fieldError}
          </p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {/* Security indicator */}
      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
        <Shield className="h-4 w-4" />
        <span>Secure form with validation and protection</span>
      </div>

      {/* Form fields */}
      {fields.map(renderField)}

      {/* Submit error */}
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isSubmitting || Object.keys(errors).length > 0}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : submitLabel}
      </Button>

      {/* CSRF token (hidden) */}
      {enableCSRF && csrfToken && (
        <input type="hidden" name="_csrf_token" value={csrfToken} />
      )}
    </form>
  );
};

export default SecureForm;
import React, { useState } from 'react';
import { StudentValidationForm } from './StudentValidationForm';
import { StudentValidationService, StudentValidationResult } from '@/services/studentValidationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, User, Mail, Phone, GraduationCap } from 'lucide-react';

interface StudentValidationUtilityProps {
  onValidationComplete?: (result: StudentValidationResult) => void;
  className?: string;
}

export const StudentValidationUtility: React.FC<StudentValidationUtilityProps> = ({
  onValidationComplete,
  className = ''
}) => {
  const [validationResult, setValidationResult] = useState<StudentValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleValidation = async (studentData: any) => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await StudentValidationService.validateStudent(studentData);
      setValidationResult(result);
      onValidationComplete?.(result);
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: ['Validation service unavailable']
      });
    } finally {
      setIsValidating(false);
    }
  };

  const renderValidationResult = () => {
    if (!validationResult) return null;

    if (validationResult.isValid && validationResult.student) {
      const { student } = validationResult;
      return (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Student Validated Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-foreground/70" />
              <span className="font-medium">{student.name}</span>
              <Badge variant="outline">{student.status}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-foreground/70" />
              <span className="text-sm">{student.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-foreground/70" />
              <span className="text-sm">{student.class_name}</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <p className="font-medium">Validation Failed</p>
            {validationResult.errors?.map((error, index) => (
              <p key={index} className="text-sm">{error}</p>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>Student Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentValidationForm
            onValidate={handleValidation}
            className="space-y-4"
          />
        </CardContent>
      </Card>

      {isValidating && (
        <Alert>
          <AlertDescription>Validating student information...</AlertDescription>
        </Alert>
      )}

      {renderValidationResult()}
    </div>
  );
};

export default StudentValidationUtility;
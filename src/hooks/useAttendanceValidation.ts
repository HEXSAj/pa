// src/hooks/useAttendanceValidation.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { attendanceValidationService, AttendanceValidationResult } from '@/services/attendanceValidationService';
import { toast } from 'sonner';

export const useAttendanceValidation = (forPOS: boolean = true) => {
  const { user } = useAuth();
  const [validationResult, setValidationResult] = useState<AttendanceValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  const validateAttendance = async () => {
    console.log('🔄 Starting attendance validation, user:', user?.uid, 'forPOS:', forPOS);
    
    if (!user?.uid) {
      console.log('❌ No user UID found');
      setValidationResult({
        isValid: false,
        isClockedIn: false,
        error: 'User not authenticated',
        message: 'Please log in first'
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsValidating(true);
      console.log('🔍 Calling validation service...');
      const result = forPOS 
        ? await attendanceValidationService.validateAttendanceForPOS(user.uid)
        : await attendanceValidationService.validateAttendanceForAppointments(user.uid);
      
      console.log('📊 Validation result:', result);
      setValidationResult(result);
      
      if (!result.isValid) {
        console.log('❌ Validation failed:', result.message);
        toast.error(result.message || 'Attendance validation failed');
      } else {
        console.log('✅ Validation successful');
      }
      
    } catch (error) {
      console.error('❌ Error validating attendance:', error);
      const errorResult: AttendanceValidationResult = {
        isValid: false,
        isClockedIn: false,
        error: 'Validation failed',
        message: 'Unable to validate attendance. Please try again.'
      };
      setValidationResult(errorResult);
      toast.error('Failed to validate attendance');
    } finally {
      setIsValidating(false);
      setIsLoading(false);
    }
  };

  const refreshValidation = async () => {
    await validateAttendance();
  };

  useEffect(() => {
    validateAttendance();
  }, [user?.uid]);

  return {
    validationResult,
    isLoading,
    isValidating,
    validateAttendance,
    refreshValidation,
    isValid: validationResult?.isValid ?? false,
    isClockedIn: validationResult?.isClockedIn ?? false,
    error: validationResult?.error,
    message: validationResult?.message
  };
};

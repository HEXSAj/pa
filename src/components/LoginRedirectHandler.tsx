// src/components/LoginRedirectHandler.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { staffService } from '@/services/staffService';
import { Loader2 } from 'lucide-react';

interface LoginRedirectHandlerProps {
  userId: string;
}

export default function LoginRedirectHandler({ userId }: LoginRedirectHandlerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // Get user role from staff service
        const staffUser = await staffService.getStaffById(userId);
        
        if (staffUser?.role === 'doctor') {
          router.push('/dashboard/my-sessions');
        } else {
          router.push('/dashboard/pos');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        // Default redirect if error
        router.push('/dashboard/pos');
      } finally {
        setLoading(false);
      }
    };

    handleRedirect();
  }, [userId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return null;
}
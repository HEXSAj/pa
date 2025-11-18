'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserPermissions } from '@/types/user';
import {Loader2} from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof UserPermissions;
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }

    if (!loading && requiredPermission && !hasPermission(requiredPermission)) {
      router.push('/dashboard');
    }
  }, [user, loading, requiredPermission, hasPermission, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user || (requiredPermission && !hasPermission(requiredPermission))) {
    return null;
  }

  return <>{children}</>;
}
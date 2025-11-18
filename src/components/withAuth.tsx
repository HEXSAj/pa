'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Unauthorized from '@/components/Unauthorized';

export default function withAuth(Component: React.ComponentType<any>) {
  return function AuthenticatedComponent(props: any) {
    const { user, loading, hasAccess } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (!loading) {
        // If not logged in, redirect to login
        if (!user) {
          router.push('/');
        }
      }
    }, [user, loading, router]);

    // If still loading, show nothing
    if (loading) {
      return null;
    }

    // If not logged in, don't render anything (will be redirected)
    if (!user) {
      return null;
    }

    // If logged in but not authorized for this path, show unauthorized page
    if (!hasAccess(pathname || '')) {
      return <Unauthorized />;
    }

    // If logged in and authorized, render the page
    return <Component {...props} />;
  };
}
// 'use client';

// import LoginForm from '@/components/LoginForm';
// import { useAuth } from '@/context/AuthContext';
// import { useRouter } from 'next/navigation';
// import { useEffect } from 'react';

// export default function Home() {
//   const { user, loading } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!loading && user) {
//       router.push('/dashboard/pos');
//     }
//   }, [user, loading, router]);

//   if (loading) {
//     return null; // Or a loading spinner component
//   }

//   return <LoginForm />;
// }

'use client';

import LoginForm from '@/components/LoginForm';
import LoginRedirectHandler from '@/components/LoginRedirectHandler';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner component
  }

  // If user is logged in, show redirect handler
  if (user) {
    return <LoginRedirectHandler userId={user.uid} />;
  }

  // If not logged in, show login form
  return <LoginForm />;
}





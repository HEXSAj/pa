// 'use client';

// import './globals.css';
// import { AuthProvider } from '@/context/AuthContext';
// import { Metadata } from 'next'


// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en" suppressHydrationWarning>
//       <head />
//       <body suppressHydrationWarning>
//         <AuthProvider>
//           {children}
//         </AuthProvider>
//       </body>
//     </html>
//   );
// }


'use client';

import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { useEffect } from 'react';
import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  // Prevent automatic scroll restoration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.ico" sizes="any" />
        <link rel="icon" href="/logo.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Pearls Family Care - Dr Prabath Abaywardane</title>
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster 
          position="top-right"
          expand={true}
          richColors={true}
          closeButton={true}
          toastOptions={{
            style: {
              zIndex: 9999,
            },
          }}
        />
      </body>
    </html>
  );
}
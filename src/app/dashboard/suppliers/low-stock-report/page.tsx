// src/app/dashboard/suppliers/low-stock-report/page.tsx
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LowStockBySupplierReport from '@/components/LowStockBySupplierReport';

export default function LowStockReportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <LowStockBySupplierReport />
      </div>
    </DashboardLayout>
  );
}
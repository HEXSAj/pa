// src/app/dashboard/reports/consultation-fees/page.tsx
'use client';
import React from 'react';
import { ConsultationFeeReports } from './ConsultationFeeReports';
import DashboardLayout from '@/components/DashboardLayout';
import withAuth from '@/components/withAuth';

function ConsultationFeeReportsPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <ConsultationFeeReports />
      </div>
    </DashboardLayout>
  );
}

export default withAuth(ConsultationFeeReportsPage);
// src/app/dashboard/reports/lab-tests/page.tsx
'use client';
import React from 'react';
import { LabTestReports } from './LabTestReports';
import DashboardLayout from '@/components/DashboardLayout';
import withAuth from '@/components/withAuth';

function LabTestReportsPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <LabTestReports />
      </div>
    </DashboardLayout>
  );
}

export default withAuth(LabTestReportsPage);
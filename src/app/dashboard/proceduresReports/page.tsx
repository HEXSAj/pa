// src/app/dashboard/proceduresReports/page.tsx
'use client';
import React from 'react';
import { ProcedureReports } from './ProcedureReports';
import DashboardLayout from '@/components/DashboardLayout';
import withAuth from '@/components/withAuth';

function ProcedureReportsPage() {
  return (
    <DashboardLayout>
      <ProcedureReports />
    </DashboardLayout>
  );
}

export default withAuth(ProcedureReportsPage);
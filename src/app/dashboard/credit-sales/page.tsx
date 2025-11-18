// src/app/dashboard/credit-sales/page.tsx



'use client';
import React from 'react';
import CreditSalesPage from '../pos/CreditSales';
import withAuth from '@/components/withAuth'; // Import the withAuth HOC

function CreditSales() {
  return <CreditSalesPage />;
}

// Wrap the component with withAuth to enforce access control
export default withAuth(CreditSales);

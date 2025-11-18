// src/app/dashboard/due-collect/page.tsx

'use client';
import React from 'react';
import DueCollectionPage from './DueCollectionPage';
import withAuth from '@/components/withAuth';

function DueCollect() {
  return <DueCollectionPage />;
}

// Wrap the component with withAuth to enforce access control
export default withAuth(DueCollect);


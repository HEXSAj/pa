'use client';
import React from 'react';
import LoyaltyPointsPage from '../customers/LoyaltyPoints';
import withAuth from '@/components/withAuth';

function LoyaltyPoints() {
  return <LoyaltyPointsPage />;
}

export default withAuth(LoyaltyPoints);
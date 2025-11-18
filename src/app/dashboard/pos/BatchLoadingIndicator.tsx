// src/app/dashboard/pos/BatchLoadingIndicator.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

const BatchLoadingIndicator = ({ message = "Loading batch information..." }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full opacity-75 blur-md animate-pulse"></div>
        <div className="relative bg-white rounded-full p-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      </div>
      <p className="mt-4 text-gray-700 text-lg font-medium">{message}</p>
      <p className="mt-2 text-gray-500 text-sm max-w-md text-center">
        Looking for batches that aren't expired and have available quantity.
      </p>
    </div>
  );
};

export default BatchLoadingIndicator;
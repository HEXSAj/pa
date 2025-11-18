'use client';

import { useEffect, useState } from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export default function LoadingOverlay({ isLoading, message = "Loading..." }: LoadingOverlayProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
    } else {
      // Add fade out effect
      const timer = setTimeout(() => {
        setShow(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <div className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center transition-opacity duration-150 ${
      isLoading ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center space-y-4 min-w-[180px] transform transition-all duration-150">
        <div className="relative">
          <div className="w-10 h-10 border-3 border-blue-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-10 h-10 border-3 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="text-center">
          <p className="text-gray-700 font-medium text-sm">{message}</p>
          <div className="mt-2 flex justify-center space-x-1">
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentReminderBannerProps {
  message: string;
  dueDate: string;
  onDismiss?: () => void;
}

export default function PaymentReminderBanner({ 
  message = "You have only one day left to make the due payment.",
  dueDate = "2025/03/29",
  onDismiss 
}: PaymentReminderBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Check if the banner was dismissed in the last 4 hours
    const dismissedTime = localStorage.getItem('paymentReminderDismissed');
    
    if (dismissedTime) {
      const dismissedAt = parseInt(dismissedTime, 10);
      const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
      
      if (dismissedAt > fourHoursAgo) {
        setIsDismissed(true);
      } else {
        // Reset if it's been more than 4 hours
        localStorage.removeItem('paymentReminderDismissed');
      }
    }
    
    // Show the banner with a slight delay for better UX
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleDismiss = () => {
    setIsVisible(false);
    
    // After animation completes
    setTimeout(() => {
      setIsDismissed(true);
      if (onDismiss) onDismiss();
      
      // Store dismiss time
      localStorage.setItem('paymentReminderDismissed', Date.now().toString());
    }, 300);
  };
  
  if (isDismissed) {
    return null;
  }
  
  return (
    <div 
      className={`bg-amber-50 border-b border-amber-200 transition-all duration-300 ease-in-out ${
        isVisible ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-sm text-amber-800">
              <span className="font-medium">{message}</span> Please make the payment on or before <span className="font-bold">{dueDate}</span>. Thank you so much for your understanding.
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="h-8 w-8 p-0 rounded-full text-amber-500 hover:bg-amber-100 hover:text-amber-600"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
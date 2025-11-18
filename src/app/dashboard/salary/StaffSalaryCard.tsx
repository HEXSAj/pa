// src/components/salary/StaffSalaryCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/hooks/use-toast';
import { salaryService } from '@/services/salaryService';
import { Salary } from '@/types/salary';
import { DollarSign, Clock, AlertCircle, FileText, CreditCard } from 'lucide-react';
import { format, subMonths } from 'date-fns';

interface StaffSalaryCardProps {
  staffId: string;
  staffName: string;
  onPaySalary: () => void;
}

export function StaffSalaryCard({ staffId, staffName, onPaySalary }: StaffSalaryCardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [salaryInfo, setSalaryInfo] = useState<Salary | null>(null);
  const [lastPayment, setLastPayment] = useState<{date: Date, amount: number} | null>(null);
  
  // Load staff salary information
  useEffect(() => {
    const loadSalaryInfo = async () => {
      try {
        setIsLoading(true);
        
        // Get salary information
        const salary = await salaryService.getStaffSalary(staffId);
        setSalaryInfo(salary);
        
        // Get last payment
        const payments = await salaryService.getSalaryPaymentsByStaff(staffId);
        if (payments.length > 0) {
          // Sort by payment date (descending)
          payments.sort((a, b) => 
            new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
          );
          
          setLastPayment({
            date: new Date(payments[0].paymentDate),
            amount: payments[0].amount
          });
        }
      } catch (error) {
        console.error('Error loading salary info:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSalaryInfo();
  }, [staffId]);
  
  // Check if salary is due
  const isSalaryDue = () => {
    if (!lastPayment) return true;
    
    const now = new Date();
    const oneMonthAgo = subMonths(now, 1);
    
    return lastPayment.date < oneMonthAgo;
  };
  
  return (
    <Card className={`hover:shadow-md transition-shadow ${isSalaryDue() && !isLoading ? 'border-amber-300' : ''}`}>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg truncate" title={staffName}>
                {staffName}
              </h3>
              {salaryInfo?.role && (
                <Badge variant="outline" className="capitalize">
                  {salaryInfo.role}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Base Salary</span>
              {salaryInfo?.baseSalary ? (
                <span className="text-xl font-bold text-primary">
                  Rs{salaryInfo.baseSalary.toLocaleString()}
                </span>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                  Not set
                </Badge>
              )}
            </div>
            
            <div className="space-y-1">
              {lastPayment ? (
                <>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">
                      Last Payment: <span className="font-medium">Rs{lastPayment.amount.toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">
                      Paid on: <span className="font-medium">{format(lastPayment.date, 'MMMM d, yyyy')}</span>
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 mr-2" />
                  No previous payments
                </div>
              )}
            </div>
            
            {isSalaryDue() ? (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-2 flex items-center text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Salary payment may be due this month</span>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-md p-2 flex items-center text-sm text-green-800">
                <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Salary appears to be up to date</span>
              </div>
            )}
            
            <Button 
              onClick={onPaySalary} 
              className="w-full"
              variant={isSalaryDue() ? "default" : "outline"}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Process Salary
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
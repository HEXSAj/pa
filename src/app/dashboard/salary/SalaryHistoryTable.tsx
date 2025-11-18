// src/components/salary/SalaryHistoryTable.tsx
'use client';

import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SalaryPayment } from '@/types/salary';
import { StaffUser } from '@/types/staff';
import { format } from 'date-fns';
import { MoreHorizontal, ArrowUpDown, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SalaryHistoryTableProps {
  payments: SalaryPayment[];
  staffList: StaffUser[];
  onViewDetails: (payment: SalaryPayment) => void;
  onPrintReceipt: (payment: SalaryPayment) => void;
  sortColumn: string;
  sortDirection: string;
  onSortChange: (column: string) => void;
}

export function SalaryHistoryTable({ 
  payments, 
  staffList, 
  onViewDetails, 
  onPrintReceipt,
  sortColumn,
  sortDirection,
  onSortChange
}: SalaryHistoryTableProps) {
  
  // Get staff name by ID
  const getStaffName = (staffId: string) => {
    const staff = staffList.find(s => s.uid === staffId);
    return staff?.displayName || staff?.email || 'Unknown Staff';
  };
  
  // Format payment method
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'check':
        return 'Check';
      default:
        return method;
    }
  };
  
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background">
        <TableRow>
          <TableHead 
            className="cursor-pointer"
            onClick={() => onSortChange('paymentDate')}
          >
            <div className="flex items-center">
              Payment Date
              {sortColumn === 'paymentDate' && (
                <ArrowUpDown className="ml-1 h-4 w-4" />
              )}
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer"
            onClick={() => onSortChange('staffName')}
          >
            <div className="flex items-center">
              Staff
              {sortColumn === 'staffName' && (
                <ArrowUpDown className="ml-1 h-4 w-4" />
              )}
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer"
            onClick={() => onSortChange('amount')}
          >
            <div className="flex items-center">
              Amount
              {sortColumn === 'amount' && (
                <ArrowUpDown className="ml-1 h-4 w-4" />
              )}
            </div>
          </TableHead>
          <TableHead>Payment Method</TableHead>
          <TableHead>Period</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>
              {format(new Date(payment.paymentDate), 'MMM d, yyyy')}
            </TableCell>
            <TableCell>
              <div className="font-medium">{getStaffName(payment.staffId)}</div>
            </TableCell>
            <TableCell>
              <div className="font-medium">Rs{payment.amount.toLocaleString()}</div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {formatPaymentMethod(payment.paymentMethod)}
              </Badge>
            </TableCell>
            <TableCell>
              {payment.period && (
                <span>{format(new Date(payment.period), 'MMMM yyyy')}</span>
              )}
            </TableCell>
            <TableCell>
              <Badge className="bg-green-100 text-green-800 flex items-center w-fit">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Paid
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onViewDetails(payment)}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPrintReceipt(payment)}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Receipt
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
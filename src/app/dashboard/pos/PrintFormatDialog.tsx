// src/app/dashboard/pos/PrintFormatDialog.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { FileText, Receipt, Printer, Loader2 } from 'lucide-react';

interface PrintFormatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFormat: (format: 'a4' | '80mm') => void;
  quotationNumber: string;
  processing: boolean;
}

export function PrintFormatDialog({
  open,
  onOpenChange,
  onSelectFormat,
  quotationNumber,
  processing
}: PrintFormatDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-lg p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <DialogTitle className="text-xl font-bold">Select Print Format</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 space-y-4">
          <div className="text-center mb-2">
            <p className="text-lg font-medium">Quotation #{quotationNumber} created successfully!</p>
            <p className="text-gray-500">Choose how you would like to print this quotation</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="border rounded-lg p-6 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
              onClick={() => !processing && onSelectFormat('a4')}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="bg-blue-100 p-4 rounded-full">
                  <FileText className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">A4 Paper</h3>
                  <p className="text-gray-500 text-sm">Professional format for clients</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="border rounded-lg p-6 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
              onClick={() => !processing && onSelectFormat('80mm')}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Receipt className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Thermal Receipt (80mm)</h3>
                  <p className="text-gray-500 text-sm">Quick format for POS printer</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        <DialogFooter className="p-6 border-t bg-gray-50">
          {processing ? (
            <Button disabled className="w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing printer...
            </Button>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              <Printer className="mr-2 h-4 w-4" />
              Print Later
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
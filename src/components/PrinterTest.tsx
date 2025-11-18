// src/components/PrinterTest.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { receiptPrinterService } from '@/services/receiptPrinterService';

const BUSINESS_INFO = {
  name: 'Isira Pharmacy & Grocery',
  address: 'No. 371, M.D.H. Jayawardhena Road',
  phone: '0777 846 480',
  footer: 'Get well soon!',
  receiptWidth: 57,
  charactersPerLine: 32,
  openCashDrawer: true,
  paperCutAtEnd: true
};

const PrinterTest = () => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [success, setSuccess] = useState<boolean | null>(null);
  
  const testPrinter = async () => {
    setIsPrinting(true);
    setSuccess(null);
    
    try {
      const result = await receiptPrinterService.testPrinter();
      setSuccess(result);
    } catch (error) {
      console.error('Test print failed:', error);
      setSuccess(false);
    } finally {
      setIsPrinting(false);
    }
  };
  
  const openCashDrawer = async () => {
    setIsPrinting(true);
    try {
      await receiptPrinterService.openCashDrawer();
    } catch (error) {
      console.error('Error opening cash drawer:', error);
    } finally {
      setIsPrinting(false);
    }
  };
  
  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Printer className="mr-2 h-6 w-6" />
          57mm Thermal Printer Test
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          This will print a test receipt on your 57mm thermal printer. Make sure your printer is
          connected and turned on before testing.
        </p>
        
        {success === true && (
          <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            <span>Printer test successful! Check your printer for the test receipt.</span>
          </div>
        )}
        
        {success === false && (
          <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
            <span>Printer test failed. Please check your printer connection and try again.</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={openCashDrawer}
          disabled={isPrinting}
          className="w-1/2 mr-2"
        >
          {isPrinting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <>Open Cash Drawer</>
          )}
        </Button>
        <Button 
          onClick={testPrinter}
          disabled={isPrinting}
          className="w-1/2 ml-2"
        >
          {isPrinting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Printing...
            </>
          ) : (
            <>Print Test Receipt</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PrinterTest;
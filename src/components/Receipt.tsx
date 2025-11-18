import React from 'react';
import { Sale } from '@/types/sale';
import { Card, CardContent } from "@/components/ui/card";
import { Printer, CheckCircle, ShoppingBag } from 'lucide-react';

export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  footer?: string;
  logoUrl?: string;
}

interface ReceiptProps {
  sale: Sale;
  businessInfo: BusinessInfo;
  showPrintButton?: boolean;
  onPrint?: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ 
  sale, 
  businessInfo, 
  showPrintButton = false,
  onPrint 
}) => {
  // Format date and time
  const saleDate = new Date(sale.saleDate);
  const dateString = saleDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  
  const timeString = saleDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Format payment method with icon
  const getPaymentMethod = (method: string) => {
    switch (method) {
      case 'cash': return { name: 'Cash', icon: '💵' };
      case 'card': return { name: 'Card', icon: '💳' };
      case 'bank_deposit': return { name: 'Bank Deposit', icon: '🏦' };
      default: return { name: method, icon: '📝' };
    }
  };
  
  const paymentMethod = getPaymentMethod(sale.paymentMethod);
  
  // Calculate total items count
  const totalItemsCount = sale.items.reduce((sum, item) => {
    return sum + item.unitQuantity + (item.subUnitQuantity > 0 ? 1 : 0);
  }, 0);
  
  // Handle print click
  const handlePrintClick = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <Card className="mx-auto max-w-md shadow-xl bg-white relative overflow-hidden print:shadow-none">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-green-500"></div>
      
      <CardContent className="p-6 relative">
        {/* Print button */}
        {showPrintButton && (
          <button 
            onClick={handlePrintClick}
            className="absolute top-4 right-4 text-blue-600 hover:text-blue-800 print:hidden"
            title="Print Receipt"
          >
            <Printer className="h-5 w-5" />
          </button>
        )}
        
        {/* Header with logo effect */}
        <div className="text-center mb-6">
          {businessInfo.logoUrl ? (
            <img 
              src={businessInfo.logoUrl} 
              alt={businessInfo.name} 
              className="h-16 mx-auto mb-2"
            />
          ) : (
            <div className="flex justify-center items-center mb-2">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                <ShoppingBag className="h-8 w-8" />
              </div>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{businessInfo.name}</h1>
          <p className="text-gray-600 mb-1">{businessInfo.address}</p>
          <p className="text-gray-600">Tel: {businessInfo.phone}</p>
        </div>
        
        {/* Receipt Info with improved visual design */}
        <div className="bg-gray-50 rounded-lg p-4 mb-5 border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-lg">Receipt #{sale.id?.substring(0, 6)}</p>
              <p className="text-gray-600">
                <span className="inline-block mr-2 text-blue-500">📅</span>
                {dateString} at {timeString}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">Payment Method</p>
              <p className="text-gray-600">
                <span className="inline-block mr-1">{paymentMethod.icon}</span>
                {paymentMethod.name}
              </p>
            </div>
          </div>
        </div>
        
        {/* Customer Info with enhanced styling */}
        {sale.customer && (
          <div className="mb-5 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
              <span className="text-blue-500 mr-2">👤</span>
              Customer Information
            </h3>
            <p className="text-gray-800 font-medium text-lg">{sale.customer.name}</p>
            {sale.customer.mobile && (
              <p className="text-gray-600 text-sm">
                <span className="inline-block mr-2">📱</span>
                {sale.customer.mobile}
              </p>
            )}
            {sale.customer.address && (
              <p className="text-gray-600 text-sm">
                <span className="inline-block mr-2">🏠</span>
                {sale.customer.address}
              </p>
            )}
          </div>
        )}
        
        {/* Items Table with improved styling */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3 pb-2 border-b flex items-center">
            <ShoppingBag className="h-4 w-4 mr-2 text-blue-500" />
            Items ({sale.items.length})
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="py-2 px-1 rounded-l-md">Item</th>
                <th className="py-2 px-1">Qty</th>
                <th className="py-2 px-1 text-right rounded-r-md">Price</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => {
                // Format quantity
                const unitQty = item.unitQuantity > 0 
                  ? `${item.unitQuantity} unit${item.unitQuantity > 1 ? 's' : ''}` 
                  : '';
                  
                const subUnitQty = item.subUnitQuantity > 0 && item.item.unitContains
                  ? `${item.subUnitQuantity} ${item.item.unitContains.unit}` 
                  : '';
                  
                const quantity = [unitQty, subUnitQty].filter(Boolean).join(' + ');
                
                return (
                  <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-3 px-1 text-gray-800">
                      <div className="font-medium">{item.item.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Batch #{item.batch.batchNumber}
                        {/* Show expiry date if available */}
                        {item.batch.expiryDate && 
                          ` (Exp: ${new Date(item.batch.expiryDate).toLocaleDateString()})`
                        }
                      </div>
                    </td>
                    <td className="py-3 px-1 text-gray-600">{quantity}</td>
                    <td className="py-3 px-1 text-gray-800 text-right font-medium">Rs{item.totalPrice.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Services - Doctor Fees with improved styling */}
        {sale.doctorFees && sale.doctorFees.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3 pb-2 border-b flex items-center">
              <span className="mr-2">👨‍⚕️</span>
              Doctor Services
            </h3>
            <table className="w-full text-sm">
              <tbody>
                {sale.doctorFees.map((fee, index) => (
                  <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-3 px-1 text-gray-800 font-medium">
                      {fee.fee.name || 'Doctor Fee'}
                    </td>
                    <td className="py-3 px-1 text-gray-800 text-right font-medium">Rs{fee.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Services - Laboratory Tests with improved styling */}
        {sale.laboratoryTests && sale.laboratoryTests.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3 pb-2 border-b flex items-center">
              <span className="mr-2">🔬</span>
              Laboratory Tests
            </h3>
            <table className="w-full text-sm">
              <tbody>
                {sale.laboratoryTests.map((test, index) => (
                  <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-3 px-1 text-gray-800 font-medium">
                      {test.test.name || 'Laboratory Test'}
                    </td>
                    <td className="py-3 px-1 text-gray-800 text-right font-medium">Rs{test.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Totals with enhanced styling */}
        <div className="border-t-2 border-gray-200 pt-4 mb-6">
          <div className="flex justify-between text-gray-600 mb-2 bg-gray-50 p-2 rounded">
            <span>Subtotal:</span>
            <span>Rs{sale.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg bg-blue-50 p-3 rounded-md text-blue-800">
            <span>TOTAL:</span>
            <span>Rs{sale.totalAmount.toFixed(2)}</span>
          </div>
          <div className="text-xs text-right mt-2 text-gray-500">
            Items: {totalItemsCount} | Transaction ID: {sale.id}
          </div>
        </div>
        
        {/* Success message */}
        <div className="bg-green-50 text-green-700 p-3 rounded-md flex items-center justify-center mb-4">
          <CheckCircle className="h-4 w-4 mr-2" />
          <span>Payment Completed Successfully</span>
        </div>
        
        {/* Footer with enhanced styling */}
        <div className="text-center border-t-2 border-gray-200 pt-4">
          {businessInfo.footer && (
            <p className="mb-3 text-blue-600 font-medium">{businessInfo.footer}</p>
          )}
          <p className="text-gray-600">Thank you for your purchase!</p>
          <p className="text-xs text-gray-500 mt-2">
            {new Date().getFullYear()} © {businessInfo.name} | Printed on {new Date().toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Receipt;
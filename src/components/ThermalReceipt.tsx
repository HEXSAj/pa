// src/components/ThermalReceipt.tsx
import React from 'react';
import { Sale } from '@/types/sale';

export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  footer?: string;
}

interface ThermalReceiptProps {
  sale: Sale;
  businessInfo: BusinessInfo;
}

const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ 
  sale, 
  businessInfo 
}) => {
  // Format date and time
  const saleDate = new Date(sale.saleDate);
  const dateString = saleDate.toLocaleDateString();
  const timeString = saleDate.toLocaleTimeString();
  
  // Define constants for 57mm receipt
  const CHARS_PER_LINE = 32;
  
  // Format payment method - keep short for narrow receipt
  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'card': return 'Card';
      case 'bank_deposit': return 'Bank';
      default: return method;
    }
  };
  
  // Center text helper
  const center = (text: string) => {
    const spaces = Math.max(0, Math.floor((CHARS_PER_LINE - text.length) / 2));
    return ' '.repeat(spaces) + text;
  };
  
  // Right align helper for prices - optimized for narrow receipt
  const alignRight = (text: string, price: string) => {
    // Truncate text if needed for narrow paper
    const maxTextLength = CHARS_PER_LINE - price.length - 1;
    const truncatedText = text.length > maxTextLength 
      ? text.substring(0, maxTextLength - 2) + '..'
      : text;
    
    const spaces = Math.max(0, CHARS_PER_LINE - truncatedText.length - price.length);
    return truncatedText + ' '.repeat(spaces) + price;
  };
  
  // Divider line - shorter for 57mm printer
  const divider = '-'.repeat(CHARS_PER_LINE);
  
  return (
    <div className="thermal-receipt font-mono text-xs whitespace-pre-wrap bg-white text-black p-1 hidden print:block">
      {/* Header */}
      <div>
        <div>{center(businessInfo.name.toUpperCase())}</div>
        <div>{center(businessInfo.address)}</div>
        <div>{center(`Tel: ${businessInfo.phone}`)}</div>
        <div>{divider}</div>
        <div>Date: {dateString}</div>
        <div>Time: {timeString}</div>
        <div>{divider}</div>
        <div>{center('RECEIPT')}</div>
        {sale.id && <div>Rec#: {sale.id.substring(0, 8)}</div>}
        <div>{divider}</div>
      </div>
      
      {/* Customer Info - simplified for narrow receipt */}
      {sale.customer && (
        <div>
          <div>Cust: {sale.customer.name}</div>
          {sale.customer.mobile && <div>Tel: {sale.customer.mobile}</div>}
          <div>{divider}</div>
        </div>
      )}
      
      {/* Items - optimized for narrow paper */}
      <div>
        <div>Items:</div>
        {sale.items.map((item, index) => {
          // Compact format for quantity
          let qtyStr = '';
          if (item.unitQuantity > 0) {
            qtyStr += `${item.unitQuantity}u`;
          }
          if (item.subUnitQuantity > 0 && item.item.unitContains) {
            if (qtyStr) qtyStr += '+';
            qtyStr += `${item.subUnitQuantity}${item.item.unitContains.unit}`;
          }
          
          // Truncate item name if needed for narrow paper
          const maxNameLength = CHARS_PER_LINE - 3;
          const itemName = item.item.name.length > maxNameLength
            ? item.item.name.substring(0, maxNameLength - 2) + '..'
            : item.item.name;
          
          return (
            <div key={index} style={{ marginBottom: '2px' }}>
              <div>{itemName}</div>
              {item.batch && item.batch.batchNumber && (
                <div>  B#{item.batch.batchNumber}</div>
              )}
              <div>{alignRight(`  ${qtyStr}`, `Rs${item.totalPrice.toFixed(2)}`)}</div>
            </div>
          );
        })}
      </div>
      
      {/* Doctor Fees - simplified for narrow paper */}
      {sale.doctorFees && sale.doctorFees.length > 0 && (
        <div>
          <div>{divider}</div>
          <div>Doc Services:</div>
          {sale.doctorFees.map((fee, index) => {
            const feeName = fee.fee.name || 'Doc Fee';
            // Truncate name if needed
            const truncName = feeName.length > 18 ? feeName.substring(0, 16) + '..' : feeName;
            return (
              <div key={index}>
                {alignRight(truncName, `Rs${fee.totalPrice.toFixed(2)}`)}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Lab Tests - simplified for narrow paper */}
      {sale.laboratoryTests && sale.laboratoryTests.length > 0 && (
        <div>
          <div>{divider}</div>
          <div>Lab Tests:</div>
          {sale.laboratoryTests.map((test, index) => {
            const testName = test.test.name || 'Lab Test';
            // Truncate name if needed
            const truncName = testName.length > 18 ? testName.substring(0, 16) + '..' : testName;
            return (
              <div key={index}>
                {alignRight(truncName, `Rs${test.totalPrice.toFixed(2)}`)}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Totals - clear formatting for narrow paper */}
      <div>
        <div>{divider}</div>
        <div>{alignRight('TOTAL:', `Rs${sale.totalAmount.toFixed(2)}`)}</div>
        <div>Pay: {getPaymentMethodName(sale.paymentMethod)}</div>
        <div>{divider}</div>
      </div>
      
      {/* Footer - simpler for narrow paper */}
      <div>
        <div>{center('Thank you!')}</div>
        {businessInfo.footer && (
          <div>{center(businessInfo.footer)}</div>
        )}
        <div>{'\n\n\n'}</div>
      </div>
    </div>
  );
};

export default ThermalReceipt;
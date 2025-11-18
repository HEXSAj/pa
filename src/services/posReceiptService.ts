

// src/services/posReceiptService.ts
import { Sale } from '@/types/sale';

interface POSReceiptConfig {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  vatNumber?: string;
}

export class POSReceiptService {
  private config: POSReceiptConfig = {
    storeName: "Niven Medicals",
    storeAddress: "Negombo road\nMakandura\nGonawila",
    storePhone: "0768899689",
  };

  /**
   * Print POS receipt for both local and foreign patients
   */
  async printPOSReceipt(sale: Sale): Promise<boolean> {
    try {
      const receiptContent = this.generatePOSReceiptContent(sale);
      
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        console.error('Failed to open print window. Check if popup blocker is enabled.');
        return false;
      }
      
      printWindow.document.write(`
        <html>
          <head>
            <title>POS Receipt</title>
            <style>
              @page {
                size: 80mm 210mm;
                margin: 0;
              }
              body {
                font-family: 'Courier New', monospace;
                width: 80mm;
                margin: 0;
                padding: 0;
                font-size: 12px;
                line-height: 1.3;
              }
              .receipt {
                padding: 5mm;
              }
              .receipt-header {
                text-align: center;
                margin-bottom: 15px;
                border-bottom: 1px dashed #000;
                padding-bottom: 10px;
              }
              .store-name {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .store-info {
                font-size: 11px;
                margin-bottom: 2px;
              }
              .receipt-info {
                margin-bottom: 15px;
                font-size: 11px;
              }
              .receipt-info div {
                margin-bottom: 3px;
              }
              .patient-info {
                margin-bottom: 15px;
                padding: 8px;
                border: 1px solid #000;
              }
              .patient-info h4 {
                margin: 0 0 5px 0;
                font-size: 12px;
                font-weight: bold;
              }
              .currency-badge {
                display: inline-block;
                padding: 2px 6px;
                background-color: #000;
                color: #fff;
                font-size: 10px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .receipt-items {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
              }
              .receipt-items th {
                text-align: left;
                padding: 3px 0;
                border-bottom: 1px solid #000;
                font-size: 11px;
                font-weight: bold;
              }
              .receipt-items td {
                text-align: left;
                padding: 3px 0;
                font-size: 11px;
                vertical-align: top;
              }
              .receipt-items .item-name {
                width: 45%;
                word-wrap: break-word;
              }
              .receipt-items .item-name-wide {
                width: 65%;
                word-wrap: break-word;
              }
              .receipt-items .item-name-full {
                width: 70%;
                word-wrap: break-word;
              }
              .receipt-items .qty {
                width: 15%;
                text-align: center;
              }
              .receipt-items .price {
                width: 20%;
                text-align: right;
              }
              .receipt-items .amount {
                width: 20%;
                text-align: right;
                font-weight: bold;
              }
              .receipt-items .amount-full {
                width: 30%;
                text-align: right;
                font-weight: bold;
              }
              .batch-info {
                font-size: 10px;
                color: #666;
                font-style: italic;
              }
              .receipt-sections {
                margin-bottom: 15px;
              }
              .section-title {
                font-weight: bold;
                margin: 10px 0 5px 0;
                padding: 3px;
                background-color: #f0f0f0;
                border-left: 3px solid #000;
                font-size: 11px;
              }
              .receipt-totals {
                border-top: 1px dashed #000;
                padding-top: 10px;
                margin-bottom: 15px;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
                font-size: 11px;
              }
              .total-row.grand-total {
                font-weight: bold;
                font-size: 13px;
                border-top: 1px solid #000;
                padding-top: 5px;
                margin-top: 5px;
              }
              .payment-info {
                margin-bottom: 15px;
                padding: 8px;
                border: 1px dashed #000;
                background-color: #f8f8f8;
              }
              .payment-info h4 {
                margin: 0 0 5px 0;
                font-size: 12px;
                font-weight: bold;
              }
              .receipt-footer {
                text-align: center;
                font-size: 10px;
                margin-top: 15px;
                border-top: 1px dashed #000;
                padding-top: 10px;
              }
              .thank-you {
                font-weight: bold;
                margin-bottom: 5px;
              }
              @media print {
                body {
                  width: 80mm;
                }
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              ${receiptContent}
            </div>
            <div class="no-print">
              <button onclick="window.print(); window.close();" style="margin: 20px; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Print Receipt
              </button>
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                  if (window.opener) {
                    window.opener.postMessage('pos-receipt-printed', '*');
                  }
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      return true;
    } catch (error) {
      console.error('Error printing POS receipt:', error);
      return false;
    }
  }

  /**
   * Generate receipt content for both local and foreign patients
   */
  generatePOSReceiptContent(sale: Sale): string {
    const isLocal = sale.patientType === 'local';
    const currencySymbol = isLocal ? 'Rs.' : '$';
    const currencyCode = isLocal ? 'LKR' : 'USD';
    
    // Format currency based on patient type
    const formatCurrency = (amount: number): string => {
      if (isLocal) {
        return `Rs. ${amount.toFixed(2)}`;
      } else {
        return `$${amount.toFixed(2)}`;
      }
    };

    // Get amounts based on patient type
    const getTotalAmount = (): number => {
      if (isLocal) {
        return sale.totalAmount;
      } else {
        return sale.totalAmount;
      }
    };


    const getProceduresTotal = (): number => {
      if (isLocal) {
        return sale.proceduresTotal || 0;
      } else {
        return sale.proceduresTotal || 0;
      }
    };

    const getLabTestsTotal = (): number => {
      if (isLocal) {
        return sale.labTestsTotal || 0;
      } else {
        return sale.labTestsTotal || 0;
      }
    };

    const getPharmacyTotal = (): number => {
      if (isLocal) {
        return sale.pharmacyTotal || 0;
      } else {
        return sale.pharmacyTotal || 0;
      }
    };

    // Helper function to calculate pharmacy total for display - MOVED HERE BEFORE USE
    const getPharmacyTotalForDisplay = (): number => {
      if (isLocal) {
        return getPharmacyTotal(); // Use existing function for local patients
      } else {
        // For foreign patients, calculate from USD amounts
        let foreignPharmacyUSDTotal = 0;
        
        // For local patients, use the pharmacy total directly
        foreignPharmacyUSDTotal = sale.pharmacyTotal || 0;
        
        return foreignPharmacyUSDTotal;
      }
    };

    // Generate receipt number - handle different ID types properly
    const generateReceiptNumber = (): string => {
      if (!sale.id) {
        return `R${Date.now().toString().slice(-6)}`;
      }
      
      let idString: string;
      
      if (typeof sale.id === 'string') {
        idString = sale.id;
      } else if (typeof sale.id === 'object' && sale.id !== null) {
        idString = String(sale.id);
        if (idString === '[object Object]') {
          idString = `R${Date.now().toString().slice(-6)}`;
        }
      } else {
        idString = String(sale.id);
      }
      
      return idString.length > 8 ? idString.substring(0, 8) : idString;
    };

    // Get cashier name
    const getCashierName = (): string => {
      if (!sale.createdBy) {
        return 'N/A';
      }
      
      const name = (sale.createdBy as any).name || 
                   (sale.createdBy as any).displayName || 
                   sale.createdBy.email?.split('@')[0] || 
                   'N/A';
      
      return name;
    };

    // Build receipt content
    let receiptContent = `
      <div class="receipt-header">
        <div class="store-name">${this.config.storeName}</div>
        <div class="store-info">${this.config.storeAddress}</div>
        <div class="store-info">${this.config.storePhone}</div>
        ${this.config.vatNumber ? `<div class="store-info">${this.config.vatNumber}</div>` : ''}
      </div>

      <div class="receipt-info">
        <div><strong>Receipt #:</strong> ${generateReceiptNumber()}</div>
        <div><strong>Date:</strong> ${sale.saleDate.toLocaleDateString()} ${sale.saleDate.toLocaleTimeString()}</div>
        <div><strong>Cashier:</strong> ${getCashierName()}</div>
      </div>

      <div class="patient-info">
        <h4>Patient Information</h4>
        <div><strong>Name:</strong> ${sale.customerInfo?.name || 'N/A'}</div>
        <div><strong>Phone:</strong> ${sale.customerInfo?.mobile || 'N/A'}</div>
        ${sale.isInsurancePatient ? '<div><strong>Insurance:</strong> Yes</div>' : ''}
        ${(sale as any).appointmentInfo ? `
          <div><strong>Appointment ID:</strong> ${(sale as any).appointmentInfo.appointmentId}</div>
          <div><strong>Doctor:</strong> ${(sale as any).appointmentInfo.doctorName}</div>
          <div><strong>Date:</strong> ${(sale as any).appointmentInfo.appointmentDate}</div>
          <div><strong>Time:</strong> ${(sale as any).appointmentInfo.appointmentTime}</div>
          ${(sale as any).appointmentInfo.duration ? `<div><strong>Duration:</strong> ${(sale as any).appointmentInfo.duration} minutes</div>` : ''}
        ` : ''}
      </div>

      <div class="currency-badge">${currencyCode} RECEIPT</div>
    `;

    // Manual Appointment Amount Section (if any)
    const manualAppointmentAmount = (sale as any).manualAppointmentAmount || 0;
    const roundingAdjustment = sale.roundingAdjustmentAmount || 0;
    console.log('Receipt - Manual appointment amount:', manualAppointmentAmount, 'Rounding:', roundingAdjustment);
    if (manualAppointmentAmount > 0) {
      // Add rounding adjustment to appointment fee for seamless display
      const adjustedAppointmentFee = manualAppointmentAmount + roundingAdjustment;
      receiptContent += `
        <div class="receipt-sections">
          <div class="section-title">APPOINTMENT FEE</div>
          <table class="receipt-items">
            <tr>
              <td class="item-name-full">Appointment Fee</td>
              <td class="amount-full">${formatCurrency(adjustedAppointmentFee)}</td>
            </tr>
          </table>
        </div>
      `;
    }

    // Procedures Section
    if (sale.procedures && sale.procedures.length > 0) {
      receiptContent += `
        <div class="receipt-sections">
          <div class="section-title">PROCEDURES</div>
          <table class="receipt-items">
            <tr>
              <th class="item-name">Procedure</th>
              <th class="qty">Qty</th>
              <th class="price">Price</th>
              <th class="amount">Total</th>
            </tr>
      `;

      sale.procedures.forEach(procedure => {
        const procedurePrice = procedure.localPatientCharge || 0;
        const procedureTotal = procedure.total;

        receiptContent += `
          <tr>
            <td class="item-name">${procedure.name}</td>
            <td class="qty">${procedure.quantity}</td>
            <td class="price">${formatCurrency(procedurePrice)}</td>
            <td class="amount">${formatCurrency(procedureTotal)}</td>
          </tr>
        `;
      });

      receiptContent += `</table></div>`;
    }

    // Appointment Procedures Section (from doctor)
    const appointmentProcedures = (sale as any).appointmentProcedures || [];
    const appointmentProceduresTotal = (sale as any).appointmentProceduresTotal || 0;
    if (appointmentProcedures.length > 0) {
      receiptContent += `
        <div class="receipt-sections">
          <div class="section-title">DOCTOR PROCEDURES</div>
          <table class="receipt-items">
            <tr>
              <th class="item-name">Procedure</th>
              <th class="amount-full">Charge</th>
            </tr>
      `;

      appointmentProcedures.forEach((procedure: any) => {
        receiptContent += `
          <tr>
            <td class="item-name">${procedure.procedureName}</td>
            <td class="amount-full">${formatCurrency(procedure.doctorCharge)}</td>
          </tr>
        `;
      });

      receiptContent += `</table></div>`;
    }

    // Lab Tests Section - Different layout for foreign vs local patients
    if (sale.labTests && sale.labTests.length > 0) {
      if (isLocal) {
        // Local patients - show detailed tests
        receiptContent += `
          <div class="receipt-sections">
            <div class="section-title">LAB TESTS</div>
            <table class="receipt-items">
              <tr>
                <th class="item-name">Test</th>
                <th class="qty">Qty</th>
                <th class="price">Price</th>
                <th class="amount">Total</th>
              </tr>
        `;

        sale.labTests.forEach(labTest => {
          const testPrice = labTest.price;
          const testTotal = labTest.total;

          receiptContent += `
            <tr>
              <td class="item-name">${labTest.name}</td>
              <td class="qty">${labTest.quantity}</td>
              <td class="price">${formatCurrency(testPrice)}</td>
              <td class="amount">${formatCurrency(testTotal)}</td>
            </tr>
          `;
        });

        receiptContent += `</table></div>`;
      } else {
        // Foreign patients - show lab tests total section (REMOVED "USD Amount Entered")
        const labTestsTotal = getLabTestsTotal();
        
        if (labTestsTotal > 0) {
          receiptContent += `
            <div class="receipt-sections">
              <div class="section-title">LAB TESTS</div>
              <table class="receipt-items">
                <tr>
                  <td class="item-name-full">Lab Tests Total</td>
                  <td class="amount-full">${formatCurrency(labTestsTotal)}</td>
                </tr>
              </table>
            </div>
          `;
        }
      }
    }

    // Pharmacy Items Section - Different layout for foreign vs local patients
    if (sale.items && sale.items.length > 0) {
      if (isLocal) {
        // Local patients - show detailed items
        receiptContent += `
          <div class="receipt-sections">
            <div class="section-title">PHARMACY ITEMS</div>
            <table class="receipt-items">
              <tr>
                <th class="item-name">Item</th>
                <th class="qty">Qty</th>
                <th class="price">Price</th>
                <th class="amount">Total</th>
              </tr>
        `;

        sale.items.forEach(item => {
          // Skip secondary items in display
          if (item.isSecondaryItem) return;

          const totalQty = item.unitQuantity + (item.subUnitQuantity / (item.item.unitContains?.value || 1));
          const itemPrice = item.unitPrice;
          const itemTotal = item.totalPrice;

          receiptContent += `
            <tr>
              <td class="item-name">
                ${item.item?.name || 'Unknown Item'}
                <div class="batch-info">Batch: ${item.batch?.batchNumber || 'N/A'}</div>
                ${item.batch?.expiryDate ? 
                  `<div class="batch-info">Exp: ${new Date(item.batch.expiryDate).toLocaleDateString()}</div>` : ''}
              </td>
              <td class="qty">${totalQty.toFixed(2)}</td>
              <td class="price">${formatCurrency(itemPrice)}</td>
              <td class="amount">${formatCurrency(itemTotal)}</td>
            </tr>
          `;
        });

        receiptContent += `</table></div>`;
      } else {
        // Foreign patients - show pharmacy total section (REMOVED "USD Amount Entered")
        const foreignPharmacyUSDTotal = getPharmacyTotalForDisplay();
        
        if (foreignPharmacyUSDTotal > 0) {
          receiptContent += `
            <div class="receipt-sections">
              <div class="section-title">PHARMACY ITEMS</div>
              <table class="receipt-items">
                <tr>
                  <td class="item-name-full">Pharmacy Total</td>
                  <td class="amount-full">${formatCurrency(foreignPharmacyUSDTotal)}</td>
                </tr>
              </table>
            </div>
          `;
        }
      }
    }

    // Totals Section
    receiptContent += `
      <div class="receipt-totals">
    `;

    // Manual Appointment Amount Total (includes rounding adjustment for seamless billing)
    if (manualAppointmentAmount > 0) {
      const roundingAdjustment = sale.roundingAdjustmentAmount || 0;
      const adjustedAppointmentAmount = manualAppointmentAmount + roundingAdjustment;
      receiptContent += `<div class="total-row"><span>Appointment Fee:</span><span>${formatCurrency(adjustedAppointmentAmount)}</span></div>`;
    }

    if (getProceduresTotal() > 0) {
      receiptContent += `<div class="total-row"><span>Procedures Total:</span><span>${formatCurrency(getProceduresTotal())}</span></div>`;
    }

    if (appointmentProceduresTotal > 0) {
      receiptContent += `<div class="total-row"><span>Doctor Procedures Total:</span><span>${formatCurrency(appointmentProceduresTotal)}</span></div>`;
    }

    if (getLabTestsTotal() > 0) {
      receiptContent += `<div class="total-row"><span>Lab Tests Total:</span><span>${formatCurrency(getLabTestsTotal())}</span></div>`;
    }

    // Use the updated function for pharmacy total
    const pharmacyTotalForDisplay = getPharmacyTotalForDisplay();
    if (pharmacyTotalForDisplay > 0) {
      receiptContent += `<div class="total-row"><span>Pharmacy Total:</span><span>${formatCurrency(pharmacyTotalForDisplay)}</span></div>`;
    }

    // Check if this is a free bill
    const isFreeBill = sale.isFreeBill || false;
    const originalAmount = sale.originalAmount || 0;
    const discountAmount = sale.discountAmount || 0;

    // Show original amount and discount for free bills
    if (isFreeBill && originalAmount > 0) {
      receiptContent += `
        <div class="total-row" style="margin-top: 10px; border-top: 1px dashed #000; padding-top: 8px;">
          <span>Subtotal:</span>
          <span>${formatCurrency(originalAmount)}</span>
        </div>
        <div class="total-row" style="font-weight: bold;">
          <span>Discount (100%):</span>
          <span>-${formatCurrency(discountAmount)}</span>
        </div>
      `;
    }

    // Grand Total (rounding adjustment is already included in the appointment fee, so we don't show it separately)
    // For free bills, show Rs 0.00 with special styling
    if (isFreeBill) {
      receiptContent += `
        <div class="total-row grand-total" style="border: 2px solid #000; padding: 8px; margin-top: 5px;">
          <span>GRAND TOTAL (${currencyCode}):</span>
          <span style="font-size: 16px;">${formatCurrency(0)}</span>
        </div>
        <div style="text-align: center; margin-top: 8px; font-weight: bold; font-size: 12px;">
          *** FREE BILL - 100% DISCOUNT APPLIED ***
        </div>
      </div>
      `;
    } else {
      receiptContent += `
        <div class="total-row grand-total">
          <span>GRAND TOTAL (${currencyCode}):</span>
          <span>${formatCurrency(getTotalAmount())}</span>
        </div>
      </div>
      `;
    }

    // Payment Information (without received amount and balance)
    // Add special styling for free bills (no colors for thermal printer)
    const paymentInfoStyle = isFreeBill 
      ? 'border: 2px solid #000;' 
      : 'border: 1px dashed #000;';
    
    receiptContent += `
      <div class="payment-info" style="${paymentInfoStyle}">
        <h4>Payment Information</h4>
        <div><strong>Method:</strong> ${this.formatPaymentMethod(sale.paymentMethod)}</div>
        ${isFreeBill ? '<div style="font-weight: bold; margin-top: 5px;">No Payment Required - Free Bill</div>' : ''}
    `;

    // Add payment details for cash payments (local patients)
    if (isLocal && sale.paymentDetails) {
      if (sale.paymentDetails.method === 'cash') {
        const paymentDetails = sale.paymentDetails as any;
        if (paymentDetails.receivedAmount !== undefined) {
          receiptContent += `<div><strong>Received:</strong> Rs. ${paymentDetails.receivedAmount.toFixed(2)}</div>`;
        }
        if (paymentDetails.changeAmount !== undefined && paymentDetails.changeAmount > 0) {
          receiptContent += `<div><strong>Change:</strong> Rs. ${paymentDetails.changeAmount.toFixed(2)}</div>`;
        }
      } else if (sale.paymentDetails.method === 'card') {
        // Show card number for local patients if available
        if (sale.paymentDetails.cardNumber) {
          receiptContent += `<div><strong>Card:</strong> ${sale.paymentDetails.cardNumber}</div>`;
        }
      }
    }

    // Show initial payment and due amount for partial payments and credit
    if (isLocal && (sale.initialPayment !== undefined || sale.dueAmount !== undefined)) {
      const initialPayment = sale.initialPayment || 0;
      const dueAmount = sale.dueAmount || 0;
      
      if (initialPayment > 0 || dueAmount > 0) {
        receiptContent += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ccc;">`;
        if (initialPayment > 0) {
          receiptContent += `<div><strong>Initial Payment:</strong> Rs. ${initialPayment.toFixed(2)}</div>`;
        }
        if (dueAmount > 0) {
          receiptContent += `<div><strong>Due Amount:</strong> Rs. ${dueAmount.toFixed(2)}</div>`;
        }
        receiptContent += `</div>`;
      }
    }

    // Add specific payment details for foreign patients
    if (!isLocal && sale.paymentDetails) {
      if (sale.paymentDetails.method === 'cash') {
        const paymentDetails = sale.paymentDetails as any;
        if (paymentDetails.lkrCash) {
          receiptContent += `<div><strong>LKR Cash:</strong> Rs. ${paymentDetails.lkrCash.toFixed(2)}</div>`;
        }
        if (paymentDetails.usdCash) {
          receiptContent += `<div><strong>USD Cash:</strong> $${paymentDetails.usdCash.toFixed(2)}</div>`;
        }
        if (paymentDetails.euroCash) {
          receiptContent += `<div><strong>Euro Cash:</strong> €${paymentDetails.euroCash.toFixed(2)}</div>`;
        }
      } else if (sale.paymentDetails.method === 'card') {
        const paymentDetails = sale.paymentDetails as any;
        if (paymentDetails.cardType) {
          receiptContent += `<div><strong>Card Type:</strong> ${paymentDetails.cardType.toUpperCase()}</div>`;
        }
        if (sale.paymentDetails.cardNumber) {
          receiptContent += `<div><strong>Card:</strong> ${sale.paymentDetails.cardNumber}</div>`;
        }
      }
    }

    receiptContent += `</div>`;

    // Footer
    receiptContent += `
      <div class="receipt-footer">
        <div class="thank-you">Thank you for your visit!</div>
        <div>Please keep this receipt for your records</div>
        <div>───────────────────────────</div>
        <div style="margin-top: 10px;">
          Generated: ${new Date().toLocaleString()}
        </div>
        <div style="margin-top: 8px; font-size: 9px; color: #666;">
          WebVizard Software Solutions - 0712654267
        </div>
      </div>
    `;

    return receiptContent;
  }

  /**
   * Format payment method for display
   */
  private formatPaymentMethod(method: string): string {
    switch (method) {
      case 'cash': return 'Cash';
      case 'card': return 'Card';
      case 'bank_deposit': return 'Bank Transfer';
      case 'credit': return 'Credit';
      case 'free': return 'Free Bill (100% Discount)';
      default: return method;
    }
  }

  /**
   * Update store configuration
   */
  updateConfig(config: Partial<POSReceiptConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): POSReceiptConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const posReceiptService = new POSReceiptService();
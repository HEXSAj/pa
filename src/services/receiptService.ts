

// src/services/receiptService.ts
import { Sale, SaleItem } from '@/types/sale';
import { format } from 'date-fns';
import { database } from '@/lib/firebase';
import { 
  ref, 
  get, 
  query, 
  orderByChild, 
  limitToLast,
  child 
} from 'firebase/database';

import { Quotation } from '@/types/quotation';
import { CashierSession } from '@/services/cashierService';

// Constants for collection names
const SALES_COLLECTION = 'sales';
const INVENTORY_COLLECTION = 'inventory';
const BATCHES_COLLECTION = 'batches';

/**
 * Receipt Service to handle printing sales receipts to thermal printers
 */
export const receiptService = {

  /**
   * Print a quotation to an A4 printer with professional styling
   * @param quotation Quotation object containing all information
   */
  async printQuotationA4(quotation: Quotation): Promise<boolean> {
    try {
      // Create the A4 quotation content
      const quotationContent = this.generateA4QuotationContent(quotation);
      
      // Print using the browser's print functionality
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        console.error('Failed to open print window. Check if popup blocker is enabled.');
        return false;
      }
      
      // Add the quotation content to the print window
      printWindow.document.write(`
        <html>
          <head>
            <title>Professional Quotation</title>
            <style>
              @page {
                size: A4;
                margin: 0.5in;
              }
              body {
                font-family: 'Arial', sans-serif;
                color: #333;
                line-height: 1.6;
                margin: 0;
                padding: 0;
              }
              .quotation-container {
                max-width: 100%;
              }
              .header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #3b82f6;
              }
              .logo-section {
                display: flex;
                flex-direction: column;
              }
              .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #1e3a8a;
                margin-bottom: 5px;
              }
              .company-details {
                font-size: 14px;
                color: #64748b;
              }
              .doc-title {
                font-size: 32px;
                font-weight: bold;
                color: #3b82f6;
                text-align: right;
                margin-top: 15px;
              }
              .quotation-details {
                background-color: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                display: flex;
                justify-content: space-between;
              }
              .quotation-details div {
                flex: 1;
              }
              .detail-label {
                font-weight: bold;
                color: #64748b;
                font-size: 14px;
                display: block;
              }
              .detail-value {
                font-size: 16px;
                margin-bottom: 10px;
              }
              .customer-details {
                margin-bottom: 30px;
              }
              .section-title {
                font-size: 18px;
                font-weight: bold;
                color: #1e3a8a;
                margin-bottom: 15px;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 5px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
              }
              thead {
                background-color: #3b82f6;
                color: white;
              }
              th, td {
                padding: 12px 15px;
                text-align: center;;
                border-bottom: 1px solid #e2e8f0;
              }
              th {
                font-weight: bold;
              }
              .amount-col {
                text-align: right;
              }
              tr:nth-child(even) {
                background-color: #f8fafc;
              }
              .total-section {
                width: 350px;
                margin-left: auto;
                margin-right: 0;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                font-size: 16px;
              }
              .total-row.grand-total {
                font-weight: bold;
                font-size: 18px;
                border-top: 2px solid #3b82f6;
                padding-top: 10px;
                margin-top: 5px;
                color: #1e3a8a;
              }
              .discount {
                color: #10b981;
              }
              .footer {
                margin-top: 50px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                font-size: 14px;
                color: #64748b;
                text-align: center;
              }
              .footer p {
                margin: 5px 0;
              }
              .expiry-notice {
                background-color: #fee2e2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 15px;
                margin-top: 30px;
                color: #b91c1c;
                text-align: center;
                font-weight: bold;
              }
              .no-print {
                display: block;
                margin: 20px auto;
                padding: 10px 20px;
                background-color: #3b82f6;
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
              }
              @media print {
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="quotation-container">
              ${quotationContent}
            </div>
            <div class="no-print">
              <button onclick="window.print(); window.close();" style="margin: 20px auto; display: block; padding: 10px 20px;">
                Print Quotation
              </button>
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      return true;
    } catch (error) {
      console.error('Error printing A4 quotation:', error);
      return false;
    }
  },

  /**
   * Generate the HTML content for the A4 quotation
   * @param quotation Quotation object
   * @returns HTML string for the quotation
   */
  
  async getLatestSale(): Promise<Sale | null> {
    try {
      // Get all sales ordered by createdAt
      const salesRef = query(ref(database, SALES_COLLECTION), orderByChild('createdAt'), limitToLast(1));
      const snapshot = await get(salesRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      // Extract the data from the snapshot
      const salesData = snapshot.val();
      const saleId = Object.keys(salesData)[0]; // Get the key of the first (and only) sale
      const saleData = salesData[saleId];
      
      console.log("Raw sale data from Firebase:", JSON.stringify(saleData, null, 2));
      
      // Fetch full item details for each sale item
      const itemsPromises = saleData.items.map(async (item: any, index: number) => {
        try {
          console.log(`Processing item ${index}:`, JSON.stringify(item, null, 2));
          
          // Check if this is a secondary inventory item
          if (item.isSecondaryItem) {
            console.log(`Item ${index} is a secondary item with ID: ${item.secondaryItemId}`);
            
            // For secondary items, we need to ensure item properties are present
            if (!item.item || typeof item.item !== 'object') {
              console.log(`Item ${index} is missing item object, fetching from secondaryInventory`);
              
              // Try to fetch the secondary item details if not already present
              if (item.secondaryItemId) {
                try {
                  const secondaryItemRef = ref(database, `secondaryInventory/${item.secondaryItemId}`);
                  const secondarySnapshot = await get(secondaryItemRef);
                  
                  if (secondarySnapshot.exists()) {
                    const secondaryData = secondarySnapshot.val();
                    console.log(`Found secondary item data:`, secondaryData);
                    
                    // Create a proper item object with required properties
                    item.item = {
                      id: item.itemId,
                      name: secondaryData.mainItemName || "Secondary Item",
                      mainItemName: secondaryData.mainItemName || "Secondary Item",
                      code: secondaryData.mainItemCode || "",
                      type: "Secondary"
                    };
                    
                    console.log(`Created item object for secondary item:`, item.item);
                  } else {
                    console.warn(`Secondary item ${item.secondaryItemId} not found in database`);
                    // Create a default item object if secondary item not found
                    item.item = {
                      id: item.itemId,
                      name: "Secondary Item",
                      mainItemName: "Secondary Item",
                      type: "Secondary"
                    };
                  }
                } catch (err) {
                  console.error(`Error fetching secondary item ${item.secondaryItemId}:`, err);
                  // Create a fallback item object
                  item.item = {
                    id: item.itemId,
                    name: "Secondary Item (Error)",
                    mainItemName: "Secondary Item (Error)",
                    type: "Secondary"
                  };
                }
              } else {
                // Create a generic item object if no secondary ID available
                console.warn(`Secondary item without secondaryItemId at index ${index}`);
                item.item = {
                  id: item.itemId,
                  name: "Unknown Secondary Item",
                  mainItemName: "Unknown Secondary Item",
                  type: "Secondary"
                };
              }
            } else {
              console.log(`Item ${index} already has item object:`, item.item);
            }
            
            // Ensure there's a batch object (even empty) for type compatibility
            item.batch = item.batch || {};
            
            return item;
          } else {
            // Regular inventory item with batch
            // Get item details if not already present
            let itemData = item.item;
            if (!itemData || typeof itemData !== 'object') {
              console.log(`Regular item ${index} is missing item object, fetching from inventory`);
              
              const itemRef = ref(database, `${INVENTORY_COLLECTION}/${item.itemId}`);
              const itemSnapshot = await get(itemRef);
              
              if (itemSnapshot.exists()) {
                itemData = {
                  id: item.itemId,
                  ...itemSnapshot.val()
                };
                console.log(`Fetched item data for regular item:`, itemData);
              } else {
                console.warn(`Item ${item.itemId} not found in inventory`);
                itemData = {
                  id: item.itemId,
                  name: "Unknown Item",
                  type: "Unknown"
                };
              }
            } else {
              console.log(`Regular item ${index} already has item object:`, itemData);
            }
            
            // Get batch details
            let batchData = item.batch;
            if (!batchData || typeof batchData !== 'object' || Object.keys(batchData).length === 0) {
              console.log(`Regular item ${index} is missing batch data, fetching from batches`);
              
              if (item.batchId) {
                const batchRef = ref(database, `${BATCHES_COLLECTION}/${item.batchId}`);
                const batchSnapshot = await get(batchRef);
                
                if (batchSnapshot.exists()) {
                  batchData = {
                    id: item.batchId,
                    ...batchSnapshot.val(),
                    expiryDate: new Date(batchSnapshot.val().expiryDate) // Convert timestamp to Date
                  };
                  console.log(`Fetched batch data:`, batchData);
                } else {
                  console.warn(`Batch ${item.batchId} not found in database`);
                  batchData = {
                    id: item.batchId,
                    batchNumber: "Unknown",
                    expiryDate: new Date()
                  };
                }
              } else {
                console.warn(`Regular item without batchId at index ${index}`);
                batchData = {
                  id: "unknown",
                  batchNumber: "Unknown",
                  expiryDate: new Date()
                };
              }
            } else if (batchData.expiryDate) {
              // Ensure expiryDate is a Date object
              batchData.expiryDate = new Date(batchData.expiryDate);
            }
            
            // Return the complete item with all required properties
            return {
              ...item,
              item: itemData,
              batch: batchData
            };
          }
        } catch (err) {
          console.error(`Error processing item ${index}:`, err);
          // Return the item with minimal data to prevent the entire process from failing
          return {
            ...item,
            item: item.item || {
              id: item.itemId,
              name: "Error Item",
              type: "Error"
            },
            batch: item.batch || {}
          };
        }
      });
      
      // Wait for all item details to be fetched
      const populatedItems = await Promise.all(itemsPromises);
      console.log("Populated items:", JSON.stringify(populatedItems.map(item => ({
        isSecondary: item.isSecondaryItem,
        itemName: item.item?.name,
        mainItemName: item.item?.mainItemName
      })), null, 2));
      
      // Get customer information - check both customerInfo and customer fields
      let customerData = undefined;
      if (saleData.customerInfo) {
        // This could be a regular customer or a one-time customer
        customerData = {
          id: saleData.customerInfo.id,
          name: saleData.customerInfo.name,
          mobile: saleData.customerInfo.mobile,
          address: saleData.customerInfo.address
        };
      } else if (saleData.customer) {
        // Legacy format - direct customer object
        customerData = saleData.customer;
      }
      
      // Format the sale data
      const formattedSale = {
        id: saleId,
        ...saleData,
        items: populatedItems,
        discountPercentage: saleData.discountPercentage || 0,
        totalDiscount: saleData.totalDiscount || 0,
        initialPayment: saleData.initialPayment || 0,
        dueAmount: saleData.dueAmount || 0,
        isPaid: saleData.isPaid || false,
        paymentHistory: saleData.paymentHistory || [],
        // Convert timestamps to Date objects
        saleDate: new Date(saleData.saleDate),
        createdAt: new Date(saleData.createdAt),
        updatedAt: new Date(saleData.updatedAt),
        customer: customerData
      } as Sale;
      
      console.log("Returning formatted sale:", JSON.stringify({
        id: formattedSale.id,
        itemCount: formattedSale.items.length,
        hasSecondaryItems: formattedSale.items.some(i => i.isSecondaryItem)
      }, null, 2));
      
      return formattedSale;
    } catch (error) {
      console.error('Error getting latest sale:', error);
      return null;
    }
  },



  generateA4QuotationContent(quotation: Quotation): string {
    // Format the date and time
    const dateFormatted = format(quotation.createdAt, 'dd/MM/yyyy');
    const expiryDateFormatted = quotation.expiryDate ? format(quotation.expiryDate, 'dd/MM/yyyy') : null;
    
    // Calculate all the totals including discounts
    const subtotal = quotation.items.reduce((sum, item) => sum + this.getOriginalPrice(item), 0);
    const cartDiscount = quotation.totalDiscount || 0;
    const itemDiscountTotal = quotation.items.reduce((sum, item) => sum + (item.itemDiscount || 0), 0);
    const loyaltyPointsDiscount = quotation.loyaltyPointsUsed || 0;

    // <div>Address: 242, Galle Road, Hikkaduwa</div>
    // <div>Email: gmail@gmail.com</div>


    
    // Generate HTML for the header
    const header = `
      <div class="header">
        <div class="logo-section">
          <div style="display: flex; align-items: center; margin-bottom: 5px;">
            <img src="/logo.png" alt="Business Logo" style="height: 40px; margin-right: 15px;">
            <div class="company-name" style="color: #10b981;">Niven Medicals</div>
          </div>
          <div class="company-details">
            <div>Phone: [Your Contact Number]</div>
            <div>Address: [Your Address]</div>
          </div>
        </div>
        <div>
          <div class="doc-title">QUOTATION</div>
        </div>
      </div>
    `;
    
    // Generate quotation info section
    const quotationInfo = `
      <div class="quotation-details">
        <div>
          <span class="detail-label">Quotation #:</span>
          <div class="detail-value">${quotation.quotationNumber}</div>
          
          <span class="detail-label">Date Issued:</span>
          <div class="detail-value">${dateFormatted}</div>
        </div>
        <div>
          <span class="detail-label">Valid Until:</span>
          <div class="detail-value">${expiryDateFormatted || 'Not specified'}</div>
        </div>
      </div>
    `;
    
    // Generate customer section
    const customerSection = `
      <div class="customer-details">
        <div class="section-title">Customer Information</div>
        ${quotation.customer ? `
          <div class="detail-value">${quotation.customer.name}</div>
          ${quotation.customer.mobile ? `<div class="detail-value">Phone: ${quotation.customer.mobile}</div>` : ''}
          ${quotation.customer.address ? `<div class="detail-value">Address: ${quotation.customer.address}</div>` : ''}
        ` : `
          <div class="detail-value">No specific customer</div>
        `}
      </div>
    `;
    
    // Generate items table
    const itemsTable = `
      <div class="section-title">Items</div>
      <table>
        <thead>
          <tr>
            <th width="40%">Description</th>
            <th width="15%">Quantity</th>
            <th width="15%" class="amount-col">Unit Price</th>
            <th width="15%" class="amount-col">Discount</th>
            <th width="15%" class="amount-col">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${quotation.items.map(item => {
            const originalPrice = this.getOriginalPrice(item);
            const discount = item.itemDiscount || 0;
            const discountPercentage = item.itemDiscountPercentage || 0;
            
            let qtyDisplay = '';
            if (item.unitQuantity > 0) {
              qtyDisplay += `${item.unitQuantity} units`;
            }
            if (item.subUnitQuantity > 0 && item.item.unitContains) {
              if (item.unitQuantity > 0) qtyDisplay += ' + ';
              qtyDisplay += `${item.subUnitQuantity} ${item.item.unitContains.unit}`;
            }
            
            return `
              <tr>
                <td>${item.item.name}</td>
                <td>${qtyDisplay}</td>
                <td class="amount-col">Rs${(item.unitPrice || 0).toFixed(2)}</td>
                <td class="amount-col">${discountPercentage > 0 ? `${discountPercentage}%` : '-'}</td>
                <td class="amount-col">Rs${item.totalPrice.toFixed(2)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    
    // Generate totals section - Updated to include loyalty points
    const totals = `
      <div class="total-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>Rs${subtotal.toFixed(2)}</span>
        </div>
        
        ${itemDiscountTotal > 0 ? `
          <div class="total-row discount">
            <span>Item Discounts:</span>
            <span>-Rs${itemDiscountTotal.toFixed(2)}</span>
          </div>
        ` : ''}
        
        ${cartDiscount > 0 ? `
          <div class="total-row discount">
            <span>Cart Discount${quotation.discountPercentage ? ` (${quotation.discountPercentage}%)` : ''}:</span>
            <span>-Rs${cartDiscount.toFixed(2)}</span>
          </div>
        ` : ''}
        
        ${loyaltyPointsDiscount > 0 ? `
          <div class="total-row discount">
            <span>Loyalty Points:</span>
            <span>-Rs${loyaltyPointsDiscount.toFixed(2)}</span>
          </div>
        ` : ''}
        
        <div class="total-row grand-total">
          <span>Total:</span>
          <span>Rs${quotation.totalAmount.toFixed(2)}</span>
        </div>
      </div>
    `;
    
    // Generate footer
    const footer = `
      <div class="footer">
        <p>Thank you for your interest in our products/services.</p>
        <p>This is only a quotation and not an official invoice. No payment is required at this time.</p>
        
        ${expiryDateFormatted ? `
          <div class="expiry-notice">
            This quotation is valid until ${expiryDateFormatted}
          </div>
        ` : ''}
        
        <p>Business Name &copy; ${new Date().getFullYear()}</p>
  
        <p style="color: #718096; font-size: 12px; margin-top: 2px;">Software Solution by WebVizard Software Solutions - 0712654267</p>
      </div>
    `;
    
    // Combine all sections
    return `
      ${header}
      ${quotationInfo}
      ${customerSection}
      ${itemsTable}
      ${totals}
      ${footer}
    `;
  },


  /**
   * Print a quotation to a thermal 80mm POS printer
   * @param quotation Quotation object containing all information
   */
  async printQuotation(quotation: Quotation): Promise<boolean> {
    try {
      // Create the quotation content
      const quotationContent = this.generateQuotationContent(quotation);
      
      // Print to thermal printer using the browser's print functionality
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        console.error('Failed to open print window. Check if popup blocker is enabled.');
        return false;
      }
      
      // Add the quotation content to the print window
      printWindow.document.write(`
        <html>
          <head>
            <title>Quotation</title>
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
                line-height: 1.2;
              }
              .receipt {
                padding: 5mm;
              }
              .receipt-header {
                text-align: center;
                margin-bottom: 10px;
              }
              .store-name {
                font-size: 16px;
                font-weight: bold;
              }
              .receipt-info {
                margin-bottom: 10px;
                border-bottom: 1px dashed #000;
                padding-bottom: 10px;
              }
              .receipt-items {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
              }
              .receipt-items th, .receipt-items td {
                text-align: center;;
                padding: 2px 0;
              }
              .receipt-items .amount {
                text-align: right;
              }
              .receipt-items .qty {
                text-align: center;
              }
              .receipt-items .discount {
                font-style: italic;
                font-size: 11px;
              }
              .receipt-totals {
                width: 100%;
                margin-bottom: 10px;
                border-top: 1px dashed #000;
                padding-top: 10px;
              }
              .receipt-totals .label {
                text-align: center;;
              }
              .receipt-totals .amount {
                text-align: right;
                font-weight: bold;
              }
              .receipt-footer {
                text-align: center;
                font-size: 11px;
                margin-top: 10px;
                border-top: 1px dashed #000;
                padding-top: 10px;
              }
              .quotation-banner {
                text-align: center;
                font-weight: bold;
                font-size: 14px;
                margin: 5px 0;
                padding: 5px;
                border: 1px dashed #000;
              }
              .expiry-notice {
                font-style: italic;
                text-align: center;
                margin-top: 5px;
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
              ${quotationContent}
            </div>
            <div class="no-print">
              <button onclick="window.print(); window.close();" style="margin: 20px; padding: 10px;">
                Print Quotation
              </button>
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      return true;
    } catch (error) {
      console.error('Error printing quotation:', error);
      return false;
    }
  },
  

  generateQuotationContent(quotation: Quotation): string {
    // Format the date and time
    const dateFormatted = format(quotation.createdAt, 'dd/MM/yyyy');
    const timeFormatted = format(quotation.createdAt, 'hh:mm:ss a');
    const expiryDateFormatted = quotation.expiryDate ? format(quotation.expiryDate, 'dd/MM/yyyy') : null;
    
    // Calculate all the totals including discounts
    const subtotal = quotation.items.reduce((sum, item) => sum + this.getOriginalPrice(item), 0);
    const cartDiscount = quotation.totalDiscount || 0;
    const itemDiscountTotal = quotation.items.reduce((sum, item) => sum + (item.itemDiscount || 0), 0);
    const loyaltyPointsDiscount = quotation.loyaltyPointsUsed || 0;
    
    // Generate HTML for quotation header
    const header = `
      <div class="receipt-header">
        <div class="store-name">Niven Medicals</div>
        <div>Pharmacy Management System</div>
      </div>
      <div class="quotation-banner">QUOTATION</div>
    `;
  
    let customerName = null;
    let customerMobile = null;
    if (quotation.customer) {
      customerName = quotation.customer.name;
      customerMobile = quotation.customer.mobile;
    } else if (quotation.customerInfo) {
      customerName = quotation.customerInfo.name;
      customerMobile = quotation.customerInfo.mobile;
    }
    
    // Generate quotation info section
    const quotationInfo = `
      <div class="receipt-info">
        <div>Quotation #: ${quotation.quotationNumber}</div>
        <div>Date: ${dateFormatted}</div>
        <div>Time: ${timeFormatted}</div>
        ${expiryDateFormatted ? `<div>Valid Until: ${expiryDateFormatted}</div>` : ''}
        ${customerName ? `<div>Customer: ${customerName}</div>` : ''}
        ${customerMobile ? `<div>Phone: ${customerMobile}</div>` : ''}
      </div>
    `;
    
    // Generate items table
    const itemsTable = `
      <table class="receipt-items">
        <thead>
          <tr>
            <th width="45%">Item</th>
            <th width="15%" class="qty">Qty</th>
            <th width="40%" class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${quotation.items.map(item => this.formatReceiptItem(item)).join('')}
        </tbody>
      </table>
    `;
    
    // Generate totals section - Modified to handle loyalty points
    const totals = `
      <table class="receipt-totals">
        <tr>
          <td class="label">Subtotal:</td>
          <td class="amount">Rs${subtotal.toFixed(2)}</td>
        </tr>
        ${itemDiscountTotal > 0 ? `
          <tr>
            <td class="label">Item Discounts:</td>
            <td class="amount">-Rs${itemDiscountTotal.toFixed(2)}</td>
          </tr>
        ` : ''}
        ${cartDiscount > 0 ? `
          <tr>
            <td class="label">Cart Discount${quotation.discountPercentage ? ` (${quotation.discountPercentage}%)` : ''}:</td>
            <td class="amount">-Rs${cartDiscount.toFixed(2)}</td>
          </tr>
        ` : ''}
        ${loyaltyPointsDiscount > 0 ? `
          <tr>
            <td class="label">Loyalty Points:</td>
            <td class="amount">-Rs${loyaltyPointsDiscount.toFixed(2)}</td>
          </tr>
        ` : ''}
        <tr>
          <td class="label">Total:</td>
          <td class="amount">Rs${quotation.totalAmount.toFixed(2)}</td>
        </tr>
      </table>
    `;
    
    // Generate footer
    const footer = `
      <div class="expiry-notice">
        ${expiryDateFormatted ? `This quotation is valid until ${expiryDateFormatted}` : 'Prices are subject to change'}
      </div>
      <div class="receipt-footer">
        <div>Thank you for your interest!</div>
        <div>This is only a quotation and not an actual sale.</div>
        <div>Name නම</div>
      </div>
    `;
    
    // Combine all sections
    return `
      ${header}
      ${quotationInfo}
      ${itemsTable}
      ${totals}
      ${footer}
    `;
  },


  async getLatestSale(): Promise<Sale | null> {
    try {
      // Get all sales ordered by createdAt
      const salesRef = query(ref(database, SALES_COLLECTION), orderByChild('createdAt'), limitToLast(1));
      const snapshot = await get(salesRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      // Extract the data from the snapshot
      const salesData = snapshot.val();
      const saleId = Object.keys(salesData)[0]; // Get the key of the first (and only) sale
      const saleData = salesData[saleId];
      
      // Fetch full item details for each sale item
      const itemsPromises = saleData.items.map(async (item: any) => {
        try {
          // Get item details
          const itemRef = ref(database, `${INVENTORY_COLLECTION}/${item.itemId}`);
          const itemSnapshot = await get(itemRef);
          const itemData = itemSnapshot.exists() ? itemSnapshot.val() : {};
          
          // Get batch details
          const batchRef = ref(database, `${BATCHES_COLLECTION}/${item.batchId}`);
          const batchSnapshot = await get(batchRef);
          const batchData = batchSnapshot.exists() ? batchSnapshot.val() : {};
          
          return {
            ...item,
            item: {
              id: item.itemId,
              ...itemData
            },
            batch: {
              id: item.batchId,
              ...batchData,
              expiryDate: new Date(batchData.expiryDate) // Convert timestamp to Date
            }
          };
        } catch (err) {
          console.error(`Error fetching details for item ${item.itemId}:`, err);
          // Return the item with minimal data to prevent the entire process from failing
          return item;
        }
      });
      
      // Wait for all item details to be fetched
      const populatedItems = await Promise.all(itemsPromises);
      
      // Get customer information - check both customerInfo and customer fields
      let customerData = undefined;
      if (saleData.customerInfo) {
        // This could be a regular customer or a one-time customer
        customerData = {
          id: saleData.customerInfo.id,
          name: saleData.customerInfo.name,
          mobile: saleData.customerInfo.mobile,
          address: saleData.customerInfo.address
        };
      } else if (saleData.customer) {
        // Legacy format - direct customer object
        customerData = saleData.customer;
      }
      
      // Format the sale data
      return {
        id: saleId,
        ...saleData,
        items: populatedItems,
        discountPercentage: saleData.discountPercentage || 0,
        totalDiscount: saleData.totalDiscount || 0,
        initialPayment: saleData.initialPayment || 0,
        dueAmount: saleData.dueAmount || 0,
        isPaid: saleData.isPaid || false,
        paymentHistory: saleData.paymentHistory || [],
        // Convert timestamps to Date objects
        saleDate: new Date(saleData.saleDate),
        createdAt: new Date(saleData.createdAt),
        updatedAt: new Date(saleData.updatedAt),
        customer: customerData
      } as Sale;
    } catch (error) {
      console.error('Error getting latest sale:', error);
      return null;
    }
  },



  /**
   * Print a sale receipt to a thermal 80mm POS printer
   * @param sale Sale object containing all sale information
   */
  
async printReceipt(sale: Sale): Promise<boolean> {
  try {
    // REMOVE THIS CONDITION - Allow printing for both local and foreign patients
    // if (sale.patientType === 'foreign') {
    //   console.log('Skipping receipt printing for foreign patient');
    //   return true; // Return true to indicate success but actually skip printing
    // }

    // Create the receipt content
    const receiptContent = this.generateReceiptContent(sale);
    
    // Print to thermal printer using the browser's print functionality
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      console.error('Failed to open print window. Check if popup blocker is enabled.');
      return false;
    }
    
    // Add the receipt content to the print window
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
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
              line-height: 1.2;
            }
            .receipt {
              padding: 5mm;
            }
            .receipt-header {
              text-align: center;
              margin-bottom: 10px;
            }
            .store-name {
              font-size: 16px;
              font-weight: bold;
            }
            .receipt-info {
              margin-bottom: 10px;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            .receipt-items {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            .receipt-items th, .receipt-items td {
              text-align: center;
              padding: 2px 0;
            }
            .receipt-items .amount {
              text-align: right;
            }
            .receipt-items .qty {
              text-align: center;
            }
            .receipt-items .discount {
              font-style: italic;
              font-size: 11px;
            }
            .receipt-totals {
              width: 100%;
              margin-bottom: 10px;
              border-top: 1px dashed #000;
              padding-top: 10px;
            }
            .receipt-totals .label {
              text-align: center;
            }
            .receipt-totals .amount {
              text-align: right;
              font-weight: bold;
            }
            .receipt-footer {
              text-align: center;
              font-size: 11px;
              margin-top: 10px;
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
            <button onclick="window.print(); window.close();" style="margin: 20px; padding: 10px;">
              Print Receipt
            </button>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
                // Signal back to the parent window that printing is complete
                window.opener.postMessage('receipt-printed', '*');
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    return true;
  } catch (error) {
    console.error('Error printing receipt:', error);
    return false;
  }
},


// async printCashierSessionReportWithExpenses(session: any, sessionSales: any[], sessionExpenses: any[], totals: any): Promise<void> {
//   try {
//     console.log('Printing enhanced multi-currency cashier session report...');
    
//     // Calculate currency breakdown
//     const cashTotals = { lkr: 0, usd: 0, euro: 0 };
//     const cardTotals = { lkr: 0, usd: 0, euro: 0 };
//     const revenueTotals = { lkr: 0, usd: 0, euro: 0 };
    
//     sessionSales.forEach(sale => {
//       if (sale.patientType === 'local') {
//         revenueTotals.lkr += sale.totalAmount;
//         if (sale.paymentMethod === 'cash') {
//           cashTotals.lkr += sale.totalAmount;
//         } else if (sale.paymentMethod === 'card') {
//           cardTotals.lkr += sale.totalAmount;
//         }
//       } else {
//         // Foreign patient
//         revenueTotals.usd += sale.totalAmount;
//         revenueTotals.lkr += sale.grandTotalLKR || 0;
        
//         if (sale.paymentMethod === 'cash' && sale.paymentDetails) {
//           const paymentDetails = sale.paymentDetails as any;
//           cashTotals.lkr += paymentDetails.lkrCash || 0;
//           cashTotals.usd += paymentDetails.usdCash || 0;
//           cashTotals.euro += paymentDetails.euroCash || 0;
//         } else if (sale.paymentMethod === 'card' && sale.paymentDetails) {
//           const paymentDetails = sale.paymentDetails as any;
//           if (paymentDetails.cardType === 'usd') {
//             cardTotals.usd += paymentDetails.cardAmount || sale.totalAmount;
//           } else if (paymentDetails.cardType === 'euro') {
//             cardTotals.euro += paymentDetails.cardAmount || 0;
//             revenueTotals.euro += paymentDetails.cardAmount || 0;
//           }
//         }
//       }
//     });
    
//     // Expense calculations
//     const totalExpenses = sessionExpenses.reduce((sum, expense) => sum + expense.amount, 0);
//     const netRevenueLKR = revenueTotals.lkr - totalExpenses;
//     const netCashLKR = cashTotals.lkr - totalExpenses;
//     const expectedCash = (session.startingAmount || 0) + netCashLKR;
    
//     const receiptContent = `
// ================================================
//               CASHIER SESSION REPORT
// ================================================

// Session ID: ${session.id}
// Cashier: ${session.userName}
// Start: ${format(session.startDate, 'dd/MM/yyyy HH:mm')}
// End: ${session.endDate ? format(session.endDate, 'dd/MM/yyyy HH:mm') : 'Active'}
// Duration: ${this.calculateSessionDuration(session)}

// ================================================
//              MULTI-CURRENCY BREAKDOWN
// ================================================

// --- CASH TOTALS ---
// LKR Cash: Rs. ${cashTotals.lkr.toFixed(2)}
// USD Cash: $${cashTotals.usd.toFixed(2)}
// Euro Cash: €${cashTotals.euro.toFixed(2)}

// --- CARD TOTALS ---
// LKR Card: Rs. ${cardTotals.lkr.toFixed(2)}
// USD Card: $${cardTotals.usd.toFixed(2)}
// Euro Card: €${cardTotals.euro.toFixed(2)}

// --- REVENUE TOTALS ---
// LKR Revenue: Rs. ${revenueTotals.lkr.toFixed(2)}
// USD Revenue: $${revenueTotals.usd.toFixed(2)}
// Euro Revenue: €${revenueTotals.euro.toFixed(2)}

// ================================================
//                EXPENSES SUMMARY
// ================================================

// Total Expenses: ${sessionExpenses.length}
// Total Amount: Rs. ${totalExpenses.toFixed(2)}

// ${sessionExpenses.map(expense => `${format(expense.date, 'dd/MM HH:mm')} - ${expense.categoryName}
//   ${expense.details}
//   Amount: Rs. ${expense.amount.toFixed(2)}`).join('\n\n')}

// ================================================
//               FINANCIAL SUMMARY
// ================================================

// ${session.startingAmount ? `Starting Amount: Rs. ${session.startingAmount.toFixed(2)}` : 'Starting Amount: Not recorded'}
// Gross Revenue (LKR): Rs. ${revenueTotals.lkr.toFixed(2)}
// Total Expenses: Rs. ${totalExpenses.toFixed(2)}
// Net Revenue (LKR): Rs. ${netRevenueLKR.toFixed(2)}
// Net Cash (LKR): Rs. ${netCashLKR.toFixed(2)}

// --- CASH RECONCILIATION ---
// ${session.startingAmount ? `Expected Cash: Rs. ${expectedCash.toFixed(2)}` : 'Expected Cash: Cannot calculate'}
// ${session.endingAmount ? `Actual Cash: Rs. ${session.endingAmount.toFixed(2)}` : 'Actual Cash: Not recorded'}
// ${session.endingAmount && session.startingAmount ? `Difference: Rs. ${(session.endingAmount - expectedCash).toFixed(2)}` : 'Difference: Cannot calculate'}

// ================================================
//          Printed: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
// ================================================
//     `;

//     // Print the receipt
//     if (window.electronAPI) {
//       await window.electronAPI.printText(receiptContent);
//       console.log('Receipt sent to printer via Electron');
//     } else {
//       // Web fallback
//       const printWindow = window.open('', '_blank');
//       if (printWindow) {
//         printWindow.document.write(`<pre style="font-family: monospace; font-size: 12px; white-space: pre-wrap;">${receiptContent}</pre>`);
//         printWindow.document.close();
//         printWindow.print();
//       }
//     }
//   } catch (error) {
//     console.error('Error printing cashier session report:', error);
//     throw error;
//   }
// },

// Updated helper method to format payment breakdown as text

// async printCashierSessionReportWithExpenses(
//   session: CashierSession,
//   sales: any[],
//   expenses: any[],
//   sessionTotals: any
// ): Promise<boolean> {
//   try {
//     // Create a new window for printing
//     const printWindow = window.open('', '_blank');
//     if (!printWindow) {
//       throw new Error('Unable to open print window');
//     }

//     // Format date
//     const startDate = format(session.startDate, 'PPP p');
//     const endDate = session.endDate ? format(session.endDate, 'PPP p') : 'Active';
    
//     // Starting amounts
//     const startingAmountsLKR = session.startingAmounts?.lkr || 0;
//     const startingAmountsUSD = session.startingAmounts?.usd || 0;
//     const startingAmountsEURO = session.startingAmounts?.euro || 0;
    
//     // Ending amounts
//     const endingAmountsLKR = session.endingAmounts?.lkr || 0;
//     const endingAmountsUSD = session.endingAmounts?.usd || 0;
//     const endingAmountsEURO = session.endingAmounts?.euro || 0;
    
//     // Local sales summary
//     const localSales = sales.filter(sale => sale.patientType === 'local');
//     const localTotal = localSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
//     // Foreign sales summary
//     const foreignSales = sales.filter(sale => sale.patientType === 'foreign');
//     const foreignTotalUSD = foreignSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
//     const foreignTotalLKR = foreignSales.reduce((sum, sale) => sum + (sale.grandTotalLKR || 0), 0);
    
//     // Expenses summary
//     const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
//     // Prepare the HTML content for the receipt
//     const receiptContent = `
//       <div style="font-family: 'Courier New', monospace; font-size: 12px; width: 80mm;">
//         <div style="text-align: center; margin-bottom: 10px;">
//           <h2 style="margin: 0;">CLINIC NAME</h2>
//           <p style="margin: 2px 0;">123 Clinic Address, City</p>
//           <p style="margin: 2px 0;">Tel: 123-456-7890</p>
//         </div>
        
//         <div style="text-align: center; margin-bottom: 10px;">
//           <h3 style="margin: 0;">CASHIER SESSION REPORT</h3>
//         </div>
        
//         <div style="margin-bottom: 15px;">
//           <p style="margin: 2px 0;"><b>Cashier:</b> ${session.userName}</p>
//           <p style="margin: 2px 0;"><b>Start:</b> ${startDate}</p>
//           <p style="margin: 2px 0;"><b>End:</b> ${endDate}</p>
//           <p style="margin: 2px 0;"><b>Duration:</b> ${
//             session.endDate 
//             ? this.formatDuration(new Date(session.endDate).getTime() - session.startDate.getTime()) 
//             : 'Active'
//           }</p>
//         </div>
        
//         <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">STARTING AMOUNTS</h4>
//           <p style="margin: 2px 0;"><b>LKR:</b> Rs. ${startingAmountsLKR.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>USD:</b> $ ${startingAmountsUSD.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>EURO:</b> € ${startingAmountsEURO.toFixed(2)}</p>
//         </div>
        
//         <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">SALES SUMMARY</h4>
//           <p style="margin: 2px 0;"><b>Total Sales:</b> ${sales.length}</p>
//           <p style="margin: 2px 0;"><b>Local (LKR):</b> Rs. ${localTotal.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>Foreign (USD):</b> $ ${foreignTotalUSD.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>Foreign (LKR):</b> Rs. ${foreignTotalLKR.toFixed(2)}</p>
//         </div>
        
//         <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">CASH SUMMARY (AFTER SALES)</h4>
//           <p style="margin: 2px 0;"><b>LKR Cash:</b> Rs. ${sessionTotals.cash.lkr.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>USD Cash:</b> $ ${sessionTotals.cash.usd.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>EURO Cash:</b> € ${sessionTotals.cash.euro.toFixed(2)}</p>
//         </div>
        
//         <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">CARD PAYMENTS</h4>
//           <p style="margin: 2px 0;"><b>LKR Card:</b> Rs. ${sessionTotals.card.lkr.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>USD Card:</b> $ ${sessionTotals.card.usd.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>EURO Card:</b> € ${sessionTotals.card.euro.toFixed(2)}</p>
//         </div>
        
//          <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">EXPENSES SUMMARY</h4>
//           <p style="margin: 2px 0;"><b>Total Expenses:</b> ${expenses.length}</p>
//           <p style="margin: 2px 0;"><b>Total Amount:</b> Rs. ${expensesTotal.toFixed(2)}</p>
//         </div>
        
//         <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">EXPECTED CASH (START + SALES - EXPENSES)</h4>
//           <p style="margin: 2px 0;"><b>LKR Expected:</b> Rs. ${sessionTotals.expectedCash.lkr.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>USD Expected:</b> $ ${sessionTotals.expectedCash.usd.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>EURO Expected:</b> € ${sessionTotals.expectedCash.euro.toFixed(2)}</p>
//         </div>
        
//         ${session.endDate ? `
//         <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">ENDING AMOUNTS</h4>
//           <p style="margin: 2px 0;"><b>LKR Ending:</b> Rs. ${endingAmountsLKR.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>USD Ending:</b> $ ${endingAmountsUSD.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>EURO Ending:</b> € ${endingAmountsEURO.toFixed(2)}</p>
//         </div>
        
//         <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">CASH DIFFERENCE</h4>
//           <p style="margin: 2px 0;"><b>LKR Difference:</b> Rs. ${(endingAmountsLKR - sessionTotals.expectedCash.lkr).toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>USD Difference:</b> $ ${(endingAmountsUSD - sessionTotals.expectedCash.usd).toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>EURO Difference:</b> € ${(endingAmountsEURO - sessionTotals.expectedCash.euro).toFixed(2)}</p>
//         </div>
//         ` : ''}
        
//         <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">GRAND TOTAL</h4>
//           <p style="margin: 2px 0;"><b>Total Revenue (LKR):</b> Rs. ${(localTotal + foreignTotalLKR).toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>Total Revenue (USD):</b> $ ${foreignTotalUSD.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>Total Expenses:</b> Rs. ${expensesTotal.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>Net Revenue:</b> Rs. ${(localTotal + foreignTotalLKR - expensesTotal).toFixed(2)}</p>
//         </div>
        
//         <div style="border-top: 1px dashed #000; padding-top: 10px; text-align: center;">
//           <p style="margin: 5px 0;">*** END OF REPORT ***</p>
//           <p style="margin: 5px 0;">Printed: ${format(new Date(), 'PPP p')}</p>
//         </div>
//       </div>
//     `;
    
//     // Write the content to the print window
//     printWindow.document.write(`
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <title>Cashier Session Report</title>
//           <style>
//             body { margin: 0; padding: 10px; font-family: monospace; }
//             @media print {
//               body { margin: 0; padding: 0; }
//             }
//           </style>
//         </head>
//         <body>
//           ${receiptContent}
//         </body>
//       </html>
//     `);
    
//     // Close the document and trigger print
//     printWindow.document.close();
//     printWindow.print();
    
//     return true;
//   } catch (error) {
//     console.error('Error printing cashier session report:', error);
//     return false;
//   }
// },

// async printCashierSessionReportWithExpenses(
//   session: CashierSession,
//   sales: any[],
//   expenses: any[],
//   sessionTotals: any
// ): Promise<boolean> {
//   try {
//     // Create a new window for printing
//     const printWindow = window.open('', '_blank');
//     if (!printWindow) {
//       throw new Error('Unable to open print window');
//     }

//     // Format date
//     const startDate = format(session.startDate, 'PPP p');
//     const endDate = session.endDate ? format(session.endDate, 'PPP p') : 'Active';
    
//     // Starting amounts
//     const startingAmountsLKR = session.startingAmounts?.lkr || 0;
//     const startingAmountsUSD = session.startingAmounts?.usd || 0;
//     const startingAmountsEURO = session.startingAmounts?.euro || 0;
    
//     // Ending amounts
//     const endingAmountsLKR = session.endingAmounts?.lkr || 0;
//     const endingAmountsUSD = session.endingAmounts?.usd || 0;
//     const endingAmountsEURO = session.endingAmounts?.euro || 0;
    
//     // Local sales summary
//     const localSales = sales.filter(sale => sale.patientType === 'local');
//     const localTotal = localSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
//     // Foreign sales summary
//     const foreignSales = sales.filter(sale => sale.patientType === 'foreign');
//     const foreignTotalUSD = foreignSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
//     const foreignTotalLKR = foreignSales.reduce((sum, sale) => sum + (sale.grandTotalLKR || 0), 0);
    
//     // Expenses summary
//     const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
//     // NEW: Get appointment data from session
//     const appointmentCount = session.appointmentCount || 0;
//     const totalDoctorFees = session.totalDoctorFees || 0;
    
//     // NEW: Separate doctor fees expenses from other expenses
//     const doctorFeesExpenses = expenses.filter(expense => 
//       expense.categoryName === 'Doctor Fees' || 
//       expense.categoryName?.toLowerCase().includes('doctor')
//     );
//     const otherExpenses = expenses.filter(expense => 
//       expense.categoryName !== 'Doctor Fees' && 
//       !expense.categoryName?.toLowerCase().includes('doctor')
//     );
    
//     const doctorFeesExpensesTotal = doctorFeesExpenses.reduce((sum, expense) => sum + expense.amount, 0);
//     const otherExpensesTotal = otherExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
//     // Prepare the HTML content for the receipt
//     const receiptContent = `
//       <div style="font-family: 'Courier New', monospace; font-size: 12px; width: 80mm;">
//         <div style="text-align: center; margin-bottom: 10px;">
//           <h2 style="margin: 0;">Niven Medicals</h2>
//           <p style="margin: 2px 0;">Dr. Prabath Abaywardane</p>
//           <p style="margin: 2px 0;">Tel: [Your Contact Number]</p>
//         </div>
        
//         <div style="text-align: center; margin-bottom: 10px;">
//           <h3 style="margin: 0;">CASHIER SESSION REPORT</h3>
//         </div>
        
//         <div style="margin-bottom: 15px;">
//           <p style="margin: 2px 0;"><b>Cashier:</b> ${session.userName}</p>
//           <p style="margin: 2px 0;"><b>Start:</b> ${startDate}</p>
//           <p style="margin: 2px 0;"><b>End:</b> ${endDate}</p>
//           <p style="margin: 2px 0;"><b>Duration:</b> ${
//             session.endDate 
//             ? this.formatDuration(new Date(session.endDate).getTime() - session.startDate.getTime()) 
//             : 'Active'
//           }</p>
//         </div>
        
//         <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">STARTING AMOUNTS</h4>
//           <p style="margin: 2px 0;"><b>LKR:</b> Rs. ${startingAmountsLKR.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>USD:</b> $ ${startingAmountsUSD.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>EURO:</b> € ${startingAmountsEURO.toFixed(2)}</p>
//         </div>

//         <!-- NEW: APPOINTMENTS SECTION -->
//         <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">APPOINTMENTS SUMMARY</h4>
//           <p style="margin: 2px 0;"><b>Total Appointments:</b> ${appointmentCount}</p>
//           <p style="margin: 2px 0;"><b>Total Doctor Fees:</b> Rs. ${totalDoctorFees.toFixed(2)}</p>
          
//           <!-- Appointment Payment Method Breakdown -->
//           <div style="margin-top: 8px;">
//             <p style="margin: 2px 0; font-weight: bold;">Payment Methods:</p>
//             ${this.generateAppointmentPaymentBreakdown(sessionTotals)}
//           </div>
//         </div>
        
//         <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">SALES SUMMARY (POS)</h4>
//           <p style="margin: 2px 0;"><b>Total Sales:</b> ${sales.length}</p>
//           <p style="margin: 2px 0;"><b>Local (LKR):</b> Rs. ${localTotal.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>Foreign (USD):</b> $ ${foreignTotalUSD.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>Foreign (LKR):</b> Rs. ${foreignTotalLKR.toFixed(2)}</p>
//         </div>
        
//         <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">CASH SUMMARY (AFTER SALES)</h4>
//           <p style="margin: 2px 0;"><b>LKR Cash:</b> Rs. ${sessionTotals.cash.lkr.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>USD Cash:</b> $ ${sessionTotals.cash.usd.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>EURO Cash:</b> € ${sessionTotals.cash.euro.toFixed(2)}</p>
//         </div>
        
//         <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">CARD PAYMENTS</h4>
//           <p style="margin: 2px 0;"><b>LKR Card:</b> Rs. ${sessionTotals.card.lkr.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>USD Card:</b> $ ${sessionTotals.card.usd.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>EURO Card:</b> € ${sessionTotals.card.euro.toFixed(2)}</p>
//         </div>
        
//         <!-- ENHANCED: EXPENSES SECTION WITH BREAKDOWN -->
//         <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">EXPENSES BREAKDOWN</h4>
          
//           <!-- Doctor Fees Expenses -->
//           <div style="margin-bottom: 8px;">
//             <p style="margin: 2px 0; font-weight: bold;">Doctor Fees Expenses:</p>
//             <p style="margin: 2px 0;"><b>Count:</b> ${doctorFeesExpenses.length}</p>
//             <p style="margin: 2px 0;"><b>Amount:</b> Rs. ${doctorFeesExpensesTotal.toFixed(2)}</p>
//             ${doctorFeesExpenses.length > 0 ? `
//               <div style="font-size: 10px; margin-top: 3px;">
//                 ${doctorFeesExpenses.map(expense => `
//                   <p style="margin: 1px 0;">• ${expense.details || 'Doctor Payment'} - Rs. ${expense.amount.toFixed(2)}</p>
//                 `).join('')}
//               </div>
//             ` : ''}
//           </div>
          
//           <!-- Other Expenses -->
//           ${otherExpenses.length > 0 ? `
//           <div style="margin-bottom: 8px;">
//             <p style="margin: 2px 0; font-weight: bold;">Other Expenses:</p>
//             <p style="margin: 2px 0;"><b>Count:</b> ${otherExpenses.length}</p>
//             <p style="margin: 2px 0;"><b>Amount:</b> Rs. ${otherExpensesTotal.toFixed(2)}</p>
//             <div style="font-size: 10px; margin-top: 3px;">
//               ${otherExpenses.map(expense => `
//                 <p style="margin: 1px 0;">• ${expense.categoryName}: ${expense.details} - Rs. ${expense.amount.toFixed(2)}</p>
//               `).join('')}
//             </div>
//           </div>
//           ` : ''}
          
//           <p style="margin: 2px 0; font-weight: bold; border-top: 1px solid #000; padding-top: 3px;">
//             <b>Total Expenses:</b> Rs. ${expensesTotal.toFixed(2)}
//           </p>
//         </div>
        
//         <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">EXPECTED CASH (START + SALES - EXPENSES)</h4>
//           <p style="margin: 2px 0;"><b>LKR Expected:</b> Rs. ${sessionTotals.expectedCash.lkr.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>USD Expected:</b> $ ${sessionTotals.expectedCash.usd.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>EURO Expected:</b> € ${sessionTotals.expectedCash.euro.toFixed(2)}</p>
//         </div>
        
//         ${session.endDate ? `
//         <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">ENDING AMOUNTS</h4>
//           <p style="margin: 2px 0;"><b>LKR Ending:</b> Rs. ${endingAmountsLKR.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>USD Ending:</b> $ ${endingAmountsUSD.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>EURO Ending:</b> € ${endingAmountsEURO.toFixed(2)}</p>
//         </div>
        
//         <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">CASH DIFFERENCE</h4>
//           <p style="margin: 2px 0;"><b>LKR Difference:</b> Rs. ${(endingAmountsLKR - sessionTotals.expectedCash.lkr).toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>USD Difference:</b> $ ${(endingAmountsUSD - sessionTotals.expectedCash.usd).toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>EURO Difference:</b> € ${(endingAmountsEURO - sessionTotals.expectedCash.euro).toFixed(2)}</p>
//         </div>
//         ` : ''}
        
//         <!-- ENHANCED: GRAND TOTAL WITH APPOINTMENTS -->
//         <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
//           <h4 style="margin: 0 0 5px 0;">GRAND TOTAL</h4>
//           <p style="margin: 2px 0;"><b>POS Revenue (LKR):</b> Rs. ${(localTotal + foreignTotalLKR).toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>POS Revenue (USD):</b> $ ${foreignTotalUSD.toFixed(2)}</p>
//           <p style="margin: 2px 0;"><b>Appointments Revenue:</b> Rs. ${totalDoctorFees.toFixed(2)}</p>
//           <p style="margin: 2px 0; border-top: 1px solid #000; padding-top: 3px;">
//             <b>Total Revenue:</b> Rs. ${(localTotal + foreignTotalLKR + totalDoctorFees).toFixed(2)}
//           </p>
//           <p style="margin: 2px 0;"><b>Total Expenses:</b> Rs. ${expensesTotal.toFixed(2)}</p>
//           <p style="margin: 2px 0; font-weight: bold; border-top: 1px solid #000; padding-top: 3px;">
//             <b>Net Revenue:</b> Rs. ${(localTotal + foreignTotalLKR + totalDoctorFees - expensesTotal).toFixed(2)}
//           </p>
//         </div>
        
//         <div style="border-top: 1px dashed #000; padding-top: 10px; text-align: center;">
//           <p style="margin: 5px 0;">*** END OF REPORT ***</p>
//           <p style="margin: 5px 0;">Printed: ${format(new Date(), 'PPP p')}</p>
//           <p style="margin: 5px 0; font-size: 10px;">WebVizard Software Solutions - 0712654267</p>
//         </div>
//       </div>
//     `;
    
//     // Write the content to the print window
//     printWindow.document.write(`
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <title>Cashier Session Report</title>
//           <style>
//             body { margin: 0; padding: 10px; font-family: monospace; }
//             @media print {
//               body { margin: 0; padding: 0; }
//             }
//           </style>
//         </head>
//         <body>
//           ${receiptContent}
//         </body>
//       </html>
//     `);
    
//     // Close the document and trigger print
//     printWindow.document.close();
//     printWindow.print();
    
//     return true;
//   } catch (error) {
//     console.error('Error printing cashier session report:', error);
//     return false;
//   }
// },



async printCashierSessionReportWithExpenses(
  session: CashierSession,
  sales: any[],
  expenses: any[],
  sessionTotals: any
): Promise<boolean> {
  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window');
    }

    // Format date
    const startDate = format(session.startDate, 'PPP p');
    const endDate = session.endDate ? format(session.endDate, 'PPP p') : 'Active';
    
    // Calculate all totals
    const localSales = sales.filter(sale => sale.patientType === 'local');
    const foreignSales = sales.filter(sale => sale.patientType !== 'local');
    
    // POS Sales calculations
    const localTotal = localSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const foreignTotalUSD = foreignSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const foreignTotalLKR = foreignSales.reduce((sum, sale) => sum + (sale.grandTotalLKR || 0), 0);
    
    // POS Payment method breakdown
    const posCashSales = sales.filter(sale => sale.paymentMethod === 'cash');
    const posCardSales = sales.filter(sale => sale.paymentMethod === 'card');
    const posCashTotal = posCashSales.reduce((sum, sale) => sum + (sale.patientType === 'local' ? sale.totalAmount : sale.grandTotalLKR || 0), 0);
    const posCardTotal = posCardSales.reduce((sum, sale) => sum + (sale.patientType === 'local' ? sale.totalAmount : sale.grandTotalLKR || 0), 0);
    
    // Appointment calculations
    const appointmentCount = sessionTotals.appointments?.count || 0;
    const totalDoctorFees = sessionTotals.appointments?.totalFees || 0;
    const appointmentCashPayments = sessionTotals.appointments?.cashPayments || 0;
    const appointmentCardPayments = sessionTotals.appointments?.cardPayments || 0;
    const paidAppointments = sessionTotals.appointments?.paidAppointments || 0;
    
    // Total cash and card (POS + Appointments)
    const totalCashSales = posCashTotal + appointmentCashPayments;
    const totalCardSales = posCardTotal + appointmentCardPayments;
    
    // Starting amounts
    const startingAmountsLKR = session.startingAmounts?.lkr || 0;
    
    // Expenses
    const expensesTotal = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
    // Expected cash calculation
    const expectedCash = startingAmountsLKR + totalCashSales - expensesTotal;
    
    // Final cash calculation (after deducting expenses)
    const finalCash = expectedCash;
    
    // Total revenue (POS + Appointments)
    const totalRevenue = localTotal + foreignTotalLKR + totalDoctorFees;
    
    // Net revenue (Total Revenue - Expenses)
    const netRevenue = totalRevenue - expensesTotal;

    const receiptContent = `
      <div style="width: 300px; font-family: monospace; font-size: 12px; line-height: 1.4;">
        <div style="text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px;">
          <h3 style="margin: 0; font-size: 16px;">CASHIER SESSION REPORT</h3>
          <p style="margin: 5px 0; font-size: 10px;">WebVizard Software Solutions</p>
          <p style="margin: 2px 0; font-size: 10px;">Session ID: ${session.id}</p>
          <p style="margin: 2px 0; font-size: 10px;">Cashier: ${session.userName}</p>
          <p style="margin: 2px 0; font-size: 10px;">Start: ${startDate}</p>
          <p style="margin: 2px 0; font-size: 10px;">End: ${endDate}</p>
        </div>
        
        <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
          <h4 style="margin: 0 0 5px 0;">STARTING AMOUNT</h4>
          <p style="margin: 2px 0;"><b>Starting Cash:</b> Rs. ${startingAmountsLKR.toFixed(2)}</p>
        </div>
        
        <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
          <h4 style="margin: 0 0 5px 0;">POS SALES SUMMARY</h4>
          <p style="margin: 2px 0;"><b>Total POS Sales:</b> ${sales.length}</p>
          <p style="margin: 2px 0;"><b>Local Sales:</b> Rs. ${localTotal.toFixed(2)}</p>
          <p style="margin: 2px 0; border-top: 1px solid #000; padding-top: 3px;">
            <b>Total POS Revenue:</b> Rs. ${(localTotal + foreignTotalLKR).toFixed(2)}
          </p>
          
          <div style="margin-top: 8px;">
            <p style="margin: 2px 0; font-weight: bold;">POS Payment Methods:</p>
            <p style="margin: 2px 0; font-size: 11px;">• Cash Sales: Rs. ${posCashTotal.toFixed(2)}</p>
            <p style="margin: 2px 0; font-size: 11px;">• Card Sales: Rs. ${posCardTotal.toFixed(2)}</p>
          </div>
        </div>
        
        <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
          <h4 style="margin: 0 0 5px 0;">APPOINTMENTS SUMMARY</h4>
          <p style="margin: 2px 0;"><b>Total Appointments:</b> ${appointmentCount}</p>
          <p style="margin: 2px 0;"><b>Paid Appointments:</b> ${paidAppointments}</p>
          <p style="margin: 2px 0;"><b>Total Doctor Fees:</b> Rs. ${totalDoctorFees.toFixed(2)}</p>
          
          <div style="margin-top: 8px;">
            <p style="margin: 2px 0; font-weight: bold;">Appointment Payment Methods:</p>
            <p style="margin: 2px 0; font-size: 11px;">• Cash Payments: Rs. ${appointmentCashPayments.toFixed(2)}</p>
            <p style="margin: 2px 0; font-size: 11px;">• Card Payments: Rs. ${appointmentCardPayments.toFixed(2)}</p>
          </div>
          
          ${paidAppointments > 0 ? `
          <div style="margin-top: 8px; border-top: 1px dotted #000; padding-top: 5px;">
            <p style="margin: 2px 0; font-weight: bold; font-size: 10px;">PAID DOCTOR FEES DETAILS:</p>
            ${expenses.filter(exp => exp.type === 'doctor_fee').map(exp => 
              `<p style="margin: 1px 0; font-size: 10px;">• ${exp.description}: Rs. ${exp.amount.toFixed(2)}</p>`
            ).join('')}
          </div>
          ` : ''}
        </div>
        
        <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
          <h4 style="margin: 0 0 5px 0;">COMBINED TOTALS</h4>
          <p style="margin: 2px 0;"><b>Total Cash Sales:</b> Rs. ${totalCashSales.toFixed(2)}</p>
          <p style="margin: 2px 0;"><b>Total Card Sales:</b> Rs. ${totalCardSales.toFixed(2)}</p>
          <p style="margin: 2px 0; border-top: 1px solid #000; padding-top: 3px;">
            <b>Total Revenue:</b> Rs. ${totalRevenue.toFixed(2)}
          </p>
        </div>
        
        <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
          <h4 style="margin: 0 0 5px 0;">EXPENSES</h4>
          <p style="margin: 2px 0;"><b>Total Expenses:</b> ${expenses.length}</p>
          <p style="margin: 2px 0;"><b>Total Amount:</b> Rs. ${expensesTotal.toFixed(2)}</p>
          
          ${expenses.length > 0 ? `
          <div style="margin-top: 8px; border-top: 1px dotted #000; padding-top: 5px;">
            <p style="margin: 2px 0; font-weight: bold; font-size: 10px;">EXPENSE DETAILS:</p>
            ${expenses.map(exp => 
              `<p style="margin: 1px 0; font-size: 10px;">• ${exp.description}: Rs. ${exp.amount.toFixed(2)}</p>`
            ).join('')}
          </div>
          ` : ''}
        </div>
        
        <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
          <h4 style="margin: 0 0 5px 0;">CASH RECONCILIATION</h4>
          <p style="margin: 2px 0;"><b>Starting Cash:</b> Rs. ${startingAmountsLKR.toFixed(2)}</p>
          <p style="margin: 2px 0;"><b>Cash Sales:</b> Rs. ${totalCashSales.toFixed(2)}</p>
          <p style="margin: 2px 0;"><b>Less: Expenses:</b> Rs. ${expensesTotal.toFixed(2)}</p>
          <p style="margin: 2px 0; border-top: 1px solid #000; padding-top: 3px;">
            <b>Expected Cash:</b> Rs. ${expectedCash.toFixed(2)}
          </p>
          <p style="margin: 2px 0; border-top: 1px solid #000; padding-top: 3px;">
            <b>Final Cash Total:</b> Rs. ${finalCash.toFixed(2)}
          </p>
          
          ${session.endingAmounts ? `
          <p style="margin: 2px 0;"><b>Actual Cash:</b> Rs. ${session.endingAmounts.lkr.toFixed(2)}</p>
          <p style="margin: 2px 0;"><b>Difference:</b> Rs. ${(session.endingAmounts.lkr - expectedCash).toFixed(2)}</p>
          ` : ''}
        </div>
        
        <div style="border-top: 1px dashed #000; padding-top: 10px; margin-bottom: 15px;">
          <h4 style="margin: 0 0 5px 0;">NET TOTALS</h4>
          <p style="margin: 2px 0;"><b>Total Revenue:</b> Rs. ${totalRevenue.toFixed(2)}</p>
          <p style="margin: 2px 0;"><b>Total Expenses:</b> Rs. ${expensesTotal.toFixed(2)}</p>
          <p style="margin: 2px 0; font-weight: bold; border-top: 1px solid #000; padding-top: 3px;">
            <b>Net Revenue:</b> Rs. ${netRevenue.toFixed(2)}
          </p>
        </div>
        
        <div style="border-top: 1px dashed #000; padding-top: 10px; text-align: center;">
          <p style="margin: 5px 0;">*** END OF SESSION ***</p>
          <p style="margin: 5px 0;">Printed: ${format(new Date(), 'PPP p')}</p>
          <p style="margin: 5px 0; font-size: 10px;">WebVizard Software Solutions - 0712654267</p>
        </div>
      </div>
    `;
    
    // Write the content to the print window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cashier Session Report</title>
          <style>
            body { margin: 0; padding: 10px; font-family: monospace; }
            @media print {
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          ${receiptContent}
        </body>
      </html>
    `);
    
    // Close the document and trigger print
    printWindow.document.close();
    printWindow.print();
    
    return true;
  } catch (error) {
    console.error('Error printing cashier session report:', error);
    return false;
  }
},


// NEW: Helper method to generate appointment payment breakdown
generateAppointmentPaymentBreakdown(sessionTotals: any): string {
  // Calculate appointment cash vs card payments
  // This assumes that appointments are mostly cash payments unless specifically card
  const appointmentCashPayments = sessionTotals.cash?.appointments || 0;
  const appointmentCardPayments = sessionTotals.card?.appointments || 0;
  
  // For now, we'll show a simple breakdown
  // You can enhance this based on your appointment payment tracking
  return `
    <p style="margin: 2px 0; font-size: 11px;">• Cash Payments: Rs. ${appointmentCashPayments.toFixed(2)}</p>
    <p style="margin: 2px 0; font-size: 11px;">• Card Payments: Rs. ${appointmentCardPayments.toFixed(2)}</p>
    <p style="margin: 2px 0; font-size: 11px;">• Total: Rs. ${(appointmentCashPayments + appointmentCardPayments).toFixed(2)}</p>
  `;
},

// Helper method to format duration
formatDuration(durationMs: number): string {
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
},

formatPaymentBreakdownText(breakdown: any): string {
  let text = '';
  
  Object.entries(breakdown).forEach(([method, data]: [string, any]) => {
    const methodName = this.formatPaymentMethod(method);
    text += `--- ${methodName.toUpperCase()} ---\n`;
    
    if (data.local.count > 0) {
      text += `Local: ${data.local.count} transactions\n`;
      text += `  Amount: Rs. ${data.local.amount.toFixed(2)}\n`;
    }
    
    if (data.foreign.count > 0) {
      text += `Foreign: ${data.foreign.count} transactions\n`;
      text += `  USD: $${data.foreign.amountUSD.toFixed(2)}\n`;
      text += `  LKR: Rs. ${data.foreign.amountLKR.toFixed(2)}\n`;
    }
    
    text += '\n';
  });
  
  return text;
},

// Keep the existing helper methods
formatPaymentBreakdown(breakdown: any): string[] {
  const lines: string[] = [];
  
  Object.entries(breakdown).forEach(([method, data]: [string, any]) => {
    const methodName = this.formatPaymentMethod(method);
    lines.push(`--- ${methodName.toUpperCase()} ---`);
    
    if (data.local.count > 0) {
      lines.push(`Local: ${data.local.count} transactions`);
      lines.push(`  Amount: Rs. ${data.local.amount.toFixed(2)}`);
    }
    
    if (data.foreign.count > 0) {
      lines.push(`Foreign: ${data.foreign.count} transactions`);
      lines.push(`  USD: $${data.foreign.amountUSD.toFixed(2)}`);
      lines.push(`  LKR: Rs. ${data.foreign.amountLKR.toFixed(2)}`);
    }
    
    lines.push('');
  });
  
  return lines;
},

formatPaymentMethod(method: string): string {
  switch (method) {
    case 'cash': return 'Cash';
    case 'card': return 'Card';
    case 'bank_deposit': return 'Bank Transfer';
    case 'credit': return 'Credit';
    default: return method;
  }
},

calculateSessionDuration(session: any): string {
  const start = session.startDate;
  const end = session.endDate || new Date();
  const diffMs = end.getTime() - start.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${diffHours}h ${diffMinutes}m`;
},



calculatePaymentBreakdown(sessionSales: any[]) {
  return sessionSales.reduce((acc, sale) => {
    const method = sale.paymentMethod;
    const patientType = sale.patientType;
    
    if (!acc[method]) {
      acc[method] = { 
        local: { count: 0, amount: 0 }, 
        foreign: { count: 0, amountUSD: 0, amountLKR: 0 } 
      };
    }
    
    if (patientType === 'local') {
      acc[method].local.count++;
      acc[method].local.amount += sale.totalAmount;
    } else {
      acc[method].foreign.count++;
      acc[method].foreign.amountUSD += sale.totalAmount;
      acc[method].foreign.amountLKR += sale.grandTotalLKR || 0;
    }
    
    return acc;
  }, {});
},

generateReceiptContent(sale: Sale): string {
  // Check if sale has items (pharmacy sale) or medical services
  const hasPharmacyItems = sale.items && sale.items.length > 0;
  const hasMedicalServices = (sale.procedures && sale.procedures.length > 0) || 
                            (sale.labTests && sale.labTests.length > 0) || 
                            (sale.opdCharges && sale.opdCharges > 0);

  console.log("Sale structure:", {
    hasPharmacyItems,
    hasMedicalServices,
    patientType: sale.patientType,
    itemsCount: sale.items?.length || 0,
    proceduresCount: sale.procedures?.length || 0,
    labTestsCount: sale.labTests?.length || 0,
    opdCharges: sale.opdCharges || 0
  });

  // If this is a medical sale without pharmacy items, create a receipt for medical services
  if (!hasPharmacyItems && hasMedicalServices) {
    return this.generateMedicalServiceReceiptContent(sale);
  }

  // If this is a pharmacy sale but items is still undefined, return an error receipt
  if (!sale.items) {
    console.error("Sale items is undefined for a pharmacy sale");
    return this.generateErrorReceiptContent(sale);
  }

  // Format the date and time
  const dateFormatted = format(sale.saleDate, 'dd/MM/yyyy');
  const timeFormatted = format(sale.saleDate, 'hh:mm:ss a');
  
  // Calculate all the totals including discounts
  const subtotal = sale.items.reduce((sum, item) => sum + this.getOriginalPrice(item), 0);
  const cartDiscount = sale.totalDiscount || 0;
  const itemDiscountTotal = sale.items.reduce((sum, item) => sum + (item.itemDiscount || 0), 0);
  const loyaltyPointsDiscount = sale.loyaltyPointsUsed || 0;

  // Get staff name from the sale's createdBy field
  const staffName = sale.createdBy?.displayName || 'Unknown';
    
  // Generate HTML for receipt header
  const header = `
  <div class="receipt-footer">
    <div style="font-size: 20px; font-weight: bold; font-family: 'Arial Unicode MS', Arial, sans-serif;">Niven Medicals</div>
    <div style="font-size: 16px;">Dr. Prabath Abaywardane</div>
    <div style="font-size: 16px;">[Your Contact Number]</div>
  </div>
`;

  // Extract customer name from either customer object or customerInfo
  let customerName = null;
  if (sale.customer && sale.customer.name) {
    customerName = sale.customer.name;
  } else if (sale.customerInfo && sale.customerInfo.name) {
    customerName = sale.customerInfo.name;
  }
  
  // Generate sale info section
  const saleInfo = `
    <div class="receipt-info">
      <div>Receipt #: ${sale.id?.slice(-6).toUpperCase() || 'N/A'}</div>
      <div>Date: ${dateFormatted}</div>
      <div>Time: ${timeFormatted}</div>
      ${customerName ? `<div>Customer: ${customerName}</div>` : ''}
      ${sale.customer?.mobile ? `<div>Phone: ${sale.customer.mobile}</div>` : ''}
      <div>${staffName}</div>
    </div>
  `;
  
  // Generate items table
  const itemsTable = `
    <table class="receipt-items">
      <thead>
        <tr>
          <th width="45%">Item</th>
          <th width="15%" class="qty">Qty</th>
          <th width="40%" class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${sale.items.map(item => this.formatReceiptItem(item)).join('')}
      </tbody>
    </table>
  `;
  
  // Generate totals section
  const totals = `
    <table class="receipt-totals">
      <tr>
        <td class="label">Subtotal:</td>
        <td class="amount">Rs${subtotal.toFixed(2)}</td>
      </tr>
      ${itemDiscountTotal > 0 ? `
        <tr>
          <td class="label">Item Discounts:</td>
          <td class="amount">-Rs${itemDiscountTotal.toFixed(2)}</td>
        </tr>
      ` : ''}
      ${cartDiscount > 0 ? `
        <tr>
          <td class="label">Cart Discount${sale.discountPercentage ? ` (${sale.discountPercentage}%)` : ''}:</td>
          <td class="amount">-Rs${cartDiscount.toFixed(2)}</td>
        </tr>
      ` : ''}
      ${loyaltyPointsDiscount > 0 ? `
        <tr>
          <td class="label">Loyalty Points:</td>
          <td class="amount">-Rs${loyaltyPointsDiscount.toFixed(2)}</td>
        </tr>
      ` : ''}
      <tr>
        <td class="label">Total:</td>
        <td class="amount">Rs${sale.totalAmount.toFixed(2)}</td>
      </tr>
      ${sale.paymentMethod === 'credit' ? `
        <tr>
          <td class="label">Initial Payment:</td>
          <td class="amount">Rs${(sale.initialPayment || 0).toFixed(2)}</td>
        </tr>
        <tr>
          <td class="label">Balance Due:</td>
          <td class="amount">Rs${(sale.dueAmount || 0).toFixed(2)}</td>
        </tr>` : ''}
    </table>
  `;

  // Generate footer
  const footer = `
    <div class="receipt-footer">
      <div>Thank you for your purchase!</div>
      <div>WebVizard Software Solutions - 0712654267</div>
    </div>
  `;
  
  // Combine all sections
  return `
    ${header}
    ${saleInfo}
    ${itemsTable}
    ${totals}
    ${footer}
  `;
},

generateMedicalServiceReceiptContent(sale: Sale): string {
  const dateFormatted = format(sale.saleDate, 'dd/MM/yyyy');
  const timeFormatted = format(sale.saleDate, 'hh:mm:ss a');
  const staffName = sale.createdBy?.displayName || 'Unknown';
  
  // Extract customer name
  let customerName = null;
  if (sale.customer && sale.customer.name) {
    customerName = sale.customer.name;
  } else if (sale.customerInfo && sale.customerInfo.name) {
    customerName = sale.customerInfo.name;
  }

  // Generate header
  const header = `
  <div class="receipt-footer">
    <div style="font-size: 20px; font-weight: bold; font-family: 'Arial Unicode MS', Arial, sans-serif;">Niven Medicals</div>
    <div style="font-size: 16px;">Dr. Prabath Abaywardane</div>
    <div style="font-size: 16px;">[Your Contact Number]</div>
  </div>
`;

  // Generate sale info
  const saleInfo = `
    <div class="receipt-info">
      <div>Receipt #: ${sale.id?.slice(-6).toUpperCase() || 'N/A'}</div>
      <div>Date: ${dateFormatted}</div>
      <div>Time: ${timeFormatted}</div>
      <div>Patient Type: ${sale.patientType === 'local' ? 'Local' : 'Foreign'}</div>
      ${customerName ? `<div>Patient: ${customerName}</div>` : ''}
      ${(sale.customer?.mobile || sale.customerInfo?.mobile) ? `<div>Phone: ${sale.customer?.mobile || sale.customerInfo?.mobile}</div>` : ''}
      <div>Staff: ${staffName}</div>
    </div>
  `;

  // Generate services table
  let servicesRows = '';
  
  // Add OPD charges if present
  if (sale.opdCharges && sale.opdCharges > 0) {
    const opdAmount = sale.patientType === 'local' ? sale.opdCharges : (sale.opdCharges || 0);
    servicesRows += `
      <tr>
        <td>OPD Consultation</td>
        <td class="qty">1</td>
        <td class="amount">${sale.patientType === 'local' ? 'Rs' : '$'}${opdAmount.toFixed(2)}</td>
      </tr>
    `;
  }

  // Add procedures if present
  if (sale.procedures && sale.procedures.length > 0) {
    sale.procedures.forEach(procedure => {
      const amount = sale.patientType === 'local' ? 
        (procedure.total || procedure.totalLKR || 0) : 
        (procedure.totalUSD || procedure.total || 0);
      servicesRows += `
        <tr>
          <td>${procedure.name}</td>
          <td class="qty">${procedure.quantity || 1}</td>
          <td class="amount">${sale.patientType === 'local' ? 'Rs' : '$'}${amount.toFixed(2)}</td>
        </tr>
      `;
    });
  }

  // Add lab tests if present
  if (sale.labTests && sale.labTests.length > 0) {
    sale.labTests.forEach(test => {
      const amount = sale.patientType === 'local' ? 
        (test.total || test.totalLKR || 0) : 
        (test.totalUSD || test.total || 0);
      servicesRows += `
        <tr>
          <td>${test.name}</td>
          <td class="qty">${test.quantity || 1}</td>
          <td class="amount">${sale.patientType === 'local' ? 'Rs' : '$'}${amount.toFixed(2)}</td>
        </tr>
      `;
    });
  }

  // Add pharmacy items if present
  if (sale.items && sale.items.length > 0) {
    sale.items.forEach(item => {
      servicesRows += `
        <tr>
          <td>${item.item?.name || 'Unknown Item'}</td>
          <td class="qty">${item.unitQuantity || 1}</td>
          <td class="amount">${sale.patientType === 'local' ? 'Rs' : '$'}${item.totalPrice.toFixed(2)}</td>
        </tr>
      `;
    });
  }

  const servicesTable = `
    <table class="receipt-items">
      <thead>
        <tr>
          <th width="45%">Service/Item</th>
          <th width="15%" class="qty">Qty</th>
          <th width="40%" class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${servicesRows}
      </tbody>
    </table>
  `;

  // Calculate totals
  const totalAmount = sale.patientType === 'local' ? 
    sale.totalAmount : 
    sale.totalAmount;
  
  const totalAmountLKR = sale.patientType === 'foreign' && sale.grandTotalLKR ? 
    sale.grandTotalLKR : 
    sale.totalAmount;

  // Generate totals section
  const totals = `
    <table class="receipt-totals">
      <tr>
        <td class="label">Total ${sale.patientType === 'local' ? '(LKR)' : '(USD)'}:</td>
        <td class="amount">${sale.patientType === 'local' ? 'Rs' : '$'}${totalAmount.toFixed(2)}</td>
      </tr>
      ${sale.patientType === 'foreign' && sale.grandTotalLKR ? `
        <tr>
          <td class="label">Total (LKR):</td>
          <td class="amount">Rs${totalAmountLKR.toFixed(2)}</td>
        </tr>
      ` : ''}
    </table>
  `;

  // Generate footer
  const footer = `
    <div class="receipt-footer">
      <div>Thank you for choosing Niven Medicals!</div>
      <div>WebVizard Software Solutions - 0712654267</div>
    </div>
  `;

  return `
    ${header}
    ${saleInfo}
    ${servicesTable}
    ${totals}
    ${footer}
  `;
},

generateErrorReceiptContent(sale: Sale): string {
  const dateFormatted = format(sale.saleDate, 'dd/MM/yyyy');
  const timeFormatted = format(sale.saleDate, 'hh:mm:ss a');

  return `
    <div class="receipt-footer">
      <div style="font-size: 20px; font-weight: bold;">Niven Medicals</div>
      <div style="font-size: 16px;">Dr. Prabath Abaywardane</div>
      <div style="font-size: 16px;">[Your Contact Number]</div>
    </div>
    <div class="receipt-info">
      <div>Receipt #: ${sale.id?.slice(-6).toUpperCase() || 'N/A'}</div>
      <div>Date: ${dateFormatted}</div>
      <div>Time: ${timeFormatted}</div>
      <div style="color: red; font-weight: bold;">ERROR: Unable to load receipt data</div>
      <div>Total: ${sale.patientType === 'local' ? 'Rs' : '$'}${sale.totalAmount.toFixed(2)}</div>
    </div>
    <div class="receipt-footer">
      <div>Please contact support for assistance</div>
    </div>
  `;
},

formatReceiptItem(item: SaleItem): string {
  // Get the original price before item-specific discount
  const originalPrice = this.getOriginalPrice(item);
  
  // Check if this is a secondary inventory item
  const isSecondaryItem = item.isSecondaryItem === true;
  
  // IMPROVED: More robust approach to get the item name with multiple fallbacks
  let itemName = "Unknown Item"; // Default fallback
  
  console.log(`Formatting receipt item (${isSecondaryItem ? 'Secondary' : 'Regular'}):`, 
    JSON.stringify({
      hasItem: !!item.item,
      name: item.item?.name,
      mainName: item.item?.mainItemName,
      secondaryId: item.secondaryItemId
    }, null, 2)
  );
  
  if (item.item) {
    if (isSecondaryItem) {
      // For secondary items, use a cascading approach to find the best name
      if (typeof item.item.mainItemName === 'string' && item.item.mainItemName.trim() !== '') {
        itemName = item.item.mainItemName.trim();
      } else if (typeof item.item.name === 'string' && item.item.name.trim() !== '') {
        itemName = item.item.name.trim();
      } else {
        // If we still don't have a name, make a last attempt from raw data
        itemName = "Secondary Item";
      }
    } else {
      // For regular inventory items
      if (typeof item.item.name === 'string' && item.item.name.trim() !== '') {
        itemName = item.item.name.trim();
      } else {
        itemName = "Regular Item";
      }
    }
  } else if (isSecondaryItem && item.secondaryItemId) {
    // If item object is missing but we know it's a secondary item, indicate that
    itemName = `Secondary Item #${item.secondaryItemId.substring(0, 6)}`;
  }
  
  // Format the quantity display
  let qtyDisplay = '';
  
  if (item.unitQuantity > 0) {
    qtyDisplay = `${item.unitQuantity}`;
  } else if (item.subUnitQuantity > 0) {
    qtyDisplay = `${item.subUnitQuantity}`;
  } else {
    qtyDisplay = "1"; // Fallback to ensure something is displayed
  }
  
  // Check if this item has a discount
  const hasDiscount = item.itemDiscountPercentage && item.itemDiscountPercentage > 0;
  
  // Log the final name that will be displayed on the receipt
  console.log(`Receipt will display item name: "${itemName}"`);
  
  return `
    <tr>
      <td>${itemName}</td>
      <td class="qty">${qtyDisplay}</td>
      <td class="amount">Rs${item.totalPrice.toFixed(2)}</td>
    </tr>
    ${hasDiscount ? `
      <tr>
        <td colspan="3" class="discount">
          ${item.itemDiscountPercentage}% discount applied (-Rs${(originalPrice - item.totalPrice).toFixed(2)})
        </td>
      </tr>
    ` : ''}
  `;
},



  /**
   * Get the original price of an item before any discounts
   * @param item SaleItem
   * @returns Original price
   */
  getOriginalPrice(item: SaleItem): number {
    if (!item.itemDiscountPercentage || item.itemDiscountPercentage <= 0) {
      return item.totalPrice;
    }
    
    // Calculate original price by working backwards from the discounted price
    return item.totalPrice / (1 - (item.itemDiscountPercentage / 100));
  },
  
  /**
   * Format the payment method for display
   * @param method Payment method string
   * @returns Formatted payment method
   */
  // formatPaymentMethod(method: string): string {
  //   switch (method) {
  //     case 'cash': return 'Cash';
  //     case 'card': return 'Card';
  //     case 'bank_deposit': return 'Bank Transfer';
  //     case 'credit': return 'Credit';
  //     default: return method;
  //   }
  // },



  /**
 * Print a cashier session report with all sales details
 * @param session The cashier session
 * @param salesDetails Array of sales details for this session
 */

  async printCashierSessionSummary(session: any, sales: any[], totals: any): Promise<void> {
  const receiptContent = `
    <style>
      .session-summary {
        font-family: 'Courier New', monospace;
        max-width: 80mm;
        margin: 0 auto;
        padding: 20px;
        line-height: 1.4;
      }
      .header {
        text-align: center;
        border-bottom: 2px solid #000;
        padding-bottom: 10px;
        margin-bottom: 15px;
      }
      .section {
        margin-bottom: 15px;
        border-bottom: 1px dashed #ccc;
        padding-bottom: 10px;
      }
      .section-title {
        font-weight: bold;
        margin-bottom: 8px;
        text-transform: uppercase;
      }
      .flex-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 3px;
      }
      .total-row {
        font-weight: bold;
        border-top: 1px solid #000;
        padding-top: 5px;
        margin-top: 5px;
      }
      .grand-total {
        font-size: 1.2em;
        border-top: 2px solid #000;
        border-bottom: 2px solid #000;
        padding: 8px 0;
        margin: 10px 0;
      }
    </style>
    
    <div class="session-summary">
      <div class="header">
        <h2>CASHIER SESSION SUMMARY</h2>
        <div>Cashier: ${session.userName}</div>
        <div>Date: ${format(session.startDate, 'PPP')}</div>
        <div>Time: ${format(session.startDate, 'p')} - ${session.endDate ? format(new Date(session.endDate), 'p') : 'Active'}</div>
      </div>

      <div class="section">
        <div class="section-title">Session Overview</div>
        <div class="flex-row">
          <span>Total Sales:</span>
          <span>${totals.grand.totalSales}</span>
        </div>
        <div class="flex-row">
          <span>Local Patients:</span>
          <span>${totals.local.count}</span>
        </div>
        <div class="flex-row">
          <span>Foreign Patients:</span>
          <span>${totals.foreign.count}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Local Sales (LKR)</div>
        <div class="flex-row">
          <span>OPD Charges:</span>
          <span>Rs. ${totals.local.opdLKR.toFixed(2)}</span>
        </div>
        <div class="flex-row">
          <span>Procedures:</span>
          <span>Rs. ${totals.local.proceduresLKR.toFixed(2)}</span>
        </div>
        <div class="flex-row">
          <span>Lab Tests:</span>
          <span>Rs. ${totals.local.labTestsLKR.toFixed(2)}</span>
        </div>
        <div class="flex-row">
          <span>Pharmacy:</span>
          <span>Rs. ${totals.local.pharmacyLKR.toFixed(2)}</span>
        </div>
        <div class="flex-row total-row">
          <span>Local Total:</span>
          <span>Rs. ${totals.local.totalLKR.toFixed(2)}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Foreign Sales</div>
        <div style="margin-bottom: 10px;">
          <strong>USD Amounts:</strong>
        </div>
        <div class="flex-row">
          <span>OPD Charges:</span>
          <span>$${totals.foreign.opdUSD.toFixed(2)}</span>
        </div>
        <div class="flex-row">
          <span>Procedures:</span>
          <span>$${totals.foreign.proceduresUSD.toFixed(2)}</span>
        </div>
        <div class="flex-row">
          <span>Lab Tests:</span>
          <span>$${totals.foreign.labTestsUSD.toFixed(2)}</span>
        </div>
        <div class="flex-row">
          <span>Pharmacy:</span>
          <span>$${totals.foreign.pharmacyUSD.toFixed(2)}</span>
        </div>
        <div class="flex-row total-row">
          <span>Foreign Total (USD):</span>
          <span>$${totals.foreign.totalUSD.toFixed(2)}</span>
        </div>
        
        <div style="margin: 10px 0;">
          <strong>LKR Equivalent:</strong>
        </div>
        <div class="flex-row total-row">
          <span>Foreign Total (LKR):</span>
          <span>Rs. ${totals.foreign.totalLKR.toFixed(2)}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Payment Methods</div>
        ${Object.entries(sales.reduce((acc, sale) => {
          const method = sale.paymentMethod;
          if (!acc[method]) acc[method] = { count: 0, amount: 0 };
          acc[method].count++;
          acc[method].amount += sale.patientType === 'local' ? sale.totalAmount : (sale.grandTotalLKR || 0);
          return acc;
        }, {})).map(([method, data]: [string, any]) => `
          <div class="flex-row">
          <span>${this.formatPaymentMethod(method)}:</span>
           <span>${data.count} sales • Rs. ${data.amount.toFixed(2)}</span>
         </div>
       `).join('')}
     </div>

     <div class="grand-total">
       <div class="flex-row">
         <span>GRAND TOTAL (LKR):</span>
         <span>Rs. ${totals.grand.totalLKR.toFixed(2)}</span>
       </div>
       <div class="flex-row">
         <span>GRAND TOTAL (USD):</span>
         <span>$${totals.grand.totalUSD.toFixed(2)}</span>
       </div>
     </div>

     <div class="section">
       <div class="section-title">Sales Breakdown</div>
       ${sales.map((sale, index) => `
         <div style="margin-bottom: 8px; font-size: 0.9em;">
           <div class="flex-row">
             <span>#${sale.id.slice(-6).toUpperCase()}</span>
             <span>${sale.patientType === 'local' ? 'Local' : 'Foreign'}</span>
           </div>
           <div class="flex-row">
             <span>${sale.customerInfo?.name || 'No Customer'}</span>
             <span>${sale.patientType === 'local' ? 
               `Rs. ${sale.totalAmount.toFixed(2)}` : 
               `$${sale.totalAmount.toFixed(2)} • Rs. ${(sale.grandTotalLKR || 0).toFixed(2)}`
             }</span>
           </div>
         </div>
       `).join('')}
     </div>

     <div style="text-align: center; margin-top: 20px; font-size: 0.9em;">
       <div>Printed: ${format(new Date(), 'PPp')}</div>
       <div>Thank you for using our POS system</div>
     </div>
   </div>
 `;

 try {
   await this.sendToPrinter(receiptContent);
 } catch (error) {
   console.error('Error printing session summary:', error);
   throw error;
 }
},

formatPaymentMethod(method: string): string {
 switch (method) {
   case 'cash': return 'Cash';
   case 'card': return 'Card';
   case 'bank_deposit': return 'Bank Transfer';
   case 'credit': return 'Credit';
   default: return method.charAt(0).toUpperCase() + method.slice(1);
 }
},


  async printCashierReport(session: CashierSession, salesDetails: any[]): Promise<boolean> {
    try {
      // Format dates properly from timestamps
      const startDate = format(new Date(session.startDate), 'dd/MM/yyyy');
      const startTime = format(new Date(session.startDate), 'hh:mm a');
      const endDate = session.endDate ? format(new Date(session.endDate), 'dd/MM/yyyy') : 'N/A';
      const endTime = session.endDate ? format(new Date(session.endDate), 'hh:mm a') : 'N/A';
      
      // Open a new window for printing
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        console.error('Failed to open print window. Check if popup blocker is enabled.');
        return false;
      }
      
      // Add the report content to the print window
      printWindow.document.write(`
        <html>
          <head>
            <title>Cashier Report</title>
            <style>
              @page {
                size: 80mm 210mm;
                margin: 0;
              }
              @media print {
                @page {
                  size: portrait;
                }
                body {
                  width: 80mm;
                }
                .no-print {
                  display: none;
                }
              }
              body {
                font-family: 'Courier New', monospace;
                width: 80mm;
                margin: 0;
                padding: 0;
                font-size: 12px;
                line-height: 1.2;
              }
              .report {
                padding: 5mm;
              }
              .header {
                text-align: center;
                margin-bottom: 10px;
              }
              .store-name {
                font-size: 16px;
                font-weight: bold;
              }
              .title {
                text-align: center;
                font-weight: bold;
                font-size: 14px;
                margin: 5px 0;
                padding: 5px;
                border: 1px dashed #000;
              }
              .section {
                margin-bottom: 10px;
                border-bottom: 1px dashed #000;
                padding-bottom: 10px;
              }
              .section-title {
                font-weight: bold;
                margin-bottom: 5px;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 2px;
              }
              .info-label {
                font-weight: normal;
              }
              .info-value {
                font-weight: bold;
              }
              .sales-table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
              }
              .sales-table th, .sales-table td {
                text-align: center;;
                padding: 2px 0;
              }
              .sales-table th {
                font-weight: bold;
                border-bottom: 1px solid #000;
              }
              .sales-table .amount {
                text-align: right;
              }
              .totals {
                margin-top: 10px;
                margin-bottom: 10px;
              }
              .grand-total {
                font-weight: bold;
                border-top: 1px solid #000;
                margin-top: 5px;
                padding-top: 5px;
              }
              .footer {
                text-align: center;
                font-size: 11px;
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px dashed #000;
              }
              .signature-section {
                margin-top: 20px;
                display: flex;
                justify-content: space-between;
              }
              .signature-line {
                width: 45%;
                border-top: 1px solid #000;
                margin-top: 25px;
                text-align: center;
                font-size: 10px;
              }
            </style>
          </head>
          <body>
            <div class="report">
              <div class="header">
                <div class="store-name">Niven Medicals</div>
                <div>Pharmacy Management System</div>
              </div>
              
              <div class="title">CASHIER SESSION REPORT</div>
              
              <div class="section">
                <div class="section-title">Cashier Information</div>
                <div class="info-row">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${session.userName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Session Status:</span>
                  <span class="info-value">${session.isActive ? 'ACTIVE' : 'CLOSED'}</span>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Session Details</div>
                <div class="info-row">
                  <span class="info-label">Start Date:</span>
                  <span class="info-value">${startDate}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Start Time:</span>
                  <span class="info-value">${startTime}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">End Date:</span>
                  <span class="info-value">${endDate}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">End Time:</span>
                  <span class="info-value">${endTime}</span>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Sales Summary</div>
                <div class="info-row">
                  <span class="info-label">Total Sales:</span>
                  <span class="info-value">${salesDetails.length}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Total Amount:</span>
                  <span class="info-value">Rs${session.totalSalesAmount.toFixed(2)}</span>
                </div>
                
                <table class="sales-table">
                  <thead>
                    <tr>
                      <th>Receipt</th>
                      <th>Time</th>
                      <th>Method</th>
                      <th class="amount">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${salesDetails.map(sale => `
                      <tr>
                        <td>${sale.id.slice(-6).toUpperCase()}</td>
                        <td>${format(new Date(sale.createdAt), 'hh:mm a')}</td>
                        <td>${this.formatPaymentMethod(sale.paymentMethod)}</td>
                        <td class="amount">Rs${sale.totalAmount.toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              <div class="totals">
                <div class="info-row grand-total">
                  <span>TOTAL AMOUNT:</span>
                  <span>Rs${session.totalSalesAmount.toFixed(2)}</span>
                </div>
              </div>
              
              <div class="signature-section">
                <div class="signature-line">
                  Cashier Signature
                </div>
                <div class="signature-line">
                  Manager Signature
                </div>
              </div>
              
              <div class="footer">
                <div>Generated: ${format(new Date(), 'dd/MM/yyyy hh:mm:ss a')}</div>
                <div>Niven Medicals</div>
                <div>Software Solution by WebVizard Software Solutions - 0712654267</div>
              </div>
            </div>
            <div class="no-print">
              <button onclick="window.print(); window.close();" style="margin: 20px; padding: 10px;">
                Print Report
              </button>
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      return true;
    } catch (error) {
      console.error('Error printing cashier report:', error);
      return false;
    }
  },


  /**
   * Generate the HTML content for the cashier report
   * This function is kept as a placeholder, as content generation is done directly in the printCashierReport function
   */
  generateCashierReportContent(session: CashierSession, salesDetails: any[]): string {
    // Content generation is done directly in the printCashierReport function
    return '';
  }
};
// src/services/appointmentReceiptService.ts
import { Appointment } from '@/types/appointment';
import { formatCurrency } from '@/types/doctor';
import { format } from 'date-fns';
import { doctorService } from './doctorService';

export const appointmentReceiptService = {
  /**
   * Print an appointment receipt to a thermal 80mm POS printer
   * @param appointment Appointment object containing all appointment information
   * @param sessionAppointmentNumber Optional session appointment number (1, 2, 3, etc.)
   */
  async printAppointmentReceipt(appointment: Appointment, sessionAppointmentNumber?: string): Promise<boolean> {
      try {
        let doctorSpeciality = '';
      try {
        const doctor = await doctorService.getDoctorById(appointment.doctorId);
        doctorSpeciality = doctor?.speciality || '';
      } catch (error) {
        console.warn('Could not fetch doctor specialty:', error);
      }
      
      // Create the receipt content with doctor specialty
      const receiptContent = this.generateAppointmentReceiptContent(appointment, sessionAppointmentNumber, doctorSpeciality);
      
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
            <title>Appointment Receipt</title>
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
              .hospital-name {
                font-size: 16px;
                font-weight: bold;
              }
              .receipt-info {
                margin-bottom: 10px;
                border-bottom: 1px dashed #000;
                padding-bottom: 10px;
              }
              .receipt-procedures {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
              }
              .receipt-procedures th, .receipt-procedures td {
                text-align: left;
                padding: 2px 0;
              }
              .receipt-procedures .amount {
                text-align: right;
              }
              .receipt-totals {
                width: 100%;
                margin-bottom: 10px;
                border-top: 1px dashed #000;
                padding-top: 10px;
              }
              .receipt-totals .label {
                text-align: left;
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
              .appointment-banner {
                text-align: center;
                font-weight: bold;
                font-size: 14px;
                margin: 5px 0;
                padding: 5px;
                border: 1px dashed #000;
              }
              .appointment-number {
                text-align: center;
                font-weight: bold;
                font-size: 18px;
                margin: 8px 0;
                padding: 8px;
                background-color: #f0f0f0;
                border: 2px solid #333;
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
                  window.opener.postMessage('appointment-receipt-printed', '*');
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      return true;
    } catch (error) {
      console.error('Error printing appointment receipt:', error);
      return false;
    }
  },

  /**
   * Generate the HTML content for the appointment receipt
   * @param appointment Appointment object
   * @param sessionAppointmentNumber Optional session appointment number (1, 2, 3, etc.)
   * @returns HTML string for the receipt
   */
generateAppointmentReceiptContent(appointment: Appointment, sessionAppointmentNumber?: string, doctorSpeciality?: string): string {
  // Format the date and time
  const appointmentDate = format(new Date(appointment.date), 'dd/MM/yyyy');
  const appointmentTime = this.formatTime(appointment.startTime);
  const receiptTime = format(new Date(), 'hh:mm:ss a');
  const receiptDate = format(new Date(), 'dd/MM/yyyy');
  
  // Use session appointment number if provided, otherwise use the ID-based number
  const appointmentNumber = sessionAppointmentNumber || this.generateAppointmentNumber(appointment.id || '');
  
  // Calculate doctor fees - appointments no longer have procedures, use manual appointment amount
  const doctorFees = appointment.manualAppointmentAmount || 0;
  
  // Generate HTML for receipt header
  const header = `
    <div class="receipt-header">
      <div class="hospital-name">Niven Medicals</div>
      <div>Negombo road</div>
      <div>Makandura</div>
      <div>Gonawila</div>
      <div>0768899689</div>
    </div>
    <div class="appointment-banner">APPOINTMENT RECEIPT</div>
    <div class="appointment-number">APPOINTMENT #: ${appointmentNumber}</div>
  `;
  
  // Generate appointment info section - REMOVED PHONE, ADDED DOCTOR SPECIALITY
  const appointmentInfo = `
    <div class="receipt-info">
      <div>Receipt Date: ${receiptDate}</div>
      <div>Receipt Time: ${receiptTime}</div>
      <div>----------------------------</div>
      <div>Patient: ${appointment.patientName}</div>
      <div>Doctor: ${appointment.doctorName}</div>
      ${doctorSpeciality ? `<div>Speciality: ${doctorSpeciality}</div>` : ''}
      <div>Appointment Date: ${appointmentDate}</div>
      <div>Appointment Time: ${appointmentTime}</div>
      <div>Payment: ${appointment.payment?.paidBy || 'Cash'}</div>
      ${appointment.payment?.cardDetails ? 
        `<div>Card: ${appointment.payment.cardDetails.maskedNumber}</div>` : ''}
    </div>
  `;
    
    // Generate appointment details table (no procedures anymore)
    const appointmentDetailsTable = `
      <table class="receipt-procedures">
        <thead>
          <tr>
            <th width="60%">Service</th>
            <th width="40%" class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Doctor Consultation</td>
            <td class="amount">${formatCurrency(appointment.manualAppointmentAmount || 0)}</td>
          </tr>
        </tbody>
      </table>
    `;
    
    // Generate totals section
    const totals = `
      <table class="receipt-totals">
        <tr>
          <td class="label">Doctor Fees:</td>
          <td class="amount">${formatCurrency(doctorFees)}</td>
        </tr>
       
        <tr>
          <td class="label">Total Amount:</td>
          <td class="amount">${formatCurrency(appointment.manualAppointmentAmount || 0)}</td>
        </tr>
        <tr>
          <td class="label">Payment Status:</td>
          <td class="amount">PAID</td>
        </tr>
      </table>
    `;
    
    // Generate footer
    const footer = `
      <div class="receipt-footer">
        <div>Thank you for choosing our services!</div>
        <div>Get well soon!</div>
        <div>----------------------------</div>
        <div>Session Appointment Number: ${appointmentNumber}</div>
        <div>----------------------------</div>
        <div>WebVizard Software Solutions</div>
        <div>0712654267</div>
      </div>
    `;
    
    // Combine all sections
    return `
      ${header}
      ${appointmentInfo}
      ${appointmentDetailsTable}
      ${totals}
      ${footer}
    `;
  },

  /**
   * Format time for display (24h to 12h)
   */
  formatTime(time: string): string {
    if (!time) return '';
    
    try {
      const [hour, minute] = time.split(':');
      const hourNum = parseInt(hour);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const hour12 = hourNum % 12 || 12;
      return `${hour12}:${minute} ${ampm}`;
    } catch (e) {
      return time;
    }
  },

  /**
   * Generate appointment number from ID (fallback method)
   */
  generateAppointmentNumber(appointmentId: string): string {
    if (appointmentId) {
      const cleanId = appointmentId.replace(/[^a-zA-Z0-9]/g, '');
      return cleanId.substring(Math.max(0, cleanId.length - 8)).toUpperCase();
    }
    
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${datePart}-${randomPart}`;
  },

  /**
   * Generate a sequential appointment number for display purposes
   * @param index The appointment index in the session (0-based)
   */
  generateSequentialNumber(index: number): string {
    return (index + 1).toString();
  },

  /**
   * Print a batch receipt for multiple appointments (useful for session summaries)
   * @param appointments Array of appointments
   * @param sessionInfo Session information
   */
  async printSessionSummary(
    appointments: Appointment[], 
    sessionInfo: {
      doctorName: string;
      doctorSpeciality: string;
      date: string;
      startTime: string;
      endTime: string;
    }
  ): Promise<boolean> {
    try {
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        console.error('Failed to open print window. Check if popup blocker is enabled.');
        return false;
      }

      const sessionDate = format(new Date(sessionInfo.date), 'dd/MM/yyyy');
      const sessionStartTime = this.formatTime(sessionInfo.startTime);
      const sessionEndTime = this.formatTime(sessionInfo.endTime);
      const printTime = format(new Date(), 'hh:mm:ss a');
      const printDate = format(new Date(), 'dd/MM/yyyy');

      const totalRevenue = appointments
        .filter(apt => apt.payment?.isPaid && !apt.payment?.refunded)
        .reduce((sum, apt) => sum + (apt.manualAppointmentAmount || 0), 0);

      const doctorFees = appointments
        .filter(apt => apt.payment?.isPaid && !apt.payment?.refunded && apt.isPatientArrived)
        .reduce((sum, apt) => sum + (apt.manualAppointmentAmount || 0), 0);


      printWindow.document.write(`
        <html>
          <head>
            <title>Session Summary</title>
            <style>
              @page {
                size: 80mm 297mm;
                margin: 0;
              }
              body {
                font-family: 'Courier New', monospace;
                width: 80mm;
                margin: 0;
                padding: 5mm;
                font-size: 11px;
                line-height: 1.3;
              }
              .header {
                text-align: center;
                margin-bottom: 15px;
              }
              .hospital-name {
                font-size: 16px;
                font-weight: bold;
              }
              .session-banner {
                text-align: center;
                font-weight: bold;
                font-size: 14px;
                margin: 8px 0;
                padding: 5px;
                border: 1px dashed #000;
              }
              .session-info {
                margin-bottom: 15px;
                border-bottom: 1px dashed #000;
                padding-bottom: 10px;
              }
              .appointments-list {
                margin-bottom: 15px;
              }
              .appointment-item {
                margin-bottom: 8px;
                padding: 5px;
                border: 1px solid #ddd;
              }
              .totals {
                border-top: 1px dashed #000;
                padding-top: 10px;
                margin-top: 15px;
              }
              .footer {
                text-align: center;
                font-size: 10px;
                margin-top: 15px;
                border-top: 1px dashed #000;
                padding-top: 10px;
              }
              @media print {
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="hospital-name">Niven Medicals</div>
              <div>Negombo road</div>
              <div>Makandura</div>
              <div>Gonawila</div>
              <div>0768899689</div>
            </div>
            
            <div class="session-banner">SESSION SUMMARY</div>
            
            <div class="session-info">
              <div>Doctor: ${sessionInfo.doctorName}</div>
              <div>Speciality: ${sessionInfo.doctorSpeciality}</div>
              <div>Date: ${sessionDate}</div>
              <div>Time: ${sessionStartTime} - ${sessionEndTime}</div>
              <div>Printed: ${printDate} ${printTime}</div>
              <div>----------------------------</div>
              <div>Total Appointments: ${appointments.length}</div>
              <div>Paid Appointments: ${appointments.filter(apt => apt.payment?.isPaid && !apt.payment?.refunded).length}</div>
              <div>Arrived Patients: ${appointments.filter(apt => apt.isPatientArrived).length}</div>
            </div>
            
            <div class="appointments-list">
              <div style="font-weight: bold; margin-bottom: 8px;">APPOINTMENTS:</div>
              ${appointments.map((apt, index) => `
                <div class="appointment-item">
                  <div>Apt #${index + 1}: ${apt.patientName}</div>
                  <div>Phone: ${apt.patientContact}</div>
                  <div>Amount: ${formatCurrency(apt.manualAppointmentAmount || 0)}</div>
                  <div>Status: ${apt.status.toUpperCase()}</div>
                  ${apt.payment?.isPaid ? '<div>Payment: PAID</div>' : '<div>Payment: PENDING</div>'}
                  ${apt.isPatientArrived ? '<div>Arrival: YES</div>' : '<div>Arrival: NO</div>'}
                </div>
              `).join('')}
            </div>
            
            <div class="totals">
              <div>FINANCIAL SUMMARY:</div>
              <div>----------------------------</div>
              <div>Total Revenue: ${formatCurrency(totalRevenue)}</div>
              <div>Doctor Fees: ${formatCurrency(doctorFees)}</div>
            </div>
            
            <div class="footer">
              <div>Session completed successfully</div>
              <div>----------------------------</div>
              <div>WebVizard Software Solutions</div>
              <div>0712654267</div>
            </div>
            
            <div class="no-print">
              <button onclick="window.print(); window.close();" style="margin: 20px; padding: 10px;">
                Print Session Summary
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
      console.error('Error printing session summary:', error);
      return false;
    }
  }
};
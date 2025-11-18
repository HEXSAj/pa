// src/services/referralLetterPrintService.ts
import { ReferralLetter } from '@/types/referralLetter';
import { Appointment } from '@/types/appointment';

export const referralLetterPrintService = {
  // Print referral letter
  async printReferralLetter(appointment: Appointment, referralLetter: ReferralLetter): Promise<boolean> {
    try {
      const printContent = this.generateReferralLetterContent(appointment, referralLetter);
      return await this.printContent(printContent, 'Referral Letter');
    } catch (error) {
      console.error('Error printing referral letter:', error);
      return false;
    }
  },

  // Generate content for referral letter
  generateReferralLetterContent(appointment: Appointment, referralLetter: ReferralLetter): string {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Referral Letter - ${appointment.patientName}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          
          body {
            font-family: 'Times New Roman', serif;
            font-size: 12px;
            line-height: 1.6;
            color: #000;
            margin: 0;
            padding: 0;
          }
          
          .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            text-align: center;
            border-bottom: 2px solid #1e3a8a;
            padding: 15px 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .clinic-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
          }
          
          .clinic-address {
            font-size: 11px;
            margin-bottom: 3px;
            opacity: 0.95;
          }
          
          .letter-title {
            font-size: 16px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
            text-decoration: underline;
          }
          
          .date-section {
            text-align: right;
            margin-bottom: 20px;
            font-size: 11px;
          }
          
          .referral-doctor-info {
            margin-bottom: 20px;
            border: 1px solid #000;
            padding: 10px;
            background-color: #f9f9f9;
          }
          
          .referral-doctor-info h3 {
            margin: 0 0 10px 0;
            font-size: 13px;
            font-weight: bold;
            text-decoration: underline;
          }
          
          .info-row {
            display: flex;
            margin-bottom: 5px;
          }
          
          .info-label {
            font-weight: bold;
            width: 120px;
            flex-shrink: 0;
            font-size: 11px;
          }
          
          .info-value {
            font-size: 11px;
          }
          
          .patient-info {
            margin-bottom: 20px;
            border: 1px solid #000;
            padding: 10px;
          }
          
          .patient-info h3 {
            margin: 0 0 10px 0;
            font-size: 13px;
            font-weight: bold;
            text-decoration: underline;
          }
          
          .referral-content {
            margin-bottom: 20px;
            line-height: 1.8;
          }
          
          .referral-note {
            background-color: #f0f8ff;
            border: 1px solid #ccc;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
            font-style: italic;
          }
          
          .footer {
            margin-top: 30px;
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 15px;
          }
          
          .doctor-signature {
            margin-top: 20px;
          }
          
          .signature-line {
            border-bottom: 1px solid #000;
            width: 200px;
            margin: 0 auto 5px auto;
          }
          
          .date-time {
            font-size: 10px;
            margin-top: 10px;
          }
          
          .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .status-pending {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
          }
          
          .status-sent {
            background-color: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
          }
          
          .status-received {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }
          
          .status-completed {
            background-color: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
          }
          
          .status-cancelled {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }
          
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">Niven Medicals</div>
          <div class="clinic-address">Negombo road</div>
          <div class="clinic-address">Makandura</div>
          <div class="clinic-address">Gonawila</div>
          <div class="clinic-address">Tel: 0768899689</div>
        </div>
        
        <div class="letter-title">REFERRAL LETTER</div>
        
        <div class="date-section">
          <div>Date: ${currentDate}</div>
          <div>Time: ${currentTime}</div>
        </div>
        
        <div class="referral-doctor-info">
          <h3>Referral Doctor Information</h3>
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">${referralLetter.referralDoctorTitles ? referralLetter.referralDoctorTitles + ' ' : ''}${referralLetter.referralDoctorName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Specialty:</span>
            <span class="info-value">${referralLetter.referralDoctorSpecialty}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Qualifications:</span>
            <span class="info-value">${referralLetter.referralDoctorQualifications}</span>
          </div>
          ${referralLetter.referralDoctorHospital ? `
          <div class="info-row">
            <span class="info-label">Hospital:</span>
            <span class="info-value">${referralLetter.referralDoctorHospital}</span>
          </div>
          ` : ''}
          ${referralLetter.referralDoctorContact ? `
          <div class="info-row">
            <span class="info-label">Contact:</span>
            <span class="info-value">${referralLetter.referralDoctorContact}</span>
          </div>
          ` : ''}
          ${referralLetter.referralDoctorEmail ? `
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${referralLetter.referralDoctorEmail}</span>
          </div>
          ` : ''}
          ${referralLetter.referralDoctorAddress ? `
          <div class="info-row">
            <span class="info-label">Address:</span>
            <span class="info-value">${referralLetter.referralDoctorAddress}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="patient-info">
          <h3>Patient Information</h3>
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">${appointment.patientName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Contact:</span>
            <span class="info-value">${appointment.patientContact}</span>
          </div>
          ${referralLetter.patientAge ? `
          <div class="info-row">
            <span class="info-label">Age:</span>
            <span class="info-value">${referralLetter.patientAge} years</span>
          </div>
          ` : ''}
          ${referralLetter.patientGender ? `
          <div class="info-row">
            <span class="info-label">Gender:</span>
            <span class="info-value">${referralLetter.patientGender}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">Referring Doctor:</span>
            <span class="info-value">${appointment.doctorName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Referral Date:</span>
            <span class="info-value">${new Date(referralLetter.referralDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="info-value">
              <span class="status-badge status-${referralLetter.status}">${referralLetter.status}</span>
            </span>
          </div>
        </div>
        
        <div class="referral-content">
          <h3 style="margin-bottom: 15px; text-decoration: underline;">Referral Details</h3>
          <div class="referral-note">
            ${referralLetter.referralNote}
          </div>
        </div>
        
        <div class="footer">
          <div class="doctor-signature">
            <div class="signature-line"></div>
            <div style="text-align: center; font-weight: bold; margin-top: 5px;">${appointment.doctorName}</div>
            <div style="text-align: center; font-size: 11px;">Referring Doctor</div>
          </div>
          <div class="date-time">
            Printed on: ${currentDate} at ${currentTime}
          </div>
        </div>
      </body>
      </html>
    `;

    return content;
  },

  // Print the generated content
  async printContent(content: string, title: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // Create a new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        
        if (!printWindow) {
          alert('Please allow popups to print referral letters.');
          resolve(false);
          return;
        }

        printWindow.document.write(content);
        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
            resolve(true);
          }, 500);
        };

        // Fallback timeout
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.close();
            resolve(false);
          }
        }, 10000);

      } catch (error) {
        console.error('Print error:', error);
        resolve(false);
      }
    });
  }
};

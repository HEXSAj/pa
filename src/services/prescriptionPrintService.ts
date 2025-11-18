// src/services/prescriptionPrintService.ts
import { Prescription, Medicine } from '@/types/prescription';
import { Appointment } from '@/types/appointment';

export const prescriptionPrintService = {
  // Print full prescription (all medicines - inventory and written)
  async printFullPrescription(appointment: Appointment, prescription: Prescription): Promise<boolean> {
    try {
      const printContent = this.generateFullPrescriptionContent(appointment, prescription);
      return await this.printContent(printContent, 'Full Prescription');
    } catch (error) {
      console.error('Error printing full prescription:', error);
      return false;
    }
  },

  // Print only written medicines
  async printWrittenMedicinesOnly(appointment: Appointment, prescription: Prescription): Promise<boolean> {
    try {
      const writtenMedicines = (prescription.medicines || []).filter(medicine => medicine.source === 'written');
      
      if (writtenMedicines.length === 0) {
        alert('No written medicines found in this prescription.');
        return false;
      }

      const printContent = this.generateWrittenMedicinesContent(appointment, prescription, writtenMedicines);
      return await this.printContent(printContent, 'Written Medicines Only');
    } catch (error) {
      console.error('Error printing written medicines:', error);
      return false;
    }
  },

  // Print only inventory medicines
  async printInventoryMedicinesOnly(appointment: Appointment, prescription: Prescription): Promise<boolean> {
    try {
      const inventoryMedicines = (prescription.medicines || []).filter(medicine => medicine.source === 'inventory');
      
      if (inventoryMedicines.length === 0) {
        alert('No inventory medicines found in this prescription.');
        return false;
      }

      // Create a modified prescription with only inventory medicines
      const inventoryPrescription: Prescription = {
        ...prescription,
        medicines: inventoryMedicines
      };

      const printContent = this.generateFullPrescriptionContent(appointment, inventoryPrescription);
      return await this.printContent(printContent, 'Inventory Medicines Only');
    } catch (error) {
      console.error('Error printing inventory medicines:', error);
      return false;
    }
  },

  // Generate content for full prescription
  generateFullPrescriptionContent(appointment: Appointment, prescription: Prescription): string {
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
        <title>Prescription - ${prescription.patientName || appointment.patientName}</title>
        <style>
          @page {
            size: 14.5cm 20cm;
            margin: 0;
          }
          
          body {
            font-family: 'Times New Roman', serif;
            font-size: 10px;
            line-height: 1.2;
            color: #000;
            margin: 0;
            padding: 0;
            width: 14.5cm;
            height: 20cm;
            box-sizing: border-box;
            overflow: hidden;
          }
          
          .content-container {
            padding: 3.5cm 2mm 0.5cm 2mm;
            height: 16cm;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          
          
          .prescription-title {
            font-size: 12px;
            font-weight: bold;
            margin: 2mm 0;
            text-align: center;
            text-decoration: underline;
            color: #000;
          }
          
          .patient-info {
            margin-bottom: 2mm;
            border: 1px solid #000;
            padding: 1.5mm;
            flex-shrink: 0;
          }
          
          .patient-info h3 {
            margin: 0 0 1mm 0;
            font-size: 10px;
            font-weight: bold;
            text-decoration: underline;
            color: #000;
          }
          
          .patient-info-row {
            display: flex;
            flex-wrap: wrap;
            gap: 2mm;
            margin-bottom: 0.5mm;
          }
          
          .patient-field {
            display: flex;
            align-items: center;
            font-size: 8px;
            white-space: nowrap;
            color: #000;
          }
          
          .patient-label {
            font-weight: bold;
            margin-right: 0.5mm;
            min-width: fit-content;
            color: #000;
          }
          
          .patient-value {
            font-size: 8px;
            color: #000;
          }
          
          .medical-info {
            margin-bottom: 2mm;
            border: 1px solid #000;
            padding: 1.5mm;
            flex-shrink: 0;
          }
          
          .medical-info h3 {
            margin: 0 0 1mm 0;
            font-size: 10px;
            font-weight: bold;
            text-decoration: underline;
            color: #000;
          }
          
          .medical-info-row {
            display: flex;
            flex-wrap: wrap;
            gap: 2mm;
            margin-bottom: 0.5mm;
          }
          
          .medical-field {
            display: flex;
            align-items: center;
            font-size: 8px;
            white-space: nowrap;
            color: #000;
          }
          
          .medical-label {
            font-weight: bold;
            margin-right: 0.5mm;
            min-width: fit-content;
            color: #000;
          }
          
          .medical-value {
            font-size: 8px;
            color: #000;
          }
          
          .medicines-section {
            margin-bottom: 2mm;
            flex: 1;
            overflow: hidden;
          }
          
          .medicines-section h3 {
            margin: 0 0 1mm 0;
            font-size: 10px;
            font-weight: bold;
            text-decoration: underline;
            color: #000;
          }
          
          .medicine-item {
            margin-bottom: 1.5mm;
            padding: 1.5mm;
            border: 1px solid #000;
            border-radius: 1mm;
            background-color: #fff;
          }
          
          .medicine-name {
            font-weight: bold;
            font-size: 9px;
            margin-bottom: 0.5mm;
            color: #000;
          }
          
          .medicine-details {
            font-size: 8px;
            display: flex;
            flex-wrap: wrap;
            gap: 2mm;
          }
          
          .medicine-detail-item {
            display: flex;
            align-items: center;
            white-space: nowrap;
            color: #000;
          }
          
          .medicine-detail-label {
            font-weight: bold;
            margin-right: 0.5mm;
            font-size: 8px;
            color: #000;
          }
          
          .medicine-detail-value {
            font-size: 8px;
            color: #000;
          }
          
          .footer {
            margin-top: 1mm;
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 1.5mm;
            flex-shrink: 0;
          }
          
          .doctor-signature {
            margin-top: 1mm;
          }
          
          .signature-line {
            border-bottom: 1px solid #000;
            width: 35mm;
            margin: 0 auto 0.5mm auto;
          }
          
          .date-time {
            font-size: 5px;
            margin-top: 1mm;
            display: none;
          }
          
          .notes-section {
            margin-bottom: 2mm;
            border: 1px solid #000;
            padding: 1.5mm;
            flex-shrink: 0;
          }
          
          .notes-section h3 {
            margin: 0 0 1mm 0;
            font-size: 10px;
            font-weight: bold;
            text-decoration: underline;
            color: #000;
          }
          
          .notes-content {
            font-size: 8px;
            color: #000;
          }
          
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="content-container">
          
          <div class="prescription-title">PRESCRIPTION</div>
          
          <div class="patient-info">
            <h3>Patient Information</h3>
            <div class="patient-info-row">
              <div class="patient-field">
                <span class="patient-label">Name:</span>
                <span class="patient-value">${prescription.patientName || appointment.patientName}</span>
              </div>
              <div class="patient-field">
                <span class="patient-label">Contact:</span>
                <span class="patient-value">${prescription.patientContact || appointment.patientContact || 'N/A'}</span>
              </div>
              ${prescription.patientAge ? `<div class="patient-field">
                <span class="patient-label">Age:</span>
                <span class="patient-value">${prescription.patientAge}</span>
              </div>` : ''}
              ${prescription.patientDateOfBirth ? `<div class="patient-field">
                <span class="patient-label">DOB:</span>
                <span class="patient-value">${new Date(prescription.patientDateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>` : ''}
              <div class="patient-field">
                <span class="patient-label">Date:</span>
                <span class="patient-value">${currentDate}</span>
              </div>
              <div class="patient-field">
                <span class="patient-label">Time:</span>
                <span class="patient-value">${currentTime}</span>
              </div>
              <div class="patient-field">
                <span class="patient-label">Doctor:</span>
                <span class="patient-value">${appointment.doctorName}</span>
              </div>
            </div>
          </div>
    `;

    // Add medical information if available
    if (prescription.presentingComplaint || prescription.medicalHistory || prescription.onExamination || prescription.labResults || prescription.investigations || prescription.diagnosis) {
      content += `
        <div class="medical-info">
          <h3>Medical Information</h3>
          <div class="medical-info-row">
      `;
      
      // Collect all medical fields for horizontal display
      const medicalFields = [];
      
      if (prescription.presentingComplaint) {
        medicalFields.push(`<div class="medical-field"><span class="medical-label">P/C:</span><span class="medical-value">${prescription.presentingComplaint}</span></div>`);
      }
      
      // Medical History
      if (prescription.medicalHistory) {
        const history = prescription.medicalHistory;
        if (history.pastMedicalHistory) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Past Medical History:</span><span class="medical-value">${history.pastMedicalHistory}</span></div>`);
        }
        if (history.surgicalHistory) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Surgical History:</span><span class="medical-value">${history.surgicalHistory}</span></div>`);
        }
        if (history.currentMedications) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Current Medications:</span><span class="medical-value">${history.currentMedications}</span></div>`);
        }
        if (history.allergies) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Allergies:</span><span class="medical-value">${history.allergies}</span></div>`);
        }
        if (history.familyHistory) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Family History:</span><span class="medical-value">${history.familyHistory}</span></div>`);
        }
      }
      
      // Examination findings
      if (prescription.onExamination) {
        const exam = prescription.onExamination;
        if (exam.temperature) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Temperature:</span><span class="medical-value">${exam.temperature}</span></div>`);
        }
        if (exam.bloodPressure) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">BP:</span><span class="medical-value">${exam.bloodPressure}</span></div>`);
        }
        if (exam.heartRate) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">HR:</span><span class="medical-value">${exam.heartRate}</span></div>`);
        }
        if (exam.respiratoryRate) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">RR:</span><span class="medical-value">${exam.respiratoryRate}</span></div>`);
        }
        if (exam.oxygenSaturation) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">SpO2:</span><span class="medical-value">${exam.oxygenSaturation}</span></div>`);
        }
        if (exam.lungs) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Lungs:</span><span class="medical-value">${exam.lungs}</span></div>`);
        }
        if (exam.abdomen) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Abdomen:</span><span class="medical-value">${exam.abdomen}</span></div>`);
        }
        if (exam.other) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Other:</span><span class="medical-value">${exam.other}</span></div>`);
        }
      }
      
      // Lab Results
      if (prescription.labResults) {
        const labs = prescription.labResults;
        if (labs.tsh) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">TSH:</span><span class="medical-value">${labs.tsh}</span></div>`);
        }
        if (labs.hba1c) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">HbA1c:</span><span class="medical-value">${labs.hba1c}</span></div>`);
        }
        if (labs.ldl) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">LDL:</span><span class="medical-value">${labs.ldl}</span></div>`);
        }
        if (labs.cholesterol) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Cholesterol:</span><span class="medical-value">${labs.cholesterol}</span></div>`);
        }
        if (labs.glucose) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Glucose:</span><span class="medical-value">${labs.glucose}</span></div>`);
        }
        if (labs.creatinine) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Creatinine:</span><span class="medical-value">${labs.creatinine}</span></div>`);
        }
        // FBC fields
        if (labs.wbc) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">WBC:</span><span class="medical-value">${labs.wbc}</span></div>`);
        }
        if (labs.ne) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">NE:</span><span class="medical-value">${labs.ne}</span></div>`);
        }
        if (labs.ly) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">LY:</span><span class="medical-value">${labs.ly}</span></div>`);
        }
        if (labs.hb) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">HB:</span><span class="medical-value">${labs.hb}</span></div>`);
        }
        if (labs.plt) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">PLT:</span><span class="medical-value">${labs.plt}</span></div>`);
        }
        if (labs.crp) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">CRP:</span><span class="medical-value">${labs.crp}</span></div>`);
        }
        if (labs.esr) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">ESR:</span><span class="medical-value">${labs.esr}</span></div>`);
        }
        // UFR fields
        if (labs.pus) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">PUS:</span><span class="medical-value">${labs.pus}</span></div>`);
        }
        if (labs.red) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">RED:</span><span class="medical-value">${labs.red}</span></div>`);
        }
        if (labs.sug) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">SUG:</span><span class="medical-value">${labs.sug}</span></div>`);
        }
        if (labs.aib) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">AIB:</span><span class="medical-value">${labs.aib}</span></div>`);
        }
        if (labs.org) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">ORG:</span><span class="medical-value">${labs.org}</span></div>`);
        }
        // Lipid Profile
        if (labs.tc) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">TC:</span><span class="medical-value">${labs.tc}</span></div>`);
        }
        if (labs.tg) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">TG:</span><span class="medical-value">${labs.tg}</span></div>`);
        }
        if (labs.hdl) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">HDL:</span><span class="medical-value">${labs.hdl}</span></div>`);
        }
        if (labs.vldl) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">VLDL:</span><span class="medical-value">${labs.vldl}</span></div>`);
        }
        if (labs.tcHdl) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">TC/HDL:</span><span class="medical-value">${labs.tcHdl}</span></div>`);
        }
        // Other tests
        if (labs.fbs) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">FBS:</span><span class="medical-value">${labs.fbs}</span></div>`);
        }
        if (labs.sCr) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">sCr:</span><span class="medical-value">${labs.sCr}</span></div>`);
        }
        if (labs.ast) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">AST:</span><span class="medical-value">${labs.ast}</span></div>`);
        }
        if (labs.alt) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">ALT:</span><span class="medical-value">${labs.alt}</span></div>`);
        }
        if (labs.rf) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">RF:</span><span class="medical-value">${labs.rf}</span></div>`);
        }
        // Custom lab results
        if (labs.customLabResults && Array.isArray(labs.customLabResults) && labs.customLabResults.length > 0) {
          labs.customLabResults.forEach((customLab: { name: string; value: string }) => {
            if (customLab.name && customLab.value) {
              medicalFields.push(`<div class="medical-field"><span class="medical-label">${customLab.name}:</span><span class="medical-value">${customLab.value}</span></div>`);
            }
          });
        }
        if (labs.other) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Other Lab Results:</span><span class="medical-value">${labs.other}</span></div>`);
        }
      }
      
      // Investigations
      if (prescription.investigations) {
        const inv = prescription.investigations;
        if (inv.ecg) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">ECG:</span><span class="medical-value">${inv.ecg}</span></div>`);
        }
        if (inv.echo) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Echo:</span><span class="medical-value">${inv.echo}</span></div>`);
        }
        if (inv.xray) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">X-Ray:</span><span class="medical-value">${inv.xray}</span></div>`);
        }
        if (inv.ct) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">CT:</span><span class="medical-value">${inv.ct}</span></div>`);
        }
        if (inv.mri) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">MRI:</span><span class="medical-value">${inv.mri}</span></div>`);
        }
        if (inv.other) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Other Investigations:</span><span class="medical-value">${inv.other}</span></div>`);
        }
      }
      
      if (prescription.diagnosis) {
        medicalFields.push(`<div class="medical-field"><span class="medical-label">Diagnosis:</span><span class="medical-value">${prescription.diagnosis}</span></div>`);
      }
      
      // Add all medical fields horizontally
      content += medicalFields.join('');
      
      content += `
          </div>
        </div>
      `;
    }

    // Add medicines section
    content += `
      <div class="medicines-section">
        <h3>Medicines Prescribed</h3>
    `;

    (prescription.medicines || []).forEach((medicine, index) => {
      content += `
        <div class="medicine-item">
          <div class="medicine-name">${index + 1}. ${medicine.medicineName}</div>
          <div class="medicine-details">
            <div class="medicine-detail-item">
              <span class="medicine-detail-label">Dosage:</span>
              <span class="medicine-detail-value">${medicine.dosage}</span>
            </div>
            <div class="medicine-detail-item">
              <span class="medicine-detail-label">Frequency:</span>
              <span class="medicine-detail-value">${medicine.frequency}</span>
            </div>
            <div class="medicine-detail-item">
              <span class="medicine-detail-label">Duration:</span>
              <span class="medicine-detail-value">${medicine.duration}</span>
            </div>
      `;
      
      if (medicine.instructions) {
        content += `
            <div class="medicine-detail-item">
              <span class="medicine-detail-label">Instructions:</span>
              <span class="medicine-detail-value">${medicine.instructions}</span>
            </div>
        `;
      }
      
      content += `</div></div>`;
    });

    content += `</div>`;

    // Add medical tests section
    if (prescription.medicalTests && prescription.medicalTests.length > 0) {
      content += `
        <div class="medicines-section">
          <h3>Medical Tests Ordered</h3>
      `;

      prescription.medicalTests.forEach((test, index) => {
        content += `
          <div class="medicine-item">
            <div class="medicine-name">${index + 1}. ${test.testName}</div>
            <div class="medicine-details">
        `;
        
        if (test.testType) {
          content += `
            <div class="medicine-detail-item">
              <span class="medicine-detail-label">Type:</span>
              <span class="medicine-detail-value">${test.testType}</span>
            </div>
          `;
        }
        
        if (test.urgency) {
          const urgencyText = test.urgency === 'stat' ? 'STAT (Immediate)' : 
                             test.urgency === 'urgent' ? 'Urgent' : 'Routine';
          content += `
            <div class="medicine-detail-item">
              <span class="medicine-detail-label">Urgency:</span>
              <span class="medicine-detail-value">${urgencyText}</span>
            </div>
          `;
        }
        
        if (test.fastingRequired) {
          content += `
            <div class="medicine-detail-item">
              <span class="medicine-detail-label">Fasting:</span>
              <span class="medicine-detail-value">Required</span>
            </div>
          `;
        }
        
        if (test.fastingInstructions) {
          content += `
            <div class="medicine-detail-item">
              <span class="medicine-detail-label">Fasting Instructions:</span>
              <span class="medicine-detail-value">${test.fastingInstructions}</span>
            </div>
          `;
        }
        
        if (test.instructions) {
          content += `
            <div class="medicine-detail-item">
              <span class="medicine-detail-label">Instructions:</span>
              <span class="medicine-detail-value">${test.instructions}</span>
            </div>
          `;
        }
        
        content += `</div></div>`;
      });

      content += `</div>`;
    }

    // Add next visit date if available
    if (prescription.nextVisitDate) {
      const nextVisitDate = new Date(prescription.nextVisitDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      content += `
        <div class="notes-section">
          <h3>Next Visit</h3>
          <div class="notes-content">
            <strong>Please return on:</strong> ${nextVisitDate}
          </div>
        </div>
      `;
    }

    // Add notes if available
    if (prescription.notes) {
      content += `
        <div class="notes-section">
          <h3>Additional Notes</h3>
          <div class="notes-content">${prescription.notes}</div>
        </div>
      `;
    }

    // Add footer
    content += `
          <div class="footer">
            <div class="doctor-signature">
              <div class="signature-line"></div>
              <div style="text-align: center; font-weight: bold; font-size: 10px; color: #000;">Dr. ${appointment.doctorName}</div>
              <div style="text-align: center; font-size: 8px; color: #000;">Signature</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return content;
  },

  // Generate content for written medicines only
  generateWrittenMedicinesContent(appointment: Appointment, prescription: Prescription, writtenMedicines: Medicine[]): string {
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
        <title>Written Medicines - ${prescription.patientName || appointment.patientName}</title>
        <style>
          @page {
            size: 14.5cm 20cm;
            margin: 0;
          }
          
          body {
            font-family: 'Times New Roman', serif;
            font-size: 10px;
            line-height: 1.2;
            color: #000;
            margin: 0;
            padding: 0;
            width: 14.5cm;
            height: 20cm;
            box-sizing: border-box;
            overflow: hidden;
          }
          
          .content-container {
            padding: 3.5cm 2mm 0.5cm 2mm;
            height: 16cm;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          
          
          .prescription-title {
            font-size: 12px;
            font-weight: bold;
            margin: 2mm 0;
            text-align: center;
            text-decoration: underline;
            color: #000;
          }
          
          .patient-info {
            margin-bottom: 2mm;
            border: 1px solid #000;
            padding: 1.5mm;
            flex-shrink: 0;
          }
          
          .patient-info h3 {
            margin: 0 0 1mm 0;
            font-size: 10px;
            font-weight: bold;
            text-decoration: underline;
            color: #000;
          }
          
          .patient-info-row {
            display: flex;
            flex-wrap: wrap;
            gap: 2mm;
            margin-bottom: 0.5mm;
          }
          
          .patient-field {
            display: flex;
            align-items: center;
            font-size: 8px;
            white-space: nowrap;
            color: #000;
          }
          
          .patient-label {
            font-weight: bold;
            margin-right: 0.5mm;
            min-width: fit-content;
            color: #000;
          }
          
          .patient-value {
            font-size: 8px;
            color: #000;
          }
          
          .medical-info {
            margin-bottom: 2mm;
            border: 1px solid #000;
            padding: 1.5mm;
            flex-shrink: 0;
          }
          
          .medical-info h3 {
            margin: 0 0 1mm 0;
            font-size: 10px;
            font-weight: bold;
            text-decoration: underline;
            color: #000;
          }
          
          .medical-info-row {
            display: flex;
            flex-wrap: wrap;
            gap: 2mm;
            margin-bottom: 0.5mm;
          }
          
          .medical-field {
            display: flex;
            align-items: center;
            font-size: 8px;
            white-space: nowrap;
            color: #000;
          }
          
          .medical-label {
            font-weight: bold;
            margin-right: 0.5mm;
            min-width: fit-content;
            color: #000;
          }
          
          .medical-value {
            font-size: 8px;
            color: #000;
          }
          
          .medicines-section {
            margin-bottom: 2mm;
            flex: 1;
            overflow: hidden;
          }
          
          .medicines-section h3 {
            margin: 0 0 1mm 0;
            font-size: 10px;
            font-weight: bold;
            text-decoration: underline;
            color: #000;
          }
          
          .medicine-item {
            margin-bottom: 1.5mm;
            padding: 1.5mm;
            border: 1px solid #000;
            border-radius: 1mm;
            background-color: #fff;
          }
          
          .medicine-name {
            font-weight: bold;
            font-size: 9px;
            margin-bottom: 0.5mm;
            color: #000;
          }
          
          .medicine-details {
            font-size: 8px;
            display: flex;
            flex-wrap: wrap;
            gap: 2mm;
          }
          
          .medicine-detail-item {
            display: flex;
            align-items: center;
            white-space: nowrap;
            color: #000;
          }
          
          .medicine-detail-label {
            font-weight: bold;
            margin-right: 0.5mm;
            font-size: 8px;
            color: #000;
          }
          
          .medicine-detail-value {
            font-size: 8px;
            color: #000;
          }
          
          .footer {
            margin-top: 2mm;
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 2mm;
            flex-shrink: 0;
          }
          
          .doctor-signature {
            margin-top: 2mm;
          }
          
          .signature-line {
            border-bottom: 1px solid #000;
            width: 40mm;
            margin: 0 auto 1mm auto;
          }
          
          .date-time {
            font-size: 6px;
            margin-top: 2mm;
            display: none;
          }
          
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="content-container">
          
          <div class="prescription-title">WRITTEN MEDICINES PRESCRIPTION</div>
          
          <div class="patient-info">
            <h3>Patient Information</h3>
            <div class="patient-info-row">
              <div class="patient-field">
                <span class="patient-label">Name:</span>
                <span class="patient-value">${prescription.patientName || appointment.patientName}</span>
              </div>
              <div class="patient-field">
                <span class="patient-label">Contact:</span>
                <span class="patient-value">${prescription.patientContact || appointment.patientContact || 'N/A'}</span>
              </div>
              ${prescription.patientAge ? `<div class="patient-field">
                <span class="patient-label">Age:</span>
                <span class="patient-value">${prescription.patientAge}</span>
              </div>` : ''}
              ${prescription.patientDateOfBirth ? `<div class="patient-field">
                <span class="patient-label">DOB:</span>
                <span class="patient-value">${new Date(prescription.patientDateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>` : ''}
              <div class="patient-field">
                <span class="patient-label">Date:</span>
                <span class="patient-value">${currentDate}</span>
              </div>
              <div class="patient-field">
                <span class="patient-label">Time:</span>
                <span class="patient-value">${currentTime}</span>
              </div>
              <div class="patient-field">
                <span class="patient-label">Doctor:</span>
                <span class="patient-value">${appointment.doctorName}</span>
              </div>
            </div>
          </div>
          
          <div class="medicines-section">
            <h3>Written Medicines to Purchase</h3>
    `;

    writtenMedicines.forEach((medicine, index) => {
      content += `
        <div class="medicine-item">
          <div class="medicine-name">${index + 1}. ${medicine.medicineName}</div>
          <div class="medicine-details">
            <div class="medicine-detail-row">
              <span class="medicine-detail-label">Dosage:</span>
              <span class="medicine-detail-value">${medicine.dosage}</span>
            </div>
            <div class="medicine-detail-row">
              <span class="medicine-detail-label">Frequency:</span>
              <span class="medicine-detail-value">${medicine.frequency}</span>
            </div>
            <div class="medicine-detail-row">
              <span class="medicine-detail-label">Duration:</span>
              <span class="medicine-detail-value">${medicine.duration}</span>
            </div>
      `;
      
      if (medicine.instructions) {
        content += `
          <div class="medicine-detail-row">
            <span class="medicine-detail-label">Instructions:</span>
            <span class="medicine-detail-value">${medicine.instructions}</span>
          </div>
        `;
      }
      
      content += `</div></div>`;
    });

    content += `</div>`;

    // Add medical tests section for written medicines prescription
    if (prescription.medicalTests && prescription.medicalTests.length > 0) {
      content += `
        <div class="medicines-section">
          <h3>Medical Tests Ordered</h3>
      `;

      prescription.medicalTests.forEach((test, index) => {
        content += `
          <div class="medicine-item">
            <div class="medicine-name">${index + 1}. ${test.testName}</div>
            <div class="medicine-details">
        `;
        
        if (test.testType) {
          content += `
            <div class="medicine-detail-item">
              <span class="medicine-detail-label">Type:</span>
              <span class="medicine-detail-value">${test.testType}</span>
            </div>
          `;
        }
        
        if (test.urgency) {
          const urgencyText = test.urgency === 'stat' ? 'STAT (Immediate)' : 
                             test.urgency === 'urgent' ? 'Urgent' : 'Routine';
          content += `
            <div class="medicine-detail-item">
              <span class="medicine-detail-label">Urgency:</span>
              <span class="medicine-detail-value">${urgencyText}</span>
            </div>
          `;
        }
        
        if (test.fastingRequired) {
          content += `
            <div class="medicine-detail-item">
              <span class="medicine-detail-label">Fasting:</span>
              <span class="medicine-detail-value">Required</span>
            </div>
          `;
        }
        
        if (test.fastingInstructions) {
          content += `
            <div class="medicine-detail-item">
              <span class="medicine-detail-label">Fasting Instructions:</span>
              <span class="medicine-detail-value">${test.fastingInstructions}</span>
            </div>
          `;
        }
        
        if (test.instructions) {
          content += `
            <div class="medicine-detail-item">
              <span class="medicine-detail-label">Instructions:</span>
              <span class="medicine-detail-value">${test.instructions}</span>
            </div>
          `;
        }
        
        content += `</div></div>`;
      });

      content += `</div>`;
    }

    // Add medical information if available
    if (prescription.presentingComplaint || prescription.medicalHistory || prescription.onExamination || prescription.labResults || prescription.investigations || prescription.diagnosis) {
      content += `
        <div class="medical-info">
          <h3>Medical Information</h3>
          <div class="medical-info-row">
      `;
      
      // Collect all medical fields for horizontal display
      const medicalFields = [];
      
      if (prescription.presentingComplaint) {
        medicalFields.push(`<div class="medical-field"><span class="medical-label">P/C:</span><span class="medical-value">${prescription.presentingComplaint}</span></div>`);
      }
      
      // Medical History
      if (prescription.medicalHistory) {
        const history = prescription.medicalHistory;
        if (history.pastMedicalHistory) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Past Medical History:</span><span class="medical-value">${history.pastMedicalHistory}</span></div>`);
        }
        if (history.surgicalHistory) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Surgical History:</span><span class="medical-value">${history.surgicalHistory}</span></div>`);
        }
        if (history.currentMedications) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Current Medications:</span><span class="medical-value">${history.currentMedications}</span></div>`);
        }
        if (history.allergies) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Allergies:</span><span class="medical-value">${history.allergies}</span></div>`);
        }
        if (history.familyHistory) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Family History:</span><span class="medical-value">${history.familyHistory}</span></div>`);
        }
      }
      
      // Examination findings
      if (prescription.onExamination) {
        const exam = prescription.onExamination;
        if (exam.temperature) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Temperature:</span><span class="medical-value">${exam.temperature}</span></div>`);
        }
        if (exam.bloodPressure) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">BP:</span><span class="medical-value">${exam.bloodPressure}</span></div>`);
        }
        if (exam.heartRate) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">HR:</span><span class="medical-value">${exam.heartRate}</span></div>`);
        }
        if (exam.respiratoryRate) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">RR:</span><span class="medical-value">${exam.respiratoryRate}</span></div>`);
        }
        if (exam.oxygenSaturation) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">SpO2:</span><span class="medical-value">${exam.oxygenSaturation}</span></div>`);
        }
        if (exam.lungs) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Lungs:</span><span class="medical-value">${exam.lungs}</span></div>`);
        }
        if (exam.abdomen) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Abdomen:</span><span class="medical-value">${exam.abdomen}</span></div>`);
        }
        if (exam.other) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Other:</span><span class="medical-value">${exam.other}</span></div>`);
        }
      }
      
      // Lab Results
      if (prescription.labResults) {
        const labs = prescription.labResults;
        if (labs.tsh) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">TSH:</span><span class="medical-value">${labs.tsh}</span></div>`);
        }
        if (labs.hba1c) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">HbA1c:</span><span class="medical-value">${labs.hba1c}</span></div>`);
        }
        if (labs.ldl) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">LDL:</span><span class="medical-value">${labs.ldl}</span></div>`);
        }
        if (labs.cholesterol) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Cholesterol:</span><span class="medical-value">${labs.cholesterol}</span></div>`);
        }
        if (labs.glucose) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Glucose:</span><span class="medical-value">${labs.glucose}</span></div>`);
        }
        if (labs.creatinine) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Creatinine:</span><span class="medical-value">${labs.creatinine}</span></div>`);
        }
        // FBC fields
        if (labs.wbc) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">WBC:</span><span class="medical-value">${labs.wbc}</span></div>`);
        }
        if (labs.ne) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">NE:</span><span class="medical-value">${labs.ne}</span></div>`);
        }
        if (labs.ly) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">LY:</span><span class="medical-value">${labs.ly}</span></div>`);
        }
        if (labs.hb) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">HB:</span><span class="medical-value">${labs.hb}</span></div>`);
        }
        if (labs.plt) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">PLT:</span><span class="medical-value">${labs.plt}</span></div>`);
        }
        if (labs.crp) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">CRP:</span><span class="medical-value">${labs.crp}</span></div>`);
        }
        if (labs.esr) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">ESR:</span><span class="medical-value">${labs.esr}</span></div>`);
        }
        // UFR fields
        if (labs.pus) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">PUS:</span><span class="medical-value">${labs.pus}</span></div>`);
        }
        if (labs.red) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">RED:</span><span class="medical-value">${labs.red}</span></div>`);
        }
        if (labs.sug) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">SUG:</span><span class="medical-value">${labs.sug}</span></div>`);
        }
        if (labs.aib) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">AIB:</span><span class="medical-value">${labs.aib}</span></div>`);
        }
        if (labs.org) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">ORG:</span><span class="medical-value">${labs.org}</span></div>`);
        }
        // Lipid Profile
        if (labs.tc) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">TC:</span><span class="medical-value">${labs.tc}</span></div>`);
        }
        if (labs.tg) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">TG:</span><span class="medical-value">${labs.tg}</span></div>`);
        }
        if (labs.hdl) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">HDL:</span><span class="medical-value">${labs.hdl}</span></div>`);
        }
        if (labs.vldl) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">VLDL:</span><span class="medical-value">${labs.vldl}</span></div>`);
        }
        if (labs.tcHdl) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">TC/HDL:</span><span class="medical-value">${labs.tcHdl}</span></div>`);
        }
        // Other tests
        if (labs.fbs) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">FBS:</span><span class="medical-value">${labs.fbs}</span></div>`);
        }
        if (labs.sCr) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">sCr:</span><span class="medical-value">${labs.sCr}</span></div>`);
        }
        if (labs.ast) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">AST:</span><span class="medical-value">${labs.ast}</span></div>`);
        }
        if (labs.alt) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">ALT:</span><span class="medical-value">${labs.alt}</span></div>`);
        }
        if (labs.rf) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">RF:</span><span class="medical-value">${labs.rf}</span></div>`);
        }
        // Custom lab results
        if (labs.customLabResults && Array.isArray(labs.customLabResults) && labs.customLabResults.length > 0) {
          labs.customLabResults.forEach((customLab: { name: string; value: string }) => {
            if (customLab.name && customLab.value) {
              medicalFields.push(`<div class="medical-field"><span class="medical-label">${customLab.name}:</span><span class="medical-value">${customLab.value}</span></div>`);
            }
          });
        }
        if (labs.other) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Other Lab Results:</span><span class="medical-value">${labs.other}</span></div>`);
        }
      }
      
      // Investigations
      if (prescription.investigations) {
        const inv = prescription.investigations;
        if (inv.ecg) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">ECG:</span><span class="medical-value">${inv.ecg}</span></div>`);
        }
        if (inv.echo) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Echo:</span><span class="medical-value">${inv.echo}</span></div>`);
        }
        if (inv.xray) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">X-Ray:</span><span class="medical-value">${inv.xray}</span></div>`);
        }
        if (inv.ct) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">CT:</span><span class="medical-value">${inv.ct}</span></div>`);
        }
        if (inv.mri) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">MRI:</span><span class="medical-value">${inv.mri}</span></div>`);
        }
        if (inv.other) {
          medicalFields.push(`<div class="medical-field"><span class="medical-label">Other Investigations:</span><span class="medical-value">${inv.other}</span></div>`);
        }
      }
      
      if (prescription.diagnosis) {
        medicalFields.push(`<div class="medical-field"><span class="medical-label">Diagnosis:</span><span class="medical-value">${prescription.diagnosis}</span></div>`);
      }
      
      // Add all medical fields horizontally
      content += medicalFields.join('');
      
      content += `
          </div>
        </div>
      `;
    }

    // Add next visit date if available
    if (prescription.nextVisitDate) {
      const nextVisitDate = new Date(prescription.nextVisitDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      content += `
        <div class="notes-section">
          <h3>Next Visit</h3>
          <div class="notes-content">
            <strong>Please return on:</strong> ${nextVisitDate}
          </div>
        </div>
      `;
    }

    // Add footer
    content += `
          <div class="footer">
            <div class="doctor-signature">
              <div class="signature-line"></div>
              <div style="text-align: center; font-weight: bold; font-size: 10px; color: #000;">Dr. ${appointment.doctorName}</div>
              <div style="text-align: center; font-size: 8px; color: #000;">Signature</div>
            </div>
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
          alert('Please allow popups to print prescriptions.');
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

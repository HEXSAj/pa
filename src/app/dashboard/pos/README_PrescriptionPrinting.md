# Prescription Printing Functionality

## Overview
This feature adds prescription printing capabilities to the POS system's AppointmentDetailsModal. Users can now print prescriptions in two different formats:

1. **Full Prescription** - Prints all medicines (both inventory and written medicines)
2. **Written Medicines Only** - Prints only the written medicines that need to be purchased externally

## Features

### Print Full Prescription
- Prints all medicines prescribed by the doctor
- Includes both inventory medicines (available in pharmacy) and written medicines (to be purchased externally)
- Shows complete medical information including:
  - Patient information
  - Medical examination details (P/C, temperature, BP, investigations, diagnosis)
  - All prescribed medicines with dosage, frequency, duration, and instructions
  - Doctor signature line
  - Print timestamp

### Print Written Medicines Only
- Prints only medicines marked as "written" (source: 'written')
- Useful for patients who need to purchase medicines from external pharmacies
- Shows:
  - Patient information
  - Only written medicines with complete details
  - Doctor signature line
  - Print timestamp

## Technical Implementation

### Files Created/Modified

1. **`src/services/prescriptionPrintService.ts`**
   - Service for handling prescription printing logic
   - Generates HTML content for both print types
   - Handles print window management

2. **`src/app/dashboard/pos/PrescriptionPrintButtons.tsx`**
   - React component for the print buttons
   - Handles user interactions and loading states
   - Shows medicine count summaries

3. **`src/app/dashboard/pos/AppointmentDetailsModal.tsx`**
   - Updated to include prescription print buttons
   - Added import for PrescriptionPrintButtons component
   - Integrated buttons next to existing "Load to POS" button

### Print Format
- **Page Size**: A5 (148mm x 210mm)
- **Font**: Times New Roman, serif
- **Layout**: Professional medical prescription format
- **Styling**: Clean, readable layout with proper spacing and borders

## Usage

1. Navigate to the POS system
2. Open an appointment that has a prescription
3. In the prescription section, you'll see:
   - "Load to POS" button (existing functionality)
   - "Print Full Prescription" button (new)
   - "Print Written Medicines Only" button (new, only shown if written medicines exist)
4. Click the desired print button
5. A new window will open with the formatted prescription
6. The browser's print dialog will appear automatically
7. Select your printer and print

## Medicine Types

### Inventory Medicines
- Medicines available in the clinic's pharmacy
- Source: 'inventory'
- Can be loaded to POS for immediate dispensing

### Written Medicines
- Medicines not available in the clinic's pharmacy
- Source: 'written'
- Patient needs to purchase from external pharmacies
- Shown separately in "Written Medicines Only" print

## Error Handling

- Popup blockers: Users will be prompted to allow popups
- Print failures: Error messages are shown via toast notifications
- No written medicines: "Print Written Medicines Only" button is hidden if no written medicines exist
- Loading states: Buttons show loading spinners during print operations

## Browser Compatibility

- Works with all modern browsers that support:
  - `window.open()`
  - `window.print()`
  - CSS `@page` rules
  - HTML5 features

## Future Enhancements

Potential improvements that could be added:
- Print preview before actual printing
- Custom prescription templates
- Batch printing for multiple appointments
- PDF generation instead of direct printing
- Print history tracking

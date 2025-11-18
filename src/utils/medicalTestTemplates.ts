// src/utils/medicalTestTemplates.ts
// Common medical test templates for the system

import { MedicalTestTemplate } from '@/types/prescription';

export const commonMedicalTestTemplates: Omit<MedicalTestTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Blood Tests
  {
    testName: 'Complete Blood Count (CBC)',
    testType: 'Blood Test',
    commonInstructions: ['Fasting not required', 'Can be done at any time'],
    category: 'Blood Tests',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'routine'
  },
  {
    testName: 'Fasting Blood Sugar (FBS)',
    testType: 'Blood Test',
    commonInstructions: ['Fast for 8-12 hours', 'Only water allowed', 'Take sample in the morning'],
    category: 'Blood Tests',
    isActive: true,
    fastingRequired: true,
    defaultUrgency: 'routine'
  },
  {
    testName: 'HbA1c (Glycated Hemoglobin)',
    testType: 'Blood Test',
    commonInstructions: ['Fasting not required', 'Shows average blood sugar over 3 months'],
    category: 'Blood Tests',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'routine'
  },
  {
    testName: 'Lipid Profile',
    testType: 'Blood Test',
    commonInstructions: ['Fast for 12-14 hours', 'No food or drinks except water', 'Take sample in the morning'],
    category: 'Blood Tests',
    isActive: true,
    fastingRequired: true,
    defaultUrgency: 'routine'
  },
  {
    testName: 'Liver Function Tests (LFT)',
    testType: 'Blood Test',
    commonInstructions: ['Fasting not required', 'Can be done at any time'],
    category: 'Blood Tests',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'routine'
  },
  {
    testName: 'Kidney Function Tests (KFT)',
    testType: 'Blood Test',
    commonInstructions: ['Fasting not required', 'Can be done at any time'],
    category: 'Blood Tests',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'routine'
  },
  {
    testName: 'Thyroid Function Tests (TFT)',
    testType: 'Blood Test',
    commonInstructions: ['Fasting not required', 'Can be done at any time'],
    category: 'Blood Tests',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'routine'
  },
  {
    testName: 'Blood Group & Rh Factor',
    testType: 'Blood Test',
    commonInstructions: ['Fasting not required', 'Can be done at any time'],
    category: 'Blood Tests',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'routine'
  },

  // Imaging Tests
  {
    testName: 'Chest X-Ray',
    testType: 'X-Ray',
    commonInstructions: ['Remove jewelry and metal objects', 'Wear loose clothing', 'Pregnancy test required for women'],
    category: 'Imaging',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'routine'
  },
  {
    testName: 'Abdominal Ultrasound',
    testType: 'Ultrasound',
    commonInstructions: ['Fast for 6-8 hours', 'Drink plenty of water 1 hour before', 'Full bladder required'],
    category: 'Imaging',
    isActive: true,
    fastingRequired: true,
    defaultUrgency: 'routine'
  },
  {
    testName: 'Pelvic Ultrasound',
    testType: 'Ultrasound',
    commonInstructions: ['Full bladder required', 'Drink 4-6 glasses of water 1 hour before', 'Do not urinate before test'],
    category: 'Imaging',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'routine'
  },
  {
    testName: 'ECG (Electrocardiogram)',
    testType: 'ECG',
    commonInstructions: ['No special preparation required', 'Remove upper body clothing', 'Lie still during test'],
    category: 'Cardiology',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'routine'
  },
  {
    testName: 'Echocardiogram',
    testType: 'Ultrasound',
    commonInstructions: ['No special preparation required', 'Remove upper body clothing', 'Lie on left side during test'],
    category: 'Cardiology',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'routine'
  },

  // Urine Tests
  {
    testName: 'Urine Routine & Microscopy',
    testType: 'Urine Test',
    commonInstructions: ['Clean catch mid-stream sample', 'Wash hands before collection', 'First morning sample preferred'],
    category: 'Urine Tests',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'routine'
  },
  {
    testName: '24-Hour Urine Collection',
    testType: 'Urine Test',
    commonInstructions: ['Start collection in the morning', 'Keep refrigerated', 'Complete 24-hour period'],
    category: 'Urine Tests',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'routine'
  },

  // Stool Tests
  {
    testName: 'Stool Routine & Microscopy',
    testType: 'Stool Test',
    commonInstructions: ['Fresh sample required', 'Avoid contamination with urine', 'Collect in provided container'],
    category: 'Stool Tests',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'routine'
  },
  {
    testName: 'Stool Culture & Sensitivity',
    testType: 'Stool Test',
    commonInstructions: ['Fresh sample required', 'Avoid contamination with urine', 'Collect in sterile container'],
    category: 'Stool Tests',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'routine'
  },

  // Specialized Tests
  {
    testName: 'COVID-19 RT-PCR',
    testType: 'Blood Test',
    commonInstructions: ['Nasal swab required', 'Avoid eating/drinking 30 minutes before', 'Wear mask during collection'],
    category: 'Infectious Diseases',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'urgent'
  },
  {
    testName: 'Rapid Antigen Test',
    testType: 'Blood Test',
    commonInstructions: ['Nasal swab required', 'Results available in 15-30 minutes', 'Wear mask during collection'],
    category: 'Infectious Diseases',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'urgent'
  },
  {
    testName: 'Pregnancy Test (Beta HCG)',
    testType: 'Blood Test',
    commonInstructions: ['Fasting not required', 'Can be done at any time', 'More accurate than urine test'],
    category: 'Pregnancy Tests',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'routine'
  },
  {
    testName: 'Vitamin D3',
    testType: 'Blood Test',
    commonInstructions: ['Fasting not required', 'Can be done at any time'],
    category: 'Vitamins & Minerals',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'routine'
  },
  {
    testName: 'Vitamin B12',
    testType: 'Blood Test',
    commonInstructions: ['Fasting not required', 'Can be done at any time'],
    category: 'Vitamins & Minerals',
    isActive: true,
    fastingRequired: false,
    defaultUrgency: 'routine'
  }
];

// Function to seed medical test templates
export const seedMedicalTestTemplates = async () => {
  try {
    const { medicalTestService } = await import('@/services/medicalTestService');
    
    for (const template of commonMedicalTestTemplates) {
      try {
        await medicalTestService.createMedicalTestTemplate(template);
        console.log(`Created template: ${template.testName}`);
      } catch (error) {
        console.error(`Error creating template ${template.testName}:`, error);
      }
    }
    
    console.log('Medical test templates seeded successfully');
  } catch (error) {
    console.error('Error seeding medical test templates:', error);
  }
};

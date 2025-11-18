// src/services/medicalTestService.ts
import { database } from '@/lib/firebase';
import { ref, push, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { MedicalTest, MedicalTestTemplate } from '@/types/prescription';

const MEDICAL_TEST_TEMPLATES_COLLECTION = 'medicalTestTemplates';
const MEDICAL_TESTS_HISTORY_COLLECTION = 'medicalTestsHistory';

export const medicalTestService = {
  // Medical Test Templates Management
  async createMedicalTestTemplate(templateData: Omit<MedicalTestTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const templateRef = push(ref(database, MEDICAL_TEST_TEMPLATES_COLLECTION));
    
    const now = Date.now();
    const template: MedicalTestTemplate = {
      ...templateData,
      id: templateRef.key!,
      createdAt: now,
      updatedAt: now
    };
    
    await update(templateRef, template);
    return templateRef.key!;
  },

  async getMedicalTestTemplates(): Promise<MedicalTestTemplate[]> {
    const templatesRef = ref(database, MEDICAL_TEST_TEMPLATES_COLLECTION);
    const snapshot = await get(templatesRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    return Object.entries(snapshot.val())
      .map(([id, data]: [string, any]) => ({
        ...data,
        id,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      }))
      .filter(template => template.isActive)
      .sort((a, b) => a.testName.localeCompare(b.testName));
  },

  async updateMedicalTestTemplate(templateId: string, updates: Partial<MedicalTestTemplate>): Promise<void> {
    const templateRef = ref(database, `${MEDICAL_TEST_TEMPLATES_COLLECTION}/${templateId}`);
    
    const updateData = {
      ...updates,
      updatedAt: Date.now()
    };
    
    await update(templateRef, updateData);
  },

  async deleteMedicalTestTemplate(templateId: string): Promise<void> {
    const templateRef = ref(database, `${MEDICAL_TEST_TEMPLATES_COLLECTION}/${templateId}`);
    await update(templateRef, { isActive: false, updatedAt: Date.now() });
  },

  // Medical Test History - for suggestions based on past prescriptions
  async saveMedicalTestHistory(patientId: string, doctorId: string, medicalTests: MedicalTest[]): Promise<void> {
    const historyRef = push(ref(database, MEDICAL_TEST_HISTORY_COLLECTION));
    
    const historyEntry = {
      patientId,
      doctorId,
      medicalTests,
      createdAt: Date.now()
    };
    
    await update(historyRef, historyEntry);
  },

  async getMedicalTestHistoryByPatient(patientId: string): Promise<MedicalTest[]> {
    const historyRef = ref(database, MEDICAL_TESTS_HISTORY_COLLECTION);
    const historyQuery = query(historyRef, orderByChild('patientId'), equalTo(patientId));
    
    const snapshot = await get(historyQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const allTests: MedicalTest[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      if (data.medicalTests && Array.isArray(data.medicalTests)) {
        allTests.push(...data.medicalTests);
      }
    });
    
    // Remove duplicates based on test name and return unique tests
    const uniqueTests = allTests.reduce((acc: MedicalTest[], current) => {
      const exists = acc.find(test => test.testName === current.testName);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);
    
    return uniqueTests.sort((a, b) => a.testName.localeCompare(b.testName));
  },

  async getMedicalTestHistoryByDoctor(doctorId: string): Promise<MedicalTest[]> {
    const historyRef = ref(database, MEDICAL_TESTS_HISTORY_COLLECTION);
    const historyQuery = query(historyRef, orderByChild('doctorId'), equalTo(doctorId));
    
    const snapshot = await get(historyQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const allTests: MedicalTest[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      if (data.medicalTests && Array.isArray(data.medicalTests)) {
        allTests.push(...data.medicalTests);
      }
    });
    
    // Remove duplicates based on test name and return unique tests
    const uniqueTests = allTests.reduce((acc: MedicalTest[], current) => {
      const exists = acc.find(test => test.testName === current.testName);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);
    
    return uniqueTests.sort((a, b) => a.testName.localeCompare(b.testName));
  },

  // Get suggested medical tests based on patient history and doctor preferences
  async getSuggestedMedicalTests(patientId: string, doctorId: string): Promise<MedicalTest[]> {
    try {
      // Get patient-specific history
      const patientHistory = await this.getMedicalTestHistoryByPatient(patientId);
      
      // Get doctor's common tests
      const doctorHistory = await this.getMedicalTestHistoryByDoctor(doctorId);
      
      // Combine and prioritize patient history over doctor history
      const suggestedTests = [...patientHistory];
      
      // Add doctor's common tests that aren't already in patient history
      doctorHistory.forEach(doctorTest => {
        const exists = suggestedTests.find(test => test.testName === doctorTest.testName);
        if (!exists) {
          suggestedTests.push(doctorTest);
        }
      });
      
      return suggestedTests.slice(0, 20); // Limit to 20 suggestions
    } catch (error) {
      console.error('Error getting suggested medical tests:', error);
      return [];
    }
  },

  // Generate unique ID for medical tests
  generateMedicalTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Search medical test templates by name
  async searchMedicalTestTemplates(searchTerm: string): Promise<MedicalTestTemplate[]> {
    const templates = await this.getMedicalTestTemplates();
    
    if (!searchTerm.trim()) {
      return templates;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return templates.filter(template => 
      template.testName.toLowerCase().includes(searchLower) ||
      template.testType.toLowerCase().includes(searchLower) ||
      (template.category && template.category.toLowerCase().includes(searchLower))
    );
  }
};

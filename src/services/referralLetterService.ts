// src/services/referralLetterService.ts

import { database } from '@/lib/firebase';
import { ref, set, update, remove, get, push, query, orderByChild, equalTo, startAt, endAt } from 'firebase/database';
import { ReferralLetter, ReferralStatus, ReferralLetterSearchFilters } from '@/types/referralLetter';
import { Patient } from '@/types/appointment';
import { ReferralDoctor } from '@/types/referralDoctor';
import { staffService } from './staffService';
import { getAuth } from 'firebase/auth';

const COLLECTION = 'referralLetters';

export const referralLetterService = {
  async create(referralLetter: Omit<ReferralLetter, 'id' | 'createdAt' | 'updatedAt'>, userId?: string) {
    const now = Date.now();

    // Get current user info for createdBy field
    let createdByInfo = null;
    if (userId) {
      try {
        let staffUser = await staffService.getStaffById(userId);
        
        // If user not found in staff collection, try to sync from auth
        if (!staffUser) {
          const auth = getAuth();
          const authUser = auth.currentUser;
          if (authUser && authUser.uid === userId) {
            staffUser = await staffService.syncAuthUserToStaff(
              userId, 
              authUser.email || 'unknown@email.com',
              authUser.displayName || undefined
            );
          }
        }
        
        if (staffUser) {
          createdByInfo = {
            uid: userId,
            email: staffUser.email,
            role: staffUser.role,
            displayName: staffUser.displayName
          };
        }
      } catch (error) {
        console.error('Error getting staff user info:', error);
      }
    }

    // Build referral letter data and filter out undefined values
    const referralLetterData: any = {
      patientId: referralLetter.patientId,
      patientName: referralLetter.patientName,
      patientContact: referralLetter.patientContact,
      referralDoctorId: referralLetter.referralDoctorId,
      referralDoctorName: referralLetter.referralDoctorName,
      referralDoctorSpecialty: referralLetter.referralDoctorSpecialty,
      referralDoctorQualifications: referralLetter.referralDoctorQualifications,
      referralNote: referralLetter.referralNote,
      referralDate: referralLetter.referralDate,
      status: referralLetter.status,
      createdAt: now,
      updatedAt: now
    };

    // Add optional fields (including null values)
    if (referralLetter.patientAge !== undefined) {
      referralLetterData.patientAge = referralLetter.patientAge;
    }
    
    if (referralLetter.patientGender !== undefined) {
      referralLetterData.patientGender = referralLetter.patientGender;
    }
    
    if (referralLetter.referralDoctorTitles !== undefined) {
      referralLetterData.referralDoctorTitles = referralLetter.referralDoctorTitles;
    }
    
    if (referralLetter.referralDoctorHospital !== undefined) {
      referralLetterData.referralDoctorHospital = referralLetter.referralDoctorHospital;
    }
    
    if (referralLetter.referralDoctorContact !== undefined) {
      referralLetterData.referralDoctorContact = referralLetter.referralDoctorContact;
    }
    
    if (referralLetter.referralDoctorEmail !== undefined) {
      referralLetterData.referralDoctorEmail = referralLetter.referralDoctorEmail;
    }
    
    if (referralLetter.referralDoctorAddress !== undefined) {
      referralLetterData.referralDoctorAddress = referralLetter.referralDoctorAddress;
    }
    
    if (createdByInfo !== null) {
      referralLetterData.createdBy = createdByInfo;
    }

    console.log(`Creating referral letter for patient ${referralLetter.patientName} to doctor ${referralLetter.referralDoctorName}`);

    // Generate a new key and set the data
    const newReferralLetterRef = push(ref(database, COLLECTION));
    await set(newReferralLetterRef, referralLetterData);

    console.log(`Referral letter created with ID: ${newReferralLetterRef.key}`);

    return { ...referralLetterData, id: newReferralLetterRef.key };
  },

  async update(id: string, referralLetter: Partial<Omit<ReferralLetter, 'id' | 'createdAt'>>) {
    const referralLetterRef = ref(database, `${COLLECTION}/${id}`);
    
    const updateData = {
      ...referralLetter,
      updatedAt: Date.now()
    };
    
    await update(referralLetterRef, updateData);
    return { ...referralLetter, id };
  },

  async delete(id: string) {
    const referralLetterRef = ref(database, `${COLLECTION}/${id}`);
    await remove(referralLetterRef);
  },

  async getById(id: string): Promise<ReferralLetter | null> {
    const referralLetterRef = ref(database, `${COLLECTION}/${id}`);
    const snapshot = await get(referralLetterRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.val();
    return {
      ...data,
      id: id,
      appointmentId: data.appointmentId || undefined,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    };
  },

  async getAll(): Promise<ReferralLetter[]> {
    const referralLettersRef = ref(database, COLLECTION);
    const snapshot = await get(referralLettersRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const referralLetters: ReferralLetter[] = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      referralLetters.push({
        id: childSnapshot.key,
        appointmentId: data.appointmentId || undefined,
        patientId: data.patientId,
        patientName: data.patientName,
        patientContact: data.patientContact,
        patientAge: data.patientAge || null,
        patientGender: data.patientGender || null,
        referralDoctorId: data.referralDoctorId,
        referralDoctorName: data.referralDoctorName,
        referralDoctorSpecialty: data.referralDoctorSpecialty,
        referralDoctorQualifications: data.referralDoctorQualifications,
        referralDoctorTitles: data.referralDoctorTitles || null,
        referralDoctorHospital: data.referralDoctorHospital || null,
        referralDoctorContact: data.referralDoctorContact || null,
        referralDoctorEmail: data.referralDoctorEmail || null,
        referralDoctorAddress: data.referralDoctorAddress || null,
        referralNote: data.referralNote,
        referralDate: data.referralDate,
        status: data.status,
        createdBy: data.createdBy || null,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    // Sort by referral date (newest first)
    return referralLetters.sort((a, b) => b.referralDate.localeCompare(a.referralDate));
  },

  async getByPatient(patientId: string): Promise<ReferralLetter[]> {
    const referralLettersRef = ref(database, COLLECTION);
    const patientQuery = query(referralLettersRef, orderByChild('patientId'), equalTo(patientId));
    const snapshot = await get(patientQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const referralLetters: ReferralLetter[] = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      referralLetters.push({
        id: childSnapshot.key,
        appointmentId: data.appointmentId || undefined,
        patientId: data.patientId,
        patientName: data.patientName,
        patientContact: data.patientContact,
        patientAge: data.patientAge || null,
        patientGender: data.patientGender || null,
        referralDoctorId: data.referralDoctorId,
        referralDoctorName: data.referralDoctorName,
        referralDoctorSpecialty: data.referralDoctorSpecialty,
        referralDoctorQualifications: data.referralDoctorQualifications,
        referralDoctorTitles: data.referralDoctorTitles || null,
        referralDoctorHospital: data.referralDoctorHospital || null,
        referralDoctorContact: data.referralDoctorContact || null,
        referralDoctorEmail: data.referralDoctorEmail || null,
        referralDoctorAddress: data.referralDoctorAddress || null,
        referralNote: data.referralNote,
        referralDate: data.referralDate,
        status: data.status,
        createdBy: data.createdBy || null,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    // Sort by referral date (newest first)
    return referralLetters.sort((a, b) => b.referralDate.localeCompare(a.referralDate));
  },

  async getReferralLetterByAppointmentId(appointmentId: string): Promise<ReferralLetter | null> {
    const referralLettersRef = ref(database, COLLECTION);
    const appointmentQuery = query(referralLettersRef, orderByChild('appointmentId'), equalTo(appointmentId));
    const snapshot = await get(appointmentQuery);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    // Get the first matching referral letter (should only be one per appointment)
    let referralLetter: ReferralLetter | null = null;
    snapshot.forEach((childSnapshot) => {
      if (!referralLetter) {
        const data = childSnapshot.val();
        referralLetter = {
          id: childSnapshot.key,
          appointmentId: data.appointmentId || undefined,
          patientId: data.patientId,
          patientName: data.patientName,
          patientContact: data.patientContact,
          patientAge: data.patientAge || null,
          patientGender: data.patientGender || null,
          referralDoctorId: data.referralDoctorId,
          referralDoctorName: data.referralDoctorName,
          referralDoctorSpecialty: data.referralDoctorSpecialty,
          referralDoctorQualifications: data.referralDoctorQualifications,
          referralDoctorTitles: data.referralDoctorTitles || null,
          referralDoctorHospital: data.referralDoctorHospital || null,
          referralDoctorContact: data.referralDoctorContact || null,
          referralDoctorEmail: data.referralDoctorEmail || null,
          referralDoctorAddress: data.referralDoctorAddress || null,
          referralNote: data.referralNote,
          referralDate: data.referralDate,
          status: data.status,
          createdBy: data.createdBy || null,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
        };
      }
    });
    
    return referralLetter;
  },

  async getByReferralDoctor(referralDoctorId: string): Promise<ReferralLetter[]> {
    const referralLettersRef = ref(database, COLLECTION);
    const doctorQuery = query(referralLettersRef, orderByChild('referralDoctorId'), equalTo(referralDoctorId));
    const snapshot = await get(doctorQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const referralLetters: ReferralLetter[] = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      referralLetters.push({
        id: childSnapshot.key,
        appointmentId: data.appointmentId || undefined,
        patientId: data.patientId,
        patientName: data.patientName,
        patientContact: data.patientContact,
        patientAge: data.patientAge || null,
        patientGender: data.patientGender || null,
        referralDoctorId: data.referralDoctorId,
        referralDoctorName: data.referralDoctorName,
        referralDoctorSpecialty: data.referralDoctorSpecialty,
        referralDoctorQualifications: data.referralDoctorQualifications,
        referralDoctorTitles: data.referralDoctorTitles || null,
        referralDoctorHospital: data.referralDoctorHospital || null,
        referralDoctorContact: data.referralDoctorContact || null,
        referralDoctorEmail: data.referralDoctorEmail || null,
        referralDoctorAddress: data.referralDoctorAddress || null,
        referralNote: data.referralNote,
        referralDate: data.referralDate,
        status: data.status,
        createdBy: data.createdBy || null,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    // Sort by referral date (newest first)
    return referralLetters.sort((a, b) => b.referralDate.localeCompare(a.referralDate));
  },

  async getByDateRange(startDate: string, endDate: string): Promise<ReferralLetter[]> {
    const referralLettersRef = ref(database, COLLECTION);
    const dateRangeQuery = query(
      referralLettersRef, 
      orderByChild('referralDate'), 
      startAt(startDate), 
      endAt(endDate)
    );
    const snapshot = await get(dateRangeQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const referralLetters: ReferralLetter[] = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      referralLetters.push({
        id: childSnapshot.key,
        appointmentId: data.appointmentId || undefined,
        patientId: data.patientId,
        patientName: data.patientName,
        patientContact: data.patientContact,
        patientAge: data.patientAge || null,
        patientGender: data.patientGender || null,
        referralDoctorId: data.referralDoctorId,
        referralDoctorName: data.referralDoctorName,
        referralDoctorSpecialty: data.referralDoctorSpecialty,
        referralDoctorQualifications: data.referralDoctorQualifications,
        referralDoctorTitles: data.referralDoctorTitles || null,
        referralDoctorHospital: data.referralDoctorHospital || null,
        referralDoctorContact: data.referralDoctorContact || null,
        referralDoctorEmail: data.referralDoctorEmail || null,
        referralDoctorAddress: data.referralDoctorAddress || null,
        referralNote: data.referralNote,
        referralDate: data.referralDate,
        status: data.status,
        createdBy: data.createdBy || null,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    // Sort by referral date (newest first)
    return referralLetters.sort((a, b) => b.referralDate.localeCompare(a.referralDate));
  },

  async searchReferralLetters(filters: ReferralLetterSearchFilters): Promise<ReferralLetter[]> {
    const allReferralLetters = await this.getAll();
    
    return allReferralLetters.filter(letter => {
      // Filter by patient name
      if (filters.patientName && !letter.patientName.toLowerCase().includes(filters.patientName.toLowerCase())) {
        return false;
      }
      
      // Filter by patient contact
      if (filters.patientContact && !letter.patientContact.includes(filters.patientContact)) {
        return false;
      }
      
      // Filter by referral doctor name
      if (filters.referralDoctorName && !letter.referralDoctorName.toLowerCase().includes(filters.referralDoctorName.toLowerCase())) {
        return false;
      }
      
      // Filter by specialty
      if (filters.specialty && !letter.referralDoctorSpecialty.toLowerCase().includes(filters.specialty.toLowerCase())) {
        return false;
      }
      
      // Filter by status
      if (filters.status && letter.status !== filters.status) {
        return false;
      }
      
      // Filter by date range
      if (filters.dateFrom && letter.referralDate < filters.dateFrom) {
        return false;
      }
      
      if (filters.dateTo && letter.referralDate > filters.dateTo) {
        return false;
      }
      
      return true;
    });
  },

  async updateStatus(id: string, status: ReferralStatus) {
    const referralLetterRef = ref(database, `${COLLECTION}/${id}`);
    
    const updateData = {
      status,
      updatedAt: Date.now()
    };
    
    await update(referralLetterRef, updateData);
    return { id, status };
  },

  // Helper method to create referral letter with patient and doctor data
  async createReferralLetterWithData(
    patient: Patient,
    referralDoctor: ReferralDoctor,
    referralNote: string,
    referralDate: string,
    userId?: string
  ): Promise<ReferralLetter> {
    const referralLetterData: Omit<ReferralLetter, 'id' | 'createdAt' | 'updatedAt'> = {
      patientId: patient.id!,
      patientName: patient.name,
      patientContact: patient.contactNumber,
      patientAge: patient.age || null,
      patientGender: patient.gender || null,
      referralDoctorId: referralDoctor.id!,
      referralDoctorName: referralDoctor.name,
      referralDoctorSpecialty: referralDoctor.specialty,
      referralDoctorQualifications: referralDoctor.qualifications,
      referralDoctorTitles: referralDoctor.titles || null,
      referralDoctorHospital: referralDoctor.hospital || null,
      referralDoctorContact: referralDoctor.contactNumber || null,
      referralDoctorEmail: referralDoctor.email || null,
      referralDoctorAddress: referralDoctor.address || null,
      referralNote,
      referralDate,
      status: 'pending'
    };

    return await this.create(referralLetterData, userId);
  }
};

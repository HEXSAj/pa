// src/services/referralDoctorService.ts

import { database } from '@/lib/firebase';
import { ref, set, update, remove, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { ReferralDoctor } from '@/types/referralDoctor';

const COLLECTION = 'referralDoctors';

export class ReferralDoctorExistsError extends Error {
  constructor(name: string) {
    super(`A referral doctor with the name "${name}" already exists.`);
    this.name = 'ReferralDoctorExistsError';
  }
}

export const referralDoctorService = {
  async checkNameExists(name: string, excludeId?: string): Promise<boolean> {
    // Query for referral doctors with the same name
    const nameQuery = query(ref(database, COLLECTION), orderByChild('name'), equalTo(name));
    const snapshot = await get(nameQuery);
    
    if (!snapshot.exists()) {
      return false;
    }
    
    // If we're updating a referral doctor, exclude the current one from the check
    if (excludeId) {
      let foundMatch = false;
      snapshot.forEach((childSnapshot) => {
        if (childSnapshot.key !== excludeId) {
          foundMatch = true;
        }
      });
      return foundMatch;
    }
    
    return true;
  },

  async create(referralDoctor: Omit<ReferralDoctor, 'id' | 'createdAt' | 'updatedAt'>) {
    // Check if referral doctor with same name already exists
    const exists = await this.checkNameExists(referralDoctor.name);
    if (exists) {
      throw new ReferralDoctorExistsError(referralDoctor.name);
    }

    const now = Date.now();
    // Generate a new unique key
    const newReferralDoctorRef = push(ref(database, COLLECTION));
    
    // Set data using the generated key
    await set(newReferralDoctorRef, {
      name: referralDoctor.name,
      specialty: referralDoctor.specialty,
      qualifications: referralDoctor.qualifications,
      titles: referralDoctor.titles || '',
      contactNumber: referralDoctor.contactNumber || '',
      email: referralDoctor.email || '',
      hospital: referralDoctor.hospital || '',
      address: referralDoctor.address || '',
      notes: referralDoctor.notes || '',
      isActive: referralDoctor.isActive,
      createdAt: now,
      updatedAt: now
    });
    
    return newReferralDoctorRef;
  },

  async update(id: string, referralDoctor: Partial<Omit<ReferralDoctor, 'id' | 'createdAt'>>) {
    // If we're updating the name, check if that name already exists (excluding this referral doctor)
    if (referralDoctor.name) {
      const exists = await this.checkNameExists(referralDoctor.name, id);
      if (exists) {
        throw new ReferralDoctorExistsError(referralDoctor.name);
      }
    }

    const referralDoctorRef = ref(database, `${COLLECTION}/${id}`);
    
    // Create update object with only the fields that need updating
    const updates: any = {
      updatedAt: Date.now()
    };
    
    if (referralDoctor.name !== undefined) updates.name = referralDoctor.name;
    if (referralDoctor.specialty !== undefined) updates.specialty = referralDoctor.specialty;
    if (referralDoctor.qualifications !== undefined) updates.qualifications = referralDoctor.qualifications;
    if (referralDoctor.titles !== undefined) updates.titles = referralDoctor.titles;
    if (referralDoctor.contactNumber !== undefined) updates.contactNumber = referralDoctor.contactNumber;
    if (referralDoctor.email !== undefined) updates.email = referralDoctor.email;
    if (referralDoctor.hospital !== undefined) updates.hospital = referralDoctor.hospital;
    if (referralDoctor.address !== undefined) updates.address = referralDoctor.address;
    if (referralDoctor.notes !== undefined) updates.notes = referralDoctor.notes;
    if (referralDoctor.isActive !== undefined) updates.isActive = referralDoctor.isActive;
    
    return update(referralDoctorRef, updates);
  },

  async delete(id: string) {
    const referralDoctorRef = ref(database, `${COLLECTION}/${id}`);
    return remove(referralDoctorRef);
  },

  async getAll() {
    const referralDoctorsRef = ref(database, COLLECTION);
    const snapshot = await get(referralDoctorsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const referralDoctors: ReferralDoctor[] = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      referralDoctors.push({
        id: childSnapshot.key,
        name: data.name,
        specialty: data.specialty,
        qualifications: data.qualifications,
        titles: data.titles || '',
        contactNumber: data.contactNumber || '',
        email: data.email || '',
        hospital: data.hospital || '',
        address: data.address || '',
        notes: data.notes || '',
        isActive: data.isActive,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      });
    });
    
    return referralDoctors.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getById(id: string) {
    const referralDoctorRef = ref(database, `${COLLECTION}/${id}`);
    const snapshot = await get(referralDoctorRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        id: snapshot.key,
        name: data.name,
        specialty: data.specialty,
        qualifications: data.qualifications,
        titles: data.titles || '',
        contactNumber: data.contactNumber || '',
        email: data.email || '',
        hospital: data.hospital || '',
        address: data.address || '',
        notes: data.notes || '',
        isActive: data.isActive,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      } as ReferralDoctor;
    }
    
    return null;
  },

  async getBySpecialty(specialty: string) {
    const referralDoctorsRef = ref(database, COLLECTION);
    const specialtyQuery = query(referralDoctorsRef, orderByChild('specialty'), equalTo(specialty));
    const snapshot = await get(specialtyQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const referralDoctors: ReferralDoctor[] = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      referralDoctors.push({
        id: childSnapshot.key,
        name: data.name,
        specialty: data.specialty,
        qualifications: data.qualifications,
        titles: data.titles || '',
        contactNumber: data.contactNumber || '',
        email: data.email || '',
        hospital: data.hospital || '',
        address: data.address || '',
        notes: data.notes || '',
        isActive: data.isActive,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      });
    });
    
    return referralDoctors.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getActiveReferralDoctors() {
    const referralDoctorsRef = ref(database, COLLECTION);
    const activeQuery = query(referralDoctorsRef, orderByChild('isActive'), equalTo(true));
    const snapshot = await get(activeQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const referralDoctors: ReferralDoctor[] = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      referralDoctors.push({
        id: childSnapshot.key,
        name: data.name,
        specialty: data.specialty,
        qualifications: data.qualifications,
        titles: data.titles || '',
        contactNumber: data.contactNumber || '',
        email: data.email || '',
        hospital: data.hospital || '',
        address: data.address || '',
        notes: data.notes || '',
        isActive: data.isActive,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      });
    });
    
    return referralDoctors.sort((a, b) => a.name.localeCompare(b.name));
  }
};

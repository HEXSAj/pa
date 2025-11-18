// src/app/dashboard/referral-doctors/EditReferralDoctorModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { referralDoctorService, ReferralDoctorExistsError } from '@/services/referralDoctorService';
import { ReferralDoctor, ReferralDoctorFormData } from '@/types/referralDoctor';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface EditReferralDoctorModalProps {
  referralDoctor: ReferralDoctor;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditReferralDoctorModal({ 
  referralDoctor, 
  onClose, 
  onSuccess 
}: EditReferralDoctorModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ReferralDoctorFormData>({
    name: '',
    specialty: '',
    qualifications: '',
    titles: '',
    contactNumber: '',
    email: '',
    hospital: '',
    address: '',
    notes: ''
  });
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (referralDoctor) {
      setFormData({
        name: referralDoctor.name || '',
        specialty: referralDoctor.specialty || '',
        qualifications: referralDoctor.qualifications || '',
        titles: referralDoctor.titles || '',
        contactNumber: referralDoctor.contactNumber || '',
        email: referralDoctor.email || '',
        hospital: referralDoctor.hospital || '',
        address: referralDoctor.address || '',
        notes: referralDoctor.notes || ''
      });
      setIsActive(referralDoctor.isActive);
    }
  }, [referralDoctor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.specialty.trim() || !formData.qualifications.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await referralDoctorService.update(referralDoctor.id!, {
        ...formData,
        isActive
      });
      
      toast.success('Referral doctor updated successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating referral doctor:', error);
      if (error instanceof ReferralDoctorExistsError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update referral doctor');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ReferralDoctorFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Referral Doctor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Doctor Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter doctor's full name"
                required
              />
            </div>

            {/* Titles */}
            <div className="space-y-2">
              <Label htmlFor="titles">Titles</Label>
              <Input
                id="titles"
                value={formData.titles}
                onChange={(e) => handleInputChange('titles', e.target.value)}
                placeholder="Dr., Prof., etc."
              />
            </div>

            {/* Specialty */}
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty *</Label>
              <Input
                id="specialty"
                value={formData.specialty}
                onChange={(e) => handleInputChange('specialty', e.target.value)}
                placeholder="Cardiology, Neurology, etc."
                required
              />
            </div>

            {/* Hospital */}
            <div className="space-y-2">
              <Label htmlFor="hospital">Hospital/Clinic</Label>
              <Input
                id="hospital"
                value={formData.hospital}
                onChange={(e) => handleInputChange('hospital', e.target.value)}
                placeholder="Hospital or clinic name"
              />
            </div>

            {/* Contact Number */}
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                placeholder="Phone number"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Email address"
              />
            </div>
          </div>

          {/* Qualifications */}
          <div className="space-y-2">
            <Label htmlFor="qualifications">Qualifications *</Label>
            <Textarea
              id="qualifications"
              value={formData.qualifications}
              onChange={(e) => handleInputChange('qualifications', e.target.value)}
              placeholder="MBBS, MD, PhD, etc."
              rows={3}
              required
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Full address"
              rows={2}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes or information"
              rows={2}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Referral Doctor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// src/app/dashboard/referral-letters/ReferralLetterDetailsModal.tsx
'use client';

import { useState } from 'react';
import { referralLetterService } from '@/services/referralLetterService';
import { ReferralLetter, ReferralStatus } from '@/types/referralLetter';
import { useAuth } from '@/context/AuthContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, X, User, Stethoscope, Phone, Mail, Building, MapPin, Calendar, FileText, Clock, CheckCircle, Eye, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatPatientAge } from '@/utils/ageUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getReferralStatusColor, getReferralStatusLabel, formatReferralDate } from '@/types/referralLetter';

interface ReferralLetterDetailsModalProps {
  referralLetter: ReferralLetter;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ReferralLetterDetailsModal({ 
  referralLetter, 
  onClose, 
  onUpdate 
}: ReferralLetterDetailsModalProps) {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [referralNote, setReferralNote] = useState(referralLetter.referralNote);
  const [status, setStatus] = useState<ReferralStatus>(referralLetter.status);

  const handleUpdateStatus = async () => {
    try {
      setLoading(true);
      await referralLetterService.updateStatus(referralLetter.id!, status);
      toast.success('Status updated successfully');
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async () => {
    try {
      setLoading(true);
      await referralLetterService.update(referralLetter.id!, {
        referralNote
      });
      toast.success('Referral note updated successfully');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update referral note');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ReferralStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'sent':
        return <CheckCircle className="h-4 w-4" />;
      case 'received':
        return <Eye className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Referral Letter Details
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-4 top-4"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge 
                variant="outline" 
                className={`${getReferralStatusColor(referralLetter.status)} flex items-center gap-1`}
              >
                {getStatusIcon(referralLetter.status)}
                {getReferralStatusLabel(referralLetter.status)}
              </Badge>
              <span className="text-sm text-gray-500">
                Created: {formatReferralDate(referralLetter.referralDate)}
              </span>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Select value={status} onValueChange={(value) => setStatus(value as ReferralStatus)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleUpdateStatus}
                  disabled={loading || status === referralLetter.status}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Status
                </Button>
              </div>
            )}
          </div>

          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Name</Label>
                  <p className="font-medium">{referralLetter.patientName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Contact Number</Label>
                  <p className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {referralLetter.patientContact}
                  </p>
                </div>
                {referralLetter.patientAge && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Age</Label>
                    <p>{formatPatientAge({ age: referralLetter.patientAge })}</p>
                  </div>
                )}
                {referralLetter.patientGender && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Gender</Label>
                    <p className="capitalize">{referralLetter.patientGender}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Referral Doctor Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Referral Doctor Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Doctor Name</Label>
                  <p className="font-medium">
                    {referralLetter.referralDoctorTitles && (
                      <span className="text-sm text-gray-500 mr-1">{referralLetter.referralDoctorTitles}</span>
                    )}
                    {referralLetter.referralDoctorName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Specialty</Label>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {referralLetter.referralDoctorSpecialty}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Qualifications</Label>
                  <p className="text-sm">{referralLetter.referralDoctorQualifications}</p>
                </div>
                {referralLetter.referralDoctorHospital && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Hospital</Label>
                    <p className="flex items-center gap-1">
                      <Building className="h-4 w-4 text-gray-400" />
                      {referralLetter.referralDoctorHospital}
                    </p>
                  </div>
                )}
                {referralLetter.referralDoctorContact && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Contact Number</Label>
                    <p className="flex items-center gap-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {referralLetter.referralDoctorContact}
                    </p>
                  </div>
                )}
                {referralLetter.referralDoctorEmail && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="flex items-center gap-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {referralLetter.referralDoctorEmail}
                    </p>
                  </div>
                )}
                {referralLetter.referralDoctorAddress && (
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-600">Address</Label>
                    <p className="flex items-start gap-1">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      {referralLetter.referralDoctorAddress}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Referral Note */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Referral Note
                </CardTitle>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={referralNote}
                    onChange={(e) => setReferralNote(e.target.value)}
                    rows={6}
                    placeholder="Enter referral notes..."
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setReferralNote(referralLetter.referralNote);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateNote}
                      disabled={loading || referralNote === referralLetter.referralNote}
                    >
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm">
                  {referralLetter.referralNote}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Referral Date</Label>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatReferralDate(referralLetter.referralDate)}
                  </p>
                </div>
                {referralLetter.createdBy && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Created By</Label>
                    <p>{referralLetter.createdBy.displayName || referralLetter.createdBy.email}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created At</Label>
                  <p>{referralLetter.createdAt ? new Date(referralLetter.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Last Updated</Label>
                  <p>{referralLetter.updatedAt ? new Date(referralLetter.updatedAt).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

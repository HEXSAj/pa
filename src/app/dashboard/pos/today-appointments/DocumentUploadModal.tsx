'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  X, 
  FileText, 
  Trash2, 
  Download, 
  Loader2,
  Image as ImageIcon,
  File,
  Calendar,
  User,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { Appointment, AppointmentDocument } from '@/types/appointment';
import { imageUploadService } from '@/services/imageUploadService';
import { appointmentService } from '@/services/appointmentService';
import { format } from 'date-fns';

interface DocumentUploadModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DocumentUploadModal({
  appointment,
  onClose,
  onSuccess
}: DocumentUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = imageUploadService.validateDocumentFile(file);
      if (!validation.isValid) {
        toast.error('Invalid file', {
          description: validation.error
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !appointment.id) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      
      // Upload file to Firebase Storage
      const document = await imageUploadService.uploadAppointmentDocument(
        selectedFile,
        appointment.id,
        description
      );

      // Add document to appointment
      await appointmentService.addDocumentToAppointment(appointment.id, document);

      toast.success('Document uploaded successfully');
      
      // Reset form
      setSelectedFile(null);
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Call success callback to refresh appointment data
      onSuccess();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (document: AppointmentDocument) => {
    if (!appointment.id || !document.id) {
      return;
    }

    if (!confirm(`Are you sure you want to delete "${document.originalName}"?`)) {
      return;
    }

    try {
      setDeleting(document.id);
      
      // Delete from Firebase Storage
      await imageUploadService.deleteAppointmentDocument(
        appointment.id,
        document.fileName
      );

      // Remove from appointment
      await appointmentService.removeDocumentFromAppointment(
        appointment.id,
        document.id
      );

      toast.success('Document deleted successfully');
      onSuccess();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (document: AppointmentDocument) => {
    window.open(document.downloadURL, '_blank');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-6 w-6 text-indigo-500" />;
    }
    if (mimeType === 'application/pdf') {
      return <FileText className="h-6 w-6 text-red-500" />;
    }
    return <File className="h-6 w-6 text-slate-500" />;
  };

  const getFileTypeColor = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    }
    if (mimeType === 'application/pdf') {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const documents = appointment.documents || [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:hidden">
        {/* Header with gradient */}
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-t-lg flex-shrink-0 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4 h-10 w-10 rounded-full bg-red-500 hover:bg-red-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
            title="Close"
          >
            <X className="h-5 w-5" />
          </Button>
          <DialogTitle className="flex items-center gap-3 text-white pr-10">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl font-bold">Appointment Documents</div>
              <DialogDescription className="text-indigo-100 mt-1 flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                <span>{appointment.patientName}</span>
                <span className="mx-1">•</span>
                <Calendar className="h-3.5 w-3.5" />
                <span>{appointment.date}</span>
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full px-6 py-4">
            <div className="space-y-6 pr-4">
            {/* Upload Section */}
            <Card className="w-full border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 shadow-sm">
              <CardContent className="p-5 w-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Upload className="h-5 w-5 text-indigo-600" />
                  </div>
                  <Label className="text-base font-bold text-slate-800">Upload New Document</Label>
                </div>
                <div className="space-y-4 w-full">
                  <div
                    className={`w-full border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-400 transition-all duration-200 bg-white/50 box-border ${
                      selectedFile ? 'p-4 text-left' : 'p-8 text-center'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
                      className="hidden"
                    />
                    {selectedFile ? (
                      <div className="w-full">
                        <div className="flex items-start gap-3 w-full">
                          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex-shrink-0 mt-0.5">
                            <FileText className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-semibold text-slate-800 break-words break-all">{selectedFile.name}</p>
                            <p className="text-xs text-slate-600 mt-1">{formatFileSize(selectedFile.size)}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 flex-shrink-0 mt-0.5"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-center mb-3">
                          <div className="p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full">
                            <Upload className="h-10 w-10 text-indigo-600" />
                          </div>
                        </div>
                        <p className="text-base font-semibold text-slate-700 mb-1">
                          Click to select a file or drag and drop
                        </p>
                        <p className="text-sm text-slate-500">
                          PDF, Images, DOC, DOCX, XLS, XLSX, TXT, CSV
                        </p>
                        <Badge variant="outline" className="mt-2 bg-white border-indigo-200 text-indigo-700">
                          Maximum file size: 10MB
                        </Badge>
                      </>
                    )}
                  </div>

                  {selectedFile && (
                    <div className="w-full space-y-2 pt-3 border-t border-indigo-200">
                      <Label htmlFor="description" className="text-sm font-semibold text-slate-700">
                        Description <span className="text-slate-400 font-normal">(Optional)</span>
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a description for this document..."
                        rows={2}
                        className="w-full resize-none border-indigo-200 focus:border-indigo-400 focus:ring-indigo-200 text-sm"
                      />
                    </div>
                  )}

                  {selectedFile && (
                    <Button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200 h-11 font-semibold"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading Document...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Document
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Documents List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <FileText className="h-4 w-4 text-indigo-600" />
                  </div>
                  <Label className="text-base font-bold text-slate-800">
                    Uploaded Documents
                  </Label>
                </div>
                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 font-semibold px-3 py-1">
                  {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
                </Badge>
              </div>

              {documents.length === 0 ? (
                <Card className="border-2 border-dashed border-slate-200">
                  <CardContent className="p-12 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-slate-100 rounded-full">
                        <FileText className="h-12 w-12 text-slate-400" />
                      </div>
                    </div>
                    <p className="text-base font-semibold text-slate-600 mb-1">No documents uploaded yet</p>
                    <p className="text-sm text-slate-500">Upload your first document above to get started</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => {
                    // Handle different date formats (Date, Timestamp, number)
                    let uploadedAt: Date;
                    if (doc.uploadedAt instanceof Date) {
                      uploadedAt = doc.uploadedAt;
                    } else if (typeof doc.uploadedAt === 'number') {
                      uploadedAt = new Date(doc.uploadedAt);
                    } else if (doc.uploadedAt && typeof doc.uploadedAt === 'object' && 'toDate' in doc.uploadedAt) {
                      uploadedAt = (doc.uploadedAt as any).toDate();
                    } else {
                      uploadedAt = new Date();
                    }

                    return (
                      <Card
                        key={doc.id}
                        className="border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 bg-white"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                                {getFileIcon(doc.mimeType)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 text-base mb-2 break-words break-all">
                                  {doc.originalName}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  <Badge variant="outline" className={`text-xs font-medium ${getFileTypeColor(doc.mimeType)}`}>
                                    {formatFileSize(doc.fileSize)}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700 border-slate-200">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {format(uploadedAt, 'MMM dd, yyyy HH:mm')}
                                  </Badge>
                                </div>
                                {doc.description && (
                                  <div className="mt-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                                    <p className="text-sm text-slate-600 italic">
                                      "{doc.description}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                                className="h-9 w-9 p-0 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                                title="Download document"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(doc)}
                                disabled={deleting === doc.id}
                                className="h-9 w-9 p-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                title="Delete document"
                              >
                                {deleting === doc.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-lg flex-shrink-0">
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

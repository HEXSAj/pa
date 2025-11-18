// src/app/dashboard/purchases/RecoverDraftModal.tsx
'use client';

import React, { useState } from 'react';
import { PurchaseWithDetails } from '@/types/purchase';
import { FileText, Loader2, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RecoverDraftModalProps {
  drafts: {
    key: string;
    data: any;
    timestamp: Date;
  }[];
  onClose: () => void;
  onRecover: (draft: any) => void;
  onDelete: (key: string) => void;
}

export default function RecoverDraftModal({
  drafts,
  onClose,
  onRecover,
  onDelete
}: RecoverDraftModalProps) {
  const [recovering, setRecovering] = useState(false);
  const [selectedDraftKey, setSelectedDraftKey] = useState<string | null>(drafts.length > 0 ? drafts[0].key : null);

  const handleRecover = async () => {
    if (!selectedDraftKey) return;
    
    try {
      setRecovering(true);
      
      const draft = drafts.find(d => d.key === selectedDraftKey);
      if (draft) {
        onRecover(draft.data);
      }
      
    } finally {
      setRecovering(false);
      onClose();
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const getSelectedDraft = () => {
    return drafts.find(d => d.key === selectedDraftKey);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center">Recover Unsaved Drafts</DialogTitle>
          <DialogDescription className="text-center">
            We found unsaved purchase drafts from a previous session. 
            Would you like to recover any of them?
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 border rounded-lg overflow-hidden">
          <div className="max-h-[300px] overflow-auto">
            {drafts.map((draft) => (
              <div 
                key={draft.key}
                className={`border-b last:border-b-0 p-3 flex items-center hover:bg-gray-50 cursor-pointer ${
                  selectedDraftKey === draft.key ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedDraftKey(draft.key)}
              >
                <div className="mr-3">
                  {selectedDraftKey === draft.key ? (
                    <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {draft.data.supplierName || 'Unknown Supplier'}
                    {draft.data.items && (
                      <Badge variant="outline" className="ml-2">
                        {draft.data.items.length} items
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last saved: {formatDate(draft.timestamp)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 opacity-50 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(draft.key);
                  }}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>

        {getSelectedDraft() && (
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <div className="font-medium mb-1">Draft Details</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500">Supplier: </span>
                {getSelectedDraft()?.data.supplierName || 'Unknown'}
              </div>
              <div>
                <span className="text-gray-500">Items: </span>
                {getSelectedDraft()?.data.items?.length || 0}
              </div>
              <div>
                <span className="text-gray-500">Created by: </span>
                {getSelectedDraft()?.data.createdByName || 'Unknown'}
              </div>
              <div>
                <span className="text-gray-500">Total: </span>
                {getSelectedDraft()?.data.totalAmount 
                  ? `Rs${getSelectedDraft()?.data.totalAmount.toFixed(2)}`
                  : '-'
                }
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={recovering}
            className="sm:flex-1"
          >
            Discard All
          </Button>
          <Button 
            onClick={handleRecover}
            disabled={!selectedDraftKey || recovering}
            className="sm:flex-1"
          >
            {recovering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recovering...
              </>
            ) : (
              'Recover Selected Draft'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
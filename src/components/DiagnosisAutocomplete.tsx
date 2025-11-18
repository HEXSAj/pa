// src/components/DiagnosisAutocomplete.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, TrendingUp, Clock, X, Settings } from 'lucide-react';
import { diagnosisManagementService, SavedDiagnosis } from '@/services/diagnosisManagementService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DiagnosisAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DiagnosisAutocomplete({
  value,
  onChange,
  placeholder = 'Enter diagnosis...',
  disabled = false,
  className
}: DiagnosisAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<SavedDiagnosis[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [allDiagnoses, setAllDiagnoses] = useState<SavedDiagnosis[]>([]);
  const [loadingDiagnoses, setLoadingDiagnoses] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load all diagnoses on mount
  useEffect(() => {
    loadDiagnoses();
  }, []);

  // Handle input changes and search
  useEffect(() => {
    const searchDiagnoses = async () => {
      if (value.trim()) {
        const results = await diagnosisManagementService.searchDiagnoses(value);
        setSuggestions(results.slice(0, 10)); // Show top 10 matches
      } else {
        // Show most used when input is empty
        const mostUsed = await diagnosisManagementService.getMostUsedDiagnoses(10);
        setSuggestions(mostUsed);
      }
    };

    if (showSuggestions) {
      searchDiagnoses();
    }
  }, [value, showSuggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadDiagnoses = async () => {
    setLoadingDiagnoses(true);
    try {
      const diagnoses = await diagnosisManagementService.getAllDiagnoses();
      setAllDiagnoses(diagnoses);
    } catch (error) {
      console.error('Error loading diagnoses:', error);
    } finally {
      setLoadingDiagnoses(false);
    }
  };

  const handleSelectSuggestion = async (diagnosis: SavedDiagnosis) => {
    onChange(diagnosis.text);
    setShowSuggestions(false);
    
    // Update usage count
    try {
      await diagnosisManagementService.saveOrUpdateDiagnosis(diagnosis.text);
    } catch (error) {
      console.error('Error updating diagnosis usage:', error);
    }
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleDeleteDiagnosis = async (diagnosisId: string, diagnosisText: string) => {
    setDeletingId(diagnosisId);
    try {
      await diagnosisManagementService.deleteDiagnosis(diagnosisId);
      toast.success(`Diagnosis "${diagnosisText}" deleted`);
      await loadDiagnoses();
      
      // Refresh suggestions if dropdown is open
      if (showSuggestions) {
        const results = await diagnosisManagementService.searchDiagnoses(value);
        setSuggestions(results.slice(0, 10));
      }
    } catch (error) {
      toast.error('Failed to delete diagnosis');
    } finally {
      setDeletingId(null);
    }
  };

  const handleManageDialogClose = () => {
    setShowManageDialog(false);
    loadDiagnoses();
  };

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            className={cn("text-sm", className)}
          />
          
          {/* Dropdown Suggestions */}
          {showSuggestions && suggestions.length > 0 && !disabled && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
              style={{ maxHeight: '340px' }}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-2 z-10">
                <div className="text-xs text-gray-500 font-medium flex items-center justify-between">
                  <span>{value.trim() ? 'Search Results' : 'Most Used Diagnoses'}</span>
                  {suggestions.length > 5 && (
                    <span className="text-xs text-gray-400">Scroll for more ↓</span>
                  )}
                </div>
              </div>
              <div className="overflow-y-auto p-2 scroll-smooth" style={{ maxHeight: '300px' }}>
                {suggestions.map((diagnosis) => (
                  <div
                    key={diagnosis.id}
                    className="group flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                    onClick={() => handleSelectSuggestion(diagnosis)}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {diagnosis.text}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Used {diagnosis.usageCount}x
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(diagnosis.lastUsedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDiagnosis(diagnosis.id, diagnosis.text);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                      title="Delete diagnosis"
                      disabled={deletingId === diagnosis.id}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Manage Button */}
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowManageDialog(true)}
            className="h-9 px-3"
            title="Manage saved diagnoses"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hint Text */}
      {!showSuggestions && suggestions.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          Click to see saved diagnoses or start typing to search
        </p>
      )}

      {/* Manage Diagnoses Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Saved Diagnoses</DialogTitle>
            <DialogDescription>
              View and manage your frequently used diagnoses. Delete ones you no longer need.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {loadingDiagnoses ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">Loading diagnoses...</div>
              </div>
            ) : allDiagnoses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-sm text-gray-500">No saved diagnoses yet</div>
                <div className="text-xs text-gray-400 mt-1">
                  Start adding diagnoses in prescriptions to build your library
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {allDiagnoses.map((diagnosis) => (
                  <div
                    key={diagnosis.id}
                    className="group flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {diagnosis.text}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge variant="outline" className="text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {diagnosis.usageCount} uses
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last used: {new Date(diagnosis.lastUsedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleDeleteDiagnosis(diagnosis.id, diagnosis.text);
                      }}
                      className="ml-3 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded-lg transition-all"
                      title="Delete diagnosis"
                      disabled={deletingId === diagnosis.id}
                    >
                      {deletingId === diagnosis.id ? (
                        <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-600" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              Total: {allDiagnoses.length} saved {allDiagnoses.length === 1 ? 'diagnosis' : 'diagnoses'}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleManageDialogClose}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// src/components/MedicalTestSection.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Search, 
  Stethoscope, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  FileText,
  Loader2,
  X
} from 'lucide-react';
import { MedicalTest, MedicalTestTemplate } from '@/types/prescription';
import { prescriptionService } from '@/services/prescriptionService';
import { toast } from 'sonner';
import { TagManager } from '@/components/TagManager';
import { tagManagementService } from '@/services/tagManagementService';

interface MedicalTestSectionProps {
  medicalTests: MedicalTest[];
  onMedicalTestsChange: (tests: MedicalTest[]) => void;
  patientId: string;
  doctorId: string;
  disabled?: boolean;
}

export function MedicalTestSection({ 
  medicalTests, 
  onMedicalTestsChange, 
  patientId, 
  doctorId, 
  disabled = false 
}: MedicalTestSectionProps) {
  const [testInput, setTestInput] = useState('');

  // Medical test tags - loaded from Firebase
  const [medicalTestTags, setMedicalTestTags] = useState<string[]>([]);

  // Load tags on mount
  useEffect(() => {
    const loadTags = async () => {
      try {
        await tagManagementService.initializeDefaultTags();
        const tags = await tagManagementService.getTagsByCategory('medicalTests');
        setMedicalTestTags(tags);
      } catch (error) {
        console.error('Error loading medical test tags:', error);
      }
    };
    loadTags();
  }, []);

  // Handle tag click to add test
  const handleTagClick = (tag: string) => {
    if (testInput.trim()) {
      setTestInput(prev => `${prev}, ${tag}`);
    } else {
      setTestInput(tag);
    }
  };

  // Handle adding tests from input
  const handleAddTests = () => {
    if (!testInput.trim()) {
      toast.error('Please enter at least one test');
      return;
    }

    const testNames = testInput.split(',').map(name => name.trim()).filter(name => name);
    const newTests: MedicalTest[] = testNames.map(testName => ({
      id: prescriptionService.generateMedicalTestId(),
      testName,
      testType: 'Blood Test',
      urgency: 'routine',
      fastingRequired: false
    }));

    onMedicalTestsChange([...medicalTests, ...newTests]);
    setTestInput('');
    toast.success(`${newTests.length} test(s) added successfully`);
  };

  // Handle removing a test
  const handleRemoveTest = (testId: string) => {
    onMedicalTestsChange(medicalTests.filter(test => test.id !== testId));
    toast.success('Medical test removed');
  };

  return (
    <div className="space-y-3">
      {/* Inline Medical Test Input */}
      <div className="flex items-center space-x-2">
        <Label htmlFor="medicalTests" className="text-sm font-semibold text-gray-700 w-20 flex-shrink-0">
          Tests:
        </Label>
        <Input
          id="medicalTests"
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          placeholder="Enter test names or click tags below..."
          className="text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
        />
        {!disabled && (
          <Button
            onClick={handleAddTests}
            size="sm"
            className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Medical Test Tags */}
      <TagManager
        tags={medicalTestTags}
        onTagClick={handleTagClick}
        category="medicalTests"
        onTagsUpdate={setMedicalTestTags}
        disabled={disabled}
        label="Quick Tags - Click to add"
        colorScheme="blue"
      />

      {/* Current Medical Tests */}
      {medicalTests.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-600">Ordered Tests:</div>
          <div className="flex flex-wrap gap-1">
            {medicalTests.map((test) => (
              <Badge
                key={test.id}
                variant="outline"
                className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              >
                {test.testName}
                {!disabled && (
                  <button
                    onClick={() => handleRemoveTest(test.id)}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// src/components/MedicalTestTemplateSeeder.tsx

'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Stethoscope,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { seedMedicalTestTemplates, commonMedicalTestTemplates } from '@/utils/medicalTestTemplates';

interface MedicalTestTemplateSeederProps {
  onComplete?: () => void;
}

export function MedicalTestTemplateSeeder({ onComplete }: MedicalTestTemplateSeederProps) {
  const [seeding, setSeeding] = useState(false);
  const [seededCount, setSeededCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const handleSeedTemplates = async () => {
    setSeeding(true);
    setSeededCount(0);
    setErrorCount(0);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const template of commonMedicalTestTemplates) {
        try {
          const { medicalTestService } = await import('@/services/medicalTestService');
          await medicalTestService.createMedicalTestTemplate(template);
          successCount++;
          setSeededCount(successCount);
        } catch (error) {
          failCount++;
          setErrorCount(failCount);
          console.error(`Error creating template ${template.testName}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully seeded ${successCount} medical test templates`);
      }
      
      if (failCount > 0) {
        toast.error(`Failed to seed ${failCount} templates (may already exist)`);
      }

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error seeding templates:', error);
      toast.error('Failed to seed medical test templates');
    } finally {
      setSeeding(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Blood Tests': 'bg-red-100 text-red-800',
      'Imaging': 'bg-blue-100 text-blue-800',
      'Cardiology': 'bg-pink-100 text-pink-800',
      'Urine Tests': 'bg-yellow-100 text-yellow-800',
      'Stool Tests': 'bg-orange-100 text-orange-800',
      'Infectious Diseases': 'bg-purple-100 text-purple-800',
      'Pregnancy Tests': 'bg-green-100 text-green-800',
      'Vitamins & Minerals': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Medical Test Template Seeder
        </CardTitle>
        <p className="text-sm text-gray-600">
          This will create common medical test templates to help doctors quickly add tests to prescriptions.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        {seeding && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Seeding templates...</span>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                {seededCount} successful
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" />
                  {errorCount} failed
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview of templates */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Preview of Templates ({commonMedicalTestTemplates.length} total)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {commonMedicalTestTemplates.map((template, index) => (
              <div key={index} className="p-2 border rounded-lg text-sm">
                <div className="font-medium">{template.testName}</div>
                <div className="text-gray-500 text-xs">{template.testType}</div>
                <div className="flex gap-1 mt-1">
                  <Badge className={getCategoryColor(template.category || '')} variant="outline">
                    {template.category}
                  </Badge>
                  {template.fastingRequired && (
                    <Badge variant="outline" className="text-orange-600">
                      Fasting
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-blue-600">
                    {template.defaultUrgency}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>Note:</strong> This will only create templates that don't already exist. 
              Existing templates will be skipped to avoid duplicates.
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          onClick={handleSeedTemplates}
          disabled={seeding}
          className="w-full"
          size="lg"
        >
          {seeding ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Seeding Templates...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Seed Medical Test Templates
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// src/app/dashboard/settings/business/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2 } from "lucide-react";
import DashboardLayout from '@/components/DashboardLayout';
import { businessSettingsService } from '@/services/businessSettingsService';

// Define the business settings interface
export interface BusinessSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  footer: string;
  logoUrl: string;
  receiptWidth: number; // in mm
  charactersPerLine: number;
  autoPrintReceipt: boolean;
  openCashDrawer: boolean;
  defaultAppointmentAmount?: number; // Default appointment amount for all appointments
}

export default function BusinessSettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings>({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',
    footer: '',
    logoUrl: '',
    receiptWidth: 80,
    charactersPerLine: 42,
    autoPrintReceipt: true,
    openCashDrawer: true,
    defaultAppointmentAmount: undefined
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const loadedSettings = businessSettingsService.getSettings();
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
        setToastMessage('Failed to load settings');
        setShowToast(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      businessSettingsService.saveSettings(settings);
      setToastMessage('Settings saved successfully');
      setShowToast(true);
    } catch (error) {
      console.error('Error saving settings:', error);
      setToastMessage('Failed to save settings');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  // Simple toast component
  const ToastComponent = () => {
    useEffect(() => {
      if (showToast) {
        const timer = setTimeout(() => {
          setShowToast(false);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }, [showToast]);
    
    if (!showToast) return null;
    
    return (
      <div className="fixed bottom-4 right-4 bg-green-600 text-white py-2 px-4 rounded-md shadow-lg z-50">
        {toastMessage}
      </div>
    );
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Business Settings</h1>
        <p className="text-gray-500">Configure your business information for receipts and invoices.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>This information will appear on your receipts and invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={settings.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={settings.phone}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={settings.address}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={settings.email}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    value={settings.website}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / Registration Number</Label>
                  <Input
                    id="taxId"
                    name="taxId"
                    value={settings.taxId}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="footer">Receipt Footer Message</Label>
                  <Input
                    id="footer"
                    name="footer"
                    value={settings.footer}
                    onChange={handleChange}
                    placeholder="Thank you for your purchase!"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Receipt Printer Settings</CardTitle>
              <CardDescription>Configure your receipt printer settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="receiptWidth">Receipt Width (mm)</Label>
                  <Input
                    id="receiptWidth"
                    name="receiptWidth"
                    type="number"
                    min="58"
                    max="120"
                    value={settings.receiptWidth}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-gray-500">Standard thermal receipt printers are 58mm or 80mm wide.</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="charactersPerLine">Characters Per Line</Label>
                  <Input
                    id="charactersPerLine"
                    name="charactersPerLine"
                    type="number"
                    min="24"
                    max="60"
                    value={settings.charactersPerLine}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-gray-500">Typically 32 chars for 58mm printers, 42 chars for 80mm printers.</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    id="autoPrintReceipt"
                    name="autoPrintReceipt"
                    type="checkbox"
                    checked={settings.autoPrintReceipt}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="autoPrintReceipt">Automatically print receipt after sale</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    id="openCashDrawer"
                    name="openCashDrawer"
                    type="checkbox"
                    checked={settings.openCashDrawer}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="openCashDrawer">Automatically open cash drawer for cash sales</Label>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Appointment Settings</CardTitle>
              <CardDescription>Configure default settings for appointments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultAppointmentAmount">Default Appointment Amount (Rs.)</Label>
                <Input
                  id="defaultAppointmentAmount"
                  name="defaultAppointmentAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.defaultAppointmentAmount || ''}
                  onChange={handleChange}
                  placeholder="Enter default appointment amount"
                />
                <p className="text-sm text-gray-500">
                  This amount will be pre-filled when creating new appointments. Can be changed or overridden manually.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <CardFooter className="flex justify-end">
            <Button 
              type="submit" 
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </CardFooter>
        </form>
        
        <ToastComponent />
      </div>
    </DashboardLayout>
  );
}
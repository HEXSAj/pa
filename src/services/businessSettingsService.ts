// src/services/businessSettingsService.ts
import { BusinessSettings } from '@/app/dashboard/settings/business/page';

// Default business info if nothing is in localStorage
const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  name: 'ACME PHARMACY',
  address: '123 Main Street, Cityville',
  phone: '+1 234-567-8901',
  email: 'info@acmepharmacy.com',
  website: 'www.acmepharmacy.com',
  taxId: 'TAX-12345-AB',
  footer: 'Get well soon!',
  logoUrl: '',
  receiptWidth: 80, // 80mm printer is standard
  charactersPerLine: 42,
  autoPrintReceipt: true,
  openCashDrawer: true,
  defaultAppointmentAmount: undefined
};

export const businessSettingsService = {
  /**
   * Get business settings from localStorage
   */
  getSettings(): BusinessSettings {
    if (typeof window === 'undefined') {
      return DEFAULT_BUSINESS_SETTINGS;
    }
    
    const storedSettings = localStorage.getItem('businessSettings');
    
    if (storedSettings) {
      try {
        return JSON.parse(storedSettings);
      } catch (error) {
        console.error('Error parsing business settings:', error);
        return DEFAULT_BUSINESS_SETTINGS;
      }
    } else {
      return DEFAULT_BUSINESS_SETTINGS;
    }
  },
  
  /**
   * Save business settings to localStorage
   */
  saveSettings(settings: BusinessSettings): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('businessSettings', JSON.stringify(settings));
    }
  },
  
  /**
   * Convert business settings to receipt businessInfo format
   */
  getBusinessInfoForReceipt(): {
    name: string;
    address: string;
    phone: string;
    footer?: string;
    logoUrl?: string;
    receiptWidth?: number;
    charactersPerLine?: number;
    openCashDrawer?: boolean;
  } {
    const settings = this.getSettings();
    
    return {
      name: settings.name,
      address: settings.address,
      phone: settings.phone,
      footer: settings.footer,
      logoUrl: settings.logoUrl,
      receiptWidth: settings.receiptWidth,
      charactersPerLine: settings.charactersPerLine,
      openCashDrawer: settings.openCashDrawer
    };
  }
};
// src/services/smsService.ts
import axios from 'axios';

// SMS Configuration
const SMS_CONFIG = {
  username: process.env.NEXT_PUBLIC_SMS_USERNAME || 'XXXX',
  password: process.env.NEXT_PUBLIC_SMS_PASSWORD || 'YYYY',
  alias: process.env.NEXT_PUBLIC_SMS_ALIAS || 'MedCenter',
  apiUrl: process.env.NEXT_PUBLIC_SMS_API_URL || '/api/send-sms' // We'll create this API endpoint
};

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const smsService = {
  /**
   * Send an SMS to a single recipient
   * @param contactNumber The recipient's phone number
   * @param message The SMS message content
   * @returns Promise with SMS response
   */
  async sendSMS(contactNumber: string, message: string): Promise<SMSResponse> {
    try {
      // Call our Next.js API route that will handle the SMS gateway integration
      const response = await axios.post(SMS_CONFIG.apiUrl, {
        recipient: contactNumber,
        message: message
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS'
      };
    }
  },

  /**
   * Send the same SMS to multiple recipients
   * @param contactNumbers Array of recipient phone numbers
   * @param message The SMS message content
   * @returns Promise with array of SMS responses
   */
  async sendBulkSMS(contactNumbers: string[], message: string): Promise<SMSResponse> {
    try {
      // For bulk SMS, we send all numbers at once to our API
      const response = await axios.post(SMS_CONFIG.apiUrl, {
        recipients: contactNumbers,
        message: message
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error sending bulk SMS:', error);
      return {
        success: false,
        error: error.message || 'Failed to send bulk SMS'
      };
    }
  },

  /**
   * Send SMS notification to doctor's patients
   * @param doctorName The doctor's name
   * @param patientContacts Array of patient contact numbers
   * @returns Promise with SMS response
   */
  async notifyDoctorArrival(doctorName: string, patientContacts: string[]): Promise<SMSResponse> {
    // Make sure we have valid contact numbers
    const validContacts = patientContacts.filter(contact => 
      contact && contact.trim().length > 0
    );
    
    if (validContacts.length === 0) {
      return {
        success: false,
        error: 'No valid contact numbers provided'
      };
    }
    
    // Create a message for doctor arrival
    const message = `Dr. ${doctorName} has arrived and is ready to see patients. Please proceed to the clinic if you have an appointment.`;
    
    // Send the bulk SMS
    return this.sendBulkSMS(validContacts, message);
  }
};
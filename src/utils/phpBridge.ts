// src/utils/phpBridge.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Convert exec to promise-based
const execPromise = promisify(exec);

/**
 * Utility to create and execute PHP scripts from Node.js
 */
export const phpBridge = {
  /**
   * Execute a PHP script with the given content
   * 
   * @param phpContent The PHP script content
   * @returns Promise with the output of the script
   */
  async executePhpScript(phpContent: string): Promise<string> {
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `php_script_${Date.now()}.php`);
    
    try {
      // Write the temporary PHP file
      fs.writeFileSync(tempFile, phpContent);
      
      // Execute the PHP script
      const { stdout, stderr } = await execPromise(`php ${tempFile}`);
      
      if (stderr) {
        console.error('PHP Error:', stderr);
        throw new Error(stderr);
      }
      
      return stdout.trim();
    } finally {
      // Clean up the temporary file
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch (error) {
        console.error('Error deleting temporary PHP file:', error);
      }
    }
  },
  
  /**
   * Create a PHP script to send SMS through the Mobitel gateway
   * 
   * @param username SMS gateway username
   * @param password SMS gateway password
   * @param message SMS message content
   * @param recipients Array of recipient phone numbers
   * @param alias Sender ID/alias
   * @param esmsPath Path to the ESMSWS.php file
   * @returns PHP script content
   */
  createSmsPhpScript(
    username: string,
    password: string,
    message: string,
    recipients: string[],
    alias: string,
    esmsPath: string
  ): string {
    // Format recipients as a comma-separated string
    const recipientsStr = recipients.join(',');
    
    // Escape any special characters in the message
    const escapedMessage = message.replace(/"/g, '\\"');
    
    // Create the PHP script
    return `<?php
include '${esmsPath}';

$username = '${username}';
$password = '${password}';

$session = createSession('', $username, $password, '');

$message = "${escapedMessage}";
$recipients = '${recipientsStr}';
$alias = '${alias}';

$result = sendMessages($session, $alias, $message, explode(",", $recipients), 0);
echo $result;

closeSession($session);
?>`;
  },
  
  /**
   * Send SMS using PHP gateway
   * 
   * @param message SMS message content
   * @param recipients Array of recipient phone numbers
   * @returns Promise with the message ID or error
   */
  async sendSms(message: string, recipients: string[]): Promise<string> {
    const username = process.env.SMS_USERNAME || 'XXXX';
    const password = process.env.SMS_PASSWORD || 'YYYY';
    const alias = process.env.SMS_ALIAS || 'MedCenter';
    const esmsPath = process.env.SMS_SCRIPT_PATH || '/path/to/ESMSWS.php';
    
    // Create the PHP script
    const phpScript = this.createSmsPhpScript(
      username,
      password,
      message,
      recipients,
      alias,
      esmsPath
    );
    
    // Execute the script
    return this.executePhpScript(phpScript);
  }
};

export default phpBridge;
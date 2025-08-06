import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import { invoke } from '@tauri-apps/api/tauri';
import * as fs from 'fs';
import * as path from 'path';

let client: Client | null = null;
let isInitialized = false;
let currentQR: string | null = null;
let isAuthenticated = false;
let connectedDevice: any = null;

interface WhatsAppStatus {
  isReady: boolean;
  connectedDevice: any;
  qrCode: string | null;
}

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  timestamp?: number;
  error?: string;
}

// Initialize WhatsApp client with LocalAuth
export async function initWhatsAppClient(): Promise<void> {
  if (isInitialized && client) {
    return;
  }

  try {
    // Get app data directory for session storage
    const appDataDir = await invoke('get_app_data_dir');
    const sessionPath = path.join(appDataDir, '.wwebjs_auth');

    client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'tauri-whatsapp-client',
        dataPath: sessionPath
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    // Set up event listeners
    client.on('qr', (qr) => {
      console.log('QR Code received:', qr);
      currentQR = qr;
      // Generate QR code image using a QR code library
      generateQRCodeImage(qr);
    });

    client.on('ready', () => {
      console.log('WhatsApp client is ready!');
      isAuthenticated = true;
      currentQR = null;
      connectedDevice = client?.info;
    });

    client.on('authenticated', () => {
      console.log('WhatsApp client authenticated');
      isAuthenticated = true;
    });

    client.on('auth_failure', (msg) => {
      console.error('Authentication failure:', msg);
      isAuthenticated = false;
      currentQR = null;
    });

    client.on('disconnected', (reason) => {
      console.log('WhatsApp client disconnected:', reason);
      isAuthenticated = false;
      connectedDevice = null;
      currentQR = null;
    });

    await client.initialize();
    isInitialized = true;
    
    console.log('WhatsApp client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize WhatsApp client:', error);
    throw error;
  }
}

// Generate QR code image from string
async function generateQRCodeImage(qrText: string): Promise<void> {
  try {
    const QRCode = require('qrcode');
    const qrImage = await QRCode.toDataURL(qrText, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    currentQR = qrImage;
    console.log('QR Code image generated');
  } catch (error) {
    console.error('Failed to generate QR code image:', error);
    currentQR = qrText; // Fallback to text
  }
}

// Get current WhatsApp status
export async function getWhatsAppStatus(): Promise<WhatsAppStatus> {
  return {
    isReady: isAuthenticated && client !== null,
    connectedDevice: connectedDevice,
    qrCode: currentQR
  };
}

// Reset WhatsApp session
export async function resetWhatsAppSession(): Promise<void> {
  try {
    if (client) {
      await client.logout();
      await client.destroy();
    }
    
    // Clear session data
    const appDataDir = await invoke('get_app_data_dir');
    const sessionPath = path.join(appDataDir, '.wwebjs_auth');
    
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
    
    client = null;
    isInitialized = false;
    isAuthenticated = false;
    connectedDevice = null;
    currentQR = null;
    
    console.log('WhatsApp session reset successfully');
  } catch (error) {
    console.error('Failed to reset WhatsApp session:', error);
    throw error;
  }
}

// Send message with optional PDF attachment
export async function sendWhatsAppMessage(
  phoneNumber: string, 
  message: string, 
  pdfPath?: string
): Promise<SendMessageResult> {
  try {
    if (!client || !isAuthenticated) {
      return {
        success: false,
        error: 'WhatsApp client not connected or authenticated'
      };
    }

    // Format phone number to E.164 format
    const formattedNumber = formatPhoneNumber(phoneNumber);
    const chatId = `${formattedNumber}@c.us`;

    let messageResult;

    if (pdfPath && fs.existsSync(pdfPath)) {
      // Send message with PDF attachment
      const media = MessageMedia.fromFilePath(pdfPath);
      messageResult = await client.sendMessage(chatId, media, { caption: message });
    } else {
      // Send text message only
      messageResult = await client.sendMessage(chatId, message);
    }

    console.log('Message sent successfully:', messageResult.id);
    
    return {
      success: true,
      messageId: messageResult.id._serialized,
      timestamp: messageResult.timestamp
    };
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Test WhatsApp connection
export async function testWhatsAppConnection(): Promise<SendMessageResult> {
  try {
    if (!client || !isAuthenticated) {
      return {
        success: false,
        error: 'WhatsApp client not connected'
      };
    }

    // Get client info as a test
    const info = client.info;
    console.log('WhatsApp connection test successful:', info);
    
    return {
      success: true,
      messageId: `test_${Date.now()}`,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('WhatsApp connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed'
    };
  }
}

// Format phone number to E.164 format
function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add country code if not present (assuming India +91)
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  } else if (cleaned.startsWith('0')) {
    cleaned = '91' + cleaned.substring(1);
  }
  
  return cleaned;
}

// Export functions for Tauri commands
export {
  initWhatsAppClient as init_whatsapp,
  getWhatsAppStatus as get_whatsapp_status,
  resetWhatsAppSession as reset_whatsapp_session,
  sendWhatsAppMessage as send_whatsapp_message,
  testWhatsAppConnection as test_whatsapp_connection
};
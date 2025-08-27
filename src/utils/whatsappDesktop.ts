// WhatsApp Desktop Integration using deep linking
// No QR authentication required - uses existing WhatsApp Desktop installation

import { invoke } from '@tauri-apps/api/core';
import { logger } from './logger';

// Tauri shell functionality for opening URLs
declare global {
  interface Window {
    __TAURI_SHELL__?: {
      open: (url: string) => Promise<void>;
    };
  }
}

export interface WhatsAppMessage {
  phone: string;
  message: string;
  studentId: string;
  studentName: string;
  attachmentPath?: string;
}

export interface WhatsAppLog {
  id: string;
  studentId: string;
  studentName: string;
  phoneNumber: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'failed' | 'opened' | 'pending';
  errorMessage?: string;
}

export interface WhatsAppSession {
  id: string;
  status: 'connected' | 'disconnected' | 'checking';
  connectedAt?: string;
  lastActivity?: string;
  isDesktopInstalled: boolean;
  deviceInfo?: {
    platform: string;
    whatsappPath?: string;
  };
}

class WhatsAppDesktopClient {
  private session: WhatsAppSession | null = null;
  private sessionKey = 'whatsapp_desktop_session_v1';
  private logs: WhatsAppLog[] = [];
  private logsKey = 'whatsapp_desktop_logs_v1';

  constructor() {
    this.loadSession();
    this.loadLogs();
    this.checkDesktopInstallation();
    logger.info('whatsapp', 'WhatsApp Desktop client initialized');
  }

  private loadSession() {
    try {
      const saved = localStorage.getItem(this.sessionKey);
      if (saved) {
        this.session = JSON.parse(saved);
        logger.info('whatsapp', 'Session loaded from storage');
      }
    } catch (error) {
      logger.error('whatsapp', 'Failed to load session', error);
      this.clearSession();
    }
  }

  private saveSession() {
    try {
      if (this.session) {
        localStorage.setItem(this.sessionKey, JSON.stringify(this.session));
        logger.debug('whatsapp', 'Session saved to storage');
      }
    } catch (error) {
      logger.error('whatsapp', 'Failed to save session', error);
    }
  }

  private loadLogs() {
    try {
      const saved = localStorage.getItem(this.logsKey);
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch (error) {
      logger.error('whatsapp', 'Failed to load logs', error);
      this.logs = [];
    }
  }

  private saveLogs() {
    try {
      // Keep only last 100 logs
      const recentLogs = this.logs.slice(-100);
      localStorage.setItem(this.logsKey, JSON.stringify(recentLogs));
      this.logs = recentLogs;
    } catch (error) {
      logger.error('whatsapp', 'Failed to save logs', error);
    }
  }

  private addLog(log: WhatsAppLog) {
    this.logs.push(log);
    this.saveLogs();
    logger.debug('whatsapp', 'Log entry added', { 
      student: log.studentName, 
      status: log.status 
    });
  }

  private clearSession() {
    this.session = null;
    localStorage.removeItem(this.sessionKey);
    logger.info('whatsapp', 'Session cleared');
  }

  private async checkDesktopInstallation(): Promise<boolean> {
    try {
      // Check if WhatsApp Desktop is installed using Tauri
      const isInstalled = await invoke('check_whatsapp_installation') as boolean;
      
      if (!this.session) {
        this.session = {
          id: crypto.randomUUID(),
          status: 'disconnected',
          isDesktopInstalled: isInstalled,
          deviceInfo: {
            platform: await invoke('get_platform') as string
          }
        };
      } else {
        this.session.isDesktopInstalled = isInstalled;
      }

      this.saveSession();
      
      logger.info('whatsapp', 'Desktop installation check completed', { 
        installed: isInstalled 
      });
      
      return isInstalled;
    } catch (error) {
      logger.error('whatsapp', 'Failed to check WhatsApp Desktop installation', error);
      
      // Fallback: assume installed
      if (!this.session) {
        this.session = {
          id: crypto.randomUUID(),
          status: 'disconnected',
          isDesktopInstalled: true,
          deviceInfo: {
            platform: 'unknown'
          }
        };
        this.saveSession();
      }
      
      return true;
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if missing (assuming India +91)
    let formatted = cleaned;
    if (cleaned.length === 10 && !cleaned.startsWith('91')) {
      formatted = '91' + cleaned;
    }
    
    // Ensure it starts with + for E.164 format
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }
    
    return formatted;
  }

  private validatePhoneNumber(phone: string): { isValid: boolean; formatted: string; error?: string } {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length < 10) {
      return { isValid: false, formatted: '', error: 'Phone number too short' };
    }
    
    if (cleaned.length > 15) {
      return { isValid: false, formatted: '', error: 'Phone number too long' };
    }
    
    const formatted = this.formatPhoneNumber(phone);
    
    // Validate Indian mobile numbers specifically
    if (formatted.startsWith('+91') && formatted.length === 13) {
      const mobile = formatted.slice(3);
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        return { isValid: false, formatted: '', error: 'Invalid Indian mobile number' };
      }
    }
    
    return { isValid: true, formatted };
  }

  async connectDesktop(): Promise<WhatsAppSession> {
    logger.info('whatsapp', 'Connecting to WhatsApp Desktop');
    
    try {
      // Check if WhatsApp Desktop is installed
      const isInstalled = await this.checkDesktopInstallation();
      
      if (!isInstalled) {
        throw new Error('WhatsApp Desktop is not installed on this system');
      }
      
      if (!this.session) {
        this.session = {
          id: crypto.randomUUID(),
          status: 'checking',
          isDesktopInstalled: true,
          deviceInfo: {
            platform: await invoke('get_platform') as string
          }
        };
      }

      this.session.status = 'connected';
      this.session.connectedAt = new Date().toISOString();
      this.session.lastActivity = new Date().toISOString();
      
      this.saveSession();
      
      logger.info('whatsapp', 'WhatsApp Desktop connected successfully');
      
      return this.session;
    } catch (error) {
      logger.error('whatsapp', 'Failed to connect to WhatsApp Desktop', error);
      
      if (this.session) {
        this.session.status = 'disconnected';
        this.saveSession();
      }
      
      throw error;
    }
  }

  async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; log: WhatsAppLog }> {
    logger.info('whatsapp', 'Attempting to send message via WhatsApp Desktop', {
      student: message.studentName,
      phone: message.phone.slice(-4)
    });

    // Validate session
    if (!this.session || this.session.status !== 'connected') {
      const errorLog: WhatsAppLog = {
        id: crypto.randomUUID(),
        studentId: message.studentId,
        studentName: message.studentName,
        phoneNumber: message.phone,
        message: message.message,
        timestamp: new Date().toISOString(),
        status: 'failed',
        errorMessage: 'WhatsApp Desktop not connected'
      };

      this.addLog(errorLog);
      logger.error('whatsapp', 'Send failed: Desktop not connected', { 
        studentName: message.studentName 
      });
      return { success: false, log: errorLog };
    }

    // Validate phone number
    const phoneValidation = this.validatePhoneNumber(message.phone);
    if (!phoneValidation.isValid) {
      const errorLog: WhatsAppLog = {
        id: crypto.randomUUID(),
        studentId: message.studentId,
        studentName: message.studentName,
        phoneNumber: message.phone,
        message: message.message,
        timestamp: new Date().toISOString(),
        status: 'failed',
        errorMessage: phoneValidation.error
      };

      this.addLog(errorLog);
      logger.error('whatsapp', 'Send failed: Invalid phone number', {
        studentName: message.studentName,
        error: phoneValidation.error
      });
      return { success: false, log: errorLog };
    }

    // Validate message content
    if (!message.message || message.message.trim().length === 0) {
      const errorLog: WhatsAppLog = {
        id: crypto.randomUUID(),
        studentId: message.studentId,
        studentName: message.studentName,
        phoneNumber: message.phone,
        message: message.message,
        timestamp: new Date().toISOString(),
        status: 'failed',
        errorMessage: 'Message content is empty'
      };

      this.addLog(errorLog);
      logger.error('whatsapp', 'Send failed: Empty message', { 
        studentName: message.studentName 
      });
      return { success: false, log: errorLog };
    }

    try {
      // Encode message for URL
      const encodedMessage = encodeURIComponent(message.message);
      const formattedPhone = phoneValidation.formatted.replace('+', '');
      
      // Create WhatsApp deep link
      const whatsappUrl = `whatsapp://send?phone=${formattedPhone}&text=${encodedMessage}`;
      
      logger.debug('whatsapp', 'Opening WhatsApp with URL', { 
        url: whatsappUrl.substring(0, 50) + '...' 
      });
      
      // Open WhatsApp Desktop with the pre-filled message
      if (window.__TAURI_SHELL__?.open) {
        await window.__TAURI_SHELL__.open(whatsappUrl);
      } else {
        // Fallback for web environment
        window.open(whatsappUrl, '_blank');
      }
      
      const successLog: WhatsAppLog = {
        id: crypto.randomUUID(),
        studentId: message.studentId,
        studentName: message.studentName,
        phoneNumber: phoneValidation.formatted,
        message: message.message,
        timestamp: new Date().toISOString(),
        status: 'opened',
      };

      this.addLog(successLog);
      
      // Update session activity
      if (this.session) {
        this.session.lastActivity = new Date().toISOString();
        this.saveSession();
      }

      logger.info('whatsapp', 'WhatsApp opened successfully', {
        studentName: message.studentName,
        messageLength: message.message.length
      });

      return { success: true, log: successLog };
    } catch (error) {
      const errorLog: WhatsAppLog = {
        id: crypto.randomUUID(),
        studentId: message.studentId,
        studentName: message.studentName,
        phoneNumber: message.phone,
        message: message.message,
        timestamp: new Date().toISOString(),
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Failed to open WhatsApp Desktop'
      };

      this.addLog(errorLog);
      logger.error('whatsapp', 'WhatsApp Desktop open failed', {
        studentName: message.studentName,
        error
      });

      return { success: false, log: errorLog };
    }
  }

  async sendBulkMessages(messages: WhatsAppMessage[], delayBetween: number = 3000): Promise<{ success: boolean; results: WhatsAppLog[] }> {
    logger.info('whatsapp', 'Starting bulk message send via WhatsApp Desktop', { 
      count: messages.length 
    });

    if (!this.session || this.session.status !== 'connected') {
      logger.error('whatsapp', 'Bulk send failed: Desktop not connected');
      throw new Error('WhatsApp Desktop not connected');
    }

    const results: WhatsAppLog[] = [];
    let successCount = 0;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      
      // Add delay between messages to avoid overwhelming the system
      if (i > 0) {
        logger.debug('whatsapp', `Waiting ${delayBetween}ms before next message`);
        await new Promise(resolve => setTimeout(resolve, delayBetween));
      }

      try {
        const result = await this.sendMessage(message);
        results.push(result.log);
        
        if (result.success) {
          successCount++;
        }
        
        logger.debug('whatsapp', `Bulk send progress: ${i + 1}/${messages.length}`, {
          current: message.studentName,
          success: result.success
        });
        
      } catch (error) {
        const errorLog: WhatsAppLog = {
          id: crypto.randomUUID(),
          studentId: message.studentId,
          studentName: message.studentName,
          phoneNumber: message.phone,
          message: message.message,
          timestamp: new Date().toISOString(),
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        };
        
        results.push(errorLog);
        this.addLog(errorLog);
        logger.error('whatsapp', 'Bulk send message failed', {
          studentName: message.studentName,
          error
        });
      }
    }

    logger.info('whatsapp', 'Bulk send completed', {
      total: messages.length,
      success: successCount,
      failed: messages.length - successCount
    });

    return { success: true, results };
  }

  async testConnection(): Promise<boolean> {
    logger.info('whatsapp', 'Testing WhatsApp Desktop connection');

    try {
      // Check if WhatsApp Desktop is installed
      const isInstalled = await this.checkDesktopInstallation();
      
      if (!isInstalled) {
        logger.warn('whatsapp', 'Test failed: WhatsApp Desktop not installed');
        return false;
      }

      // Try to open WhatsApp without a message (just the app)
      if (window.__TAURI_SHELL__?.open) {
        await window.__TAURI_SHELL__.open('whatsapp://');
      } else {
        // Fallback for web environment
        window.open('whatsapp://', '_blank');
      }
      
      logger.info('whatsapp', 'Connection test successful - WhatsApp Desktop opened');
      return true;
    } catch (error) {
      logger.error('whatsapp', 'Connection test failed', error);
      return false;
    }
  }

  disconnect(): void {
    logger.info('whatsapp', 'Disconnecting WhatsApp Desktop session');
    if (this.session) {
      this.session.status = 'disconnected';
      this.saveSession();
    }
  }

  resetSession(): void {
    logger.info('whatsapp', 'Resetting WhatsApp Desktop session');
    this.clearSession();
  }

  getSession(): WhatsAppSession | null {
    return this.session;
  }

  getLogs(): WhatsAppLog[] {
    return [...this.logs].reverse(); // Return newest first
  }

  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem(this.logsKey);
    logger.info('whatsapp', 'Logs cleared');
  }

  isConnected(): boolean {
    return this.session?.status === 'connected' && this.session?.isDesktopInstalled === true;
  }

  isConnecting(): boolean {
    return this.session?.status === 'checking';
  }
}

export const whatsappDesktop = new WhatsAppDesktopClient();

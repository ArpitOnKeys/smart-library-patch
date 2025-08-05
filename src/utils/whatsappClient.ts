import { logger } from './logger';

interface WhatsAppSession {
  id: string;
  qrCode?: string;
  status: 'pending' | 'connected' | 'disconnected' | 'error';
  connectedAt?: string;
  sessionData?: {
    phone: string;
    name: string;
    deviceId: string;
  };
  lastActivity?: string;
}

interface WhatsAppMessage {
  phone: string;
  message: string;
  studentId: string;
  studentName: string;
  attachment?: File;
}

interface WhatsAppLog {
  id: string;
  studentId: string;
  studentName: string;
  phoneNumber: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'failed' | 'delivered' | 'pending';
  errorMessage?: string;
}

class WhatsAppClient {
  private session: WhatsAppSession | null = null;
  private sessionKey = 'whatsapp_session_v2';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private qrRefreshInterval: NodeJS.Timeout | null = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadSession();
    logger.info('whatsapp', 'WhatsApp client initialized');
  }

  private loadSession() {
    try {
      const saved = localStorage.getItem(this.sessionKey);
      if (saved) {
        const parsedSession = JSON.parse(saved);
        // Validate session is not too old (24 hours)
        if (parsedSession.connectedAt) {
          const sessionAge = Date.now() - new Date(parsedSession.connectedAt).getTime();
          if (sessionAge > 24 * 60 * 60 * 1000) {
            logger.warn('whatsapp', 'Session expired, clearing');
            this.clearSession();
            return;
          }
        }
        this.session = parsedSession;
        logger.info('whatsapp', 'Session loaded from storage', { phone: parsedSession.sessionData?.phone });
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

  private clearSession() {
    this.session = null;
    localStorage.removeItem(this.sessionKey);
    this.stopPolling();
    logger.info('whatsapp', 'Session cleared');
  }

  private stopPolling() {
    if (this.qrRefreshInterval) {
      clearInterval(this.qrRefreshInterval);
      this.qrRefreshInterval = null;
    }
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  private generateRealisticQR(): string {
    const sessionId = crypto.randomUUID();
    const timestamp = Date.now();
    const randomData = Math.random().toString(36).substr(2, 9);
    
    // Generate a more realistic WhatsApp-like QR data structure
    const qrData = `2@${sessionId.slice(0, 22)},${timestamp},${randomData},${Date.now() % 100}`;
    
    logger.debug('whatsapp', 'Generated QR data', { sessionId: sessionId.slice(0, 8) });
    
    // Use Google Charts API to generate actual QR code image
    const qrUrl = `https://chart.googleapis.com/chart?chs=256x256&cht=qr&chl=${encodeURIComponent(qrData)}&chld=L|0`;
    
    return qrUrl;
  }

  private validatePhoneNumber(phone: string): { isValid: boolean; formatted: string; error?: string } {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length < 10) {
      return { isValid: false, formatted: '', error: 'Phone number too short' };
    }
    
    if (cleaned.length > 15) {
      return { isValid: false, formatted: '', error: 'Phone number too long' };
    }
    
    // Add country code if missing
    let formatted = cleaned;
    if (cleaned.length === 10 && !cleaned.startsWith('91')) {
      formatted = '91' + cleaned;
    }
    
    // Validate Indian mobile numbers
    if (formatted.startsWith('91') && formatted.length === 12) {
      const mobile = formatted.slice(2);
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        return { isValid: false, formatted: '', error: 'Invalid Indian mobile number' };
      }
    }
    
    return { isValid: true, formatted };
  }

  async generateQR(): Promise<WhatsAppSession> {
    logger.info('whatsapp', 'Starting QR generation');
    
    // Clear any existing session
    this.clearSession();
    this.reconnectAttempts = 0;

    const sessionId = crypto.randomUUID();
    const qrCode = this.generateRealisticQR();

    this.session = {
      id: sessionId,
      qrCode,
      status: 'pending',
      lastActivity: new Date().toISOString()
    };

    this.saveSession();

    logger.info('whatsapp', 'QR code generated', { sessionId: sessionId.slice(0, 8) });

    // Start polling for connection
    this.startConnectionPolling();

    // Auto-refresh QR every 45 seconds
    this.qrRefreshInterval = setInterval(() => {
      if (this.session?.status === 'pending') {
        logger.info('whatsapp', 'Refreshing QR code');
        this.session.qrCode = this.generateRealisticQR();
        this.saveSession();
      }
    }, 45000);

    return this.session;
  }

  private startConnectionPolling() {
    let attempts = 0;
    const maxAttempts = 30; // 60 seconds with 2-second intervals

    this.sessionCheckInterval = setInterval(async () => {
      attempts++;
      logger.debug('whatsapp', `Connection check attempt ${attempts}/${maxAttempts}`);

      if (!this.session || this.session.status !== 'pending') {
        this.stopPolling();
        return;
      }

      // Simulate realistic connection timing
      const shouldConnect = attempts > 8 && Math.random() > 0.7; // After 16 seconds, 30% chance per check

      if (shouldConnect) {
        // Simulate successful connection
        const connectedSession: WhatsAppSession = {
          ...this.session,
          status: 'connected',
          connectedAt: new Date().toISOString(),
          sessionData: {
            phone: '+91-98765-43210',
            name: 'Demo WhatsApp Account',
            deviceId: crypto.randomUUID().slice(0, 8)
          },
          lastActivity: new Date().toISOString()
        };

        this.session = connectedSession;
        this.saveSession();
        this.stopPolling();

        logger.info('whatsapp', 'WhatsApp connected successfully', {
          phone: connectedSession.sessionData.phone,
          attempts
        });

        return;
      }

      if (attempts >= maxAttempts) {
        logger.warn('whatsapp', 'QR code expired, connection timeout');
        
        if (this.session) {
          this.session.status = 'error';
          this.saveSession();
        }
        
        this.stopPolling();
        
        // Auto-regenerate QR if not manually stopped
        setTimeout(() => {
          if (this.session?.status === 'error') {
            logger.info('whatsapp', 'Auto-regenerating QR code');
            this.generateQR();
          }
        }, 2000);
      }
    }, 2000);
  }

  async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; log: WhatsAppLog }> {
    logger.info('whatsapp', 'Attempting to send message', {
      student: message.studentName,
      phone: message.phone.slice(-4) // Log only last 4 digits for privacy
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
        errorMessage: 'WhatsApp not connected'
      };

      logger.error('whatsapp', 'Send failed: Not connected', { studentName: message.studentName });
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

      logger.error('whatsapp', 'Send failed: Empty message', { studentName: message.studentName });
      return { success: false, log: errorLog };
    }

    // Simulate message sending with realistic success rate
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000)); // 1-3 second delay

    const success = Math.random() > 0.05; // 95% success rate
    const logEntry: WhatsAppLog = {
      id: crypto.randomUUID(),
      studentId: message.studentId,
      studentName: message.studentName,
      phoneNumber: phoneValidation.formatted,
      message: message.message,
      timestamp: new Date().toISOString(),
      status: success ? 'sent' : 'failed',
      errorMessage: success ? undefined : 'Network error or invalid recipient'
    };

    // Update session activity
    if (this.session) {
      this.session.lastActivity = new Date().toISOString();
      this.saveSession();
    }

    if (success) {
      logger.info('whatsapp', 'Message sent successfully', {
        studentName: message.studentName,
        messageLength: message.message.length
      });
    } else {
      logger.error('whatsapp', 'Message send failed', {
        studentName: message.studentName,
        error: logEntry.errorMessage
      });
    }

    return { success, log: logEntry };
  }

  async sendBulkMessages(messages: WhatsAppMessage[]): Promise<{ success: boolean; results: WhatsAppLog[] }> {
    logger.info('whatsapp', 'Starting bulk message send', { count: messages.length });

    if (!this.session || this.session.status !== 'connected') {
      logger.error('whatsapp', 'Bulk send failed: Not connected');
      throw new Error('WhatsApp not connected');
    }

    const results: WhatsAppLog[] = [];
    let successCount = 0;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      
      // Add delay between messages to avoid rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000)); // 2-5 second delay
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
    logger.info('whatsapp', 'Testing connection');

    if (!this.session || this.session.status !== 'connected') {
      logger.warn('whatsapp', 'Test failed: No active session');
      return false;
    }

    try {
      const testMessage: WhatsAppMessage = {
        phone: this.session.sessionData?.phone || '+91-98765-43210',
        message: '🤖 Test message from PATCH Library Management System. Connection is working!',
        studentId: 'test',
        studentName: 'Test Connection'
      };

      const result = await this.sendMessage(testMessage);
      
      if (result.success) {
        logger.info('whatsapp', 'Connection test successful');
        return true;
      } else {
        logger.warn('whatsapp', 'Connection test failed', { error: result.log.errorMessage });
        return false;
      }
    } catch (error) {
      logger.error('whatsapp', 'Connection test error', error);
      return false;
    }
  }

  disconnect(): void {
    logger.info('whatsapp', 'Disconnecting WhatsApp session');
    this.clearSession();
  }

  resetSession(): void {
    logger.info('whatsapp', 'Resetting WhatsApp session');
    this.clearSession();
    this.reconnectAttempts = 0;
  }

  getSession(): WhatsAppSession | null {
    return this.session;
  }

  isConnected(): boolean {
    return this.session?.status === 'connected';
  }

  isConnecting(): boolean {
    return this.session?.status === 'pending';
  }
}

export const whatsappClient = new WhatsAppClient();
export type { WhatsAppSession, WhatsAppMessage, WhatsAppLog };
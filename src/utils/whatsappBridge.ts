// Browser-compatible WhatsApp bridge for Tauri app
// Uses Tauri IPC instead of Node.js child_process

export interface WhatsAppDevice {
  phone: string;
  pushname: string;
  platform: string;
}

export interface WhatsAppStatus {
  isReady: boolean;
  connectedDevice: WhatsAppDevice | null;
  qrCode: string | null;
}

export interface SendMessageRequest {
  id: string;
  phoneNumber: string;
  message: string;
  attachmentPath?: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  timestamp?: number;
  error?: string;
}

export interface WhatsAppLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

class WhatsAppBridge {
  private callbacks: Map<string, (data: any) => void> = new Map();
  private eventHandlers: Map<string, (data: any) => void> = new Map();
  private isRunning = false;
  private mockSession = {
    isReady: false,
    connectedDevice: null,
    qrCode: null
  };

  constructor() {
    this.bindMethods();
  }

  private bindMethods() {
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    return new Promise((resolve) => {
      try {
        console.log('Starting WhatsApp bridge (browser mode)');
        this.isRunning = true;
        
        // Simulate QR generation after a short delay
        setTimeout(() => {
          this.generateMockQR();
        }, 2000);
        
        resolve();
      } catch (error) {
        console.error('Failed to start WhatsApp bridge:', error);
        throw error;
      }
    });
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    return new Promise((resolve) => {
      console.log('Stopping WhatsApp bridge');
      this.isRunning = false;
      this.mockSession = {
        isReady: false,
        connectedDevice: null,
        qrCode: null
      };
      resolve();
    });
  }

  async resetSession(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('WhatsApp backend not running');
    }
    
    this.mockSession = {
      isReady: false,
      connectedDevice: null,
      qrCode: null
    };
    
    // Generate new QR after reset
    setTimeout(() => {
      this.generateMockQR();
    }, 1000);
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResult> {
    if (!this.isRunning) {
      throw new Error('WhatsApp backend not running');
    }

    if (!this.mockSession.isReady) {
      return {
        success: false,
        error: 'WhatsApp not connected'
      };
    }

    // Simulate message sending
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.2; // 80% success rate for demo
        resolve({
          success,
          messageId: success ? `msg_${Date.now()}` : undefined,
          timestamp: Date.now(),
          error: success ? undefined : 'Failed to send message (demo mode)'
        });
      }, 1000 + Math.random() * 2000);
    });
  }

  async testConnection(): Promise<SendMessageResult> {
    if (!this.isRunning) {
      throw new Error('WhatsApp backend not running');
    }

    if (!this.mockSession.isReady) {
      return {
        success: false,
        error: 'WhatsApp not connected'
      };
    }

    // Simulate test message
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          messageId: `test_${Date.now()}`,
          timestamp: Date.now()
        });
      }, 1000);
    });
  }

  async getStatus(): Promise<WhatsAppStatus> {
    if (!this.isRunning) {
      return {
        isReady: false,
        connectedDevice: null,
        qrCode: null
      };
    }

    return Promise.resolve(this.mockSession);
  }

  async getLogs(limit: number = 50): Promise<WhatsAppLogEntry[]> {
    if (!this.isRunning) {
      return [];
    }

    // Return mock logs
    const mockLogs: WhatsAppLogEntry[] = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'WhatsApp bridge started (browser mode)',
        data: null
      },
      {
        timestamp: new Date(Date.now() - 30000).toISOString(),
        level: 'debug',
        message: 'QR code generated',
        data: { qrCode: 'mock_qr_data' }
      }
    ];

    return Promise.resolve(mockLogs.slice(0, limit));
  }

  on(event: string, handler: (data: any) => void): void {
    this.eventHandlers.set(event, handler);
  }

  off(event: string, handler: (data: any) => void): void {
    const currentHandler = this.eventHandlers.get(event);
    if (currentHandler === handler) {
      this.eventHandlers.delete(event);
    }
  }

  private handleMessage(message: any): void {
    const { type, id, data, result, error } = message;

    switch (type) {
      case 'qr_generated':
        this.emit('qr_generated', data);
        break;

      case 'client_ready':
        this.emit('client_ready', data);
        break;

      case 'authenticated':
        this.emit('authenticated', data);
        break;

      case 'auth_failure':
        this.emit('auth_failure', data);
        break;

      case 'disconnected':
        this.emit('disconnected', data);
        break;

      case 'message_result':
        if (id && this.callbacks.has(id)) {
          const callback = this.callbacks.get(id);
          this.callbacks.delete(id);
          callback!(result);
        }
        break;

      case 'test_result':
        this.emit('test_result', result);
        break;

      case 'status_result':
        this.emit('status_result', result);
        break;

      case 'logs_result':
        this.emit('logs_result', result);
        break;

      case 'error':
        console.error('WhatsApp backend error:', error);
        this.emit('error', { error });
        break;
    }
  }

  private emit(event: string, data: any): void {
    const handler = this.eventHandlers.get(event);
    if (handler) {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    }
  }

  private generateMockQR(): void {
    // Generate a realistic looking QR code as base64
    const mockQR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    this.mockSession.qrCode = mockQR;
    this.emit('qr_generated', { qrCode: mockQR });
    
    // Simulate connection after QR scan (5-10 seconds)
    setTimeout(() => {
      this.mockSession.isReady = true;
      this.mockSession.connectedDevice = {
        phone: '1234567890',
        pushname: 'Demo WhatsApp',
        platform: 'web'
      };
      this.mockSession.qrCode = null;
      
      this.emit('client_ready', this.mockSession.connectedDevice);
    }, 5000 + Math.random() * 5000);
  }

  isBackendRunning(): boolean {
    return this.isRunning;
  }
}

export const whatsappBridge = new WhatsAppBridge();
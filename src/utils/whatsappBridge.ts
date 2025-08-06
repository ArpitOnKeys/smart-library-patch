// Tauri-based WhatsApp bridge with real backend commands
// For browser compatibility, we'll use a mock implementation
declare global {
  interface Window {
    __TAURI__?: {
      invoke: (command: string, args?: any) => Promise<any>;
    };
  }
}

const invoke = async (command: string, args?: any): Promise<any> => {
  if (window.__TAURI__?.invoke) {
    return window.__TAURI__.invoke(command, args);
  }
  
  // Mock implementation for browser mode
  console.log(`Mock Tauri command: ${command}`, args);
  
  switch (command) {
    case 'init_whatsapp':
      return Promise.resolve();
    case 'get_whatsapp_status':
      return Promise.resolve({
        isReady: false,
        connectedDevice: null,
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      });
    case 'send_whatsapp_message':
      return Promise.resolve({
        success: Math.random() > 0.3,
        messageId: `msg_${Date.now()}`,
        timestamp: Date.now(),
        error: Math.random() > 0.3 ? undefined : 'Mock error for testing'
      });
    case 'test_whatsapp_connection':
      return Promise.resolve({
        success: true,
        messageId: `test_${Date.now()}`,
        timestamp: Date.now()
      });
    case 'reset_whatsapp_session':
      return Promise.resolve();
    default:
      throw new Error(`Unknown command: ${command}`);
  }
};

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
  private eventHandlers: Map<string, (data: any) => void> = new Map();
  private pollingInterval: number | null = null;
  private currentStatus: WhatsAppStatus = {
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
    try {
      console.log('Starting WhatsApp bridge (Tauri backend)');
      
      // Initialize WhatsApp client via Tauri command
      await invoke('init_whatsapp');
      
      // Start polling for status updates
      this.startStatusPolling();
      
      console.log('WhatsApp bridge started successfully');
    } catch (error) {
      console.error('Failed to start WhatsApp bridge:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      console.log('Stopping WhatsApp bridge');
      
      // Stop status polling
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
      
      // Reset session via Tauri command
      await invoke('reset_whatsapp_session');
      
      this.currentStatus = {
        isReady: false,
        connectedDevice: null,
        qrCode: null
      };
      
      console.log('WhatsApp bridge stopped');
    } catch (error) {
      console.error('Failed to stop WhatsApp bridge:', error);
      throw error;
    }
  }

  async resetSession(): Promise<void> {
    try {
      console.log('Resetting WhatsApp session');
      
      // Reset session via Tauri command
      await invoke('reset_whatsapp_session');
      
      this.currentStatus = {
        isReady: false,
        connectedDevice: null,
        qrCode: null
      };
      
      // Restart the client
      await this.start();
      
      this.emit('session_reset', {});
    } catch (error) {
      console.error('Failed to reset WhatsApp session:', error);
      throw error;
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResult> {
    try {
      console.log('Sending WhatsApp message:', request);
      
      const result = await invoke('send_whatsapp_message', {
        phoneNumber: request.phoneNumber,
        message: request.message,
        pdfPath: request.attachmentPath
      }) as SendMessageResult;
      
      console.log('Message send result:', result);
      return result;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async testConnection(): Promise<SendMessageResult> {
    try {
      console.log('Testing WhatsApp connection');
      
      const result = await invoke('test_whatsapp_connection') as SendMessageResult;
      
      console.log('Connection test result:', result);
      return result;
    } catch (error) {
      console.error('WhatsApp connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  async getStatus(): Promise<WhatsAppStatus> {
    try {
      const status = await invoke('get_whatsapp_status') as WhatsAppStatus;
      this.currentStatus = status;
      return status;
    } catch (error) {
      console.error('Failed to get WhatsApp status:', error);
      return {
        isReady: false,
        connectedDevice: null,
        qrCode: null
      };
    }
  }

  async getLogs(limit: number = 50): Promise<WhatsAppLogEntry[]> {
    try {
      // For now, return local logs
      const mockLogs: WhatsAppLogEntry[] = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'WhatsApp bridge started (Tauri backend)',
          data: null
        }
      ];
      
      return mockLogs.slice(0, limit);
    } catch (error) {
      console.error('Failed to get WhatsApp logs:', error);
      return [];
    }
  }

  private startStatusPolling(): void {
    // Poll status every 2 seconds
    this.pollingInterval = window.setInterval(async () => {
      try {
        const newStatus = await this.getStatus();
        
        // Check for QR code changes
        if (newStatus.qrCode !== this.currentStatus.qrCode) {
          if (newStatus.qrCode) {
            this.emit('qr_generated', { qrCode: newStatus.qrCode });
          }
        }
        
        // Check for connection changes
        if (newStatus.isReady !== this.currentStatus.isReady) {
          if (newStatus.isReady) {
            this.emit('client_ready', newStatus.connectedDevice);
          } else {
            this.emit('disconnected', {});
          }
        }
        
        this.currentStatus = newStatus;
      } catch (error) {
        console.error('Status polling error:', error);
      }
    }, 2000);
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

  isBackendRunning(): boolean {
    return this.pollingInterval !== null;
  }
}

export const whatsappBridge = new WhatsAppBridge();
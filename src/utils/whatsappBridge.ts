import { ChildProcess, spawn } from 'child_process';
import path from 'path';

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
  private process: ChildProcess | null = null;
  private callbacks: Map<string, (data: any) => void> = new Map();
  private eventHandlers: Map<string, (data: any) => void> = new Map();
  private isRunning = false;

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

    return new Promise((resolve, reject) => {
      try {
        const backendPath = path.join(process.cwd(), 'src', 'services', 'whatsappBackend.js');
        
        this.process = spawn('node', [backendPath], {
          stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
          cwd: process.cwd()
        });

        this.process.on('message', this.handleMessage.bind(this));
        
        this.process.on('error', (error) => {
          console.error('WhatsApp backend error:', error);
          this.isRunning = false;
          reject(error);
        });

        this.process.on('exit', (code) => {
          console.log('WhatsApp backend exited with code:', code);
          this.isRunning = false;
        });

        this.process.stdout?.on('data', (data) => {
          console.log('WhatsApp Backend:', data.toString());
        });

        this.process.stderr?.on('data', (data) => {
          console.error('WhatsApp Backend Error:', data.toString());
        });

        this.isRunning = true;
        this.sendToProcess({ type: 'start' });
        
        // Wait a bit for the process to start
        setTimeout(() => resolve(), 1000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    if (!this.process || !this.isRunning) {
      return;
    }

    return new Promise((resolve) => {
      if (this.process) {
        this.process.on('exit', () => {
          this.isRunning = false;
          resolve();
        });
        
        this.sendToProcess({ type: 'stop' });
        
        // Force kill after 5 seconds
        setTimeout(() => {
          if (this.process && !this.process.killed) {
            this.process.kill('SIGKILL');
            this.isRunning = false;
            resolve();
          }
        }, 5000);
      } else {
        resolve();
      }
    });
  }

  async resetSession(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('WhatsApp backend not running');
    }
    
    this.sendToProcess({ type: 'reset_session' });
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResult> {
    if (!this.isRunning) {
      throw new Error('WhatsApp backend not running');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.callbacks.delete(request.id);
        reject(new Error('Message send timeout'));
      }, 30000); // 30 second timeout

      this.callbacks.set(request.id, (result) => {
        clearTimeout(timeout);
        resolve(result);
      });

      this.sendToProcess({
        type: 'send_message',
        data: request
      });
    });
  }

  async testConnection(): Promise<SendMessageResult> {
    if (!this.isRunning) {
      throw new Error('WhatsApp backend not running');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Test connection timeout'));
      }, 15000);

      const handler = (result: SendMessageResult) => {
        clearTimeout(timeout);
        this.off('test_result', handler);
        resolve(result);
      };

      this.on('test_result', handler);
      this.sendToProcess({ type: 'test_connection' });
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

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Get status timeout'));
      }, 5000);

      const handler = (result: WhatsAppStatus) => {
        clearTimeout(timeout);
        this.off('status_result', handler);
        resolve(result);
      };

      this.on('status_result', handler);
      this.sendToProcess({ type: 'get_status' });
    });
  }

  async getLogs(limit: number = 50): Promise<WhatsAppLogEntry[]> {
    if (!this.isRunning) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Get logs timeout'));
      }, 5000);

      const handler = (result: WhatsAppLogEntry[]) => {
        clearTimeout(timeout);
        this.off('logs_result', handler);
        resolve(result);
      };

      this.on('logs_result', handler);
      this.sendToProcess({ type: 'get_logs', data: { limit } });
    });
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

  private sendToProcess(message: any): void {
    if (this.process && this.isRunning) {
      this.process.send(message);
    }
  }

  isBackendRunning(): boolean {
    return this.isRunning;
  }
}

export const whatsappBridge = new WhatsAppBridge();
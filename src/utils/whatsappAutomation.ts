/**
 * WhatsApp Automation Client for Real Bulk Messaging
 * Uses Tauri backend with whatsapp-web.js integration
 */

// @ts-ignore
const { invoke } = window.__TAURI__?.tauri || { invoke: null };
// @ts-ignore
const { listen } = window.__TAURI__?.event || { listen: null };
import { 
  BulkMessageRequest, 
  StudentMessage, 
  MessageProgress, 
  WhatsAppSession,
  SendStatus 
} from '@/types/whatsapp';
import { Student } from '@/types/database';
import { normalizeToE164 } from './phone';

export class WhatsAppAutomationClient {
  private progressCallback?: (progress: MessageProgress) => void;
  private completeCallback?: () => void;
  private qrCodeCallback?: (qr: string) => void;
  private connectedCallback?: () => void;

  constructor() {
    this.setupEventListeners();
  }

  private async setupEventListeners() {
    // Listen for progress updates
    await listen<MessageProgress>('whatsapp-message-progress', (event) => {
      if (this.progressCallback) {
        this.progressCallback(event.payload);
      }
    });

    // Listen for completion
    await listen('whatsapp-bulk-complete', () => {
      if (this.completeCallback) {
        this.completeCallback();
      }
    });

    // Listen for QR code
    await listen<string>('whatsapp-qr-code', (event) => {
      if (this.qrCodeCallback) {
        this.qrCodeCallback(event.payload);
      }
    });

    // Listen for connection
    await listen('whatsapp-connected', () => {
      if (this.connectedCallback) {
        this.connectedCallback();
      }
    });
  }

  async initializeSession(): Promise<WhatsAppSession> {
    try {
      const session = await invoke<WhatsAppSession>('initialize_whatsapp_session');
      return session;
    } catch (error) {
      throw new Error(`Failed to initialize WhatsApp session: ${error}`);
    }
  }

  async getConnectionStatus(): Promise<boolean> {
    try {
      return await invoke<boolean>('get_whatsapp_status');
    } catch (error) {
      console.error('Failed to get WhatsApp status:', error);
      return false;
    }
  }

  async sendBulkMessages(
    students: Student[],
    messageTemplate: string,
    usePersonalization: boolean = false,
    attachReceipts: boolean = false,
    intervalSeconds: number = 3
  ): Promise<void> {
    const studentMessages: StudentMessage[] = students
      .map(student => {
        const normalizedPhone = normalizeToE164(student.contact);
        if (!normalizedPhone) {
          console.warn(`Invalid phone number for student ${student.name}: ${student.contact}`);
          return null;
        }

        const personalizationTokens: Record<string, string> = usePersonalization ? {
          name: student.name || '—',
          fatherName: student.fatherName || '—',
          seat: student.seatNumber || '—',
          shift: student.shift || '—',
          dueAmount: (student as any).dueAmount?.toString() || '0',
          month: new Date().toLocaleString('default', { month: 'long' }),
          enrollmentNo: student.enrollmentNo || '—',
          contact: student.contact || '—',
          monthlyFees: student.monthlyFees?.toString() || '—',
          seatNumber: student.seatNumber || '—'
        } : {};

        return {
          student_id: student.id,
          name: student.name,
          phone: normalizedPhone,
          receipt_path: attachReceipts ? this.getReceiptPath(student) : undefined,
          personalization_tokens: personalizationTokens
        };
      })
      .filter(msg => msg !== null) as StudentMessage[];

    const request: BulkMessageRequest = {
      students: studentMessages,
      message_template: messageTemplate,
      attach_receipt: attachReceipts,
      interval_seconds: intervalSeconds
    };

    try {
      await invoke('send_bulk_whatsapp_messages', { request });
    } catch (error) {
      throw new Error(`Failed to send bulk messages: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await invoke('disconnect_whatsapp_session');
    } catch (error) {
      console.error('Failed to disconnect WhatsApp:', error);
    }
  }

  private getReceiptPath(student: Student): string | undefined {
    // This would integrate with your existing PDF generation
    // For now, return undefined - implement based on your PDF storage logic
    return undefined;
  }

  // Event handler setters
  onProgress(callback: (progress: MessageProgress) => void) {
    this.progressCallback = callback;
  }

  onComplete(callback: () => void) {
    this.completeCallback = callback;
  }

  onQRCode(callback: (qr: string) => void) {
    this.qrCodeCallback = callback;
  }

  onConnected(callback: () => void) {
    this.connectedCallback = callback;
  }

  // Helper method to personalize message
  personalizeMessage(template: string, tokens: Record<string, string>): string {
    let message = template;
    for (const [key, value] of Object.entries(tokens)) {
      message = message.replace(new RegExp(`{${key}}`, 'g'), value || '—');
    }
    return message;
  }
}

// Singleton instance
export const whatsappClient = new WhatsAppAutomationClient();
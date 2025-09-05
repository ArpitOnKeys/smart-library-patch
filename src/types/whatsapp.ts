/**
 * WhatsApp Integration Types
 * Comprehensive type definitions for bulk messaging system
 */

export enum SendStatus {
  QUEUED = 'queued',
  SENDING = 'sending', 
  SENT = 'sent',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled'
}

export enum BroadcastState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export enum StudentFilter {
  ALL = 'all',
  MORNING = 'morning',
  EVENING = 'evening',
  FULL_TIME = 'fulltime',
  DUE_FEES = 'due_fees'
}

export interface QueueItem {
  id: string;                 // internal queue id
  studentId: string;
  name: string;
  phoneRaw: string;
  phoneE164: string;
  finalMessage: string;
  status: SendStatus;
  attempts: number;
  lastUpdate: number;         // epoch ms
  error?: string;
}

export interface WhatsAppLogEntry {
  ts: number;
  studentId: string;
  name: string;
  phone: string;
  status: SendStatus;
  messageHash: string;        // hash of text for dedupe
  error?: string;
}

export interface BroadcastConfig {
  message: string;
  usePersonalization: boolean;
  audience: StudentFilter;
  interval: number;           // seconds between sends
  jitter: boolean;           // add random delay variation
}

export interface BroadcastStats {
  total: number;
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  remaining: number;
}

export interface WhatsAppSettings {
  defaultCountryCode: string;  // e.g., '+91'
  sendInterval: number;        // seconds (3-10)
  enableJitter: boolean;
  retryAttempts: number;       // max retry attempts per message
  retryBackoffMs: number;      // ms to wait between retries
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  category?: string;
}

export interface PersonalizationTokens {
  name: string;
  fatherName: string;
  seat: string;
  shift: string;
  dueAmount: string;
  month: string;
  enrollmentNo: string;
  contact: string;
  monthlyFees: string;
  seatNumber: string;
}

export interface BulkMessageRequest {
  students: StudentMessage[];
  message_template: string;
  attach_receipt: boolean;
  interval_seconds: number;
}

export interface StudentMessage {
  student_id: string;
  name: string;
  phone: string;
  receipt_path?: string;
  personalization_tokens: Record<string, string>;
}

export interface MessageProgress {
  student_id: string;
  name: string;
  phone: string;
  status: SendStatus;
  error?: string;
  processed: number;
  total: number;
}

export interface WhatsAppSession {
  is_connected: boolean;
  session_id?: string;
  qr_code?: string;
}
/**
 * WhatsApp-Scoped Logger
 * Handles logging for WhatsApp integration only
 */

import { WhatsAppLogEntry, SendStatus } from '@/types/whatsapp';

const STORAGE_KEY = 'whatsapp_broadcast_logs';
const MAX_LOGS = 1000; // Keep latest 1000 logs

/**
 * Generate a simple hash for message deduplication
 */
function generateMessageHash(message: string): string {
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Log a WhatsApp send attempt
 */
export function logWhatsAppAttempt(
  studentId: string,
  name: string,
  phone: string,
  message: string,
  status: SendStatus,
  error?: string
): void {
  const logEntry: WhatsAppLogEntry = {
    ts: Date.now(),
    studentId,
    name,
    phone,
    status,
    messageHash: generateMessageHash(message),
    error
  };
  
  try {
    const existingLogs = getWhatsAppLogs();
    const newLogs = [logEntry, ...existingLogs].slice(0, MAX_LOGS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLogs));
  } catch (error) {
    console.error('Failed to save WhatsApp log:', error);
  }
}

/**
 * Get all WhatsApp logs
 */
export function getWhatsAppLogs(): WhatsAppLogEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load WhatsApp logs:', error);
    return [];
  }
}

/**
 * Clear all WhatsApp logs
 */
export function clearWhatsAppLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear WhatsApp logs:', error);
  }
}

/**
 * Export logs as CSV
 */
export function exportLogsAsCSV(): string {
  const logs = getWhatsAppLogs();
  
  const headers = ['Timestamp', 'Student ID', 'Name', 'Phone', 'Status', 'Error'];
  const rows = logs.map(log => [
    new Date(log.ts).toISOString(),
    log.studentId,
    log.name,
    log.phone,
    log.status,
    log.error || ''
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
  
  return csvContent;
}

/**
 * Download logs as CSV file
 */
export function downloadLogsAsCSV(): void {
  const csvContent = exportLogsAsCSV();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `whatsapp_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Get summary statistics from logs
 */
export function getLogsSummary(timeRangeHours?: number): {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  lastHours?: number;
} {
  const logs = getWhatsAppLogs();
  
  const filteredLogs = timeRangeHours 
    ? logs.filter(log => log.ts > Date.now() - (timeRangeHours * 60 * 60 * 1000))
    : logs;
  
  const summary = filteredLogs.reduce(
    (acc, log) => {
      acc.total++;
      switch (log.status) {
        case SendStatus.SENT:
          acc.sent++;
          break;
        case SendStatus.FAILED:
          acc.failed++;
          break;
        case SendStatus.SKIPPED:
          acc.skipped++;
          break;
      }
      return acc;
    },
    { total: 0, sent: 0, failed: 0, skipped: 0 }
  );
  
  return timeRangeHours ? { ...summary, lastHours: timeRangeHours } : summary;
}
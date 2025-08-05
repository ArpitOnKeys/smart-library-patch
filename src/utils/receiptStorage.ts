import { Student, FeePayment } from '@/types/database';

export interface ReceiptLog {
  id: string;
  studentId: string;
  studentName: string;
  paymentId: string;
  fileName: string;
  generatedAt: string;
  amount: number;
  month: string;
  year: number;
  whatsappSent: boolean;
  whatsappSentAt?: string;
}


const RECEIPT_LOGS_KEY = 'receipt_logs';

export const saveReceiptLog = (log: Omit<ReceiptLog, 'id' | 'generatedAt'>): ReceiptLog => {
  const logs = getReceiptLogs();
  const newLog: ReceiptLog = {
    ...log,
    id: crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
  };
  
  logs.push(newLog);
  localStorage.setItem(RECEIPT_LOGS_KEY, JSON.stringify(logs));
  
  return newLog;
};

export const getReceiptLogs = (): ReceiptLog[] => {
  const logs = localStorage.getItem(RECEIPT_LOGS_KEY);
  return logs ? JSON.parse(logs) : [];
};

export const updateReceiptWhatsAppStatus = (receiptId: string, sent: boolean): void => {
  const logs = getReceiptLogs();
  const logIndex = logs.findIndex(log => log.id === receiptId);
  
  if (logIndex !== -1) {
    logs[logIndex].whatsappSent = sent;
    if (sent) {
      logs[logIndex].whatsappSentAt = new Date().toISOString();
    }
    localStorage.setItem(RECEIPT_LOGS_KEY, JSON.stringify(logs));
  }
};

export const getReceiptLogByPayment = (paymentId: string): ReceiptLog | undefined => {
  const logs = getReceiptLogs();
  return logs.find(log => log.paymentId === paymentId);
};

export const generateReceiptFileName = (student: Student, payment: FeePayment): string => {
  const date = new Date(payment.paymentDate);
  const formattedDate = date.toISOString().slice(0, 7); // YYYY-MM
  return `RECEIPT_${student.enrollmentNo}_${payment.month}_${payment.year}_${Date.now()}.pdf`;
};
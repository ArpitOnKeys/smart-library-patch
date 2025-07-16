
export interface Student {
  id: string;
  name: string;
  fatherName: string;
  contact: string;
  aadharNumber: string;
  address: string;
  shift: 'Morning' | 'Evening';
  monthlyFees: number;
  seatNumber: string;
  admissionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeePayment {
  id: string;
  studentId: string;
  amount: number;
  paymentDate: string;
  month: string;
  year: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
}

export interface WhatsAppLog {
  id: string;
  studentId: string;
  studentName: string;
  message: string;
  amount?: number;
  sentAt: string;
  status: 'sent' | 'failed' | 'pending';
}

export interface Admin {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

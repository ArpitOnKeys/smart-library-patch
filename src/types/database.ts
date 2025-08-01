
export interface Student {
  id: string;
  enrollmentNo: string;
  name: string;
  fatherName: string;
  contact: string;
  aadharNumber: string;
  address: string;
  gender: 'Male' | 'Female';
  shift: 'Morning' | 'Evening' | 'Full Time';
  timing: string;
  monthlyFees: number;
  feesPaidTill: string;
  seatNumber: string;
  joiningDate: string;
  admissionDate: string;
  assignedStaff: string;
  paymentMode: 'Cash' | 'Online' | 'UPI' | 'Card';
  profilePicture?: string;
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
  securityQuestion: string;
  securityAnswerHash: string;
  createdAt: string;
  updatedAt: string;
}

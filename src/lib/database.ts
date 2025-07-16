import { Student, FeePayment, Expense, WhatsAppLog, Admin } from '@/types/database';

// Utility to generate unique IDs
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Local storage keys
export const STORAGE_KEYS = {
  STUDENTS: 'patch_students',
  FEE_PAYMENTS: 'patch_fee_payments',
  EXPENSES: 'patch_expenses',
  WHATSAPP_LOGS: 'patch_whatsapp_logs',
  ADMIN: 'patch_admin',
  CURRENT_USER: 'patch_current_user'
};

// Tauri-aware storage implementation
class TauriAwareStorage {
  private isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

  get<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading from storage (${key}):`, error);
      return [];
    }
  }

  set<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      if (this.isTauri) {
        // In Tauri, we could also save to file system for backup
        console.log(`Data saved to localStorage: ${key}`);
      }
    } catch (error) {
      console.error(`Error writing to storage (${key}):`, error);
    }
  }

  getSingle<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading single item from storage (${key}):`, error);
      return null;
    }
  }

  setSingle<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      if (this.isTauri) {
        console.log(`Single item saved to localStorage: ${key}`);
      }
    } catch (error) {
      console.error(`Error writing single item to storage (${key}):`, error);
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from storage (${key}):`, error);
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

export const storage = new TauriAwareStorage();

// Database operations for Students
export const studentDb = {
  getAll: (): Student[] => storage.get<Student>(STORAGE_KEYS.STUDENTS),
  
  create: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Student => {
    const newStudent: Student = {
      ...student,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const students = studentDb.getAll();
    students.push(newStudent);
    storage.set(STORAGE_KEYS.STUDENTS, students);
    return newStudent;
  },
  
  update: (id: string, updates: Partial<Student>): Student | null => {
    const students = studentDb.getAll();
    const index = students.findIndex(s => s.id === id);
    
    if (index === -1) return null;
    
    students[index] = {
      ...students[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    storage.set(STORAGE_KEYS.STUDENTS, students);
    return students[index];
  },
  
  delete: (id: string): boolean => {
    const students = studentDb.getAll();
    const filteredStudents = students.filter(s => s.id !== id);
    
    if (filteredStudents.length === students.length) return false;
    
    storage.set(STORAGE_KEYS.STUDENTS, filteredStudents);
    return true;
  },
  
  getById: (id: string): Student | null => {
    const students = studentDb.getAll();
    return students.find(s => s.id === id) || null;
  }
};

// Database operations for Fee Payments
export const feePaymentDb = {
  getAll: (): FeePayment[] => storage.get<FeePayment>(STORAGE_KEYS.FEE_PAYMENTS),
  
  create: (payment: Omit<FeePayment, 'id' | 'createdAt'>): FeePayment => {
    const newPayment: FeePayment = {
      ...payment,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    
    const payments = feePaymentDb.getAll();
    payments.push(newPayment);
    storage.set(STORAGE_KEYS.FEE_PAYMENTS, payments);
    return newPayment;
  },
  
  getByStudentId: (studentId: string): FeePayment[] => {
    return feePaymentDb.getAll().filter(p => p.studentId === studentId);
  }
};

// Database operations for Expenses
export const expenseDb = {
  getAll: (): Expense[] => storage.get<Expense>(STORAGE_KEYS.EXPENSES),
  
  create: (expense: Omit<Expense, 'id' | 'createdAt'>): Expense => {
    const newExpense: Expense = {
      ...expense,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    
    const expenses = expenseDb.getAll();
    expenses.push(newExpense);
    storage.set(STORAGE_KEYS.EXPENSES, expenses);
    return newExpense;
  },
  
  delete: (id: string): boolean => {
    const expenses = expenseDb.getAll();
    const filteredExpenses = expenses.filter(e => e.id !== id);
    
    if (filteredExpenses.length === expenses.length) return false;
    
    storage.set(STORAGE_KEYS.EXPENSES, filteredExpenses);
    return true;
  }
};

// Initialize default admin user
export const initializeAdmin = () => {
  const existingAdmin = storage.getSingle<Admin>(STORAGE_KEYS.ADMIN);
  if (!existingAdmin) {
    // Default admin: username "admin", password "admin123"
    const defaultAdmin: Admin = {
      id: generateId(),
      username: 'admin',
      passwordHash: btoa('admin123'), // Simple base64 encoding for demo
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    storage.setSingle(STORAGE_KEYS.ADMIN, defaultAdmin);
    console.log('Default admin created - Username: admin, Password: admin123');
  }
};

// Authentication utilities
export const auth = {
  login: (username: string, password: string): boolean => {
    const admin = storage.getSingle<Admin>(STORAGE_KEYS.ADMIN);
    if (!admin) return false;
    
    const isValid = admin.username === username && atob(admin.passwordHash) === password;
    
    if (isValid) {
      storage.setSingle(STORAGE_KEYS.CURRENT_USER, { username, loginTime: new Date().toISOString() });
    }
    
    return isValid;
  },
  
  logout: (): void => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },
  
  isAuthenticated: (): boolean => {
    return storage.getSingle(STORAGE_KEYS.CURRENT_USER) !== null;
  },
  
  getCurrentUser: () => {
    return storage.getSingle(STORAGE_KEYS.CURRENT_USER);
  }
};

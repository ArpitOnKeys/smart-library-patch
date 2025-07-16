import { storage } from '@/lib/database';

export interface BackupData {
  version: string;
  timestamp: string;
  students: any[];
  feePayments: any[];
  expenses: any[];
  whatsappLogs: any[];
  admin: any;
}

export const exportData = (): void => {
  const backupData: BackupData = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    students: storage.get('patch_students'),
    feePayments: storage.get('patch_fee_payments'),
    expenses: storage.get('patch_expenses'),
    whatsappLogs: storage.get('patch_whatsapp_logs'),
    admin: storage.getSingle('patch_admin')
  };

  const dataStr = JSON.stringify(backupData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `patch-library-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  URL.revokeObjectURL(link.href);
};

export const importData = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') {
          throw new Error('Failed to read file');
        }
        
        const data: BackupData = JSON.parse(result);
        
        // Validate backup structure
        if (!data.version || !data.students || !data.feePayments || !data.expenses) {
          throw new Error('Invalid backup file structure');
        }

        // Import all data
        storage.set('patch_students', data.students || []);
        storage.set('patch_fee_payments', data.feePayments || []);
        storage.set('patch_expenses', data.expenses || []);
        storage.set('patch_whatsapp_logs', data.whatsappLogs || []);
        
        if (data.admin) {
          storage.setSingle('patch_admin', data.admin);
        }
        
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const exportAllData = exportData;
export const importAllData = (data: BackupData): void => {
  // Validate backup structure
  if (!data.version || !data.students || !data.feePayments || !data.expenses) {
    throw new Error('Invalid backup file structure');
  }

  // Import all data
  storage.set('patch_students', data.students || []);
  storage.set('patch_fee_payments', data.feePayments || []);
  storage.set('patch_expenses', data.expenses || []);
  storage.set('patch_whatsapp_logs', data.whatsappLogs || []);
  
  if (data.admin) {
    storage.setSingle('patch_admin', data.admin);
  }
};

export const clearAllData = (): void => {
  const keysToKeep = ['patch_admin', 'patch_current_user'];
  const allKeys = Object.keys(localStorage);
  
  allKeys.forEach(key => {
    if (key.startsWith('patch_') && !keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });
};

export const generateDataSummary = (data: BackupData): string => {
  return `
    Students: ${data.students?.length || 0}
    Fee Payments: ${data.feePayments?.length || 0}
    Expenses: ${data.expenses?.length || 0}
    WhatsApp Logs: ${data.whatsappLogs?.length || 0}
    Backup Date: ${new Date(data.timestamp).toLocaleDateString()}
  `;
};

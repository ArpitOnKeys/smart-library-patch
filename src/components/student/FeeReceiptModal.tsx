import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Student } from '@/types/database';
import { WhatsAppPDFIntegration } from '../whatsapp/WhatsAppPDFIntegration';

interface FeeReceiptModalProps {
  student: Student | null;
  open: boolean;
  onClose: () => void;
}

export const FeeReceiptModal = ({ student, open, onClose }: FeeReceiptModalProps) => {
  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Fee Receipt - {student.name}</DialogTitle>
        </DialogHeader>
        <WhatsAppPDFIntegration student={student} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};
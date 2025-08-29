import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { studentDb, feePaymentDb } from '@/lib/database';
import { ReceiptGenerator } from './ReceiptGenerator';
import { BulkReceiptGenerator } from './BulkReceiptGenerator';
import { TestTube, FileText, Users, Calendar } from 'lucide-react';

export const ReceiptTestPanel: React.FC = () => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('');
  
  const { toast } = useToast();
  
  const students = studentDb.getAll();
  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const studentPayments = selectedStudent ? feePaymentDb.getByStudentId(selectedStudent.id) : [];
  const selectedPayment = studentPayments.find(p => p.id === selectedPaymentId);

  const handleTestWhatsApp = (pdfBlob: Blob) => {
    if (!selectedStudent) return;
    
    // Create download link for testing
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TestReceipt_${selectedStudent.name.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Test Receipt Generated! 🧪",
      description: "Receipt downloaded for testing. WhatsApp integration would send this PDF."
    });
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Receipt Testing & Demo Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Single Receipt */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Test Single Receipt
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Student</label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.enrollmentNo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Payment</label>
                <Select 
                  value={selectedPaymentId} 
                  onValueChange={setSelectedPaymentId}
                  disabled={!selectedStudent}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a payment" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentPayments.map(payment => (
                      <SelectItem key={payment.id} value={payment.id}>
                        {payment.month} {payment.year} - ₹{payment.amount}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedStudent && selectedPayment && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{selectedStudent.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedStudent.enrollmentNo} • Seat {selectedStudent.seatNumber}
                    </p>
                  </div>
                  <Badge variant="default">₹{selectedPayment.amount}</Badge>
                </div>
                
                <ReceiptGenerator
                  student={selectedStudent}
                  payment={selectedPayment}
                  onWhatsAppSend={handleTestWhatsApp}
                />
              </div>
            )}
          </div>

          {/* Test Bulk Generation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Test Bulk Generation
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{students.length}</div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {feePaymentDb.getAll().length}
                </div>
                <div className="text-sm text-muted-foreground">Total Payments</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {studentsWithPayments.length}
                </div>
                <div className="text-sm text-muted-foreground">With Receipts</div>
              </div>
            </div>

            <div className="flex justify-center">
              <BulkReceiptGenerator />
            </div>
          </div>

          {/* Testing Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Single Receipt Testing:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Select any student with payment history</li>
                    <li>Click "Preview" to see styled receipt</li>
                    <li>Click "Download PDF" to test PDF generation</li>
                    <li>Click "Send via WhatsApp" to test integration</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Bulk Generation Testing:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Select multiple students from the list</li>
                    <li>Choose download or WhatsApp mode</li>
                    <li>Monitor progress during generation</li>
                    <li>Verify all receipts are properly formatted</li>
                  </ul>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Pro Tip:</strong> Use the settings gear icon to customize logo, colors, and receipt options before generating receipts.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
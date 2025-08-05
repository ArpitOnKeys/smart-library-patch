
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { studentDb, feePaymentDb } from '@/lib/database';
import { Student, FeePayment } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { IndianRupee, Download, MessageCircle, Plus, Calculator, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useWhatsAppService } from '@/hooks/useWhatsAppService';
import { generateProfessionalReceipt, downloadPDF, savePDFToLocal } from '@/utils/pdfGenerator';
import { saveReceiptLog, updateReceiptWhatsAppStatus, generateReceiptFileName } from '@/utils/receiptStorage';

interface FeeTrackerProps {
  refreshTrigger: number;
}

export const FeeTracker = ({ refreshTrigger }: FeeTrackerProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMonth, setPaymentMonth] = useState('');
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear().toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState<string | null>(null);
  const { toast } = useToast();
  const { sendMessage, isConnected } = useWhatsAppService();

  useEffect(() => {
    loadStudents();
  }, [refreshTrigger]);

  useEffect(() => {
    if (selectedStudent) {
      loadFeePayments(selectedStudent.id);
    }
  }, [selectedStudent]);

  const loadStudents = () => {
    const allStudents = studentDb.getAll();
    setStudents(allStudents);
  };

  const loadFeePayments = (studentId: string) => {
    const payments = feePaymentDb.getByStudentId(studentId);
    setFeePayments(payments);
  };

  const getCurrentMonth = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[new Date().getMonth()];
  };

  const calculateTotalPaid = () => {
    return feePayments.reduce((total, payment) => total + payment.amount, 0);
  };

  const calculateMonthsRegistered = () => {
    if (!selectedStudent) return 0;
    const admissionDate = new Date(selectedStudent.admissionDate);
    const currentDate = new Date();
    const monthDiff = (currentDate.getFullYear() - admissionDate.getFullYear()) * 12 + 
                     (currentDate.getMonth() - admissionDate.getMonth()) + 1;
    return Math.max(monthDiff, 1);
  };

  const calculateTotalDue = () => {
    if (!selectedStudent) return 0;
    const monthsRegistered = calculateMonthsRegistered();
    const totalExpected = selectedStudent.monthlyFees * monthsRegistered;
    const totalPaid = calculateTotalPaid();
    return Math.max(totalExpected - totalPaid, 0);
  };

  const handleAddPayment = async () => {
    if (!selectedStudent || !paymentAmount || !paymentMonth) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const amount = Number(paymentAmount);
      if (amount <= 0) {
        toast({
          title: 'Error',
          description: 'Payment amount must be greater than 0.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Check if payment for this month/year already exists
      const existingPayment = feePayments.find(
        payment => payment.month === paymentMonth && payment.year === Number(paymentYear)
      );

      if (existingPayment) {
        toast({
          title: 'Error',
          description: `Payment for ${paymentMonth} ${paymentYear} already exists.`,
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const newPayment = feePaymentDb.create({
        studentId: selectedStudent.id,
        amount,
        paymentDate: new Date().toISOString(),
        month: paymentMonth,
        year: Number(paymentYear),
      });

      toast({
        title: 'Payment Added!',
        description: `₹${amount} payment recorded for ${paymentMonth} ${paymentYear}`,
      });

      // Auto-generate PDF and send WhatsApp
      await handleAutoGenerateAndSend(newPayment);

      loadFeePayments(selectedStudent.id);
      setPaymentAmount('');
      setPaymentMonth('');
      setIsPaymentDialogOpen(false);
      
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePDFSlip = async (payment: FeePayment) => {
    if (!selectedStudent) {
      console.error('No student selected for PDF generation');
      return;
    }
    
    console.log('Starting PDF generation for payment:', payment.id);
    setIsGeneratingPDF(payment.id);
    
    try {
      // Validate required data
      if (!selectedStudent.name || !selectedStudent.contact || !selectedStudent.enrollmentNo) {
        throw new Error('Student data is incomplete. Missing required fields.');
      }
      
      if (!payment.amount || payment.amount <= 0) {
        throw new Error('Invalid payment amount');
      }
      
      const receiptData = {
        student: selectedStudent,
        payment,
        totalPaid: calculateTotalPaid(),
        totalDue: calculateTotalDue(),
        monthsRegistered: calculateMonthsRegistered(),
      };
      
      console.log('Generating PDF with data:', receiptData);
      
      const pdfBytes = await generateProfessionalReceipt(receiptData);
      
      if (!pdfBytes || pdfBytes.length === 0) {
        throw new Error('PDF generation returned empty file');
      }
      
      const fileName = generateReceiptFileName(selectedStudent, payment);
      console.log('Generated PDF file:', fileName, 'Size:', pdfBytes.length, 'bytes');
      
      // Save PDF to local storage
      const savedPath = await savePDFToLocal(pdfBytes, fileName);
      console.log('PDF saved to path:', savedPath);
      
      // Save receipt log
      const receiptLog = saveReceiptLog({
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        paymentId: payment.id,
        fileName,
        amount: payment.amount,
        month: payment.month,
        year: payment.year,
        whatsappSent: false,
      });
      
      console.log('Receipt log saved:', receiptLog);
      
      // Download the PDF
      downloadPDF(pdfBytes, fileName);
      
      toast({
        title: 'PDF Receipt Generated!',
        description: `Professional receipt downloaded: ${fileName}`,
      });
      
      return pdfBytes;
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'PDF Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate PDF receipt. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGeneratingPDF(null);
    }
  };

  const sendWhatsAppMessage = async (payment: FeePayment, pdfBytes?: Uint8Array) => {
    if (!selectedStudent) return;
    
    if (!isConnected) {
      toast({
        title: 'WhatsApp Not Connected',
        description: 'Please connect your WhatsApp account first.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSendingWhatsApp(payment.id);
    
    try {
      const message = `🎓 *PATCH - The Smart Library*\n📋 *Fee Receipt*\n\nDear ${selectedStudent.name},\n\nYour fee payment has been successfully received!\n\n💰 *Amount:* ₹${payment.amount}\n📅 *Period:* ${payment.month} ${payment.year}\n🪑 *Seat:* ${selectedStudent.seatNumber}\n📱 *Contact:* ${selectedStudent.contact}\n\n📊 *Summary:*\n✅ Total Paid: ₹${calculateTotalPaid()}\n${calculateTotalDue() > 0 ? `⚠️ Remaining Due: ₹${calculateTotalDue()}` : '✅ All dues cleared!'}\n\n${pdfBytes ? '📎 Official receipt attached below.\n\n' : ''}Thank you for your prompt payment!\n\n📚 *PATCH - The Smart Library*\n🏢 [Your Address]\n📞 [Your Contact]`;
      
      const success = await sendMessage({
        phone: selectedStudent.contact,
        message,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
      }, pdfBytes ? 'receipt-path' : undefined); // TODO: Pass actual saved PDF path
      
      if (success) {
        // Update receipt log if exists
        updateReceiptWhatsAppStatus(payment.id, true);
        
        toast({
          title: 'WhatsApp Message Sent!',
          description: `Receipt sent to ${selectedStudent.name} successfully.`,
        });
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      toast({
        title: 'Failed to Send',
        description: 'Could not send WhatsApp message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingWhatsApp(null);
    }
  };

  const handleAutoGenerateAndSend = async (payment: FeePayment) => {
    if (!selectedStudent) {
      console.error('No student selected for auto-generate and send');
      return;
    }
    
    console.log('Starting auto-generate and send for payment:', payment.id);
    
    try {
      // Step 1: Generate PDF
      console.log('Step 1: Generating PDF...');
      const pdfBytes = await generatePDFSlip(payment);
      
      if (!pdfBytes) {
        console.error('PDF generation failed, cannot proceed with WhatsApp');
        toast({
          title: 'PDF Generation Failed',
          description: 'Cannot send WhatsApp message without PDF receipt.',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('PDF generated successfully, size:', pdfBytes.length);
      
      // Step 2: Send WhatsApp message with PDF reference
      if (isConnected) {
        console.log('Step 2: Sending WhatsApp message...');
        await sendWhatsAppMessage(payment, pdfBytes);
      } else {
        console.log('WhatsApp not connected, skipping message send');
        toast({
          title: 'PDF Generated',
          description: 'PDF generated successfully. Connect WhatsApp to send automatically.',
        });
      }
      
    } catch (error) {
      console.error('Error in auto-generate and send:', error);
      toast({
        title: 'Process Failed',
        description: error instanceof Error ? error.message : 'Failed to complete PDF generation and WhatsApp sending.',
        variant: 'destructive',
      });
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Fee Tracker & Payment Manager
          </CardTitle>
          <CardDescription>
            Track fee payments, generate receipts, and send WhatsApp notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Student Selection */}
            <div className="space-y-2">
              <Label>Select Student</Label>
              <Select
                value={selectedStudent?.id || ''}
                onValueChange={(value) => {
                  const student = students.find(s => s.id === value);
                  setSelectedStudent(student || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student to track fees" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} - Seat {student.seatNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStudent && (
              <>
                {/* Fee Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">₹{selectedStudent.monthlyFees}</div>
                    <div className="text-sm text-muted-foreground">Monthly Fees</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">₹{calculateTotalPaid()}</div>
                    <div className="text-sm text-muted-foreground">Total Paid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">₹{calculateTotalDue()}</div>
                    <div className="text-sm text-muted-foreground">Total Due</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{calculateMonthsRegistered()}</div>
                    <div className="text-sm text-muted-foreground">Months Registered</div>
                  </div>
                </div>

                {/* Add Payment Button */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Payment History</h3>
                  <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Fee Payment</DialogTitle>
                        <DialogDescription>
                          Record a new fee payment for {selectedStudent.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Payment Amount (₹)</Label>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Month</Label>
                            <Select value={paymentMonth} onValueChange={setPaymentMonth}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select month" />
                              </SelectTrigger>
                              <SelectContent>
                                {months.map((month) => (
                                  <SelectItem key={month} value={month}>{month}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Year</Label>
                            <Select value={paymentYear} onValueChange={setPaymentYear}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {years.map((year) => (
                                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddPayment} disabled={isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add Payment'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Payment History Table */}
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Month/Year</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feePayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No payments recorded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        feePayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {format(new Date(payment.paymentDate), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell>{payment.month} {payment.year}</TableCell>
                            <TableCell className="font-medium">₹{payment.amount}</TableCell>
                            <TableCell>
                              <Badge variant="default">Paid</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generatePDFSlip(payment)}
                                  disabled={isGeneratingPDF === payment.id}
                                >
                                  {isGeneratingPDF === payment.id ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => sendWhatsAppMessage(payment)}
                                  disabled={isSendingWhatsApp === payment.id || !isConnected}
                                >
                                  {isSendingWhatsApp === payment.id ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

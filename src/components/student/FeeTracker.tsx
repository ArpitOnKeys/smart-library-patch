import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { studentDb, feePaymentDb } from '@/lib/database';
import { Student, FeePayment } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { IndianRupee, Download, MessageCircle, Plus, Calculator, Receipt, Users } from 'lucide-react';
import { format } from 'date-fns';
import { EnhancedReceiptGenerator } from '@/components/receipts/EnhancedReceiptGenerator';
import { BulkReceiptGenerator } from '@/components/receipts/BulkReceiptGenerator';
import { ReceiptPreviewPanel } from '@/components/receipts/ReceiptPreviewPanel';

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
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const { toast } = useToast();

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

  const handleStudentSelection = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(students.map(s => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid grid-cols-4 w-fit">
          <TabsTrigger value="individual">Individual Tracking</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Generation</TabsTrigger>
          <TabsTrigger value="preview">Receipt Preview</TabsTrigger>
          <TabsTrigger value="enhanced">Enhanced Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Individual Fee Tracker & Receipt Generator
              </CardTitle>
              <CardDescription>
                Track fee payments and generate styled PDF receipts with WhatsApp integration
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
                                      onClick={() => {
                                        // Generate receipt for existing payment
                                        const receiptData = {
                                          receiptNumber: `PATCH${Date.now()}`,
                                          studentName: selectedStudent.name,
                                          enrollmentNo: selectedStudent.enrollmentNo,
                                          fatherName: selectedStudent.fatherName,
                                          contact: selectedStudent.contact,
                                          seatNumber: selectedStudent.seatNumber,
                                          amount: payment.amount,
                                          month: payment.month,
                                          year: payment.year,
                                          paymentDate: payment.paymentDate,
                                          monthlyFees: selectedStudent.monthlyFees,
                                          totalPaid: calculateTotalPaid(),
                                          totalDue: calculateTotalDue(),
                                          monthsRegistered: calculateMonthsRegistered()
                                        };
                                        
                                        // Simple text receipt for existing payments
                                        const content = `
PATCH - THE SMART LIBRARY
Fee Receipt

Receipt No: ${receiptData.receiptNumber}
Date: ${format(new Date(payment.paymentDate), 'dd/MM/yyyy')}

Student: ${selectedStudent.name}
Amount: ₹${payment.amount}
Month: ${payment.month} ${payment.year}
Seat: ${selectedStudent.seatNumber}

Thank you for your payment!
                                        `.trim();
                                        
                                        const blob = new Blob([content], { type: 'text/plain' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `Receipt_${selectedStudent.name}_${payment.month}_${payment.year}.txt`;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                      }}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const message = `Hello ${selectedStudent.name}! Your fee payment of ₹${payment.amount} for ${payment.month} ${payment.year} has been received. Receipt No: PATCH${Date.now()}. Thank you! - PATCH Library`;
                                        const cleanedPhone = selectedStudent.contact.replace(/\D/g, '');
                                        const phoneNumber = cleanedPhone.startsWith('91') ? cleanedPhone : '91' + cleanedPhone;
                                        const encodedMessage = encodeURIComponent(message);
                                        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
                                      }}
                                    >
                                      <MessageCircle className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="enhanced" className="space-y-4">
          {selectedStudent ? (
            <EnhancedReceiptGenerator 
              student={selectedStudent}
              onReceiptGenerated={() => {
                loadFeePayments(selectedStudent.id);
                toast({
                  title: 'Payment Recorded',
                  description: 'Payment has been added to the system'
                });
              }}
            />
          ) : (
            <Card className="glass-card">
              <CardContent className="text-center py-8">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Select a Student</h3>
                <p className="text-muted-foreground">
                  Choose a student from the Individual Tracking tab to use the enhanced receipt generator
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <BulkReceiptGenerator 
            students={students}
            selectedStudents={students.filter(s => selectedStudents.has(s.id))}
          />
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <ReceiptPreviewPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};
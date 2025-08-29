import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { studentDb, feePaymentDb } from '@/lib/database';
import { Student } from '@/types/database';
import { 
  generateVisualReceiptPDF, 
  createReceiptData,
  getReceiptSettings,
  logReceiptGeneration
} from '@/utils/receiptGenerator';
import { 
  Download, 
  MessageSquare, 
  Users, 
  FileText, 
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface BulkReceiptGeneratorProps {
  students: Student[];
  selectedStudents?: Student[];
}

interface BulkProgress {
  total: number;
  completed: number;
  current: string;
  errors: string[];
}

export const BulkReceiptGenerator: React.FC<BulkReceiptGeneratorProps> = ({
  students,
  selectedStudents = []
}) => {
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkMonth, setBulkMonth] = useState('');
  const [bulkYear, setBulkYear] = useState(new Date().getFullYear().toString());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BulkProgress>({
    total: 0,
    completed: 0,
    current: '',
    errors: []
  });
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [useIndividualFees, setUseIndividualFees] = useState(true);

  const { toast } = useToast();

  const targetStudents = selectedStudents.length > 0 ? selectedStudents : students;

  const calculateStudentFeeData = (student: Student, amount: number) => {
    const payments = feePaymentDb.getByStudentId(student.id);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const admissionDate = new Date(student.admissionDate);
    const currentDate = new Date();
    const monthsRegistered = (currentDate.getFullYear() - admissionDate.getFullYear()) * 12 + 
                            (currentDate.getMonth() - admissionDate.getMonth()) + 1;
    
    const totalExpected = student.monthlyFees * Math.max(monthsRegistered, 1);
    const totalDue = Math.max(totalExpected - totalPaid - amount, 0);

    return {
      totalPaid: totalPaid + amount,
      totalDue,
      monthsRegistered: Math.max(monthsRegistered, 1)
    };
  };

  const handleBulkGeneration = async () => {
    if (!bulkMonth || !bulkYear) {
      toast({
        title: 'Error',
        description: 'Please select month and year',
        variant: 'destructive'
      });
      return;
    }

    if (!useIndividualFees && !bulkAmount) {
      toast({
        title: 'Error',
        description: 'Please enter bulk amount or enable individual fees',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    setProgress({
      total: targetStudents.length,
      completed: 0,
      current: '',
      errors: []
    });

    const settings = getReceiptSettings();
    const errors: string[] = [];

    for (let i = 0; i < targetStudents.length; i++) {
      const student = targetStudents[i];
      
      setProgress(prev => ({
        ...prev,
        current: student.name,
        completed: i
      }));

      try {
        const amount = useIndividualFees 
          ? student.monthlyFees 
          : parseFloat(bulkAmount);

        const feeData = calculateStudentFeeData(student, amount);
        const receiptData = createReceiptData(
          student,
          amount,
          bulkMonth,
          parseInt(bulkYear),
          feeData.totalPaid,
          feeData.totalDue,
          feeData.monthsRegistered
        );

        // Generate PDF receipt
        await generateVisualReceiptPDF(receiptData, student, settings);
        
        // Record payment
        feePaymentDb.create({
          studentId: student.id,
          amount,
          paymentDate: new Date().toISOString(),
          month: bulkMonth,
          year: parseInt(bulkYear)
        });

        // Send WhatsApp if enabled
        if (sendWhatsApp) {
          const message = `Dear ${student.name},

Your fee receipt for ${bulkMonth} ${bulkYear}:

💰 Amount: ₹${amount}
🎫 Receipt: ${receiptData.receiptNumber}
💺 Seat: ${student.seatNumber}

Thank you for your payment!
- PATCH Library`;

          const cleanedPhone = student.contact.replace(/\D/g, '');
          const phoneNumber = cleanedPhone.startsWith('91') ? cleanedPhone : '91' + cleanedPhone;
          const encodedMessage = encodeURIComponent(message);
          
          try {
            window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
            
            // Log WhatsApp attempt
            const whatsappLogs = JSON.parse(localStorage.getItem('patch_whatsapp_logs') || '[]');
            whatsappLogs.push({
              id: Date.now().toString() + i,
              studentId: student.id,
              studentName: student.name,
              message,
              amount,
              sentAt: new Date().toISOString(),
              status: 'sent'
            });
            localStorage.setItem('patch_whatsapp_logs', JSON.stringify(whatsappLogs));
          } catch (whatsappError) {
            console.warn(`WhatsApp failed for ${student.name}:`, whatsappError);
          }
        }

        logReceiptGeneration(receiptData, true);
        
        // Add delay between generations to prevent overwhelming the system
        if (i < targetStudents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        const errorMessage = `${student.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMessage);
        
        if (bulkAmount) {
          const feeData = calculateStudentFeeData(student, parseFloat(bulkAmount));
          const receiptData = createReceiptData(
            student,
            parseFloat(bulkAmount),
            bulkMonth,
            parseInt(bulkYear),
            feeData.totalPaid,
            feeData.totalDue,
            feeData.monthsRegistered
          );
          logReceiptGeneration(receiptData, false, errorMessage);
        }
      }
    }

    setProgress(prev => ({
      ...prev,
      completed: targetStudents.length,
      current: 'Completed',
      errors
    }));

    setIsProcessing(false);

    if (errors.length === 0) {
      toast({
        title: 'Bulk Generation Complete! 🎉',
        description: `Successfully generated ${targetStudents.length} receipts`,
      });
    } else {
      toast({
        title: 'Bulk Generation Completed with Errors',
        description: `${targetStudents.length - errors.length} successful, ${errors.length} failed`,
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk Receipt Generator
        </CardTitle>
        <CardDescription>
          Generate receipts for multiple students at once with WhatsApp integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Students Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4" />
            <span className="font-medium">Target Students</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedStudents.length > 0 
              ? `${selectedStudents.length} selected students`
              : `All ${students.length} students`
            }
          </div>
        </div>

        {/* Bulk Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bulkMonth">Payment Month</Label>
            <Select value={bulkMonth} onValueChange={setBulkMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulkYear">Payment Year</Label>
            <Select value={bulkYear} onValueChange={setBulkYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulkAmount">
              {useIndividualFees ? 'Individual Fees' : 'Bulk Amount (₹)'}
            </Label>
            {useIndividualFees ? (
              <div className="h-10 px-3 py-2 border rounded-md bg-muted text-muted-foreground flex items-center">
                Use each student's monthly fee
              </div>
            ) : (
              <Input
                id="bulkAmount"
                type="number"
                value={bulkAmount}
                onChange={(e) => setBulkAmount(e.target.value)}
                placeholder="2500"
              />
            )}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="useIndividualFees"
              checked={useIndividualFees}
              onCheckedChange={(checked) => setUseIndividualFees(checked as boolean)}
            />
            <Label htmlFor="useIndividualFees" className="text-sm">
              Use individual monthly fees for each student
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendWhatsApp"
              checked={sendWhatsApp}
              onCheckedChange={(checked) => setSendWhatsApp(checked as boolean)}
            />
            <Label htmlFor="sendWhatsApp" className="text-sm">
              Send receipt via WhatsApp to each student
            </Label>
          </div>
        </div>

        {/* Progress Display */}
        {isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Processing receipts...</span>
              <span className="text-sm text-muted-foreground">
                {progress.completed}/{progress.total}
              </span>
            </div>
            <Progress value={(progress.completed / progress.total) * 100} className="h-2" />
            <div className="text-sm text-muted-foreground">
              Current: {progress.current}
            </div>
          </div>
        )}

        {/* Error Display */}
        {progress.errors.length > 0 && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800 dark:text-red-200">
                Generation Errors ({progress.errors.length})
              </span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {progress.errors.map((error, index) => (
                <div key={index} className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button 
          onClick={handleBulkGeneration}
          disabled={isProcessing || targetStudents.length === 0}
          className="w-full h-12 text-lg"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Processing {progress.completed}/{progress.total}...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              <span>Generate {targetStudents.length} Receipts</span>
              {sendWhatsApp && <MessageSquare className="h-4 w-4" />}
            </div>
          )}
        </Button>

        {/* Summary */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Generation Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Students:</span>
              <div className="font-medium">{targetStudents.length}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Amount:</span>
              <div className="font-medium">
                ₹{useIndividualFees 
                  ? targetStudents.reduce((sum, s) => sum + s.monthlyFees, 0).toLocaleString('en-IN')
                  : (parseFloat(bulkAmount || '0') * targetStudents.length).toLocaleString('en-IN')
                }
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
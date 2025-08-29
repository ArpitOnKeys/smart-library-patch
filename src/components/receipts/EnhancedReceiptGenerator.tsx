import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { studentDb, feePaymentDb } from '@/lib/database';
import { Student, FeePayment } from '@/types/database';
import { 
  generateVisualReceiptPDF, 
  downloadTextReceipt, 
  createReceiptData,
  getReceiptSettings,
  logReceiptGeneration
} from '@/utils/receiptGenerator';
import { Download, FileText, MessageSquare, Send, RefreshCw } from 'lucide-react';

interface EnhancedReceiptGeneratorProps {
  student: Student;
  onReceiptGenerated?: () => void;
}

export const EnhancedReceiptGenerator: React.FC<EnhancedReceiptGeneratorProps> = ({
  student,
  onReceiptGenerated
}) => {
  const [paymentAmount, setPaymentAmount] = useState(student.monthlyFees.toString());
  const [paymentMonth, setPaymentMonth] = useState('');
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear().toString());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  const { toast } = useToast();

  const calculateFeeData = () => {
    const payments = feePaymentDb.getByStudentId(student.id);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate months registered since admission
    const admissionDate = new Date(student.admissionDate);
    const currentDate = new Date();
    const monthsRegistered = (currentDate.getFullYear() - admissionDate.getFullYear()) * 12 + 
                            (currentDate.getMonth() - admissionDate.getMonth()) + 1;
    
    const totalExpected = student.monthlyFees * Math.max(monthsRegistered, 1);
    const totalDue = Math.max(totalExpected - totalPaid - parseFloat(paymentAmount), 0);

    return {
      totalPaid: totalPaid + parseFloat(paymentAmount),
      totalDue,
      monthsRegistered: Math.max(monthsRegistered, 1)
    };
  };

  const handleGenerateStyledPDF = async () => {
    if (!paymentAmount || !paymentMonth || !paymentYear) {
      toast({
        title: 'Error',
        description: 'Please fill in all payment details',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const feeData = calculateFeeData();
      const receiptData = createReceiptData(
        student,
        parseFloat(paymentAmount),
        paymentMonth,
        parseInt(paymentYear),
        feeData.totalPaid,
        feeData.totalDue,
        feeData.monthsRegistered
      );

      const settings = getReceiptSettings();
      await generateVisualReceiptPDF(receiptData, student, settings);
      
      // Record the payment
      feePaymentDb.create({
        studentId: student.id,
        amount: parseFloat(paymentAmount),
        paymentDate: new Date().toISOString(),
        month: paymentMonth,
        year: parseInt(paymentYear)
      });

      logReceiptGeneration(receiptData, true);
      
      toast({
        title: 'Receipt Generated! 📄',
        description: `Styled PDF receipt for ${student.name} has been downloaded`
      });

      if (onReceiptGenerated) {
        onReceiptGenerated();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: 'PDF Generation Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateTextReceipt = () => {
    if (!paymentAmount || !paymentMonth || !paymentYear) {
      toast({
        title: 'Error',
        description: 'Please fill in all payment details',
        variant: 'destructive'
      });
      return;
    }

    try {
      const feeData = calculateFeeData();
      const receiptData = createReceiptData(
        student,
        parseFloat(paymentAmount),
        paymentMonth,
        parseInt(paymentYear),
        feeData.totalPaid,
        feeData.totalDue,
        feeData.monthsRegistered
      );

      downloadTextReceipt(receiptData, student);
      
      // Record the payment
      feePaymentDb.create({
        studentId: student.id,
        amount: parseFloat(paymentAmount),
        paymentDate: new Date().toISOString(),
        month: paymentMonth,
        year: parseInt(paymentYear)
      });

      logReceiptGeneration(receiptData, true);
      
      toast({
        title: 'Text Receipt Downloaded! 📝',
        description: `Simple receipt for ${student.name} has been downloaded`
      });

      if (onReceiptGenerated) {
        onReceiptGenerated();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: 'Download Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const handleSendWhatsAppWithReceipt = async () => {
    if (!paymentAmount || !paymentMonth || !paymentYear) {
      toast({
        title: 'Error',
        description: 'Please fill in all payment details',
        variant: 'destructive'
      });
      return;
    }

    setIsSendingWhatsApp(true);
    try {
      // Generate receipt first
      const feeData = calculateFeeData();
      const receiptData = createReceiptData(
        student,
        parseFloat(paymentAmount),
        paymentMonth,
        parseInt(paymentYear),
        feeData.totalPaid,
        feeData.totalDue,
        feeData.monthsRegistered
      );

      // Create WhatsApp message
      const message = `Dear ${student.name},

Your fee receipt for ${paymentMonth} ${paymentYear}:

💰 Amount Paid: ₹${receiptData.amount}
📅 Payment Date: ${new Date(receiptData.paymentDate).toLocaleDateString('en-IN')}
🎫 Receipt No: ${receiptData.receiptNumber}
💺 Seat: ${receiptData.seatNumber}

📊 Fee Summary:
✅ Total Paid: ₹${receiptData.totalPaid}
⏳ Total Due: ₹${receiptData.totalDue}

Thank you for your payment!

- PATCH Library Management
Powered by Arpit Upadhyay`;

      // Send WhatsApp message
      const cleanedPhone = student.contact.replace(/\D/g, '');
      const phoneNumber = cleanedPhone.startsWith('91') ? cleanedPhone : '91' + cleanedPhone;
      const encodedMessage = encodeURIComponent(message);
      
      // Try multiple WhatsApp methods
      const methods = [
        () => window.location.href = `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`,
        () => window.open(`https://web.whatsapp.com/send/?phone=${phoneNumber}&text=${encodedMessage}`, '_blank'),
        () => window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank')
      ];

      let success = false;
      for (const method of methods) {
        try {
          method();
          success = true;
          break;
        } catch (error) {
          continue;
        }
      }

      // Record the payment
      feePaymentDb.create({
        studentId: student.id,
        amount: parseFloat(paymentAmount),
        paymentDate: new Date().toISOString(),
        month: paymentMonth,
        year: parseInt(paymentYear)
      });

      // Log WhatsApp attempt
      const whatsappLogs = JSON.parse(localStorage.getItem('patch_whatsapp_logs') || '[]');
      whatsappLogs.push({
        id: Date.now().toString(),
        studentId: student.id,
        studentName: student.name,
        message,
        amount: parseFloat(paymentAmount),
        sentAt: new Date().toISOString(),
        status: success ? 'sent' : 'failed'
      });
      localStorage.setItem('patch_whatsapp_logs', JSON.stringify(whatsappLogs));

      toast({
        title: success ? 'WhatsApp Opened! 📱' : 'Install WhatsApp',
        description: success 
          ? `Receipt message sent to ${student.name}` 
          : 'Please install WhatsApp to send receipt',
        variant: success ? 'default' : 'destructive'
      });

      if (onReceiptGenerated) {
        onReceiptGenerated();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send WhatsApp message with receipt',
        variant: 'destructive'
      });
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Enhanced Receipt Generator
        </CardTitle>
        <CardDescription>
          Generate styled PDF receipts with WhatsApp integration for {student.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Student Info Display */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4">
            <div>
              <h4 className="font-semibold text-lg">{student.name}</h4>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline">{student.enrollmentNo}</Badge>
                <Badge variant="secondary">Seat {student.seatNumber}</Badge>
                <Badge variant="default">{student.shift}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="2500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="month">Payment Month</Label>
            <Select value={paymentMonth} onValueChange={setPaymentMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Payment Year</Label>
            <Select value={paymentYear} onValueChange={setPaymentYear}>
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
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={handleGenerateStyledPDF}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isGenerating ? 'Generating...' : 'Styled PDF Receipt'}
          </Button>

          <Button 
            variant="outline"
            onClick={handleGenerateTextReceipt}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Simple Text Receipt
          </Button>

          <Button 
            variant="secondary"
            onClick={handleSendWhatsAppWithReceipt}
            disabled={isSendingWhatsApp}
            className="flex items-center gap-2"
          >
            {isSendingWhatsApp ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            {isSendingWhatsApp ? 'Sending...' : 'Send via WhatsApp'}
          </Button>
        </div>

        {/* Fee Summary Preview */}
        {paymentAmount && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <h4 className="font-medium mb-2">Fee Summary Preview</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Amount Paying:</span>
                <div className="font-bold text-green-600">₹{parseFloat(paymentAmount).toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span className="text-muted-foreground">New Total Paid:</span>
                <div className="font-bold">₹{calculateFeeData().totalPaid.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Remaining Due:</span>
                <div className="font-bold text-red-600">₹{calculateFeeData().totalDue.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
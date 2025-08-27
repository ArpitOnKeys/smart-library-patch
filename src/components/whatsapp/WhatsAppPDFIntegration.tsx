import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileText, Send, Download, Mail } from 'lucide-react';
import { Student } from '@/types/database';
import { generateProfessionalReceipt, savePDFToLocal, ReceiptData } from '@/utils/pdfGenerator';
import { useWhatsAppDesktopService } from '@/hooks/useWhatsAppDesktopService';

interface WhatsAppPDFIntegrationProps {
  student: Student;
  onClose?: () => void;
}

export const WhatsAppPDFIntegration = ({ student, onClose }: WhatsAppPDFIntegrationProps) => {
  const [amount, setAmount] = useState<string>(student.monthlyFees.toString());
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [transactionId, setTransactionId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPDFPath, setGeneratedPDFPath] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { sendMessage, isConnected } = useWhatsAppDesktopService();

  const generateReceiptPDF = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const receiptData: ReceiptData = {
        receiptNumber: `REC-${Date.now()}`,
        date: new Date().toLocaleDateString(),
        studentName: student.name,
        enrollmentNo: student.enrollmentNo,
        fatherName: student.fatherName,
        seatNumber: student.seatNumber,
        shift: student.shift,
        amount: parseFloat(amount),
        paymentMethod,
        transactionId: transactionId || undefined,
        validityPeriod: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 30 days from now
      };

      // Generate PDF
      const pdfBytes = await generateProfessionalReceipt(receiptData);
      
      // Save PDF locally
      const filename = `${student.name.replace(/\s+/g, '_')}_${receiptData.receiptNumber}.pdf`;
      const savedPath = await savePDFToLocal(pdfBytes, filename);
      
      setGeneratedPDFPath(savedPath);
      
      toast({
        title: "Receipt Generated",
        description: `PDF receipt saved successfully: ${filename}`,
      });
    } catch (error) {
      console.error('Receipt generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate receipt",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sendReceiptViaWhatsApp = async () => {
    if (!generatedPDFPath) {
      toast({
        title: "No Receipt Generated",
        description: "Please generate a receipt first",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "WhatsApp Not Connected",
        description: "Please connect WhatsApp Desktop first",
        variant: "destructive",
      });
      return;
    }

    const message = `Hi ${student.name},

Your fee payment receipt is ready! 

📄 Receipt Details:
• Amount: ₹${amount}
• Payment Method: ${paymentMethod}
• Transaction ID: ${transactionId || 'N/A'}
• Date: ${new Date().toLocaleDateString()}

The PDF receipt has been saved to your computer. Please manually attach it to this conversation.

Thank you for your payment!

- PATCH Library Management System`;

    try {
      await sendMessage({
        phone: student.contact,
        message,
        studentId: student.id,
        studentName: student.name,
      });

      toast({
        title: "Message Sent",
        description: "WhatsApp opened with receipt message. Please manually attach the PDF file.",
      });
    } catch (error) {
      toast({
        title: "Send Failed",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate & Send Fee Receipt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Student Info Summary */}
        <div className="p-3 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Student Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="font-medium">Name:</span> {student.name}</div>
            <div><span className="font-medium">Enrollment:</span> {student.enrollmentNo}</div>
            <div><span className="font-medium">Seat:</span> {student.seatNumber}</div>
            <div><span className="font-medium">Shift:</span> {student.shift}</div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              step="0.01"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        {(paymentMethod !== 'Cash') && (
          <div className="space-y-2">
            <Label htmlFor="transaction-id">Transaction ID (Optional)</Label>
            <Input
              id="transaction-id"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter transaction/reference ID"
            />
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={generateReceiptPDF} 
            disabled={isGenerating || !amount}
            className="w-full"
          >
            <FileText className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating Receipt...' : 'Generate PDF Receipt'}
          </Button>

          {generatedPDFPath && (
            <div className="space-y-2">
              <div className="p-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                ✅ Receipt generated: {generatedPDFPath.split('/').pop() || generatedPDFPath}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button 
                  onClick={sendReceiptViaWhatsApp} 
                  disabled={!isConnected}
                  variant="default"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send via WhatsApp
                </Button>
                
                <Button 
                  onClick={() => {
                    // Open file location or download again
                    toast({
                      title: "Receipt Location",
                      description: generatedPDFPath,
                    });
                  }}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Show Location
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 mt-0.5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800 mb-1">How it works:</p>
              <ol className="space-y-1 text-blue-700">
                <li>1. Fill in payment details and generate PDF receipt</li>
                <li>2. Click "Send via WhatsApp" to open WhatsApp with pre-filled message</li>
                <li>3. Manually attach the generated PDF file in WhatsApp</li>
                <li>4. Send the message with attachment to the student</li>
              </ol>
            </div>
          </div>
        </div>

        {onClose && (
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
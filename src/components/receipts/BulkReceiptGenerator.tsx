import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Student, FeePayment } from '@/types/database';
import { studentDb, feePaymentDb } from '@/lib/database';
import { bulkGenerateReceipts, sendReceiptViaWhatsApp, ReceiptSettings } from '@/utils/receiptUtils';
import { Download, MessageSquare, FileText, Users } from 'lucide-react';

interface BulkReceiptGeneratorProps {
  selectedMonth?: string;
  selectedYear?: number;
}

export const BulkReceiptGenerator: React.FC<BulkReceiptGeneratorProps> = ({
  selectedMonth,
  selectedYear
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationMode, setGenerationMode] = useState<'download' | 'whatsapp'>('download');
  
  const { toast } = useToast();

  // Get students with payments for the selected period
  const getStudentsWithPayments = () => {
    const students = studentDb.getAll();
    const payments = feePaymentDb.getAll();
    
    return students.map(student => {
      let payment: FeePayment | undefined;
      
      if (selectedMonth && selectedYear) {
        payment = payments.find(p => 
          p.studentId === student.id && 
          p.month === selectedMonth && 
          p.year === selectedYear
        );
      } else {
        // Get latest payment
        const studentPayments = payments
          .filter(p => p.studentId === student.id)
          .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
        payment = studentPayments[0];
      }
      
      return { student, payment };
    }).filter(item => item.payment); // Only include students with payments
  };

  const studentsWithPayments = getStudentsWithPayments();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(studentsWithPayments.map(item => item.student.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleBulkGeneration = async () => {
    const selectedItems = studentsWithPayments.filter(item => 
      selectedStudents.has(item.student.id)
    );

    if (selectedItems.length === 0) {
      toast({
        title: "No Students Selected",
        description: "Please select at least one student to generate receipts",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      const settings: ReceiptSettings = JSON.parse(
        localStorage.getItem('receipt_settings') || 
        '{"libraryLogo":"","accentColor":"#3b82f6","useStyledPDF":true,"includePhoto":true,"paperSize":"A4"}'
      );

      if (generationMode === 'download') {
        // Generate all receipts and download as ZIP
        const receipts = await bulkGenerateReceipts(
          selectedItems,
          settings,
          (current, total) => setProgress((current / total) * 100)
        );

        // For now, download individually (ZIP creation would require additional library)
        receipts.forEach((blob, index) => {
          const { student } = selectedItems[index];
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `FeeReceipt_${student.name.replace(/\s+/g, '_')}_${format(new Date(), 'ddMMyyyy')}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        });

        toast({
          title: "Bulk Download Complete! 📦",
          description: `${receipts.length} receipts downloaded successfully`
        });
      } else {
        // Send via WhatsApp
        for (let i = 0; i < selectedItems.length; i++) {
          const { student, payment } = selectedItems[i];
          const receiptNumber = `PATCH${Date.now().toString().slice(-8)}`;
          
          try {
            const pdfBlob = await generateVisualReceiptPDF(student, payment!, receiptNumber, settings);
            await sendReceiptViaWhatsApp(student, pdfBlob);
            
            setProgress(((i + 1) / selectedItems.length) * 100);
            
            // Delay between sends to avoid overwhelming
            if (i < selectedItems.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } catch (error) {
            console.error(`Error sending receipt to ${student.name}:`, error);
          }
        }

        toast({
          title: "Bulk WhatsApp Send Complete! 📱",
          description: `Receipts sent to ${selectedItems.length} students via WhatsApp`
        });
      }
    } catch (error) {
      console.error('Error in bulk generation:', error);
      toast({
        title: "Bulk Generation Failed",
        description: "Some receipts may not have been generated properly",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Bulk Receipt Generator
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bulk Receipt Generation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{studentsWithPayments.length}</div>
                  <div className="text-sm text-muted-foreground">Total Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedStudents.size}</div>
                  <div className="text-sm text-muted-foreground">Selected</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedMonth && selectedYear ? `${selectedMonth} ${selectedYear}` : 'All Periods'}
                  </div>
                  <div className="text-sm text-muted-foreground">Period</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ₹{studentsWithPayments
                      .filter(item => selectedStudents.has(item.student.id))
                      .reduce((sum, item) => sum + item.payment!.amount, 0)
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generation Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generation Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  variant={generationMode === 'download' ? 'default' : 'outline'}
                  onClick={() => setGenerationMode('download')}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDFs
                </Button>
                <Button
                  variant={generationMode === 'whatsapp' ? 'default' : 'outline'}
                  onClick={() => setGenerationMode('whatsapp')}
                  className="flex-1"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send via WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Student Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Select Students</span>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedStudents.size === studentsWithPayments.length && studentsWithPayments.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm">Select All</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {studentsWithPayments.map(({ student, payment }) => (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedStudents.has(student.id)}
                        onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                      />
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {student.enrollmentNo} • Seat {student.seatNumber}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">₹{payment!.amount}</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {payment!.month} {payment!.year}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          {isGenerating && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Generating receipts...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isGenerating}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkGeneration}
              disabled={selectedStudents.size === 0 || isGenerating}
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </div>
              ) : (
                <>
                  {generationMode === 'download' ? (
                    <Download className="h-4 w-4 mr-2" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  Generate {selectedStudents.size} Receipts
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
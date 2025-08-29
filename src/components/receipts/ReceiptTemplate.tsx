import React from 'react';
import { Student, ReceiptData } from '@/types/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';

interface ReceiptTemplateProps {
  receiptData: ReceiptData;
  student: Student;
  receiptNumber: string;
  logoUrl?: string;
  accentColor?: string;
}

export const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({
  receiptData,
  student,
  receiptNumber,
  logoUrl,
  accentColor = '#3b82f6'
}) => {
  const convertNumberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Lakh', 'Crore'];

    if (num === 0) return 'Zero';

    const convertHundreds = (n: number): string => {
      let result = '';
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n >= 10) {
        result += teens[n - 10] + ' ';
        return result;
      }
      if (n > 0) {
        result += ones[n] + ' ';
      }
      return result;
    };

    let result = '';
    let groupIndex = 0;
    
    while (num > 0) {
      const group = num % (groupIndex === 0 ? 1000 : 100);
      if (group !== 0) {
        result = convertHundreds(group) + thousands[groupIndex] + ' ' + result;
      }
      num = Math.floor(num / (groupIndex === 0 ? 1000 : 100));
      groupIndex++;
    }

    return result.trim() + ' Rupees Only';
  };

  return (
    <div 
      id="receipt-template"
      className="bg-white text-black p-8 max-w-2xl mx-auto"
      style={{ 
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.4',
        minHeight: '297mm',
        width: '210mm'
      }}
    >
      {/* Header */}
      <div 
        className="text-center py-6 mb-6 rounded-lg"
        style={{ backgroundColor: accentColor, color: 'white' }}
      >
        <div className="flex items-center justify-center gap-4 mb-2">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded-full bg-white p-1" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">PATCH - THE SMART LIBRARY</h1>
            <p className="text-sm opacity-90">Smart Library Management System</p>
          </div>
        </div>
        <div className="text-lg font-semibold">FEE RECEIPT</div>
      </div>

      {/* Receipt Info */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-300">
        <div>
          <div className="text-lg font-bold">Receipt No: {receiptNumber}</div>
          <div className="text-sm text-gray-600">Date: {new Date(receiptData.paymentDate).toLocaleDateString('en-IN')}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Generated on:</div>
          <div className="font-medium">{new Date().toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Student Section */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Student Photo */}
        <div className="col-span-1">
          <div className="border-2 border-gray-300 rounded-lg p-2 bg-gray-50">
            <Avatar className="w-32 h-32 mx-auto">
              <AvatarImage src={student.profilePicture} alt={student.name} />
              <AvatarFallback className="text-2xl bg-gray-200 text-gray-600">
                {student.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center mt-2 text-sm font-medium">Student Photo</div>
          </div>
        </div>

        {/* Student Details */}
        <div className="col-span-2">
          <h3 className="text-lg font-bold mb-4 pb-2 border-b border-gray-300">STUDENT DETAILS</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-3">
                <span className="font-bold text-gray-700">Name:</span>
                <div className="border-b border-dotted border-gray-400 pb-1">{receiptData.studentName}</div>
              </div>
              <div className="mb-3">
                <span className="font-bold text-gray-700">Father's Name:</span>
                <div className="border-b border-dotted border-gray-400 pb-1">{receiptData.fatherName}</div>
              </div>
              <div className="mb-3">
                <span className="font-bold text-gray-700">Contact:</span>
                <div className="border-b border-dotted border-gray-400 pb-1">{receiptData.contact}</div>
              </div>
              <div className="mb-3">
                <span className="font-bold text-gray-700">Enrollment No:</span>
                <div className="border-b border-dotted border-gray-400 pb-1">{receiptData.enrollmentNo}</div>
              </div>
            </div>
            <div>
              <div className="mb-3">
                <span className="font-bold text-gray-700">Seat Number:</span>
                <div className="border-b border-dotted border-gray-400 pb-1">{receiptData.seatNumber}</div>
              </div>
              <div className="mb-3">
                <span className="font-bold text-gray-700">Shift:</span>
                <div className="border-b border-dotted border-gray-400 pb-1">{student.shift}</div>
              </div>
              <div className="mb-3">
                <span className="font-bold text-gray-700">Timing:</span>
                <div className="border-b border-dotted border-gray-400 pb-1">{student.timing}</div>
              </div>
              <div className="mb-3">
                <span className="font-bold text-gray-700">Address:</span>
                <div className="border-b border-dotted border-gray-400 pb-1 text-xs">{student.address}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 pb-2 border-b border-gray-300">PAYMENT DETAILS</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <span className="font-bold text-gray-700">Duration:</span>
              <div className="text-lg font-bold" style={{ color: accentColor }}>
                {receiptData.month} {receiptData.year}
              </div>
            </div>
            <div className="mb-4">
              <span className="font-bold text-gray-700">Monthly Fees:</span>
              <div className="text-lg">₹{receiptData.monthlyFees.toLocaleString('en-IN')}</div>
            </div>
            <div className="mb-4">
              <span className="font-bold text-gray-700">Payment Mode:</span>
              <div>
                <Badge variant="outline" className="text-black border-gray-400">
                  {student.paymentMode}
                </Badge>
              </div>
            </div>
          </div>
          <div>
            <div className="mb-4">
              <span className="font-bold text-gray-700">Amount Paid:</span>
              <div className="text-2xl font-bold" style={{ color: accentColor }}>
                ₹{receiptData.amount.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="mb-4">
              <span className="font-bold text-gray-700">Amount in Words:</span>
              <div className="text-sm italic border border-gray-300 p-2 rounded bg-gray-50">
                {convertNumberToWords(receiptData.amount)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Summary */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
        <h3 className="text-lg font-bold mb-3">FEE SUMMARY</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-600">Total Paid</div>
            <div className="text-lg font-bold text-green-600">₹{receiptData.totalPaid.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Due</div>
            <div className="text-lg font-bold text-red-600">₹{receiptData.totalDue.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Months Registered</div>
            <div className="text-lg font-bold" style={{ color: accentColor }}>{receiptData.monthsRegistered}</div>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <div className="text-center">
            <div className="border-t-2 border-gray-400 pt-2 mt-16">
              <span className="font-bold">Student Signature</span>
            </div>
          </div>
        </div>
        <div>
          <div className="text-center">
            <div className="border-t-2 border-gray-400 pt-2 mt-16">
              <span className="font-bold">Authorized Signature</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 border-t pt-4">
        <div className="mb-2">
          <strong>PATCH - THE SMART LIBRARY</strong> | Smart, Simple, Secure Library Management
        </div>
        <div>
          Powered by <strong>Arpit Upadhyay</strong> | Generated on {new Date().toLocaleString('en-IN')}
        </div>
        <div className="mt-2 text-xs">
          This is a computer-generated receipt. No signature required.
        </div>
      </div>
    </div>
  );
};
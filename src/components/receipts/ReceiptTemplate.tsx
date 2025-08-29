import React from 'react';
import { Student, FeePayment } from '@/types/database';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ReceiptTemplateProps {
  student: Student;
  payment: FeePayment;
  receiptNumber: string;
  libraryLogo?: string;
  accentColor?: string;
  showInModal?: boolean;
}

export const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({
  student,
  payment,
  receiptNumber,
  libraryLogo,
  accentColor = '#3b82f6',
  showInModal = false
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
    let place = 0;
    
    while (num > 0) {
      if (num % 1000 !== 0) {
        result = convertHundreds(num % 1000) + thousands[place] + ' ' + result;
      }
      num = Math.floor(num / 1000);
      place++;
    }

    return result.trim() + ' Rupees Only';
  };

  const receiptStyle = showInModal ? {
    transform: 'scale(0.8)',
    transformOrigin: 'top center'
  } : {};

  return (
    <div 
      id="receipt-template"
      className="bg-white text-black font-sans max-w-2xl mx-auto"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm',
        fontSize: '12px',
        lineHeight: '1.4',
        ...receiptStyle
      }}
    >
      {/* Header */}
      <div 
        className="text-center py-4 mb-6 rounded-lg"
        style={{ backgroundColor: accentColor, color: 'white' }}
      >
        <div className="flex items-center justify-center gap-4 mb-2">
          {libraryLogo && (
            <img 
              src={libraryLogo} 
              alt="Library Logo" 
              className="h-12 w-12 object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">PATCH - THE SMART LIBRARY</h1>
            <p className="text-sm opacity-90">Smart Library Management System</p>
          </div>
        </div>
      </div>

      {/* Receipt Info */}
      <div className="flex justify-between items-center mb-6 pb-3 border-b-2 border-gray-300">
        <div>
          <h2 className="text-xl font-bold">FEE RECEIPT</h2>
          <p className="text-sm text-gray-600">Receipt No: <span className="font-bold">{receiptNumber}</span></p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Date of Issue</p>
          <p className="font-bold">{format(new Date(payment.paymentDate), 'dd/MM/yyyy')}</p>
        </div>
      </div>

      {/* Student Photo and Basic Info */}
      <div className="flex gap-6 mb-6">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
            {student.profilePicture ? (
              <img 
                src={student.profilePicture} 
                alt={student.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-2xl font-bold text-gray-400">
                {student.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <p className="text-xs text-center mt-1 text-gray-600">Student Photo</p>
        </div>
        
        <div className="flex-1">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 font-semibold w-32">Student Name:</td>
                <td className="py-1 font-bold text-lg">{student.name}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold">Father's Name:</td>
                <td className="py-1">{student.fatherName}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold">Enrollment No:</td>
                <td className="py-1 font-mono">{student.enrollmentNo}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold">Contact:</td>
                <td className="py-1">{student.contact}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-bold text-lg mb-3 pb-1 border-b border-gray-300">Student Details</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 font-semibold">Aadhaar Number:</td>
                <td className="py-1">{student.aadharNumber}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold">Seat Number:</td>
                <td className="py-1 font-bold">{student.seatNumber}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold">Shift:</td>
                <td className="py-1">{student.shift}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold">Timing:</td>
                <td className="py-1">{student.timing}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold">Address:</td>
                <td className="py-1">{student.address}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-3 pb-1 border-b border-gray-300">Payment Details</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 font-semibold">Fee Period:</td>
                <td className="py-1 font-bold">{payment.month} {payment.year}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold">Payment Date:</td>
                <td className="py-1">{format(new Date(payment.paymentDate), 'dd/MM/yyyy')}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold">Payment Mode:</td>
                <td className="py-1">{student.paymentMode}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold">Monthly Fee:</td>
                <td className="py-1">₹{student.monthlyFees}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Duration */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-3 pb-1 border-b border-gray-300">Duration</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-gray-600">From</p>
              <p className="font-bold text-lg">{format(new Date(student.joiningDate), 'dd/MM/yyyy')}</p>
            </div>
            <div className="mx-8 text-2xl font-bold text-gray-400">→</div>
            <div className="text-center">
              <p className="text-sm text-gray-600">To</p>
              <p className="font-bold text-lg">{format(new Date(student.feesPaidTill), 'dd/MM/yyyy')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Amount Section */}
      <div className="mb-8">
        <div 
          className="p-4 rounded-lg text-white"
          style={{ backgroundColor: accentColor }}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">Amount Paid</p>
              <p className="text-3xl font-bold">₹{payment.amount}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">In Words</p>
              <p className="font-semibold text-sm">{convertNumberToWords(payment.amount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="border-b-2 border-gray-400 w-48 mb-2"></div>
          <p className="text-sm font-semibold">Student Signature</p>
        </div>
        <div>
          <div className="border-b-2 border-gray-400 w-48 mb-2"></div>
          <p className="text-sm font-semibold">Authorized Signature</p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-4 text-center">
        <p className="text-sm text-gray-600 mb-2">
          Thank you for choosing PATCH - The Smart Library
        </p>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Generated on: {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</span>
          <span>Powered by Arpit Upadhyay</span>
        </div>
      </div>
    </div>
  );
};
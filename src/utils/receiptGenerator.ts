import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { Student, ReceiptData } from '@/types/database';

export interface ReceiptSettings {
  logoUrl?: string;
  accentColor?: string;
  libraryName?: string;
  enableStyledPDF?: boolean;
}

// Generate auto-incrementing receipt number
export const generateReceiptNumber = (): string => {
  const stored = localStorage.getItem('patch_receipt_counter');
  const counter = stored ? parseInt(stored) + 1 : 1001;
  localStorage.setItem('patch_receipt_counter', counter.toString());
  
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  
  return `PATCH${year}${month}${counter.toString().padStart(4, '0')}`;
};

// Create receipt data from student and payment info
export const createReceiptData = (
  student: Student,
  amount: number,
  month: string,
  year: number,
  totalPaid: number,
  totalDue: number,
  monthsRegistered: number
): ReceiptData => {
  return {
    receiptNumber: generateReceiptNumber(),
    studentName: student.name,
    enrollmentNo: student.enrollmentNo,
    fatherName: student.fatherName,
    contact: student.contact,
    seatNumber: student.seatNumber,
    amount,
    month,
    year,
    paymentDate: new Date().toISOString(),
    monthlyFees: student.monthlyFees,
    totalPaid,
    totalDue,
    monthsRegistered
  };
};

// Generate styled PDF receipt using html2canvas + jsPDF
export const generateVisualReceiptPDF = async (
  receiptData: ReceiptData,
  student: Student,
  settings: ReceiptSettings = {}
): Promise<void> => {
  try {
    // Create a temporary container for the receipt
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm';
    tempContainer.style.backgroundColor = 'white';
    document.body.appendChild(tempContainer);

    // Import and render the ReceiptTemplate component
    const { ReceiptTemplate } = await import('@/components/receipts/ReceiptTemplate');
    const React = await import('react');
    const ReactDOM = await import('react-dom/client');

    const root = ReactDOM.createRoot(tempContainer);
    
    // Render the receipt component
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(ReceiptTemplate, {
          receiptData,
          student,
          receiptNumber: receiptData.receiptNumber,
          logoUrl: settings.logoUrl,
          accentColor: settings.accentColor
        })
      );
      
      // Wait for rendering to complete
      setTimeout(resolve, 1000);
    });

    // Generate canvas from the rendered component
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      scrollX: 0,
      scrollY: 0
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Generate filename
    const fileName = `FeeReceipt_${receiptData.studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Download the PDF
    pdf.save(fileName);

    // Clean up
    document.body.removeChild(tempContainer);

    return Promise.resolve();
  } catch (error) {
    console.error('Error generating PDF receipt:', error);
    throw new Error('Failed to generate PDF receipt. Please try again.');
  }
};

// Generate simple text receipt (fallback)
export const generateTextReceipt = (
  receiptData: ReceiptData,
  student: Student
): string => {
  return `
PATCH - THE SMART LIBRARY
Fee Receipt

Receipt No: ${receiptData.receiptNumber}
Date: ${new Date(receiptData.paymentDate).toLocaleDateString('en-IN')}

STUDENT DETAILS:
Name: ${receiptData.studentName}
Father's Name: ${receiptData.fatherName}
Enrollment No: ${receiptData.enrollmentNo}
Contact: ${receiptData.contact}
Seat Number: ${receiptData.seatNumber}
Shift: ${student.shift}
Address: ${student.address}

PAYMENT DETAILS:
Duration: ${receiptData.month} ${receiptData.year}
Amount Paid: ₹${receiptData.amount}
Monthly Fees: ₹${receiptData.monthlyFees}
Payment Mode: ${student.paymentMode}

FEE SUMMARY:
Total Paid: ₹${receiptData.totalPaid}
Total Due: ₹${receiptData.totalDue}
Months Registered: ${receiptData.monthsRegistered}

Signature: _________________
Date: ${new Date().toLocaleDateString('en-IN')}

Powered by Arpit Upadhyay
This is a computer-generated receipt.
  `.trim();
};

// Download text receipt
export const downloadTextReceipt = (
  receiptData: ReceiptData,
  student: Student
): void => {
  const content = generateTextReceipt(receiptData, student);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const fileName = `FeeReceipt_${receiptData.studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
  saveAs(blob, fileName);
};

// Get receipt settings from localStorage
export const getReceiptSettings = (): ReceiptSettings => {
  const stored = localStorage.getItem('patch_receipt_settings');
  return stored ? JSON.parse(stored) : {
    accentColor: '#3b82f6',
    libraryName: 'PATCH - THE SMART LIBRARY',
    enableStyledPDF: true
  };
};

// Save receipt settings
export const saveReceiptSettings = (settings: ReceiptSettings): void => {
  localStorage.setItem('patch_receipt_settings', JSON.stringify(settings));
};

// Log receipt generation attempts
export const logReceiptGeneration = (
  receiptData: ReceiptData,
  success: boolean,
  errorMessage?: string
): void => {
  const logs = JSON.parse(localStorage.getItem('patch_receipt_logs') || '[]');
  const log = {
    id: Date.now().toString(),
    receiptNumber: receiptData.receiptNumber,
    studentName: receiptData.studentName,
    amount: receiptData.amount,
    timestamp: new Date().toISOString(),
    success,
    errorMessage: errorMessage || null
  };
  
  logs.unshift(log);
  // Keep only last 100 logs
  if (logs.length > 100) {
    logs.splice(100);
  }
  
  localStorage.setItem('patch_receipt_logs', JSON.stringify(logs));
};
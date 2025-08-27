import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

export interface ReceiptData {
  receiptNumber: string;
  studentName: string;
  enrollmentNo: string;
  fatherName: string;
  seatNumber: string;
  shift: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  date: string;
  validityPeriod: string;
}

export const generateProfessionalReceipt = async (data: ReceiptData): Promise<Uint8Array> => {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

    const { width, height } = page.getSize();
    const margin = 50;
    
    // Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let yPosition = height - margin;
    
    // Header
    page.drawText('PATCH LIBRARY MANAGEMENT SYSTEM', {
      x: margin,
      y: yPosition,
      size: 20,
      font: helveticaBoldFont,
      color: rgb(0, 0.4, 0.8),
    });
    
    yPosition -= 40;
    
    // Receipt title
    page.drawText('FEE PAYMENT RECEIPT', {
      x: margin,
      y: yPosition,
      size: 16,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    // Receipt number and date
    page.drawText(`Receipt No: ${data.receiptNumber}`, {
      x: width - margin - 150,
      y: yPosition,
      size: 12,
      font: helveticaFont,
    });
    
    yPosition -= 20;
    page.drawText(`Date: ${data.date}`, {
      x: width - margin - 150,
      y: yPosition,
      size: 12,
      font: helveticaFont,
    });
    
    yPosition -= 40;
    
    // Horizontal line
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    
    yPosition -= 30;
    
    // Student Information
    page.drawText('STUDENT INFORMATION', {
      x: margin,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
    });
    
    yPosition -= 25;
    
    const studentInfo = [
      ['Name:', data.studentName],
      ['Enrollment No:', data.enrollmentNo],
      ['Father\'s Name:', data.fatherName],
      ['Seat Number:', data.seatNumber],
      ['Shift:', data.shift],
    ];
    
    studentInfo.forEach(([label, value]) => {
      page.drawText(label, {
        x: margin,
        y: yPosition,
        size: 11,
        font: helveticaBoldFont,
      });
      
      page.drawText(value, {
        x: margin + 120,
        y: yPosition,
        size: 11,
        font: helveticaFont,
      });
      
      yPosition -= 20;
    });
    
    yPosition -= 20;
    
    // Payment Information
    page.drawText('PAYMENT DETAILS', {
      x: margin,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
    });
    
    yPosition -= 25;
    
    const paymentInfo = [
      ['Monthly Fees:', `₹${data.amount.toFixed(2)}`],
      ['Payment Method:', data.paymentMethod],
      ['Transaction ID:', data.transactionId || 'N/A'],
      ['Validity Period:', data.validityPeriod],
    ];
    
    paymentInfo.forEach(([label, value]) => {
      page.drawText(label, {
        x: margin,
        y: yPosition,
        size: 11,
        font: helveticaBoldFont,
      });
      
      page.drawText(value, {
        x: margin + 120,
        y: yPosition,
        size: 11,
        font: helveticaFont,
      });
      
      yPosition -= 20;
    });
    
    yPosition -= 20;
    
    // Amount in words
    page.drawText('Amount in Words:', {
      x: margin,
      y: yPosition,
      size: 11,
      font: helveticaBoldFont,
    });
    
    yPosition -= 18;
    page.drawText(numberToWords(data.amount) + ' Rupees Only', {
      x: margin,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    yPosition -= 40;
    
    // Footer
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    
    yPosition -= 30;
    
    page.drawText('Thank you for your payment!', {
      x: margin,
      y: yPosition,
      size: 12,
      font: helveticaBoldFont,
      color: rgb(0, 0.6, 0.2),
    });
    
    page.drawText('This is a computer-generated receipt.', {
      x: width - margin - 200,
      y: yPosition,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    return await pdfDoc.save();
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const savePDFToLocal = async (pdfBytes: Uint8Array, filename: string): Promise<string> => {
  try {
    // For now, use simple browser download
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, filename);
    
    console.log('PDF downloaded successfully:', filename);
    return `Downloaded: ${filename}`;
  } catch (error) {
    console.error('PDF download failed:', error);
    throw new Error(`Failed to save PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const downloadPDF = (pdfBytes: Uint8Array, filename: string) => {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  saveAs(blob, filename);
};

// Convert number to words for Indian currency
function numberToWords(num: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (num === 0) return "Zero";
  
  const convertHundreds = (n: number): string => {
    let result = "";
    
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + " ";
      return result;
    }
    
    if (n > 0) {
      result += ones[n] + " ";
    }
    
    return result;
  };

  let result = "";
  const crores = Math.floor(num / 10000000);
  num %= 10000000;
  
  const lakhs = Math.floor(num / 100000);
  num %= 100000;
  
  const thousands = Math.floor(num / 1000);
  num %= 1000;
  
  if (crores > 0) {
    result += convertHundreds(crores) + "Crore ";
  }
  
  if (lakhs > 0) {
    result += convertHundreds(lakhs) + "Lakh ";
  }
  
  if (thousands > 0) {
    result += convertHundreds(thousands) + "Thousand ";
  }
  
  if (num > 0) {
    result += convertHundreds(num);
  }
  
  return result.trim();
}
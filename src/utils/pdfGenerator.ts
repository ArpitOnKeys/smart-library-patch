import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Student, FeePayment } from '@/types/database';
import { format } from 'date-fns';

export interface ReceiptData {
  student: Student;
  payment: FeePayment;
  totalPaid: number;
  totalDue: number;
  monthsRegistered: number;
}

export const generateProfessionalReceipt = async (data: ReceiptData): Promise<Uint8Array> => {
  const { student, payment, totalPaid, totalDue } = data;
  
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  
  // Load fonts
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Colors
  const headerColor = rgb(0.2, 0.3, 0.7); // Blue
  const textColor = rgb(0.1, 0.1, 0.1); // Dark gray
  const accentColor = rgb(0.8, 0.1, 0.1); // Red
  
  let yPosition = height - 60;
  
  // Header - Library Name
  page.drawText('PATCH - THE SMART LIBRARY', {
    x: 50,
    y: yPosition,
    size: 24,
    font: boldFont,
    color: headerColor,
  });
  
  yPosition -= 25;
  page.drawText('Fee Payment Receipt', {
    x: 50,
    y: yPosition,
    size: 16,
    font: boldFont,
    color: accentColor,
  });
  
  // Library Address & Contact
  yPosition -= 40;
  page.drawText('Address: [Your Library Address Here]', {
    x: 50,
    y: yPosition,
    size: 10,
    font: regularFont,
    color: textColor,
  });
  
  yPosition -= 15;
  page.drawText('Contact: [Your Contact Number] | Email: [Your Email]', {
    x: 50,
    y: yPosition,
    size: 10,
    font: regularFont,
    color: textColor,
  });
  
  // Receipt Number and Date
  yPosition -= 30;
  const receiptNo = `RCPT-${student.enrollmentNo}-${payment.id.slice(-6)}`;
  page.drawText(`Receipt No: ${receiptNo}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: boldFont,
    color: textColor,
  });
  
  page.drawText(`Date: ${format(new Date(payment.paymentDate), 'dd/MM/yyyy')}`, {
    x: width - 150,
    y: yPosition,
    size: 11,
    font: boldFont,
    color: textColor,
  });
  
  // Student Details Section
  yPosition -= 40;
  page.drawText('Student Details:', {
    x: 50,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: headerColor,
  });
  
  // Student details in two columns
  yPosition -= 25;
  const leftColumnX = 50;
  const rightColumnX = 300;
  
  // Left column
  page.drawText(`Name: ${student.name}`, {
    x: leftColumnX,
    y: yPosition,
    size: 11,
    font: regularFont,
    color: textColor,
  });
  
  yPosition -= 18;
  page.drawText(`Father's Name: ${student.fatherName}`, {
    x: leftColumnX,
    y: yPosition,
    size: 11,
    font: regularFont,
    color: textColor,
  });
  
  yPosition -= 18;
  page.drawText(`Contact: ${student.contact}`, {
    x: leftColumnX,
    y: yPosition,
    size: 11,
    font: regularFont,
    color: textColor,
  });
  
  yPosition -= 18;
  page.drawText(`Aadhar: ${student.aadharNumber}`, {
    x: leftColumnX,
    y: yPosition,
    size: 11,
    font: regularFont,
    color: textColor,
  });
  
  // Right column
  yPosition += 54; // Reset to top of details
  page.drawText(`Enrollment No: ${student.enrollmentNo}`, {
    x: rightColumnX,
    y: yPosition,
    size: 11,
    font: regularFont,
    color: textColor,
  });
  
  yPosition -= 18;
  page.drawText(`Seat Number: ${student.seatNumber}`, {
    x: rightColumnX,
    y: yPosition,
    size: 11,
    font: regularFont,
    color: textColor,
  });
  
  yPosition -= 18;
  page.drawText(`Shift: ${student.shift}`, {
    x: rightColumnX,
    y: yPosition,
    size: 11,
    font: regularFont,
    color: textColor,
  });
  
  yPosition -= 18;
  page.drawText(`Timing: ${student.timing}`, {
    x: rightColumnX,
    y: yPosition,
    size: 11,
    font: regularFont,
    color: textColor,
  });
  
  // Address (full width)
  yPosition -= 25;
  page.drawText(`Address: ${student.address}`, {
    x: leftColumnX,
    y: yPosition,
    size: 11,
    font: regularFont,
    color: textColor,
  });
  
  // Payment Details Section
  yPosition -= 40;
  page.drawText('Payment Details:', {
    x: 50,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: headerColor,
  });
  
  // Payment details box
  yPosition -= 30;
  const boxY = yPosition - 80;
  page.drawRectangle({
    x: 50,
    y: boxY,
    width: width - 100,
    height: 80,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });
  
  yPosition -= 20;
  page.drawText(`Payment for Month: ${payment.month} ${payment.year}`, {
    x: 70,
    y: yPosition,
    size: 12,
    font: boldFont,
    color: textColor,
  });
  
  yPosition -= 20;
  page.drawText(`Amount Paid: ₹${payment.amount}`, {
    x: 70,
    y: yPosition,
    size: 12,
    font: boldFont,
    color: accentColor,
  });
  
  page.drawText(`Monthly Fees: ₹${student.monthlyFees}`, {
    x: 300,
    y: yPosition,
    size: 11,
    font: regularFont,
    color: textColor,
  });
  
  yPosition -= 20;
  page.drawText(`Payment Date: ${format(new Date(payment.paymentDate), 'dd/MM/yyyy')}`, {
    x: 70,
    y: yPosition,
    size: 11,
    font: regularFont,
    color: textColor,
  });
  
  // Summary Section
  yPosition -= 40;
  page.drawText('Summary:', {
    x: 50,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: headerColor,
  });
  
  yPosition -= 25;
  page.drawText(`Total Amount Paid Till Date: ₹${totalPaid}`, {
    x: 70,
    y: yPosition,
    size: 11,
    font: regularFont,
    color: textColor,
  });
  
  yPosition -= 18;
  page.drawText(`Remaining Due Amount: ₹${totalDue}`, {
    x: 70,
    y: yPosition,
    size: 11,
    font: regularFont,
    color: totalDue > 0 ? accentColor : rgb(0.1, 0.7, 0.1),
  });
  
  // Duration section
  yPosition -= 25;
  const joiningDate = format(new Date(student.joiningDate), 'dd/MM/yyyy');
  const currentDate = format(new Date(), 'dd/MM/yyyy');
  page.drawText(`Duration: ${joiningDate} to ${currentDate}`, {
    x: 70,
    y: yPosition,
    size: 11,
    font: regularFont,
    color: textColor,
  });
  
  // Signature section
  yPosition -= 60;
  page.drawText('Authorized Signature:', {
    x: 50,
    y: yPosition,
    size: 11,
    font: boldFont,
    color: textColor,
  });
  
  page.drawText('Owner/Manager', {
    x: width - 150,
    y: yPosition,
    size: 11,
    font: boldFont,
    color: textColor,
  });
  
  yPosition -= 30;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: 200, y: yPosition },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  page.drawLine({
    start: { x: width - 150, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // Footer
  yPosition -= 40;
  page.drawText('Thank you for choosing PATCH - The Smart Library!', {
    x: 50,
    y: yPosition,
    size: 10,
    font: regularFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  page.drawText('This is a computer-generated receipt.', {
    x: width - 200,
    y: yPosition,
    size: 8,
    font: regularFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // Save PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

export const downloadPDF = (pdfBytes: Uint8Array, filename: string) => {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  saveAs(blob, filename);
};

export const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';
  
  let result = '';
  
  // Handle crores
  if (num >= 10000000) {
    result += numberToWords(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  
  // Handle lakhs
  if (num >= 100000) {
    result += numberToWords(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  
  // Handle thousands
  if (num >= 1000) {
    result += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  
  // Handle hundreds
  if (num >= 100) {
    result += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  
  // Handle tens and ones
  if (num >= 20) {
    result += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  } else if (num >= 10) {
    result += teens[num - 10] + ' ';
    return result.trim();
  }
  
  if (num > 0) {
    result += ones[num] + ' ';
  }
  
  return result.trim();
};
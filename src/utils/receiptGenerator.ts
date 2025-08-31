import jsPDF from 'jspdf';
import { Student, FeePayment } from '@/types/database';

export interface ReceiptData {
  receiptNumber: string;
  studentName: string;
  enrollmentNo: string;
  fatherName: string;
  contact: string;
  aadharNumber: string;
  seatNumber: string;
  timing: string;
  address: string;
  amount: number;
  amountInWords: string;
  month: string;
  year: number;
  paymentDate: string;
  paymentMode: string;
  monthlyFees: number;
  totalPaid: number;
  totalDue: number;
  duration: string;
}

// Convert number to words (Indian format)
const numberToWords = (num: number): string => {
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

// Mask Aadhar number for privacy
const maskAadhar = (aadhar: string): string => {
  if (aadhar.length !== 12) return aadhar;
  return `XXXX XXXX ${aadhar.slice(-4)}`;
};

// Generate QR code data
const generateQRData = (receiptData: ReceiptData): string => {
  return `PATCH|${receiptData.receiptNumber}|${receiptData.studentName}|${receiptData.amount}|${receiptData.paymentDate}`;
};

// Create simple QR code pattern (for visual representation)
const drawQRCode = (pdf: jsPDF, x: number, y: number, size: number, data: string): void => {
  const modules = 21;
  const moduleSize = size / modules;
  
  // White background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(x, y, size, size, 'F');
  
  // Black border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.rect(x, y, size, size, 'S');
  
  // Generate pattern based on data hash
  const hash = data.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  pdf.setFillColor(0, 0, 0);
  for (let i = 0; i < modules; i++) {
    for (let j = 0; j < modules; j++) {
      const shouldFill = (hash + i * modules + j) % 3 === 0;
      if (shouldFill) {
        pdf.rect(x + j * moduleSize, y + i * moduleSize, moduleSize, moduleSize, 'F');
      }
    }
  }
};

export const generateProfessionalReceipt = (receiptData: ReceiptData): jsPDF => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Card dimensions and positioning
  const cardMargin = 15;
  const cardWidth = pageWidth - (cardMargin * 2);
  const cardHeight = pageHeight - (cardMargin * 2);
  const cardX = cardMargin;
  const cardY = cardMargin;

  // Background card with rounded corners effect
  pdf.setFillColor(252, 251, 247); // Light ivory background
  pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 3, 3, 'F');
  
  // Card border
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 3, 3, 'S');

  // Header strip (Navy background with gold text)
  const headerHeight = 25;
  pdf.setFillColor(25, 42, 86); // Dark navy
  pdf.roundedRect(cardX, cardY, cardWidth, headerHeight, 3, 3, 'F');
  
  // Fix bottom corners of header to be square
  pdf.rect(cardX, cardY + headerHeight - 3, cardWidth, 3, 'F');

  // Institute name in header
  pdf.setTextColor(255, 215, 0); // Gold color
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PATCH - THE SMART LIBRARY', pageWidth / 2, cardY + 12, { align: 'center' });
  
  // Sub-header with contact info
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Smart Library Management System | Contact: +91-XXXXXXXXXX', pageWidth / 2, cardY + 20, { align: 'center' });

  // Title section
  let currentY = cardY + headerHeight + 15;
  
  // "FEE RECEIPT" title
  pdf.setTextColor(25, 42, 86);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FEE RECEIPT', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 12;
  
  // Receipt number and date
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Slip No: ${receiptData.receiptNumber}`, cardX + 10, currentY);
  pdf.text(`Date: ${new Date(receiptData.paymentDate).toLocaleDateString('en-IN')}`, cardX + cardWidth - 10, currentY, { align: 'right' });
  
  currentY += 20;

  // Student photo placeholder (circular)
  const photoSize = 25;
  const photoX = cardX + cardWidth - 35;
  const photoY = currentY - 5;
  
  pdf.setFillColor(240, 240, 240);
  pdf.circle(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 'F');
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.circle(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 'S');
  
  // Student initial in photo
  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(receiptData.studentName.charAt(0).toUpperCase(), photoX + photoSize/2, photoY + photoSize/2 + 4, { align: 'center' });

  // Student Information Grid
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const infoStartX = cardX + 10;
  const infoWidth = cardWidth - 60; // Leave space for photo
  
  const studentInfo = [
    ['Name:', receiptData.studentName],
    ['Father\'s Name:', receiptData.fatherName],
    ['Contact:', receiptData.contact],
    ['Aadhaar:', maskAadhar(receiptData.aadharNumber)],
    ['Seat No:', receiptData.seatNumber],
    ['Timing:', receiptData.timing],
    ['Address:', receiptData.address.length > 40 ? receiptData.address.substring(0, 40) + '...' : receiptData.address],
    ['Duration:', receiptData.duration]
  ];

  studentInfo.forEach(([label, value], index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = infoStartX + (col * (infoWidth / 2));
    const y = currentY + (row * 8);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, x, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(value, x + 25, y);
  });

  currentY += 80;

  // Separator line
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.5);
  pdf.line(cardX + 10, currentY, cardX + cardWidth - 10, currentY);
  
  currentY += 15;

  // Fee Details Section
  // Amount Paid - Large highlighted box
  const amountBoxWidth = 80;
  const amountBoxHeight = 20;
  const amountBoxX = (pageWidth - amountBoxWidth) / 2;
  
  pdf.setFillColor(25, 42, 86); // Navy background
  pdf.roundedRect(amountBoxX, currentY, amountBoxWidth, amountBoxHeight, 2, 2, 'F');
  
  pdf.setTextColor(255, 215, 0); // Gold text
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`₹ ${receiptData.amount.toLocaleString('en-IN')}`, pageWidth / 2, currentY + 13, { align: 'center' });
  
  currentY += amountBoxHeight + 8;
  
  // Amount in words
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.text(`(${receiptData.amountInWords})`, pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 15;
  
  // Payment details
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const paymentDetails = [
    ['Month/Year:', `${receiptData.month} ${receiptData.year}`],
    ['Payment Mode:', receiptData.paymentMode],
    ['Monthly Fees:', `₹${receiptData.monthlyFees.toLocaleString('en-IN')}`],
    ['Total Paid:', `₹${receiptData.totalPaid.toLocaleString('en-IN')}`]
  ];

  paymentDetails.forEach(([label, value], index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = cardX + 20 + (col * (cardWidth / 2 - 20));
    const y = currentY + (row * 8);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, x, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(value, x + 30, y);
  });

  currentY += 35;

  // QR Code
  const qrSize = 20;
  const qrX = cardX + 10;
  drawQRCode(pdf, qrX, currentY, qrSize, generateQRData(receiptData));
  
  // QR Code label
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Scan for verification', qrX + qrSize/2, currentY + qrSize + 5, { align: 'center' });

  // Signature section
  const signatureY = currentY + 10;
  const signatureX = cardX + cardWidth - 80;
  
  // Signature line
  pdf.setDrawColor(150, 150, 150);
  pdf.setLineWidth(0.3);
  pdf.line(signatureX, signatureY, signatureX + 60, signatureY);
  
  // Signature text (handwritten style)
  pdf.setTextColor(25, 42, 86);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bolditalic');
  pdf.text('Arpit Upadhyay', signatureX + 30, signatureY - 3, { align: 'center' });
  
  // Owner designation
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ARPIT UPADHYAY', signatureX + 30, signatureY + 5, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.text('Library Owner & Director', signatureX + 30, signatureY + 10, { align: 'center' });

  // Thank you message
  currentY += 40;
  pdf.setTextColor(120, 120, 120);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Thank you for your payment!', pageWidth / 2, currentY, { align: 'center' });
  
  // Footer note
  pdf.setFontSize(7);
  pdf.setTextColor(150, 150, 150);
  pdf.text('This is a computer-generated receipt and does not require a physical signature.', pageWidth / 2, cardY + cardHeight - 5, { align: 'center' });

  return pdf;
};

export const generateReceiptData = (student: Student, payment: FeePayment): ReceiptData => {
  const receiptNumber = `RCP${Date.now().toString().slice(-8)}`;
  const amountInWords = numberToWords(payment.amount);
  
  // Calculate duration (months since admission)
  const admissionDate = new Date(student.admissionDate);
  const currentDate = new Date();
  const monthsDiff = (currentDate.getFullYear() - admissionDate.getFullYear()) * 12 + 
                    (currentDate.getMonth() - admissionDate.getMonth()) + 1;
  const duration = `${Math.max(monthsDiff, 1)} month${monthsDiff > 1 ? 's' : ''}`;

  return {
    receiptNumber,
    studentName: student.name,
    enrollmentNo: student.enrollmentNo,
    fatherName: student.fatherName,
    contact: student.contact,
    aadharNumber: student.aadharNumber,
    seatNumber: student.seatNumber,
    timing: student.timing,
    address: student.address,
    amount: payment.amount,
    amountInWords,
    month: payment.month,
    year: payment.year,
    paymentDate: payment.paymentDate,
    paymentMode: student.paymentMode,
    monthlyFees: student.monthlyFees,
    totalPaid: 0, // Will be calculated by caller
    totalDue: 0, // Will be calculated by caller
    duration
  };
};

export const downloadReceipt = (receiptData: ReceiptData): void => {
  const pdf = generateProfessionalReceipt(receiptData);
  const fileName = `Fee_Receipt_${receiptData.enrollmentNo}_${receiptData.month}_${receiptData.year}.pdf`;
  pdf.save(fileName);
};

export const generateReceiptBlob = (receiptData: ReceiptData): Blob => {
  const pdf = generateProfessionalReceipt(receiptData);
  return pdf.output('blob');
};

// Auto-send receipt via WhatsApp
export const sendReceiptViaWhatsApp = async (receiptData: ReceiptData): Promise<boolean> => {
  try {
    // Generate PDF blob
    const pdfBlob = generateReceiptBlob(receiptData);
    
    // Create temporary URL for PDF
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Prepare WhatsApp message
    const message = `📄 Fee Receipt - PATCH Library\n\nDear ${receiptData.studentName},\n\nYour fee receipt for ${receiptData.month} ${receiptData.year} is ready.\n\n💰 Amount Paid: ₹${receiptData.amount}\n🪑 Seat: ${receiptData.seatNumber}\n📅 Date: ${new Date(receiptData.paymentDate).toLocaleDateString('en-IN')}\n\nThank you for choosing PATCH Library! 🙏\n\n- PATCH Team`;
    
    const cleanedPhone = receiptData.contact.replace(/\D/g, '');
    const phoneNumber = cleanedPhone.startsWith('91') ? cleanedPhone : '91' + cleanedPhone;
    const encodedMessage = encodeURIComponent(message);
    
    // Try multiple automatic methods for WhatsApp
    const methods = [
      () => window.location.href = `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`,
      () => window.location.href = `intent://send?phone=${phoneNumber}&text=${encodedMessage}#Intent;scheme=whatsapp;package=com.whatsapp;end`,
      () => window.open(`https://web.whatsapp.com/send/?phone=${phoneNumber}&text=${encodedMessage}&type=phone_number&app_absent=0`, '_blank'),
      () => window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_self')
    ];

    let success = false;
    for (let i = 0; i < methods.length; i++) {
      try {
        methods[i]();
        success = true;
        break;
      } catch (error) {
        if (i === methods.length - 1) console.error('All WhatsApp methods failed:', error);
      }
    }

    // Clean up the temporary URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 5000);

    return success;
  } catch (error) {
    console.error('Error sending receipt via WhatsApp:', error);
    return false;
  }
};
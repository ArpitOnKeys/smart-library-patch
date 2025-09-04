import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Student, FeePayment } from '@/types/database';
import { format } from 'date-fns';

export interface ReceiptData {
  slipNo: string;
  studentName: string;
  enrollmentNo: string;
  fatherName: string;
  contact: string;
  address: string;
  aadharNumber: string;
  seatNumber: string;
  amount: number;
  amountInWords: string;
  month: string;
  year: number;
  paymentDate: string;
  monthlyFees: number;
  totalPaid: number;
  totalDue: number;
  paymentMode: string;
  fromDate: string;
  toDate: string;
  profilePicture?: string;
}

const convertNumberToWords = (amount: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Lakh', 'Crore'];

  if (amount === 0) return 'Zero';

  const convertGroup = (num: number): string => {
    let result = '';
    
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    } else if (num >= 10) {
      result += teens[num - 10] + ' ';
      return result;
    }
    
    if (num > 0) {
      result += ones[num] + ' ';
    }
    
    return result;
  };

  let result = '';
  let groupIndex = 0;
  
  while (amount > 0) {
    if (groupIndex === 0) {
      // Handle ones and tens
      const group = amount % 1000;
      if (group !== 0) {
        result = convertGroup(group) + thousands[groupIndex] + ' ' + result;
      }
      amount = Math.floor(amount / 1000);
      groupIndex++;
    } else if (groupIndex === 1) {
      // Handle thousands
      const group = amount % 100;
      if (group !== 0) {
        result = convertGroup(group) + thousands[groupIndex] + ' ' + result;
      }
      amount = Math.floor(amount / 100);
      groupIndex++;
    } else {
      // Handle lakhs and crores
      const group = amount % 100;
      if (group !== 0) {
        result = convertGroup(group) + thousands[groupIndex] + ' ' + result;
      }
      amount = Math.floor(amount / 100);
      groupIndex++;
    }
  }
  
  return result.trim() + ' Rupees Only';
};

const generateQRCodeDataURL = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      width: 80,
      margin: 1,
      color: {
        dark: '#1A2C42',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};

export const generateFeeReceiptPDF = async (receiptData: ReceiptData): Promise<void> => {
  // Validate required fields
  const requiredFields = [
    'slipNo', 'studentName', 'enrollmentNo', 'fatherName', 'contact', 
    'address', 'aadharNumber', 'seatNumber', 'amount', 'month', 'year', 
    'paymentDate', 'paymentMode'
  ];
  
  const missingFields = requiredFields.filter(field => {
    const value = receiptData[field as keyof ReceiptData];
    return value === undefined || value === null || value === '';
  });
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields for receipt generation: ${missingFields.join(', ')}`);
  }
  
  // Validate that amount is a positive number
  if (receiptData.amount <= 0) {
    throw new Error('Receipt amount must be greater than 0');
  }
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // PDF dimensions
  const pageWidth = 210;
  const pageHeight = 297;
  const cardWidth = 180;
  const cardHeight = 250;
  const cardX = (pageWidth - cardWidth) / 2;
  const cardY = (pageHeight - cardHeight) / 2;

  // Colors (HSL converted to RGB for jsPDF)
  const navyBlue = [26, 44, 66] as const; // #1A2C42
  const golden = [200, 169, 81] as const; // #C8A951
  const softIvory = [250, 250, 250] as const; // #FAFAFA
  const deepGray = [51, 51, 51] as const; // #333333
  const lightGray = [240, 240, 240] as const; // #F0F0F0

  // Generate QR Code
  const qrText = `RECEIPT-${receiptData.slipNo}-${receiptData.contact}`;
  const qrCodeDataURL = await generateQRCodeDataURL(qrText);

  // Card background with subtle shadow
  pdf.setFillColor(...lightGray);
  pdf.roundedRect(cardX + 2, cardY + 2, cardWidth, cardHeight, 8, 8, 'F'); // Shadow
  
  pdf.setFillColor(...softIvory);
  pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 8, 8, 'F');
  
  pdf.setDrawColor(...deepGray);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 8, 8, 'S');

  // Header bar
  pdf.setFillColor(...navyBlue);
  pdf.roundedRect(cardX, cardY, cardWidth, 25, 8, 8, 'F');
  pdf.rect(cardX, cardY + 17, cardWidth, 8, 'F'); // Fill the bottom rounded corners

  // Institute name
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('PATCH - THE SMART LIBRARY', cardX + cardWidth / 2, cardY + 12, { align: 'center' });
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Excellence in Education • Contact: +91-XXXXXXXXXX', cardX + cardWidth / 2, cardY + 20, { align: 'center' });

  // Reset text color
  pdf.setTextColor(...deepGray);

  let currentY = cardY + 35;

  // Receipt title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('FEE RECEIPT', cardX + cardWidth / 2, currentY, { align: 'center' });
  
  currentY += 15;

  // Slip info section
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Slip No: ${receiptData.slipNo}`, cardX + 10, currentY);
  pdf.text(`Date: ${receiptData.paymentDate}`, cardX + cardWidth - 10, currentY, { align: 'right' });
  
  currentY += 10;
  
  // Separator line
  pdf.setDrawColor(...golden);
  pdf.setLineWidth(1);
  pdf.line(cardX + 10, currentY, cardX + cardWidth - 10, currentY);
  
  currentY += 15;

  // Student photo (circular)
  const photoSize = 30;
  const photoX = cardX + cardWidth - 45;
  const photoY = currentY - 5;
  
  // Draw circular border
  pdf.setDrawColor(...deepGray);
  pdf.setLineWidth(0.5);
  pdf.circle(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 'S');
  
  // Add student profile picture if available
  if (receiptData.profilePicture) {
    try {
      // Create clipping path for circular image
      pdf.saveGraphicsState();
      pdf.circle(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 'W');
      pdf.clip();
      
      // Add the profile picture
      pdf.addImage(
        receiptData.profilePicture, 
        'JPEG', 
        photoX, 
        photoY, 
        photoSize, 
        photoSize
      );
      
      pdf.restoreGraphicsState();
    } catch (error) {
      console.error('Error adding profile picture to receipt:', error);
      // Fallback to placeholder if image fails
      pdf.setFillColor(...lightGray);
      pdf.circle(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 'F');
      pdf.setFontSize(8);
      pdf.setTextColor(...deepGray);
      pdf.text('PHOTO', photoX + photoSize/2, photoY + photoSize/2 + 2, { align: 'center' });
    }
  } else {
    // Default placeholder when no profile picture
    pdf.setFillColor(...lightGray);
    pdf.circle(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 'F');
    pdf.setFontSize(8);
    pdf.setTextColor(...deepGray);
    pdf.text('PHOTO', photoX + photoSize/2, photoY + photoSize/2 + 2, { align: 'center' });
  }

  // Student details (two columns)
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  
  const leftColX = cardX + 10;
  const rightColX = cardX + 95;
  const lineHeight = 8;

  // Left column
  pdf.text('Name:', leftColX, currentY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(receiptData.studentName, leftColX + 25, currentY);
  
  currentY += lineHeight;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Father\'s Name:', leftColX, currentY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(receiptData.fatherName, leftColX + 35, currentY);
  
  currentY += lineHeight;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contact:', leftColX, currentY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(receiptData.contact, leftColX + 25, currentY);
  
  currentY += lineHeight;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Aadhaar:', leftColX, currentY);
  pdf.setFont('helvetica', 'normal');
  const maskedAadhar = receiptData.aadharNumber.replace(/\d(?=\d{4})/g, 'X');
  pdf.text(maskedAadhar, leftColX + 25, currentY);

  // Right column (starting from initial currentY)
  let rightCurrentY = currentY - (3 * lineHeight);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Enrollment:', rightColX, rightCurrentY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(receiptData.enrollmentNo, rightColX + 30, rightCurrentY);
  
  rightCurrentY += lineHeight;
  
  // Seat number with highlight badge
  pdf.setFillColor(...golden);
  pdf.roundedRect(rightColX - 2, rightCurrentY - 4, 35, 10, 2, 2, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Seat: ${receiptData.seatNumber}`, rightColX + 1, rightCurrentY + 1);
  pdf.setTextColor(...deepGray);

  currentY += lineHeight + 5;

  // Address (full width)
  pdf.setFont('helvetica', 'bold');
  pdf.text('Address:', leftColX, currentY);
  pdf.setFont('helvetica', 'normal');
  const addressLines = pdf.splitTextToSize(receiptData.address, cardWidth - 70);
  pdf.text(addressLines, leftColX + 25, currentY);
  
  currentY += (addressLines.length * 5) + 10;

  // Duration section
  pdf.setDrawColor(...golden);
  pdf.line(cardX + 10, currentY, cardX + cardWidth - 10, currentY);
  currentY += 8;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('DURATION', cardX + cardWidth / 2, currentY, { align: 'center' });
  
  currentY += 10;
  
  pdf.setFontSize(10);
  pdf.text(`${receiptData.fromDate}`, cardX + 30, currentY, { align: 'center' });
  pdf.text('→', cardX + cardWidth / 2, currentY, { align: 'center' });
  pdf.text(`${receiptData.toDate}`, cardX + cardWidth - 30, currentY, { align: 'center' });
  
  currentY += 15;

  // Fee details section - Large highlighted box
  pdf.setFillColor(...navyBlue);
  pdf.roundedRect(cardX + 20, currentY, cardWidth - 40, 35, 5, 5, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text(`₹ ${receiptData.amount.toLocaleString('en-IN')}`, cardX + cardWidth / 2, currentY + 15, { align: 'center' });
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('AMOUNT PAID', cardX + cardWidth / 2, currentY + 25, { align: 'center' });
  
  currentY += 45;
  
  // Amount in words
  pdf.setTextColor(...deepGray);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  const amountInWords = pdf.splitTextToSize(`Amount in words: ${receiptData.amountInWords}`, cardWidth - 20);
  pdf.text(amountInWords, cardX + 10, currentY);
  
  currentY += (amountInWords.length * 4) + 8;
  
  // Payment mode
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Mode of Payment: ${receiptData.paymentMode}`, cardX + 10, currentY);
  
  currentY += 15;

  // Footer section
  pdf.setDrawColor(...golden);
  pdf.line(cardX + 10, currentY, cardX + cardWidth - 10, currentY);
  currentY += 10;

  // QR Code
  if (qrCodeDataURL) {
    pdf.addImage(qrCodeDataURL, 'PNG', cardX + 10, currentY - 5, 20, 20);
  }

  // Signature section
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(10);
  pdf.text('Authorized Signature', cardX + cardWidth - 50, currentY + 5, { align: 'center' });
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('LIBRARY ADMINISTRATOR', cardX + cardWidth - 50, currentY + 12, { align: 'center' });
  
  // Branding - Professional footer
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(...deepGray);
  pdf.text('⚡ Powered by Arpit', cardX + cardWidth - 10, currentY + 15, { align: 'right' });
  
  // Underline accent for branding
  pdf.setDrawColor(...golden);
  pdf.setLineWidth(0.3);
  const brandingWidth = pdf.getTextWidth('⚡ Powered by Arpit');
  pdf.line(cardX + cardWidth - 10 - brandingWidth, currentY + 16, cardX + cardWidth - 10, currentY + 16);

  // Thank you message
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...deepGray);
  pdf.text('Thank you for choosing PATCH - The Smart Library', cardX + cardWidth / 2, currentY + 20, { align: 'center' });

  // Download the PDF
  const fileName = `Fee_Receipt_${receiptData.studentName.replace(/\s+/g, '_')}_${receiptData.month}_${receiptData.year}.pdf`;
  pdf.save(fileName);
};

export const prepareReceiptData = (
  student: Student, 
  payment: FeePayment, 
  totalPaid: number, 
  totalDue: number
): ReceiptData => {
  const slipNo = `PATCH-${Date.now().toString().slice(-6)}`;
  const amountInWords = convertNumberToWords(payment.amount);
  
  // Calculate from and to dates for the month
  const paymentDate = new Date(payment.paymentDate);
  const fromDate = `01/${payment.month.slice(0, 3)}/${payment.year}`;
  const toDate = format(new Date(payment.year, new Date(Date.parse(payment.month + " 1, 2000")).getMonth() + 1, 0), 'dd/MMM/yyyy');

  return {
    slipNo,
    studentName: student.name,
    enrollmentNo: student.enrollmentNo,
    fatherName: student.fatherName,
    contact: student.contact,
    address: student.address,
    aadharNumber: student.aadharNumber,
    seatNumber: student.seatNumber,
    amount: payment.amount,
    amountInWords,
    month: payment.month,
    year: payment.year,
    paymentDate: format(paymentDate, 'dd/MM/yyyy'),
    monthlyFees: student.monthlyFees,
    totalPaid,
    totalDue,
    paymentMode: student.paymentMode,
    fromDate,
    toDate,
    profilePicture: student.profilePicture
  };
};

export const sendReceiptViaWhatsApp = async (receiptData: ReceiptData): Promise<void> => {
  // Generate receipt PDF in memory
  await generateFeeReceiptPDF(receiptData);
  
  // Create WhatsApp message
  const message = `🧾 *FEE RECEIPT - PATCH LIBRARY*\n\n` +
    `📋 *Receipt Details:*\n` +
    `• Slip No: ${receiptData.slipNo}\n` +
    `• Student: ${receiptData.studentName}\n` +
    `• Seat: ${receiptData.seatNumber}\n` +
    `• Amount: ₹${receiptData.amount.toLocaleString('en-IN')}\n` +
    `• Month: ${receiptData.month} ${receiptData.year}\n` +
    `• Date: ${receiptData.paymentDate}\n\n` +
    `💰 *Payment Summary:*\n` +
    `• Total Paid: ₹${receiptData.totalPaid.toLocaleString('en-IN')}\n` +
    `• Outstanding: ₹${receiptData.totalDue.toLocaleString('en-IN')}\n\n` +
    `📥 *PDF receipt has been downloaded to your device*\n\n` +
    `Thank you for choosing PATCH - The Smart Library! 🎓`;

  const cleanedPhone = receiptData.contact.replace(/\D/g, '');
  const phoneNumber = cleanedPhone.startsWith('91') ? cleanedPhone : '91' + cleanedPhone;
  const encodedMessage = encodeURIComponent(message);
  
  // Try multiple automatic methods for maximum compatibility
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
      console.log(`WhatsApp opened successfully using method ${i + 1}`);
      break;
    } catch (error) {
      console.log(`Method ${i + 1} failed, trying next...`);
      if (i === methods.length - 1) {
        try {
          window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_self');
          success = true;
        } catch (finalError) {
          console.error('All WhatsApp methods failed:', finalError);
        }
      }
    }
  }

  if (!success) {
    throw new Error('Failed to open WhatsApp. Please ensure WhatsApp is installed.');
  }
};
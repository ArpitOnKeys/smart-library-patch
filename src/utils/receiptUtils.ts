import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Student, FeePayment } from '@/types/database';
import { format } from 'date-fns';
import { generateVisualReceiptPDF as generatePDF } from './receiptUtils';

export interface ReceiptSettings {
  libraryLogo: string;
  accentColor: string;
  useStyledPDF: boolean;
  includePhoto: boolean;
  paperSize: 'A4' | 'Letter';
}

export const generateVisualReceiptPDF = async (
  student: Student,
  payment: FeePayment,
  receiptNumber: string,
  settings: ReceiptSettings
): Promise<Blob> => {
  // Create a temporary container for the receipt
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm';
  container.style.backgroundColor = 'white';
  
  // Create receipt HTML
  container.innerHTML = createReceiptHTML(student, payment, receiptNumber, settings);
  document.body.appendChild(container);

  try {
    // Generate canvas from HTML
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: settings.paperSize === 'A4' ? 'a4' : 'letter'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Return as blob
    return pdf.output('blob');
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
};

const createReceiptHTML = (
  student: Student,
  payment: FeePayment,
  receiptNumber: string,
  settings: ReceiptSettings
): string => {
  const convertNumberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

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
    const thousands = ['', 'Thousand', 'Lakh', 'Crore'];
    
    while (num > 0) {
      if (num % 1000 !== 0) {
        result = convertHundreds(num % 1000) + thousands[place] + ' ' + result;
      }
      num = Math.floor(num / 1000);
      place++;
    }

    return result.trim() + ' Rupees Only';
  };

  return `
    <div style="
      font-family: 'Arial', sans-serif;
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      background: white;
      color: black;
      font-size: 12px;
      line-height: 1.4;
    ">
      <!-- Header -->
      <div style="
        text-align: center;
        padding: 16px;
        margin-bottom: 24px;
        border-radius: 8px;
        background-color: ${settings.accentColor};
        color: white;
      ">
        <div style="display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 8px;">
          ${settings.libraryLogo ? `
            <img src="${settings.libraryLogo}" alt="Library Logo" style="height: 48px; width: 48px; object-fit: contain;" />
          ` : ''}
          <div>
            <h1 style="font-size: 24px; font-weight: bold; margin: 0;">PATCH - THE SMART LIBRARY</h1>
            <p style="font-size: 14px; opacity: 0.9; margin: 0;">Smart Library Management System</p>
          </div>
        </div>
      </div>

      <!-- Receipt Info -->
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 12px;
        border-bottom: 2px solid #d1d5db;
      ">
        <div>
          <h2 style="font-size: 20px; font-weight: bold; margin: 0;">FEE RECEIPT</h2>
          <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0 0;">
            Receipt No: <span style="font-weight: bold;">${receiptNumber}</span>
          </p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 14px; color: #6b7280; margin: 0;">Date of Issue</p>
          <p style="font-weight: bold; margin: 4px 0 0 0;">${format(new Date(payment.paymentDate), 'dd/MM/yyyy')}</p>
        </div>
      </div>

      <!-- Student Photo and Basic Info -->
      <div style="display: flex; gap: 24px; margin-bottom: 24px;">
        ${settings.includePhoto ? `
          <div style="flex-shrink: 0;">
            <div style="
              width: 96px;
              height: 96px;
              border: 2px solid #d1d5db;
              border-radius: 8px;
              overflow: hidden;
              background-color: #f9fafb;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              ${student.profilePicture ? `
                <img src="${student.profilePicture}" alt="${student.name}" style="width: 100%; height: 100%; object-fit: cover;" />
              ` : `
                <div style="font-size: 24px; font-weight: bold; color: #9ca3af;">
                  ${student.name.charAt(0).toUpperCase()}
                </div>
              `}
            </div>
            <p style="font-size: 10px; text-align: center; margin-top: 4px; color: #6b7280;">Student Photo</p>
          </div>
        ` : ''}
        
        <div style="flex: 1;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; font-weight: 600; width: 128px;">Student Name:</td>
              <td style="padding: 4px 0; font-weight: bold; font-size: 18px;">${student.name}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 600;">Father's Name:</td>
              <td style="padding: 4px 0;">${student.fatherName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 600;">Enrollment No:</td>
              <td style="padding: 4px 0; font-family: monospace;">${student.enrollmentNo}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 600;">Contact:</td>
              <td style="padding: 4px 0;">${student.contact}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Detailed Information -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
        <div>
          <h3 style="font-weight: bold; font-size: 18px; margin-bottom: 12px; padding-bottom: 4px; border-bottom: 1px solid #d1d5db;">Student Details</h3>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; font-weight: 600;">Aadhaar Number:</td>
              <td style="padding: 4px 0;">${student.aadharNumber}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 600;">Seat Number:</td>
              <td style="padding: 4px 0; font-weight: bold;">${student.seatNumber}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 600;">Shift:</td>
              <td style="padding: 4px 0;">${student.shift}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 600;">Timing:</td>
              <td style="padding: 4px 0;">${student.timing}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 600; vertical-align: top;">Address:</td>
              <td style="padding: 4px 0;">${student.address}</td>
            </tr>
          </table>
        </div>

        <div>
          <h3 style="font-weight: bold; font-size: 18px; margin-bottom: 12px; padding-bottom: 4px; border-bottom: 1px solid #d1d5db;">Payment Details</h3>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; font-weight: 600;">Fee Period:</td>
              <td style="padding: 4px 0; font-weight: bold;">${payment.month} ${payment.year}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 600;">Payment Date:</td>
              <td style="padding: 4px 0;">${format(new Date(payment.paymentDate), 'dd/MM/yyyy')}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 600;">Payment Mode:</td>
              <td style="padding: 4px 0;">${student.paymentMode}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 600;">Monthly Fee:</td>
              <td style="padding: 4px 0;">₹${student.monthlyFees}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Duration -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-weight: bold; font-size: 18px; margin-bottom: 12px; padding-bottom: 4px; border-bottom: 1px solid #d1d5db;">Duration</h3>
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
          <div style="display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center;">
              <p style="font-size: 14px; color: #6b7280; margin: 0;">From</p>
              <p style="font-weight: bold; font-size: 18px; margin: 4px 0 0 0;">${format(new Date(student.joiningDate), 'dd/MM/yyyy')}</p>
            </div>
            <div style="margin: 0 32px; font-size: 24px; font-weight: bold; color: #9ca3af;">→</div>
            <div style="text-align: center;">
              <p style="font-size: 14px; color: #6b7280; margin: 0;">To</p>
              <p style="font-weight: bold; font-size: 18px; margin: 4px 0 0 0;">${format(new Date(student.feesPaidTill), 'dd/MM/yyyy')}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Amount Section -->
      <div style="margin-bottom: 32px;">
        <div style="
          padding: 16px;
          border-radius: 8px;
          background-color: ${settings.accentColor};
          color: white;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="font-size: 14px; opacity: 0.9; margin: 0;">Amount Paid</p>
              <p style="font-size: 32px; font-weight: bold; margin: 4px 0 0 0;">₹${payment.amount}</p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 14px; opacity: 0.9; margin: 0;">In Words</p>
              <p style="font-weight: 600; font-size: 14px; margin: 4px 0 0 0;">${convertNumberToWords(payment.amount)}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Signature Section -->
      <div style="display: flex; justify-content: space-between; align-items: end; margin-bottom: 32px;">
        <div>
          <div style="border-bottom: 2px solid #6b7280; width: 192px; margin-bottom: 8px;"></div>
          <p style="font-size: 14px; font-weight: 600; margin: 0;">Student Signature</p>
        </div>
        <div>
          <div style="border-bottom: 2px solid #6b7280; width: 192px; margin-bottom: 8px;"></div>
          <p style="font-size: 14px; font-weight: 600; margin: 0;">Authorized Signature</p>
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top: 2px solid #d1d5db; padding-top: 16px; text-align: center;">
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
          Thank you for choosing PATCH - The Smart Library
        </p>
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af;">
          <span>Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</span>
          <span>Powered by Arpit Upadhyay</span>
        </div>
      </div>
    </div>
  `;
};

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

export const generateReceiptNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const time = Date.now().toString().slice(-4);
  return `PATCH${year}${month}${day}${time}`;
};

export const sendReceiptViaWhatsApp = async (
  student: Student,
  pdfBlob: Blob,
  customMessage?: string
): Promise<void> => {
  try {
    // Create a temporary URL for the PDF
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Prepare WhatsApp message
    const message = customMessage || `Hello ${student.name}, here is your fee receipt from PATCH Library. Thank you for your payment!`;
    const cleanedPhone = student.contact.replace(/\D/g, '');
    const phoneNumber = cleanedPhone.startsWith('91') ? cleanedPhone : '91' + cleanedPhone;
    const encodedMessage = encodeURIComponent(message);
    
    // Note: File attachment via WhatsApp Web is limited
    // We'll open WhatsApp with the message and provide instructions
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}%0A%0ANote: Please find the fee receipt PDF in your downloads folder.`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Also trigger PDF download so user can manually attach
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `FeeReceipt_${student.name.replace(/\s+/g, '_')}_${format(new Date(), 'ddMMyyyy')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    
  } catch (error) {
    console.error('Error sending receipt via WhatsApp:', error);
    throw error;
  }
};

export const bulkGenerateReceipts = async (
  studentsWithPayments: Array<{ student: Student; payment: FeePayment }>,
  settings: ReceiptSettings,
  onProgress?: (current: number, total: number) => void
): Promise<Blob[]> => {
  const receipts: Blob[] = [];
  
  for (let i = 0; i < studentsWithPayments.length; i++) {
    const { student, payment } = studentsWithPayments[i];
    const receiptNumber = generateReceiptNumber();
    
    try {
      const pdfBlob = await generateVisualReceiptPDF(student, payment, receiptNumber, settings);
      receipts.push(pdfBlob);
      
      if (onProgress) {
        onProgress(i + 1, studentsWithPayments.length);
      }
      
      // Small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error generating receipt for ${student.name}:`, error);
      // Continue with other receipts
    }
  }
  
  return receipts;
};
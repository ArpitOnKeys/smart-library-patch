import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Student } from '@/types/database';
import { studentDb } from '@/lib/database';

// Export single student profile as PDF
export const exportStudentProfile = async (student: Student): Promise<void> => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Header
  pdf.setFontSize(20);
  pdf.setTextColor(41, 128, 185);
  pdf.text('PATCH – The Smart Library', pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Student Profile Report', pageWidth / 2, 30, { align: 'center' });
  
  // Student Photo placeholder (if available)
  let yPosition = 50;
  if (student.profilePicture) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = student.profilePicture;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 100;
      canvas.height = 100;
      ctx?.drawImage(img, 0, 0, 100, 100);
      
      const imgData = canvas.toDataURL('image/jpeg');
      pdf.addImage(imgData, 'JPEG', 20, yPosition, 30, 30);
    } catch (error) {
      console.log('Could not load profile image for PDF');
    }
  }
  
  // Student Information
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`${student.name}`, 60, yPosition + 10);
  
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Enrollment: ${student.enrollmentNo}`, 60, yPosition + 20);
  pdf.text(`Seat: ${student.seatNumber}`, 60, yPosition + 30);
  
  yPosition += 50;
  
  // Personal Information Section
  pdf.setFontSize(14);
  pdf.setTextColor(41, 128, 185);
  pdf.text('Personal Information', 20, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  const personalInfo = [
    [`Name:`, student.name],
    [`Father's Name:`, student.fatherName],
    [`Contact:`, student.contact],
    [`Aadhar Number:`, student.aadharNumber],
    [`Address:`, student.address],
    [`Gender:`, student.gender]
  ];
  
  personalInfo.forEach(([label, value]) => {
    pdf.text(label, 20, yPosition);
    pdf.text(value, 70, yPosition);
    yPosition += 7;
  });
  
  yPosition += 10;
  
  // Academic Information Section
  pdf.setFontSize(14);
  pdf.setTextColor(41, 128, 185);
  pdf.text('Academic Information', 20, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  const academicInfo = [
    [`Shift:`, student.shift],
    [`Timing:`, student.timing],
    [`Joining Date:`, new Date(student.joiningDate).toLocaleDateString()],
    [`Admission Date:`, new Date(student.admissionDate).toLocaleDateString()],
    [`Assigned Staff:`, student.assignedStaff]
  ];
  
  academicInfo.forEach(([label, value]) => {
    pdf.text(label, 20, yPosition);
    pdf.text(value, 70, yPosition);
    yPosition += 7;
  });
  
  yPosition += 10;
  
  // Fee Information Section
  pdf.setFontSize(14);
  pdf.setTextColor(41, 128, 185);
  pdf.text('Fee Information', 20, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  const feeInfo = [
    [`Monthly Fees:`, `₹${student.monthlyFees}`],
    [`Fees Paid Till:`, new Date(student.feesPaidTill).toLocaleDateString()],
    [`Payment Mode:`, student.paymentMode]
  ];
  
  feeInfo.forEach(([label, value]) => {
    pdf.text(label, 20, yPosition);
    pdf.text(value, 70, yPosition);
    yPosition += 7;
  });
  
  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, pageHeight - 20);
  pdf.text('Powered by Arpit Upadhyay', pageWidth - 20, pageHeight - 20, { align: 'right' });
  
  // Save PDF
  const fileName = `Student_${student.enrollmentNo}_Profile.pdf`;
  pdf.save(fileName);
};

// Export student ID card
export const exportStudentIDCard = async (student: Student): Promise<void> => {
  // Create ID card HTML element
  const idCardElement = document.createElement('div');
  idCardElement.style.cssText = `
    width: 400px;
    height: 250px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 15px;
    padding: 20px;
    color: white;
    font-family: Arial, sans-serif;
    position: relative;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  `;
  
  idCardElement.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; height: 100%;">
      <div style="flex: 1;">
        <div style="background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 20px; display: inline-block; margin-bottom: 15px;">
          <h3 style="margin: 0; font-size: 12px; font-weight: bold;">PATCH – The Smart Library</h3>
        </div>
        
        <div style="margin-bottom: 10px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: bold;">${student.name}</h2>
          <p style="margin: 2px 0; font-size: 12px; opacity: 0.9;">${student.fatherName}</p>
        </div>
        
        <div style="font-size: 11px; line-height: 1.4;">
          <p style="margin: 3px 0;"><strong>Enrollment:</strong> ${student.enrollmentNo}</p>
          <p style="margin: 3px 0;"><strong>Contact:</strong> ${student.contact}</p>
          <p style="margin: 3px 0;"><strong>Seat:</strong> ${student.seatNumber}</p>
          <p style="margin: 3px 0;"><strong>Shift:</strong> ${student.shift}</p>
        </div>
        
        <div style="position: absolute; bottom: 15px; left: 20px; font-size: 9px; opacity: 0.8;">
          Powered by Arpit Upadhyay
        </div>
      </div>
      
      <div style="display: flex; flex-direction: column; align-items: center; margin-left: 20px;">
        <div id="student-photo" style="width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.3); margin-bottom: 15px; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: bold;">
          ${student.name.charAt(0).toUpperCase()}
        </div>
        
        <div id="qr-code" style="width: 60px; height: 60px; background: white; border-radius: 5px; display: flex; align-items: center; justify-content: center;">
          <div style="width: 50px; height: 50px; background: url('data:image/svg+xml,${encodeURIComponent(generateQRCodeSVG(student.enrollmentNo + '|' + student.contact))}') no-repeat center; background-size: contain;"></div>
        </div>
      </div>
    </div>
  `;
  
  // Temporarily add to DOM
  idCardElement.style.position = 'absolute';
  idCardElement.style.left = '-9999px';
  document.body.appendChild(idCardElement);
  
  try {
    // If student has profile picture, try to load it
    if (student.profilePicture) {
      const photoElement = idCardElement.querySelector('#student-photo') as HTMLElement;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = student.profilePicture;
      
      await new Promise((resolve) => {
        img.onload = () => {
          photoElement.style.backgroundImage = `url(${student.profilePicture})`;
          photoElement.style.backgroundSize = 'cover';
          photoElement.style.backgroundPosition = 'center';
          photoElement.textContent = '';
          resolve(true);
        };
        img.onerror = () => resolve(false);
      });
    }
    
    // Generate canvas from element
    const canvas = await html2canvas(idCardElement, {
      backgroundColor: null,
      scale: 2
    });
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [86, 54] // Credit card size
    });
    
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, 86, 54);
    
    // Save PDF
    const fileName = `StudentID_${student.enrollmentNo}.pdf`;
    pdf.save(fileName);
    
  } finally {
    // Clean up
    document.body.removeChild(idCardElement);
  }
};

// Export all students as CSV
export const exportAllStudentsCSV = (): void => {
  const students = studentDb.getAll();
  
  const headers = [
    'Enrollment No',
    'Name',
    'Father Name',
    'Contact',
    'Aadhar Number',
    'Address',
    'Gender',
    'Shift',
    'Timing',
    'Monthly Fees',
    'Fees Paid Till',
    'Seat Number',
    'Joining Date',
    'Admission Date',
    'Assigned Staff',
    'Payment Mode',
    'Profile Picture Path'
  ];
  
  const csvContent = [
    headers.join(','),
    ...students.map(student => [
      student.enrollmentNo,
      `"${student.name}"`,
      `"${student.fatherName}"`,
      student.contact,
      student.aadharNumber,
      `"${student.address}"`,
      student.gender,
      student.shift,
      `"${student.timing}"`,
      student.monthlyFees,
      student.feesPaidTill,
      student.seatNumber,
      student.joiningDate,
      student.admissionDate,
      `"${student.assignedStaff}"`,
      student.paymentMode,
      student.profilePicture || ''
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `All_Students_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export multiple students as PDF
export const exportMultipleStudentsPDF = async (students: Student[]): Promise<void> => {
  const pdf = new jsPDF();
  
  for (let i = 0; i < students.length; i++) {
    if (i > 0) {
      pdf.addPage();
    }
    
    const student = students[i];
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Header
    pdf.setFontSize(16);
    pdf.setTextColor(41, 128, 185);
    pdf.text('PATCH – The Smart Library', pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Student ${i + 1} of ${students.length}`, pageWidth / 2, 30, { align: 'center' });
    
    // Student basic info
    let yPos = 50;
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${student.name} (${student.enrollmentNo})`, 20, yPos);
    
    yPos += 15;
    pdf.setFontSize(10);
    
    const info = [
      [`Father's Name:`, student.fatherName],
      [`Contact:`, student.contact],
      [`Shift:`, student.shift],
      [`Seat:`, student.seatNumber],
      [`Monthly Fees:`, `₹${student.monthlyFees}`],
      [`Admission Date:`, new Date(student.admissionDate).toLocaleDateString()]
    ];
    
    info.forEach(([label, value]) => {
      pdf.text(`${label} ${value}`, 20, yPos);
      yPos += 8;
    });
  }
  
  const fileName = `Students_Batch_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

// Generate simple QR code SVG
const generateQRCodeSVG = (data: string): string => {
  // This is a simplified QR code generator - in production, use a proper QR library
  const size = 100;
  const modules = 21; // 21x21 for version 1 QR code
  const moduleSize = size / modules;
  
  let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;
  
  // Create a simple pattern based on data hash
  const hash = data.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  for (let i = 0; i < modules; i++) {
    for (let j = 0; j < modules; j++) {
      const shouldFill = (hash + i * modules + j) % 3 === 0;
      if (shouldFill) {
        svg += `<rect x="${j * moduleSize}" y="${i * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
      }
    }
  }
  
  svg += '</svg>';
  return svg;
};
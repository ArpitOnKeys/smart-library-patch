
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const printElement = (elementId: string, title: string): void => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          h1, h2 { color: #333; }
          .header { text-align: center; margin-bottom: 30px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📚 PATCH - THE SMART LIBRARY</h1>
          <h2>${title}</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        ${element.innerHTML}
        <div class="footer">
          <p>PATCH - Smart Library Management System v1.0</p>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

export const exportToPDF = (data: any[], headers: string[], title: string, filename: string): void => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(18);
  doc.text('📚 PATCH - THE SMART LIBRARY', 20, 20);
  doc.setFontSize(14);
  doc.text(title, 20, 35);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);

  // Add table
  doc.autoTable({
    head: [headers],
    body: data,
    startY: 55,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount} - PATCH Smart Library v1.0`,
      20,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(filename);
};

export const exportStudentListPDF = (students: any[]): void => {
  const data = students.map(student => [
    student.name,
    student.fatherName,
    student.phone,
    student.shift,
    student.monthlyFee,
    new Date(student.createdAt).toLocaleDateString()
  ]);

  const headers = ['Name', 'Father Name', 'Phone', 'Shift', 'Monthly Fee', 'Admission Date'];
  
  exportToPDF(data, headers, 'Student List Report', 'student-list.pdf');
};

export const exportFeeHistoryPDF = (payments: any[], studentName: string): void => {
  const data = payments.map(payment => [
    new Date(payment.paymentDate).toLocaleDateString(),
    payment.amount,
    payment.month,
    payment.year,
    payment.notes || '-'
  ]);

  const headers = ['Payment Date', 'Amount', 'Month', 'Year', 'Notes'];
  
  exportToPDF(data, headers, `Fee History - ${studentName}`, `fee-history-${studentName.replace(/\s+/g, '-')}.pdf`);
};

export const exportExpensesPDF = (expenses: any[], month?: string): void => {
  const data = expenses.map(expense => [
    expense.title,
    expense.category,
    expense.amount,
    new Date(expense.date).toLocaleDateString(),
    expense.notes || '-'
  ]);

  const headers = ['Title', 'Category', 'Amount', 'Date', 'Notes'];
  const title = month ? `Expenses Report - ${month}` : 'All Expenses Report';
  const filename = month ? `expenses-${month.replace(/\s+/g, '-')}.pdf` : 'all-expenses.pdf';
  
  exportToPDF(data, headers, title, filename);
};

export const exportNetIncomePDF = (summary: any): void => {
  const data = [
    ['Total Fee Income', `₹${summary.totalIncome}`],
    ['Total Expenses', `₹${summary.totalExpenses}`],
    ['Net Income', `₹${summary.netIncome}`],
    ['Total Students', summary.totalStudents],
    ['Active Month', summary.currentMonth]
  ];

  const headers = ['Metric', 'Value'];
  
  exportToPDF(data, headers, 'Net Income Summary', 'net-income-summary.pdf');
};

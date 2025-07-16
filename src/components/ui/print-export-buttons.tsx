
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

interface PrintExportButtonsProps {
  onPrint?: () => void;
  onExportPDF?: () => void;
  className?: string;
}

export const PrintExportButtons = ({ onPrint, onExportPDF, className }: PrintExportButtonsProps) => {
  return (
    <div className={`flex gap-2 ${className}`}>
      {onPrint && (
        <Button variant="outline" size="sm" onClick={onPrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
      )}
      {onExportPDF && (
        <Button variant="outline" size="sm" onClick={onExportPDF} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      )}
    </div>
  );
};

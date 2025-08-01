import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, RefreshCw } from 'lucide-react';
import { Student } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface StudentQRGeneratorProps {
  student: Student;
}

export const StudentQRGenerator = ({ student }: StudentQRGeneratorProps) => {
  const [qrData, setQrData] = useState(() => 
    JSON.stringify({
      enrollment: student.enrollmentNo,
      name: student.name,
      contact: student.contact,
      seat: student.seatNumber
    })
  );
  const [qrSize, setQrSize] = useState(200);
  const { toast } = useToast();

  const downloadQR = () => {
    const svg = document.querySelector('#student-qr-code svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = qrSize;
    canvas.height = qrSize;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${student.enrollmentNo}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      
      toast({
        title: 'QR Code Downloaded',
        description: 'QR code has been saved to your downloads.',
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const copyQRData = () => {
    navigator.clipboard.writeText(qrData);
    toast({
      title: 'QR Data Copied',
      description: 'QR code data has been copied to clipboard.',
    });
  };

  const regenerateQR = () => {
    const timestamp = Date.now();
    const newData = JSON.stringify({
      enrollment: student.enrollmentNo,
      name: student.name,
      contact: student.contact,
      seat: student.seatNumber,
      generated: timestamp
    });
    setQrData(newData);
    
    toast({
      title: 'QR Code Regenerated',
      description: 'A new QR code with timestamp has been generated.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Student QR Code</span>
          <Badge variant="outline">{student.enrollmentNo}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code Display */}
        <div className="flex justify-center">
          <div 
            id="student-qr-code"
            className="p-4 bg-white rounded-lg shadow-lg border-2 border-dashed border-primary/20"
          >
            <QRCodeSVG
              value={qrData}
              size={qrSize}
              level="M"
              includeMargin
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
        </div>

        {/* Student Info */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">{student.name}</h3>
          <div className="flex justify-center gap-2 flex-wrap">
            <Badge variant="default">{student.enrollmentNo}</Badge>
            <Badge variant="secondary">Seat {student.seatNumber}</Badge>
            <Badge variant="outline">{student.shift}</Badge>
          </div>
        </div>

        {/* QR Code Data Preview */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <h4 className="text-sm font-medium mb-2">QR Data:</h4>
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
            {JSON.stringify(JSON.parse(qrData), null, 2)}
          </pre>
        </div>

        {/* Size Control */}
        <div className="space-y-2">
          <label className="text-sm font-medium">QR Code Size:</label>
          <div className="flex gap-2">
            {[150, 200, 250, 300].map(size => (
              <Button
                key={size}
                variant={qrSize === size ? "default" : "outline"}
                size="sm"
                onClick={() => setQrSize(size)}
              >
                {size}px
              </Button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={downloadQR} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download QR
          </Button>
          <Button variant="outline" onClick={copyQRData}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Data
          </Button>
          <Button variant="outline" onClick={regenerateQR}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
        </div>

        {/* Usage Instructions */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <h5 className="font-medium mb-1">QR Code Usage:</h5>
          <ul className="list-disc list-inside space-y-1">
            <li>Scan with any QR code reader to get student information</li>
            <li>Contains enrollment number, name, contact, and seat details</li>
            <li>Can be printed on ID cards or used for quick student lookup</li>
            <li>Regenerate to add timestamp for tracking purposes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
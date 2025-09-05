/**
 * WhatsApp QR Code Dialog for Authentication
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Smartphone } from 'lucide-react';

interface WhatsAppQRDialogProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeUrl: string;
}

export const WhatsAppQRDialog: React.FC<WhatsAppQRDialogProps> = ({
  isOpen,
  onClose,
  qrCodeUrl
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>Connect WhatsApp</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <img 
                  src={qrCodeUrl} 
                  alt="WhatsApp QR Code" 
                  className="mx-auto w-48 h-48 border rounded-lg"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <Smartphone className="h-4 w-4" />
                  <span>Scan with WhatsApp</span>
                </div>
                
                <ol className="text-sm text-muted-foreground space-y-1 text-left">
                  <li>1. Open WhatsApp on your phone</li>
                  <li>2. Tap Menu (⋮) &gt; Linked Devices</li>
                  <li>3. Tap "Link a Device"</li>
                  <li>4. Scan this QR code</li>
                </ol>
              </div>
            </CardContent>
          </Card>
          
          <p className="text-xs text-muted-foreground text-center">
            This will connect your WhatsApp account for automated messaging. 
            Your account stays secure and logged in.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
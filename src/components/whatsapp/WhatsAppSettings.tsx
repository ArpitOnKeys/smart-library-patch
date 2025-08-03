import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Wifi, WifiOff, Link, Unlink, QrCode, Clock } from 'lucide-react';
import { useWhatsAppService } from '@/hooks/useWhatsAppService';

export const WhatsAppSettings = () => {
  const [showQRDialog, setShowQRDialog] = useState(false);
  
  const {
    session,
    isConnected,
    isConnecting,
    isLoading,
    generateQR,
    disconnect,
  } = useWhatsAppService();

  const handleConnectWhatsApp = async () => {
    setShowQRDialog(true);
    await generateQR();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          WhatsApp Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Connection Status</span>
              {isConnected ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" />
                  Not Connected
                </Badge>
              )}
            </div>
            {session?.sessionData?.phone && (
              <p className="text-sm text-muted-foreground">
                Connected to: {session.sessionData.phone}
              </p>
            )}
            {session?.connectedAt && (
              <p className="text-sm text-muted-foreground">
                Connected since: {new Date(session.connectedAt).toLocaleString()}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            {!isConnected ? (
              <Button onClick={handleConnectWhatsApp} disabled={isLoading}>
                <Link className="h-4 w-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Link Account'}
              </Button>
            ) : (
              <Button variant="outline" onClick={disconnect}>
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            )}
          </div>
        </div>

        {/* Account Linking Instructions */}
        <div className="p-3 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">How to Link Your WhatsApp Account:</h4>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Click "Link Account" to generate a QR code</li>
            <li>2. Open WhatsApp on your phone</li>
            <li>3. Go to Settings → Linked Devices</li>
            <li>4. Tap "Link a Device" and scan the QR code</li>
            <li>5. Your WhatsApp will be connected to the app</li>
          </ol>
        </div>

        {/* Features Overview */}
        <div className="space-y-2">
          <h4 className="font-medium">Available Features:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Send individual messages to students</li>
            <li>• Send bulk messages with templates</li>
            <li>• Track message delivery status</li>
            <li>• Personalized messages with student data</li>
            <li>• Rate limiting to prevent account blocks</li>
          </ul>
        </div>

        {/* QR Code Dialog */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Connect WhatsApp Account
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-center">
              {session?.qrCode ? (
                <>
                  <div className="flex justify-center">
                    <img src={session.qrCode} alt="WhatsApp QR Code" className="w-48 h-48 border rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Scan this QR code with your phone</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>1. Open WhatsApp on your phone</p>
                      <p>2. Go to Settings → Linked Devices</p>
                      <p>3. Tap "Link a Device"</p>
                      <p>4. Scan this QR code</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <p className="text-xs text-blue-800">
                        <strong>Note:</strong> QR code will expire in 60 seconds. A new one will be generated automatically if needed.
                      </p>
                    </div>
                  </div>
                  {isConnecting && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
                      <Clock className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Waiting for connection...</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center gap-2 py-8">
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>Generating QR code...</span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
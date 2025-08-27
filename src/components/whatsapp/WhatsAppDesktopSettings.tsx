import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Wifi, 
  WifiOff, 
  Link, 
  Unlink, 
  MessageCircle, 
  RefreshCw, 
  Bug, 
  Download,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { whatsappDesktop, WhatsAppSession } from '@/utils/whatsappDesktop';
import { WhatsAppDesktopDebugPanel } from './WhatsAppDesktopDebugPanel';

export const WhatsAppDesktopSettings = () => {
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [installationChecked, setInstallationChecked] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSession();
    checkInstallation();
  }, []);

  const loadSession = () => {
    const currentSession = whatsappDesktop.getSession();
    setSession(currentSession);
  };

  const checkInstallation = async () => {
    try {
      // This will update the session with installation status
      await whatsappDesktop.testConnection();
      loadSession();
      setInstallationChecked(true);
    } catch (error) {
      console.error('Installation check failed:', error);
      setInstallationChecked(true);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const newSession = await whatsappDesktop.connectDesktop();
      setSession(newSession);
      
      toast({
        title: "WhatsApp Desktop Connected",
        description: "Successfully linked to your WhatsApp Desktop installation",
      });
    } catch (error) {
      console.error('Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to WhatsApp Desktop",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const success = await whatsappDesktop.testConnection();
      
      if (success) {
        toast({
          title: "Test Successful",
          description: "WhatsApp Desktop opened successfully",
        });
      } else {
        toast({
          title: "Test Failed",
          description: "Could not open WhatsApp Desktop",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Test connection failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    whatsappDesktop.disconnect();
    loadSession();
    
    toast({
      title: "Disconnected",
      description: "WhatsApp Desktop has been disconnected",
    });
  };

  const handleReset = () => {
    whatsappDesktop.resetSession();
    setSession(null);
    
    toast({
      title: "Session Reset",
      description: "WhatsApp session has been reset",
    });
  };

  const isConnected = whatsappDesktop.isConnected();
  const isConnecting = whatsappDesktop.isConnecting();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          WhatsApp Desktop Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Installation Status */}
        {installationChecked && (
          <Alert className={session?.isDesktopInstalled ? '' : 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950'}>
            <div className="flex items-center gap-2">
              {session?.isDesktopInstalled ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              )}
              <AlertDescription className="font-medium">
                {session?.isDesktopInstalled 
                  ? "WhatsApp Desktop installation detected" 
                  : "WhatsApp Desktop not found"}
              </AlertDescription>
            </div>
            {!session?.isDesktopInstalled && (
              <AlertDescription className="mt-2 text-sm">
                Please install WhatsApp Desktop from the official website to use this feature.
                <br />
                <a 
                  href="https://www.whatsapp.com/download" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1 mt-1"
                >
                  <Download className="h-3 w-3" />
                  Download WhatsApp Desktop
                </a>
              </AlertDescription>
            )}
          </Alert>
        )}

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
            {session?.deviceInfo?.platform && (
              <p className="text-sm text-muted-foreground">
                Platform: {session.deviceInfo.platform}
              </p>
            )}
            {session?.connectedAt && (
              <p className="text-sm text-muted-foreground">
                Connected since: {new Date(session.connectedAt).toLocaleString()}
              </p>
            )}
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {!isConnected ? (
              <Button 
                onClick={handleConnect} 
                disabled={isLoading || !session?.isDesktopInstalled}
              >
                <Link className="h-4 w-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Desktop'}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleTestConnection} disabled={isLoading}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {isLoading ? 'Testing...' : 'Test Connection'}
                </Button>
                <Button variant="outline" onClick={handleDisconnect}>
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </>
            )}
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Session
            </Button>
            <Button variant="outline" onClick={() => setShowDebugPanel(true)}>
              <Bug className="h-4 w-4 mr-2" />
              Debug Panel
            </Button>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="p-3 bg-muted rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            How WhatsApp Desktop Integration Works:
          </h4>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Ensure WhatsApp Desktop is installed and logged in</li>
            <li>2. Click "Connect Desktop" to link this app</li>
            <li>3. Send messages directly through your WhatsApp Desktop</li>
            <li>4. No QR scanning required - uses your existing session</li>
          </ol>
        </div>

        {/* Features Overview */}
        <div className="space-y-2">
          <h4 className="font-medium">Available Features:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Send individual messages to students via WhatsApp Desktop</li>
            <li>• Bulk messaging with automatic delays</li>
            <li>• Pre-filled messages with student data</li>
            <li>• PDF receipt attachment support (manual)</li>
            <li>• Offline operation - no internet dependency</li>
            <li>• Uses your existing WhatsApp account</li>
          </ul>
        </div>

        {/* Privacy Notice */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy & Security:</strong> This integration works entirely offline using your existing WhatsApp Desktop installation. 
            No data is sent to external servers, and all communications go through WhatsApp's secure infrastructure.
          </AlertDescription>
        </Alert>

        {/* Debug Panel Dialog */}
        <Dialog open={showDebugPanel} onOpenChange={setShowDebugPanel}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>WhatsApp Desktop Debug Panel</DialogTitle>
            </DialogHeader>
            <WhatsAppDesktopDebugPanel />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Bug, 
  Send, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  MessageSquare,
  Monitor,
  Wifi,
  WifiOff
} from 'lucide-react';
import { whatsappDesktop, WhatsAppLog, WhatsAppSession } from '@/utils/whatsappDesktop';

export const WhatsAppDesktopDebugPanel = () => {
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [testPhone, setTestPhone] = useState('+91-98765-43210');
  const [testMessage, setTestMessage] = useState('🤖 Test message from PATCH Library Management System. WhatsApp Desktop integration is working!');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    refreshData();
    
    // Set up periodic refresh
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    const currentSession = whatsappDesktop.getSession();
    const currentLogs = whatsappDesktop.getLogs();
    
    setSession(currentSession);
    setLogs(currentLogs);
  };

  const handleTestMessage = async () => {
    if (!testPhone || !testMessage) {
      toast({
        title: "Error",
        description: "Please enter both phone number and message",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await whatsappDesktop.sendMessage({
        phone: testPhone,
        message: testMessage,
        studentId: 'test-debug',
        studentName: 'Debug Test'
      });

      if (result.success) {
        toast({
          title: "Test Message Sent",
          description: "WhatsApp Desktop should have opened with the message",
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.log.errorMessage || "Failed to send test message",
          variant: "destructive",
        });
      }

      refreshData();
    } catch (error) {
      toast({
        title: "Test Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLogs = () => {
    whatsappDesktop.clearLogs();
    refreshData();
    
    toast({
      title: "Logs Cleared",
      description: "All WhatsApp logs have been cleared",
    });
  };

  const handleReconnect = async () => {
    setIsLoading(true);
    try {
      await whatsappDesktop.connectDesktop();
      refreshData();
      
      toast({
        title: "Reconnected",
        description: "WhatsApp Desktop connection refreshed",
      });
    } catch (error) {
      toast({
        title: "Reconnection Failed",
        description: error instanceof Error ? error.message : "Failed to reconnect",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'opened':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'sent':
      case 'opened':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const isConnected = whatsappDesktop.isConnected();

  return (
    <div className="space-y-6">
      {/* Session Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Session Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {isConnected ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <WifiOff className="h-3 w-3" />
                    Disconnected
                  </Badge>
                )}
              </div>
              
              {session?.deviceInfo?.platform && (
                <div className="text-sm">
                  <span className="font-medium">Platform: </span>
                  <span className="text-muted-foreground">{session.deviceInfo.platform}</span>
                </div>
              )}
              
              <div className="text-sm">
                <span className="font-medium">WhatsApp Installed: </span>
                <span className={session?.isDesktopInstalled ? 'text-green-600' : 'text-red-600'}>
                  {session?.isDesktopInstalled ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              {session?.connectedAt && (
                <div className="text-sm">
                  <span className="font-medium">Connected At: </span>
                  <span className="text-muted-foreground">
                    {new Date(session.connectedAt).toLocaleString()}
                  </span>
                </div>
              )}
              
              {session?.lastActivity && (
                <div className="text-sm">
                  <span className="font-medium">Last Activity: </span>
                  <span className="text-muted-foreground">
                    {new Date(session.lastActivity).toLocaleString()}
                  </span>
                </div>
              )}
              
              {session?.id && (
                <div className="text-sm">
                  <span className="font-medium">Session ID: </span>
                  <span className="text-muted-foreground font-mono">
                    {session.id.slice(0, 8)}...
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleReconnect} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reconnect
            </Button>
            <Button variant="outline" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Test Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-phone">Phone Number</Label>
              <Input
                id="test-phone"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+91-98765-43210"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-message">Message</Label>
              <Textarea
                id="test-message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter test message"
                rows={3}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleTestMessage} 
            disabled={isLoading || !isConnected}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Sending...' : 'Send Test Message'}
          </Button>
        </CardContent>
      </Card>

      {/* Message Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Message Logs ({logs.length})
            </div>
            <Button variant="outline" size="sm" onClick={handleClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Logs
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No logs available. Send a message to see logs here.
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div key={log.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className="font-medium">{log.studentName}</span>
                        <Badge variant={getStatusBadgeVariant(log.status)}>
                          {log.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium">Phone: </span>
                        <span className="text-muted-foreground">{log.phoneNumber}</span>
                      </div>
                      <div>
                        <span className="font-medium">Message: </span>
                        <span className="text-muted-foreground">
                          {log.message.substring(0, 100)}
                          {log.message.length > 100 && '...'}
                        </span>
                      </div>
                      {log.errorMessage && (
                        <div>
                          <span className="font-medium text-red-600">Error: </span>
                          <span className="text-red-600">{log.errorMessage}</span>
                        </div>
                      )}
                    </div>
                    
                    {index < logs.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
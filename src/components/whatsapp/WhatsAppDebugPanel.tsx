import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppService } from '@/hooks/useWhatsAppService';
import { 
  Smartphone, 
  QrCode, 
  Send, 
  RotateCcw, 
  TestTube, 
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

export const WhatsAppDebugPanel = () => {
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testMessage, setTestMessage] = useState('Hello! This is a test message from PATCH Library.');
  const [isTestingSend, setIsTestingSend] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  const { toast } = useToast();
  const {
    status,
    session,
    isLoading,
    isConnected,
    sendMessage,
    testConnection,
    resetSession,
    logs,
    refreshLogs
  } = useWhatsAppService();

  // Auto-refresh logs every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshLogs();
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshLogs]);

  const handleTestSend = async () => {
    if (!testPhoneNumber.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number to test',
        variant: 'destructive'
      });
      return;
    }

    setIsTestingSend(true);
    try {
      const success = await sendMessage({
        phone: testPhoneNumber,
        message: testMessage,
        studentId: 'test',
        studentName: 'Test User'
      });

      if (success) {
        toast({
          title: 'Test Message Sent!',
          description: `Message sent successfully to ${testPhoneNumber}`,
        });
      }
    } catch (error) {
      console.error('Test send failed:', error);
      toast({
        title: 'Test Send Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsTestingSend(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const result = await testConnection();
      
      if (result) {
        toast({
          title: 'Connection Test Passed!',
          description: 'WhatsApp connection is working properly',
        });
      } else {
        toast({
          title: 'Connection Test Failed',
          description: 'WhatsApp connection is not working',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: 'Connection Test Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleResetSession = async () => {
    try {
      await resetSession();
      toast({
        title: 'Session Reset',
        description: 'WhatsApp session has been reset. Please scan the QR code again.',
      });
    } catch (error) {
      console.error('Session reset failed:', error);
      toast({
        title: 'Reset Failed',
        description: error instanceof Error ? error.message : 'Failed to reset session',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'connecting':
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Connecting</Badge>;
      case 'disconnected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Disconnected</Badge>;
      case 'qr_pending':
        return <Badge variant="outline"><QrCode className="w-3 h-3 mr-1" />QR Pending</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Unknown</Badge>;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-500';
      case 'warn':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      case 'debug':
        return 'text-gray-500';
      default:
        return 'text-gray-700';
    }
  };

  const exportLogs = () => {
    const logData = JSON.stringify(logs, null, 2);
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp-logs-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Logs Exported',
      description: 'WhatsApp logs have been downloaded',
    });
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          WhatsApp Debug Panel
        </CardTitle>
        <CardDescription>
          Monitor WhatsApp connection, test messaging, and view logs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="test">Test Message</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="logs">Backend Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Connection Status</Label>
                  {getStatusBadge(session?.status || 'disconnected')}
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Is Connected</Label>
                  <Badge variant={isConnected ? "default" : "secondary"}>
                    {isConnected ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Loading</Label>
                  <Badge variant={isLoading ? "secondary" : "outline"}>
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Ready'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                {session?.sessionData && (
                  <>
                    <div>
                      <Label className="text-sm font-medium">Connected Device</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        <div>Phone: {session.sessionData.phone}</div>
                        <div>Name: {session.sessionData.name}</div>
                        <div>Device: {session.sessionData.deviceId}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button 
                onClick={handleTestConnection} 
                disabled={isTestingConnection}
                variant="outline"
              >
                {isTestingConnection ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </Button>
              
              <Button 
                onClick={handleResetSession} 
                variant="destructive"
                disabled={isLoading}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Session
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4">
            <div className="text-center space-y-4">
              {session?.qrCode ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Scan this QR code with WhatsApp</Label>
                  <div className="flex justify-center">
                    <img 
                      src={session.qrCode} 
                      alt="WhatsApp QR Code" 
                      className="border rounded-lg max-w-sm"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    QR code refreshes automatically every 45 seconds
                  </p>
                </div>
              ) : isConnected ? (
                <div className="space-y-2">
                  <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                  <h3 className="text-lg font-medium">WhatsApp Connected!</h3>
                  <p className="text-sm text-muted-foreground">
                    Connected to: {session?.sessionData?.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Loader2 className="w-16 h-16 mx-auto animate-spin text-muted-foreground" />
                  <h3 className="text-lg font-medium">Generating QR Code...</h3>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we initialize the WhatsApp connection
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testPhone">Test Phone Number</Label>
                <Input
                  id="testPhone"
                  placeholder="Enter phone number (e.g., +919876543210)"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="testMessage">Test Message</Label>
                <Input
                  id="testMessage"
                  placeholder="Enter test message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleTestSend} 
                disabled={!isConnected || isTestingSend || !testPhoneNumber.trim()}
                className="w-full"
              >
                {isTestingSend ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Test Message
              </Button>

              {!isConnected && (
                <p className="text-sm text-amber-600">
                  ⚠️ WhatsApp must be connected to send test messages
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Recent Messages</Label>
              <Button variant="outline" size="sm" onClick={refreshLogs}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            <ScrollArea className="h-64 border rounded-md p-3">
              {logs.length > 0 ? (
                <div className="space-y-2">
                  {logs.slice(0, 10).map((log, index) => (
                    <div key={index} className="text-sm space-y-1 p-2 bg-muted rounded">
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${getLogLevelColor(log.status)}`}>
                          {log.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                        </span>
                      </div>
                      <div>{log.message}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No WhatsApp messages logged yet
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Backend Logs</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportLogs}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={refreshLogs}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-96 border rounded-md p-3">
              {logs.length > 0 ? (
                <div className="space-y-2">
                  {logs.slice(0, 50).map((log, index) => (
                    <div key={index} className="text-sm space-y-1 p-2 bg-muted rounded">
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${getLogLevelColor(log.status)}`}>
                          {log.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                        </span>
                      </div>
                      <div>{log.message}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No logs available
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
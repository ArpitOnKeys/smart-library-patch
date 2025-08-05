import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bug, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Phone,
  RefreshCw,
  Download,
  Trash2,
  TestTube
} from 'lucide-react';
import { useWhatsAppService } from '@/hooks/useWhatsAppService';
import { logger, LogEntry } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';

export const WhatsAppDebugPanel = () => {
  const [testPhone, setTestPhone] = useState('+91-98765-43210');
  const [testMessage, setTestMessage] = useState('🤖 Test message from PATCH Library Management System');
  const [logs, setLogs] = useState<LogEntry[]>(() => logger.getRecentLogs(100));
  const { toast } = useToast();
  
  const {
    session,
    status,
    isConnected,
    isConnecting,
    isLoading,
    logs: whatsappLogs,
    backendLogs,
    testConnection,
    resetSession,
    sendMessage,
    refreshLogs
  } = useWhatsAppService();

  const refreshSystemLogs = () => {
    setLogs(logger.getRecentLogs(100));
    toast({
      title: "Logs Refreshed",
      description: "Loaded latest log entries",
    });
  };

  const clearLogs = () => {
    logger.clearLogs();
    setLogs([]);
    toast({
      title: "Logs Cleared",
      description: "All logs have been cleared",
    });
  };

  const exportLogs = () => {
    const logsData = logger.exportLogs();
    const blob = new Blob([logsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Logs Exported",
      description: "Logs have been downloaded as JSON file",
    });
  };

  const sendTestMessage = async () => {
    if (!testPhone || !testMessage) {
      toast({
        title: "Missing Information",
        description: "Please enter both phone number and message",
        variant: "destructive",
      });
      return;
    }

    await sendMessage({
      phone: testPhone,
      message: testMessage,
      studentId: 'debug-test',
      studentName: 'Debug Test'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Connected
        </Badge>;
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Connecting
        </Badge>;
      case 'disconnected':
        return <Badge variant="outline" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Disconnected
        </Badge>;
      case 'error':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Error
        </Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warn': return 'text-yellow-600';
      case 'debug': return 'text-gray-500';
      default: return 'text-blue-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          WhatsApp Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="test">Test</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="logs">Backend Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Connection Status</Label>
                {getStatusBadge(session?.status || 'disconnected')}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Session ID</Label>
                <p className="text-sm text-muted-foreground font-mono">
                  {session?.id?.slice(0, 8) || 'None'}
                </p>
              </div>

              {session?.sessionData && (
                <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Connected Phone</Label>
                <p className="text-sm text-muted-foreground">
                  +{status.connectedDevice?.phone || session.sessionData?.phone}
                </p>
              </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Connected At</Label>
                    <p className="text-sm text-muted-foreground">
                      {session.connectedAt ? new Date(session.connectedAt).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={testConnection} 
                disabled={!isConnected || isLoading}
                variant="outline"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
              
              <Button 
                onClick={resetSession} 
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Session
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4">
            <div className="text-center space-y-4">
              {status.qrCode ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img 
                      src={status.qrCode} 
                      alt="WhatsApp QR Code" 
                      className="border rounded-lg"
                      style={{ maxWidth: '256px', maxHeight: '256px' }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Scan this QR code with your WhatsApp to connect
                  </p>
                  <div className="flex justify-center">
                    <Button onClick={resetSession} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate New QR
                    </Button>
                  </div>
                </div>
              ) : isConnected ? (
                <div className="space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  <p className="text-lg font-medium">WhatsApp Connected!</p>
                  <p className="text-sm text-muted-foreground">
                    Connected to: +{status.connectedDevice?.phone}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Phone className="h-16 w-16 text-gray-400 mx-auto" />
                  <p className="text-lg font-medium">Not Connected</p>
                  <p className="text-sm text-muted-foreground">
                    Generate a QR code to connect your WhatsApp
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Test Phone Number</Label>
                <Input
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+91-98765-43210"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Test Message</Label>
                <Textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Enter test message..."
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={sendTestMessage} 
                disabled={!isConnected || isLoading}
                className="w-full"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {isLoading ? 'Sending...' : 'Send Test Message'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Message History ({whatsappLogs.length})</h4>
            </div>
            
            <ScrollArea className="h-[300px] w-full border rounded-md p-4">
              {whatsappLogs.length === 0 ? (
                <p className="text-center text-muted-foreground">No messages sent yet</p>
              ) : (
                <div className="space-y-3">
                  {whatsappLogs.map((log) => (
                    <div key={log.id} className="border-b pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{log.studentName}</span>
                          <Badge 
                            variant={log.status === 'sent' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {log.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        To: {log.phoneNumber}
                      </p>
                      <p className="text-sm mt-1 line-clamp-2">{log.message}</p>
                      {log.status === 'failed' && (
                        <p className="text-xs text-red-600 mt-1">
                          Error: {(log as any).errorMessage}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Backend Logs ({backendLogs.length})</h4>
              <div className="flex gap-2">
                <Button onClick={() => { refreshLogs(); refreshSystemLogs(); }} size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={exportLogs} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={clearLogs} size="sm" variant="outline">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-[300px] w-full border rounded-md p-4">
              {backendLogs.length === 0 ? (
                <p className="text-center text-muted-foreground">No backend logs available</p>
              ) : (
                <div className="space-y-2">
                  {backendLogs.map((log, index) => (
                    <div key={index} className="text-xs font-mono border-b pb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`font-medium ${getLogLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-1">{log.message}</p>
                      {log.data && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-gray-500">Show data</summary>
                          <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
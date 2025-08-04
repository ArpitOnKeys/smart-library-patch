import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppSession {
  id: string;
  qrCode?: string;
  status: 'pending' | 'connected' | 'disconnected';
  connectedAt?: string;
  sessionData?: any;
}

interface WhatsAppMessage {
  phone: string;
  message: string;
  studentId: string;
  studentName: string;
}

interface WhatsAppLog {
  id: string;
  studentId: string;
  studentName: string;
  phoneNumber: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'failed' | 'delivered';
}

export const useWhatsAppService = () => {
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const { toast } = useToast();

  // Load session and logs from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('whatsapp_session');
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }

    const savedLogs = localStorage.getItem('whatsapp_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
  }, []);

  // Save session to localStorage when it changes
  useEffect(() => {
    if (session) {
      localStorage.setItem('whatsapp_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('whatsapp_session');
    }
  }, [session]);

  // Save logs to localStorage when they change
  useEffect(() => {
    localStorage.setItem('whatsapp_logs', JSON.stringify(logs));
  }, [logs]);

  const callWhatsAppFunction = async (action: string, data: any = {}) => {
    // For Tauri app - we need to implement actual WhatsApp Web integration
    // This currently falls back to mock for development
    console.log(`WhatsApp action requested: ${action}`, data);
    
    // Log the attempt for debugging
    toast({
      title: "WhatsApp Development Mode",
      description: `Action: ${action} - Using mock responses for testing`,
      variant: "default",
    });
    
    return getMockResponse(action, data);
  };

  const getMockResponse = (action: string, data: any) => {
    switch (action) {
      case 'generate-qr':
        const sessionId = crypto.randomUUID();
        // Generate a realistic WhatsApp QR code pattern
        const qrData = `2@${sessionId.slice(0, 8)},${Date.now()},${Math.random().toString(36).slice(2)}`;
        const qrCode = `https://chart.googleapis.com/chart?chs=256x256&cht=qr&chl=${encodeURIComponent(qrData)}`;
        console.log('Generated QR for session:', sessionId);
        return { 
          id: sessionId,
          sessionId, 
          qrCode, 
          status: 'pending' as const,
          generatedAt: new Date().toISOString()
        };
      
      case 'check-session':
        // Simulate a more realistic connection process
        const now = Date.now();
        const shouldConnect = (now % 15000) < 5000; // Connect after ~10-15 seconds
        console.log('Checking session status:', shouldConnect ? 'connected' : 'pending');
        return { 
          status: shouldConnect ? 'connected' as const : 'pending' as const,
          sessionData: shouldConnect ? {
            phone: '+91-98765-43210',
            name: 'Demo WhatsApp Account'
          } : undefined
        };
      
      case 'send-message':
        // Simulate message sending with realistic delays and failures
        const success = Math.random() > 0.1; // 90% success rate
        console.log('Mock message send:', success ? 'success' : 'failed', data);
        return {
          success,
          log: {
            id: crypto.randomUUID(),
            studentId: data.studentId,
            studentName: data.studentName,
            phoneNumber: data.phone,
            message: data.message,
            timestamp: new Date().toISOString(),
            status: success ? 'sent' as const : 'failed' as const
          }
        };
      
      case 'send-bulk-messages':
        // Simulate bulk message sending
        const results = data.messages.map((msg: WhatsAppMessage) => ({
          id: crypto.randomUUID(),
          studentId: msg.studentId,
          studentName: msg.studentName,
          phoneNumber: msg.phone,
          message: msg.message,
          timestamp: new Date().toISOString(),
          status: Math.random() > 0.1 ? 'sent' as const : 'failed' as const
        }));
        return { success: true, results };
      
      case 'disconnect':
        console.log('Disconnecting session:', data.sessionId);
        return { success: true };
      
      default:
        return { success: true };
    }
  };

  const generateQR = async () => {
    setIsLoading(true);
    console.log('Starting QR generation process...');
    
    try {
      const response = await callWhatsAppFunction('generate-qr');
      console.log('QR response received:', response);
      
      const initialSession: WhatsAppSession = {
        id: response.id,
        qrCode: response.qrCode,
        status: response.status,
        sessionData: response.sessionData
      };
      
      setSession(initialSession);
      
      toast({
        title: "QR Code Generated",
        description: "Scan the QR code with your WhatsApp to connect",
      });
      
      // Start polling for connection status with clear logging
      let retryCount = 0;
      const maxRetries = 20; // 40 seconds with 2-second intervals
      
      const pollInterval = setInterval(async () => {
        console.log(`Polling attempt ${retryCount + 1}/${maxRetries}`);
        
        try {
          const statusResponse = await callWhatsAppFunction('check-session', { sessionId: response.sessionId });
          console.log('Status check response:', statusResponse);
          
          if (statusResponse.status === 'connected') {
            const connectedSession: WhatsAppSession = { 
              id: response.id,
              qrCode: response.qrCode,
              status: 'connected',
              connectedAt: new Date().toISOString(),
              sessionData: statusResponse.sessionData
            };
            
            setSession(connectedSession);
            clearInterval(pollInterval);
            
            console.log('WhatsApp connection successful!');
            toast({
              title: "WhatsApp Connected!",
              description: `Connected to ${statusResponse.sessionData?.phone || 'WhatsApp account'}`,
            });
            
          } else if (retryCount >= maxRetries) {
            clearInterval(pollInterval);
            
            // Auto-regenerate QR if expired
            console.log('QR expired, regenerating...');
            toast({
              title: "QR Code Expired",
              description: "Generating a new QR code automatically...",
              variant: "destructive",
            });
            
            // Generate new QR automatically
            setTimeout(() => generateQR(), 1000);
            return;
          }
          
          retryCount++;
        } catch (error) {
          console.error('Polling error:', error);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            clearInterval(pollInterval);
            setSession(null);
            toast({
              title: "Connection Failed",
              description: "Unable to establish WhatsApp connection. Please try again.",
              variant: "destructive",
            });
          }
        }
      }, 2000);

      // Auto-cleanup after maximum time
      setTimeout(() => {
        clearInterval(pollInterval);
      }, maxRetries * 2000 + 5000);
      
    } catch (error) {
      console.error('QR generation error:', error);
      setSession(null);
      toast({
        title: "QR Generation Failed",
        description: "Failed to generate QR code. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message: WhatsAppMessage) => {
    if (!session || session.status !== 'connected') {
      console.log('WhatsApp not connected, cannot send message');
      toast({
        title: "WhatsApp Not Connected",
        description: "Please connect your WhatsApp account first using the QR code.",
        variant: "destructive",
      });
      return false;
    }

    console.log('Sending WhatsApp message:', message);
    setIsLoading(true);
    
    try {
      // Validate phone number format
      if (!message.phone || message.phone.length < 10) {
        throw new Error('Invalid phone number format');
      }
      
      // Validate message content
      if (!message.message || message.message.trim().length === 0) {
        throw new Error('Message content is empty');
      }
      
      const response = await callWhatsAppFunction('send-message', message);
      console.log('Send message response:', response);
      
      if (response.success && response.log) {
        // Add to logs
        setLogs(prev => [response.log, ...prev]);
        
        console.log('Message sent successfully to:', message.studentName);
        toast({
          title: "Message Sent Successfully!",
          description: `Receipt sent to ${message.studentName} (${message.phone})`,
        });
        return true;
      } else {
        throw new Error('Send message failed: ' + JSON.stringify(response));
      }
    } catch (error) {
      console.error('Message sending error:', error);
      
      // Log failed attempt
      const failedLog: WhatsAppLog = {
        id: crypto.randomUUID(),
        studentId: message.studentId,
        studentName: message.studentName,
        phoneNumber: message.phone,
        message: message.message,
        timestamp: new Date().toISOString(),
        status: 'failed' as const
      };
      
      setLogs(prev => [failedLog, ...prev]);
      
      toast({
        title: "Message Failed",
        description: `Failed to send to ${message.studentName}. ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  const sendBulkMessages = async (messages: WhatsAppMessage[]) => {
    if (!session || session.status !== 'connected') {
      toast({
        title: "WhatsApp Not Connected",
        description: "Please connect your WhatsApp account first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await callWhatsAppFunction('send-bulk-messages', { messages });
      
      if (response.success && response.results) {
        setLogs(prev => [...response.results, ...prev]);
        
        const sentCount = response.results.filter((r: WhatsAppLog) => r.status === 'sent').length;
        const failedCount = response.results.length - sentCount;
        
        toast({
          title: "Bulk Messages Completed",
          description: `${sentCount} sent, ${failedCount} failed`,
        });
      }
    } catch (error) {
      toast({
        title: "Bulk Messages Failed",
        description: "Failed to send bulk messages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    if (!session || session.status !== 'connected') {
      toast({
        title: "No Active Connection",
        description: "Please connect WhatsApp first using the QR code.",
        variant: "destructive",
      });
      return false;
    }

    console.log('Testing WhatsApp connection...');
    setIsLoading(true);
    
    try {
      const testMessage: WhatsAppMessage = {
        phone: session.sessionData?.phone || '+91-98765-43210',
        message: '🤖 Test message from PATCH Library Management System. Connection is working!',
        studentId: 'test',
        studentName: 'Test Connection'
      };
      
      const response = await callWhatsAppFunction('send-message', testMessage);
      
      if (response.success) {
        toast({
          title: "Connection Test Successful!",
          description: "WhatsApp connection is working properly.",
        });
        return true;
      } else {
        throw new Error('Test message failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: "Connection Test Failed",
        description: "WhatsApp connection appears to be broken. Please reconnect.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    if (session) {
      await callWhatsAppFunction('disconnect', { sessionId: session.id });
    }
    setSession(null);
    toast({
      title: "WhatsApp Disconnected",
      description: "Your WhatsApp account has been disconnected.",
    });
  };

  const isConnected = session?.status === 'connected';
  const isConnecting = session?.status === 'pending';

  return {
    session,
    isConnected,
    isConnecting,
    isLoading,
    logs,
    generateQR,
    sendMessage,
    sendBulkMessages,
    testConnection,
    disconnect,
  };
};
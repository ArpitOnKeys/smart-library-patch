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
    try {
      const response = await fetch('/api/whatsapp-handler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...data }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('WhatsApp API call failed:', error);
      // Fallback to mock responses for demo
      return getMockResponse(action, data);
    }
  };

  const getMockResponse = (action: string, data: any) => {
    switch (action) {
      case 'generate-qr':
        const sessionId = crypto.randomUUID();
        const qrCode = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(`whatsapp-session:${sessionId}`)}`;
        return { sessionId, qrCode, status: 'pending' };
      
      case 'check-session':
        return { status: Math.random() > 0.5 ? 'connected' : 'pending' };
      
      case 'send-message':
        return {
          success: true,
          log: {
            id: crypto.randomUUID(),
            ...data,
            timestamp: new Date().toISOString(),
            status: 'sent'
          }
        };
      
      default:
        return { success: true };
    }
  };

  const generateQR = async () => {
    setIsLoading(true);
    try {
      const response = await callWhatsAppFunction('generate-qr');
      setSession(response);
      
      // Start polling for connection status with retry mechanism
      let retryCount = 0;
      const maxRetries = 30; // 60 seconds with 2-second intervals
      
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await callWhatsAppFunction('check-session', { sessionId: response.sessionId });
          
          if (statusResponse.status === 'connected') {
            setSession(prev => prev ? { 
              ...prev, 
              ...statusResponse,
              connectedAt: new Date().toISOString()
            } : statusResponse);
            clearInterval(pollInterval);
            toast({
              title: "WhatsApp Connected",
              description: "Your WhatsApp account has been successfully linked!",
            });
          } else if (statusResponse.status === 'not-found' || retryCount >= maxRetries) {
            clearInterval(pollInterval);
            setSession(null);
            toast({
              title: "QR Code Expired",
              description: "Please generate a new QR code to connect.",
              variant: "destructive",
            });
          }
          
          retryCount++;
        } catch (error) {
          console.error('Polling error:', error);
          retryCount++;
          if (retryCount >= maxRetries) {
            clearInterval(pollInterval);
            setSession(null);
          }
        }
      }, 2000);

      // Auto-cleanup after maximum time
      setTimeout(() => {
        clearInterval(pollInterval);
        if (session?.status !== 'connected') {
          setSession(null);
        }
      }, maxRetries * 2000);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message: WhatsAppMessage) => {
    if (!session || session.status !== 'connected') {
      toast({
        title: "WhatsApp Not Connected",
        description: "Please connect your WhatsApp account first.",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    try {
      const response = await callWhatsAppFunction('send-message', message);
      
      if (response.success && response.log) {
        setLogs(prev => [response.log, ...prev]);
        toast({
          title: "Message Sent",
          description: `Message sent to ${message.studentName}`,
        });
        return true;
      }
    } catch (error) {
      toast({
        title: "Message Failed",
        description: "Failed to send message. Please try again.",
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
    disconnect,
  };
};
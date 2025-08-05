import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { whatsappClient, WhatsAppSession, WhatsAppMessage, WhatsAppLog } from '@/utils/whatsappClient';
import { logger } from '@/utils/logger';

export const useWhatsAppService = () => {
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const { toast } = useToast();

  // Initialize session from client on mount
  useEffect(() => {
    const currentSession = whatsappClient.getSession();
    setSession(currentSession);
    
    // Load logs from localStorage
    const savedLogs = localStorage.getItem('whatsapp_logs_v2');
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (error) {
        logger.error('whatsapp', 'Failed to load logs from storage', error);
      }
    }

    logger.info('whatsapp', 'WhatsApp service initialized', { 
      hasSession: !!currentSession,
      sessionStatus: currentSession?.status 
    });
  }, []);

  // Save logs to localStorage when they change
  useEffect(() => {
    if (logs.length > 0) {
      try {
        localStorage.setItem('whatsapp_logs_v2', JSON.stringify(logs));
      } catch (error) {
        logger.error('whatsapp', 'Failed to save logs to storage', error);
      }
    }
  }, [logs]);

  // Update session state when client session changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentSession = whatsappClient.getSession();
      setSession(prevSession => {
        if (JSON.stringify(prevSession) !== JSON.stringify(currentSession)) {
          return currentSession;
        }
        return prevSession;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // No longer needed - using whatsappClient directly

  const generateQR = async () => {
    setIsLoading(true);
    logger.info('whatsapp', 'Starting QR generation process');
    
    try {
      const newSession = await whatsappClient.generateQR();
      setSession(newSession);
      
      toast({
        title: "QR Code Generated",
        description: "Scan the QR code with your WhatsApp to connect",
      });
      
      logger.info('whatsapp', 'QR generation successful', { sessionId: newSession.id });
      
    } catch (error) {
      logger.error('whatsapp', 'QR generation failed', error);
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
    if (!whatsappClient.isConnected()) {
      logger.warn('whatsapp', 'Attempted to send message without connection', { student: message.studentName });
      toast({
        title: "WhatsApp Not Connected",
        description: "Please connect your WhatsApp account first using the QR code.",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    
    try {
      const result = await whatsappClient.sendMessage(message);
      
      // Add to logs
      setLogs(prev => [result.log, ...prev]);
      
      if (result.success) {
        toast({
          title: "Message Sent Successfully!",
          description: `Message sent to ${message.studentName} (${message.phone})`,
        });
        return true;
      } else {
        toast({
          title: "Message Failed",
          description: `Failed to send to ${message.studentName}. ${result.log.errorMessage}`,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      logger.error('whatsapp', 'Unexpected error during message send', error);
      toast({
        title: "Message Failed",
        description: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendBulkMessages = async (messages: WhatsAppMessage[]) => {
    if (!whatsappClient.isConnected()) {
      toast({
        title: "WhatsApp Not Connected",
        description: "Please connect your WhatsApp account first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await whatsappClient.sendBulkMessages(messages);
      
      if (result.success && result.results) {
        setLogs(prev => [...result.results, ...prev]);
        
        const sentCount = result.results.filter((r: WhatsAppLog) => r.status === 'sent').length;
        const failedCount = result.results.length - sentCount;
        
        toast({
          title: "Bulk Messages Completed",
          description: `${sentCount} sent, ${failedCount} failed`,
        });
      }
    } catch (error) {
      logger.error('whatsapp', 'Bulk message sending failed', error);
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
    if (!whatsappClient.isConnected()) {
      toast({
        title: "No Active Connection",
        description: "Please connect WhatsApp first using the QR code.",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    
    try {
      const success = await whatsappClient.testConnection();
      
      if (success) {
        toast({
          title: "Connection Test Successful!",
          description: "WhatsApp connection is working properly.",
        });
        return true;
      } else {
        toast({
          title: "Connection Test Failed",
          description: "WhatsApp connection appears to be broken. Please reconnect.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      logger.error('whatsapp', 'Connection test error', error);
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
    whatsappClient.disconnect();
    setSession(null);
    toast({
      title: "WhatsApp Disconnected",
      description: "Your WhatsApp account has been disconnected.",
    });
  };

  const resetSession = async () => {
    whatsappClient.resetSession();
    setSession(null);
    setLogs([]);
    toast({
      title: "Session Reset",
      description: "WhatsApp session has been reset. You can now reconnect.",
    });
  };

  const isConnected = whatsappClient.isConnected();
  const isConnecting = whatsappClient.isConnecting();

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
    resetSession,
  };
};
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { whatsappDesktop, WhatsAppMessage, WhatsAppLog, WhatsAppSession } from '@/utils/whatsappDesktop';

export interface UseWhatsAppDesktopService {
  // Session state
  session: WhatsAppSession | null;
  isConnected: boolean;
  isConnecting: boolean;
  isLoading: boolean;
  
  // Logs
  logs: WhatsAppLog[];
  
  // Core functions
  connectDesktop: () => Promise<WhatsAppSession>;
  sendMessage: (message: WhatsAppMessage) => Promise<boolean>;
  sendBulkMessages: (messages: WhatsAppMessage[]) => Promise<{ success: boolean; results: WhatsAppLog[] }>;
  testConnection: () => Promise<boolean>;
  disconnect: () => void;
  resetSession: () => void;
  refreshLogs: () => void;
  clearLogs: () => void;
}

export const useWhatsAppDesktopService = (): UseWhatsAppDesktopService => {
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load initial state
  useEffect(() => {
    const currentSession = whatsappDesktop.getSession();
    const currentLogs = whatsappDesktop.getLogs();
    
    setSession(currentSession);
    setLogs(currentLogs);
  }, []);

  // Refresh session and logs periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const currentSession = whatsappDesktop.getSession();
      const currentLogs = whatsappDesktop.getLogs();
      
      setSession(currentSession);
      setLogs(currentLogs);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const connectDesktop = useCallback(async (): Promise<WhatsAppSession> => {
    setIsLoading(true);
    try {
      const newSession = await whatsappDesktop.connectDesktop();
      setSession(newSession);
      
      toast({
        title: "WhatsApp Desktop Connected",
        description: "Successfully connected to WhatsApp Desktop",
      });
      
      return newSession;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to WhatsApp Desktop';
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const sendMessage = useCallback(async (message: WhatsAppMessage): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await whatsappDesktop.sendMessage(message);
      
      // Refresh logs after sending
      const updatedLogs = whatsappDesktop.getLogs();
      setLogs(updatedLogs);
      
      if (result.success) {
        toast({
          title: "Message Opened",
          description: `WhatsApp opened for ${message.studentName}`,
        });
      } else {
        toast({
          title: "Message Failed",
          description: result.log.errorMessage || `Failed to send message to ${message.studentName}`,
          variant: "destructive",
        });
      }
      
      return result.success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const sendBulkMessages = useCallback(async (messages: WhatsAppMessage[]): Promise<{ success: boolean; results: WhatsAppLog[] }> => {
    setIsLoading(true);
    try {
      const result = await whatsappDesktop.sendBulkMessages(messages);
      
      // Refresh logs after bulk sending
      const updatedLogs = whatsappDesktop.getLogs();
      setLogs(updatedLogs);
      
      const successCount = result.results.filter(log => log.status === 'opened').length;
      const failedCount = result.results.length - successCount;
      
      if (successCount > 0) {
        toast({
          title: "Bulk Messages Processed",
          description: `${successCount} messages opened successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
        });
      } else {
        toast({
          title: "Bulk Messages Failed",
          description: "No messages were sent successfully",
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bulk send failed';
      
      toast({
        title: "Bulk Send Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { success: false, results: [] };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const testConnection = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await whatsappDesktop.testConnection();
      
      if (success) {
        toast({
          title: "Connection Test Successful",
          description: "WhatsApp Desktop opened successfully",
        });
      } else {
        toast({
          title: "Connection Test Failed",
          description: "Could not open WhatsApp Desktop",
          variant: "destructive",
        });
      }
      
      // Refresh session after test
      const updatedSession = whatsappDesktop.getSession();
      setSession(updatedSession);
      
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      
      toast({
        title: "Test Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const disconnect = useCallback((): void => {
    whatsappDesktop.disconnect();
    const updatedSession = whatsappDesktop.getSession();
    setSession(updatedSession);
    
    toast({
      title: "Disconnected",
      description: "WhatsApp Desktop has been disconnected",
    });
  }, [toast]);

  const resetSession = useCallback((): void => {
    whatsappDesktop.resetSession();
    setSession(null);
    
    toast({
      title: "Session Reset",
      description: "WhatsApp session has been reset",
    });
  }, [toast]);

  const refreshLogs = useCallback((): void => {
    const currentLogs = whatsappDesktop.getLogs();
    setLogs(currentLogs);
  }, []);

  const clearLogs = useCallback((): void => {
    whatsappDesktop.clearLogs();
    setLogs([]);
    
    toast({
      title: "Logs Cleared",
      description: "All WhatsApp logs have been cleared",
    });
  }, [toast]);

  const isConnected = whatsappDesktop.isConnected();
  const isConnecting = whatsappDesktop.isConnecting();

  return {
    // Session state
    session,
    isConnected,
    isConnecting,
    isLoading,
    
    // Logs
    logs,
    
    // Core functions
    connectDesktop,
    sendMessage,
    sendBulkMessages,
    testConnection,
    disconnect,
    resetSession,
    refreshLogs,
    clearLogs,
  };
};
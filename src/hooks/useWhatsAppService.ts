import { useState, useEffect, useCallback } from 'react';
import { whatsappBridge, WhatsAppStatus, WhatsAppDevice, SendMessageRequest, SendMessageResult, WhatsAppLogEntry } from '@/utils/whatsappBridge';
import { useToast } from '@/hooks/use-toast';

export interface WhatsAppMessage {
  phone: string;
  message: string;
  studentId: string;
  studentName: string;
  attachment?: File;
}

export interface WhatsAppLog {
  id: string;
  studentId: string;
  studentName: string;
  phoneNumber: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'failed' | 'delivered' | 'pending';
  errorMessage?: string;
}

export const useWhatsAppService = () => {
  const [status, setStatus] = useState<WhatsAppStatus>({
    isReady: false,
    connectedDevice: null,
    qrCode: null
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [backendLogs, setBackendLogs] = useState<WhatsAppLogEntry[]>([]);
  const { toast } = useToast();

  // Initialize WhatsApp backend
  useEffect(() => {
    const initializeBackend = async () => {
      try {
        await whatsappBridge.start();
        
        // Set up event handlers
        whatsappBridge.on('qr_generated', (data) => {
          setStatus(prev => ({ ...prev, qrCode: data.qrCode }));
          toast({
            title: "QR Code Generated",
            description: "Scan the QR code with your WhatsApp to connect",
          });
        });

        whatsappBridge.on('client_ready', (device: WhatsAppDevice) => {
          setStatus(prev => ({ 
            ...prev, 
            isReady: true, 
            connectedDevice: device,
            qrCode: null 
          }));
          setIsConnecting(false);
          toast({
            title: "WhatsApp Connected!",
            description: `Connected to +${device.phone}`,
          });
        });

        whatsappBridge.on('auth_failure', (data) => {
          setIsConnecting(false);
          toast({
            title: "Authentication Failed",
            description: data.message || "Failed to authenticate with WhatsApp",
            variant: "destructive",
          });
        });

        whatsappBridge.on('disconnected', (data) => {
          setStatus({
            isReady: false,
            connectedDevice: null,
            qrCode: null
          });
          toast({
            title: "WhatsApp Disconnected",
            description: data.reason || "Connection lost",
            variant: "destructive",
          });
        });

        // Get initial status
        const initialStatus = await whatsappBridge.getStatus();
        setStatus(initialStatus);
        
      } catch (error) {
        console.error('Failed to initialize WhatsApp backend:', error);
        toast({
          title: "Backend Error",
          description: "Failed to start WhatsApp backend",
          variant: "destructive",
        });
      }
    };

    initializeBackend();

    return () => {
      whatsappBridge.stop();
    };
  }, [toast]);

  const isConnected = status.isReady && !!status.connectedDevice;

  const generateQR = useCallback(async () => {
    try {
      setIsConnecting(true);
      await whatsappBridge.resetSession();
      
      // Wait for QR generation (handled by event listener)
      toast({
        title: "Generating QR Code",
        description: "Please wait while we generate your QR code...",
      });
      
    } catch (error) {
      setIsConnecting(false);
      toast({
        title: "QR Generation Failed",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const sendMessage = useCallback(async (message: WhatsAppMessage, attachmentPath?: string): Promise<boolean> => {
    setIsLoading(true);
    
    const messageLog: WhatsAppLog = {
      id: crypto.randomUUID(),
      studentId: message.studentId,
      studentName: message.studentName,
      phoneNumber: message.phone,
      message: message.message,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    setLogs(prev => [messageLog, ...prev.slice(0, 49)]);
    
    try {
      if (!isConnected) {
        throw new Error('WhatsApp not connected');
      }

      const request: SendMessageRequest = {
        id: messageLog.id,
        phoneNumber: message.phone,
        message: message.message,
        attachmentPath
      };

      const result = await whatsappBridge.sendMessage(request);
      
      // Update log status
      const updatedLog: WhatsAppLog = {
        ...messageLog,
        status: result.success ? 'sent' : 'failed',
        errorMessage: result.error
      };
      
      setLogs(prev => prev.map(log => 
        log.id === messageLog.id ? updatedLog : log
      ));
      
      if (result.success) {
        toast({
          title: "Message Sent",
          description: `Successfully sent to ${message.studentName}`,
        });
        return true;
      } else {
        toast({
          title: "Message Failed",
          description: result.error || "Failed to send message",
          variant: "destructive",
        });
        return false;
      }
      
    } catch (error) {
      const errorLog: WhatsAppLog = {
        ...messageLog,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setLogs(prev => prev.map(log => 
        log.id === messageLog.id ? errorLog : log
      ));
      
      toast({
        title: "Message Failed",
        description: errorLog.errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, toast]);

  const testConnection = useCallback(async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect WhatsApp first",
        variant: "destructive",
      });
      return false;
    }
    
    setIsLoading(true);
    try {
      const result = await whatsappBridge.testConnection();
      
      if (result.success) {
        toast({
          title: "Connection Test Successful",
          description: "WhatsApp connection is working properly",
        });
      } else {
        toast({
          title: "Connection Test Failed",
          description: result.error || "WhatsApp connection seems to be broken",
          variant: "destructive",
        });
      }
      
      return result.success;
    } catch (error) {
      toast({
        title: "Connection Test Error",
        description: "Failed to test connection",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, toast]);

  const resetSession = useCallback(async () => {
    try {
      setIsConnecting(true);
      await whatsappBridge.resetSession();
      setStatus({
        isReady: false,
        connectedDevice: null,
        qrCode: null
      });
      setLogs([]);
      
      toast({
        title: "Session Reset",
        description: "WhatsApp session has been reset. Generate a new QR code to reconnect.",
      });
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "Failed to reset session",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const refreshLogs = useCallback(async () => {
    try {
      const logs = await whatsappBridge.getLogs(100);
      setBackendLogs(logs);
    } catch (error) {
      console.error('Failed to refresh logs:', error);
    }
  }, []);

  // Convert new status format to old session format for compatibility
  const session = {
    id: status.connectedDevice?.phone || null,
    qrCode: status.qrCode,
    status: status.isReady ? 'connected' : (isConnecting ? 'pending' : 'disconnected'),
    connectedAt: status.connectedDevice ? new Date().toISOString() : undefined,
    sessionData: status.connectedDevice ? {
      phone: status.connectedDevice.phone,
      name: status.connectedDevice.pushname,
      deviceId: status.connectedDevice.platform
    } : undefined
  };

  // Placeholder functions for compatibility
  const sendBulkMessages = useCallback(async (messages: WhatsAppMessage[]) => {
    // TODO: Implement bulk messaging with new backend
    console.log('Bulk messaging not yet implemented with new backend');
  }, []);

  const disconnect = useCallback(async () => {
    await resetSession();
  }, [resetSession]);

  return {
    session,
    status,
    isConnected,
    isConnecting,
    isLoading,
    logs,
    backendLogs,
    generateQR,
    sendMessage,
    sendBulkMessages,
    testConnection,
    disconnect,
    resetSession,
    refreshLogs
  };
};
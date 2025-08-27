import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Wifi, WifiOff, Link, Unlink } from 'lucide-react';
import { Student } from '@/types/database';
import { useWhatsAppDesktopService } from '@/hooks/useWhatsAppDesktopService';

interface WhatsAppDesktopIntegrationProps {
  students: Student[];
  selectedStudents?: Student[];
  onSingleMessage?: (student: Student) => void;
}

export const WhatsAppDesktopIntegration = ({ students, selectedStudents = [], onSingleMessage }: WhatsAppDesktopIntegrationProps) => {
  const [customMessage, setCustomMessage] = useState('Hello {name}, this is a message from PATCH Library Management System.');
  const { toast } = useToast();
  
  const {
    session,
    isConnected,
    isLoading,
    connectDesktop,
    sendMessage,
    sendBulkMessages,
    disconnect,
  } = useWhatsAppDesktopService();

  const formatMessage = (template: string, student: Student): string => {
    return template
      .replace(/{name}/g, student.name)
      .replace(/{fatherName}/g, student.fatherName)
      .replace(/{enrollmentNo}/g, student.enrollmentNo)
      .replace(/{contact}/g, student.contact)
      .replace(/{monthlyFees}/g, student.monthlyFees.toString())
      .replace(/{shift}/g, student.shift)
      .replace(/{seatNumber}/g, student.seatNumber);
  };

  const sendWhatsAppMessage = async (student: Student, message: string) => {
    if (!isConnected) {
      toast({
        title: "WhatsApp Not Connected",
        description: "Please connect WhatsApp Desktop first.",
        variant: "destructive",
      });
      return;
    }

    await sendMessage({
      phone: student.contact,
      message,
      studentId: student.id,
      studentName: student.name,
    });

    if (onSingleMessage) {
      onSingleMessage(student);
    }
  };

  const handleConnectWhatsApp = async () => {
    await connectDesktop();
  };

  const sendBulkMessagesHandler = async () => {
    if (!customMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "WhatsApp Not Connected",
        description: "Please connect WhatsApp Desktop first.",
        variant: "destructive",
      });
      return;
    }

    const targetStudents = selectedStudents.length > 0 ? selectedStudents : students;
    
    if (targetStudents.length === 0) {
      toast({
        title: "No Students Selected",
        description: "Please select students to send messages to.",
        variant: "destructive",
      });
      return;
    }

    const messages = targetStudents.map(student => ({
      phone: student.contact,
      message: formatMessage(customMessage, student),
      studentId: student.id,
      studentName: student.name,
    }));

    toast({
      title: "Starting Bulk Send",
      description: `Preparing to send messages to ${messages.length} students...`,
    });

    await sendBulkMessages(messages);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            WhatsApp Desktop Integration
          </div>
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
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {!isConnected ? (
            <Button onClick={handleConnectWhatsApp} disabled={isLoading}>
              <Link className="h-4 w-4 mr-2" />
              Connect WhatsApp Desktop
            </Button>
          ) : (
            <Button variant="outline" onClick={disconnect}>
              <Unlink className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          )}
        </div>

        {isConnected && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message Template</label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-2 border rounded-md"
                rows={3}
                placeholder="Enter message with placeholders: {name}, {enrollmentNo}, etc."
              />
            </div>

            <div className="space-y-2">
              <Button 
                onClick={sendBulkMessagesHandler} 
                disabled={isLoading || !customMessage.trim()}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? 'Sending...' : `Send to ${selectedStudents.length > 0 ? `${selectedStudents.length} Selected` : `All ${students.length} Students`}`}
              </Button>
              
              {isLoading && (
                <div className="text-sm text-muted-foreground text-center">
                  Messages will open in WhatsApp Desktop with 3-second delays between each message.
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
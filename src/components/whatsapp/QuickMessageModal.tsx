import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare, Wifi, WifiOff } from 'lucide-react';
import { Student } from '@/types/database';
import { useWhatsAppService } from '@/hooks/useWhatsAppService';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

interface QuickMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: '1',
    name: 'Fee Reminder',
    content: 'Dear {name}, your monthly fee of ₹{monthlyFees} is due. Please ensure timely payment. - PATCH Library',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Welcome Message',
    content: 'Welcome to PATCH - The Smart Library, {name}! Your enrollment no. is {enrollmentNo}. We look forward to your learning journey.',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Payment Confirmation',
    content: 'Dear {name}, we have received your payment of ₹{monthlyFees}. Thank you for choosing PATCH Library.',
    createdAt: new Date().toISOString()
  }
];

export const QuickMessageModal = ({ open, onOpenChange, student }: QuickMessageModalProps) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const { isConnected, sendMessage } = useWhatsAppService();

  useEffect(() => {
    const saved = localStorage.getItem('whatsapp_templates');
    if (saved) {
      setTemplates(JSON.parse(saved));
    } else {
      setTemplates(DEFAULT_TEMPLATES);
    }
  }, []);

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

  const cleanPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('91')) return cleaned;
    if (cleaned.length === 10) return '91' + cleaned;
    return cleaned;
  };

  const handleSendMessage = async () => {
    if (!student || (!selectedTemplate && !customMessage)) return;

    setIsSending(true);
    
    const messageTemplate = selectedTemplate 
      ? templates.find(t => t.id === selectedTemplate)?.content || ''
      : customMessage;
    
    const formattedMessage = formatMessage(messageTemplate, student);
    const cleanedPhone = cleanPhoneNumber(student.contact);

    const success = await sendMessage({
      phone: cleanedPhone,
      message: formattedMessage,
      studentId: student.id,
      studentName: student.name,
    });

    setIsSending(false);
    
    if (success) {
      onOpenChange(false);
      setSelectedTemplate('');
      setCustomMessage('');
    }
  };

  const getPreviewMessage = (): string => {
    if (!student) return '';
    
    const messageTemplate = selectedTemplate 
      ? templates.find(t => t.id === selectedTemplate)?.content || ''
      : customMessage;
    
    return formatMessage(messageTemplate, student);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send WhatsApp Message
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-2 border rounded-lg">
            <span className="text-sm font-medium">WhatsApp Status:</span>
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

          {/* Student Info */}
          {student && (
            <div className="p-2 bg-muted rounded-lg">
              <p className="font-medium">{student.name}</p>
              <p className="text-sm text-muted-foreground">{student.contact}</p>
            </div>
          )}

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Message Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label>Custom Message (Optional)</Label>
            <Textarea
              placeholder="Enter custom message or use template above..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Message Preview */}
          {student && (selectedTemplate || customMessage) && (
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Message Preview:</Label>
              <p className="mt-1 text-sm whitespace-pre-wrap">{getPreviewMessage()}</p>
            </div>
          )}

          {/* Send Button */}
          <Button 
            onClick={handleSendMessage} 
            disabled={!isConnected || isSending || (!selectedTemplate && !customMessage)}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSending ? 'Sending...' : 'Send Message'}
          </Button>

          {!isConnected && (
            <p className="text-sm text-muted-foreground text-center">
              Please connect your WhatsApp account first in the WhatsApp Integration panel.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
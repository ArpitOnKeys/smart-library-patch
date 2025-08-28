import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Phone, MessageSquare } from 'lucide-react';
import { Student } from '@/types/database';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  message: string;
}

export const WhatsAppModal = ({ isOpen, onClose, student, message }: WhatsAppModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<{ phone: boolean; message: boolean }>({ 
    phone: false, 
    message: false 
  });

  const cleanedPhone = student.contact.replace(/\D/g, '');
  const formattedPhone = cleanedPhone.startsWith('91') ? `+${cleanedPhone}` : `+91${cleanedPhone}`;

  const copyToClipboard = async (text: string, type: 'phone' | 'message') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(prev => ({ ...prev, [type]: true }));
      
      toast({
        title: "Copied!",
        description: `${type === 'phone' ? 'Phone number' : 'Message'} copied to clipboard`,
      });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [type]: false }));
      }, 2000);
      
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const openWhatsAppWeb = () => {
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${cleanedPhone}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send WhatsApp Message
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Copy the details below and send via WhatsApp manually:
          </div>
          
          {/* Student Info */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="font-medium">{student.name}</div>
            <div className="text-sm text-muted-foreground">Seat: {student.seatNumber}</div>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <div className="flex gap-2">
              <Input 
                value={formattedPhone} 
                readOnly 
                className="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(formattedPhone, 'phone')}
              >
                <Copy className={`h-4 w-4 ${copied.phone ? 'text-green-600' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Message
            </Label>
            <div className="space-y-2">
              <Textarea 
                value={message} 
                readOnly 
                rows={4}
                className="resize-none"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(message, 'message')}
                className="w-full"
              >
                <Copy className={`h-4 w-4 mr-2 ${copied.message ? 'text-green-600' : ''}`} />
                {copied.message ? 'Message Copied!' : 'Copy Message'}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              onClick={openWhatsAppWeb} 
              className="w-full"
              variant="default"
            >
              Try WhatsApp Web
            </Button>
            
            <div className="text-xs text-center text-muted-foreground">
              Or manually open WhatsApp and compose the message
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
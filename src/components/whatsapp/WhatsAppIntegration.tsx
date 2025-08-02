import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Clock, CheckCircle, XCircle, Plus, Edit, Trash2, Wifi, WifiOff, QrCode, Link, Unlink } from 'lucide-react';
import { Student } from '@/types/database';
import { useWhatsAppService } from '@/hooks/useWhatsAppService';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: string;
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

interface WhatsAppIntegrationProps {
  students: Student[];
  selectedStudents?: Student[];
  onSingleMessage?: (student: Student) => void;
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

export const WhatsAppIntegration = ({ students, selectedStudents = [], onSingleMessage }: WhatsAppIntegrationProps) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '' });
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const { toast } = useToast();
  
  const {
    session,
    isConnected,
    isConnecting,
    isLoading,
    logs,
    generateQR,
    sendMessage,
    sendBulkMessages,
    disconnect,
  } = useWhatsAppService();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const saved = localStorage.getItem('whatsapp_templates');
    if (saved) {
      setTemplates(JSON.parse(saved));
    } else {
      setTemplates(DEFAULT_TEMPLATES);
      localStorage.setItem('whatsapp_templates', JSON.stringify(DEFAULT_TEMPLATES));
    }
  };


  const saveTemplates = (newTemplates: MessageTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('whatsapp_templates', JSON.stringify(newTemplates));
  };


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

  const sendWhatsAppMessage = async (student: Student, message: string) => {
    if (!isConnected) {
      toast({
        title: "WhatsApp Not Connected",
        description: "Please connect your WhatsApp account first.",
        variant: "destructive",
      });
      return;
    }

    const cleanedPhone = cleanPhoneNumber(student.contact);
    
    const success = await sendMessage({
      phone: cleanedPhone,
      message,
      studentId: student.id,
      studentName: student.name,
    });

    if (success && onSingleMessage) {
      onSingleMessage(student);
    }
  };

  const sendBulkMessagesHandler = async () => {
    if (!selectedTemplate && !customMessage) {
      toast({
        title: "Error",
        description: "Please select a template or enter a custom message",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "WhatsApp Not Connected",
        description: "Please connect your WhatsApp account first.",
        variant: "destructive",
      });
      return;
    }

    const targetStudents = selectedStudents.length > 0 ? selectedStudents : students;
    const messageTemplate = selectedTemplate 
      ? templates.find(t => t.id === selectedTemplate)?.content || ''
      : customMessage;

    const messages = targetStudents.map(student => ({
      phone: cleanPhoneNumber(student.contact),
      message: formatMessage(messageTemplate, student),
      studentId: student.id,
      studentName: student.name,
    }));

    await sendBulkMessages(messages);
  };

  const addTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast({
        title: "Error",
        description: "Please fill in both name and content",
        variant: "destructive",
      });
      return;
    }

    const template: MessageTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      content: newTemplate.content,
      createdAt: new Date().toISOString()
    };

    saveTemplates([...templates, template]);
    setNewTemplate({ name: '', content: '' });
    setShowTemplateDialog(false);
    
    toast({
      title: "Template Added",
      description: "New message template created successfully",
    });
  };

  const updateTemplate = () => {
    if (!editingTemplate || !newTemplate.name || !newTemplate.content) return;

    const updatedTemplates = templates.map(t => 
      t.id === editingTemplate.id 
        ? { ...t, name: newTemplate.name, content: newTemplate.content }
        : t
    );

    saveTemplates(updatedTemplates);
    setEditingTemplate(null);
    setNewTemplate({ name: '', content: '' });
    setShowTemplateDialog(false);

    toast({
      title: "Template Updated",
      description: "Message template updated successfully",
    });
  };

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    saveTemplates(updatedTemplates);
    
    toast({
      title: "Template Deleted",
      description: "Message template removed successfully",
    });
  };

  const startEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({ name: template.name, content: template.content });
    setShowTemplateDialog(true);
  };

  const getPreviewMessage = (): string => {
    if (!previewStudent) return '';
    
    const messageTemplate = selectedTemplate 
      ? templates.find(t => t.id === selectedTemplate)?.content || ''
      : customMessage;
    
    return formatMessage(messageTemplate, previewStudent);
  };

  const handleConnectWhatsApp = async () => {
    setShowQRDialog(true);
    await generateQR();
  };

  return (
    <div className="space-y-6">
      {/* WhatsApp Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              WhatsApp Integration
            </div>
            <div className="flex items-center gap-2">
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {!isConnected ? (
              <Button onClick={handleConnectWhatsApp} disabled={isLoading}>
                <Link className="h-4 w-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Link WhatsApp Account'}
              </Button>
            ) : (
              <Button variant="outline" onClick={disconnect}>
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect WhatsApp
              </Button>
            )}
          </div>
          
          {session?.sessionData?.phone && (
            <p className="text-sm text-muted-foreground mt-2">
              Connected to: {session.sessionData.phone}
            </p>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect WhatsApp Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            {session?.qrCode ? (
              <>
                <div className="flex justify-center">
                  <img src={session.qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    1. Open WhatsApp on your phone
                  </p>
                  <p className="text-sm text-muted-foreground">
                    2. Go to Settings → Linked Devices
                  </p>
                  <p className="text-sm text-muted-foreground">
                    3. Scan this QR code
                  </p>
                </div>
                {isConnecting && (
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Waiting for connection...</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center gap-2 py-8">
                <Clock className="h-4 w-4 animate-spin" />
                <span>Generating QR code...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Composer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label>Preview Student</Label>
              <Select value={previewStudent?.id || ''} onValueChange={(value) => {
                const student = students.find(s => s.id === value);
                setPreviewStudent(student || null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student for preview" />
                </SelectTrigger>
                <SelectContent>
                  {students.slice(0, 10).map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.enrollmentNo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Custom Message (Optional)</Label>
            <Textarea
              placeholder="Enter custom message or use template above..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Available placeholders: {'{name}'}, {'{fatherName}'}, {'{enrollmentNo}'}, {'{contact}'}, {'{monthlyFees}'}, {'{shift}'}, {'{seatNumber}'}
            </p>
          </div>

          {previewStudent && (selectedTemplate || customMessage) && (
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Message Preview for {previewStudent.name}:</Label>
              <p className="mt-1 text-sm">{getPreviewMessage()}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={sendBulkMessagesHandler} 
              className="flex items-center gap-2"
              disabled={!isConnected || isLoading}
            >
              <Send className="h-4 w-4" />
              {isLoading ? 'Sending...' : `Send to ${selectedStudents.length > 0 ? `${selectedStudents.length} Selected` : 'All Students'}`}
            </Button>
            
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => {
                  setEditingTemplate(null);
                  setNewTemplate({ name: '', content: '' });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Edit Template' : 'Add New Template'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Template Name</Label>
                    <Input
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                    />
                  </div>
                  <div>
                    <Label>Message Content</Label>
                    <Textarea
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter message content with placeholders"
                      rows={4}
                    />
                  </div>
                  <Button onClick={editingTemplate ? updateTemplate : addTemplate} className="w-full">
                    {editingTemplate ? 'Update Template' : 'Add Template'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Message Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Message Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {templates.map((template) => (
              <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{template.name}</h4>
                  <p className="text-sm text-muted-foreground truncate">{template.content}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditTemplate(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Message History */}
      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{log.studentName}</span>
                    <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                      {log.status === 'sent' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                      {log.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{log.phoneNumber}</p>
                  <p className="text-sm truncate">{log.message}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No messages sent yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
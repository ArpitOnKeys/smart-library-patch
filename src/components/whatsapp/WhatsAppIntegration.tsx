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
import { MessageSquare, Send, Clock, CheckCircle, XCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { Student } from '@/types/database';

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
  status: 'sent' | 'failed';
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
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '' });
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
    loadLogs();
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

  const loadLogs = () => {
    const saved = localStorage.getItem('whatsapp_logs');
    if (saved) {
      setLogs(JSON.parse(saved));
    }
  };

  const saveTemplates = (newTemplates: MessageTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('whatsapp_templates', JSON.stringify(newTemplates));
  };

  const saveLogs = (newLogs: WhatsAppLog[]) => {
    setLogs(newLogs);
    localStorage.setItem('whatsapp_logs', JSON.stringify(newLogs));
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
    const cleanedPhone = cleanPhoneNumber(student.contact);
    const encodedMessage = encodeURIComponent(message);
    
    // Direct WhatsApp Web URL - most reliable method
    const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
    
    let success = false;
    
    try {
      // Create a temporary link element and click it programmatically
      const link = document.createElement('a');
      link.href = whatsappUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Add to DOM temporarily
      document.body.appendChild(link);
      
      // Trigger click
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      
      success = true;
      console.log('WhatsApp link opened successfully:', whatsappUrl);
      
    } catch (error) {
      console.error('Failed to open WhatsApp link:', error);
      
      // Fallback: Show URL to user for manual copy
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(whatsappUrl);
          toast({
            title: "WhatsApp URL Copied",
            description: "The WhatsApp link has been copied to your clipboard. Please paste it in your browser.",
          });
          success = true;
        } catch (clipboardError) {
          console.error('Failed to copy to clipboard:', clipboardError);
        }
      }
      
      if (!success) {
        // Final fallback: prompt user with URL
        const userConfirmed = confirm(`Failed to open WhatsApp automatically. Would you like to copy this URL manually?\n\n${whatsappUrl}`);
        if (userConfirmed) {
          success = true;
        }
      }
    }

    // Log the message attempt
    const log: WhatsAppLog = {
      id: Date.now().toString(),
      studentId: student.id,
      studentName: student.name,
      phoneNumber: student.contact,
      message,
      timestamp: new Date().toISOString(),
      status: success ? 'sent' : 'failed'
    };

    const newLogs = [log, ...logs];
    saveLogs(newLogs);

    if (success) {
      toast({
        title: "WhatsApp Opened",
        description: `Message prepared for ${student.name}`,
      });
    } else {
      toast({
        title: "WhatsApp Failed",
        description: `Could not open WhatsApp for ${student.name}. Please ensure WhatsApp is installed or try manually copying: +${cleanedPhone}`,
        variant: "destructive",
      });
    }

    if (onSingleMessage) {
      onSingleMessage(student);
    }
  };

  const sendBulkMessages = () => {
    if (!selectedTemplate && !customMessage) {
      toast({
        title: "Error",
        description: "Please select a template or enter a custom message",
        variant: "destructive",
      });
      return;
    }

    const targetStudents = selectedStudents.length > 0 ? selectedStudents : students;
    const messageTemplate = selectedTemplate 
      ? templates.find(t => t.id === selectedTemplate)?.content || ''
      : customMessage;

    targetStudents.forEach((student, index) => {
      setTimeout(() => {
        const formattedMessage = formatMessage(messageTemplate, student);
        sendWhatsAppMessage(student, formattedMessage);
      }, index * 1000); // 1 second delay between messages
    });

    toast({
      title: "Bulk Messages",
      description: `Sending messages to ${targetStudents.length} students`,
    });
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

  return (
    <div className="space-y-6">
      {/* Message Composer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            WhatsApp Integration
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
            <Button onClick={sendBulkMessages} className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send to {selectedStudents.length > 0 ? `${selectedStudents.length} Selected` : 'All Students'}
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
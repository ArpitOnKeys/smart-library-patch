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
import { WhatsAppModal } from './WhatsAppModal';
import { generateReceiptData, generateReceiptBlob } from '@/utils/receiptGenerator';

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
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
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
    
    // Try multiple methods in sequence for maximum compatibility
    const methods = [
      // Method 1: WhatsApp protocol (works with WhatsApp desktop app)
      () => {
        window.location.href = `whatsapp://send?phone=${cleanedPhone}&text=${encodedMessage}`;
        return true;
      },
      // Method 2: Intent-based URL for mobile devices
      () => {
        window.location.href = `intent://send?phone=${cleanedPhone}&text=${encodedMessage}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
        return true;
      },
      // Method 3: Custom URL scheme
      () => {
        const link = document.createElement('a');
        link.href = `whatsapp://send/?phone=${cleanedPhone}&text=${encodedMessage}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      },
      // Method 4: Alternative wa.me format
      () => {
        window.open(`https://web.whatsapp.com/send/?phone=${cleanedPhone}&text=${encodedMessage}&type=phone_number&app_absent=0`, '_blank', 'noopener,noreferrer');
        return true;
      }
    ];

    let success = false;
    for (let i = 0; i < methods.length; i++) {
      try {
        methods[i]();
        success = true;
        console.log(`WhatsApp opened successfully using method ${i + 1}`);
        break;
      } catch (error) {
        console.log(`Method ${i + 1} failed, trying next...`);
        if (i === methods.length - 1) {
          // Final fallback: try basic window.open
          try {
            window.open(`https://wa.me/${cleanedPhone}?text=${encodedMessage}`, '_self');
            success = true;
          } catch (finalError) {
            console.error('All methods failed:', finalError);
          }
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

    toast({
      title: success ? "WhatsApp Opened" : "Please Install WhatsApp",
      description: success ? `Message sent to ${student.name}` : `Install WhatsApp app to send message to ${student.name}`,
      variant: success ? "default" : "destructive"
    });

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

  const sendTestReceipt = async () => {
    if (!testPhoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    if (students.length === 0) {
      toast({
        title: "Error",
        description: "No students available for sample receipt",
        variant: "destructive",
      });
      return;
    }

    setIsSendingTest(true);

    try {
      // Use first student as sample
      const sampleStudent = students[0];
      
      // Create sample payment data
      const samplePayment = {
        id: 'sample',
        studentId: sampleStudent.id,
        amount: sampleStudent.monthlyFees,
        paymentDate: new Date().toISOString(),
        month: new Date().toLocaleDateString('en-US', { month: 'long' }),
        year: new Date().getFullYear(),
        createdAt: new Date().toISOString()
      };

      const receiptData = generateReceiptData(sampleStudent, samplePayment);
      receiptData.totalPaid = sampleStudent.monthlyFees;
      receiptData.totalDue = 0;
      
      // Generate PDF blob
      const pdfBlob = generateReceiptBlob(receiptData);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Prepare WhatsApp message
      const message = `📄 SAMPLE RECEIPT from PATCH Library\n\nThis is a test receipt for ${sampleStudent.name}\nAmount: ₹${samplePayment.amount}\n\nPowered by PATCH - The Smart Library 📚`;
      
      const cleanedPhone = testPhoneNumber.replace(/\D/g, '');
      const phoneNumber = cleanedPhone.startsWith('91') ? cleanedPhone : '91' + cleanedPhone;
      const encodedMessage = encodeURIComponent(message);
      
      // Try multiple automatic methods
      const methods = [
        () => window.location.href = `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`,
        () => window.location.href = `intent://send?phone=${phoneNumber}&text=${encodedMessage}#Intent;scheme=whatsapp;package=com.whatsapp;end`,
        () => window.open(`https://web.whatsapp.com/send/?phone=${phoneNumber}&text=${encodedMessage}&type=phone_number&app_absent=0`, '_blank'),
        () => window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_self')
      ];

      let success = false;
      for (let i = 0; i < methods.length; i++) {
        try {
          methods[i]();
          success = true;
          break;
        } catch (error) {
          if (i === methods.length - 1) console.error('All WhatsApp methods failed:', error);
        }
      }

      toast({
        title: success ? 'Test Receipt Sent' : 'Install WhatsApp',
        description: success ? 'Sample receipt sent via WhatsApp successfully.' : 'Please install WhatsApp to send test receipt.',
        variant: success ? 'default' : 'destructive'
      });
      
      // Clean up the temporary URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 5000);
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate test receipt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingTest(false);
    }
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

      {/* Test Receipt Section */}
      <Card>
        <CardHeader>
          <CardTitle>Send Sample Receipt</CardTitle>
          <CardDescription>
            Test the receipt generation and WhatsApp integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="test-phone">Test Phone Number</Label>
              <Input
                id="test-phone"
                placeholder="Enter phone number (e.g., 9876543210)"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter 10-digit mobile number without country code
              </p>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={sendTestReceipt}
                disabled={isSendingTest || !testPhoneNumber.trim()}
                className="flex items-center gap-2"
              >
                {isSendingTest ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Sample Receipt
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 This will generate a professional PDF receipt using the first student's data and send it via WhatsApp to the specified number.
            </p>
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
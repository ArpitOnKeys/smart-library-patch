import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Clock, CheckCircle, XCircle, Plus, Edit, Trash2, Receipt, StopCircle, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Student } from '@/types/database';
import { generateFeeReceiptPDF, prepareReceiptData, sendReceiptViaWhatsApp as sendReceiptWhatsApp } from '@/utils/receiptGenerator';
import { WhatsAppDesktopIntegration } from './WhatsAppDesktopIntegration';

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
    name: 'Professional Welcome Message',
    content: `Dear {name},

Welcome to PATCH - The Smart Library! We are delighted to have you as part of our learning community.

Your enrollment details:
• Enrollment No: {enrollmentNo}
• Seat Number: {seatNumber}
• Monthly Fee: ₹{monthlyFees}
• Shift: {shift}

Your membership has been successfully activated. Please feel free to explore our resources, attend upcoming sessions, and connect with our staff for any support. We look forward to your successful journey with us.

Regards,
PATCH Library Management`,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Professional Fee Reminder',
    content: `Dear {name},

This is a gentle reminder that your membership fee of ₹{monthlyFees} is due.

Student Details:
• Name: {name}
• Enrollment No: {enrollmentNo}
• Seat Number: {seatNumber}
• Contact: {contact}

Kindly complete the payment at your earliest convenience to continue enjoying uninterrupted access to our facilities and resources.

Thank you for your cooperation and continued support.

Regards,
PATCH Library Management`,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Professional Payment Confirmation',
    content: `Dear {name},

We have successfully received your payment of ₹{monthlyFees} for your library membership.

Payment Details:
• Student Name: {name}
• Enrollment No: {enrollmentNo}
• Amount Paid: ₹{monthlyFees}
• Payment Date: Today
• Seat Number: {seatNumber}

Thank you for your timely payment. Your subscription/membership remains active and you can continue accessing all our facilities without any interruption.

We appreciate your support and commitment to your learning journey.

Regards,
PATCH Library Management`,
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Quick Fee Reminder',
    content: 'Dear {name}, your monthly fee of ₹{monthlyFees} is due. Please ensure timely payment. - PATCH Library',
    createdAt: new Date().toISOString()
  }
];

export const WhatsAppIntegration = ({ students, selectedStudents = [], onSingleMessage }: WhatsAppIntegrationProps) => {
  // Import the new enhanced integration component
  return <WhatsAppDesktopIntegration students={students} />;
};

// Keep the legacy component for backward compatibility  
export const LegacyWhatsAppIntegration = ({ students, selectedStudents = [], onSingleMessage }: WhatsAppIntegrationProps) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '' });
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [broadcastCanceled, setBroadcastCanceled] = useState(false);
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
      title: "Bulk Messages Started",
      description: `Sending messages to ${targetStudents.length} students`,
    });
  };

  const sendToAllStudents = async () => {
    if (!selectedTemplate && !customMessage) {
      toast({
        title: "Error",
        description: "Please select a template or enter a custom message",
        variant: "destructive",
      });
      return;
    }

    if (students.length === 0) {
      toast({
        title: "Error",
        description: "No students found to send messages to",
        variant: "destructive",
      });
      return;
    }

    setShowBroadcastDialog(true);
  };

  const confirmBroadcast = async () => {
    setIsBroadcasting(true);
    setShowBroadcastDialog(false);
    setBroadcastCanceled(false);
    setBroadcastProgress({ current: 0, total: students.length, success: 0, failed: 0 });

    const messageTemplate = selectedTemplate 
      ? templates.find(t => t.id === selectedTemplate)?.content || ''
      : customMessage;

    const validStudents = students.filter(s => s.contact && s.contact.trim());
    const invalidStudents = students.length - validStudents.length;

    if (invalidStudents > 0) {
      toast({
        title: "Warning",
        description: `${invalidStudents} students have invalid/missing phone numbers and will be skipped`,
        variant: "destructive"
      });
    }

    let successCount = 0;
    let failureCount = 0;

    // Process students one by one with progress tracking
    for (let i = 0; i < validStudents.length; i++) {
      if (broadcastCanceled) {
        toast({
          title: "Broadcast Canceled",
          description: `Stopped after ${i} students. ${successCount} sent, ${failureCount} failed.`,
          variant: "destructive"
        });
        break;
      }

      const student = validStudents[i];
      
      // Update progress
      setBroadcastProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        // Add delay between messages to avoid flooding
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2500)); // 2.5 second delay
        }
        
        const formattedMessage = formatMessage(messageTemplate, student);
        await sendWhatsAppMessage(student, formattedMessage);
        successCount++;
        
        setBroadcastProgress(prev => ({ ...prev, success: successCount }));
        
        // Show progress toast every 5 students
        if ((i + 1) % 5 === 0) {
          toast({
            title: "Sending Progress",
            description: `Sent ${i + 1} of ${validStudents.length} messages...`,
          });
        }
      } catch (error) {
        console.error(`Failed to send message to ${student.name}:`, error);
        failureCount++;
        setBroadcastProgress(prev => ({ ...prev, failed: failureCount }));
      }
    }

    setIsBroadcasting(false);
    setBroadcastProgress({ current: 0, total: 0, success: 0, failed: 0 });
    
    // Final summary toast
    const totalProcessed = successCount + failureCount;
    toast({
      title: "✅ Broadcast Complete!",
      description: `📊 Summary: ${totalProcessed} processed • ✅ ${successCount} sent successfully • ❌ ${failureCount} failed${invalidStudents > 0 ? ` • ⚠️ ${invalidStudents} skipped (invalid numbers)` : ''}`,
      variant: failureCount > 0 ? "destructive" : "default"
    });
  };

  const cancelBroadcast = () => {
    setBroadcastCanceled(true);
    setIsBroadcasting(false);
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

  const sendSampleReceipt = async () => {
    if (!testPhoneNumber) {
      toast({
        title: "Error",
        description: "Please enter a phone number for testing",
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

    try {
      // Use first student as sample data
      const sampleStudent = students[0];
      
      // Create sample payment data
      const samplePayment = {
        id: 'sample-' + Date.now(),
        studentId: sampleStudent.id,
        amount: sampleStudent.monthlyFees,
        paymentDate: new Date().toISOString(),
        month: 'Sample',
        year: new Date().getFullYear(),
        createdAt: new Date().toISOString()
      };

      // Prepare receipt data with test phone number
      const receiptData = prepareReceiptData(sampleStudent, samplePayment, sampleStudent.monthlyFees, 0);
      receiptData.contact = testPhoneNumber; // Override with test number
      receiptData.slipNo = 'SAMPLE-' + Date.now().toString().slice(-6);
      
      await sendReceiptWhatsApp(receiptData);
      
      toast({
        title: "Sample Receipt Sent",
        description: `Test receipt sent to ${testPhoneNumber}`,
      });
    } catch (error) {
      console.error('Error sending sample receipt:', error);
      toast({
        title: "Error",
        description: "Failed to send sample receipt. Please try again.",
        variant: "destructive",
      });
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

          <div className="flex flex-wrap gap-2">
            <Button onClick={sendBulkMessages} className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send to {selectedStudents.length > 0 ? `${selectedStudents.length} Selected` : 'All Students'}
            </Button>

            <Button 
              onClick={sendToAllStudents} 
              disabled={isBroadcasting || (!selectedTemplate && !customMessage)}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary-glow hover:to-accent text-primary-foreground font-bold shadow-2xl border-2 border-primary/50 hover:border-primary hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {isBroadcasting ? 'Broadcasting...' : `Broadcast to All ${students.length} Students`}
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

          {/* Broadcast Progress Indicator */}
          {isBroadcasting && (
            <Card className="mt-4 border-primary/50 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary animate-pulse" />
                      <Label className="font-semibold text-primary">Broadcasting Messages</Label>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={cancelBroadcast}
                      className="flex items-center gap-2"
                    >
                      <StopCircle className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress: {broadcastProgress.current} of {broadcastProgress.total}</span>
                      <span>✅ {broadcastProgress.success} sent • ❌ {broadcastProgress.failed} failed</span>
                    </div>
                    <Progress 
                      value={(broadcastProgress.current / broadcastProgress.total) * 100} 
                      className="w-full h-2" 
                    />
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Sending messages with 2.5-second intervals to avoid flooding. Please wait...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sample Receipt Test Section */}
          <div className="mt-6 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="h-4 w-4" />
              <Label className="font-medium">Test Premium Receipt</Label>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter phone number for testing"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={sendSampleReceipt}
                disabled={!testPhoneNumber}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Send Sample Receipt
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This will generate a premium PDF receipt with sample data and send it via WhatsApp
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

      {/* Broadcast Confirmation Dialog */}
      <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Confirm Broadcast</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-primary">
                Send to ALL {students.length} Students?
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                This action will send the message to every student in your database and cannot be undone.
              </p>
            </div>
            
            {/* Message Preview */}
            <div className="p-3 bg-muted/50 rounded-lg border">
              <p className="text-sm font-medium mb-2">Message Preview:</p>
              <p className="text-sm italic">
                {selectedTemplate 
                  ? templates.find(t => t.id === selectedTemplate)?.content.slice(0, 150) + (templates.find(t => t.id === selectedTemplate)?.content.length > 150 ? '...' : '')
                  : customMessage.slice(0, 150) + (customMessage.length > 150 ? '...' : '')
                }
              </p>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowBroadcastDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmBroadcast}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary-glow hover:to-accent text-primary-foreground font-bold"
            >
              Yes, Send to All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
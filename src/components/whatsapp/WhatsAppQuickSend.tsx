import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  MessageSquare, 
  Users, 
  FileText, 
  Eye,
  Wifi,
  WifiOff,
  Search
} from 'lucide-react';
import { useWhatsAppService } from '@/hooks/useWhatsAppService';
import { Student } from '@/types/database';
import { studentDb } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

export const WhatsAppQuickSend = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState<Record<string, 'pending' | 'sending' | 'sent' | 'failed'>>({});
  
  const { isConnected, sendMessage, sendBulkMessages } = useWhatsAppService();
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
    loadTemplates();
  }, []);

  const loadStudents = async () => {
    try {
      const allStudents = studentDb.getAll();
      setStudents(allStudents);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const loadTemplates = () => {
    const saved = localStorage.getItem('whatsapp_templates');
    if (saved) {
      setTemplates(JSON.parse(saved));
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.contact.includes(searchTerm) ||
    student.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getMessageContent = (): string => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      return template?.content || '';
    }
    return customMessage;
  };

  const getPreviewMessage = (student: Student): string => {
    const messageTemplate = getMessageContent();
    return formatMessage(messageTemplate, student);
  };

  const handleSendToSingle = async () => {
    if (!selectedStudents.length || selectedStudents.length !== 1) return;
    
    const student = selectedStudents[0];
    const messageContent = getMessageContent();
    
    if (!messageContent.trim()) {
      toast({
        title: "No Message",
        description: "Please select a template or enter a custom message.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setSendingProgress({ [student.id]: 'sending' });
    
    const formattedMessage = formatMessage(messageContent, student);
    const cleanedPhone = cleanPhoneNumber(student.contact);

    const success = await sendMessage({
      phone: cleanedPhone,
      message: formattedMessage,
      studentId: student.id,
      studentName: student.name,
    });

    setSendingProgress({ [student.id]: success ? 'sent' : 'failed' });
    setIsSending(false);
    
    setTimeout(() => setSendingProgress({}), 3000);
  };

  const handleSendBulk = async () => {
    if (!selectedStudents.length) return;
    
    const messageContent = getMessageContent();
    
    if (!messageContent.trim()) {
      toast({
        title: "No Message",
        description: "Please select a template or enter a custom message.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    // Initialize progress for all students
    const initialProgress: Record<string, 'pending' | 'sending' | 'sent' | 'failed'> = {};
    selectedStudents.forEach(student => {
      initialProgress[student.id] = 'pending';
    });
    setSendingProgress(initialProgress);

    const messages = selectedStudents.map(student => ({
      phone: cleanPhoneNumber(student.contact),
      message: formatMessage(messageContent, student),
      studentId: student.id,
      studentName: student.name,
    }));

    // Update to sending state
    const sendingProgress: Record<string, 'pending' | 'sending' | 'sent' | 'failed'> = {};
    selectedStudents.forEach(student => {
      sendingProgress[student.id] = 'sending';
    });
    setSendingProgress(sendingProgress);

    await sendBulkMessages(messages);
    
    setIsSending(false);
    
    // Clear progress after 5 seconds
    setTimeout(() => setSendingProgress({}), 5000);
  };

  const toggleStudentSelection = (student: Student) => {
    setSelectedStudents(prev => {
      const isSelected = prev.find(s => s.id === student.id);
      if (isSelected) {
        return prev.filter(s => s.id !== student.id);
      } else {
        return [...prev, student];
      }
    });
  };

  const selectAllStudents = () => {
    setSelectedStudents(filteredStudents);
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  const getStatusBadge = (studentId: string) => {
    const status = sendingProgress[studentId];
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'sending':
        return <Badge className="bg-blue-100 text-blue-800">Sending...</Badge>;
      case 'sent':
        return <Badge className="bg-green-100 text-green-800">Sent ✓</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed ✗</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">WhatsApp Status:</span>
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
            {!isConnected && (
              <p className="text-sm text-muted-foreground">
                Please connect your WhatsApp account in the Setup tab first.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Message Composition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Compose Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              disabled={!!selectedTemplate}
            />
          </div>

          {/* Message Preview */}
          {selectedStudents.length > 0 && getMessageContent() && (
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Message Preview:</Label>
              <p className="mt-1 text-sm whitespace-pre-wrap">
                {getPreviewMessage(selectedStudents[0])}
              </p>
              {selectedStudents.length > 1 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Preview shown for first selected student. Each message will be personalized.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Recipients ({selectedStudents.length} selected)
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllStudents}
                disabled={filteredStudents.length === 0}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                disabled={selectedStudents.length === 0}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students by name, phone, or enrollment number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Student List */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredStudents.map((student) => {
              const isSelected = selectedStudents.find(s => s.id === student.id);
              const status = sendingProgress[student.id];
              
              return (
                <div
                  key={student.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => toggleStudentSelection(student)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{student.name}</p>
                        {status && getStatusBadge(student.id)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {student.contact} • {student.enrollmentNo}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{student.shift}</p>
                      <p className="text-sm text-muted-foreground">Seat {student.seatNumber}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Send Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              onClick={handleSendToSingle}
              disabled={!isConnected || isSending || selectedStudents.length !== 1 || !getMessageContent()}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              Send to Selected Student
            </Button>
            
            <Button
              onClick={handleSendBulk}
              disabled={!isConnected || isSending || selectedStudents.length === 0 || !getMessageContent()}
              variant="outline"
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              Send Bulk ({selectedStudents.length})
            </Button>
          </div>
          
          {isSending && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Sending Messages...</p>
              <div className="space-y-1">
                {selectedStudents.map(student => (
                  <div key={student.id} className="flex items-center justify-between text-sm">
                    <span>{student.name}</span>
                    {getStatusBadge(student.id)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
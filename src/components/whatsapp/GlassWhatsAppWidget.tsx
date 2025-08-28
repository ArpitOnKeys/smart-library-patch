import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Wifi, 
  WifiOff,
  Users,
  Zap
} from 'lucide-react';
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
  status: 'sent' | 'failed' | 'pending';
}

interface GlassWhatsAppWidgetProps {
  students: Student[];
  selectedStudents?: Student[];
  onSingleMessage?: (student: Student) => void;
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

const statusIndicatorVariants = {
  connected: {
    scale: [1, 1.2, 1],
    opacity: [0.7, 1, 0.7],
    transition: { duration: 2, repeat: Infinity }
  },
  disconnected: {
    scale: 1,
    opacity: 0.5
  },
  sending: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: "linear" as const }
  }
};

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

export const GlassWhatsAppWidget = ({ students, selectedStudents = [], onSingleMessage }: GlassWhatsAppWidgetProps) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'sending'>('connected');
  const [sendingProgress, setSendingProgress] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
    loadLogs();
    // Simulate connection check
    simulateConnectionStatus();
  }, []);

  const simulateConnectionStatus = () => {
    const statuses: ('connected' | 'disconnected')[] = ['connected', 'disconnected'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    setConnectionStatus(randomStatus);
  };

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

  const sendBulkMessages = async () => {
    if (!selectedTemplate && !customMessage) {
      toast({
        title: "Error",
        description: "Please select a template or enter a custom message",
        variant: "destructive",
      });
      return;
    }

    setConnectionStatus('sending');
    setSendingProgress(0);

    const targetStudents = selectedStudents.length > 0 ? selectedStudents : students;
    const messageTemplate = selectedTemplate 
      ? templates.find(t => t.id === selectedTemplate)?.content || ''
      : customMessage;

    for (let i = 0; i < targetStudents.length; i++) {
      const student = targetStudents[i];
      const progress = ((i + 1) / targetStudents.length) * 100;
      setSendingProgress(progress);
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const formattedMessage = formatMessage(messageTemplate, student);
      // Simulate sending logic here
    }

    setConnectionStatus('connected');
    setSendingProgress(0);

    toast({
      title: "Messages Sent",
      description: `Successfully sent messages to ${targetStudents.length} students`,
    });
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-accent" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-destructive" />;
      case 'sending':
        return <Zap className="h-4 w-4 text-primary" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'sending':
        return 'Sending...';
    }
  };

  return (
    <motion.div
      className={`fixed ${isExpanded ? 'inset-4' : 'bottom-4 right-4 w-80'} z-50`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <GlassCard variant="floating" className="h-full overflow-hidden">
        {/* Widget Header */}
        <motion.div
          className="glass-header p-4 border-b border-white/10 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ backgroundColor: "hsl(var(--primary) / 0.05)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="glass-panel p-2 rounded-full bg-primary/20"
                variants={statusIndicatorVariants}
                animate={connectionStatus}
              >
                <MessageSquare className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-white">WhatsApp Integration</h3>
                <div className="flex items-center gap-2 text-sm">
                  {getStatusIcon()}
                  <span className="text-white/70">{getStatusText()}</span>
                </div>
              </div>
            </div>
            <motion.button
              className="glass-panel p-2 rounded-full hover:bg-white/10"
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                ↕️
              </motion.div>
            </motion.button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              className="p-4 space-y-4 h-full overflow-y-auto"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Quick Stats */}
              <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
                <div className="glass-panel p-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-primary">{students.length}</div>
                  <div className="text-xs text-white/60">Total Students</div>
                </div>
                <div className="glass-panel p-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-secondary">{selectedStudents.length}</div>
                  <div className="text-xs text-white/60">Selected</div>
                </div>
                <div className="glass-panel p-3 rounded-xl text-center">
                  <div className="text-2xl font-bold text-accent">{logs.length}</div>
                  <div className="text-xs text-white/60">Messages Sent</div>
                </div>
              </motion.div>

              {/* Message Composer */}
              <motion.div variants={itemVariants} className="space-y-3">
                <Label className="text-white">Quick Message</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="glass-panel bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent className="glass-panel bg-black/80 border-white/20">
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="Or type custom message..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="glass-panel bg-white/5 border-white/20 text-white placeholder:text-white/50 resize-none"
                  rows={3}
                />
              </motion.div>

              {/* Progress Bar */}
              {connectionStatus === 'sending' && (
                <motion.div
                  className="glass-panel p-3 rounded-xl"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Send className="h-4 w-4 text-primary" />
                    </motion.div>
                    <span className="text-sm text-white">Sending messages...</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${sendingProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="text-xs text-white/60 mt-1">{Math.round(sendingProgress)}% complete</div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div variants={itemVariants} className="flex gap-2">
                <GlassButton
                  variant="glass-primary"
                  onClick={sendBulkMessages}
                  disabled={connectionStatus === 'sending'}
                  className="flex-1"
                  ripple={true}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to {selectedStudents.length > 0 ? selectedStudents.length : students.length}
                </GlassButton>
              </motion.div>

              {/* Recent Activity */}
              <motion.div variants={itemVariants} className="space-y-2">
                <Label className="text-white">Recent Activity</Label>
                <div className="glass-panel p-3 rounded-xl max-h-40 overflow-y-auto space-y-2">
                  {logs.slice(0, 5).map((log) => (
                    <motion.div
                      key={log.id}
                      className="flex items-center justify-between text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="flex-1">
                        <div className="text-white font-medium">{log.studentName}</div>
                        <div className="text-white/60 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</div>
                      </div>
                      <Badge variant={log.status === 'sent' ? 'default' : 'destructive'} className="text-xs">
                        {log.status === 'sent' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      </Badge>
                    </motion.div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-center text-white/60 text-sm py-4">
                      No messages sent yet
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed View */}
        {!isExpanded && (
          <motion.div
            className="p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/70">Quick Actions</span>
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {selectedStudents.length || students.length}
              </Badge>
            </div>
            <GlassButton
              variant="glass-primary"
              size="sm"
              onClick={sendBulkMessages}
              className="w-full"
              ripple={true}
            >
              <Send className="h-4 w-4 mr-2" />
              Quick Send
            </GlassButton>
          </motion.div>
        )}
      </GlassCard>
    </motion.div>
  );
};
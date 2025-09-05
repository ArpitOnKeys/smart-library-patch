/**
 * WhatsApp Desktop Integration Component
 * 
 * FEATURES:
 * - Custom message broadcast to all students with personalization tokens
 * - Queue-based sending with progress tracking and pause/resume/cancel controls
 * - E.164 phone normalization with +91 default for India
 * - Dry-run mode for testing without actually sending
 * - Student filtering (All, Morning, Evening, Full-time, Due-fees)
 * - Rate limiting with configurable intervals and jitter
 * - Comprehensive logging and CSV export
 * - Professional confirmation dialog with message preview
 * - Real-time progress updates with live status counters
 * 
 * USAGE:
 * 1. Type custom message in textarea or select from templates
 * 2. Toggle personalization to use {name}, {fatherName}, {seat}, etc. tokens
 * 3. Choose audience filter (All/Morning/Evening/Full-time/Due-fees)
 * 4. Click "Send to All Students (Broadcast)" 
 * 5. Confirm in dialog showing audience size and sample messages
 * 6. Monitor progress with pause/resume/cancel controls
 * 7. View results in real-time table and export logs as CSV
 * 
 * DESKTOP DEEP-LINK BEHAVIOR:
 * Uses whatsapp://send protocol with fallbacks to web.whatsapp.com
 * Each message opens a new WhatsApp chat window sequentially
 * 5-6 second intervals with jitter prevent throttling/blocking
 * 
 * KNOWN LIMITATIONS:
 * - Requires WhatsApp Desktop app or web browser for sending
 * - Cannot guarantee message delivery (depends on WhatsApp availability)
 * - Sequential sending may take time for large student lists
 * - User must manually click through WhatsApp confirmations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Settings, 
  Play, 
  Pause, 
  Square, 
  Download,
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Filter
} from 'lucide-react';

import { Student } from '@/types/database';
import { 
  QueueItem, 
  BroadcastConfig, 
  SendStatus, 
  BroadcastState, 
  StudentFilter,
  PersonalizationTokens 
} from '@/types/whatsapp';
import { useWhatsAppStore } from '@/store/whatsappStore';
import { normalizeToE164, validatePhone } from '@/utils/phone';
import { openDeepLink, addJitter, sleep, checkWhatsAppDesktopAvailability, sendEnterKey } from '@/utils/whatsappClient';
import { logWhatsAppAttempt, downloadLogsAsCSV, getWhatsAppLogs } from '@/utils/logger';
import { whatsappClient } from '@/utils/whatsappAutomation';
import { MessageProgress, WhatsAppSession } from '@/types/whatsapp';
import { WhatsAppQRDialog } from './WhatsAppQRDialog';

interface WhatsAppDesktopIntegrationProps {
  students: Student[];
}

export const WhatsAppDesktopIntegration: React.FC<WhatsAppDesktopIntegrationProps> = ({ 
  students 
}) => {
  const { toast } = useToast();
  
  // Store state
  const {
    queue,
    broadcastState,
    stats,
    settings,
    setQueue,
    updateQueueItem,
    setBroadcastState,
    updateStats,
    resetBroadcast,
    getNextQueuedItem,
    markItemCompleted,
    cancelRemaining
  } = useWhatsAppStore();
  
  // Local component state
  const [config, setConfig] = useState<BroadcastConfig>({
    message: '',
    usePersonalization: false,
    audience: StudentFilter.ALL,
    interval: settings.sendInterval,
    jitter: settings.enableJitter
  });
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDryRun, setIsDryRun] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [logs, setLogs] = useState(getWhatsAppLogs());
  const [characterCount, setCharacterCount] = useState(0);
  const [whatsAppAvailable, setWhatsAppAvailable] = useState<boolean | null>(null);
  const [isFullyAutomated, setIsFullyAutomated] = useState(false);
  
  // WhatsApp automation state
  const [whatsappSession, setWhatsappSession] = useState<WhatsAppSession | null>(null);
  const [bulkProgress, setBulkProgress] = useState<MessageProgress | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [automationMode, setAutomationMode] = useState(false);
  const [attachReceipts, setAttachReceipts] = useState(false);
  
  // Update character count when message changes
  useEffect(() => {
    setCharacterCount(config.message.length);
  }, [config.message]);
  
  // Check WhatsApp availability on mount
  useEffect(() => {
    checkWhatsAppDesktopAvailability().then(available => {
      setWhatsAppAvailable(available);
      // If Tauri is available, we can do full automation
      // @ts-ignore
      setIsFullyAutomated(!!window.__TAURI__?.tauri);
    });
  }, []);
  
  // Refresh logs periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(getWhatsAppLogs());
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  /**
   * Filter students based on selected audience
   */
  const getFilteredStudents = useCallback((): Student[] => {
    switch (config.audience) {
      case StudentFilter.MORNING:
        return students.filter(s => s.shift?.toLowerCase().includes('morning'));
      case StudentFilter.EVENING:
        return students.filter(s => s.shift?.toLowerCase().includes('evening'));
      case StudentFilter.FULL_TIME:
        return students.filter(s => s.shift?.toLowerCase().includes('full'));
      case StudentFilter.DUE_FEES:
        // Implement due fees logic based on your app's structure
        return students.filter(s => s.monthlyFees > 0); // Placeholder logic
      case StudentFilter.ALL:
      default:
        return students;
    }
  }, [students, config.audience]);
  
  /**
   * Apply personalization tokens to message
   */
  const personalizeMessage = useCallback((template: string, student: Student): string => {
    if (!config.usePersonalization) return template;
    
    const tokens: PersonalizationTokens = {
      name: student.name || '—',
      fatherName: student.fatherName || '—',
      seat: student.seatNumber || '—',
      shift: student.shift || '—',
      dueAmount: student.monthlyFees?.toString() || '—',
      month: new Date().toLocaleString('default', { month: 'long' }),
      enrollmentNo: student.enrollmentNo || '—',
      contact: student.contact || '—',
      monthlyFees: student.monthlyFees?.toString() || '—',
      seatNumber: student.seatNumber || '—'
    };
    
    let personalized = template;
    Object.entries(tokens).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      personalized = personalized.replace(regex, value);
    });
    
    return personalized;
  }, [config.usePersonalization]);
  
  /**
   * Build broadcast queue from filtered students
   */
  const buildQueue = useCallback((): QueueItem[] => {
    const filteredStudents = getFilteredStudents();
    const queueItems: QueueItem[] = [];
    
    filteredStudents.forEach((student) => {
      const phoneValidation = validatePhone(student.contact, 'IN');
      
      if (!phoneValidation.isValid) {
        // Create skipped item for invalid phone
        queueItems.push({
          id: `${student.id}_${Date.now()}`,
          studentId: student.id,
          name: student.name,
          phoneRaw: student.contact,
          phoneE164: '',
          finalMessage: '',
          status: SendStatus.SKIPPED,
          attempts: 0,
          lastUpdate: Date.now(),
          error: phoneValidation.error
        });
        return;
      }
      
      const finalMessage = personalizeMessage(config.message, student);
      
      queueItems.push({
        id: `${student.id}_${Date.now()}`,
        studentId: student.id,
        name: student.name,
        phoneRaw: student.contact,
        phoneE164: phoneValidation.e164!,
        finalMessage,
        status: SendStatus.QUEUED,
        attempts: 0,
        lastUpdate: Date.now()
      });
    });
    
    return queueItems;
  }, [getFilteredStudents, personalizeMessage, config.message]);
  
  /**
   * Handle individual message send
   */
  const sendSingleMessage = useCallback(async (item: QueueItem): Promise<void> => {
    updateQueueItem(item.id, { status: SendStatus.SENDING });
    
    try {
      if (isDryRun) {
        // Simulate sending for dry run
        await sleep(1000);
        const success = Math.random() > 0.1; // 90% success rate in dry run
        
        if (success) {
          markItemCompleted(item.id, SendStatus.SENT);
          logWhatsAppAttempt(item.studentId, item.name, item.phoneE164, item.finalMessage, SendStatus.SENT);
        } else {
          markItemCompleted(item.id, SendStatus.FAILED, 'Simulated failure (dry run)');
          logWhatsAppAttempt(item.studentId, item.name, item.phoneE164, item.finalMessage, SendStatus.FAILED, 'Simulated failure');
        }
        return;
      }
      
      // Real sending
      const result = await openDeepLink(item.phoneE164, item.finalMessage);
      
      if (result.success) {
        markItemCompleted(item.id, SendStatus.SENT);
        logWhatsAppAttempt(item.studentId, item.name, item.phoneE164, item.finalMessage, SendStatus.SENT);
      } else {
        markItemCompleted(item.id, SendStatus.FAILED, result.error);
        logWhatsAppAttempt(item.studentId, item.name, item.phoneE164, item.finalMessage, SendStatus.FAILED, result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      markItemCompleted(item.id, SendStatus.FAILED, errorMessage);
      logWhatsAppAttempt(item.studentId, item.name, item.phoneE164, item.finalMessage, SendStatus.FAILED, errorMessage);
    }
  }, [isDryRun, updateQueueItem, markItemCompleted]);
  
  /**
   * Main broadcast processing loop
   */
  const processBroadcast = useCallback(async (): Promise<void> => {
    setBroadcastState(BroadcastState.RUNNING);
    
    while (broadcastState === BroadcastState.RUNNING) {
      const nextItem = getNextQueuedItem();
      
      if (!nextItem) {
        // No more items to process
        setBroadcastState(BroadcastState.COMPLETED);
        break;
      }
      
      await sendSingleMessage(nextItem);
      
      // Check if broadcast was cancelled/paused
      if (broadcastState !== BroadcastState.RUNNING) {
        break;
      }
      
      // Add delay between messages
      const baseDelay = config.interval * 1000;
      const delayMs = config.jitter ? addJitter(baseDelay) : baseDelay;
      await sleep(delayMs);
    }
    
    // Final statistics
    if (broadcastState === BroadcastState.COMPLETED) {
      const finalStats = stats;
      toast({
        title: '🎉 Broadcast Complete!',
        description: `📊 Results: ✅ ${finalStats.sent} sent • ❌ ${finalStats.failed} failed • ⚠️ ${finalStats.skipped} skipped`,
        duration: 10000
      });
    }
  }, [broadcastState, getNextQueuedItem, sendSingleMessage, config.interval, config.jitter, stats, toast, setBroadcastState]);
  
  /**
   * Start broadcast
   */
  const startBroadcast = useCallback(async (): Promise<void> => {
    if (!config.message.trim()) {
      toast({
        title: 'Message Required',
        description: 'Please enter a message to broadcast',
        variant: 'destructive'
      });
      return;
    }
    
    const newQueue = buildQueue();
    setQueue(newQueue);
    
    const validItems = newQueue.filter(item => item.status === SendStatus.QUEUED);
    
    if (validItems.length === 0) {
      toast({
        title: 'No Valid Recipients',
        description: 'No students found with valid phone numbers',
        variant: 'destructive'
      });
      return;
    }
    
    setShowConfirmDialog(false);
    
    toast({
      title: isDryRun ? '🧪 Dry Run Started' : '🚀 Broadcast Started',
      description: `Processing ${validItems.length} students...`,
      duration: 3000
    });
    
    // Start processing
    processBroadcast();
  }, [config.message, buildQueue, setQueue, processBroadcast, isDryRun, toast]);
  
  /**
   * Pause broadcast
   */
  const pauseBroadcast = useCallback((): void => {
    setBroadcastState(BroadcastState.PAUSED);
    toast({
      title: '⏸️ Broadcast Paused',
      description: 'You can resume or cancel from the controls',
    });
  }, [setBroadcastState, toast]);
  
  /**
   * Resume broadcast
   */
  const resumeBroadcast = useCallback((): void => {
    setBroadcastState(BroadcastState.RUNNING);
    toast({
      title: '▶️ Broadcast Resumed',
      description: 'Continuing from where we left off...',
    });
    processBroadcast();
  }, [setBroadcastState, toast, processBroadcast]);
  
  /**
   * Cancel broadcast
   */
  const cancelBroadcast = useCallback((): void => {
    cancelRemaining();
    setBroadcastState(BroadcastState.CANCELLED);
    
    toast({
      title: '🛑 Broadcast Cancelled',
      description: `Processed: ${stats.processed} • Remaining items cancelled`,
      variant: 'destructive'
    });
  }, [cancelRemaining, setBroadcastState, stats.processed, toast]);
  
  /**
   * Test send to specific number
   */
  const testSend = useCallback(async (): Promise<void> => {
    if (!testPhone.trim() || !config.message.trim()) {
      toast({
        title: 'Test Send Error',
        description: 'Please enter both phone number and message',
        variant: 'destructive'
      });
      return;
    }
    
    const phoneValidation = validatePhone(testPhone, 'IN');
    if (!phoneValidation.isValid) {
      toast({
        title: 'Invalid Phone Number',
        description: phoneValidation.error,
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const result = await openDeepLink(phoneValidation.e164!, config.message);
      
      if (result.success) {
        toast({
          title: '✅ Test Message Sent',
          description: `WhatsApp opened for ${testPhone}`,
        });
      } else {
        toast({
          title: '❌ Test Send Failed',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '❌ Test Send Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  }, [testPhone, config.message, toast]);
  
  /**
   * Generate preview messages for confirmation dialog
   */
  const getPreviewMessages = useCallback((): { student: string; message: string }[] => {
    const filteredStudents = getFilteredStudents();
    const sampleStudents = filteredStudents.slice(0, 3);
    
    return sampleStudents.map(student => ({
      student: student.name,
      message: personalizeMessage(config.message, student)
    }));
  }, [getFilteredStudents, personalizeMessage, config.message]);
  
  // Character count styling
  const getCharacterCountColor = (): string => {
    if (characterCount > 1400) return 'text-red-500';
    if (characterCount > 1000) return 'text-orange-500';
    return 'text-muted-foreground';
  };
  
  const filteredStudents = getFilteredStudents();
  const isProcessing = [BroadcastState.RUNNING, BroadcastState.PAUSED].includes(broadcastState);
  
  return (
    <div className="space-y-6">
      {/* WhatsApp Status & Message Composer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Custom Message Broadcast
            </div>
            {/* WhatsApp Status Indicator */}
            <div className="flex items-center gap-2">
              {whatsAppAvailable === null && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Checking...
                </Badge>
              )}
              {whatsAppAvailable === true && (
                <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                  <CheckCircle className="h-3 w-3" />
                  WhatsApp Ready
                </Badge>
              )}
              {whatsAppAvailable === false && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  WhatsApp Not Found
                </Badge>
              )}
              {isFullyAutomated && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-blue-600 text-white">
                  <Settings className="h-3 w-3" />
                  Full Auto
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Automation Status Info */}
          {whatsAppAvailable === false && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-900">WhatsApp Desktop Required</span>
              </div>
              <p className="text-sm text-red-700">
                Please install WhatsApp Desktop app to use bulk messaging. 
                <a href="https://www.whatsapp.com/download" target="_blank" rel="noopener noreferrer" className="underline ml-1">
                  Download here
                </a>
              </p>
            </div>
          )}
          
          {isFullyAutomated && whatsAppAvailable && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Full Automation Enabled</span>
              </div>
              <p className="text-sm text-blue-700">
                Messages will be automatically sent without manual confirmation in WhatsApp. 
                Each message will open and send automatically with a {config.interval}s delay.
              </p>
            </div>
          )}
          
          {!isFullyAutomated && whatsAppAvailable && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-900">Manual Mode</span>
              </div>
              <p className="text-sm text-orange-700">
                WhatsApp will open for each student, but you'll need to manually press Enter to send each message.
              </p>
            </div>
          )}

          {/* Message Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Message to Send *</Label>
              <span className={`text-sm ${getCharacterCountColor()}`}>
                {characterCount} characters
                {characterCount > 1400 && ' (Too long for WhatsApp)'}
              </span>
            </div>
            <Textarea
              id="message"
              placeholder="Type your custom message here..."
              value={config.message}
              onChange={(e) => setConfig(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              className="resize-none"
            />
          </div>
          
          {/* Personalization Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="personalization">Use Personalization Placeholders</Label>
              <p className="text-sm text-muted-foreground">
                Replace {'{name}'}, {'{fatherName}'}, {'{seat}'}, {'{shift}'}, {'{dueAmount}'}, {'{month}'} with student data
              </p>
            </div>
            <Switch
              id="personalization"
              checked={config.usePersonalization}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, usePersonalization: checked }))}
            />
          </div>
          
          {/* Audience Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Audience ({filteredStudents.length} students)
            </Label>
            <Select 
              value={config.audience} 
              onValueChange={(value) => setConfig(prev => ({ ...prev, audience: value as StudentFilter }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={StudentFilter.ALL}>All Students ({students.length})</SelectItem>
                <SelectItem value={StudentFilter.MORNING}>Morning Shift Only</SelectItem>
                <SelectItem value={StudentFilter.EVENING}>Evening Shift Only</SelectItem>
                <SelectItem value={StudentFilter.FULL_TIME}>Full-time Only</SelectItem>
                <SelectItem value={StudentFilter.DUE_FEES}>Due Fees Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dry Run Toggle */}
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <TestTube className="h-4 w-4" />
              <div className="flex-1">
                <Label>Dry Run Mode</Label>
                <p className="text-xs text-muted-foreground">Test without sending</p>
              </div>
              <Switch checked={isDryRun} onCheckedChange={setIsDryRun} />
            </div>
            
            {/* Main Broadcast Button */}
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={!config.message.trim() || filteredStudents.length === 0 || isProcessing}
              className="h-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <Send className="h-4 w-4 mr-2" />
              {isDryRun ? 'Dry Run' : 'Send to All'} ({filteredStudents.length} Students)
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Broadcast Controls & Progress */}
      {isProcessing && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {isDryRun ? 'Dry Run' : 'Broadcast'} Progress
              </div>
              <div className="flex gap-2">
                {broadcastState === BroadcastState.RUNNING && (
                  <Button size="sm" variant="outline" onClick={pauseBroadcast}>
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                )}
                {broadcastState === BroadcastState.PAUSED && (
                  <Button size="sm" variant="outline" onClick={resumeBroadcast}>
                    <Play className="h-4 w-4 mr-1" />
                    Resume
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={cancelBroadcast}>
                  <Square className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {stats.processed} / {stats.total}</span>
                <span>{Math.round((stats.processed / stats.total) * 100)}%</span>
              </div>
              <Progress value={(stats.processed / stats.total) * 100} className="h-2" />
            </div>
            
            {/* Status Counters */}
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">{stats.sent}</div>
                <div className="text-xs text-green-600">Sent</div>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <div className="text-xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-xs text-red-600">Failed</div>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <div className="text-xl font-bold text-orange-600">{stats.skipped}</div>
                <div className="text-xs text-orange-600">Skipped</div>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">{stats.remaining}</div>
                <div className="text-xs text-blue-600">Remaining</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Real-time Results Table */}
      {queue.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Results ({queue.length} students)
              </CardTitle>
              <Button variant="outline" onClick={downloadLogsAsCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {queue.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      <Badge 
                        variant={
                          item.status === SendStatus.SENT ? 'default' :
                          item.status === SendStatus.FAILED ? 'destructive' :
                          item.status === SendStatus.SKIPPED ? 'secondary' :
                          'outline'
                        }
                      >
                        {item.status === SendStatus.SENT && <CheckCircle className="h-3 w-3 mr-1" />}
                        {item.status === SendStatus.FAILED && <XCircle className="h-3 w-3 mr-1" />}
                        {item.status === SendStatus.SENDING && <Clock className="h-3 w-3 mr-1" />}
                        {item.status === SendStatus.SKIPPED && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.phoneRaw}</p>
                    {item.error && (
                      <p className="text-xs text-red-600">{item.error}</p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(item.lastUpdate).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Test Send Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Send
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter phone number for testing"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={testSend}
              disabled={!testPhone.trim() || !config.message.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Test Send
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Send the current message to a specific number for testing
          </p>
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isDryRun ? '🧪 Confirm Dry Run' : '📢 Confirm Broadcast'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Summary */}
            <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-lg font-semibold">
                {isDryRun ? 'Simulate sending' : 'Send'} to <span className="text-primary">{filteredStudents.length} students</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Estimated duration: ~{Math.ceil((filteredStudents.length * config.interval) / 60)} minutes
              </p>
            </div>
            
            {/* Sample Messages */}
            {config.usePersonalization && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Sample personalized messages:</Label>
                {getPreviewMessages().map((preview, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium text-primary">{preview.student}:</p>
                    <p className="text-sm mt-1">{preview.message.slice(0, 200)}{preview.message.length > 200 ? '...' : ''}</p>
                  </div>
                ))}
              </div>
            )}
            
            {!config.usePersonalization && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Message (same for everyone):</Label>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{config.message.slice(0, 300)}{config.message.length > 300 ? '...' : ''}</p>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={startBroadcast}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {isDryRun ? '🧪 Start Dry Run' : '🚀 Yes, Send to All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp QR Code Dialog - Placeholder for future automation */}
      {showQRCode && (
        <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect WhatsApp</DialogTitle>
            </DialogHeader>
            <div className="text-center p-6">
              <p>QR Code authentication would appear here for real WhatsApp automation.</p>
              <p className="text-sm text-muted-foreground mt-2">Currently using deep-link method.</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
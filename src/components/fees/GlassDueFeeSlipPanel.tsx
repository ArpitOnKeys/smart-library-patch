import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { studentDb, feePaymentDb } from '@/lib/database';
import { Student, FeePayment } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Search, AlertTriangle, TrendingDown, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface StudentDueInfo extends Student {
  totalPaid: number;
  totalDue: number;
  monthsRegistered: number;
  lastPaymentDate?: string;
  isOverdue: boolean;
}

interface GlassDueFeeSlipPanelProps {
  onReminderSent: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
  }
};

const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  },
  hover: {
    scale: 1.01,
    backgroundColor: "hsl(var(--primary) / 0.05)",
    transition: { duration: 0.2 }
  }
};

export const GlassDueFeeSlipPanel = ({ onReminderSent }: GlassDueFeeSlipPanelProps) => {
  const [students, setStudents] = useState<StudentDueInfo[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentDueInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [showOnlyDue, setShowOnlyDue] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStudentsWithDues();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, selectedShift, showOnlyDue]);

  const loadStudentsWithDues = async () => {
    setIsLoading(true);
    // Simulate loading delay for smooth animation
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const allStudents = studentDb.getAll();
    const studentsWithDues: StudentDueInfo[] = allStudents.map(student => {
      const payments = feePaymentDb.getByStudentId(student.id);
      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      const admissionDate = new Date(student.admissionDate);
      const currentDate = new Date();
      const monthsRegistered = (currentDate.getFullYear() - admissionDate.getFullYear()) * 12 + 
                              (currentDate.getMonth() - admissionDate.getMonth()) + 1;
      
      const totalExpected = student.monthlyFees * Math.max(monthsRegistered, 1);
      const totalDue = Math.max(totalExpected - totalPaid, 0);
      
      const lastPayment = payments.sort((a, b) => 
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      )[0];
      
      return {
        ...student,
        totalPaid,
        totalDue,
        monthsRegistered: Math.max(monthsRegistered, 1),
        lastPaymentDate: lastPayment?.paymentDate,
        isOverdue: totalDue > 0
      };
    });

    setStudents(studentsWithDues);
    setIsLoading(false);
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.contact.includes(searchTerm) ||
        student.seatNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedShift !== 'all') {
      filtered = filtered.filter(student => student.shift === selectedShift);
    }

    if (showOnlyDue) {
      filtered = filtered.filter(student => student.isOverdue);
    }

    setFilteredStudents(filtered);
  };

  const sendWhatsAppReminder = async (student: StudentDueInfo) => {
    const currentMonth = format(new Date(), 'MMMM yyyy');
    const message = `Dear ${student.name}, your fee of ₹${student.totalDue} for ${currentMonth} is due. Please pay soon. - PATCH Library`;
    
    const whatsappUrl = `https://wa.me/91${student.contact}?text=${encodeURIComponent(message)}`;
    
    try {
      const { storage } = await import('@/lib/database');
      const logs = storage.get('patch_whatsapp_logs');
      const newLog = {
        id: Date.now().toString(),
        studentId: student.id,
        studentName: student.name,
        message,
        amount: student.totalDue,
        sentAt: new Date().toISOString(),
        status: 'sent' as const
      };
      logs.push(newLog);
      storage.set('patch_whatsapp_logs', logs);
      
      window.open(whatsappUrl, '_blank');
      
      toast({
        title: 'WhatsApp Opened',
        description: `Reminder prepared for ${student.name}. Please send the message manually.`,
      });
      
      onReminderSent();
      
    } catch (error) {
      console.error('Error preparing WhatsApp reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to prepare WhatsApp reminder.',
        variant: 'destructive',
      });
    }
  };

  const dueStudentsCount = students.filter(s => s.isOverdue).length;
  const totalDueAmount = students.reduce((sum, s) => sum + s.totalDue, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="glass-card h-32"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Summary Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard variant="highlight" glowColor="primary">
          <GlassCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Total Due Students</p>
                <p className="text-3xl font-bold text-gradient-sunset">{dueStudentsCount}</p>
              </div>
              <div className="glass-panel p-3 rounded-full bg-destructive/20">
                <Users className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard variant="highlight" glowColor="secondary">
          <GlassCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Total Due Amount</p>
                <p className="text-3xl font-bold text-gradient-blossom">₹{totalDueAmount}</p>
              </div>
              <div className="glass-panel p-3 rounded-full bg-secondary/20">
                <TrendingDown className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard variant="highlight" glowColor="accent">
          <GlassCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Active Students</p>
                <p className="text-3xl font-bold text-gradient-nature">{students.length}</p>
              </div>
              <div className="glass-panel p-3 rounded-full bg-accent/20">
                <Clock className="h-6 w-6 text-accent" />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </motion.div>

      {/* Main Panel */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-3" gradient="sunset">
              <motion.div
                className="glass-panel p-2 rounded-full bg-primary/20"
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ duration: 0.2 }}
              >
                <AlertTriangle className="h-5 w-5 text-primary" />
              </motion.div>
              Due Fee Students Overview
            </GlassCardTitle>
            <GlassCardDescription>
              Track pending fees and send WhatsApp reminders to students
            </GlassCardDescription>
          </GlassCardHeader>
          
          <GlassCardContent>
            {/* Filters */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants} className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                  <Input
                    placeholder="Search by name, contact, or seat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 glass-panel bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="space-y-2">
                <Label>Shift Filter</Label>
                <Select value={selectedShift} onValueChange={setSelectedShift}>
                  <SelectTrigger className="glass-panel bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-panel bg-black/80 border-white/20">
                    <SelectItem value="all">All Shifts</SelectItem>
                    <SelectItem value="Morning">Morning</SelectItem>
                    <SelectItem value="Evening">Evening</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
              
              <motion.div variants={itemVariants} className="space-y-2">
                <Label>Show Only Due</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={showOnlyDue}
                    onCheckedChange={setShowOnlyDue}
                  />
                  <span className="text-sm text-white/70">Pending fees only</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Students Table */}
            <motion.div
              className="glass-panel border border-white/20 rounded-2xl overflow-hidden"
              variants={itemVariants}
            >
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white/80">Student Name</TableHead>
                    <TableHead className="text-white/80">Contact</TableHead>
                    <TableHead className="text-white/80">Seat No.</TableHead>
                    <TableHead className="text-white/80">Shift</TableHead>
                    <TableHead className="text-white/80">Monthly Fee</TableHead>
                    <TableHead className="text-white/80">Total Paid</TableHead>
                    <TableHead className="text-white/80">Total Due</TableHead>
                    <TableHead className="text-white/80">Last Payment</TableHead>
                    <TableHead className="text-white/80">Status</TableHead>
                    <TableHead className="text-right text-white/80">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="wait">
                    {filteredStudents.length === 0 ? (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <TableCell colSpan={10} className="text-center text-white/60 py-8">
                          <div className="flex flex-col items-center gap-3">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                              <Search className="h-8 w-8 text-white/40" />
                            </motion.div>
                            <span>No students found matching the criteria.</span>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ) : (
                      filteredStudents.map((student, index) => (
                        <motion.tr
                          key={student.id}
                          variants={tableRowVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover="hover"
                          transition={{ delay: index * 0.05 }}
                          className="border-white/10 cursor-pointer"
                        >
                          <TableCell className="font-medium text-white">{student.name}</TableCell>
                          <TableCell className="text-white/80">{student.contact}</TableCell>
                          <TableCell className="text-white/80">{student.seatNumber}</TableCell>
                          <TableCell>
                            <Badge variant={student.shift === 'Morning' ? 'default' : 'secondary'}>
                              {student.shift}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white/80">₹{student.monthlyFees}</TableCell>
                          <TableCell className="text-accent font-medium">₹{student.totalPaid}</TableCell>
                          <TableCell className={student.totalDue > 0 ? 'text-destructive font-medium' : 'text-accent'}>
                            ₹{student.totalDue}
                          </TableCell>
                          <TableCell className="text-white/80">
                            {student.lastPaymentDate 
                              ? format(new Date(student.lastPaymentDate), 'dd/MM/yyyy')
                              : 'No payments'
                            }
                          </TableCell>
                          <TableCell>
                            {student.isOverdue ? (
                              <Badge variant="destructive">Due</Badge>
                            ) : (
                              <Badge variant="default">Paid</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {student.isOverdue && (
                              <GlassButton
                                variant="glass-primary"
                                size="sm"
                                onClick={() => sendWhatsAppReminder(student)}
                                ripple={true}
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Send Reminder
                              </GlassButton>
                            )}
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </motion.div>
          </GlassCardContent>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { studentDb, feePaymentDb } from '@/lib/database';
import { Student, FeePayment } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Search, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface StudentDueInfo extends Student {
  totalPaid: number;
  totalDue: number;
  monthsRegistered: number;
  lastPaymentDate?: string;
  isOverdue: boolean;
}

interface DueFeeSlipPanelProps {
  onReminderSent: () => void;
}

export const DueFeeSlipPanel = ({ onReminderSent }: DueFeeSlipPanelProps) => {
  const [students, setStudents] = useState<StudentDueInfo[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentDueInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [showOnlyDue, setShowOnlyDue] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStudentsWithDues();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, selectedShift, showOnlyDue]);

  const loadStudentsWithDues = () => {
    const allStudents = studentDb.getAll();
    const studentsWithDues: StudentDueInfo[] = allStudents.map(student => {
      const payments = feePaymentDb.getByStudentId(student.id);
      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      // Calculate months registered since admission
      const admissionDate = new Date(student.admissionDate);
      const currentDate = new Date();
      const monthsRegistered = (currentDate.getFullYear() - admissionDate.getFullYear()) * 12 + 
                              (currentDate.getMonth() - admissionDate.getMonth()) + 1;
      
      const totalExpected = student.monthlyFees * Math.max(monthsRegistered, 1);
      const totalDue = Math.max(totalExpected - totalPaid, 0);
      
      // Get last payment date
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
  };

  const filterStudents = () => {
    let filtered = students;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.contact.includes(searchTerm) ||
        student.seatNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by shift
    if (selectedShift !== 'all') {
      filtered = filtered.filter(student => student.shift === selectedShift);
    }

    // Filter by due status
    if (showOnlyDue) {
      filtered = filtered.filter(student => student.isOverdue);
    }

    setFilteredStudents(filtered);
  };

  const sendWhatsAppReminder = async (student: StudentDueInfo) => {
    const currentMonth = format(new Date(), 'MMMM yyyy');
    const message = `Dear ${student.name}, your fee of ₹${student.totalDue} for ${currentMonth} is due. Please pay soon. - PATCH Library`;
    
    const cleanedPhone = student.contact.replace(/\D/g, '');
    const phoneNumber = cleanedPhone.startsWith('91') ? cleanedPhone : '91' + cleanedPhone;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    try {
      // Log the reminder attempt
      const { storage } = await import('@/lib/database');
      const logs = storage.get('patch_whatsapp_logs') || [];
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
      
      // Create and click a temporary link to open WhatsApp
      const link = document.createElement('a');
      link.href = whatsappUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'WhatsApp Opened',
        description: `Reminder sent to ${student.name} successfully.`,
      });
      
      onReminderSent();
      
    } catch (error) {
      console.error('Error preparing WhatsApp reminder:', error);
      
      // Fallback: copy URL to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(whatsappUrl);
          toast({
            title: 'WhatsApp URL Copied',
            description: 'The WhatsApp link has been copied to clipboard.',
          });
        } catch (clipboardError) {
          toast({
            title: 'Error',
            description: 'Failed to prepare WhatsApp reminder.',
            variant: 'destructive',
          });
        }
      }
    }
  };

  const dueStudentsCount = students.filter(s => s.isOverdue).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Due Fee Students Overview
          </CardTitle>
          <CardDescription>
            Total students with pending fees: <Badge variant="destructive">{dueStudentsCount}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, contact, or seat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Shift Filter</Label>
              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shifts</SelectItem>
                  <SelectItem value="Morning">Morning</SelectItem>
                  <SelectItem value="Evening">Evening</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Show Only Due</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showOnlyDue}
                  onCheckedChange={setShowOnlyDue}
                />
                <span className="text-sm">Pending fees only</span>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Seat No.</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Monthly Fee</TableHead>
                  <TableHead>Total Paid</TableHead>
                  <TableHead>Total Due</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      No students found matching the criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.contact}</TableCell>
                      <TableCell>{student.seatNumber}</TableCell>
                      <TableCell>
                        <Badge variant={student.shift === 'Morning' ? 'default' : 'secondary'}>
                          {student.shift}
                        </Badge>
                      </TableCell>
                      <TableCell>₹{student.monthlyFees}</TableCell>
                      <TableCell className="text-green-600">₹{student.totalPaid}</TableCell>
                      <TableCell className={student.totalDue > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                        ₹{student.totalDue}
                      </TableCell>
                      <TableCell>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendWhatsAppReminder(student)}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Send Reminder
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

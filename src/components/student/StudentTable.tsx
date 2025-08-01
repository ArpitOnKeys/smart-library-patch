
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { studentDb } from '@/lib/database';
import { Student } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, Trash2, Users, Eye, Download, FileSpreadsheet, QrCode } from 'lucide-react';
import { StudentEditForm } from './StudentEditForm';
import { StudentProfileModal } from './StudentProfileModal';
import { StudentQRGenerator } from './StudentQRGenerator';
import { exportAllStudentsCSV, exportMultipleStudentsPDF } from '@/utils/exportUtils';

interface StudentTableProps {
  refreshTrigger: number;
  onStudentUpdated: () => void;
}

export const StudentTable = ({ refreshTrigger, onStudentUpdated }: StudentTableProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [qrStudent, setQrStudent] = useState<Student | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, [refreshTrigger]);

  const loadStudents = () => {
    const allStudents = studentDb.getAll();
    setStudents(allStudents);
  };

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    
    return students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.contact.includes(searchTerm) ||
      student.seatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fatherName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleViewProfile = (student: Student) => {
    setSelectedStudent(student);
    setIsProfileModalOpen(true);
  };

  const handleShowQR = (student: Student) => {
    setQrStudent(student);
    setIsQrDialogOpen(true);
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleExportSelected = async () => {
    const studentsToExport = students.filter(s => selectedStudents.has(s.id));
    if (studentsToExport.length === 0) {
      toast({
        title: 'No Students Selected',
        description: 'Please select at least one student to export.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await exportMultipleStudentsPDF(studentsToExport);
      toast({
        title: 'Export Successful',
        description: `${studentsToExport.length} student profiles exported successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export student profiles. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExportAllCSV = () => {
    try {
      exportAllStudentsCSV();
      toast({
        title: 'CSV Export Successful',
        description: 'All student data exported to CSV successfully.',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export CSV. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (student: Student) => {
    if (window.confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) {
      const success = studentDb.delete(student.id);
      if (success) {
        toast({
          title: 'Student Deleted',
          description: `${student.name} has been removed from the system.`,
        });
        loadStudents();
        onStudentUpdated();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete student. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleStudentUpdated = () => {
    loadStudents();
    setIsEditDialogOpen(false);
    setEditingStudent(null);
    onStudentUpdated();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Student Data Management
        </CardTitle>
        <CardDescription>
          View, search, edit, and manage all registered students
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search Bar and Export Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, contact, seat number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Badge variant="secondary" className="px-3 py-2">
                {filteredStudents.length} Students
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedStudents.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSelected}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Selected ({selectedStudents.size})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAllCSV}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Students Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Monthly Fees</TableHead>
                  <TableHead>Admission Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {searchTerm ? 'No students found matching your search.' : 'No students registered yet.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} className={selectedStudents.has(student.id) ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student.id)}
                          onChange={(e) => handleSelectStudent(student.id, e.target.checked)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.profilePicture} alt={student.name} />
                            <AvatarFallback className="text-xs">
                              {student.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {student.enrollmentNo} • Seat {student.seatNumber}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.contact}</TableCell>
                      <TableCell>
                        <Badge variant={student.shift === 'Morning' ? 'default' : 'secondary'}>
                          {student.shift}
                        </Badge>
                      </TableCell>
                      <TableCell>₹{student.monthlyFees}</TableCell>
                      <TableCell>{new Date(student.admissionDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewProfile(student)}
                            title="View Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(student)}
                            title="Edit Student"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowQR(student)}
                            title="Generate QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(student)}
                            className="text-destructive hover:text-destructive"
                            title="Delete Student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Student Information</DialogTitle>
              <DialogDescription>
                Update the student's details below. Make sure all information is accurate.
              </DialogDescription>
            </DialogHeader>
            {editingStudent && (
              <StudentEditForm
                student={editingStudent}
                onStudentUpdated={handleStudentUpdated}
                onCancel={() => setIsEditDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Profile Modal */}
        <StudentProfileModal
          student={selectedStudent}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onStudentUpdated={() => {
            handleStudentUpdated();
            setIsProfileModalOpen(false);
          }}
        />

        {/* QR Code Dialog */}
        <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Student QR Code</DialogTitle>
              <DialogDescription>
                Generate and download QR code for quick student identification.
              </DialogDescription>
            </DialogHeader>
            {qrStudent && <StudentQRGenerator student={qrStudent} />}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

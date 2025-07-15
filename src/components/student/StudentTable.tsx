
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { studentDb } from '@/lib/database';
import { Student } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, Trash2, Users } from 'lucide-react';
import { StudentEditForm } from './StudentEditForm';

interface StudentTableProps {
  refreshTrigger: number;
  onStudentUpdated: () => void;
}

export const StudentTable = ({ refreshTrigger, onStudentUpdated }: StudentTableProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
          {/* Search Bar */}
          <div className="flex items-center space-x-2">
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

          {/* Students Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seat No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Father's Name</TableHead>
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
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {searchTerm ? 'No students found matching your search.' : 'No students registered yet.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.seatNumber}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.fatherName}</TableCell>
                      <TableCell>{student.contact}</TableCell>
                      <TableCell>
                        <Badge variant={student.shift === 'Morning' ? 'default' : 'secondary'}>
                          {student.shift}
                        </Badge>
                      </TableCell>
                      <TableCell>₹{student.monthlyFees}</TableCell>
                      <TableCell>{new Date(student.admissionDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(student)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(student)}
                            className="text-destructive hover:text-destructive"
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
      </CardContent>
    </Card>
  );
};

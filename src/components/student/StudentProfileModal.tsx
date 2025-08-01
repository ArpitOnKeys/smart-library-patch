import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Student } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { 
  Edit, 
  Trash2, 
  Download, 
  CreditCard, 
  User, 
  Phone, 
  MapPin, 
  Calendar,
  Clock,
  DollarSign,
  Users,
  Hash
} from 'lucide-react';
import { StudentEditForm } from './StudentEditForm';
import { exportStudentProfile, exportStudentIDCard } from '@/utils/exportUtils';
import { studentDb } from '@/lib/database';

interface StudentProfileModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onStudentUpdated: () => void;
}

export const StudentProfileModal = ({ 
  student, 
  isOpen, 
  onClose, 
  onStudentUpdated 
}: StudentProfileModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  if (!student) return null;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) {
      const success = studentDb.delete(student.id);
      if (success) {
        toast({
          title: 'Student Deleted',
          description: `${student.name} has been removed from the system.`,
        });
        onStudentUpdated();
        onClose();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete student. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleExportProfile = async () => {
    setIsExporting(true);
    try {
      await exportStudentProfile(student);
      toast({
        title: 'Profile Exported',
        description: 'Student profile has been exported successfully.',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export student profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportIDCard = async () => {
    setIsExporting(true);
    try {
      await exportStudentIDCard(student);
      toast({
        title: 'ID Card Generated',
        description: 'Student ID card has been generated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to generate ID card. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleStudentUpdated = () => {
    setIsEditing(false);
    onStudentUpdated();
  };

  if (isEditing) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student Information</DialogTitle>
          </DialogHeader>
          <StudentEditForm
            student={student}
            onStudentUpdated={handleStudentUpdated}
            onCancel={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Student Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section with Avatar and Basic Info */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={student.profilePicture} alt={student.name} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {student.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <h3 className="text-3xl font-bold text-primary">{student.name}</h3>
                  <p className="text-lg text-muted-foreground">{student.fatherName}</p>
                  <div className="flex gap-4">
                    <Badge variant="default" className="text-sm">
                      {student.enrollmentNo}
                    </Badge>
                    <Badge variant={student.shift === 'Morning' ? 'default' : 'secondary'} className="text-sm">
                      {student.shift} Shift
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      Seat {student.seatNumber}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={handleEdit} className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleExportProfile}
                    disabled={isExporting}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleExportIDCard}
                    disabled={isExporting}
                    className="w-full"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Generate ID Card
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDelete}
                    className="w-full text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{student.contact}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Aadhar Number</p>
                    <p className="font-medium">{student.aadharNumber}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{student.address}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium">{student.gender}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Timing</p>
                    <p className="font-medium">{student.timing}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Joining Date</p>
                    <p className="font-medium">{new Date(student.joiningDate).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Admission Date</p>
                    <p className="font-medium">{new Date(student.admissionDate).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned Staff</p>
                    <p className="font-medium">{student.assignedStaff}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fee Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Fee Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Fees</p>
                    <p className="font-medium text-lg">₹{student.monthlyFees}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fees Paid Till</p>
                    <p className="font-medium">{new Date(student.feesPaidTill).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Mode</p>
                    <Badge variant="outline">{student.paymentMode}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Student ID</p>
                    <p className="font-mono text-xs">{student.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created At</p>
                    <p className="font-medium">{new Date(student.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{new Date(student.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
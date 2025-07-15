
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { studentDb } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';

const admissionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  fatherName: z.string().min(2, 'Father\'s name must be at least 2 characters'),
  contact: z.string().regex(/^[6-9]\d{9}$/, 'Contact must be a valid 10-digit Indian mobile number'),
  aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar number must be exactly 12 digits'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  shift: z.enum(['Morning', 'Evening'], { required_error: 'Please select a shift' }),
  monthlyFees: z.string().min(1, 'Monthly fees is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Monthly fees must be a positive number'
  ),
  seatNumber: z.string().min(1, 'Seat number is required'),
});

type AdmissionFormData = z.infer<typeof admissionSchema>;

interface AdmissionFormProps {
  onStudentAdded: () => void;
}

export const AdmissionForm = ({ onStudentAdded }: AdmissionFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<AdmissionFormData>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      name: '',
      fatherName: '',
      contact: '',
      aadharNumber: '',
      address: '',
      shift: undefined,
      monthlyFees: '',
      seatNumber: '',
    },
  });

  const onSubmit = async (data: AdmissionFormData) => {
    setIsSubmitting(true);
    
    try {
      // Check if seat number already exists
      const existingStudents = studentDb.getAll();
      const seatExists = existingStudents.some(
        student => student.seatNumber.toLowerCase() === data.seatNumber.toLowerCase()
      );
      
      if (seatExists) {
        toast({
          title: 'Error',
          description: 'Seat number already exists. Please choose a different seat number.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Check if Aadhar number already exists
      const aadharExists = existingStudents.some(
        student => student.aadharNumber === data.aadharNumber
      );
      
      if (aadharExists) {
        toast({
          title: 'Error',
          description: 'Aadhar number already exists. Student may already be registered.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Create new student
      const newStudent = studentDb.create({
        name: data.name,
        fatherName: data.fatherName,
        contact: data.contact,
        aadharNumber: data.aadharNumber,
        address: data.address,
        shift: data.shift,
        monthlyFees: Number(data.monthlyFees),
        seatNumber: data.seatNumber,
        admissionDate: new Date().toISOString(),
      });

      toast({
        title: 'Success!',
        description: `Student ${newStudent.name} has been successfully admitted with Seat No: ${newStudent.seatNumber}`,
      });

      form.reset();
      onStudentAdded();
      
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: 'Error',
        description: 'Failed to add student. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Student Admission Form
        </CardTitle>
        <CardDescription>
          Fill in the details below to register a new student
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter student's full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fatherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter father's name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aadharNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aadhar Number</FormLabel>
                    <FormControl>
                      <Input placeholder="123456789012" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shift"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Morning">Morning</SelectItem>
                        <SelectItem value="Evening">Evening</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monthlyFees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Fees (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seatNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seat Number</FormLabel>
                    <FormControl>
                      <Input placeholder="A1, B2, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter complete address"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full md:w-auto" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding Student...' : 'Add Student'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

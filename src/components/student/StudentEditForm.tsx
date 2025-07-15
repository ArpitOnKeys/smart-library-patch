
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { studentDb } from '@/lib/database';
import { Student } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

const editSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  fatherName: z.string().min(2, 'Father\'s name must be at least 2 characters'),
  contact: z.string().regex(/^[6-9]\d{9}$/, 'Contact must be a valid 10-digit Indian mobile number'),
  aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar number must be exactly 12 digits'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  shift: z.enum(['Morning', 'Evening']),
  monthlyFees: z.string().min(1, 'Monthly fees is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Monthly fees must be a positive number'
  ),
  seatNumber: z.string().min(1, 'Seat number is required'),
});

type EditFormData = z.infer<typeof editSchema>;

interface StudentEditFormProps {
  student: Student;
  onStudentUpdated: () => void;
  onCancel: () => void;
}

export const StudentEditForm = ({ student, onStudentUpdated, onCancel }: StudentEditFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: student.name,
      fatherName: student.fatherName,
      contact: student.contact,
      aadharNumber: student.aadharNumber,
      address: student.address,
      shift: student.shift,
      monthlyFees: student.monthlyFees.toString(),
      seatNumber: student.seatNumber,
    },
  });

  const onSubmit = async (data: EditFormData) => {
    setIsSubmitting(true);
    
    try {
      // Check if seat number already exists (excluding current student)
      const existingStudents = studentDb.getAll();
      const seatExists = existingStudents.some(
        s => s.id !== student.id && s.seatNumber.toLowerCase() === data.seatNumber.toLowerCase()
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

      // Check if Aadhar number already exists (excluding current student)
      const aadharExists = existingStudents.some(
        s => s.id !== student.id && s.aadharNumber === data.aadharNumber
      );
      
      if (aadharExists) {
        toast({
          title: 'Error',
          description: 'Aadhar number already exists. Please check the number.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Update student
      const updatedStudent = studentDb.update(student.id, {
        name: data.name,
        fatherName: data.fatherName,
        contact: data.contact,
        aadharNumber: data.aadharNumber,
        address: data.address,
        shift: data.shift,
        monthlyFees: Number(data.monthlyFees),
        seatNumber: data.seatNumber,
      });

      if (updatedStudent) {
        toast({
          title: 'Success!',
          description: `${updatedStudent.name}'s information has been updated successfully.`,
        });
        onStudentUpdated();
      } else {
        throw new Error('Failed to update student');
      }
      
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: 'Error',
        description: 'Failed to update student. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student Full Name</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  <Input {...field} />
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
                  <Input {...field} />
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
                  <Input {...field} />
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
                      <SelectValue />
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
                  <Input type="number" {...field} />
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
                  <Input {...field} />
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
                <Textarea className="min-h-[60px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Student'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

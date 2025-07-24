import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { studentDb } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Camera, ImageIcon, User, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Character limits for fields
const LIMITS = {
  name: 50,
  fatherName: 50,
  contact: 10,
  aadhar: 12,
  address: 200,
  timing: 30,
  staff: 50,
};

const admissionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(LIMITS.name),
  fatherName: z.string().min(2, 'Father\'s name must be at least 2 characters').max(LIMITS.fatherName),
  contact: z.string().regex(/^[6-9]\d{9}$/, 'Contact must be a valid 10-digit Indian mobile number'),
  aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar number must be exactly 12 digits'),
  address: z.string().min(10, 'Address must be at least 10 characters').max(LIMITS.address),
  gender: z.enum(['Male', 'Female'], { required_error: 'Please select gender' }),
  shift: z.enum(['Morning', 'Evening'], { required_error: 'Please select a shift' }),
  timing: z.string().min(1, 'Timing is required').max(LIMITS.timing),
  monthlyFees: z.string().min(1, 'Monthly fees is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Monthly fees must be a positive number'
  ),
  seatNumber: z.string().min(1, 'Seat number is required'),
  joiningDate: z.date({ required_error: 'Joining date is required' }),
  feesPaidTill: z.date({ required_error: 'Fees paid till date is required' }),
  assignedStaff: z.string().min(1, 'Staff assignment is required').max(LIMITS.staff),
  paymentMode: z.enum(['Cash', 'Online', 'UPI', 'Card'], { required_error: 'Please select payment mode' }),
});

type AdmissionFormData = z.infer<typeof admissionSchema>;

interface AdmissionFormProps {
  onStudentAdded: () => void;
}

export const AdmissionForm = ({ onStudentAdded }: AdmissionFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const form = useForm<AdmissionFormData>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      name: '',
      fatherName: '',
      contact: '',
      aadharNumber: '',
      address: '',
      gender: undefined,
      shift: undefined,
      timing: '',
      monthlyFees: '',
      seatNumber: '',
      joiningDate: new Date(),
      feesPaidTill: new Date(),
      assignedStaff: '',
      paymentMode: undefined,
    },
  });

  // Generate enrollment number
  const generateEnrollmentNo = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const students = studentDb.getAll();
    const nextNumber = (students.length + 1).toString().padStart(4, '0');
    return `PATCH${year}${nextNumber}`;
  };

  // Handle gallery upload
  const handleGalleryUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfilePicture(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: 'Invalid File',
          description: 'Please select a valid image file (PNG/JPG)',
          variant: 'destructive',
        });
      }
    }
  };

  // Start camera capture
  const startCamera = async () => {
    try {
      setIsCapturingPhoto(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      toast({
        title: 'Camera Error',
        description: 'Unable to access camera. Please check permissions.',
        variant: 'destructive',
      });
      setIsCapturingPhoto(false);
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context?.drawImage(video, 0, 0);
      const photoDataUrl = canvas.toDataURL('image/png');
      setProfilePicture(photoDataUrl);
      
      // Stop camera
      const stream = video.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsCapturingPhoto(false);
    }
  };

  // Cancel camera capture
  const cancelCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCapturingPhoto(false);
  };

  // Get character count for field
  const getCharCount = (fieldName: keyof typeof LIMITS, value: string) => {
    return `${value.length}/${LIMITS[fieldName]}`;
  };

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
        enrollmentNo: generateEnrollmentNo(),
        name: data.name,
        fatherName: data.fatherName,
        contact: data.contact,
        aadharNumber: data.aadharNumber,
        address: data.address,
        gender: data.gender,
        shift: data.shift,
        timing: data.timing,
        monthlyFees: Number(data.monthlyFees),
        seatNumber: data.seatNumber,
        joiningDate: data.joiningDate.toISOString(),
        feesPaidTill: data.feesPaidTill.toISOString(),
        assignedStaff: data.assignedStaff,
        paymentMode: data.paymentMode,
        profilePicture: profilePicture || undefined,
        admissionDate: new Date().toISOString(),
      });

      toast({
        title: 'Success!',
        description: `Student ${newStudent.name} has been successfully admitted with Enrollment No: ${newStudent.enrollmentNo}`,
      });

      form.reset();
      setProfilePicture(null);
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
    <Card className="max-w-6xl mx-auto">
      <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <UserPlus className="h-6 w-6 text-primary" />
          Student Admission Panel
        </CardTitle>
        <CardDescription className="text-base">
          PATCH – The Smart Library | Smart, Simple, Secure Library Management
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-border shadow-lg">
                  <AvatarImage src={profilePicture || ''} alt="Student Avatar" />
                  <AvatarFallback className="text-2xl bg-muted">
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  Gallery
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={startCamera}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Camera
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleGalleryUpload}
                className="hidden"
              />
            </div>

            {/* Camera Capture Modal */}
            {isCapturingPhoto && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold mb-4">Capture Photo</h3>
                  <video ref={videoRef} className="w-full rounded mb-4" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={cancelCamera}>
                      Cancel
                    </Button>
                    <Button onClick={capturePhoto}>
                      Capture
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Enter full name" 
                            className="pr-16" 
                            maxLength={LIMITS.name}
                            {...field} 
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                            {getCharCount('name', field.value)}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Father Name */}
                <FormField
                  control={form.control}
                  name="fatherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Father Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Enter father's name" 
                            className="pr-16" 
                            maxLength={LIMITS.fatherName}
                            {...field} 
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                            {getCharCount('fatherName', field.value)}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contact */}
                <FormField
                  control={form.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Contact</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="9876543210" 
                            className="pr-16" 
                            maxLength={LIMITS.contact}
                            {...field} 
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                            {getCharCount('contact', field.value)}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Aadhaar */}
                <FormField
                  control={form.control}
                  name="aadharNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Aadhaar</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="123456789012" 
                            className="pr-16" 
                            maxLength={LIMITS.aadhar}
                            {...field} 
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                            {getCharCount('aadhar', field.value)}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea 
                            placeholder="Enter complete address"
                            className="min-h-[80px] pr-16"
                            maxLength={LIMITS.address}
                            {...field} 
                          />
                          <span className="absolute right-3 bottom-2 text-xs text-muted-foreground">
                            {getCharCount('address', field.value)}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gender */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Gender</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-row space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Male" id="male" />
                            <label htmlFor="male" className="text-sm font-medium">Male</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Female" id="female" />
                            <label htmlFor="female" className="text-sm font-medium">Female</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Shift */}
                <FormField
                  control={form.control}
                  name="shift"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Shift</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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

                {/* Timing */}
                <FormField
                  control={form.control}
                  name="timing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Timing</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="e.g., 9:00 AM - 5:00 PM" 
                            className="pr-16" 
                            maxLength={LIMITS.timing}
                            {...field} 
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                            {getCharCount('timing', field.value)}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Monthly Fees */}
                <FormField
                  control={form.control}
                  name="monthlyFees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Monthly Fees</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="2000" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Select Seat */}
                <FormField
                  control={form.control}
                  name="seatNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Select Seat</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="A1, B2, etc." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Joining Date */}
                <FormField
                  control={form.control}
                  name="joiningDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Joining Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fees Paid Till */}
                <FormField
                  control={form.control}
                  name="feesPaidTill"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Fees Paid Till</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Enrollment No (Read-only) */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Enrollment No.
                </label>
                <Input 
                  value={generateEnrollmentNo()} 
                  readOnly 
                  className="bg-muted text-muted-foreground"
                />
              </div>

              {/* Staff */}
              <FormField
                control={form.control}
                name="assignedStaff"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Staff</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Arpit Upadhyay">Arpit Upadhyay</SelectItem>
                        <SelectItem value="Assistant 1">Assistant 1</SelectItem>
                        <SelectItem value="Assistant 2">Assistant 2</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Mode */}
              <FormField
                control={form.control}
                name="paymentMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Payment Mode</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Online">Online</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <Button 
                type="submit" 
                className="w-full max-w-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding Student...' : 'Submit'}
              </Button>
            </div>
          </form>
        </Form>
        
        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="font-semibold text-primary">Arpit Upadhyay</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { studentDb } from '@/lib/database';
import { Student, ReceiptData } from '@/types/database';
import { ReceiptTemplate } from './ReceiptTemplate';
import { 
  generateVisualReceiptPDF, 
  downloadTextReceipt, 
  createReceiptData,
  getReceiptSettings,
  saveReceiptSettings,
  logReceiptGeneration,
  ReceiptSettings
} from '@/utils/receiptGenerator';
import { 
  Eye, 
  Download, 
  FileText, 
  Settings, 
  Palette, 
  Upload,
  TestTube,
  RefreshCw
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const ReceiptPreviewPanel: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [previewData, setPreviewData] = useState<ReceiptData | null>(null);
  const [settings, setSettings] = useState<ReceiptSettings>(getReceiptSettings());
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [testAmount, setTestAmount] = useState('2500');
  const [testMonth, setTestMonth] = useState('January');
  const [testYear, setTestYear] = useState(new Date().getFullYear().toString());

  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      generatePreviewData();
    }
  }, [selectedStudent, testAmount, testMonth, testYear]);

  const loadStudents = () => {
    const allStudents = studentDb.getAll();
    setStudents(allStudents);
    if (allStudents.length > 0) {
      setSelectedStudent(allStudents[0]);
    }
  };

  const generatePreviewData = () => {
    if (!selectedStudent) return;

    const amount = parseFloat(testAmount) || selectedStudent.monthlyFees;
    const mockReceiptData = createReceiptData(
      selectedStudent,
      amount,
      testMonth,
      parseInt(testYear),
      amount * 3, // Mock total paid
      amount * 2, // Mock total due
      6 // Mock months registered
    );

    setPreviewData(mockReceiptData);
  };

  const handleGeneratePDF = async () => {
    if (!selectedStudent || !previewData) {
      toast({
        title: 'Error',
        description: 'Please select a student first',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      await generateVisualReceiptPDF(previewData, selectedStudent, settings);
      
      logReceiptGeneration(previewData, true);
      
      toast({
        title: 'Receipt Generated! 📄',
        description: 'PDF receipt has been downloaded successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logReceiptGeneration(previewData, false, errorMessage);
      
      toast({
        title: 'PDF Generation Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateTextReceipt = () => {
    if (!selectedStudent || !previewData) {
      toast({
        title: 'Error',
        description: 'Please select a student first',
        variant: 'destructive'
      });
      return;
    }

    try {
      downloadTextReceipt(previewData, selectedStudent);
      
      logReceiptGeneration(previewData, true);
      
      toast({
        title: 'Text Receipt Downloaded! 📝',
        description: 'Simple text receipt has been downloaded'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logReceiptGeneration(previewData, false, errorMessage);
      
      toast({
        title: 'Download Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const handleSaveSettings = () => {
    saveReceiptSettings(settings);
    toast({
      title: 'Settings Saved',
      description: 'Receipt settings have been updated successfully'
    });
    setShowSettings(false);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSettings(prev => ({ ...prev, logoUrl: e.target?.result as string }));
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: 'Invalid File',
          description: 'Please select a valid image file',
          variant: 'destructive'
        });
      }
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Receipt Preview & Testing
              </CardTitle>
              <CardDescription>
                Test receipt generation with live preview and customization
              </CardDescription>
            </div>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Receipt Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Library Name</Label>
                    <Input
                      value={settings.libraryName || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, libraryName: e.target.value }))}
                      placeholder="PATCH - THE SMART LIBRARY"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.accentColor || '#3b82f6'}
                        onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={settings.accentColor || '#3b82f6'}
                        onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                        placeholder="#3b82f6"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Library Logo</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="flex-1"
                      />
                      {settings.logoUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSettings(prev => ({ ...prev, logoUrl: undefined }))}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    {settings.logoUrl && (
                      <div className="mt-2">
                        <img src={settings.logoUrl} alt="Logo preview" className="h-12 w-12 rounded border" />
                      </div>
                    )}
                  </div>

                  <Button onClick={handleSaveSettings} className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Test Student</Label>
              <Select
                value={selectedStudent?.id || ''}
                onValueChange={(value) => {
                  const student = students.find(s => s.id === value);
                  setSelectedStudent(student || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.enrollmentNo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Test Amount (₹)</Label>
              <Input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                placeholder="2500"
              />
            </div>

            <div className="space-y-2">
              <Label>Test Month</Label>
              <Select value={testMonth} onValueChange={setTestMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Test Year</Label>
              <Select value={testYear} onValueChange={setTestYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 flex-wrap">
            <Button 
              onClick={handleGeneratePDF}
              disabled={!selectedStudent || isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isGenerating ? 'Generating PDF...' : 'Download Styled PDF'}
            </Button>

            <Button 
              variant="outline"
              onClick={handleGenerateTextReceipt}
              disabled={!selectedStudent}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Download Text Receipt
            </Button>

            <Button 
              variant="outline"
              onClick={generatePreviewData}
              disabled={!selectedStudent}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Preview
            </Button>
          </div>

          {/* Current Settings Display */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-3">Current Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Library Name:</span>
                <div className="font-medium">{settings.libraryName || 'PATCH - THE SMART LIBRARY'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Accent Color:</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: settings.accentColor || '#3b82f6' }}
                  />
                  <span className="font-medium">{settings.accentColor || '#3b82f6'}</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Logo:</span>
                <div className="font-medium">
                  {settings.logoUrl ? 'Custom Logo' : 'Default Icon'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      {selectedStudent && previewData && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Live Receipt Preview
            </CardTitle>
            <CardDescription>
              Preview how the receipt will look when generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-white max-h-96 overflow-auto">
              <div className="transform scale-50 origin-top-left">
                <ReceiptTemplate
                  receiptData={previewData}
                  student={selectedStudent}
                  receiptNumber={previewData.receiptNumber}
                  logoUrl={settings.logoUrl}
                  accentColor={settings.accentColor}
                />
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 This is a 50% scaled preview. The actual PDF will be full-size and print-ready.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receipt Generation Logs */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Receipt Generation</CardTitle>
          <CardDescription>
            Track recent receipt generation attempts and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReceiptGenerationLogs />
        </CardContent>
      </Card>
    </div>
  );
};

// Component to show receipt generation logs
const ReceiptGenerationLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('patch_receipt_logs');
    if (stored) {
      setLogs(JSON.parse(stored).slice(0, 10)); // Show last 10 logs
    }
  }, []);

  if (logs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No receipt generation logs yet</p>
        <p className="text-sm">Generate a test receipt to see logs here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{log.studentName}</span>
              <Badge variant={log.success ? 'default' : 'destructive'}>
                {log.success ? 'Success' : 'Failed'}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Receipt: {log.receiptNumber} • Amount: ₹{log.amount}
            </div>
            {log.errorMessage && (
              <div className="text-xs text-red-600 mt-1">
                Error: {log.errorMessage}
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(log.timestamp).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};
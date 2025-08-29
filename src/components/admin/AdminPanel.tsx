import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Download, 
  Upload, 
  Moon, 
  Sun, 
  Database, 
  Shield, 
  Palette, 
  Bell,
  Save,
  RefreshCw,
  FileText,
  Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { storage, studentDb, feePaymentDb, expenseDb, auth } from '@/lib/database';
import { ReceiptTestPanel } from '@/components/receipts/ReceiptTestPanel';

interface AppSettings {
  defaultMonthlyFee: number;
  lateFeeAmount: number;
  reminderDays: number;
  autoBackup: boolean;
  darkMode: boolean;
  notifications: boolean;
  libraryFinePerDay: number;
  maxBooksPerStudent: number;
  libraryName: string;
  adminEmail: string;
}

export const AdminPanel = () => {
  const [settings, setSettings] = useState<AppSettings>({
    defaultMonthlyFee: 2500,
    lateFeeAmount: 100,
    reminderDays: 5,
    autoBackup: true,
    darkMode: false,
    notifications: true,
    libraryFinePerDay: 10,
    maxBooksPerStudent: 3,
    libraryName: 'PATCH - The Smart Library',
    adminEmail: 'admin@patchlibrary.com'
  });

  const [backupProgress, setBackupProgress] = useState(false);
  const [stats, setStats] = useState({
    totalData: 0,
    lastBackup: '2024-01-20 14:30:00'
  });

  // Security settings state
  const [securityQuestion, setSecurityQuestion] = useState(auth.getSecurityQuestion());
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const handleSaveSettings = () => {
    try {
      storage.setSingle('app_settings', settings);
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    }
  };

  const handleExportData = async () => {
    setBackupProgress(true);
    try {
      const students = studentDb.getAll();
      const payments = feePaymentDb.getAll();
      const expenses = expenseDb.getAll();

      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {
          students,
          payments,
          expenses,
          settings
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patch-library-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStats(prev => ({
        ...prev,
        lastBackup: new Date().toLocaleString()
      }));

      toast({
        title: "Export Complete",
        description: "Your data has been exported successfully"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive"
      });
    }
    setBackupProgress(false);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        
        if (backupData.data) {
          // Import students
          if (backupData.data.students) {
            storage.set('patch_students', backupData.data.students);
          }
          
          // Import payments
          if (backupData.data.payments) {
            storage.set('patch_fee_payments', backupData.data.payments);
          }
          
          // Import expenses
          if (backupData.data.expenses) {
            storage.set('patch_expenses', backupData.data.expenses);
          }

          // Import settings
          if (backupData.data.settings) {
            setSettings(backupData.data.settings);
            storage.setSingle('app_settings', backupData.data.settings);
          }

          toast({
            title: "Import Complete",
            description: "Your data has been imported successfully"
          });
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid backup file format",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    setSettings(prev => ({ ...prev, darkMode: newTheme === 'dark' }));
  };

  const resetToDefaults = () => {
    const defaultSettings: AppSettings = {
      defaultMonthlyFee: 2500,
      lateFeeAmount: 100,
      reminderDays: 5,
      autoBackup: true,
      darkMode: false,
      notifications: true,
      libraryFinePerDay: 10,
      maxBooksPerStudent: 3,
      libraryName: 'PATCH - The Smart Library',
      adminEmail: 'admin@patchlibrary.com'
    };
    
    setSettings(defaultSettings);
    toast({
      title: "Reset Complete",
      description: "Settings have been reset to defaults"
    });
  };

  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill all password fields",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error", 
        description: "New passwords don't match",
        variant: "destructive"
      });
      return;
    }

    // Verify current password
    const currentUser = auth.getCurrentUser() as { username?: string; loginTime?: string } | null;
    if (!auth.login(currentUser?.username || 'admin', currentPassword)) {
      toast({
        title: "Error",
        description: "Current password is incorrect",
        variant: "destructive"
      });
      return;
    }

    // Update password
    const success = auth.resetCredentials(currentUser?.username || 'admin', newPassword);
    if (success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: "Success",
        description: "Password updated successfully"
      });
    } else {
      toast({
        title: "Error", 
        description: "Failed to update password",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSecurityQuestion = () => {
    if (!securityQuestion.trim() || !securityAnswer.trim()) {
      toast({
        title: "Error",
        description: "Please provide both security question and answer",
        variant: "destructive"
      });
      return;
    }

    try {
      const admin = storage.getSingle('patch_admin') as any;
      if (admin) {
        const updatedAdmin = {
          ...admin,
          securityQuestion: securityQuestion.trim(),
          securityAnswerHash: btoa(securityAnswer.toLowerCase().trim() + 'patch_salt_2024'),
          updatedAt: new Date().toISOString()
        };
        storage.setSingle('patch_admin', updatedAdmin);
        setSecurityAnswer('');
        toast({
          title: "Success",
          description: "Security question updated successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update security question",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          ⚙️ Admin Settings
        </h2>
        <p className="text-muted-foreground">
          Configure system settings, manage themes, and backup your data
        </p>
      </motion.div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-fit">
        <TabsList className="grid grid-cols-5 w-fit">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Library Configuration
                </CardTitle>
                <CardDescription>
                  Basic settings for your library management system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="libraryName">Library Name</Label>
                  <Input
                    id="libraryName"
                    value={settings.libraryName}
                    onChange={(e) => setSettings(prev => ({ ...prev, libraryName: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={settings.adminEmail}
                    onChange={(e) => setSettings(prev => ({ ...prev, adminEmail: e.target.value }))}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="defaultFee">Default Monthly Fee (₹)</Label>
                  <Input
                    id="defaultFee"
                    type="number"
                    value={settings.defaultMonthlyFee}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultMonthlyFee: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lateFee">Late Fee Amount (₹)</Label>
                  <Input
                    id="lateFee"
                    type="number"
                    value={settings.lateFeeAmount}
                    onChange={(e) => setSettings(prev => ({ ...prev, lateFeeAmount: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminderDays">Reminder Days</Label>
                  <Input
                    id="reminderDays"
                    type="number"
                    min="1"
                    max="30"
                    value={settings.reminderDays}
                    onChange={(e) => setSettings(prev => ({ ...prev, reminderDays: parseInt(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Days before fee due date to send reminder
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Library Settings
                </CardTitle>
                <CardDescription>
                  Configure library-specific rules and policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="finePerDay">Fine Per Day (₹)</Label>
                  <Input
                    id="finePerDay"
                    type="number"
                    value={settings.libraryFinePerDay}
                    onChange={(e) => setSettings(prev => ({ ...prev, libraryFinePerDay: parseInt(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Fine charged per day for overdue books
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxBooks">Max Books Per Student</Label>
                  <Input
                    id="maxBooks"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxBooksPerStudent}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxBooksPerStudent: parseInt(e.target.value) }))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Backup</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically backup data daily
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable system notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button onClick={handleSaveSettings} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
                <Button variant="outline" onClick={resetToDefaults}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme & Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                  <div>
                    <Label className="text-base font-medium">
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark themes
                    </p>
                  </div>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={handleThemeToggle}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border-2 border-primary bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                  <h3 className="font-semibold mb-2">Light Theme Preview</h3>
                  <div className="space-y-2">
                    <div className="h-4 bg-primary/20 rounded"></div>
                    <div className="h-3 bg-secondary/30 rounded w-2/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border-2 border-secondary bg-slate-900 text-white">
                  <h3 className="font-semibold mb-2">Dark Theme Preview</h3>
                  <div className="space-y-2">
                    <div className="h-4 bg-blue-400 rounded"></div>
                    <div className="h-3 bg-slate-600 rounded w-2/3"></div>
                    <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-2">Theme Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Glassmorphism</Badge>
                    <span className="text-sm">Modern card design</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Animations</Badge>
                    <span className="text-sm">Smooth transitions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Responsive</Badge>
                    <span className="text-sm">All screen sizes</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Data
                </CardTitle>
                <CardDescription>
                  Create a backup of all your library data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Total Students:</span>
                    <Badge variant="secondary">{studentDb.getAll().length}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Fee Payments:</span>
                    <Badge variant="secondary">{feePaymentDb.getAll().length}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Expenses:</span>
                    <Badge variant="secondary">{expenseDb.getAll().length}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last Backup:</span>
                    <span className="text-muted-foreground">{stats.lastBackup}</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleExportData}
                  disabled={backupProgress}
                >
                  {backupProgress ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {backupProgress ? 'Exporting...' : 'Export Backup'}
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Data
                </CardTitle>
                <CardDescription>
                  Restore data from a backup file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Select a backup file to restore your data
                  </p>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="max-w-sm mx-auto"
                  />
                </div>

                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Warning: Importing will replace all current data. Make sure to export a backup first.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your admin password for enhanced security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Input 
                    type="password" 
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <Input 
                    type="password" 
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Input 
                    type="password" 
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Button onClick={handleUpdatePassword} className="w-full">
                    <Lock className="h-4 w-4 mr-2" />
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Question
                </CardTitle>
                <CardDescription>
                  Manage your security question for password recovery
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="securityQuestion">Security Question</Label>
                    <Input
                      id="securityQuestion"
                      placeholder="e.g., What is your favorite book?"
                      value={securityQuestion}
                      onChange={(e) => setSecurityQuestion(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="securityAnswer">Security Answer</Label>
                    <Input
                      id="securityAnswer"
                      type="password"
                      placeholder="Enter your answer"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleUpdateSecurityQuestion} className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    Update Security Question
                  </Button>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 Your security question will be used to recover your password if you forget it.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Session & Privacy
              </CardTitle>
              <CardDescription>
                Manage active sessions and data privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-medium">Current Session</Label>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Session started: {new Date().toLocaleString()}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => auth.logout()}>
                    End Session
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-medium">Data Privacy</Label>
                    <Badge variant="secondary">Protected</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    All data is stored locally and encrypted. No external sharing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="space-y-4">
          <ReceiptTestPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};
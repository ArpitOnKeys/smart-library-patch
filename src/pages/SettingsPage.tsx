
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Trash2, Key, Database, FileText } from 'lucide-react';
import { auth, storage } from '@/lib/database';
import { exportAllData, importAllData, clearAllData } from '@/utils/backup';

export const SettingsPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingCredentials, setIsChangingCredentials] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCredentialsChange = () => {
    if (!currentPassword || !newUsername || !newPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation don't match",
        variant: "destructive"
      });
      return;
    }

    // Verify current password
    const admin = storage.getSingle('patch_admin');
    if (!admin || atob(admin.passwordHash) !== currentPassword) {
      toast({
        title: "Authentication Failed",
        description: "Current password is incorrect",
        variant: "destructive"
      });
      return;
    }

    // Update credentials
    const updatedAdmin = {
      ...admin,
      username: newUsername,
      passwordHash: btoa(newPassword),
      updatedAt: new Date().toISOString()
    };

    storage.setSingle('patch_admin', updatedAdmin);
    
    toast({
      title: "Credentials Updated",
      description: "Username and password have been updated successfully"
    });

    // Clear form
    setCurrentPassword('');
    setNewUsername('');
    setNewPassword('');
    setConfirmPassword('');
    setIsChangingCredentials(false);
  };

  const handleExportData = () => {
    try {
      exportAllData();
      toast({
        title: "Export Successful",
        description: "All data has been exported to your downloads folder"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting data",
        variant: "destructive"
      });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        importAllData(data);
        toast({
          title: "Import Successful",
          description: "Data has been restored successfully"
        });
        // Reset file input
        event.target.value = '';
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

  const handleClearAllData = () => {
    clearAllData();
    toast({
      title: "Data Cleared",
      description: "All data has been cleared from the system"
    });
  };

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">⚙️ Settings</h1>
          <p className="text-muted-foreground">Manage your PATCH - Smart Library system settings</p>
        </div>

        <div className="grid gap-6">
          {/* Admin Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Admin Credentials
              </CardTitle>
              <CardDescription>
                Change your admin username and password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isChangingCredentials ? (
                <Button onClick={() => setIsChangingCredentials(true)}>
                  Change Credentials
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newUsername">New Username</Label>
                    <Input
                      id="newUsername"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Enter new username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCredentialsChange}>Update Credentials</Button>
                    <Button variant="outline" onClick={() => setIsChangingCredentials(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Backup & Restore */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backup & Restore
              </CardTitle>
              <CardDescription>
                Export and import your library data for backup purposes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button onClick={handleExportData} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export All Data
                </Button>
                
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Import Data
                  </Button>
                </div>
              </div>
              
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Backup files include all students, fee payments, expenses, and WhatsApp logs. 
                  Importing will overwrite existing data.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Dangerous actions that cannot be undone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Clear All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all students, 
                      fee payments, expenses, and WhatsApp logs from the system.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleClearAllData}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, clear all data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                About PATCH - The Smart Library
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Version:</strong> 1.0.0</p>
              <p><strong>Build:</strong> Production</p>
              <p><strong>Storage:</strong> Local Browser Storage</p>
              <Separator className="my-4" />
              <div className="flex gap-4">
                <Button onClick={() => navigate('/')}>
                  Back to Dashboard
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;


import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { auth, storage, STORAGE_KEYS } from '@/lib/database';
import { Admin } from '@/types/database';
import { exportData, importData } from '@/utils/backup';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Download, Upload, Trash2, Key, Shield, Database, Settings as SettingsIcon } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

const SettingsPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newUsername || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const admin = storage.getSingle<Admin>(STORAGE_KEYS.ADMIN);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Verify current password
      if (btoa(currentPassword) !== admin.passwordHash) {
        toast({
          title: "Error",
          description: "Current password is incorrect",
          variant: "destructive",
        });
        return;
      }

      // Update admin credentials
      const updatedAdmin: Admin = {
        ...admin,
        username: newUsername,
        passwordHash: btoa(newPassword),
        updatedAt: new Date().toISOString()
      };

      storage.setSingle(STORAGE_KEYS.ADMIN, updatedAdmin);

      toast({
        title: "Success! 🎉",
        description: "Admin credentials updated successfully",
      });

      // Clear form
      setCurrentPassword('');
      setNewUsername('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    try {
      exportData();
      toast({
        title: "Export Successful! 📦",
        description: "Database backup downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importData(file)
      .then(() => {
        toast({
          title: "Import Successful! 📥",
          description: "Database restored successfully",
        });
        setTimeout(() => window.location.reload(), 1000);
      })
      .catch((error) => {
        toast({
          title: "Import Failed",
          description: error.message,
          variant: "destructive",
        });
      });

    // Reset input
    event.target.value = '';
  };

  const handleClearAllData = () => {
    try {
      // Clear all data except admin
      Object.values(STORAGE_KEYS).forEach(key => {
        if (key !== STORAGE_KEYS.ADMIN) {
          localStorage.removeItem(key);
        }
      });

      toast({
        title: "Data Cleared! 🗑️",
        description: "All data has been cleared successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear data",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="brand-gradient p-3 rounded-2xl shadow-lg">
              <SettingsIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                System Settings
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage your PATCH library system configuration
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Admin Credentials */}
          <Card className="card-enhanced">
            <CardHeader className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Key className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Admin Credentials</CardTitle>
                  <CardDescription>Update username and password</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-username">New Username</Label>
                <Input
                  id="new-username"
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter new username"
                  className="rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="rounded-xl"
                />
              </div>
              
              <Button 
                onClick={handlePasswordChange}
                disabled={isLoading}
                className="w-full rounded-xl button-enhanced"
              >
                {isLoading ? "Updating..." : "Update Credentials"}
              </Button>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="card-enhanced">
            <CardHeader className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Data management and security options</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full rounded-xl button-enhanced">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>⚠️ Clear All Data</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all students, fees, expenses, and logs. 
                      This action cannot be undone. Are you sure?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleClearAllData}
                      className="rounded-xl bg-destructive hover:bg-destructive/90"
                    >
                      Yes, Clear All Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="card-enhanced md:col-span-2">
            <CardHeader className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Database className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Backup & Restore</CardTitle>
                  <CardDescription>Export and import your library data</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Export Data</h4>
                  <Button 
                    onClick={handleExportData}
                    variant="outline"
                    className="w-full rounded-xl button-enhanced"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Backup (JSON)
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Creates a backup file with all your data
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Import Data</h4>
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden"
                      id="import-file"
                    />
                    <Button 
                      variant="outline"
                      className="w-full rounded-xl button-enhanced"
                      onClick={() => document.getElementById('import-file')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Backup (JSON)
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Restore data from a backup file
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { auth, storage, STORAGE_KEYS } from '@/lib/database';
import { Admin } from '@/types/database';
import { exportData, importData } from '@/utils/backup';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Download, Upload, Trash2, Key, Shield, Database, Settings as SettingsIcon, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LiquidGlassCard } from '@/components/glass/LiquidGlassCard';
import { motion } from 'framer-motion';
import { verifyPassword, hashPassword, getPasswordStrength } from '@/utils/hash';

const SettingsPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation states
  const [validations, setValidations] = useState({
    currentPassword: { isValid: true, message: '' },
    newUsername: { isValid: true, message: '' },
    newPassword: { isValid: true, message: '' },
    confirmPassword: { isValid: true, message: '' }
  });

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });
  
  // Update throttling state
  const [updateAttempts, setUpdateAttempts] = useState(0);
  const [isThrottled, setIsThrottled] = useState(false);

  // Security question state
  const [securityQuestion, setSecurityQuestion] = useState(auth.getSecurityQuestion());
  const [securityAnswer, setSecurityAnswer] = useState('');
  
  // Get current admin data
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  
  useEffect(() => {
    const admin = storage.getSingle<Admin>(STORAGE_KEYS.ADMIN);
    setCurrentAdmin(admin);
    if (admin) {
      setNewUsername(admin.username);
    }
  }, []);

  // Real-time validation functions
  const validateCurrentPassword = (value: string) => {
    if (!value.trim()) {
      return { isValid: false, message: 'Current password is required' };
    }
    return { isValid: true, message: '' };
  };

  const validateUsername = (value: string) => {
    if (!value.trim()) {
      return { isValid: false, message: 'Username is required' };
    }
    if (value.length < 3) {
      return { isValid: false, message: 'Username must be at least 3 characters' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return { isValid: false, message: 'Username can only contain letters, numbers, and underscores' };
    }
    return { isValid: true, message: '' };
  };

  const validatePassword = (value: string) => {
    if (!value.trim()) {
      return { isValid: false, message: 'Password is required' };
    }
    if (value.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return { isValid: false, message: 'Password must contain uppercase, lowercase, and number' };
    }
    return { isValid: true, message: '' };
  };

  const validateConfirmPassword = (value: string, newPassword: string) => {
    if (!value.trim()) {
      return { isValid: false, message: 'Please confirm your password' };
    }
    if (value !== newPassword) {
      return { isValid: false, message: 'Passwords do not match' };
    }
    return { isValid: true, message: '' };
  };

  // Handle real-time validation
  const handleFieldChange = (field: string, value: string) => {
    let validation;
    
    switch (field) {
      case 'currentPassword':
        setCurrentPassword(value);
        validation = validateCurrentPassword(value);
        break;
      case 'newUsername':
        setNewUsername(value);
        validation = validateUsername(value);
        break;
      case 'newPassword':
        setNewPassword(value);
        validation = validatePassword(value);
        // Update password strength
        const strength = getPasswordStrength(value);
        setPasswordStrength(strength);
        // Also re-validate confirm password if it has a value
        if (confirmPassword) {
          const confirmValidation = validateConfirmPassword(confirmPassword, value);
          setValidations(prev => ({
            ...prev,
            confirmPassword: confirmValidation
          }));
        }
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        validation = validateConfirmPassword(value, newPassword);
        break;
      default:
        return;
    }

    setValidations(prev => ({
      ...prev,
      [field]: validation
    }));
  };

  const handlePasswordChange = async () => {
    // Check for throttling
    if (isThrottled) {
      toast({
        title: "Too Many Attempts",
        description: "Please wait 15 seconds before trying again",
        variant: "destructive",
      });
      return;
    }

    // Validate all fields
    const currentPasswordValidation = validateCurrentPassword(currentPassword.trim());
    const usernameValidation = validateUsername(newUsername.trim());
    const passwordValidation = validatePassword(newPassword);
    const confirmPasswordValidation = validateConfirmPassword(confirmPassword, newPassword);

    setValidations({
      currentPassword: currentPasswordValidation,
      newUsername: usernameValidation,
      newPassword: passwordValidation,
      confirmPassword: confirmPasswordValidation
    });

    if (!currentPasswordValidation.isValid || !usernameValidation.isValid || 
        !passwordValidation.isValid || !confirmPasswordValidation.isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before proceeding",
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

      // FIXED: Verify current password using proper hash verification 
      // Previously used atob(admin.passwordHash) !== currentPassword which failed
      // because admin.passwordHash is created with btoa(password + salt), not just btoa(password)
      const isCurrentPasswordValid = verifyPassword(currentPassword.trim(), admin.passwordHash);
      
      if (!isCurrentPasswordValid) {
        // Increment attempt counter and set throttling if needed
        const newAttempts = updateAttempts + 1;
        setUpdateAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setIsThrottled(true);
          setTimeout(() => {
            setIsThrottled(false);
            setUpdateAttempts(0);
          }, 15000); // 15 second cooldown
        }

        setValidations(prev => ({
          ...prev,
          currentPassword: { isValid: false, message: 'Current password is incorrect' }
        }));
        toast({
          title: "Authentication Error",
          description: "Current password is incorrect. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update admin credentials with proper hashing
      const updatedAdmin: Admin = {
        ...admin,
        username: newUsername.trim(),
        passwordHash: hashPassword(newPassword),
        updatedAt: new Date().toISOString()
      };

      storage.setSingle(STORAGE_KEYS.ADMIN, updatedAdmin);
      setCurrentAdmin(updatedAdmin);

      // Reset attempts on success
      setUpdateAttempts(0);
      setIsThrottled(false);

      toast({
        title: "Success! 🎉",
        description: "Admin credentials updated successfully",
      });

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrength({ score: 0, feedback: [] });
      
      // Reset validation states
      setValidations({
        currentPassword: { isValid: true, message: '' },
        newUsername: { isValid: true, message: '' },
        newPassword: { isValid: true, message: '' },
        confirmPassword: { isValid: true, message: '' }
      });
    } catch (error) {
      console.error('Failed to update credentials:', error);
      toast({
        title: "Error",
        description: "Failed to update credentials. Please try again.",
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

  const handleUpdateSecurityQuestion = () => {
    if (!securityQuestion.trim() || !securityAnswer.trim()) {
      toast({
        title: "Error",
        description: "Please provide both security question and answer",
        variant: "destructive",
      });
      return;
    }

    try {
      const admin = storage.getSingle<Admin>(STORAGE_KEYS.ADMIN);
      if (admin) {
        const updatedAdmin: Admin = {
          ...admin,
          securityQuestion: securityQuestion.trim(),
          securityAnswerHash: btoa(securityAnswer.toLowerCase().trim() + 'patch_salt_2024'),
          updatedAt: new Date().toISOString()
        };
        storage.setSingle(STORAGE_KEYS.ADMIN, updatedAdmin);
        setSecurityAnswer('');
        toast({
          title: "Success! 🔐",
          description: "Security question updated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update security question",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <motion.div 
        className="max-w-4xl mx-auto space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="flex items-center justify-center space-x-4">
            <div className="brand-gradient p-4 rounded-2xl shadow-lg">
              <SettingsIcon className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="heading-glass text-5xl font-bold">
                System Settings
              </h1>
              <p className="text-glass-secondary text-xl font-medium">
                Manage your PATCH library system configuration
              </p>
              {currentAdmin && (
                <p className="text-glass-muted text-sm mt-2">
                  Logged in as: <span className="text-glass-primary font-semibold">{currentAdmin.username}</span>
                </p>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Admin Credentials */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <LiquidGlassCard variant="panel" className="h-full">
              <CardHeader className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="brand-gradient p-3 rounded-xl shadow-lg">
                    <Key className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="heading-glass text-2xl">Admin Credentials</CardTitle>
                    <CardDescription className="text-glass-secondary font-medium">
                      Update username and password securely
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-glass-primary font-semibold">
                    Current Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => handleFieldChange('currentPassword', e.target.value)}
                      placeholder="Enter current password"
                      className={`pr-12 transition-all duration-300 ${
                        !validations.currentPassword.isValid ? 'border-destructive focus-visible:ring-destructive/50' : ''
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-10 w-10 p-0 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-glass-muted" />
                      ) : (
                        <Eye className="h-4 w-4 text-glass-muted" />
                      )}
                    </Button>
                  </div>
                  {!validations.currentPassword.isValid && (
                    <p className="text-xs text-destructive font-medium">
                      {validations.currentPassword.message}
                    </p>
                  )}
                </div>
                
                {/* New Username */}
                <div className="space-y-2">
                  <Label htmlFor="new-username" className="text-glass-primary font-semibold">
                    New Username *
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-username"
                      type="text"
                      value={newUsername}
                      onChange={(e) => handleFieldChange('newUsername', e.target.value)}
                      placeholder="Enter new username"
                      className={`transition-all duration-300 ${
                        !validations.newUsername.isValid ? 'border-destructive focus-visible:ring-destructive/50' : 
                        validations.newUsername.isValid && newUsername ? 'border-primary focus-visible:ring-primary/50' : ''
                      }`}
                    />
                    {validations.newUsername.isValid && newUsername && (
                      <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-primary" />
                    )}
                  </div>
                  {!validations.newUsername.isValid && (
                    <p className="text-xs text-destructive font-medium">
                      {validations.newUsername.message}
                    </p>
                  )}
                </div>
                
                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-glass-primary font-semibold">
                    New Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => handleFieldChange('newPassword', e.target.value)}
                      placeholder="Enter new password"
                      className={`pr-12 transition-all duration-300 ${
                        !validations.newPassword.isValid ? 'border-destructive focus-visible:ring-destructive/50' : 
                        validations.newPassword.isValid && newPassword ? 'border-primary focus-visible:ring-primary/50' : ''
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-10 w-10 p-0 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-glass-muted" />
                      ) : (
                        <Eye className="h-4 w-4 text-glass-muted" />
                      )}
                    </Button>
                  </div>
                  {!validations.newPassword.isValid && (
                    <p className="text-xs text-destructive font-medium">
                      {validations.newPassword.message}
                    </p>
                  )}
                  
                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-glass-muted">Password Strength</span>
                        <span className={`font-medium ${
                          passwordStrength.score === 0 ? 'text-destructive' :
                          passwordStrength.score <= 2 ? 'text-orange-500' :
                          passwordStrength.score === 3 ? 'text-yellow-500' :
                          'text-primary'
                        }`}>
                          {passwordStrength.score === 0 ? 'Very Weak' :
                           passwordStrength.score === 1 ? 'Weak' :
                           passwordStrength.score === 2 ? 'Fair' :
                           passwordStrength.score === 3 ? 'Good' : 'Strong'}
                        </span>
                      </div>
                      <div className="w-full bg-glass-muted/20 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.score === 0 ? 'w-1/5 bg-destructive' :
                            passwordStrength.score === 1 ? 'w-2/5 bg-destructive' :
                            passwordStrength.score === 2 ? 'w-3/5 bg-orange-500' :
                            passwordStrength.score === 3 ? 'w-4/5 bg-yellow-500' :
                            'w-full bg-primary'
                          }`}
                        />
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <div className="text-xs text-glass-muted">
                          Suggestions: {passwordStrength.feedback.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs text-glass-muted">
                    Must contain uppercase, lowercase, number and be 8+ characters
                  </p>
                </div>
                
                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-glass-primary font-semibold">
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                      className={`pr-12 transition-all duration-300 ${
                        !validations.confirmPassword.isValid ? 'border-destructive focus-visible:ring-destructive/50' : 
                        validations.confirmPassword.isValid && confirmPassword ? 'border-primary focus-visible:ring-primary/50' : ''
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-10 w-10 p-0 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-glass-muted" />
                      ) : (
                        <Eye className="h-4 w-4 text-glass-muted" />
                      )}
                    </Button>
                    {validations.confirmPassword.isValid && confirmPassword && (
                      <CheckCircle className="absolute right-12 top-3 h-5 w-5 text-primary" />
                    )}
                  </div>
                  {!validations.confirmPassword.isValid && (
                    <p className="text-xs text-destructive font-medium">
                      {validations.confirmPassword.message}
                    </p>
                  )}
                </div>
                
                {/* Throttling Warning */}
                {updateAttempts > 0 && updateAttempts < 3 && (
                  <div className="text-xs text-orange-500 font-medium">
                    {3 - updateAttempts} attempt{3 - updateAttempts !== 1 ? 's' : ''} remaining before cooldown
                  </div>
                )}
                
                {isThrottled && (
                  <div className="text-xs text-destructive font-medium">
                    Too many failed attempts. Please wait 15 seconds before trying again.
                  </div>
                )}

                {/* Submit Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        disabled={isLoading || isThrottled || Object.values(validations).some(v => !v.isValid) || 
                                 !currentPassword || !newUsername || !newPassword || !confirmPassword}
                        className="w-full button-liquid text-lg font-semibold py-3 mt-6"
                      >
                        <div className="flex items-center space-x-2">
                          <Key className="h-4 w-4" />
                          <span>Update Credentials</span>
                        </div>
                      </Button>
                    </motion.div>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Credential Update</AlertDialogTitle>
                      <AlertDialogDescription>
                        You are about to update your admin credentials. This will change your username and password. 
                        Make sure you remember your new credentials as you'll need them to log in again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handlePasswordChange}
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Updating...</span>
                          </div>
                        ) : (
                          "Update Credentials"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </LiquidGlassCard>
          </motion.div>

          {/* Security */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <LiquidGlassCard variant="panel" className="h-full">
              <CardHeader className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="brand-gradient p-3 rounded-xl shadow-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="heading-glass text-2xl">Security</CardTitle>
                    <CardDescription className="text-glass-secondary font-medium">
                      Security question and data management
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Security Question Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="security-question" className="text-glass-primary font-semibold">
                      Security Question
                    </Label>
                    <Input
                      id="security-question"
                      value={securityQuestion}
                      onChange={(e) => setSecurityQuestion(e.target.value)}
                      placeholder="e.g., What is your favorite book?"
                      className="transition-all duration-300"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="security-answer" className="text-glass-primary font-semibold">
                      Security Answer
                    </Label>
                    <Input
                      id="security-answer"
                      type="password"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      placeholder="Enter your answer"
                      className="transition-all duration-300"
                    />
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      onClick={handleUpdateSecurityQuestion}
                      variant="outline" 
                      className="w-full font-semibold py-2.5"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Update Security Question
                    </Button>
                  </motion.div>
                  
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <p className="text-sm text-glass-primary font-medium">
                      💡 Your security question will be used for password recovery if you forget your credentials.
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border/50 pt-6">
                  <h4 className="font-bold text-sm text-destructive uppercase tracking-wide mb-4">Danger Zone</h4>
                  
                  {/* Clear Data Section */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button variant="destructive" className="w-full font-semibold py-2.5">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All Data
                        </Button>
                      </motion.div>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="liquid-glass-panel border border-border/30">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="heading-glass text-xl">⚠️ Clear All Data</AlertDialogTitle>
                        <AlertDialogDescription className="text-glass-secondary font-medium">
                          This will permanently delete all students, fees, expenses, and logs. 
                          This action cannot be undone. Are you sure?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="font-semibold">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleClearAllData}
                          className="bg-destructive hover:bg-destructive/90 font-semibold"
                        >
                          Yes, Clear All Data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </LiquidGlassCard>
          </motion.div>

          {/* Data Management */}
          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <LiquidGlassCard variant="panel">
              <CardHeader className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="brand-gradient p-3 rounded-xl shadow-lg">
                    <Database className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="heading-glass text-2xl">Backup & Restore</CardTitle>
                    <CardDescription className="text-glass-secondary font-medium">
                      Export and import your library data securely
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-glass-primary uppercase tracking-wide">Export Data</h4>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        onClick={handleExportData}
                        variant="outline"
                        className="w-full font-semibold py-3"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Download Backup (JSON)
                      </Button>
                    </motion.div>
                    <p className="text-sm text-glass-muted font-medium">
                      Creates a backup file with all your data including students, fees, and settings
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-glass-primary uppercase tracking-wide">Import Data</h4>
                    <div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                        id="import-file"
                      />
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          variant="outline"
                          className="w-full font-semibold py-3"
                          onClick={() => document.getElementById('import-file')?.click()}
                        >
                          <Upload className="h-5 w-5 mr-2" />
                          Upload Backup (JSON)
                        </Button>
                      </motion.div>
                    </div>
                    <p className="text-sm text-glass-muted font-medium">
                      Restore data from a backup file (this will overwrite existing data)
                    </p>
                  </div>
                </div>
              </CardContent>
            </LiquidGlassCard>
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default SettingsPage;

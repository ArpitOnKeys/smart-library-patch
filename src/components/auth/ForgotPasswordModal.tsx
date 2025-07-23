import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { auth } from '@/lib/database';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, RotateCcw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ 
  open, 
  onOpenChange, 
  onSuccess 
}) => {
  const [step, setStep] = useState<'security' | 'reset'>('security');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmergencyReset, setShowEmergencyReset] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [shakeAnimation, setShakeAnimation] = useState(false);

  const securityQuestion = auth.getSecurityQuestion();

  const handleSecurityAnswer = () => {
    if (!securityAnswer.trim()) {
      toast({
        title: "Error",
        description: "Please enter your security answer",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const isValid = auth.verifySecurityAnswer(securityAnswer.trim());
      
      if (isValid) {
        toast({
          title: "Security Answer Verified! ✅",
          description: "You can now reset your credentials",
        });
        setStep('reset');
        setAttemptCount(0);
      } else {
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);
        
        setShakeAnimation(true);
        setTimeout(() => setShakeAnimation(false), 500);
        
        toast({
          title: "Incorrect Answer",
          description: `Wrong security answer. ${3 - newAttemptCount} attempts remaining.`,
          variant: "destructive",
        });

        if (newAttemptCount >= 3) {
          toast({
            title: "Maximum Attempts Reached",
            description: "Consider using Emergency Reset to wipe all data",
            variant: "destructive",
          });
        }
      }
      
      setIsLoading(false);
    }, 800);
  };

  const handlePasswordReset = () => {
    if (!newUsername.trim() || !newPassword.trim()) {
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
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const success = auth.resetCredentials(newUsername.trim(), newPassword);
      
      if (success) {
        toast({
          title: "Credentials Reset Successfully! 🎉",
          description: "You can now login with your new credentials",
        });
        onSuccess();
        handleModalClose();
      } else {
        toast({
          title: "Reset Failed",
          description: "Unable to reset credentials. Please try again.",
          variant: "destructive",
        });
      }
      
      setIsLoading(false);
    }, 800);
  };

  const handleEmergencyReset = () => {
    auth.emergencyReset();
    toast({
      title: "Emergency Reset Complete",
      description: "All data has been wiped. App will refresh with default settings.",
      variant: "destructive",
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const handleModalClose = () => {
    setStep('security');
    setSecurityAnswer('');
    setNewUsername('');
    setNewPassword('');
    setConfirmPassword('');
    setAttemptCount(0);
    setShakeAnimation(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-primary" />
              <span>Password Recovery</span>
            </DialogTitle>
            <DialogDescription>
              {step === 'security' 
                ? 'Answer your security question to reset credentials'
                : 'Set your new login credentials'
              }
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === 'security' ? (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Security Question</Label>
                  <div className="p-3 bg-muted/50 rounded-lg border">
                    <p className="text-sm text-muted-foreground font-medium">
                      {securityQuestion}
                    </p>
                  </div>
                </div>

                <motion.div 
                  className="space-y-2"
                  animate={shakeAnimation ? { x: [-5, 5, -5, 5, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <Label htmlFor="security-answer" className="text-sm font-medium">
                    Your Answer
                  </Label>
                  <Input
                    id="security-answer"
                    type="text"
                    placeholder="Enter your answer..."
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    disabled={isLoading}
                    className="h-11 rounded-xl border-2 focus:border-primary transition-colors"
                    onKeyPress={(e) => e.key === 'Enter' && handleSecurityAnswer()}
                  />
                </motion.div>

                {attemptCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 text-sm text-destructive"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Attempts: {attemptCount}/3</span>
                  </motion.div>
                )}

                <div className="flex flex-col space-y-2">
                  <Button 
                    onClick={handleSecurityAnswer}
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verify Answer
                      </>
                    )}
                  </Button>

                  {attemptCount >= 2 && (
                    <Button 
                      variant="destructive"
                      onClick={() => setShowEmergencyReset(true)}
                      className="w-full h-11 rounded-xl"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Emergency Reset (Erase All Data)
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="new-username" className="text-sm font-medium">
                    New Username
                  </Label>
                  <Input
                    id="new-username"
                    type="text"
                    placeholder="Enter new username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={isLoading}
                    className="h-11 rounded-xl border-2 focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-11 rounded-xl border-2 focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-11 rounded-xl border-2 focus:border-primary transition-colors"
                  />
                </div>

                <Button 
                  onClick={handlePasswordReset}
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl brand-gradient text-white"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Resetting...</span>
                    </div>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset Credentials
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showEmergencyReset} onOpenChange={setShowEmergencyReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Emergency Reset</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong>This will permanently erase ALL data including:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                <li>All student records</li>
                <li>Fee payment history</li>
                <li>Expense records</li>
                <li>Admin credentials</li>
                <li>App settings</li>
              </ul>
              <p className="text-destructive font-medium">
                This action cannot be undone!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEmergencyReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Erase All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
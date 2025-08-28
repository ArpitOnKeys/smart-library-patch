import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Moon, 
  Sun, 
  LogOut, 
  User, 
  Shield,
  Palette,
  Monitor
} from 'lucide-react';
import { auth } from '@/lib/database';
import { toast } from '@/hooks/use-toast';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      auth.logout();
      toast({
        title: "Logged Out Successfully",
        description: "You have been logged out of the system",
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "Failed to logout properly",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-0 max-w-md">
        <DialogHeader className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/20 p-3 rounded-xl">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              Settings
            </DialogTitle>
          </div>
        </DialogHeader>

        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Profile Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Profile</h3>
            </div>
            
            <div className="glass-panel p-4 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/20 p-2 rounded-lg">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Administrator</p>
                  <p className="text-sm text-muted-foreground">System Admin</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="opacity-20" />

          {/* Theme Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Appearance</h3>
            </div>
            
            <div className="space-y-3">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = theme === option.value;
                
                return (
                  <motion.button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-xl
                      glass-panel transition-all duration-300
                      ${isSelected 
                        ? 'bg-primary/20 border-primary/30' 
                        : 'hover:bg-white/5 dark:hover:bg-white/5'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {option.label}
                      </span>
                    </div>
                    {isSelected && (
                      <motion.div
                        className="w-2 h-2 bg-primary rounded-full"
                        layoutId="theme-indicator"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <Separator className="opacity-20" />

          {/* Security Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Security</h3>
            </div>
            
            <Button
              variant="outline"
              className="w-full justify-start glass-panel hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
              onClick={() => {
                onOpenChange(false);
                // Navigate to settings page for more options
                window.location.href = '/settings';
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Advanced Settings
            </Button>
          </div>

          <Separator className="opacity-20" />

          {/* Logout Section */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
              disabled={isLoading}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoading ? 'Logging out...' : 'Logout'}
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { auth, initializeAdmin } from '@/lib/database';
import { Eye, EyeOff, BookOpen, Star, KeyRound } from 'lucide-react';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { ScenicBackground } from '@/components/scenic/ScenicBackground';
import { LiquidButton } from '@/components/glass/LiquidButton';

interface LoginPageProps {
  onLogin: (success: boolean) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  React.useEffect(() => {
    initializeAdmin();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const isValid = auth.login(username.trim(), password);
      
      if (isValid) {
        toast({
          title: "Welcome Back! 🎉",
          description: "Successfully logged into PATCH Library System",
        });
        onLogin(true);
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
      }
      
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Scenic Background System */}
      <ScenicBackground />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <motion.div
          className="flex-1 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.div
            className="w-full max-w-md"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              type: "spring" as const,
              stiffness: 100,
              damping: 20,
              delay: 0.2,
            }}
          >
            <Card className="border-0 overflow-hidden">
              <CardHeader className="text-center space-y-6 pb-8">
                <motion.div
                  className="flex justify-center"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <motion.div
                    className="brand-gradient brand-glow p-5 rounded-3xl"
                    whileHover={{ 
                      scale: 1.1, 
                      rotate: 5,
                      boxShadow: "0 0 50px hsl(var(--glow-blue)), 0 0 100px hsl(var(--glow-pink))"
                    }}
                    transition={{ type: "spring" as const, stiffness: 400, damping: 10 }}
                  >
                    <BookOpen className="h-12 w-12 text-white" />
                  </motion.div>
                </motion.div>
                
                <motion.div
                  className="space-y-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                    PATCH
                  </CardTitle>
                  <CardDescription className="text-xl font-medium text-muted-foreground">
                    The Smart Library Management System
                  </CardDescription>
                </motion.div>

                <motion.div
                  className="flex items-center justify-center space-x-3 text-base"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Star className="h-5 w-5 text-golden" />
                  </motion.div>
                  <span className="font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Admin Access Portal
                  </span>
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 0.5 }}
                  >
                    <Star className="h-5 w-5 text-golden" />
                  </motion.div>
                </motion.div>
              </CardHeader>
            
            <CardContent className="space-y-8">
              <motion.form
                onSubmit={handleSubmit}
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
              >
                <motion.div
                  className="space-y-3"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 1.1 }}
                >
                  <Label htmlFor="username" className="text-base font-semibold text-foreground">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    autoComplete="username"
                    className="h-12 rounded-2xl border-2 border-border/30 bg-card/60 backdrop-blur-xl focus:border-primary focus:bg-card/80 transition-all duration-300"
                  />
                </motion.div>
                
                <motion.div
                  className="space-y-3"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 1.2 }}
                >
                  <Label htmlFor="password" className="text-base font-semibold text-foreground">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="h-12 rounded-2xl border-2 border-border/30 bg-card/60 backdrop-blur-xl focus:border-primary focus:bg-card/80 transition-all duration-300 pr-14"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-8 w-8 hover:bg-accent/50 rounded-xl"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 1.3 }}
                >
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 text-lg font-semibold button-liquid text-primary-foreground rounded-2xl"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Signing In...</span>
                      </div>
                    ) : (
                      "Sign In to PATCH"
                    )}
                  </LiquidButton>
                </motion.div>

                <motion.div
                  className="flex justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 1.4 }}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowForgotPassword(true)}
                    disabled={isLoading}
                    className="text-muted-foreground hover:text-primary transition-colors h-auto p-3 rounded-xl"
                  >
                    <KeyRound className="h-4 w-4 mr-2" />
                    Forgot Password?
                  </Button>
                </motion.div>
              </motion.form>
              
              <motion.div
                className="p-6 bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 rounded-2xl border border-border/20 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.5 }}
              >
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  <strong className="text-foreground text-base">Default Credentials:</strong><br />
                  <span className="font-mono text-primary font-medium">Username: admin</span><br />
                  <span className="font-mono text-primary font-medium">Password: admin123</span>
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      
      <BrandFooter />
    </div>

    <ForgotPasswordModal
      open={showForgotPassword}
      onOpenChange={setShowForgotPassword}
      onSuccess={() => {
        toast({
          title: "Ready to Login! 🔐",
          description: "Use your new credentials to sign in",
        });
      }}
    />
  </div>
  );
};

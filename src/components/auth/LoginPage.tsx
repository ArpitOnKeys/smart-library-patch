
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { auth, initializeAdmin } from '@/lib/database';
import { Eye, EyeOff, BookOpen, Sparkles } from 'lucide-react';
import { BrandFooter } from '@/components/layout/BrandFooter';

interface LoginPageProps {
  onLogin: (success: boolean) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-background to-purple-50">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 brand-gradient rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute top-1/2 -left-10 w-32 h-32 brand-gradient rounded-full opacity-10 animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-1/4 w-24 h-24 brand-gradient rounded-full opacity-10 animate-pulse"></div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="card-enhanced border-0 shadow-2xl">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="flex justify-center">
                <div className="brand-gradient p-4 rounded-2xl shadow-lg">
                  <BookOpen className="h-10 w-10 text-white" />
                </div>
              </div>
              
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  PATCH
                </CardTitle>
                <CardDescription className="text-lg font-medium text-muted-foreground">
                  The Smart Library Management System
                </CardDescription>
              </div>

              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground bg-muted/30 rounded-lg py-2 px-4">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Admin Access Portal</span>
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    autoComplete="username"
                    className="h-11 rounded-xl border-2 focus:border-primary transition-colors"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="h-11 rounded-xl border-2 focus:border-primary transition-colors pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-9 w-9 hover:bg-transparent"
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
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 rounded-xl brand-gradient text-white font-medium button-enhanced shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    "Sign In to PATCH"
                  )}
                </Button>
              </form>
              
              <div className="mt-6 p-4 bg-muted/50 rounded-xl border">
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  <strong className="text-foreground">Default Credentials:</strong><br />
                  <span className="font-mono">Username: admin</span><br />
                  <span className="font-mono">Password: admin123</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <BrandFooter />
    </div>
  );
};

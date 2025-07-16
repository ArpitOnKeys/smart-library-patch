
import { useState, useEffect } from 'react';
import { auth, initializeAdmin } from '@/lib/database';
import { LoginPage } from '@/components/auth/LoginPage';
import { StudentPanel } from '@/components/student/StudentPanel';
import { DueFeesPanel } from '@/components/fees/DueFeesPanel';
import { IncomeExpensePanel } from '@/components/income/IncomeExpensePanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { Users, Clock, TrendingUp, BookOpen, Sparkles } from 'lucide-react';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(auth.isAuthenticated());

  useEffect(() => {
    initializeAdmin();
    setIsAuthenticated(auth.isAuthenticated());
  }, []);

  const handleLogin = (success: boolean) => {
    setIsAuthenticated(success);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="brand-gradient p-3 rounded-2xl shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                PATCH DASHBOARD
              </h1>
              <p className="text-muted-foreground text-lg font-medium">
                Complete Library Management System
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-sm">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-muted-foreground">Welcome back, Admin! Ready to manage your library?</span>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </div>
        </div>

        {/* Main Content */}
        <Card className="card-enhanced border-0">
          <CardContent className="p-0">
            <Tabs defaultValue="students" className="w-full">
              <div className="border-b bg-muted/30">
                <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-4 gap-2">
                  <TabsTrigger 
                    value="students" 
                    className="flex items-center gap-3 h-12 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md button-enhanced"
                  >
                    <Users className="h-5 w-5" />
                    <div className="text-left hidden sm:block">
                      <div className="font-medium">Student Panel</div>
                      <div className="text-xs text-muted-foreground">Manage Students</div>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="dues" 
                    className="flex items-center gap-3 h-12 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md button-enhanced"
                  >
                    <Clock className="h-5 w-5" />
                    <div className="text-left hidden sm:block">
                      <div className="font-medium">Due Fees Panel</div>
                      <div className="text-xs text-muted-foreground">Track Payments</div>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="income" 
                    className="flex items-center gap-3 h-12 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md button-enhanced"
                  >
                    <TrendingUp className="h-5 w-5" />
                    <div className="text-left hidden sm:block">
                      <div className="font-medium">Income & Expense</div>
                      <div className="text-xs text-muted-foreground">Financial Overview</div>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-6">
                <TabsContent value="students" className="mt-0">
                  <StudentPanel />
                </TabsContent>
                
                <TabsContent value="dues" className="mt-0">
                  <DueFeesPanel />
                </TabsContent>
                
                <TabsContent value="income" className="mt-0">
                  <IncomeExpensePanel />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Index;

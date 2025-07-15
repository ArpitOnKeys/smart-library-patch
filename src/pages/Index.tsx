import { useState, useEffect } from 'react';
import { auth, initializeAdmin } from '@/lib/database';
import { LoginPage } from '@/components/auth/LoginPage';
import { StudentPanel } from '@/components/student/StudentPanel';
import { DueFeesPanel } from '@/components/fees/DueFeesPanel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(auth.isAuthenticated());

  useEffect(() => {
    initializeAdmin();
    setIsAuthenticated(auth.isAuthenticated());
  }, []);

  const handleLogin = (success: boolean) => {
    setIsAuthenticated(success);
  };

  const handleLogout = () => {
    auth.logout();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-4xl">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary mb-2">
              📚 PATCH - THE SMART LIBRARY
            </h1>
            <p className="text-muted-foreground text-lg">
              Complete Library Management System
            </p>
          </div>

          <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="students">🧑‍🎓 Student Panel</TabsTrigger>
              <TabsTrigger value="dues">⏳ Due Fees Panel</TabsTrigger>
              <TabsTrigger value="income">💰 Income & Expense</TabsTrigger>
            </TabsList>
            
            <TabsContent value="students">
              <StudentPanel />
            </TabsContent>
            
            <TabsContent value="dues">
              <DueFeesPanel />
            </TabsContent>
            
            <TabsContent value="income">
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-muted-foreground">
                  💰 Income & Expense Panel
                </h3>
                <p className="text-muted-foreground mt-2">Coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="text-center">
            <Button variant="destructive" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </div>
    );
  }

  return <LoginPage onLogin={handleLogin} />;
};

export default Index;

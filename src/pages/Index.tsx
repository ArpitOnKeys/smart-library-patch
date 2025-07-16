
import { useState, useEffect } from 'react';
import { auth, initializeAdmin } from '@/lib/database';
import { LoginPage } from '@/components/auth/LoginPage';
import { StudentPanel } from '@/components/student/StudentPanel';
import { DueFeesPanel } from '@/components/fees/DueFeesPanel';
import { IncomeExpensePanel } from '@/components/income/IncomeExpensePanel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(auth.isAuthenticated());
  const navigate = useNavigate();

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
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-7xl">
        <div className="space-y-8 p-8">
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
              <IncomeExpensePanel />
            </TabsContent>
          </Tabs>

          <div className="flex justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

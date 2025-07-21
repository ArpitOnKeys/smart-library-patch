import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, initializeAdmin } from '@/lib/database';
import { LoginPage } from '@/components/auth/LoginPage';
import { StudentPanel } from '@/components/student/StudentPanel';
import { DueFeesPanel } from '@/components/fees/DueFeesPanel';
import { IncomeExpensePanel } from '@/components/income/IncomeExpensePanel';
import { DashboardPanel } from '@/components/dashboard/DashboardPanel';
import { LibraryPanel } from '@/components/library/LibraryPanel';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { SplashScreen } from '@/components/splash/SplashScreen';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  BarChart3, 
  Users, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  Settings, 
  Bell,
  Sparkles 
} from 'lucide-react';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(auth.isAuthenticated());
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications] = useState(3); // Mock notification count

  useEffect(() => {
    initializeAdmin();
    setIsAuthenticated(auth.isAuthenticated());
  }, []);

  const handleLogin = (success: boolean) => {
    setIsAuthenticated(success);
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const tabsConfig = [
    {
      value: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      component: DashboardPanel,
      description: 'Analytics & Overview'
    },
    {
      value: 'students',
      label: 'Students',
      icon: Users,
      component: StudentPanel,
      description: 'Manage Students'
    },
    {
      value: 'dues',
      label: 'Due Fees',
      icon: Clock,
      component: DueFeesPanel,
      description: 'Track Payments'
    },
    {
      value: 'income',
      label: 'Finance',
      icon: TrendingUp,
      component: IncomeExpensePanel,
      description: 'Income & Expenses'
    },
    {
      value: 'library',
      label: 'Library',
      icon: BookOpen,
      component: LibraryPanel,
      description: 'Books & Resources'
    },
    {
      value: 'notifications',
      label: 'Notifications',
      icon: Bell,
      component: NotificationCenter,
      description: 'Alerts & Reminders',
      badge: notifications
    },
    {
      value: 'admin',
      label: 'Settings',
      icon: Settings,
      component: AdminPanel,
      description: 'Admin Settings'
    }
  ];

  return (
    <AppLayout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        {/* Welcome Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center space-x-3">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="brand-gradient p-3 rounded-2xl shadow-lg"
            >
              <BookOpen className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <motion.h1 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
              >
                PATCH DASHBOARD
              </motion.h1>
              <p className="text-muted-foreground text-lg font-medium">
                Complete Library Management System
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-sm">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-muted-foreground">Welcome back, Admin! Your upgraded library awaits.</span>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </div>
        </motion.div>

        {/* Main Content */}
        <Card className="card-enhanced border-0">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b bg-muted/30 p-4">
                <TabsList className="grid grid-cols-7 bg-transparent h-auto gap-2 w-full">
                  {tabsConfig.map(({ value, label, icon: Icon, description, badge }) => (
                    <TabsTrigger 
                      key={value}
                      value={value}
                      className="flex flex-col items-center gap-2 h-16 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md button-enhanced relative"
                    >
                      <div className="relative">
                        <Icon className="h-5 w-5" />
                        {badge && (
                          <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs">
                            {badge}
                          </Badge>
                        )}
                      </div>
                      <div className="text-center hidden lg:block">
                        <div className="font-medium text-xs">{label}</div>
                        <div className="text-xs text-muted-foreground">{description}</div>
                      </div>
                      <div className="lg:hidden text-xs font-medium">{label}</div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {tabsConfig.map(({ value, component: Component }) => (
                    <TabsContent key={value} value={value} className="mt-0">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Component />
                      </motion.div>
                    </TabsContent>
                  ))}
                </AnimatePresence>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </AppLayout>
  );
};

export default Index;
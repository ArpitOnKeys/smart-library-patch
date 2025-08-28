
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, initializeAdmin } from '@/lib/database';
import { LoginPage } from '@/components/auth/LoginPage';
import { StudentPanel } from '@/components/student/StudentPanel';
import { DueFeesPanel } from '@/components/fees/DueFeesPanel';
import { IncomeExpensePanel } from '@/components/income/IncomeExpensePanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlassLayout } from '@/components/glass/GlassLayout';
import { Users, Clock, TrendingUp, BookOpen, Sparkles, Zap } from 'lucide-react';

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
    return (
      <div className="min-h-screen">
        <LoginPage onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-purple-50 dark:from-gray-900 dark:via-background dark:to-purple-900">
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          <GlassLayout>
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* Welcome Header */}
              <motion.div
                className="text-center space-y-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <div className="flex items-center justify-center space-x-4">
                  <motion.div
                    className="gradient-sunset p-4 rounded-3xl glow-primary"
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <BookOpen className="h-10 w-10 text-white" />
                  </motion.div>
                  <div>
                    <motion.h1
                      className="text-5xl font-bold text-gradient-sunset mb-2"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                    >
                      PATCH LIBRARY
                    </motion.h1>
                    <motion.p
                      className="text-foreground/80 text-xl font-medium"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                    >
                      Next-Generation Management System
                    </motion.p>
                  </div>
                </div>
                
                <motion.div
                  className="flex items-center justify-center space-x-3 text-lg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Sparkles className="h-6 w-6 text-secondary" />
                  </motion.div>
                  <span className="text-foreground/90 font-medium">Welcome back, Admin! Ready to explore the future?</span>
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.5
                    }}
                  >
                    <Zap className="h-6 w-6 text-accent" />
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Main Content */}
              <motion.div
                className="glass-card border-0"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 1, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              >
                <div className="p-0">
                  <Tabs defaultValue="students" className="w-full">
                    <motion.div
                      className="border-b border-white/20 dark:border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-sm"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2, duration: 0.6 }}
                    >
                      <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-6 gap-4">
                        <TabsTrigger 
                          value="students" 
                          className="flex items-center gap-4 h-16 rounded-2xl data-[state=active]:glass-panel data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:glow-primary hover:glass-panel hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-300 text-foreground/80 hover:text-foreground"
                        >
                          <Users className="h-6 w-6" />
                          <div className="text-left hidden sm:block">
                            <div className="font-semibold text-base">Student Panel</div>
                            <div className="text-sm opacity-70">Manage Students</div>
                          </div>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="dues" 
                          className="flex items-center gap-4 h-16 rounded-2xl data-[state=active]:glass-panel data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary data-[state=active]:glow-secondary hover:glass-panel hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-300 text-foreground/80 hover:text-foreground"
                        >
                          <Clock className="h-6 w-6" />
                          <div className="text-left hidden sm:block">
                            <div className="font-semibold text-base">Due Fees Panel</div>
                            <div className="text-sm opacity-70">Track Payments</div>
                          </div>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="income" 
                          className="flex items-center gap-4 h-16 rounded-2xl data-[state=active]:glass-panel data-[state=active]:bg-accent/20 data-[state=active]:text-accent data-[state=active]:glow-accent hover:glass-panel hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-300 text-foreground/80 hover:text-foreground"
                        >
                          <TrendingUp className="h-6 w-6" />
                          <div className="text-left hidden sm:block">
                            <div className="font-semibold text-base">Income & Expense</div>
                            <div className="text-sm opacity-70">Financial Overview</div>
                          </div>
                        </TabsTrigger>
                      </TabsList>
                    </motion.div>
                    
                    <div className="p-8">
                      <AnimatePresence mode="wait">
                        <TabsContent value="students" className="mt-0">
                          <motion.div
                            key="students"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                          >
                            <StudentPanel />
                          </motion.div>
                        </TabsContent>
                        
                        <TabsContent value="dues" className="mt-0">
                          <motion.div
                            key="dues"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                          >
                            <DueFeesPanel />
                          </motion.div>
                        </TabsContent>
                        
                        <TabsContent value="income" className="mt-0">
                          <motion.div
                            key="income"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                          >
                            <IncomeExpensePanel />
                          </motion.div>
                        </TabsContent>
                      </AnimatePresence>
                    </div>
                  </Tabs>
                </div>
              </motion.div>
            </motion.div>
          </GlassLayout>
        </div>
      </div>
    </div>
  );
};

export default Index;

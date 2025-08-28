
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth, initializeAdmin } from '@/lib/database';
import { LoginPage } from '@/components/auth/LoginPage';
import { StudentPanel } from '@/components/student/StudentPanel';
import { DueFeesPanel } from '@/components/fees/DueFeesPanel';
import { IncomeExpensePanel } from '@/components/income/IncomeExpensePanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { LiquidGlassCard } from '@/components/glass/LiquidGlassCard';
import { Users, Clock, TrendingUp, BookOpen, Sparkles, Star } from 'lucide-react';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
        duration: 0.6,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25,
        mass: 0.8,
      },
    },
  };

  return (
    <AppLayout>
      <motion.div
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome Header */}
        <motion.div variants={itemVariants} className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-4">
            <motion.div
              className="brand-gradient brand-glow p-4 rounded-3xl shadow-2xl"
              whileHover={{ 
                scale: 1.1, 
                rotate: 10,
                boxShadow: "0 0 40px hsl(var(--glow-blue)), 0 0 80px hsl(var(--glow-pink))"
              }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <BookOpen className="h-10 w-10 text-white" />
            </motion.div>
            <div>
              <motion.h1
                className="text-5xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                PATCH DASHBOARD
              </motion.h1>
              <motion.p
                className="text-muted-foreground text-xl font-medium mt-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                Complete Library Management System
              </motion.p>
            </div>
          </div>
          
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
            <span className="text-muted-foreground font-medium">
              Welcome back, Admin! Ready to manage your library?
            </span>
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 0.5 }}
            >
              <Star className="h-5 w-5 text-golden" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <motion.div variants={itemVariants}>
          <LiquidGlassCard variant="panel" className="overflow-hidden">
            <Tabs defaultValue="students" className="w-full">
              <motion.div 
                className="border-b border-border/20 bg-gradient-to-r from-muted/20 via-muted/10 to-muted/20"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-6 gap-4">
                  {[
                    { value: "students", icon: Users, title: "Student Panel", desc: "Manage Students" },
                    { value: "dues", icon: Clock, title: "Due Fees Panel", desc: "Track Payments" },
                    { value: "income", icon: TrendingUp, title: "Income & Expense", desc: "Financial Overview" }
                  ].map((tab, index) => (
                    <motion.div
                      key={tab.value}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    >
                      <TabsTrigger
                        value={tab.value}
                        className="flex items-center gap-4 h-16 rounded-2xl data-[state=active]:liquid-glass data-[state=active]:shadow-lg transition-all duration-300 w-full p-4"
                      >
                        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                          <tab.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="text-left hidden sm:block">
                          <div className="font-semibold text-foreground">{tab.title}</div>
                          <div className="text-sm text-muted-foreground">{tab.desc}</div>
                        </div>
                      </TabsTrigger>
                    </motion.div>
                  ))}
                </TabsList>
              </motion.div>
              
              <motion.div 
                className="p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <TabsContent value="students" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <StudentPanel />
                  </motion.div>
                </TabsContent>
                
                <TabsContent value="dues" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <DueFeesPanel />
                  </motion.div>
                </TabsContent>
                
                <TabsContent value="income" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <IncomeExpensePanel />
                  </motion.div>
                </TabsContent>
              </motion.div>
            </Tabs>
          </LiquidGlassCard>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
};

export default Index;

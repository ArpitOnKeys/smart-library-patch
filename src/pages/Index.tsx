
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
        <motion.div variants={itemVariants} className="text-center space-y-8">
          <div className="flex items-center justify-center space-x-6">
            <motion.div
              className="liquid-glass p-6 rounded-3xl shadow-2xl animate-glow-pulse"
              whileHover={{ 
                scale: 1.15, 
                rotate: 15,
                boxShadow: "0 0 60px hsl(var(--glow-cyan)), 0 0 100px hsl(var(--glow-violet))"
              }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <BookOpen className="h-12 w-12 text-neon-cyan" />
            </motion.div>
            <div>
              <motion.h1
                className="text-6xl font-black bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent font-montserrat"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                PATCH DASHBOARD
              </motion.h1>
              <motion.p
                className="text-glass-secondary text-2xl font-bold mt-3 font-poppins"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                Complete Library Management System
              </motion.p>
            </div>
          </div>
          
          <motion.div
            className="flex items-center justify-center space-x-4 text-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 15, -15, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <Star className="h-6 w-6 text-golden animate-glow-pulse" />
            </motion.div>
            <span className="text-glass-primary font-bold text-xl font-poppins">
              Welcome back, Admin! Ready to manage your library?
            </span>
            <motion.div
              animate={{ 
                rotate: [0, -15, 15, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, delay: 1 }}
            >
              <Star className="h-6 w-6 text-golden animate-glow-pulse" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <motion.div variants={itemVariants}>
          <LiquidGlassCard variant="panel" className="overflow-hidden animate-scale-in">
            <Tabs defaultValue="students" className="w-full">
              <motion.div 
                className="border-b border-primary/20 bg-gradient-to-r from-glow-cyan/10 via-glow-blue/5 to-glow-violet/10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-8 gap-6">
                  {[
                    { value: "students", icon: Users, title: "Student Panel", desc: "Manage Students", color: "text-primary" },
                    { value: "dues", icon: Clock, title: "Due Fees Panel", desc: "Track Payments", color: "text-accent" },
                    { value: "income", icon: TrendingUp, title: "Income & Expense", desc: "Financial Overview", color: "text-golden" }
                  ].map((tab, index) => (
                    <motion.div
                      key={tab.value}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    >
                      <TabsTrigger
                        value={tab.value}
                        className="flex items-center gap-6 h-20 w-full p-6"
                      >
                        <div className="liquid-glass p-3 rounded-2xl shadow-lg">
                          <tab.icon className={`h-8 w-8 ${tab.color}`} />
                        </div>
                        <div className="text-left hidden sm:block">
                          <div className="font-bold text-lg text-glass-primary font-montserrat">{tab.title}</div>
                          <div className="text-base text-glass-secondary font-poppins">{tab.desc}</div>
                        </div>
                      </TabsTrigger>
                    </motion.div>
                  ))}
                </TabsList>
              </motion.div>
              
              <motion.div 
                className="p-10"
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

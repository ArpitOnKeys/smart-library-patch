import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/glass/GlassCard';
import { FeesOverviewPanel } from './FeesOverviewPanel';
import { ExpensesPanel } from './ExpensesPanel';
import { NetIncomePanel } from './NetIncomePanel';
import { TrendingUp, Receipt, Calculator, DollarSign } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" as const }
  }
};

const tabContentVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" as const }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.3 }
  }
};

export const GlassIncomeExpensePanel = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabItems = [
    {
      value: 'overview',
      label: 'Fees Overview',
      icon: TrendingUp,
      gradient: 'sunset'
    },
    {
      value: 'expenses',
      label: 'Expenses',
      icon: Receipt,
      gradient: 'blossom'
    },
    {
      value: 'net-income',
      label: 'Net Income',
      icon: Calculator,
      gradient: 'nature'
    }
  ];

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="text-center space-y-4">
        <motion.div
          className="inline-flex items-center gap-3 glass-panel px-6 py-3 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <DollarSign className="h-6 w-6 text-primary" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gradient-sunset">Income & Expense Management</h2>
        </motion.div>
        
        <motion.p 
          className="text-white/70 text-lg max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Track fees, manage expenses, and monitor financial health with comprehensive analytics
        </motion.p>
      </motion.div>

      {/* Main Panel */}
      <motion.div variants={itemVariants}>
        <GlassCard variant="interactive">
          <GlassCardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Enhanced Tab List */}
              <motion.div
                className="glass-header px-6 py-4 border-b border-white/10"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TabsList className="grid w-full grid-cols-3 bg-transparent p-1 gap-2">
                  {tabItems.map((tab, index) => (
                    <motion.div
                      key={tab.value}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      <TabsTrigger 
                        value={tab.value} 
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                          data-[state=active]:glass-panel data-[state=active]:bg-primary/20 
                          data-[state=active]:text-primary data-[state=active]:shadow-lg
                          hover:bg-white/5 text-white/70 hover:text-white
                        `}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <tab.icon className="h-5 w-5" />
                        </motion.div>
                        <span className="font-medium">{tab.label}</span>
                        {activeTab === tab.value && (
                          <motion.div
                            className="w-2 h-2 rounded-full bg-primary"
                            layoutId="activeTab"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                      </TabsTrigger>
                    </motion.div>
                  ))}
                </TabsList>
              </motion.div>

              {/* Tab Content with Enhanced Animations */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <TabsContent value="overview" className="mt-0">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <FeesOverviewPanel />
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="expenses" className="mt-0">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ExpensesPanel />
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="net-income" className="mt-0">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <NetIncomePanel />
                      </motion.div>
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </div>
            </Tabs>
          </GlassCardContent>
        </GlassCard>
      </motion.div>

      {/* Floating Action Elements */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 300 }}
      >
        <motion.div
          className="glass-panel p-4 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 backdrop-blur-xl"
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          animate={{ 
            y: [0, -5, 0],
            boxShadow: [
              "0 0 20px hsl(var(--primary) / 0.3)",
              "0 0 40px hsl(var(--primary) / 0.5)",
              "0 0 20px hsl(var(--primary) / 0.3)"
            ]
          }}
          transition={{ 
            y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <TrendingUp className="h-6 w-6 text-primary" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
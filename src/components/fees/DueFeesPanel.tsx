
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/glass/GlassCard';
import { GlassDueFeeSlipPanel } from './GlassDueFeeSlipPanel';
import { HistoryPanel } from './HistoryPanel';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" as const }
  }
};

const tabContentVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.2 }
  }
};

export const DueFeesPanel = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('due-slips');

  const handleReminderSent = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <motion.div
      className="w-full max-w-7xl mx-auto p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <GlassCard variant="interactive">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-3" gradient="sunset">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⏳
              </motion.span>
              Due Fees Panel
            </GlassCardTitle>
            <GlassCardDescription>
              Track pending fees and send WhatsApp reminders to students with immersive glassmorphic interface
            </GlassCardDescription>
          </GlassCardHeader>
          
          <GlassCardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <motion.div variants={itemVariants}>
                <TabsList className="grid w-full grid-cols-2 glass-panel bg-white/5 p-2 gap-2">
                  <TabsTrigger 
                    value="due-slips" 
                    className="glass-panel data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-white/70 hover:text-white transition-all duration-300"
                  >
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Due Fee Slip Panel
                    </motion.span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history"
                    className="glass-panel data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-white/70 hover:text-white transition-all duration-300"
                  >
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      History Panel
                    </motion.span>
                  </TabsTrigger>
                </TabsList>
              </motion.div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="mt-6"
                >
                  <TabsContent value="due-slips" className="mt-0">
                    <GlassDueFeeSlipPanel onReminderSent={handleReminderSent} />
                  </TabsContent>
                  
                  <TabsContent value="history" className="mt-0">
                    <HistoryPanel refreshTrigger={refreshTrigger} />
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </GlassCardContent>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

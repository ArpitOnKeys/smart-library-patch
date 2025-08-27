
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/glass/GlassCard';
import { AdmissionForm } from './AdmissionForm';
import { StudentTable } from './StudentTable';
import { FeeTracker } from './FeeTracker';
import { Users, UserPlus, CreditCard } from 'lucide-react';

export const StudentPanel = () => {
  const [activeTab, setActiveTab] = useState('admission');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleStudentAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('data'); // Switch to data panel after adding student
  };

  const handleStudentUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <GlassCard variant="highlight" glowColor="primary">
        <GlassCardHeader>
          <GlassCardTitle gradient="sunset" className="flex items-center gap-3">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              🧑‍🎓
            </motion.div>
            Student Management Hub
          </GlassCardTitle>
          <GlassCardDescription>
            Next-generation student admissions, data management, and fee tracking system
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-2">
              <TabsTrigger 
                value="admission" 
                className="flex items-center gap-3 h-12 rounded-xl data-[state=active]:glass-panel data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:glow-primary hover:glass-panel hover:bg-white/10 transition-all duration-300 text-white/80 hover:text-white"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Admission Form</span>
                <span className="sm:hidden">Admit</span>
              </TabsTrigger>
              <TabsTrigger 
                value="data"
                className="flex items-center gap-3 h-12 rounded-xl data-[state=active]:glass-panel data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary data-[state=active]:glow-secondary hover:glass-panel hover:bg-white/10 transition-all duration-300 text-white/80 hover:text-white"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Student Data</span>
                <span className="sm:hidden">Data</span>
              </TabsTrigger>
              <TabsTrigger 
                value="fees"
                className="flex items-center gap-3 h-12 rounded-xl data-[state=active]:glass-panel data-[state=active]:bg-accent/20 data-[state=active]:text-accent data-[state=active]:glow-accent hover:glass-panel hover:bg-white/10 transition-all duration-300 text-white/80 hover:text-white"
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Fee Tracker</span>
                <span className="sm:hidden">Fees</span>
              </TabsTrigger>
            </TabsList>
            
            <motion.div className="mt-6">
              <TabsContent value="admission" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <AdmissionForm onStudentAdded={handleStudentAdded} />
                </motion.div>
              </TabsContent>
              
              <TabsContent value="data" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <StudentTable 
                    refreshTrigger={refreshTrigger} 
                    onStudentUpdated={handleStudentUpdated}
                  />
                </motion.div>
              </TabsContent>
              
              <TabsContent value="fees" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <FeeTracker refreshTrigger={refreshTrigger} />
                </motion.div>
              </TabsContent>
            </motion.div>
          </Tabs>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
};

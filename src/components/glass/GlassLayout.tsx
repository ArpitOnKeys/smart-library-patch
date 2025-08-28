import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedBackground } from '@/components/scenic/AnimatedBackground';
import { GlassNavigation } from './GlassNavigation';
import { AmbientSoundControl } from '@/components/ambient/AmbientSoundControl';

interface GlassLayoutProps {
  children: React.ReactNode;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1
  }
};

export const GlassLayout: React.FC<GlassLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      {/* Static Scenic Background */}
      <AnimatedBackground />
      
      {/* Main Layout Container */}
      <motion.div
        className="relative z-20 min-h-screen"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Glass Navigation Header */}
        <motion.header
          variants={itemVariants}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-20"
        >
          <GlassNavigation />
        </motion.header>

        {/* Main Content Area */}
        <motion.main
          variants={itemVariants}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="relative z-10 px-4 sm:px-6 lg:px-8 pb-20"
        >
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key="main-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="pt-8"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.main>

        {/* Ambient Sound Controls */}
        <AmbientSoundControl />
      </motion.div>
    </div>
  );
};
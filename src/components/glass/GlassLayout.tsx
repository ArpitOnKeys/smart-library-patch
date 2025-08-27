import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedBackground } from '@/components/scenic/AnimatedBackground';
import { GlassNavigation } from './GlassNavigation';

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Scenic Background */}
      <AnimatedBackground />
      
      {/* Main Layout Container */}
      <motion.div
        className="relative z-10 min-h-screen"
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

        {/* Floating Glass Elements for Ambiance */}
        <div className="fixed inset-0 pointer-events-none z-5">
          <motion.div
            className="absolute top-20 left-10 w-32 h-32 glass-panel rounded-full opacity-20"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute top-40 right-20 w-24 h-24 glass-panel rounded-full opacity-15"
            animate={{
              y: [0, 15, 0],
              x: [0, 10, 0],
              rotate: [0, -360],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute bottom-40 left-1/4 w-20 h-20 glass-panel rounded-full opacity-10"
            animate={{
              y: [0, -25, 0],
              x: [0, -15, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Ambient Particles Overlay */}
        <div className="fixed inset-0 pointer-events-none z-1">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 6,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};
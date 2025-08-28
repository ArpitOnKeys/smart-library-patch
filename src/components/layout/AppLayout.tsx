
import React from 'react';
import { motion } from 'framer-motion';
import { NavBar } from './NavBar';
import { BrandFooter } from './BrandFooter';
import { ScenicBackground } from '@/components/scenic/ScenicBackground';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Scenic Background System */}
      <ScenicBackground />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <NavBar />
        <motion.main
          className="flex-1 container mx-auto px-4 py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.2,
            ease: "easeOut"
          }}
        >
          {children}
        </motion.main>
        <BrandFooter />
      </div>
    </div>
  );
};

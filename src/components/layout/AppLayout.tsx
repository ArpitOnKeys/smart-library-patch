
import React from 'react';
import { motion } from 'framer-motion';
import { NavBar } from './NavBar';
import { BrandFooter } from './BrandFooter';
import { ScenicBackground } from '@/components/scenic/ScenicBackground';
import { PerformanceContainer, SmoothMotion } from '@/components/ui/performance-optimizer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <PerformanceContainer className="min-h-screen relative overflow-hidden">
      {/* Ultra-Sharp Scenic Background System */}
      <ScenicBackground />
      
      {/* Main Content with Zero-Lag Performance */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <NavBar />
        <SmoothMotion
          className="flex-1 container mx-auto px-4 py-8"
          delay={0.1}
        >
          {children}
        </SmoothMotion>
        <BrandFooter />
      </div>
    </PerformanceContainer>
  );
};

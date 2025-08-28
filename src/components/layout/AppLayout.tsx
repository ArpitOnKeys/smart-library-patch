
import React from 'react';
import { NavBar } from './NavBar';
import { BrandFooter } from './BrandFooter';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-purple-50 dark:from-gray-900 dark:via-background dark:to-purple-900 flex flex-col">
      <NavBar />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <BrandFooter />
    </div>
  );
};

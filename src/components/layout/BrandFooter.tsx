
import React from 'react';
import { Branding } from '@/components/ui/Branding';

export const BrandFooter: React.FC = () => {
  return (
    <footer className="brand-gradient py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-2">
          <Branding variant="footer" size="md" />
          <p className="text-white/80 text-xs text-center">
            Smart Library Management System
          </p>
        </div>
      </div>
    </footer>
  );
};

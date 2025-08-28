import React from 'react';

// Simple Static Scenic Background Component
export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Static scenic background with CSS gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-blue-200 to-green-200">
        {/* Mountain silhouettes */}
        <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-green-300/30 via-transparent to-transparent" />
        
        {/* Cherry blossom accent areas */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-pink-300/20 rounded-full blur-xl" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-pink-400/15 rounded-full blur-lg" />
        <div className="absolute bottom-40 left-1/4 w-20 h-20 bg-pink-200/25 rounded-full blur-lg" />
        
        {/* River reflection areas */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-blue-200/30 via-blue-100/20 to-transparent" />
        
        {/* Soft cloud-like areas */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 via-transparent to-transparent" />
      </div>
      
      {/* Subtle overlay for UI readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-black/2 pointer-events-none" />
    </div>
  );
};
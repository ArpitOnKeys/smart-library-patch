import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MicroInteractionProps {
  children: React.ReactNode;
  type?: 'hover-lift' | 'hover-glow' | 'hover-scale' | 'click-ripple';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export const MicroInteraction: React.FC<MicroInteractionProps> = ({
  children,
  type = 'hover-lift',
  className,
  disabled = false,
  onClick,
}) => {
  const variants = {
    'hover-lift': {
      rest: { 
        y: 0, 
        scale: 1,
        boxShadow: '0 4px 12px hsl(var(--glow-blue) / 0.1)'
      },
      hover: { 
        y: -4, 
        scale: 1.02,
        boxShadow: '0 12px 32px hsl(var(--glow-blue) / 0.2), 0 4px 16px hsl(var(--glow-pink) / 0.1)'
      },
      tap: { 
        y: 0, 
        scale: 0.98 
      }
    },
    'hover-glow': {
      rest: { 
        scale: 1,
        filter: 'brightness(1)'
      },
      hover: { 
        scale: 1.05,
        filter: 'brightness(1.1)'
      },
      tap: { 
        scale: 0.95 
      }
    },
    'hover-scale': {
      rest: { 
        scale: 1 
      },
      hover: { 
        scale: 1.08 
      },
      tap: { 
        scale: 0.92 
      }
    },
    'click-ripple': {
      rest: { 
        scale: 1 
      },
      hover: { 
        scale: 1.02 
      },
      tap: { 
        scale: 0.98 
      }
    }
  };

  return (
    <motion.div
      className={cn(
        'transform-gpu will-change-transform cursor-pointer select-none',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      variants={variants[type]}
      initial="rest"
      whileHover={!disabled ? "hover" : "rest"}
      whileTap={!disabled ? "tap" : "rest"}
      onClick={!disabled ? onClick : undefined}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.8
      }}
    >
      {children}
    </motion.div>
  );
};

// Premium floating animation for accent elements
export const FloatingElement: React.FC<{
  children: React.ReactNode;
  delay?: number;
  amplitude?: number;
  className?: string;
}> = ({ children, delay = 0, amplitude = 10, className }) => {
  return (
    <motion.div
      className={cn('transform-gpu will-change-transform', className)}
      initial={{ y: 0 }}
      animate={{
        y: [-amplitude, amplitude, -amplitude],
        rotate: [-1, 1, -1]
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
};

// Shimmer loading effect for premium feel
export const ShimmerEffect: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden bg-gradient-to-r from-transparent via-white/20 to-transparent',
        className
      )}
      initial={{ x: '-100%' }}
      animate={{ x: '200%' }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
};
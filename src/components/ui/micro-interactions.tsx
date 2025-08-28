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
        boxShadow: '0 8px 24px hsl(var(--glow-blue) / 0.15)',
        filter: 'brightness(1)'
      },
      hover: { 
        y: -3, 
        scale: 1.015,
        boxShadow: '0 20px 50px hsl(var(--glow-blue) / 0.25), 0 8px 20px hsl(var(--glow-pink) / 0.15)',
        filter: 'brightness(1.03)'
      },
      tap: { 
        y: -1, 
        scale: 0.99,
        transition: { duration: 0.1 }
      }
    },
    'hover-glow': {
      rest: { 
        scale: 1,
        filter: 'brightness(1)',
        boxShadow: '0 4px 12px hsl(var(--glow-blue) / 0.1)'
      },
      hover: { 
        scale: 1.03,
        filter: 'brightness(1.08)',
        boxShadow: '0 12px 30px hsl(var(--glow-blue) / 0.2), 0 0 20px hsl(var(--primary) / 0.15)'
      },
      tap: { 
        scale: 0.97,
        transition: { duration: 0.1 }
      }
    },
    'hover-scale': {
      rest: { 
        scale: 1,
        filter: 'brightness(1)'
      },
      hover: { 
        scale: 1.05,
        filter: 'brightness(1.05)'
      },
      tap: { 
        scale: 0.95,
        transition: { duration: 0.1 }
      }
    },
    'click-ripple': {
      rest: { 
        scale: 1,
        filter: 'brightness(1)'
      },
      hover: { 
        scale: 1.02,
        filter: 'brightness(1.02)'
      },
      tap: { 
        scale: 0.98,
        transition: { duration: 0.1 }
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
        stiffness: 600,
        damping: 30,
        mass: 0.6,
        velocity: 2
      }}
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden'
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
}> = ({ children, delay = 0, amplitude = 8, className }) => {
  return (
    <motion.div
      className={cn('transform-gpu will-change-transform', className)}
      initial={{ y: 0, rotate: 0 }}
      animate={{
        y: [-amplitude, amplitude, -amplitude],
        rotate: [-0.5, 0.5, -0.5]
      }}
      transition={{
        duration: 3.5,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
        type: "tween"
      }}
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden'
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
        'relative overflow-hidden',
        className
      )}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 0.5
        }}
        style={{
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden'
        }}
      />
      {children}
    </motion.div>
  );
};
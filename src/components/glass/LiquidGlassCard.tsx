import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'panel' | 'nav';
  hover?: boolean;
  onClick?: () => void;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className,
  variant = 'default',
  hover = true,
  onClick,
}) => {
  const baseClasses = {
    default: 'liquid-glass',
    panel: 'liquid-glass-panel',
    nav: 'liquid-glass-nav',
  };

  const hoverVariants = {
    rest: {
      scale: 1,
      y: 0,
      boxShadow: '0 12px 40px hsl(var(--glow-blue) / 0.2)',
      filter: 'brightness(1)',
    },
    hover: {
      scale: hover ? 1.02 : 1,
      y: hover ? -4 : 0,
      boxShadow: hover
        ? '0 40px 100px hsl(var(--glow-blue) / 0.3), 0 20px 50px hsl(var(--glow-pink) / 0.2), 0 10px 25px hsl(var(--glow-golden) / 0.15)'
        : '0 12px 40px hsl(var(--glow-blue) / 0.2)',
      filter: hover ? 'brightness(1.03)' : 'brightness(1)',
    },
    tap: {
      scale: 0.98,
      y: -1,
      transition: { duration: 0.1 }
    },
  };

  return (
    <motion.div
      className={cn(baseClasses[variant], className)}
      variants={hoverVariants}
      initial="rest"
      whileHover={hover ? "hover" : "rest"}
      whileTap={onClick ? "tap" : undefined}
      onClick={onClick}
      transition={{
        type: "spring",
        stiffness: 700,
        damping: 35,
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
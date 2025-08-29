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
      boxShadow: '0 12px 40px hsl(var(--glow-blue) / 0.25)',
      filter: 'brightness(1)',
    },
    hover: {
      scale: hover ? 1.03 : 1,
      y: hover ? -6 : 0,
      boxShadow: hover
        ? '0 32px 80px hsl(var(--glow-blue) / 0.4), 0 16px 40px hsl(var(--glow-pink) / 0.3), 0 8px 20px hsl(var(--glow-golden) / 0.2)'
        : '0 12px 40px hsl(var(--glow-blue) / 0.25)',
      filter: hover ? 'brightness(1.05)' : 'brightness(1)',
    },
    tap: {
      scale: 0.97,
      y: -2,
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
        stiffness: 600,
        damping: 30,
        mass: 0.8,
      }}
    >
      {children}
    </motion.div>
  );
};
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
      boxShadow: '0 8px 32px hsl(var(--glow-blue) / 0.3)',
    },
    hover: {
      scale: hover ? 1.02 : 1,
      y: hover ? -4 : 0,
      boxShadow: hover
        ? '0 20px 60px hsl(var(--glow-blue) / 0.4), 0 8px 24px hsl(var(--glow-pink) / 0.3)'
        : '0 8px 32px hsl(var(--glow-blue) / 0.3)',
    },
    tap: {
      scale: 0.98,
      y: 0,
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
        stiffness: 400,
        damping: 25,
      }}
    >
      {children}
    </motion.div>
  );
};
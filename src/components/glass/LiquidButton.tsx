import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LiquidButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({
  children,
  className,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const variants = {
    primary: 'button-liquid text-primary-foreground',
    secondary: 'bg-secondary/80 text-secondary-foreground border border-border/30 backdrop-blur-xl',
    accent: 'bg-accent/80 text-accent-foreground border border-border/30 backdrop-blur-xl',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !onClick) return;

    // Create ripple effect
    const button = buttonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      button.style.setProperty('--x', `${x}%`);
      button.style.setProperty('--y', `${y}%`);
    }

    onClick();
  };

  const buttonVariants = {
    rest: {
      scale: 1,
      y: 0,
    },
    hover: {
      scale: 1.05,
      y: -2,
    },
    tap: {
      scale: 0.95,
      y: 0,
    },
  };

  return (
    <motion.button
      ref={buttonRef}
      className={cn(
        'ripple-effect rounded-xl font-medium transition-all duration-300 relative overflow-hidden',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      variants={buttonVariants}
      initial="rest"
      whileHover={!disabled ? "hover" : "rest"}
      whileTap={!disabled ? "tap" : "rest"}
      onClick={handleClick}
      disabled={disabled}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
    >
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};
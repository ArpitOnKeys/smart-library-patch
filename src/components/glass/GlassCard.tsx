import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: 'default' | 'interactive' | 'floating' | 'highlight';
  glowColor?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

const cardVariants = {
  default: "glass-card",
  interactive: "glass-card hover:scale-[1.02] hover:shadow-2xl cursor-pointer",
  floating: "glass-card floating",
  highlight: "glass-card border-primary/30 bg-primary/5 glow-primary"
};

const glowVariants = {
  primary: "hover:glow-primary",
  secondary: "hover:glow-secondary", 
  accent: "hover:glow-accent"
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  glowColor = 'primary',
  className,
  ...props
}) => {
  return (
    <motion.div
      className={cn(
        cardVariants[variant],
        glowColor && glowVariants[glowColor],
        "transition-all duration-300",
        className
      )}
      whileHover={{ scale: variant === 'interactive' ? 1.02 : 1 }}
      whileTap={{ scale: variant === 'interactive' ? 0.98 : 1 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Glass Card Header Component
interface GlassCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCardHeader: React.FC<GlassCardHeaderProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn(
      "flex flex-col space-y-1.5 p-6 border-b border-white/10",
      className
    )}>
      {children}
    </div>
  );
};

// Glass Card Title Component
interface GlassCardTitleProps {
  children: React.ReactNode;
  className?: string;
  gradient?: 'sunset' | 'blossom' | 'nature';
}

const gradientVariants = {
  sunset: "text-gradient-sunset",
  blossom: "text-gradient-blossom",
  nature: "text-gradient-nature"
};

export const GlassCardTitle: React.FC<GlassCardTitleProps> = ({
  children,
  className,
  gradient
}) => {
  return (
    <h3 className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      gradient ? gradientVariants[gradient] : "text-foreground",
      className
    )}>
      {children}
    </h3>
  );
};

// Glass Card Description Component
interface GlassCardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCardDescription: React.FC<GlassCardDescriptionProps> = ({
  children,
  className
}) => {
  return (
    <p className={cn(
      "text-sm text-white/70",
      className
    )}>
      {children}
    </p>
  );
};

// Glass Card Content Component
interface GlassCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCardContent: React.FC<GlassCardContentProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn("p-6 pt-0", className)}>
      {children}
    </div>
  );
};

// Glass Card Footer Component
interface GlassCardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCardFooter: React.FC<GlassCardFooterProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn(
      "flex items-center p-6 pt-0 border-t border-white/10 mt-auto",
      className
    )}>
      {children}
    </div>
  );
};
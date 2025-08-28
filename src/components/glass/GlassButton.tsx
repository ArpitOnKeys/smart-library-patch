import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';

interface GlassButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'glass' | 'glass-primary' | 'glass-secondary' | 'glass-accent' | 'glass-destructive';
  glowIntensity?: 'subtle' | 'normal' | 'intense';
  ripple?: boolean;
  children: React.ReactNode;
}

const glassVariants = {
  glass: "glass-panel bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105",
  'glass-primary': "glass-panel bg-primary/20 border-primary/30 text-primary hover:bg-primary/30 hover:scale-105 glow-primary",
  'glass-secondary': "glass-panel bg-secondary/20 border-secondary/30 text-secondary hover:bg-secondary/30 hover:scale-105 glow-secondary",
  'glass-accent': "glass-panel bg-accent/20 border-accent/30 text-accent hover:bg-accent/30 hover:scale-105 glow-accent",
  'glass-destructive': "glass-panel bg-destructive/20 border-destructive/30 text-destructive hover:bg-destructive/30 hover:scale-105"
};

const glowIntensities = {
  subtle: "hover:shadow-[0_0_20px_hsl(var(--primary)_/_0.2)]",
  normal: "hover:shadow-[0_0_30px_hsl(var(--primary)_/_0.4)]",
  intense: "hover:shadow-[0_0_50px_hsl(var(--primary)_/_0.6)]"
};

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'glass',
  glowIntensity = 'normal',
  ripple = true,
  children,
  className,
  ...props
}) => {
  const [isRippling, setIsRippling] = React.useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple) {
      setIsRippling(true);
      setTimeout(() => setIsRippling(false), 600);
    }
    
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <motion.div className="relative overflow-hidden">
      <Button
        {...props}
        onClick={handleClick}
        className={cn(
          glassVariants[variant],
          glowIntensities[glowIntensity],
          "relative transition-all duration-300 active:scale-95",
          className
        )}
        asChild
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" as const }}
        >
          <span className="relative z-10">
            {children}
          </span>
          
          {/* Ripple Effect */}
          {ripple && isRippling && (
            <motion.div
              className="absolute inset-0 bg-white/20 rounded-full"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          )}
          
          {/* Shimmer Effect */}
          <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </motion.button>
      </Button>
    </motion.div>
  );
};

// Glass Icon Button Component
interface GlassIconButtonProps extends GlassButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label?: string;
}

export const GlassIconButton: React.FC<GlassIconButtonProps> = ({
  icon: Icon,
  label,
  variant = 'glass',
  ...props
}) => {
  return (
    <GlassButton
      {...props}
      variant={variant}
      size="icon"
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
    </GlassButton>
  );
};

// Glass Button Group Component
interface GlassButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const GlassButtonGroup: React.FC<GlassButtonGroupProps> = ({
  children,
  className,
  orientation = 'horizontal'
}) => {
  return (
    <div className={cn(
      "flex gap-2",
      orientation === 'vertical' ? "flex-col" : "flex-row",
      className
    )}>
      {children}
    </div>
  );
};

// Floating Action Button
interface GlassFloatingButtonProps extends GlassButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const positionVariants = {
  'bottom-right': "fixed bottom-6 right-6",
  'bottom-left': "fixed bottom-6 left-6",
  'top-right': "fixed top-6 right-6",
  'top-left': "fixed top-6 left-6"
};

export const GlassFloatingButton: React.FC<GlassFloatingButtonProps> = ({
  position = 'bottom-right',
  className,
  ...props
}) => {
  return (
    <motion.div
      className={cn(positionVariants[position], "z-50")}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" as const }}
    >
      <GlassButton
        {...props}
        size="icon"
        variant="glass-primary"
        className={cn("h-14 w-14 rounded-full shadow-2xl", className)}
      />
    </motion.div>
  );
};
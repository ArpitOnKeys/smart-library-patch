import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LiquidGlassCard } from '@/components/glass/LiquidGlassCard';

interface BrandingProps {
  className?: string;
  variant?: 'footer' | 'pdf' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const Branding: React.FC<BrandingProps> = ({
  className,
  variant = 'footer',
  size = 'md',
  showTooltip = true,
}) => {
  const handleClick = () => {
    // Optional: Open developer portfolio or contact page
    // window.open('https://developer-portfolio.com', '_blank');
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  };

  if (variant === 'pdf') {
    return (
      <div className="text-muted-foreground/60 text-xs font-medium tracking-wider">
        ⚡ Powered by Arpit
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'inline-flex items-center gap-1 text-muted-foreground/80 font-medium tracking-wide',
          sizeClasses[size],
          className
        )}
      >
        <Zap className="w-3 h-3 text-golden" />
        <span>Powered by Arpit</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn('relative group', className)}
    >
      <LiquidGlassCard
        variant="nav"
        hover={true}
        onClick={handleClick}
        className={cn(
          'cursor-pointer relative overflow-hidden',
          sizeClasses[size]
        )}
      >
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/20 via-golden/20 to-glow-pink/20 opacity-0 group-hover:opacity-100"
          animate={{
            background: [
              'linear-gradient(45deg, hsl(var(--primary) / 0.1), hsl(var(--golden) / 0.1))',
              'linear-gradient(45deg, hsl(var(--golden) / 0.1), hsl(var(--glow-pink) / 0.1))',
              'linear-gradient(45deg, hsl(var(--glow-pink) / 0.1), hsl(var(--primary) / 0.1))',
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Content */}
        <div className="relative flex items-center gap-2 z-10">
          <motion.div
            animate={{
              rotate: [0, 15, -15, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <Zap className="w-4 h-4 text-golden drop-shadow-sm" />
          </motion.div>
          
          <motion.span
            className="font-semibold text-foreground/90 tracking-wide uppercase"
            animate={{
              textShadow: [
                '0 0 0px hsl(var(--golden) / 0)',
                '0 0 8px hsl(var(--golden) / 0.4)',
                '0 0 0px hsl(var(--golden) / 0)',
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          >
            Powered by Arpit
          </motion.span>
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            whileHover={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute -top-10 left-1/2 transform -translate-x-1/2 
                       bg-popover/95 backdrop-blur-sm border rounded-md px-2 py-1 
                       text-xs text-popover-foreground whitespace-nowrap
                       shadow-lg pointer-events-none z-20"
          >
            Built with passion ✨
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 
                           border-l-4 border-r-4 border-t-4 border-transparent 
                           border-t-popover/95" />
          </motion.div>
        )}
      </LiquidGlassCard>
    </motion.div>
  );
};
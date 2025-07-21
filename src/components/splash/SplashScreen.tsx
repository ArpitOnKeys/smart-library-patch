import { motion } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 2000); // Show splash for 2 seconds
      }}
      className="fixed inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center z-50"
    >
      <div className="text-center space-y-8">
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            duration: 0.8,
            type: "spring",
            stiffness: 100,
            damping: 10
          }}
          className="relative mx-auto w-24 h-24"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-white" />
          </div>
          
          {/* Floating sparkles */}
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute inset-0 pointer-events-none"
          >
            <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-yellow-400" />
            <Sparkles className="absolute -bottom-2 -left-2 h-3 w-3 text-blue-400" />
            <Sparkles className="absolute top-0 -left-3 h-2 w-2 text-purple-400" />
          </motion.div>
        </motion.div>

        {/* Title Animation */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="space-y-4"
        >
          <motion.h1
            className="text-6xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            PATCH
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="text-xl font-medium text-muted-foreground"
          >
            THE SMART LIBRARY
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span>Powered by Arpit Upadhyay</span>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </motion.div>
        </motion.div>

        {/* Loading Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.3 }}
          className="space-y-3"
        >
          <div className="w-48 h-1 bg-muted rounded-full mx-auto overflow-hidden">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
            />
          </div>
          
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-sm text-muted-foreground"
          >
            Loading your library...
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
};
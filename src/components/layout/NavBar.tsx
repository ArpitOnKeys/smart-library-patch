
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Settings, LogOut } from 'lucide-react';
import { auth } from '@/lib/database';
import { LiquidButton } from '@/components/glass/LiquidButton';

export const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    auth.logout();
    window.location.reload();
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: BookOpen },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.nav
      className="liquid-glass-nav sticky top-0 z-50"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.8,
        delay: 0.1,
        type: "spring",
        stiffness: 100,
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <motion.div
            className="flex items-center space-x-3"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <motion.div
              className="brand-gradient brand-glow p-3 rounded-2xl"
              whileHover={{ 
                scale: 1.1, 
                rotate: 5,
                boxShadow: "0 0 30px hsl(var(--glow-blue)), 0 0 60px hsl(var(--glow-pink))"
              }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <BookOpen className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <motion.h1
                className="font-bold text-xl bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                PATCH
              </motion.h1>
              <motion.p
                className="text-xs text-muted-foreground font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                THE SMART LIBRARY
              </motion.p>
            </div>
          </motion.div>

          {/* Navigation Links */}
          <motion.div
            className="hidden md:flex items-center space-x-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {navItems.map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              >
                <LiquidButton
                  variant={isActive(item.path) ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </LiquidButton>
              </motion.div>
            ))}
          </motion.div>

          {/* User Actions */}
          <motion.div
            className="flex items-center space-x-3"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <motion.div
              className="hidden sm:block px-3 py-1 rounded-lg bg-muted/30 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <span className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Admin
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <LiquidButton
                variant="accent"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </LiquidButton>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
};

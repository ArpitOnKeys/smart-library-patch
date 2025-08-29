import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import scenicBg from '@/assets/scenic-background.jpg';

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

export const ScenicBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<FloatingParticle[]>([]);

  useEffect(() => {
    // Initialize floating particles (birds, light spots, etc.)
    const particles: FloatingParticle[] = [];
    for (let i = 0; i < 8; i++) {
      particles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 4 + 2,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }
    particlesRef.current = particles;

    // Parallax scroll effect
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const bg = document.querySelector('.parallax-bg') as HTMLElement;
      const mg = document.querySelector('.parallax-mg') as HTMLElement;
      const fg = document.querySelector('.parallax-fg') as HTMLElement;

      if (bg) bg.style.transform = `translateY(${scrolled * 0.1}px)`;
      if (mg) mg.style.transform = `translateY(${scrolled * 0.3}px)`;
      if (fg) fg.style.transform = `translateY(${scrolled * 0.5}px)`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Main Scenic Background */}
      <motion.div
        className="parallax-bg absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${scenicBg})` }}
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />

      {/* Atmospheric Overlay */}
      <motion.div
        className="parallax-mg absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, hsl(var(--light-ray)) 0%, transparent 40%),
            linear-gradient(135deg, transparent 0%, hsl(var(--mist)) 30%, transparent 60%),
            radial-gradient(circle at 80% 60%, hsl(var(--glow-golden)) 0%, transparent 25%)
          `,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 3, delay: 0.5 }}
      />

      {/* Floating Light Particles */}
      <div className="parallax-fg absolute inset-0">
        {particlesRef.current.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              background: `radial-gradient(circle, hsl(var(--glow-golden)) 0%, transparent 70%)`,
              opacity: particle.opacity,
            }}
            initial={{ x: particle.x, y: particle.y }}
            animate={{
              x: particle.x + Math.sin(Date.now() * 0.001 + particle.id) * 50,
              y: particle.y + Math.cos(Date.now() * 0.001 + particle.id) * 30,
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Soft Mist Effect */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1/3"
        style={{
          background: `linear-gradient(to top, hsl(var(--mist)) 0%, transparent 100%)`,
        }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 4, delay: 1 }}
      />

      {/* Light Rays */}
      <motion.div
        className="absolute top-0 left-1/4 w-64 h-full opacity-20"
        style={{
          background: `linear-gradient(135deg, hsl(var(--light-ray)) 0%, transparent 50%)`,
          transform: 'rotate(-15deg)',
          transformOrigin: 'top left',
        }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 0.3, scaleY: 1 }}
        transition={{ duration: 2.5, delay: 1.5 }}
      />

      <motion.div
        className="absolute top-0 right-1/3 w-48 h-full opacity-15"
        style={{
          background: `linear-gradient(135deg, hsl(var(--glow-golden)) 0%, transparent 40%)`,
          transform: 'rotate(20deg)',
          transformOrigin: 'top right',
        }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 0.2, scaleY: 1 }}
        transition={{ duration: 3, delay: 2 }}
      />
    </div>
  );
};
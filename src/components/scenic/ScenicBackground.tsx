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
    <div 
      ref={containerRef} 
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{
        zIndex: -10,
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden'
      }}
    >
      {/* Ultra-Sharp Scenic Background */}
      <motion.div
        className="parallax-bg absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${scenicBg})`,
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden'
        }}
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Enhanced Atmospheric Overlay */}
      <motion.div
        className="parallax-mg absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 25% 15%, hsl(var(--glow-blue)) 0%, transparent 50%),
            radial-gradient(circle at 75% 25%, hsl(var(--glow-pink)) 0%, transparent 45%),
            radial-gradient(circle at 50% 75%, hsl(var(--glow-golden)) 0%, transparent 40%),
            linear-gradient(135deg, hsl(var(--primary))/10% 0%, transparent 70%)
          `,
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.3 }}
      />

      {/* Optimized Floating Light Particles */}
      <div className="parallax-fg absolute inset-0">
        {particlesRef.current.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: particle.size * 0.8,
              height: particle.size * 0.8,
              background: `radial-gradient(circle, hsl(var(--primary)/${particle.opacity + 0.2}) 0%, transparent 60%)`,
              opacity: particle.opacity * 0.8,
              transform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden'
            }}
            initial={{ x: particle.x, y: particle.y }}
            animate={{
              x: particle.x + Math.sin(Date.now() * 0.0008 + particle.id) * 40,
              y: particle.y + Math.cos(Date.now() * 0.0008 + particle.id) * 25,
              opacity: [particle.opacity * 0.5, particle.opacity, particle.opacity * 0.5]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Ultra-Soft Mist Effect */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1/4"
        style={{
          background: `linear-gradient(to top, hsl(var(--mist)) 0%, transparent 100%)`,
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden'
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2.5, delay: 0.8 }}
      />

      {/* Enhanced Light Rays */}
      <motion.div
        className="absolute top-0 left-1/4 w-48 h-2/3 opacity-15"
        style={{
          background: `linear-gradient(135deg, hsl(var(--light-ray)) 0%, transparent 60%)`,
          transform: 'rotate(-12deg) translate3d(0, 0, 0)',
          transformOrigin: 'top left',
          backfaceVisibility: 'hidden'
        }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 0.25, scaleY: 1 }}
        transition={{ duration: 2, delay: 1.2 }}
      />

      <motion.div
        className="absolute top-0 right-1/3 w-40 h-2/3 opacity-12"
        style={{
          background: `linear-gradient(135deg, hsl(var(--glow-golden)) 0%, transparent 50%)`,
          transform: 'rotate(15deg) translate3d(0, 0, 0)',
          transformOrigin: 'top right',
          backfaceVisibility: 'hidden'
        }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 0.18, scaleY: 1 }}
        transition={{ duration: 2.5, delay: 1.5 }}
      />
    </div>
  );
};
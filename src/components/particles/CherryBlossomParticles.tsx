import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
}

export const CherryBlossomParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      const particleCount = Math.min(50, Math.max(20, Math.floor(window.innerWidth / 30)));

      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push(createParticle(i));
      }
    };

    const createParticle = (id: number): Particle => {
      const colors = [
        'rgba(255, 182, 193, 0.8)', // Light pink
        'rgba(255, 192, 203, 0.7)', // Pink
        'rgba(255, 255, 255, 0.6)', // White
        'rgba(255, 218, 224, 0.8)', // Very light pink
        'rgba(255, 228, 225, 0.5)', // Misty rose
      ];

      return {
        id,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 4 + 2,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: Math.random() * 1 + 0.5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
        opacity: Math.random() * 0.5 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    };

    const drawPetal = (ctx: CanvasRenderingContext2D, particle: Particle) => {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate((particle.rotation * Math.PI) / 180);
      ctx.globalAlpha = particle.opacity;

      // Create petal shape
      ctx.beginPath();
      ctx.fillStyle = particle.color;
      
      // Draw a more realistic petal shape
      const size = particle.size;
      ctx.ellipse(0, 0, size, size * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Add some inner detail
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * 0.3})`;
      ctx.ellipse(0, -size * 0.3, size * 0.3, size * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const updateParticles = () => {
      particlesRef.current.forEach(particle => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.rotation += particle.rotationSpeed;

        // Mouse interaction - subtle attraction
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          const force = (100 - distance) / 100;
          particle.speedX += (dx / distance) * force * 0.001;
          particle.speedY += (dy / distance) * force * 0.001;
        }

        // Wind effect
        particle.speedX += Math.sin(Date.now() * 0.001 + particle.id) * 0.01;

        // Reset particles that go off screen
        if (particle.y > canvas.height + 10) {
          particle.y = -10;
          particle.x = Math.random() * canvas.width;
        }
        if (particle.x > canvas.width + 10) {
          particle.x = -10;
        }
        if (particle.x < -10) {
          particle.x = canvas.width + 10;
        }

        // Gradually fade in and out
        particle.opacity += (Math.random() - 0.5) * 0.01;
        particle.opacity = Math.max(0.1, Math.min(0.8, particle.opacity));
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      updateParticles();
      
      particlesRef.current.forEach(particle => {
        drawPetal(ctx, particle);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    initParticles();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
      style={{
        background: 'transparent',
      }}
    />
  );
};
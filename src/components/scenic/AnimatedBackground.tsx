import React, { useRef, useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  Float, 
  Stars, 
  Cloud,
  Sky,
  Environment
} from '@react-three/drei';
import * as THREE from 'three';

// Animated Water Component
function AnimatedWater() {
  const waterRef = useRef<THREE.Mesh>(null);
  
  const waterGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(100, 100, 128, 128);
    return geometry;
  }, []);

  const waterMaterial = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color('#4F9CF9') },
        color2: { value: new THREE.Color('#06B6D4') },
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          vUv = uv;
          
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          
          // Create wave effect
          float elevation = sin(modelPosition.x * 0.1 + time * 0.5) * 0.3;
          elevation += sin(modelPosition.z * 0.15 + time * 0.3) * 0.2;
          
          modelPosition.y = elevation;
          vElevation = elevation;
          
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectedPosition = projectionMatrix * viewPosition;
          
          gl_Position = projectedPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          vec3 color = mix(color1, color2, vElevation * 2.0 + 0.5);
          gl_FragColor = vec4(color, 0.8);
        }
      `,
      transparent: true,
    });
    return material;
  }, []);

  useFrame((state) => {
    if (waterRef.current && waterRef.current.material) {
      (waterRef.current.material as THREE.ShaderMaterial).uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh
      ref={waterRef}
      geometry={waterGeometry}
      material={waterMaterial}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -5, 0]}
    />
  );
}

// Floating Particles (Cherry Blossoms)
function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  
  const [positions, colors] = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      
      // Pink cherry blossom colors
      colors[i * 3] = 0.9 + Math.random() * 0.1;     // R
      colors[i * 3 + 1] = 0.6 + Math.random() * 0.2; // G
      colors[i * 3 + 2] = 0.7 + Math.random() * 0.3; // B
    }
    
    return [positions, colors];
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 0.02; // Fall slowly
        positions[i] += Math.sin(state.clock.elapsedTime + i) * 0.01; // Drift
        
        // Reset particle when it falls too low
        if (positions[i + 1] < -10) {
          positions[i + 1] = 50;
        }
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation={true}
      />
    </points>
  );
}

// Distant Mountains
function Mountains() {
  return (
    <group>
      {/* Mountain 1 */}
      <mesh position={[-20, 0, -30]}>
        <coneGeometry args={[8, 16, 6]} />
        <meshLambertMaterial color="#8B7355" />
      </mesh>
      
      {/* Mountain 2 */}
      <mesh position={[15, 2, -35]}>
        <coneGeometry args={[12, 20, 6]} />
        <meshLambertMaterial color="#A0916B" />
      </mesh>
      
      {/* Mountain 3 */}
      <mesh position={[0, -2, -40]}>
        <coneGeometry args={[15, 25, 8]} />
        <meshLambertMaterial color="#6B5B47" />
      </mesh>
    </group>
  );
}

// Cherry Blossom Trees
function CherryBlossomTrees() {
  return (
    <group>
      {[-10, 0, 12].map((x, index) => (
        <Float
          key={index}
          speed={0.5 + index * 0.2}
          rotationIntensity={0.1}
          floatIntensity={0.3}
          floatingRange={[0, 0.5]}
        >
          <group position={[x + index * 8, 0, -5 + index * 2]}>
            {/* Tree trunk */}
            <mesh position={[0, 2, 0]}>
              <cylinderGeometry args={[0.3, 0.5, 8]} />
              <meshLambertMaterial color="#8B4513" />
            </mesh>
            
            {/* Blossom foliage */}
            <mesh position={[0, 7, 0]}>
              <sphereGeometry args={[4, 16, 16]} />
              <meshLambertMaterial color="#FFB6C1" transparent opacity={0.9} />
            </mesh>
          </group>
        </Float>
      ))}
    </group>
  );
}

// Lighting Setup
function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.4} color="#FFF8DC" />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        color="#FFD700"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 5, 5]} intensity={0.5} color="#FF69B4" />
    </>
  );
}

// Camera Controller for subtle movement
function CameraController() {
  const { camera } = useThree();
  
  useFrame((state) => {
    camera.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 2;
    camera.position.z = 20 + Math.cos(state.clock.elapsedTime * 0.1) * 3;
    camera.lookAt(0, 0, 0);
  });
  
  return null;
}

// Performance & Settings Manager
interface BackgroundSettings {
  mode: 'off' | 'lite' | 'full';
  particles: boolean;
  parallax: boolean;
}

const getDefaultSettings = (): BackgroundSettings => {
  const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;
  
  if (hasReducedMotion || hasLowMemory) {
    return { mode: 'lite', particles: false, parallax: false };
  }
  
  return { mode: 'full', particles: true, parallax: true };
};

// Fallback Static Background
function StaticFallback() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-blue-200 to-green-200">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,182,193,0.4),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(135,206,235,0.3),transparent_50%)]" />
      {/* Ken Burns animation */}
      <div className="absolute inset-0 opacity-30 animate-[float_20s_ease-in-out_infinite]" />
    </div>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-blue-100 to-green-100 animate-pulse">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,182,193,0.2),transparent_50%)]" />
    </div>
  );
}

// Performance Monitor Hook
function usePerformanceMonitor() {
  const [fps, setFps] = useState(60);
  const [lastTime, setLastTime] = useState(performance.now());
  const frameCount = useRef(0);

  useFrame(() => {
    frameCount.current++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
      setFps(Math.round((frameCount.current * 1000) / (currentTime - lastTime)));
      frameCount.current = 0;
      setLastTime(currentTime);
    }
  });

  return fps;
}

// Optimized Scene Component
function OptimizedScene({ settings }: { settings: BackgroundSettings }) {
  const fps = usePerformanceMonitor();
  
  // Auto-downgrade if performance drops
  useEffect(() => {
    if (fps < 30 && settings.mode === 'full') {
      console.warn('Performance degradation detected, consider switching to Lite mode');
    }
  }, [fps, settings.mode]);

  return (
    <>
      <SceneLighting />
      
      {/* Sky only in full mode */}
      {settings.mode === 'full' && (
        <Sky
          distance={450000}
          sunPosition={[0, 1, 0]}
          inclination={0.6}
          azimuth={0.25}
          turbidity={10}
          rayleigh={2}
        />
      )}
      
      {/* Reduced star count in lite mode */}
      <Stars
        radius={100}
        depth={50}
        count={settings.mode === 'full' ? 1000 : 300}
        factor={4}
        saturation={0}
        fade
      />
      
      <Environment preset="sunset" />
      
      <Mountains />
      <CherryBlossomTrees />
      <AnimatedWater />
      
      {/* Particles only if enabled */}
      {settings.particles && <FloatingParticles />}
      
      {/* Camera movement only if parallax enabled */}
      {settings.parallax && <CameraController />}
      
      {/* Fewer clouds in lite mode */}
      {settings.mode === 'full' && (
        <>
          <Cloud position={[-20, 10, -10]} speed={0.2} opacity={0.4} />
          <Cloud position={[25, 15, -15]} speed={0.1} opacity={0.3} />
        </>
      )}
      {settings.mode === 'lite' && (
        <Cloud position={[0, 12, -12]} speed={0.1} opacity={0.3} />
      )}
    </>
  );
}

// Debug Widget Component
function BackgroundDebugWidget({ 
  settings, 
  onSettingsChange,
  isVisible 
}: {
  settings: BackgroundSettings;
  onSettingsChange: (settings: BackgroundSettings) => void;
  isVisible: boolean;
}) {
  const [errors, setErrors] = useState<string[]>([]);
  
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 glass-panel p-3 text-xs text-white max-w-xs">
      <div className="mb-2 font-semibold">Background Health</div>
      
      <div className="space-y-1 mb-3">
        <div>Mode: {settings.mode}</div>
        <div>Particles: {settings.particles ? 'On' : 'Off'}</div>
        <div>Parallax: {settings.parallax ? 'On' : 'Off'}</div>
        <div>Size: {window.innerWidth}x{window.innerHeight}</div>
        <div>DPR: {Math.min(window.devicePixelRatio, 1.5)}</div>
      </div>

      <div className="space-y-1">
        <button
          onClick={() => onSettingsChange({ ...settings, mode: settings.mode === 'full' ? 'lite' : 'full' })}
          className="block w-full text-left px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
        >
          Toggle: {settings.mode === 'full' ? 'Lite' : 'Full'}
        </button>
        <button
          onClick={() => onSettingsChange({ ...settings, particles: !settings.particles })}
          className="block w-full text-left px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
        >
          Particles: {settings.particles ? 'Off' : 'On'}
        </button>
        <button
          onClick={() => window.location.reload()}
          className="block w-full text-left px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
        >
          Reload Background
        </button>
      </div>

      {errors.length > 0 && (
        <div className="mt-2 text-red-300 text-xs">
          Last error: {errors[errors.length - 1]}
        </div>
      )}
    </div>
  );
}

// Main Animated Background Component
export const AnimatedBackground: React.FC = () => {
  const [settings, setSettings] = useState<BackgroundSettings>(getDefaultSettings);
  const [hasError, setHasError] = useState(false);
  const [isDebugMode] = useState(() => new URLSearchParams(window.location.search).has('debug'));

  // Error boundary effect
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      if (error.message.includes('WebGL') || error.message.includes('THREE')) {
        console.error('Background rendering error:', error);
        setHasError(true);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Off mode or error fallback
  if (settings.mode === 'off' || hasError) {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden">
        <StaticFallback />
        <BackgroundDebugWidget 
          settings={settings}
          onSettingsChange={setSettings}
          isVisible={isDebugMode}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ 
            position: [0, 5, 20], 
            fov: 75,
            near: 0.1,
            far: 1000
          }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false,
            stencil: false,
            depth: true
          }}
          onCreated={({ gl, size }) => {
            // Transparent background - this fixes the black screen!
            gl.setClearColor(0x000000, 0);
            
            // Optimize pixel ratio for performance
            const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
            gl.setPixelRatio(pixelRatio);
            gl.setSize(size.width, size.height);
            
            console.log('Background renderer initialized:', {
              size: `${size.width}x${size.height}`,
              pixelRatio,
              alpha: gl.getContextAttributes()?.alpha
            });
          }}
          style={{ 
            width: '100%', 
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          <OptimizedScene settings={settings} />
        </Canvas>
      </Suspense>
      
      {/* Subtle overlay for UI readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/5 pointer-events-none" />
      
      {/* Debug Widget */}
      <BackgroundDebugWidget 
        settings={settings}
        onSettingsChange={setSettings}
        isVisible={isDebugMode}
      />
    </div>
  );
};
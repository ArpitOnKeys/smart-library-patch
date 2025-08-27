import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  Float, 
  Stars, 
  Cloud,
  Sky,
  Environment,
  OrbitControls
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

// Loading fallback
function LoadingFallback() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 animate-pulse">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,182,193,0.3),transparent_50%)]" />
    </div>
  );
}

// Main Animated Background Component
export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ 
            position: [0, 5, 20], 
            fov: 75,
            near: 0.1,
            far: 1000
          }}
          style={{ background: 'linear-gradient(to bottom, #FFB6C1, #87CEEB, #98FB98)' }}
        >
          <SceneLighting />
          <Sky
            distance={450000}
            sunPosition={[0, 1, 0]}
            inclination={0.6}
            azimuth={0.25}
            turbidity={10}
            rayleigh={2}
          />
          <Stars
            radius={100}
            depth={50}
            count={1000}
            factor={4}
            saturation={0}
            fade
          />
          <Environment preset="sunset" />
          
          <Mountains />
          <CherryBlossomTrees />
          <AnimatedWater />
          <FloatingParticles />
          
          <CameraController />
          
          <Cloud
            position={[-20, 10, -10]}
            speed={0.2}
            opacity={0.4}
          />
          <Cloud
            position={[25, 15, -15]}
            speed={0.1}
            opacity={0.3}
          />
        </Canvas>
      </Suspense>
      
      {/* Overlay gradient for better readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />
    </div>
  );
};
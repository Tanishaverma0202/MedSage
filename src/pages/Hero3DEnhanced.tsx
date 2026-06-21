import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';

// ==================== AI CORE & BODY ====================

const HumanBody: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
    if (coreRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Head */}
      <mesh position={[0, 3, 0]}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} transparent opacity={0.6} roughness={0.1} />
      </mesh>
      
      {/* Central AI Core (Chest) */}
      <mesh ref={coreRef} position={[0, 1.5, 0.2]}>
        <icosahedronGeometry args={[0.6, 2]} />
        <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={1.5} wireframe />
      </mesh>

      {/* Torso Network */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.5, 0.4, 1.8, 16]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.2} wireframe transparent opacity={0.3} />
      </mesh>

      {/* Energy Spine */}
      <mesh position={[0, 1.5, -0.4]}>
        <cylinderGeometry args={[0.05, 0.05, 2.5, 8]} />
        <meshStandardMaterial color="#818cf8" emissive="#6366f1" emissiveIntensity={2} />
      </mesh>

      {/* Grid Floor for stability */}
      <gridHelper args={[20, 20, '#0ea5e9', '#020617']} position={[0, -1.8, 0]} />
    </group>
  );
};

// ==================== INTERACTIVE Health NODE ====================

interface HealthNodeProps {
  position: [number, number, number];
  color: string;
  icon: string;
  label: string;
  description: string;
}

const HealthNode: React.FC<HealthNodeProps> = ({ position, color, icon, label, description }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      meshRef.current.position.y += Math.sin(time * 2 + position[0]) * 0.001;
      const targetScale = hovered ? 1.4 : 1.0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group position={position} ref={meshRef}>
      <mesh 
        onPointerOver={() => setHovered(true)} 
        onPointerOut={() => setHovered(false)}
      >
        <octahedronGeometry args={[hovered ? 0.35 : 0.25]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 1.5 : 0.8} />
      </mesh>

      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0,0,-0.1, -position[0]*0.8, -position[1]*0.8, -position[2]*0.8])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={hovered ? 0.6 : 0.2} linewidth={3} />
      </line>

      <Html position={[0.4, 0.4, 0]} zIndexRange={[100, 0]} style={{ transition: 'opacity 0.2s', opacity: hovered ? 1 : 0, pointerEvents: 'none' }}>
        <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl w-56 text-left transform -translate-y-1/2">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl drop-shadow-lg">{icon}</span>
            <span className="text-white font-bold text-sm uppercase tracking-wider">{label}</span>
          </div>
          <p className="text-slate-400 text-xs font-medium leading-relaxed">{description}</p>
        </div>
      </Html>
    </group>
  );
};

// ==================== DATA STREAMS (INWARD PARTICLES) ====================

const DataStreams: React.FC = () => {
  const points = useRef<THREE.Points>(null);
  const count = 300;
  
  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const radius = 6 + Math.random() * 4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);     
        pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta); 
        pos[i * 3 + 2] = radius * Math.cos(phi);                   
    }
    return pos;
  });

  useFrame(() => {
    if (points.current) {
      const posAttr = points.current.geometry.attributes.position;
      const posArray = posAttr.array as Float32Array;
      
      for (let i = 0; i < count; i++) {
        const x = posArray[i * 3];
        const y = posArray[i * 3 + 1];
        const z = posArray[i * 3 + 2];
        
        posArray[i * 3] -= x * 0.02;
        posArray[i * 3 + 1] -= y * 0.02;
        posArray[i * 3 + 2] -= z * 0.02;
        
        if (Math.abs(x) < 0.2 && Math.abs(y) < 0.2 && Math.abs(z) < 0.2) {
            const radius = 6 + Math.random() * 4;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            posArray[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            posArray[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            posArray[i * 3 + 2] = radius * Math.cos(phi);
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#10b981" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
    </points>
  );
};

// ==================== CAMERA CONTROLLER ====================

const CameraController: React.FC<{ scrollY: number }> = ({ scrollY }) => {
  useFrame((state) => {
    // Determine target based on scroll height
    let targetZ = 9;
    let targetY = 0;

    // Transition stages based on pixels (roughly synced with LandingPage sections)
    if (scrollY < 500) {
      // Default wide view
      targetZ = 9 - (scrollY * 0.002);
      targetY = 0 - (scrollY * 0.001);
    } else if (scrollY < 1200) {
      // Zoom into chest/core (Data Processing phase)
      targetZ = 6;
      targetY = -0.5 - ((scrollY - 500) * 0.002);
    } else {
      // Look up and zoom out slightly for the UI dashboard transition
      targetZ = 8;
      targetY = -2;
    }
    
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
};

// ==================== MAIN COMPONENT ====================

export const Hero3DEnhanced: React.FC<{ scrollY?: number }> = ({ scrollY = 0 }) => {
  const nodes = [
    { position: [-3, 2.5, 1], color: '#8b5cf6', icon: '🧠', label: 'Mental Health Engine', description: 'AI analyzes sleep, stress, and mood correlations for peak cognition.' },
    { position: [3, 2.0, 1], color: '#f43f5e', icon: '❤️', label: 'Cardio Analysis', description: 'Tracks HR zones mapped against dynamic nutrition logs.' },
    { position: [-3, -0.5, 1], color: '#10b981', icon: '🥗', label: 'Nutrition Intelligence', description: 'Macro parsing, timing analysis, and generative meal arrays.' },
    { position: [3, -0.5, 1], color: '#38bdf8', icon: '💪', label: 'Workout Protocols', description: 'Context-aware dynamic resistance training engine.' },
    { position: [-2.5, -3, 1], color: '#ec4899', icon: '🔄', label: 'Cycle Synced', description: 'Hormonal phase directly orchestrates daily intensity.' }
  ];

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto">
      <Canvas camera={{ position: [0, 0, 9], fov: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={0.2} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#34d399" />
        <pointLight position={[-5, -5, -5]} intensity={0.8} color="#0ea5e9" />
        
        <HumanBody />
        <DataStreams />
        
        {nodes.map((node, i) => (
          <Float key={i} speed={2} rotationIntensity={0.5} floatIntensity={1}>
             <HealthNode {...node} position={node.position as [number, number, number]} />
          </Float>
        ))}

        <CameraController scrollY={scrollY} />
      </Canvas>
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none" />
    </div>
  );
};

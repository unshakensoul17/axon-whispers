import { useEffect, useState, useRef, useMemo } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { OrbitControls, Sphere, Html, shaderMaterial, Instances, Instance, RoundedBox } from "@react-three/drei";
import { EffectComposer, Bloom, Noise } from "@react-three/postprocessing";
import * as THREE from "three";
import { useControls, Leva } from "leva";
import { Terminal, Brain, Cpu, Flame, Box, Zap, Network, Sparkles, MessageSquare, Layers, Eye, Database, Code } from 'lucide-react';

// ==========================================
// PURE THREE.JS GLSL CUSTOM SHADER
// ==========================================
const FluidShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor1: new THREE.Color("#00e5ff"), // Electric Cyan
    uColor2: new THREE.Color("#b026ff"), // Neon Purple
  },
  // Vertex Shader: Fast 3D Simplex Noise
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying float vNoise;
    uniform float uTime;

    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    float snoise(vec3 v){ 
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
      i = mod(i, 289.0 ); 
      vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 1.0/7.0; 
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vUv = uv;
      vNormal = normal;
      
      float noise = snoise(position * 1.2 + uTime * 0.4);
      vNoise = noise;
      
      vec3 newPos = position + normal * (noise * 0.4);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
    }
  `,
  // Fragment Shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying float vNoise;
    
    uniform vec3 uColor1;
    uniform vec3 uColor2;

    void main() {
      float mixValue = smoothstep(-0.3, 0.3, vNoise);
      vec3 color = mix(uColor1, uColor2, mixValue);
      
      vec3 viewDirection = normalize(cameraPosition - vNormal);
      float fresnel = dot(viewDirection, vNormal);
      fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
      fresnel = pow(fresnel, 2.5);
      
      vec3 finalColor = color + (vec3(1.0, 0.8, 1.0) * fresnel * 0.8);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ FluidShaderMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      fluidShaderMaterial: any;
    }
  }
}

// ---------------------------------------------------------
// 3D Point-Cloud DNA Bone Structure
// ---------------------------------------------------------
function DNAStrand({ visible, dnaRadius, dnaHeight, dnaLoops, particleCount, scatterAmount }: { 
  visible: boolean;
  dnaRadius: number;
  dnaHeight: number;
  dnaLoops: number;
  particleCount: number;
  scatterAmount: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const particles = useMemo(() => {
    const points = [];
    
    // 1. Generate Backbone Particles
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const angle = -t * Math.PI * 2 * dnaLoops; 
      const y = (dnaHeight / 2) - (t * dnaHeight); 
      
      points.push({
        position: new THREE.Vector3(
          Math.cos(angle) * dnaRadius + (Math.random() - 0.5) * scatterAmount,
          y + (Math.random() - 0.5) * scatterAmount,
          Math.sin(angle) * dnaRadius + (Math.random() - 0.5) * scatterAmount
        ),
        color: new THREE.Color("#ff2a00").multiplyScalar(1.5),
        scale: Math.random() * 0.8 + 0.4
      });

      points.push({
        position: new THREE.Vector3(
          Math.cos(angle + Math.PI) * dnaRadius + (Math.random() - 0.5) * scatterAmount,
          y + (Math.random() - 0.5) * scatterAmount,
          Math.sin(angle + Math.PI) * dnaRadius + (Math.random() - 0.5) * scatterAmount
        ),
        color: new THREE.Color("#00e5ff").multiplyScalar(1.5),
        scale: Math.random() * 0.8 + 0.4
      });
    }

    // 2. Generate Base Pair "Rungs" (The strings connecting the DNA)
    // Create rungs every so often along the DNA
    const rungCount = Math.floor(dnaLoops * 24); // 24 rungs per loop
    const particlesPerRung = 10; // Number of glowing dots connecting the two sides

    for (let r = 0; r < rungCount; r++) {
      const t = r / rungCount;
      const angle = -t * Math.PI * 2 * dnaLoops;
      const y = (dnaHeight / 2) - (t * dnaHeight);

      const p1 = new THREE.Vector3(Math.cos(angle) * dnaRadius, y, Math.sin(angle) * dnaRadius);
      const p2 = new THREE.Vector3(Math.cos(angle + Math.PI) * dnaRadius, y, Math.sin(angle + Math.PI) * dnaRadius);

      for (let p = 1; p < particlesPerRung; p++) {
        const lerpFactor = p / particlesPerRung;
        const pos = p1.clone().lerp(p2, lerpFactor);
        
        // Add a slight scatter to the rungs so they look organic and energetic
        pos.x += (Math.random() - 0.5) * (scatterAmount * 0.4);
        pos.y += (Math.random() - 0.5) * (scatterAmount * 0.4);
        pos.z += (Math.random() - 0.5) * (scatterAmount * 0.4);

        // Gradient color from Red to Cyan across the string
        const rungColor = new THREE.Color("#ff2a00").lerp(new THREE.Color("#00e5ff"), lerpFactor).multiplyScalar(1.3);

        points.push({
          position: pos,
          color: rungColor,
          scale: Math.random() * 0.4 + 0.2 // Slightly smaller particles for the inner strings
        });
      }
    }

    return points;
  }, [dnaRadius, dnaHeight, dnaLoops, particleCount, scatterAmount]);

  useFrame(() => {
    if (groupRef.current) {
      const targetScale = visible ? 1 : 0.001;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);
    }
  });

  return (
    <group ref={groupRef} scale={0.001}>
      <Instances limit={particles.length} range={particles.length}>
        <icosahedronGeometry args={[0.06, 1]} />
        <meshBasicMaterial toneMapped={false} />
        {particles.map((data, i) => (
          <Instance key={i} position={data.position} color={data.color} scale={data.scale} />
        ))}
      </Instances>
    </group>
  );
}

// ---------------------------------------------------------
// Physically Attached DNA Glass Cards
// ---------------------------------------------------------
function OrbitingCards({ visible, dnaRadius, dnaHeight, dnaLoops, cardRadius, cardYSpacing, angleOffsetDeg, glassTransmission, glassRoughness }: { 
  visible: boolean;
  dnaRadius: number;
  dnaHeight: number;
  dnaLoops: number;
  cardRadius: number;
  cardYSpacing: number;
  angleOffsetDeg: number;
  glassTransmission: number;
  glassRoughness: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      const targetScale = visible ? 1 : 0.001;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);
    }
  });

  return (
    <group ref={groupRef} scale={0.001}>
      {PROJECTS.map((proj, i) => {
        // Space cards completely so the previous one exits before the next arrives
        const yTarget = (dnaHeight / 2 - 2.5) - (i * cardYSpacing); 
        
        const t = ((dnaHeight / 2) - yTarget) / dnaHeight;
        
        // Alternate cards perfectly to the left and right sides
        const isLeft = i % 2 !== 0; 
        const angleOffset = isLeft ? (angleOffsetDeg * Math.PI / 180) : -(angleOffsetDeg * Math.PI / 180); 
        
        const baseAngle = -t * Math.PI * 2 * dnaLoops; 
        const cardAngle = baseAngle + angleOffset;
        const themeColor = isLeft ? "#00e5ff" : "#ff2a00";
        
        // Node sits exactly on the main DNA strand
        const p1x = Math.cos(baseAngle) * dnaRadius;
        const p1z = Math.sin(baseAngle) * dnaRadius;
        
        // Card is shifted angularly so it orbits into the Left/Right position
        const p2x = Math.cos(cardAngle) * cardRadius;
        const p2z = Math.sin(cardAngle) * cardRadius;

        // Force card to face perfectly outward when focused (NEVER MIRRORED)
        const localRotY = baseAngle - Math.PI / 2;
        const accentX = isLeft ? 1.9 : -1.9;

        return (
          <group key={proj.id}>
            {/* Glowing Attachment Node on DNA */}
            <mesh position={[p1x, yTarget, p1z]}>
               <sphereGeometry args={[0.08, 16, 16]} />
               <meshBasicMaterial color={themeColor} />
            </mesh>

            {/* The 3D Card Object */}
            <group 
              position={[p2x, yTarget, p2z]} 
              rotation={[0, localRotY, 0]}
            >
              {/* Dark Cybernetic UI Glass Backing */}
              <RoundedBox args={[3.8, 2.8, 0.05]} radius={0.15} smoothness={4}>
                <meshPhysicalMaterial 
                  color="#030305"
                  transmission={glassTransmission}
                  opacity={1}
                  metalness={0.5}
                  roughness={glassRoughness}
                  ior={1.5}
                  thickness={1.0}
                  clearcoat={1}
                />
              </RoundedBox>

              {/* Glowing Tech Accent Line */}
              <mesh position={[accentX, 0, 0.06]}>
                <planeGeometry args={[0.04, 2.0]} />
                <meshBasicMaterial color={themeColor} />
              </mesh>

              {/* 3D Projected HTML Overlay */}
              <Html transform position={[0, 0, 0.1]} distanceFactor={2} center>
                <div className={`w-[280px] text-left pointer-events-auto select-none ${isLeft ? 'pr-4' : 'pl-4'}`}>
                  <p className="text-[10px] text-[#00e5ff] mb-2 uppercase tracking-[0.2em] font-medium drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">
                    {proj.tech}
                  </p>
                  <h3 className="text-3xl font-light text-white mb-3 tracking-wide drop-shadow-md">
                    {proj.title}
                  </h3>
                  <p className="text-xs font-light text-white/70 leading-relaxed max-w-[250px]">
                    {proj.desc}
                  </p>
                </div>
              </Html>
            </group>
          </group>
        );
      })}
    </group>
  );
}

const TECH_STACK = [
  { name: "Python", icon: Terminal },
  { name: "PyTorch", icon: Flame },
  { name: "Transformers", icon: Layers },
  { name: "FastAPI", icon: Zap },
  { name: "Docker", icon: Box },
  { name: "TypeScript", icon: Code },
  { name: "PostgreSQL", icon: Database },
  { name: "Scikit-Learn", icon: Brain },
  { name: "LLMs", icon: MessageSquare },
  { name: "TensorFlow", icon: Network },
  { name: "C / C++", icon: Cpu },
  { name: "NLP", icon: Eye },
  { name: "React", icon: Box }
];

function OrbitingTechStack({ visible, positionY }: { visible: boolean; positionY: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      const targetScale = visible ? 1 : 0.001;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);
      
      // Orbit logic: slightly slower rotation for readability
      groupRef.current.rotation.y -= 0.0025;

      // Increased forward tilt to spread out cards at the left/right horizons
      groupRef.current.rotation.x = 0.25;
      groupRef.current.rotation.z = -0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, positionY, 0]} scale={0.001}>
      {TECH_STACK.map((tech, i) => {
        // Single row circular distribution
        const angle = (i / TECH_STACK.length) * Math.PI * 2;
        const radius = 5.2; // Tighter ring
        
        const x = Math.cos(angle) * radius;
        const y = 0; // Perfectly flat Saturn ring (no wave)
        const z = Math.sin(angle) * radius;

        const Icon = tech.icon;

        return (
          <Html key={tech.name} transform sprite occlude center position={[x, y, z]} distanceFactor={3.5}>
            <div className="flex items-center gap-2.5 px-4 py-2 border border-[#00e5ff]/40 bg-[#030305]/95 backdrop-blur-md rounded-lg text-[#00e5ff] text-[10px] uppercase tracking-[0.1em] font-semibold shadow-[0_0_15px_rgba(0,229,255,0.2)] whitespace-nowrap select-none group hover:scale-110 hover:border-[#00e5ff] hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] transition-all cursor-default">
              <Icon size={14} className="text-[#ff2a00] group-hover:text-[#00e5ff] transition-colors duration-300" />
              <span className="drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">{tech.name}</span>
            </div>
          </Html>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------
// Core Fluid Sphere Component
// ---------------------------------------------------------
function ActiveTheoryCore({ visible, positionY = 15.0, shrinkToDot = false }: { visible: boolean, positionY?: number, shrinkToDot?: boolean }) {
  const materialRef = useRef<any>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (materialRef.current) materialRef.current.uTime = time;

    if (wireframeRef.current) {
      wireframeRef.current.rotation.y = -time * 0.08;
      wireframeRef.current.rotation.x = time * 0.04;
    }

    if (groupRef.current) {
      const targetX = (state.pointer.x * Math.PI) / 8;
      const targetY = (state.pointer.y * Math.PI) / 8;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -targetY, 0.05);

      const targetScale = !visible ? 0.001 : (shrinkToDot ? 0.08 : 1);
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);
    }
  });

  return (
    <group ref={groupRef} position={[0, positionY, 0]}>
      {/* Drastically reduced polygon count from 256x256 to 64x64 for massive performance boost */}
      <Sphere args={[2.0, 64, 64]}>
        <fluidShaderMaterial ref={materialRef} />
      </Sphere>

      <Sphere ref={wireframeRef} args={[3.0, 16, 16]}>
        <meshBasicMaterial color="#00e5ff" wireframe={true} transparent={true} opacity={0.15} />
      </Sphere>
    </group>
  );
}

// ---------------------------------------------------------
// Main Orchestration Stage
// ---------------------------------------------------------
function MainStage({ scrollProgress }: { scrollProgress: number }) {
  const stageRef = useRef<THREE.Group>(null);
  const isHero = scrollProgress < 0.1;

  const { dnaRadius, dnaHeight, dnaLoops, particleCount, scatterAmount } = useControls('DNA Structure', {
    dnaRadius: { value: 1.7, min: 0.5, max: 5.0, step: 0.1 },
    dnaHeight: { value: 30.0, min: 10.0, max: 60.0, step: 1.0 },
    dnaLoops: { value: 3, min: 1, max: 10, step: 1 },
    particleCount: { value: 600, min: 200, max: 2000, step: 100 },
    scatterAmount: { value: 0.5, min: 0.0, max: 2.0, step: 0.1 },
  });

  const { cardRadius, cardYSpacing, angleOffsetDeg, glassTransmission, glassRoughness } = useControls('Project Cards', {
    cardRadius: { value: 3.6, min: 1.0, max: 6.0, step: 0.1 },
    cardYSpacing: { value: 5.0, min: 2.0, max: 10.0, step: 0.5 },
    angleOffsetDeg: { value: 0, min: 0, max: 90, step: 1 },
    glassTransmission: { value: 0.90, min: 0, max: 1, step: 0.05 },
    glassRoughness: { value: 0.30, min: 0, max: 1, step: 0.05 },
  });

  const { finaleEffect } = useControls('Cinematics', {
    finaleEffect: { 
      options: ['Warp Tunnel', 'Core Re-Assembly', 'Nebula', 'Magnetic Fluid', 'Singularity', 'Quantum Glitch', 'Cyber-Tornado', 'Ascension'],
      value: 'Core Re-Assembly'
    }
  });

  useFrame((state) => {
    if (stageRef.current) {
      // Map remaining scroll (0.1 -> 0.8) to full DNA traversal
      const scrollTraverse = Math.min(1, Math.max(0, (scrollProgress - 0.1) / 0.7));
      const finaleT = Math.max(0, (scrollProgress - 0.8) / 0.15); // 0 to 1 at the very bottom
      const isTechStackActive = finaleEffect === 'Core Re-Assembly' && scrollProgress > 0.8 && scrollProgress < 0.95;
      const isContactActive = scrollProgress >= 0.95;

      // X shift for layout balancing
      let targetX = 0;
      if (isHero) targetX = 2.5;
      else if (isTechStackActive) targetX = 2.5;
      else if (isContactActive) targetX = 0; // Center the core for the contact section

      stageRef.current.position.x = THREE.MathUtils.lerp(stageRef.current.position.x, targetX, 0.05);

      // 1. Pan the camera vertically DOWN the DNA
      const targetY = THREE.MathUtils.lerp(-(dnaHeight / 2), (dnaHeight / 2), scrollTraverse);
      
      // 2. Rotate the DNA mathematically to bring the active card exactly to the front (+Z)
      const currentLocalY = -targetY;
      const t = ((dnaHeight / 2) - currentLocalY) / dnaHeight;
      const currentAngle = -t * Math.PI * 2 * dnaLoops; 
      
      let targetRotationY = -currentAngle + (Math.PI / 2);
      let targetZ = 0;
      let targetYOffset = 0;
      let targetScaleX = 1;
      let targetScaleY = 1;
      let targetScaleZ = 1;
      let targetRotX = 0;
      let targetRotZ = 0;

      // APPLY FINALE EFFECTS
      if (finaleT > 0 && !isHero) {
        if (finaleEffect === 'Warp Tunnel') {
          targetZ = finaleT * 18; // Push stage towards camera (pass through)
          targetScaleX = 1 + finaleT * 3; // Open up the DNA
          targetScaleZ = 1 + finaleT * 3;
        } else if (finaleEffect === 'Nebula') {
          targetScaleX = 1 + finaleT * 12; // Massive expansion into starfield
          targetScaleZ = 1 + finaleT * 12;
        } else if (finaleEffect === 'Magnetic Fluid') {
          // Bend DNA towards mouse pointer
          targetRotZ = state.pointer.x * finaleT * 1.5;
          targetRotX = -state.pointer.y * finaleT * 1.5;
        } else if (finaleEffect === 'Singularity') {
          // Compress on X/Z and stretch on Y into a laser beam
          targetScaleX = Math.max(0.001, 1 - finaleT * 2);
          targetScaleZ = Math.max(0.001, 1 - finaleT * 2);
          targetScaleY = 1 + finaleT * 5;
        } else if (finaleEffect === 'Quantum Glitch') {
          // Intense random teleportation and jitter
          targetRotX = (Math.random() - 0.5) * finaleT * 0.8;
          targetRotZ = (Math.random() - 0.5) * finaleT * 0.8;
          targetScaleX = 1 + (Math.random() - 0.5) * finaleT * 3;
          targetScaleZ = 1 + (Math.random() - 0.5) * finaleT * 3;
        } else if (finaleEffect === 'Cyber-Tornado') {
          // Uncontrollable fast spinning
          targetRotationY += state.clock.getElapsedTime() * 15 * finaleT;
          targetScaleX = 1 + finaleT * 1.5;
          targetScaleZ = 1 + finaleT * 1.5;
        } else if (finaleEffect === 'Ascension') {
          // Fly upwards into the sky
          targetYOffset = finaleT * 40;
        }
      }

      stageRef.current.position.y = THREE.MathUtils.lerp(stageRef.current.position.y, targetY + targetYOffset, 0.05);
      stageRef.current.position.z = THREE.MathUtils.lerp(stageRef.current.position.z, targetZ, 0.05);
      
      stageRef.current.scale.x = THREE.MathUtils.lerp(stageRef.current.scale.x, targetScaleX, 0.05);
      stageRef.current.scale.y = THREE.MathUtils.lerp(stageRef.current.scale.y, targetScaleY, 0.05);
      stageRef.current.scale.z = THREE.MathUtils.lerp(stageRef.current.scale.z, targetScaleZ, 0.05);
      
      stageRef.current.rotation.y = THREE.MathUtils.lerp(stageRef.current.rotation.y, targetRotationY, 0.05);
      stageRef.current.rotation.x = THREE.MathUtils.lerp(stageRef.current.rotation.x, targetRotX, 0.05);
      stageRef.current.rotation.z = THREE.MathUtils.lerp(stageRef.current.rotation.z, targetRotZ, 0.05);
    }
  });

  const scrollTraverse = Math.min(1, Math.max(0, (scrollProgress - 0.1) / 0.7));
  const isTechStackActive = finaleEffect === 'Core Re-Assembly' && scrollProgress > 0.8 && scrollProgress < 0.95;
  const isContactActive = scrollProgress >= 0.95;

  return (
    <group ref={stageRef} position={[0, -(dnaHeight / 2), 0]} rotation={[0, Math.PI/2, 0]}>
      {/* Morphing Elements */}
      <ActiveTheoryCore visible={isHero} positionY={15.0} />
      
      {/* Finale: Core Re-Assembly */}
      <ActiveTheoryCore 
        visible={(finaleEffect === 'Core Re-Assembly' && scrollProgress > 0.8) || isContactActive} 
        positionY={-(dnaHeight / 2)} 
        shrinkToDot={isContactActive}
      />
      <OrbitingTechStack
        visible={isTechStackActive} 
        positionY={-(dnaHeight / 2)} 
      />

      <DNAStrand 
        visible={!isHero && scrollProgress <= 0.8} 
        dnaRadius={dnaRadius}
        dnaHeight={dnaHeight}
        dnaLoops={dnaLoops}
        particleCount={particleCount}
        scatterAmount={scatterAmount}
      />
      <OrbitingCards 
        visible={!isHero && scrollProgress <= 0.8} 
        dnaRadius={dnaRadius}
        dnaHeight={dnaHeight}
        dnaLoops={dnaLoops}
        cardRadius={cardRadius}
        cardYSpacing={cardYSpacing}
        angleOffsetDeg={angleOffsetDeg}
        glassTransmission={glassTransmission}
        glassRoughness={glassRoughness}
      />
    </group>
  );
}

const PROJECTS = [
  {
    id: "proj-1",
    title: "Sentinel Flow",
    tech: "TYPESCRIPT / SQLITE / AI",
    desc: "AI Code Intelligence System mapping codebases into interactive knowledge graphs with dual-path AI routing.",
    link: "https://marketplace.visualstudio.com/items?itemName=UnshakenSoul.sentinel-flow-extension"
  },
  {
    id: "proj-2",
    title: "PhantmOS v3.0",
    tech: "PYTHON / FASTAPI / DOCKER",
    desc: "Autonomous Multi-Agent Job Engine. Discovers remote jobs, scores relevance, and tailors applications using LLMs.",
    link: "https://unshakensou17-phantmos.hf.space"
  },
  {
    id: "proj-3",
    title: "Reasoning Bottlenecks",
    tech: "PYTORCH / TRANSFORMERS",
    desc: "Implemented slot-based reasoning bottlenecks in small Transformers, improving mean accuracy on the SCAN benchmark from 0.55 to 0.71.",
    link: "https://github.com/unshakensoul17/reasoning-bottlenecks-scan"
  },
  {
    id: "proj-4",
    title: "SmartCart Clustering",
    tech: "PYTHON / SCIKIT-LEARN",
    desc: "Unsupervised learning pipeline identifying actionable customer segments using PCA dimensionality reduction and K-Means.",
    link: "https://github.com/unshakensoul17/SmartCart-Customer-Segmentation"
  }
];

export default function Experience() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const progress = h > 0 ? window.scrollY / h : 0;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative bg-[#030305] text-[#e2e2e5] font-sans selection:bg-[#00e5ff] selection:text-[#030305]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        html, body { background-color: #030305; scroll-behavior: smooth; }
      `}</style>

      <Leva 
        hidden={false} 
        collapsed={false} 
        theme={{
          colors: {
            elevation1: '#030305',
            elevation2: '#111115',
            elevation3: '#22222a',
            accent1: '#00e5ff',
            accent2: '#ff2a00',
            accent3: '#00e5ff',
          }
        }} 
      />

      {/* Fixed R3F Background - Entire 3D Scene */}
      <div className="fixed inset-0 z-0 pointer-events-auto">

        <Canvas
          camera={{ position: [0, 0, 12], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, powerPreference: "high-performance" }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
          <pointLight position={[-10, -10, -5]} intensity={1.5} color="#00e5ff" />

          {/* Main Orchestrator for Globe/DNA Morphing and Positioning */}
          <MainStage scrollProgress={scrollProgress} />

          <EffectComposer>
            <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur={true} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* Fixed Navbar */}
      <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 bg-gradient-to-b from-[#030305]/90 to-transparent backdrop-blur-sm pointer-events-auto">
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12L10 6V18L16 12" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xl font-medium text-[#00e5ff] tracking-wider">AXON</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[13px] tracking-widest uppercase text-white/50 font-medium">
          <a href="#hero" className="hover:text-white transition-colors">Core</a>
          <a href="#projects" className="hover:text-white transition-colors">Projects</a>
          <a href="#contact" className="hover:text-white transition-colors">Network</a>
        </div>

        <button className="rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/30 px-6 py-2.5 text-[13px] tracking-widest uppercase font-medium text-[#00e5ff] transition-all hover:bg-[#00e5ff] hover:text-[#030305] shadow-[0_0_15px_rgba(0,229,255,0.15)]">
          Initiate
        </button>
      </nav>

      {/* Scroll Progress Indicator */}
      <div className="fixed left-6 md:left-12 top-1/2 -translate-y-1/2 h-[40vh] w-[2px] bg-white/10 rounded-full z-50">
        <div
          className="absolute top-0 left-0 w-full bg-gradient-to-b from-[#00e5ff] to-[#b026ff] rounded-full transition-all duration-200"
          style={{ height: `${Math.max(0, scrollProgress * 100)}%` }}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-[#00e5ff] shadow-[0_0_12px_#00e5ff] transition-all duration-200"
          style={{ top: `calc(${Math.max(0, scrollProgress * 100)}% - 6px)` }}
        />
      </div>

      {/* Scrolling Content Overlay - We need enough height to scroll! */}
      <div className="relative z-10 pointer-events-none">

        <section className="h-[100vh] flex flex-col justify-center px-16 md:px-32 max-w-4xl pt-20">
          <div style={{ opacity: Math.max(0, 1 - (scrollProgress / 0.1)), transition: 'opacity 0.1s' }}>
            <span className="text-[#00e5ff] font-mono text-[10px] md:text-xs tracking-[0.3em] uppercase mb-6 block">
              Akash Yaduwanshi • AI Engineer
            </span>
            <h1 className="text-5xl md:text-7xl font-light tracking-tight text-white mb-6 leading-[1.1]">
              <span className="text-[#00e5ff] font-medium">Engineering intelligence</span> <br />
              at the synaptic level
            </h1>
            <p className="text-xl md:text-2xl font-light text-white/50 leading-relaxed mb-12 max-w-2xl">
              Scroll down to explore the orbital project network.
            </p>
          </div>
        </section>

        {/* Empty space for scrolling the 3D Carousel */}
        <div className="h-[300vh]"></div>

        <section className="h-[100vh] flex flex-col justify-center px-16 md:px-32 max-w-2xl relative">
          <div
            className="pointer-events-auto transition-opacity duration-300"
            style={{ opacity: (scrollProgress > 0.8 && scrollProgress < 0.95) ? 1 : 0 }}
          >
            <span className="text-xs text-[#00e5ff] mb-3 block uppercase tracking-[0.2em]">Core Architecture</span>
            <h2 className="text-4xl md:text-6xl font-light text-white mb-6">
              Neural Tech Stack
            </h2>
            <p className="text-xl md:text-2xl font-light text-white/50 leading-relaxed mb-12 max-w-xl">
              Engineered with an advanced toolkit for deep learning, generative AI, and high-performance neural networks.
            </p>
            <button className="rounded-full bg-white/5 border border-white/10 px-8 py-4 text-[13px] tracking-widest uppercase font-medium text-white transition-all hover:bg-white hover:text-[#030305]">
              View Architecture
            </button>
          </div>
        </section>

        {/* Contact Overlay */}
        <section className="h-[100vh] flex flex-col justify-center items-center text-center px-8 relative">
          <div
            className="pointer-events-auto transition-opacity duration-500"
            style={{ opacity: scrollProgress >= 0.95 ? 1 : 0 }}
          >
            <span className="text-xs text-[#00e5ff] mb-4 block uppercase tracking-[0.3em] font-medium">Neural Handshake</span>
            <h2 className="text-5xl md:text-7xl font-light text-white mb-12 tracking-tight">
              ESTABLISH <br /> CONNECTION
            </h2>
            
            <div className="flex flex-wrap justify-center gap-6 max-w-3xl">
              <a href="mailto:aakashyaduwanshi0470@gmail.com" target="_blank" rel="noreferrer" className="group relative px-8 py-4 bg-[#030305]/60 backdrop-blur-md border border-[#00e5ff]/20 rounded-2xl overflow-hidden hover:border-[#00e5ff]/80 hover:shadow-[0_0_30px_rgba(0,229,255,0.3)] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00e5ff]/0 via-[#00e5ff]/5 to-[#00e5ff]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="text-white text-sm tracking-[0.15em] uppercase font-medium group-hover:text-[#00e5ff] transition-colors">Email</span>
              </a>
              <a href="https://github.com/unshakensoul17" target="_blank" rel="noreferrer" className="group relative px-8 py-4 bg-[#030305]/60 backdrop-blur-md border border-[#00e5ff]/20 rounded-2xl overflow-hidden hover:border-[#00e5ff]/80 hover:shadow-[0_0_30px_rgba(0,229,255,0.3)] transition-all duration-300">
                <span className="text-white text-sm tracking-[0.15em] uppercase font-medium group-hover:text-[#00e5ff] transition-colors">GitHub</span>
              </a>
              <a href="https://linkedin.com/in/akash-yaduwanshi-902a3b352" target="_blank" rel="noreferrer" className="group relative px-8 py-4 bg-[#030305]/60 backdrop-blur-md border border-[#00e5ff]/20 rounded-2xl overflow-hidden hover:border-[#00e5ff]/80 hover:shadow-[0_0_30px_rgba(0,229,255,0.3)] transition-all duration-300">
                <span className="text-white text-sm tracking-[0.15em] uppercase font-medium group-hover:text-[#00e5ff] transition-colors">LinkedIn</span>
              </a>
              <a href="mailto:aakashyaduwanshi0470@gmail.com?subject=Resume%20Request" className="group relative px-8 py-4 bg-[#00e5ff]/10 backdrop-blur-md border border-[#00e5ff]/50 rounded-2xl overflow-hidden hover:bg-[#00e5ff]/20 hover:border-[#00e5ff] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all duration-300">
                <span className="text-[#00e5ff] text-sm tracking-[0.15em] uppercase font-medium">Request Resume</span>
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

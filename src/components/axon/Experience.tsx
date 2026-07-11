import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { OrbitControls, Sphere, Html, shaderMaterial, Instances, Instance, RoundedBox, Text, Billboard } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Terminal, Brain, Cpu, Flame, Box, Zap, Network, Sparkles, MessageSquare, Layers, Eye, Database, Code } from 'lucide-react';
import { SmokeBlast, NeonDust, BlackholeBomb, HyperWarp, MatrixRain, CosmicVortex, ImplosionRing, ShatteredGlass, GlitchBlocks, GridSnap } from './Transitions';

gsap.registerPlugin(ScrollTrigger);

// ==========================================
// OBSIDIAN AURORA (Hardcoded theme)
// ==========================================
// Primary: #9B5DE5
// Secondary: #F15BB5
// Accent: #00BBF9
// BG: #07050F
// ==========================================
// PURE THREE.JS GLSL CUSTOM SHADER
// ==========================================
const FluidShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor1: new THREE.Color("#9B5DE5"),
    uColor2: new THREE.Color("#F15BB5"),
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

    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vNormal = normal;
      
      float noise = snoise(position * 1.2 + uTime * 0.4);
      vNoise = noise;
      
      vec3 newPos = position + normal * (noise * 0.4);
      vPosition = (modelMatrix * vec4(newPos, 1.0)).xyz;
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

    varying vec3 vPosition;

    void main() {
      float mixValue = smoothstep(-0.3, 0.3, vNoise);
      vec3 color = mix(uColor1, uColor2, mixValue);

      vec3 viewDirection = normalize(cameraPosition - vPosition);
      float fresnel = dot(viewDirection, vNormal);
      fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
      fresnel = pow(fresnel, 4.0); 

      vec3 rimColor = mix(uColor1, uColor2, 0.3);
      float depth = smoothstep(0.0, 1.0, vNoise * 0.5 + 0.5);
      vec3 finalColor = color + rimColor * fresnel * 0.5 * depth;

      float alpha = 0.92 - fresnel * 0.15;
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

extend({ FluidShaderMaterial });



const WaterRippleMaterial = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uHover: 0,
    uColor: new THREE.Color("#9B5DE5"),
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uHover;
    uniform vec3 uColor;

    void main() {
      float dist = distance(vUv, uMouse);
      float wave = sin(dist * 30.0 - uTime * 8.0);
      float intensity = exp(-dist * 6.0) * uHover;
      float ripple = wave * intensity;
      
      vec3 finalColor = uColor + (ripple * 0.8);
      float alpha = 0.0 + abs(ripple) * 0.5;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);
extend({ WaterRippleMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      fluidShaderMaterial: any;
      waterRippleMaterial: any;
    }
  }
}

// Module-level scratch Vector3 — reused by ALL useFrame calls.
const _sv = new THREE.Vector3();

// ----------------------------------------------------------
// Lightweight spring — gives cursor tracking elastic weight.
// ----------------------------------------------------------
class Spring {
  stiffness: number; damping: number; velocity: number; value: number; target: number;
  constructor(stiffness = 0.08, damping = 0.82) {
    this.stiffness = stiffness; this.damping = damping;
    this.velocity = 0; this.value = 0; this.target = 0;
  }
  update() {
    const force = (this.target - this.value) * this.stiffness;
    this.velocity = (this.velocity + force) * this.damping;
    this.value += this.velocity;
    return this.value;
  }
}

// ----------------------------------------------------------
// DNA vertex / fragment shaders — renders as GPU point sprites
// (1 draw call vs 1500 instanced meshes)
// ----------------------------------------------------------
const dnaVertGLSL = `
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // perspective-correct point size
    gl_PointSize = aSize * (280.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
    // fade near camera
    vAlpha = smoothstep(0.0, 4.0, -mv.z);
  }
`;
const dnaFragGLSL = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    // discard corners → perfect circle sprite
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    // soft glow falloff from centre
    float alpha = (1.0 - smoothstep(0.2, 0.5, d)) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

// ---------------------------------------------------------
// 3D Point-Cloud DNA Bone Structure
// ---------------------------------------------------------
function DNAStrand({ visible, dnaRadius = 2.0, dnaHeight = 20.0, dnaLoops = 4, particleCount = 2000, scatterAmount = 0.5 }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const { posArray, colArray, sizeArray, total } = useMemo(() => {
    const pts: number[] = [], cols: number[] = [], sizes: number[] = [];
    const cRed = new THREE.Color("#F15BB5").multiplyScalar(1.5);
    const cCyan = new THREE.Color("#00BBF9").multiplyScalar(1.5);
    const cA = new THREE.Color(), cB = new THREE.Color();

    // Backbone — two helices
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const angle = -t * Math.PI * 2 * dnaLoops;
      const y = dnaHeight / 2 - t * dnaHeight;
      const sc = scatterAmount;
      // strand A
      pts.push(Math.cos(angle) * dnaRadius + (Math.random() - .5) * sc, y + (Math.random() - .5) * sc, Math.sin(angle) * dnaRadius + (Math.random() - .5) * sc);
      cols.push(cRed.r, cRed.g, cRed.b);
      sizes.push(Math.random() * 4 + 3);
      // strand B
      pts.push(Math.cos(angle + Math.PI) * dnaRadius + (Math.random() - .5) * sc, y + (Math.random() - .5) * sc, Math.sin(angle + Math.PI) * dnaRadius + (Math.random() - .5) * sc);
      cols.push(cCyan.r, cCyan.g, cCyan.b);
      sizes.push(Math.random() * 4 + 3);
    }

    // Rungs — gradient dots connecting the helices
    const rungCount = Math.floor(dnaLoops * 24);
    const perRung = 10;
    for (let r = 0; r < rungCount; r++) {
      const t = r / rungCount;
      const angle = -t * Math.PI * 2 * dnaLoops;
      const y = dnaHeight / 2 - t * dnaHeight;
      const ax = Math.cos(angle) * dnaRadius, az = Math.sin(angle) * dnaRadius;
      const bx = Math.cos(angle + Math.PI) * dnaRadius, bz = Math.sin(angle + Math.PI) * dnaRadius;
      for (let p = 1; p < perRung; p++) {
        const f = p / perRung;
        const sc2 = scatterAmount * 0.4;
        pts.push(ax + (bx - ax) * f + (Math.random() - .5) * sc2, y + (Math.random() - .5) * sc2, az + (bz - az) * f + (Math.random() - .5) * sc2);
        cA.copy(cRed); cB.copy(cCyan); cA.lerp(cB, f).multiplyScalar(1.3);
        cols.push(cA.r, cA.g, cA.b);
        sizes.push(Math.random() * 2 + 1.5);
      }
    }

    return {
      posArray: new Float32Array(pts),
      colArray: new Float32Array(cols),
      sizeArray: new Float32Array(sizes),
      total: pts.length / 3,
    };
  }, [dnaRadius, dnaHeight, dnaLoops, particleCount, scatterAmount]);

  const mat = useMemo(() => new THREE.PointsMaterial({
    size: 0.09,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  }), []);

  useFrame(() => {
    if (groupRef.current) {
      _sv.setScalar(visible ? 1 : 0.001);
      groupRef.current.scale.lerp(_sv, 0.05);
    }
  });

  return (
    <group ref={groupRef} scale={0.001}>
      <points material={mat}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[posArray, 3]} />
          <bufferAttribute attach="attributes-color" args={[colArray, 3]} />
        </bufferGeometry>
      </points>
    </group>
  );
}

// ---------------------------------------------------------
// Physically Attached DNA Glass Cards
// ---------------------------------------------------------
function OrbitingCards({ visible, dnaHeight, dnaRadius, dnaLoops, cardYSpacing, scrollProgress, setActiveProject, activeProject, transitionType, angleOffsetDeg, glassTransmission, glassRoughness }: any) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      _sv.setScalar(visible ? 1 : 0.001);
      groupRef.current.scale.lerp(_sv, 0.05);
    }
  });

  return (
    <group ref={groupRef} scale={0.001}>
      {PROJECTS.map((proj, i) => (
        <OrbitingCardItem
          key={proj.id}
          proj={proj}
          i={i}
          dnaHeight={dnaHeight}
          dnaRadius={dnaRadius}
          dnaLoops={dnaLoops}
          cardYSpacing={cardYSpacing}
          setActiveProject={setActiveProject}
          activeProject={activeProject}
          transitionType={transitionType}
          angleOffsetDeg={angleOffsetDeg}
          glassTransmission={glassTransmission}
          glassRoughness={glassRoughness}
        />
      ))}
    </group>
  );
}

function OrbitingCardItem({ proj, i, dnaHeight, dnaRadius, dnaLoops, cardYSpacing, setActiveProject, activeProject, transitionType, angleOffsetDeg, glassTransmission, glassRoughness }: any) {
  const cardRef = useRef<THREE.Group>(null);
  const glassMaterialRef = useRef<any>(null);
  const accentRef = useRef<any>(null);
  const rippleMaterialRef = useRef<any>(null);
  const targetHover = useRef(0);
  const mouseUv = useRef(new THREE.Vector2(0.5, 0.5));

  const yTarget = (dnaHeight / 2 - 7.5) - (i * cardYSpacing);
  const t = ((dnaHeight / 2) - yTarget) / dnaHeight;
  const isLeft = i % 2 === 0;

  const techStr = proj.tech.toLowerCase();
  let cardTint = "#9B5DE5"; // Default Purple (Rust)
  if (techStr.includes("python") || techStr.includes("django")) cardTint = "#00BBF9"; // Cyan
  else if (techStr.includes("typescript") || techStr.includes("react") || techStr.includes("next")) cardTint = "#F15BB5"; // Pink

  const themeColor = cardTint;
  const angleOffset = isLeft ? (angleOffsetDeg * Math.PI / 180) : -(angleOffsetDeg * Math.PI / 180);
  const baseAngle = -t * Math.PI * 2 * dnaLoops;
  const cardAngle = baseAngle + angleOffset;

  const p1x = Math.cos(baseAngle) * dnaRadius;
  const p1z = Math.sin(baseAngle) * dnaRadius;
  const p2x = Math.cos(cardAngle) * 3.6;
  const p2z = Math.sin(cardAngle) * 3.6;
  const localRotY = baseAngle - Math.PI / 2;
  const accentX = isLeft ? 1.9 : -1.9;

  const isActive = activeProject === proj.id;
  const isAnyActive = !!activeProject;

  const wasActive = useRef(false);
  const wasShattering = useRef(false);
  const [isShattering, setIsShattering] = useState(false);

  useEffect(() => {
    if (isActive) {
      wasActive.current = true;
      setIsShattering(false);
      wasShattering.current = false;
    } else if (wasActive.current) {
      wasActive.current = false;
      setIsShattering(true);
      wasShattering.current = true;
      setTimeout(() => setIsShattering(false), 1200);
    }
  }, [isActive]);

  useFrame((state, delta) => {
    if (!cardRef.current) return;

    if (rippleMaterialRef.current) {
      rippleMaterialRef.current.uTime = state.clock.elapsedTime;
      rippleMaterialRef.current.uHover = THREE.MathUtils.lerp(rippleMaterialRef.current.uHover, targetHover.current, 0.05);
      rippleMaterialRef.current.uMouse.lerp(mouseUv.current, 0.1);
    }

    if (isActive) {
      const t = state.clock.elapsedTime * 1.5;
      const beat = Math.pow(Math.sin(t * Math.PI), 16) + Math.pow(Math.sin((t + 0.15) * Math.PI), 16) * 0.5;

      const pulseScale = 12 + beat * 0.2;
      _sv.set(pulseScale, pulseScale, pulseScale);
      cardRef.current.scale.lerp(_sv, 0.05);

      if (glassMaterialRef.current) {
        glassMaterialRef.current.opacity = THREE.MathUtils.lerp(glassMaterialRef.current.opacity, 1.0, 0.04);
        glassMaterialRef.current.transparent = true;
        glassMaterialRef.current.emissiveIntensity = THREE.MathUtils.lerp(glassMaterialRef.current.emissiveIntensity, 0.15 + beat * 0.5, 0.1);
      }
      if (accentRef.current) {
        accentRef.current.opacity = THREE.MathUtils.lerp(accentRef.current.opacity, 0.5 + beat * 0.5, 0.08);
      }
    } else if (isShattering) {
      _sv.set(12, 12, 12);
      cardRef.current.scale.copy(_sv);
      if (glassMaterialRef.current) glassMaterialRef.current.opacity = 0;
      if (accentRef.current) accentRef.current.opacity = 0;
    } else {
      if (wasShattering.current) {
        cardRef.current.scale.set(0.001, 0.001, 0.001);
        wasShattering.current = false;
      }
      
      if (isAnyActive) {
        _sv.set(0.001, 0.001, 0.001);
        cardRef.current.scale.lerp(_sv, 0.08);
      } else {
        _sv.set(1, 1, 1);
        cardRef.current.scale.lerp(_sv, 0.08);
        if (glassMaterialRef.current) {
          glassMaterialRef.current.opacity = THREE.MathUtils.lerp(glassMaterialRef.current.opacity, 1, 0.05);
          glassMaterialRef.current.emissiveIntensity = THREE.MathUtils.lerp(glassMaterialRef.current.emissiveIntensity, 0.15, 0.05);
          if (glassMaterialRef.current.opacity > 0.95) glassMaterialRef.current.transparent = false;
        }
        if (accentRef.current) {
          accentRef.current.opacity = THREE.MathUtils.lerp(accentRef.current.opacity, 1, 0.05);
        }
      }
    }
  });

  return (
    <group>
      <mesh position={[p1x, yTarget, p1z]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={themeColor} />
      </mesh>

      <group
        ref={cardRef}
        position={[p2x, yTarget, p2z]}
        rotation={[0, localRotY, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setActiveProject(proj.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          targetHover.current = 1;
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'auto';
          targetHover.current = 0;
        }}
      >
        {isActive && (
          <group>
            {transitionType === 'smoke-blast' && <SmokeBlast color={themeColor} />}
            {transitionType === 'neon-dust' && <NeonDust color={themeColor} />}
            {transitionType === 'blackhole-bomb' && <BlackholeBomb color={themeColor} />}
            {transitionType === 'glitch-blocks' && <GlitchBlocks color={themeColor} />}
            {transitionType === 'hyper-warp' && <HyperWarp color={themeColor} />}
            {transitionType === 'grid-snap' && <GridSnap color={themeColor} />}
            {transitionType === 'implosion-ring' && <ImplosionRing color={themeColor} />}
            {transitionType === 'matrix-rain' && <MatrixRain color={themeColor} />}
            {transitionType === 'cosmic-vortex' && <CosmicVortex color={themeColor} />}
          </group>
        )}

        {isShattering && <ShatteredGlass color={cardTint} />}

        <group visible={!isShattering}>
          <RoundedBox args={[3.8, 2.8, 0.05]} radius={0.15} smoothness={4}>
            <meshPhysicalMaterial
              ref={glassMaterialRef}
              color={cardTint}
              emissive={cardTint}
              emissiveIntensity={0.15}
              transmission={0.92}
              opacity={1}
              metalness={0.4}
              roughness={0.2}
              ior={1.5}
              thickness={0.5}
            />
          </RoundedBox>

          {/* Inner Fluid Glass Ripple Plane */}
          <mesh 
            position={[0, 0, 0.03]}
            onPointerMove={(e) => {
              if (e.uv) mouseUv.current.set(e.uv.x, e.uv.y);
            }}
          >
            <planeGeometry args={[3.7, 2.7, 1, 1]} />
            <waterRippleMaterial ref={rippleMaterialRef} uColor={new THREE.Color(cardTint)} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>

          {/* Top Edge Glow */}
          <mesh position={[0, 1.38, 0.06]}>
            <planeGeometry args={[3.4, 0.03]} />
            <meshBasicMaterial color={cardTint} transparent opacity={0.8} />
          </mesh>

          {/* Side Accent */}
          <mesh position={[accentX, 0, 0.06]}>
            <planeGeometry args={[0.04, 2.0]} />
            <meshBasicMaterial ref={accentRef} color={themeColor} transparent opacity={1} />
          </mesh>
        </group>

        <Html transform position={[0, 0, 0.1]} distanceFactor={2.5} center className={isActive ? 'opacity-0 transition-opacity duration-700 pointer-events-none' : 'opacity-100 transition-opacity duration-300'}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setActiveProject(proj.id);
            }}
            className={`w-[400px] text-left pointer-events-auto cursor-pointer select-none transition-all duration-700 hover:scale-[1.02] group ${isLeft ? 'pr-2' : 'pl-2'}`}
          >
            <div className="flex items-center gap-3 mb-4 opacity-90 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cardTint, boxShadow: `0 0 12px ${cardTint}` }} />
              <div className="flex flex-col">
                <p className="text-xs font-mono uppercase tracking-[0.3em] font-bold drop-shadow-md" style={{ color: cardTint }}>
                  {proj.tech.split(' / ')[0]}
                </p>
                <p className="text-[10px] font-mono text-white/50 tracking-widest mt-0.5 drop-shadow-md">SYS_ID: [{proj.id.toUpperCase()}]</p>
              </div>
            </div>

            <h3 className="text-5xl font-semibold text-white mb-4 tracking-wider drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-500">
              {proj.title}
            </h3>

            <div className="relative pl-4 border-l-2 border-white/20 group-hover:border-white/50 transition-colors duration-300">
              <p className="text-sm font-medium text-white/90 leading-relaxed max-w-[360px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-white transition-colors duration-300">
                {proj.desc}
              </p>
            </div>

            <div className="mt-8 flex items-center gap-4 opacity-30 group-hover:opacity-100 transition-opacity duration-500">
              <div className="h-[1px] flex-1" style={{ backgroundImage: `linear-gradient(to right, ${cardTint}, transparent)` }} />
              <div className="text-[9px] font-mono tracking-[0.4em] text-white/70 bg-white/5 px-2 py-1 rounded border border-white/10 group-hover:border-white/30">ACCESS_NODE</div>
            </div>
          </div>
        </Html>
      </group>
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

function CanvasLabel({ text }: { text: string }) {
  const texture = useMemo(() => {
    const W = 320, H = 72;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(0,0,0,0.95)';
    ctx.beginPath(); ctx.roundRect(2, 2, W - 4, H - 4, 14); ctx.fill();
    ctx.strokeStyle = "#9B5DE5";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(2, 2, W - 4, H - 4, 14); ctx.stroke();
    ctx.fillStyle = "#9B5DE5";
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.toUpperCase(), W / 2, H / 2);
    return new THREE.CanvasTexture(canvas);
  }, [text]);
  return (
    <mesh>
      <planeGeometry args={[2.2, 0.5]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

function OrbitingTechStack({ visible, positionY }: { visible: boolean; positionY: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      _sv.setScalar(visible ? 1 : 0.001);
      groupRef.current.scale.lerp(_sv, 0.05);
      groupRef.current.rotation.y -= 0.0025;
    }
  });

  return (
    <group ref={groupRef} position={[0, positionY, 0]} scale={0.001} rotation={[0.25, 0, -0.05]}>
      {TECH_STACK.map((tech, i) => {
        const angle = (i / TECH_STACK.length) * Math.PI * 2;
        const radius = 5.2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <Billboard key={tech.name} position={[x, 0, z]}>
            <CanvasLabel text={tech.name} />
          </Billboard>
        );
      })}
    </group>
  );
}

function ActiveTheoryCore({ visible, positionY = 15.0, shrinkToDot = false }: { visible: boolean, positionY?: number, shrinkToDot?: boolean }) {
  const materialRef = useRef<any>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const springX = useMemo(() => new Spring(0.08, 0.82), []);
  const springY = useMemo(() => new Spring(0.08, 0.82), []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (materialRef.current) {
      materialRef.current.uTime = time;
      materialRef.current.uColor1.set("#9B5DE5");
      materialRef.current.uColor2.set("#F15BB5");
    }

    if (wireframeRef.current) {
      wireframeRef.current.rotation.y = -time * 0.08;
      wireframeRef.current.rotation.x = time * 0.04;
    }

    if (groupRef.current) {
      springX.target = (state.pointer.x * Math.PI) / 8;
      springY.target = -(state.pointer.y * Math.PI) / 8;
      groupRef.current.rotation.y = springX.update();
      groupRef.current.rotation.x = springY.update();

      const targetScale = !visible ? 0.001 : (shrinkToDot ? 0.08 : 1);
      _sv.setScalar(targetScale);
      groupRef.current.scale.lerp(_sv, 0.05);
    }
  });

  return (
    <group ref={groupRef} position={[0, positionY, 0]}>
      <Sphere args={[2.0, 64, 64]}>
        <fluidShaderMaterial ref={materialRef} />
      </Sphere>

      <Sphere args={[2.8, 32, 32]}>
        <meshBasicMaterial color="#9B5DE5" transparent={true} opacity={0.05} side={THREE.BackSide} />
      </Sphere>

      <Sphere args={[2.6, 32, 32]}>
        <meshBasicMaterial color="#9B5DE5" wireframe={true} transparent={true} opacity={0.12} />
      </Sphere>
    </group>
  );
}

function MainStage({ scrollProgress, scrollRef, setActiveProject, activeProject, transitionType }: { scrollProgress: number, scrollRef: React.RefObject<number>, setActiveProject: (id: string) => void, activeProject: string | null, transitionType: string }) {
  const stageRef = useRef<THREE.Group>(null);
  const isHero = scrollProgress < 0.1;

  const dnaRadius = 1.7;
  const dnaHeight = 25.0; 
  const dnaLoops = 2.5; 
  const particleCount = 500;
  const scatterAmount = 0.5;

  const cardRadius = 3.6;
  const cardYSpacing = 5.0; 
  const angleOffsetDeg = 0;
  const glassTransmission = 0.90;
  const glassRoughness = 0.30;

  const finaleEffect = 'Core Re-Assembly';

  const isAboutActive = scrollProgress > 0.1 && scrollProgress <= 0.2;
  const isTechStackActive = finaleEffect === 'Core Re-Assembly' && scrollProgress > 0.8 && scrollProgress < 0.95;
  const isContactActive = scrollProgress >= 0.95;

  useFrame((state) => {
    if (stageRef.current) {
      const sp = scrollRef.current;
      const scrollTraverse = Math.min(1, Math.max(0, (sp - 0.2) / 0.6));
      const finaleT = Math.max(0, (sp - 0.8) / 0.15); 

      const _isHero = sp < 0.1;
      const _isAbout = sp > 0.1 && sp <= 0.2;
      const _isTech = sp > 0.8 && sp < 0.95;
      const _isContact = sp >= 0.95;
      let targetX = 0;
      if (_isHero) targetX = 2.5;
      else if (_isAbout) targetX = 2.5;
      else if (_isTech) targetX = 2.5;
      else if (_isContact) targetX = 0;

      stageRef.current.position.x = THREE.MathUtils.lerp(stageRef.current.position.x, targetX, 0.05);

      const targetY = THREE.MathUtils.lerp(-(dnaHeight / 2), (dnaHeight / 2), scrollTraverse);

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

      if (finaleT > 0 && !isHero) {
        if (finaleEffect === 'Warp Tunnel') {
          targetZ = finaleT * 18; 
          targetScaleX = 1 + finaleT * 3; 
          targetScaleZ = 1 + finaleT * 3;
        } else if (finaleEffect === 'Nebula') {
          targetScaleX = 1 + finaleT * 12; 
          targetScaleZ = 1 + finaleT * 12;
        } else if (finaleEffect === 'Magnetic Fluid') {
          targetRotZ = state.pointer.x * finaleT * 1.5;
          targetRotX = -state.pointer.y * finaleT * 1.5;
        } else if (finaleEffect === 'Singularity') {
          targetScaleX = Math.max(0.001, 1 - finaleT * 2);
          targetScaleZ = Math.max(0.001, 1 - finaleT * 2);
          targetScaleY = 1 + finaleT * 5;
        } else if (finaleEffect === 'Quantum Glitch') {
          targetRotX = (Math.random() - 0.5) * finaleT * 0.8;
          targetRotZ = (Math.random() - 0.5) * finaleT * 0.8;
          targetScaleX = 1 + (Math.random() - 0.5) * finaleT * 3;
          targetScaleZ = 1 + (Math.random() - 0.5) * finaleT * 3;
        } else if (finaleEffect === 'Cyber-Tornado') {
          targetRotationY += state.clock.getElapsedTime() * 15 * finaleT;
          targetScaleX = 1 + finaleT * 1.5;
          targetScaleZ = 1 + finaleT * 1.5;
        } else if (finaleEffect === 'Ascension') {
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

  const isDnaVisible = !isHero && !isAboutActive && scrollProgress <= 0.8;

  return (
    <group ref={stageRef} position={[0, -(dnaHeight / 2), 0]} rotation={[0, Math.PI / 2, 0]}>
      <ActiveTheoryCore visible={isHero || isAboutActive} positionY={dnaHeight / 2} />

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
        visible={isDnaVisible}
        dnaRadius={dnaRadius}
        dnaHeight={dnaHeight}
        dnaLoops={dnaLoops}
        particleCount={particleCount}
        scatterAmount={scatterAmount}
      />
      <OrbitingCards
        visible={isDnaVisible}
        scrollProgress={scrollProgress}
        dnaHeight={dnaHeight}
        dnaRadius={dnaRadius}
        dnaLoops={dnaLoops}
        cardYSpacing={cardYSpacing}
        setActiveProject={setActiveProject}
        activeProject={activeProject}
        transitionType={transitionType}
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
    link: "https://marketplace.visualstudio.com/items?itemName=UnshakenSoul.sentinel-flow-extension",
    image: "/assets/sentinel_flow_ui.png"
  },
  {
    id: "proj-2",
    title: "PhantmOS v3.0",
    tech: "PYTHON / FASTAPI / DOCKER",
    desc: "Autonomous Multi-Agent Job Engine. Discovers remote jobs, scores relevance, and tailors applications using LLMs.",
    link: "https://unshakensou17-phantmos.hf.space",
    image: "/assets/phantmos_ui.png"
  },
  {
    id: "proj-3",
    title: "Reasoning Bottlenecks",
    tech: "PYTORCH / TRANSFORMERS",
    desc: "Implemented slot-based reasoning bottlenecks in small Transformers, improving mean accuracy on the SCAN benchmark from 0.55 to 0.71.",
    link: "https://github.com/unshakensoul17/reasoning-bottlenecks-scan",
    image: "/assets/deep_scan_ui.png"
  },
  {
    id: "proj-4",
    title: "SmartCart Clustering",
    tech: "PYTHON / SCIKIT-LEARN",
    desc: "Unsupervised learning pipeline identifying actionable customer segments using PCA dimensionality reduction and K-Means.",
    link: "https://github.com/unshakensoul17/SmartCart-Customer-Segmentation",
    image: "/assets/smartcart_clustering_ui.png"
  }
];

export default function Experience() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [transitionType, setTransitionType] = useState('implosion-ring');
  const [selectedProjData, setSelectedProjData] = useState<any>(null);
  const scrollRef = useRef(0);
  const lastPhaseRef = useRef(-1);

  useEffect(() => {
    if (activeProject) {
      setSelectedProjData(PROJECTS.find(p => p.id === activeProject));
    }
  }, [activeProject]);

  useEffect(() => {
    if (!activeProject) return;
    const handleScroll = () => setActiveProject(null);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeProject]);

  // GSAP ScrollTrigger scrub — flywheel feel with 1.2s lag
  useEffect(() => {
    // Seed ref immediately so first frame is correct
    const h = document.documentElement.scrollHeight - window.innerHeight;
    scrollRef.current = h > 0 ? window.scrollY / h : 0;

    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,            // seconds of lag → flywheel feel
      onUpdate: (self) => {
        scrollRef.current = self.progress;
        // throttle React state to phase boundaries only
        const phase = Math.floor(self.progress * 20);
        if (phase !== lastPhaseRef.current) {
          lastPhaseRef.current = phase;
          setScrollProgress(self.progress);
        }
      },
    });

    // close active project on scroll
    const onScroll = () => { if (activeProject) setActiveProject(null); };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      st.kill();
      window.removeEventListener('scroll', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative bg-[#07050F] text-[#e2e2e5] font-sans selection:bg-[#9B5DE5] selection:text-black overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Syne:wght@400..800&display=swap');
        html, body { background-color: #07050F; scroll-behavior: smooth; overflow-x: hidden; width: 100%; }
        .font-display { font-family: 'Syne', sans-serif; }
        .font-mono { font-family: 'Space Mono', monospace; }
      `}</style>

      {/* Fixed R3F Background - Entire 3D Scene */}
      <div className="fixed inset-0 z-0 pointer-events-auto">

        <Canvas
          camera={{ position: [0, 0, 12], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, powerPreference: "high-performance" }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
          <pointLight position={[-10, -10, -5]} intensity={1.5} color="#9B5DE5" />

          {/* Main Orchestrator for Globe/DNA Morphing and Positioning */}
          <MainStage scrollProgress={scrollProgress} scrollRef={scrollRef} setActiveProject={setActiveProject} activeProject={activeProject} transitionType={transitionType} />

          <EffectComposer>
            {/* height cap limits Bloom's internal render resolution — big perf win at 1440p+ */}
            <Bloom intensity={1.4} luminanceThreshold={0.2} luminanceSmoothing={0.5} mipmapBlur={true} height={350} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* Static CSS Grain Overlay — zero GPU cost per frame vs Noise post-process pass */}
      <div
        className="fixed inset-0 pointer-events-none z-[4]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.035,
        }}
      />

      {/* Cinematic Vignette Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[5]" style={{ background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)' }}></div>

      {/* Fixed Navbar */}
      <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm pointer-events-auto">
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12L10 6V18L16 12" stroke="#9B5DE5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xl tracking-wider text-white font-display">
            <span className="font-bold">AKASH</span> <span className="font-light">YADUWANSHI</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[11px] tracking-[0.2em] uppercase text-white/50 font-mono">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors cursor-pointer">Core</button>
          <button onClick={() => window.scrollTo({ top: window.innerHeight * 2.5, behavior: 'smooth' })} className="hover:text-white transition-colors cursor-pointer">Projects</button>
          <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="hover:text-white transition-colors cursor-pointer">Network</button>
        </div>

        <button
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          className="rounded-full bg-[#9B5DE5]/10 border border-[#9B5DE5]/30 px-6 py-2.5 text-[11px] tracking-[0.2em] uppercase font-mono text-[#9B5DE5] transition-all hover:bg-[#9B5DE5] hover:text-black shadow-[0_0_15px_rgba(0,229,255,0.15)]"
        >
          Initiate
        </button>
      </nav>

      {/* Scroll Progress Indicator */}
      <div className="fixed left-6 md:left-12 top-1/2 -translate-y-1/2 h-[40vh] w-[2px] bg-white/10 rounded-full z-50">
        <div
          className="absolute top-0 left-0 w-full bg-gradient-to-b from-[#9B5DE5] to-[#b026ff] rounded-full transition-all duration-200"
          style={{ height: `${Math.max(0, scrollProgress * 100)}%` }}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-[#9B5DE5] shadow-[0_0_12px_#9B5DE5] transition-all duration-200"
          style={{ top: `calc(${Math.max(0, scrollProgress * 100)}% - 6px)` }}
        />
      </div>

      {/* HTML Content Overlay - Completely Fixed to Viewport */}
      <div className="relative z-10 pointer-events-none">

        {/* Absolute massive spacer to provide the scrollbar for the entire experience */}
        <div className="h-[1000vh]"></div>

        {/* Fixed Hero Overlay */}
        <div className="fixed inset-0 flex flex-col justify-center px-16 md:px-32 max-w-4xl pt-20 pointer-events-none">
          <div className={scrollProgress <= 0.1 ? "pointer-events-auto" : "pointer-events-none"} style={{ opacity: Math.max(0, 1 - (scrollProgress / 0.1)), transition: 'opacity 0.1s' }}>
            <span className="text-[#9B5DE5] font-mono text-[10px] md:text-[11px] tracking-[0.3em] uppercase mb-6 block">
              Akash Yaduwanshi • AI Engineer
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-white mb-6 leading-none">
              Engineering intelligence <br />
              at the synaptic level
            </h1>
            <p className="text-xl md:text-2xl font-light text-white/50 leading-relaxed mb-12 max-w-2xl">
              Scroll down to explore the orbital project network.
            </p>
          </div>
        </div>

        {/* Fixed About Overlay */}
        <div
          className="fixed inset-0 flex flex-col justify-center px-16 md:px-32 max-w-2xl pointer-events-none"
          style={{
            opacity: (scrollProgress > 0.05 && scrollProgress <= 0.25) ? 1 : 0,
            transform: `translateY(${(scrollProgress > 0.05 && scrollProgress <= 0.25) ? '0px' : '20px'})`,
            transition: 'all 0.5s ease-out'
          }}
        >
          <div className={(scrollProgress > 0.05 && scrollProgress <= 0.25) ? "pointer-events-auto" : "pointer-events-none"}>
            <span className="text-[10px] md:text-[11px] font-mono text-[#9B5DE5] mb-3 block uppercase tracking-[0.3em]">Career Objective</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white mb-6">
              Engineering Mindset
            </h2>
            <p className="text-lg font-light text-white/60 leading-relaxed mb-6">
              I am an aspiring AI Engineer and Machine Learning researcher passionate about designing practical AI applications. My work spans research-oriented projects, intelligent developer tools, customer analytics, and multi-agent systems.
            </p>
            <p className="text-lg font-light text-white/60 leading-relaxed">
              Focused on representation learning, LLM integration, and scalable system design, I enjoy turning ideas into deployable systems with clean architecture and measurable impact.
            </p>
          </div>
        </div>

        {/* Fixed Tech Stack Overlay */}
        <div
          className="fixed inset-0 flex flex-col justify-center px-16 md:px-32 max-w-2xl pointer-events-none"
          style={{
            opacity: (scrollProgress > 0.75 && scrollProgress < 0.95) ? 1 : 0,
            transform: `translateY(${(scrollProgress > 0.75 && scrollProgress < 0.95) ? '0px' : '20px'})`,
            transition: 'all 0.5s ease-out'
          }}
        >
          <div className={(scrollProgress > 0.75 && scrollProgress < 0.95) ? "pointer-events-auto" : "pointer-events-none"}>
            <span className="text-[10px] md:text-[11px] font-mono text-[#9B5DE5] mb-3 block uppercase tracking-[0.3em]">Core Architecture</span>
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-white mb-6">
              Neural Tech Stack
            </h2>
            <p className="text-xl font-light text-white/50 leading-relaxed mb-8">
              Engineered with an advanced toolkit for deep learning, generative AI, and high-performance neural networks.
            </p>
            <a
              href="#architecture"
              className="inline-block border border-white/20 px-8 py-3 rounded-full font-mono text-[11px] tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors duration-300"
            >
              View Architecture
            </a>
          </div>
        </div>

        {/* Fixed Contact Overlay */}
        <div
          className="fixed inset-0 flex flex-col justify-center items-center text-center px-16 md:px-32 pointer-events-none"
          style={{
            opacity: scrollProgress >= 0.95 ? 1 : 0,
            transform: `translateY(${scrollProgress >= 0.95 ? '0px' : '20px'})`,
            transition: 'all 0.5s ease-out'
          }}
        >
          <div className={scrollProgress >= 0.95 ? "pointer-events-auto" : "pointer-events-none"}>
            <h2 className="text-6xl md:text-8xl font-display font-bold text-white tracking-tighter mb-4 drop-shadow-[0_0_20px_rgba(0,229,255,0.3)] leading-none">
              ESTABLISH
            </h2>
            <h2 className="text-6xl md:text-8xl font-display font-bold text-[#9B5DE5] tracking-tighter mb-16 drop-shadow-[0_0_30px_rgba(0,229,255,0.5)] leading-none">
              CONNECTION
            </h2>

            <div className="flex gap-6 justify-center">
              <a
                href="mailto:aakashyaduwanshi0470@gmail.com"
                className="group relative overflow-hidden rounded-full border border-white/20 bg-black/40 backdrop-blur-xl px-10 py-5 transition-all hover:border-[#9B5DE5]/50 hover:shadow-[0_0_40px_rgba(0,229,255,0.2)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#9B5DE5]/0 via-[#9B5DE5]/10 to-[#9B5DE5]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                <span className="text-sm tracking-[0.3em] uppercase text-white font-medium">Email</span>
              </a>

              <a
                href="https://github.com/unshakensoul17"
                target="_blank" rel="noreferrer"
                className="group relative overflow-hidden rounded-full border border-white/20 bg-black/40 backdrop-blur-xl px-10 py-5 transition-all hover:border-[#F15BB5]/50 hover:shadow-[0_0_40px_rgba(255,42,0,0.2)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#F15BB5]/0 via-[#F15BB5]/10 to-[#F15BB5]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                <span className="text-sm tracking-[0.3em] uppercase text-white font-medium">GitHub</span>
              </a>

              <a
                href="https://linkedin.com/in/akash-yaduwanshi-902a3b352"
                target="_blank" rel="noreferrer"
                className="group relative overflow-hidden rounded-full border border-white/20 bg-black/40 backdrop-blur-xl px-10 py-5 transition-all hover:border-[#9B5DE5]/50 hover:shadow-[0_0_40px_rgba(0,229,255,0.2)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#9B5DE5]/0 via-[#9B5DE5]/10 to-[#9B5DE5]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                <span className="text-sm tracking-[0.3em] uppercase text-white font-medium">LinkedIn</span>
              </a>

              <a
                href="mailto:aakashyaduwanshi0470@gmail.com?subject=Requesting%20Resume%20-%20Akash%20Yaduwanshi"
                className="group relative overflow-hidden rounded-full border border-white/20 bg-[#9B5DE5]/10 backdrop-blur-xl px-10 py-5 transition-all hover:bg-[#9B5DE5]/20 hover:border-[#9B5DE5] hover:shadow-[0_0_40px_rgba(0,229,255,0.4)]"
              >
                <span className="text-sm tracking-[0.3em] uppercase text-[#9B5DE5] font-bold">Request Resume</span>
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Cinematic Active Project Overlay */}


      <div
        className={`fixed inset-0 z-[100] pointer-events-none flex items-center justify-center transition-all ease-in-out ${activeProject ? 'duration-[2000ms] opacity-100' : 'duration-700 opacity-0'}`}
      >
        {/* Deep darkening background vignette - wait for card to expand before darkening */}
        <div
          className={`absolute inset-0 transition-all ${activeProject ? 'duration-[1500ms] delay-[400ms] opacity-100 backdrop-blur-xl' : 'duration-500 delay-0 opacity-0 backdrop-blur-none'}`}
          style={{ background: 'radial-gradient(circle at center, rgba(3,3,5,0.7) 0%, rgba(3,3,5,0.98) 100%)' }}
        />

        <div className={`relative w-full h-full max-w-[1400px] mx-auto px-8 md:px-16 flex flex-col md:flex-row items-center justify-between gap-12 transition-all cubic-bezier(0.16, 1, 0.3, 1) ${activeProject ? 'duration-[1200ms] delay-[800ms] pointer-events-auto scale-100 opacity-100 translate-y-0' : 'duration-[400ms] delay-0 pointer-events-none scale-[0.97] opacity-0 translate-y-8'}`}>

          {/* Left Side: Details & Close */}
          <div className="w-full md:w-[35%] flex flex-col items-start text-left z-10 shrink-0">
            <h2 className="text-5xl md:text-6xl font-light text-white mb-3 tracking-tight">
              {selectedProjData?.title}
            </h2>
            <p className="text-xs text-[#9B5DE5] uppercase tracking-[0.2em] font-medium mb-8">
              {selectedProjData?.tech}
            </p>
            <p className="text-sm md:text-base font-light text-white/60 leading-relaxed mb-10 max-w-sm">
              {selectedProjData?.desc}
            </p>

            <div className="flex flex-col gap-6">
              <a
                href={selectedProjData?.link}
                target="_blank" rel="noreferrer"
                className="group w-fit relative overflow-hidden rounded-full border border-white/20 bg-white/5 backdrop-blur-sm px-8 py-3 transition-all hover:border-[#9B5DE5]/50 hover:shadow-[0_0_20px_rgba(0,229,255,0.2)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#9B5DE5]/0 via-[#9B5DE5]/10 to-[#9B5DE5]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                <span className="text-[10px] tracking-[0.2em] uppercase text-white font-medium group-hover:text-[#9B5DE5] transition-colors relative z-10">Project Link</span>
              </a>

              <button
                onClick={() => setActiveProject(null)}
                className="text-[10px] text-white/50 tracking-[0.2em] uppercase hover:text-white transition-colors flex items-center gap-3 mt-4"
              >
                <span className="text-lg leading-none mb-[2px]">&larr;</span> CLOSE
              </button>
            </div>
          </div>

          {/* Right Side: Massive Display Monitor */}
          <div className="flex-1 w-full h-[50vh] md:h-[75vh] bg-[#020203] border border-white/5 rounded-2xl md:rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden relative group">
            {/* Internal monitor glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#9B5DE5]/[0.02] to-transparent pointer-events-none" />

            {/* Decorative Monitor Frame elements */}
            <div className="absolute top-6 right-6 w-1.5 h-1.5 rounded-full bg-white/20" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-white/10" />
            <div className="absolute top-0 left-0 w-full h-full border border-white/[0.02] rounded-[2rem] pointer-events-none" />

            {/* Placeholder for project visual - The actual image */}
            <div className="relative w-full h-full flex items-center justify-center p-4">
              {/* Noise effect */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

              {/* Project Image */}
              {selectedProjData?.image && (
                <img
                  src={selectedProjData.image}
                  alt={selectedProjData.title}
                  className="w-full h-full object-cover rounded-xl border border-white/10 opacity-90 transition-all duration-1000"
                  style={{
                    filter: 'contrast(1.1) brightness(0.9) drop-shadow(0 0 40px rgba(0, 229, 255, 0.15))',
                  }}
                />
              )}

              {/* Center Logo/Visual Overlay */}
              {!selectedProjData?.image && (
                <div className="flex flex-col items-center gap-6 opacity-30 group-hover:opacity-60 transition-opacity duration-700">
                  <div className="w-16 h-16 border border-[#9B5DE5]/50 rounded-xl flex items-center justify-center rotate-45 group-hover:rotate-90 transition-all duration-1000">
                    <div className="w-8 h-8 border border-white/50 rounded-sm -rotate-45 group-hover:-rotate-90 transition-all duration-1000" />
                  </div>
                  <div className="text-[#9B5DE5] font-mono text-[10px] tracking-[0.4em] uppercase">
                    Neural Link Active
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

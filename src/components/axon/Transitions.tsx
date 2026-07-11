import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Instances, Instance } from '@react-three/drei';

// 1. Smoky Blast
export function SmokeBlast({ color }: { color: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 3000;
  
  const smokyTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  const { positions, sizes, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const siz = new Float32Array(particleCount);
    const vel = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount; i++) {
      pos[i*3] = (Math.random() - 0.5) * 0.5;
      pos[i*3+1] = (Math.random() - 0.5) * 0.5;
      pos[i*3+2] = (Math.random() - 0.5) * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = 2 + Math.random() * 8;
      vel[i*3] = Math.sin(phi) * Math.cos(theta) * speed;
      vel[i*3+1] = Math.sin(phi) * Math.sin(theta) * speed;
      vel[i*3+2] = Math.cos(phi) * speed + (Math.random() * 2);
      siz[i] = Math.random() * 0.4 + 0.1; 
    }
    return { positions: pos, sizes: siz, velocities: vel };
  }, [particleCount]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for(let i=0; i<particleCount; i++) {
      pos[i*3] += velocities[i*3] * delta;
      pos[i*3+1] += velocities[i*3+1] * delta;
      pos[i*3+2] += velocities[i*3+2] * delta;
      velocities[i*3] *= 0.95;
      velocities[i*3+1] *= 0.95;
      velocities[i*3+2] *= 0.95;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={particleCount} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial map={smokyTexture} color={color} size={2} sizeAttenuation={true} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

// 2. Neon Dust
export function NeonDust({ color }: { color: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 3000;
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = 2 + Math.random() * 8;
      vel[i*3] = Math.sin(phi) * Math.cos(theta) * speed;
      vel[i*3+1] = Math.sin(phi) * Math.sin(theta) * speed;
      vel[i*3+2] = Math.cos(phi) * speed + (Math.random() * 2);
    }
    return { positions: pos, velocities: vel };
  }, [particleCount]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for(let i=0; i<particleCount; i++) {
      pos[i*3] += velocities[i*3] * delta;
      pos[i*3+1] += velocities[i*3+1] * delta;
      pos[i*3+2] += velocities[i*3+2] * delta;
      velocities[i*3] *= 0.95;
      velocities[i*3+1] *= 0.95;
      velocities[i*3+2] *= 0.95;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={2.5} sizeAttenuation={false} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

// 3. Blackhole Bomb
export function BlackholeBomb({ color }: { color: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  const phase = useRef(1); // 1 = suck, 2 = boom
  const particleCount = 2000;
  
  const { positions, originalPositions, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const orig = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount; i++) {
      const r = 5 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);
      orig[i*3] = pos[i*3];
      orig[i*3+1] = pos[i*3+1];
      orig[i*3+2] = pos[i*3+2];
      vel[i*3] = 15 + Math.random() * 20; // store speed
    }
    return { positions: pos, originalPositions: orig, velocities: vel };
  }, [particleCount]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    if (phase.current === 1) {
      let allIn = true;
      for(let i=0; i<particleCount; i++) {
        pos[i*3] += (0 - pos[i*3]) * 0.15;
        pos[i*3+1] += (0 - pos[i*3+1]) * 0.15;
        pos[i*3+2] += (0 - pos[i*3+2]) * 0.15;
        if (pos[i*3]*pos[i*3] + pos[i*3+1]*pos[i*3+1] + pos[i*3+2]*pos[i*3+2] > 0.05) allIn = false;
      }
      if (allIn) {
        phase.current = 2;
        for(let i=0; i<particleCount; i++) {
          const dir = new THREE.Vector3(originalPositions[i*3], originalPositions[i*3+1], originalPositions[i*3+2]).normalize();
          const speed = velocities[i*3];
          velocities[i*3] = dir.x * speed;
          velocities[i*3+1] = dir.y * speed;
          velocities[i*3+2] = dir.z * speed;
        }
      }
    } else {
      for(let i=0; i<particleCount; i++) {
        pos[i*3] += velocities[i*3] * delta;
        pos[i*3+1] += velocities[i*3+1] * delta;
        pos[i*3+2] += velocities[i*3+2] * delta;
        velocities[i*3] *= 0.92;
        velocities[i*3+1] *= 0.92;
        velocities[i*3+2] *= 0.92;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={3} sizeAttenuation={false} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

// 4. Hyper-Warp Streaks
export function HyperWarp({ color }: { color: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 2000;
  
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount; i++) {
      pos[i*3] = (Math.random() - 0.5) * 10;
      pos[i*3+1] = (Math.random() - 0.5) * 10;
      pos[i*3+2] = (Math.random() - 0.5) * 20 - 10;
      vel[i*3+2] = 20 + Math.random() * 40; // High Z speed towards camera
    }
    return { positions: pos, velocities: vel };
  }, [particleCount]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for(let i=0; i<particleCount; i++) {
      pos[i*3+2] += velocities[i*3+2] * delta;
      if (pos[i*3+2] > 5) pos[i*3+2] = -20; // reset to back
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={4} sizeAttenuation={false} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

// 5. Matrix Rain
export function MatrixRain({ color }: { color: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 2000;
  
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount; i++) {
      pos[i*3] = (Math.random() - 0.5) * 15;
      pos[i*3+1] = Math.random() * 10;
      pos[i*3+2] = (Math.random() - 0.5) * 5;
      vel[i*3+1] = -(5 + Math.random() * 10); // Fall down Y axis
    }
    return { positions: pos, velocities: vel };
  }, [particleCount]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for(let i=0; i<particleCount; i++) {
      pos[i*3+1] += velocities[i*3+1] * delta;
      if (pos[i*3+1] < -5) pos[i*3+1] = 10;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={3} sizeAttenuation={false} transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

// 6. Cosmic Vortex
export function CosmicVortex({ color }: { color: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 3000;
  
  const { positions, angles, radii } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const ang = new Float32Array(particleCount);
    const rad = new Float32Array(particleCount);
    for(let i=0; i<particleCount; i++) {
      const radius = Math.random() * 8;
      const angle = Math.random() * Math.PI * 2;
      rad[i] = radius;
      ang[i] = angle;
      pos[i*3] = Math.cos(angle) * radius;
      pos[i*3+1] = Math.sin(angle) * radius;
      pos[i*3+2] = (Math.random() - 0.5) * 10;
    }
    return { positions: pos, angles: ang, radii: rad };
  }, [particleCount]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for(let i=0; i<particleCount; i++) {
      angles[i] += delta * (2 / Math.max(radii[i], 0.1)); // Spin faster closer to center
      pos[i*3] = Math.cos(angles[i]) * radii[i];
      pos[i*3+1] = Math.sin(angles[i]) * radii[i];
      pos[i*3+2] += delta * 2; // Pull towards camera
      if (pos[i*3+2] > 5) pos[i*3+2] = -10;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={2} sizeAttenuation={false} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

// 7. Implosion Ring
export function ImplosionRing({ color }: { color: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 2000;
  
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 10 + Math.random() * 2;
      pos[i*3] = Math.cos(angle) * r;
      pos[i*3+1] = Math.sin(angle) * r;
      pos[i*3+2] = (Math.random() - 0.5) * 2;
      
      vel[i*3] = -Math.cos(angle) * (15 + Math.random() * 5); // suck in
      vel[i*3+1] = -Math.sin(angle) * (15 + Math.random() * 5);
      vel[i*3+2] = 0;
    }
    return { positions: pos, velocities: vel };
  }, [particleCount]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for(let i=0; i<particleCount; i++) {
      pos[i*3] += velocities[i*3] * delta;
      pos[i*3+1] += velocities[i*3+1] * delta;
      // Stop at center
      if (pos[i*3]*pos[i*3] + pos[i*3+1]*pos[i*3+1] < 0.1) {
         pos[i*3] = 0;
         pos[i*3+1] = 0;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={3} sizeAttenuation={false} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

export function ShatteredGlass({ color = "#ffffff" }: { color?: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 100000; // 1 lakh particles

  const { positions, randoms } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count);
    
    for(let i=0; i<count; i++) {
      // Form the exact volume of the 3.8 x 2.8 glass card
      pos[i*3] = (Math.random() - 0.5) * 3.8;
      pos[i*3+1] = (Math.random() - 0.5) * 2.8;
      pos[i*3+2] = (Math.random() - 0.5) * 0.1;
      
      // Random velocity modifier for organic crushing
      rnd[i] = 0.5 + Math.random() * 2.5; 
    }
    return { positions: pos, randoms: rnd };
  }, [count]);

  const mat = useMemo(() => new THREE.PointsMaterial({
    size: 0.015,
    color: color,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }), [color]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    // Violent gravity crush towards center (0,0,0)
    for(let i=0; i<count; i++) {
      const px = pos[i*3];
      const py = pos[i*3+1];
      const pz = pos[i*3+2];
      
      const dist = Math.sqrt(px*px + py*py + pz*pz);
      
      if (dist > 0.02) {
        // Acceleration increases exponentially as they get closer to the center
        const pull = (15.0 / (dist + 0.1)) * randoms[i] * delta;
        
        const pullX = (px / dist) * pull;
        const pullY = (py / dist) * pull;
        const pullZ = (pz / dist) * pull;
        
        pos[i*3] -= pullX;
        pos[i*3+1] -= pullY;
        pos[i*3+2] -= pullZ;
        
        // Snap to center if overshot
        if (Math.sign(pos[i*3]) !== Math.sign(px)) pos[i*3] = 0;
        if (Math.sign(pos[i*3+1]) !== Math.sign(py)) pos[i*3+1] = 0;
        if (Math.sign(pos[i*3+2]) !== Math.sign(pz)) pos[i*3+2] = 0;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Fade out as the crush completes
    mat.opacity = Math.max(0, mat.opacity - delta * 0.8);
  });

  return (
    <points ref={pointsRef} material={mat}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
    </points>
  );
}

// 9. Glitch Blocks
export function GlitchBlocks({ color }: { color: string }) {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const count = 200;

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const blocks = useMemo(() => {
    return Array.from({ length: count }, () => ({
      pos: new THREE.Vector3((Math.random()-0.5)*4, (Math.random()-0.5)*4, (Math.random()-0.5)*2),
      scale: Math.random() * 0.2 + 0.1
    }));
  }, [count]);

  useFrame((_, delta) => {
    if (!instancedRef.current) return;
    blocks.forEach((block, i) => {
      // Glitch jitter
      if (Math.random() > 0.8) {
        block.pos.x += (Math.random() - 0.5) * 0.2;
        block.pos.y += (Math.random() - 0.5) * 0.2;
      }
      block.scale *= 0.95; // dissolve
      
      dummy.position.copy(block.pos);
      dummy.scale.set(block.scale, block.scale, block.scale);
      dummy.updateMatrix();
      instancedRef.current!.setMatrixAt(i, dummy.matrix);
    });
    instancedRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instancedRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </instancedMesh>
  );
}

// 10. Grid Snap
export function GridSnap({ color }: { color: string }) {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const gridSize = 10;
  const count = gridSize * gridSize * gridSize;

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const cubes = useMemo(() => {
    const arr = [];
    const spacing = 0.5;
    const offset = (gridSize * spacing) / 2;
    for(let x=0; x<gridSize; x++) {
      for(let y=0; y<gridSize; y++) {
        for(let z=0; z<gridSize; z++) {
          const target = new THREE.Vector3(x*spacing - offset, y*spacing - offset, z*spacing - offset);
          arr.push({
            pos: new THREE.Vector3((Math.random()-0.5)*20, (Math.random()-0.5)*20, (Math.random()-0.5)*20),
            target: target
          });
        }
      }
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (!instancedRef.current) return;
    cubes.forEach((cube, i) => {
      cube.pos.lerp(cube.target, 0.1);
      dummy.position.copy(cube.pos);
      dummy.scale.set(0.1, 0.1, 0.1);
      dummy.updateMatrix();
      instancedRef.current!.setMatrixAt(i, dummy.matrix);
    });
    instancedRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instancedRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </instancedMesh>
  );
}

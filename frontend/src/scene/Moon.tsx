// ============================================================================
// frontend/src/scene/Moon.tsx
// The Moon — correctly proportioned to Earth and placed at the real sublunar
// point. The existing SunLight directional light automatically illuminates the
// correct face, so the visible phase (crescent, gibbous, full, new) matches
// reality without any extra shader work.
// ============================================================================

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useLoader } from "@react-three/fiber";
import { moonDirection, MOON_RADIUS } from "./lunar";

const RECOMPUTE_EVERY = 30; // seconds — Moon moves ~0.018°/30s, imperceptible

export function Moon() {
  const ref = useRef<THREE.Mesh>(null);
  const last = useRef(-Infinity);
  const moonTexture = useLoader(THREE.TextureLoader, "/moon.jpg");

  // Compute once on mount so the Moon appears in the right place on frame 1.
  const initialPos = useMemo(() => moonDirection(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (t - last.current < RECOMPUTE_EVERY) return;
    last.current = t;
    ref.current?.position.copy(moonDirection());
  });

  return (
    <mesh ref={ref} position={initialPos}>
      <sphereGeometry args={[MOON_RADIUS, 32, 32]} />
      <meshStandardMaterial
        map={moonTexture}
        emissiveMap={moonTexture}
        emissive="#ffffff"
        emissiveIntensity={0.2}
        roughness={0.95}
        metalness={0.0}
      />
    </mesh>
  );
}

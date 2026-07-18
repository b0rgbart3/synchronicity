// ============================================================================
// frontend/src/scene/Nodes.tsx
// Locatable Bitcoin network nodes — one glowing point per node with known
// coordinates. Flares with the block pulse via the shared blockPulse clock.
// ============================================================================

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { NodeSnapshot } from "@btcglobe/shared/types";
import { pulseProgress } from "./blockPulse";
import { PULSE_DURATION, HUM_PERIOD } from "./Heartbeat";
import { latLngToVec3 } from "./geo";

const NODE_BASE_SIZE = 0.05;
const FLARE_SIZE_GAIN = 3.1;
const FLARE_COLOR = new THREE.Color("#33f7e3");
const BASE_COLOR = new THREE.Color("#037862");
const FLARE_ATTACK = 0.025; // fraction of the pulse spent rising to peak

function makeGlowTexture(): THREE.Texture {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,0.75)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

export function Nodes({
  located,
  radius,
}: {
  located: NodeSnapshot["located"];
  radius: number;
}) {
  const glow = useMemo(makeGlowTexture, []);
  const matRef = useRef<THREE.PointsMaterial>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(located.length * 3);
    located.forEach((n, i) => {
      const p = latLngToVec3(n.lat, n.lng, radius);
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = p.z;
    });
    return arr;
  }, [located, radius]);

  // Reads the SAME clock as the shockwave so they fire together — which is
  // what makes the wave read as emanating from the network, not the Earth.
  useFrame((state) => {
    const mat = matRef.current;
    if (!mat) return;

    // 3-second sine hum: 0.75→0.5→0.75→1.0→0.75
    mat.opacity =
      0.75 - 0.25 * Math.sin((state.clock.elapsedTime * Math.PI * 2) / HUM_PERIOD);

    const p = pulseProgress(state.clock.elapsedTime, PULSE_DURATION);
    if (p === null) {
      mat.size = NODE_BASE_SIZE;
      mat.color.copy(BASE_COLOR);
      return;
    }

    const env =
      p < FLARE_ATTACK
        ? p / FLARE_ATTACK
        : Math.pow(1 - (p - FLARE_ATTACK) / (1 - FLARE_ATTACK), 2);

    mat.size = NODE_BASE_SIZE * (1 + (FLARE_SIZE_GAIN - 1) * env);
    mat.color.copy(BASE_COLOR).lerp(FLARE_COLOR, env);
  });

  return (
    <points key={positions.length}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        map={glow}
        color={BASE_COLOR}
        size={NODE_BASE_SIZE}
        sizeAttenuation
        transparent
        opacity={0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

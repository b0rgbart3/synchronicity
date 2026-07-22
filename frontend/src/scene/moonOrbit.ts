// ============================================================================
// frontend/src/scene/moonOrbit.ts
// The Moon's real orbital path around Earth, traced from actual ephemeris —
// not a schematic ellipse. Samples GeoMoon() across one full sidereal month
// to get the true right ascension/declination the Moon actually sweeps,
// which reveals its ~18-28° tilt relative to Earth's equator (the range it
// oscillates within over the Moon's 18.6-year nodal precession cycle).
//
// The shape is built in the inertial equatorial frame (raw right ascension
// used directly as "lng", i.e. as if GMST were 0). MoonOrbitRing.tsx applies
// a live GMST rotation on top of this static shape — the same correction
// sublunarPoint() bakes into a single point — so the Moon marker always sits
// exactly on the ring.
// ============================================================================

import * as THREE from "three";
import { GeoMoon } from "astronomy-engine";
import { latLngToVec3 } from "./geo";
import { MOON_SCENE_DISTANCE } from "./lunar";

const SIDEREAL_MONTH_MS = 27.321661 * 86_400_000;

// A point on the ring, in the inertial equatorial frame (raw RA used
// directly as "lng", GMST = 0) — see the module comment above.
function moonEquatorialPoint(date: Date): THREE.Vector3 {
  const v = GeoMoon(date);
  const d = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  const dec = Math.asin(v.z / d) * (180 / Math.PI);
  const raDeg = Math.atan2(v.y, v.x) * (180 / Math.PI);
  return latLngToVec3(dec, raDeg, MOON_SCENE_DISTANCE);
}

// Static ring shape in the inertial equatorial frame — recompute only
// occasionally (the true orbital plane drifts just ~19°/year from nodal
// precession, so a single sample per session is plenty).
export function moonOrbitGeometry(
  centerDate: Date = new Date(),
  segments = 300,
): THREE.BufferGeometry {
  const t0 = centerDate.getTime() - SIDEREAL_MONTH_MS / 2;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = t0 + (i / segments) * SIDEREAL_MONTH_MS;
    pts.push(moonEquatorialPoint(new Date(t)));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

export interface OrbitArrow {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

// A handful of points evenly spaced around the ring, each carrying the
// tangent (prograde) direction the Moon actually travels there — for small
// chevrons that show which way the orbit runs without needing motion.
export function moonOrbitArrows(
  centerDate: Date = new Date(),
  count = 6,
): OrbitArrow[] {
  const t0 = centerDate.getTime() - SIDEREAL_MONTH_MS / 2;
  const dt = SIDEREAL_MONTH_MS / 2000; // small step for a local tangent estimate
  const up = new THREE.Vector3(0, 1, 0);
  const arrows: OrbitArrow[] = [];
  for (let i = 0; i < count; i++) {
    const t = t0 + (i / count) * SIDEREAL_MONTH_MS;
    const p0 = moonEquatorialPoint(new Date(t));
    const p1 = moonEquatorialPoint(new Date(t + dt));
    const tangent = p1.clone().sub(p0).normalize();
    arrows.push({
      position: p0,
      quaternion: new THREE.Quaternion().setFromUnitVectors(up, tangent),
    });
  }
  return arrows;
}

// ============================================================================
// frontend/src/scene/lunar.ts
// Where the Moon is right now, expressed as a sublunar point (the geographic
// coordinates directly beneath the Moon) — the same concept as sun.ts's
// subsolar point. Uses astronomy-engine (NASA, MIT) for DE405-accuracy
// geocentric equatorial coords, then converts via Greenwich Sidereal Time.
//
// Distance is artistically compressed: the Moon is ~60 Earth-radii away in
// reality, which puts it far off-screen at this scene scale. The direction
// (and therefore the phase) is astronomically accurate; only the distance
// is scaled down to keep both Earth and Moon in the same view.
// ============================================================================

import * as THREE from "three";
import { GeoMoon } from "astronomy-engine";
import { latLngToVec3 } from "./geo";

export const MOON_RADIUS = 1.8 * 0.2727;    // exact proportion to Earth body (r=1.8)
export const MOON_SCENE_DISTANCE = 9.5;      // compressed; true scale would be ~108

function gmstDegrees(date: Date): number {
  // Julian date from Unix epoch
  const JD = date.getTime() / 86_400_000 + 2_440_587.5;
  // GMST in degrees — accurate to ~1 arcminute over decades
  const raw = 280.46061837 + 360.98564736629 * (JD - 2_451_545.0);
  return ((raw % 360) + 360) % 360;
}

export interface SublunarPoint {
  lat: number;  // Moon's geocentric declination (° north)
  lng: number;  // geographic longitude directly beneath the Moon
}

export function sublunarPoint(date: Date = new Date()): SublunarPoint {
  // J2000 equatorial vector (AU) from Earth's center to Moon
  const v = GeoMoon(date);
  const d = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

  // Geocentric declination and right ascension
  const dec = Math.asin(v.z / d) * (180 / Math.PI);
  const raDeg = Math.atan2(v.y, v.x) * (180 / Math.PI);

  // Sublunar longitude: RA relative to Greenwich, same sign convention as
  // latLngToVec3 (positive = east). Mirrors how sun.ts derives subsolar lng.
  const rawLng = raDeg - gmstDegrees(date);
  const lng = (((rawLng + 180) % 360) + 360) % 360 - 180;

  return { lat: dec, lng };
}

// World-space position for the Moon mesh (or any object at lunar distance).
export function moonDirection(
  distance = MOON_SCENE_DISTANCE,
  date?: Date,
): THREE.Vector3 {
  const { lat, lng } = sublunarPoint(date);
  return latLngToVec3(lat, lng, distance);
}

import { roundTripNanoseconds } from '../../content/sensing/measurement';
import type { MeterPoint, SensorTarget } from './types';

export function getDistanceMeters(point: MeterPoint): number { return Math.hypot(point.x, point.y); }
export function hitReflectiveMarker(origin: MeterPoint, directionDegrees: number, target: SensorTarget, halfAngleDegrees: number) {
  const dx = target.reflectivePoint.x - origin.x;
  const dy = target.reflectivePoint.y - origin.y;
  const bearing = Math.atan2(dx, dy) * 180 / Math.PI;
  const delta = Math.abs(((bearing - directionDegrees + 540) % 360) - 180);
  if (!Number.isFinite(directionDegrees) || delta > halfAngleDegrees + 1e-9) return null;
  const distanceMeters = Math.hypot(dx, dy);
  return { reflectivePoint: target.reflectivePoint, distanceMeters, roundTripNanoseconds: roundTripNanoseconds(distanceMeters) };
}
export function getScanSlotsBetween(previousDegrees: number, nextDegrees: number): readonly number[] {
  if (![previousDegrees, nextDegrees].every(Number.isFinite)) return [];
  const low = Math.max(-40, Math.min(previousDegrees, nextDegrees));
  const high = Math.min(40, Math.max(previousDegrees, nextDegrees));
  const slots = Array.from({ length: 21 }, (_, i) => -40 + i * 4).filter(value => value >= low && value <= high);
  return nextDegrees >= previousDegrees ? slots : slots.reverse();
}

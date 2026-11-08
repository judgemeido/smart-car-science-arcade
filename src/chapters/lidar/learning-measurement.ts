import type { DistanceRange, PreparedDistanceRound } from './learning-data';

export interface MeterPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}
export interface MeterTarget {
  readonly id: string;
  readonly label: string;
  readonly positionMeters: MeterPoint;
}

export function createDistanceTargets(round: PreparedDistanceRound): readonly MeterTarget[] {
  return round.targets.map((target, index) => {
    const angle = ((index - 1) * 20 * Math.PI) / 180;
    return {
      id: target.id,
      label: target.label,
      positionMeters: {
        x: Math.sin(angle) * target.distanceMeters,
        y: 0,
        z: -Math.cos(angle) * target.distanceMeters,
      },
    };
  });
}

export function getTargetDistanceMeters(target: MeterTarget, origin: MeterPoint): number {
  const point = target.positionMeters;
  // Remove trigonometric round-off at authored interval boundaries, far below display precision.
  return Math.round(Math.hypot(point.x - origin.x, point.y - origin.y, point.z - origin.z) * 1e9) / 1e9;
}

export function findDistanceRange(value: number, ranges: readonly DistanceRange[]): string | null {
  if (!Number.isFinite(value) || value < 0) return null;
  return (
    ranges.find(
      (range) =>
        value >= range.minMeters && (range.maxInclusive ? value <= range.maxMeters : value < range.maxMeters),
    )?.id ?? null
  );
}

/** Four fixed models for observation/weather; these are teaching data, not device measurements. */
export const worldTargets: readonly MeterTarget[] = [
  { id: 'world-car', label: '汽车', positionMeters: { x: -6, y: 0, z: -14 } },
  { id: 'world-person', label: '行人', positionMeters: { x: -2, y: 0, z: -8 } },
  { id: 'world-tree', label: '树', positionMeters: { x: 6, y: 0, z: -22 } },
  { id: 'world-obstacle', label: '路障', positionMeters: { x: 4, y: 0, z: -11 } },
];

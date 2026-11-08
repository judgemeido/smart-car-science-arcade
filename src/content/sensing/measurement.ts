export const SPEED_OF_LIGHT_METERS_PER_SECOND = 299_792_458;

export function roundTripNanoseconds(distanceMeters: number): number {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
    throw new RangeError('Distance must be finite and non-negative');
  }
  return ((2 * distanceMeters) / SPEED_OF_LIGHT_METERS_PER_SECOND) * 1e9;
}

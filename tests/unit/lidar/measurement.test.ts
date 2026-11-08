import { describe, expect, it } from 'vitest';
import { roundTripNanoseconds } from '../../../src/chapters/lidar/measurement';

describe('lidar round-trip measurement', () => {
  it('converts a 60 m round trip to approximately 400.277 ns', () => {
    expect(roundTripNanoseconds(60)).toBeCloseTo(400.276914, 5);
    expect(roundTripNanoseconds(0)).toBe(0);
  });

  it.each([-1, NaN, Infinity, -Infinity])('rejects invalid distance %s', (distance) => {
    expect(() => roundTripNanoseconds(distance)).toThrow(RangeError);
  });
});

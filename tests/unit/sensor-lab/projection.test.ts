import { expect, it } from 'vitest';
import { projectSensorScene } from '../../../src/activities/sensor-lab/projection';

it('keeps the whole reflective sign inside both viewport sizes for every bearing', () => {
  for (const width of [330, 390, 700, 930, 1172]) for (const bearing of [-20, 0, 20]) {
    const point = { x: Math.sin(bearing * Math.PI / 180) * 8, y: Math.cos(bearing * Math.PI / 180) * 8 };
    const scene = projectSensorScene(width, point);
    expect(scene.target.x - 45).toBeGreaterThanOrEqual(0);
    expect(scene.target.x + 45).toBeLessThanOrEqual(width);
    expect(scene.target.y - 55).toBeGreaterThanOrEqual(30);
    expect(scene.target.y + 55).toBeLessThanOrEqual(scene.height);
    expect(Math.atan2(scene.target.y - scene.origin.y, scene.target.x - scene.origin.x) * 180 / Math.PI).toBeCloseTo(bearing);
    expect(Math.hypot(scene.loosePlug.x - scene.rx.x, scene.loosePlug.y - scene.rx.y)).toBeGreaterThan(65);
  }
});

import { ARCADE_CONTENT_VERSION, createActivityRandom, type Profile } from '../../shared/arcade';
import { sensorObjectives } from './content';
import type { SensorScenario } from './types';

export function createSensorScenario(setup: { seed: string; profile: Profile; contentVersion: string }): SensorScenario {
  if (setup.contentVersion !== ARCADE_CONTENT_VERSION || !['guided', 'standard'].includes(setup.profile)) throw new RangeError('Unknown sensor setup');
  const random = createActivityRandom(setup.seed, 'sensor-lab');
  // Fixed, independently solvable templates. First random sample selects template only.
  const bearings = [[-20, 0, 20], [20, -20, 0], [0, 20, -20]][Math.floor(random() * 3)];
  return {
    ...setup, angleStep: setup.profile === 'guided' ? 4 : 2,
    halfAngleDegrees: setup.profile === 'guided' ? 6 : 4,
    objectives: sensorObjectives.map(o => ({ ...o })),
    targets: [8, 16, 28].map((distance, index) => ({
      id: `reflector-${index + 1}`, label: ['反光路标', '测试车', '树旁标记'][index],
      distanceMeters: distance, bearingDegrees: bearings[index],
      reflectivePoint: { x: Math.sin(bearings[index] * Math.PI / 180) * distance, y: Math.cos(bearings[index] * Math.PI / 180) * distance },
    })),
  };
}

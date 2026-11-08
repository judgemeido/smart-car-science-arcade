export interface ExploreTargetDefinition {
  readonly kind: 'assembly' | 'node' | 'assembly-group' | 'teaching-hotspot';
  readonly names: readonly string[];
  readonly minDistinctTargets: number;
  readonly requiredTargetGroups?: readonly (readonly string[])[];
  readonly hotspotId?: string;
}

export const exploreLearningTargets: Readonly<Record<string, ExploreTargetDefinition>> = {
  'explore-energy-battery': {
    kind: 'assembly',
    names: ['BatteryPack'],
    minDistinctTargets: 1,
  },
  'explore-energy-motor': {
    kind: 'node',
    names: ['FrontEaxle_Motor', 'RearEaxle_Motor'],
    minDistinctTargets: 1,
  },
  'explore-energy-wheel': {
    kind: 'assembly',
    names: ['Wheel_FL', 'Wheel_FR', 'Wheel_RL', 'Wheel_RR'],
    minDistinctTargets: 1,
  },
  'explore-energy-transmission': {
    kind: 'node',
    names: ['FrontEaxle_ReductionDifferential', 'RearEaxle_ReductionDifferential'],
    minDistinctTargets: 1,
  },
  'explore-structure-body': {
    kind: 'assembly',
    names: ['BodyStructure'],
    minDistinctTargets: 1,
  },
  'explore-structure-chassis': {
    kind: 'assembly-group',
    names: ['FrontSuspension', 'RearSuspension', 'Brakes'],
    minDistinctTargets: 2,
    requiredTargetGroups: [['FrontSuspension', 'RearSuspension'], ['Brakes']],
  },
  'explore-structure-suspension': {
    kind: 'assembly',
    names: ['FrontSuspension', 'RearSuspension'],
    minDistinctTargets: 1,
  },
  'explore-structure-wheel': {
    kind: 'assembly',
    names: ['Wheel_FL', 'Wheel_FR', 'Wheel_RL', 'Wheel_RR'],
    minDistinctTargets: 1,
  },
  'explore-sensor-front-camera': {
    kind: 'node',
    names: ['Front_camera_optic'],
    minDistinctTargets: 1,
  },
  'explore-sensor-surround-camera': {
    kind: 'node',
    names: ['Left_camera_optic', 'Right_camera_optic', 'Rear_camera_optic'],
    minDistinctTargets: 1,
  },
  'explore-sensor-lidar': {
    kind: 'node',
    names: ['Roof_lidar_housing', 'Lidar_optical_window'],
    minDistinctTargets: 1,
  },
  'explore-sensor-millimeter': {
    kind: 'teaching-hotspot',
    names: [],
    minDistinctTargets: 1,
    hotspotId: 'teaching-millimeter-radar',
  },
  'explore-sensor-ultrasonic': {
    kind: 'node',
    names: ['Ultrasonic_F_-1_0.23', 'Ultrasonic_F_-1_0.64', 'Ultrasonic_F_1_0.23', 'Ultrasonic_F_1_0.64'],
    minDistinctTargets: 1,
  },
};

export function resolveLearningTargetName(
  ancestorNames: readonly string[],
  target: ExploreTargetDefinition,
): string | null {
  if (target.kind === 'teaching-hotspot') return null;
  return ancestorNames.find((name) => target.names.includes(name)) ?? null;
}

export function hasRequiredTargets(target: ExploreTargetDefinition, found: readonly string[]): boolean {
  const allowed = target.kind === 'teaching-hotspot' ? [target.hotspotId] : target.names;
  const distinct = [...new Set(found.filter((name) => allowed.includes(name)))];
  return (
    distinct.length >= target.minDistinctTargets &&
    (target.requiredTargetGroups?.every((group) => group.some((name) => distinct.includes(name))) ?? true)
  );
}

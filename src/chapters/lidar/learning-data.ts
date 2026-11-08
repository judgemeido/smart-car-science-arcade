export * from '../../content/sensing/principles';
import { lidarLearningContent } from '../../content/sensing/principles';
import { createDistanceTargets, findDistanceRange, getTargetDistanceMeters } from './learning-measurement';

// Authored answers check the content, while the reducer judges the generated coordinates.
const ids = new Set<string>();
for (const round of lidarLearningContent.distance.rounds) {
  const targets = createDistanceTargets(round);
  for (const target of targets) {
    if (ids.has(target.id)) throw new Error(`重复的教学目标：${target.id}`);
    ids.add(target.id);
  }
  const nearest = [...targets].sort(
    (a, b) =>
      getTargetDistanceMeters(a, { x: 0, y: 0, z: 0 }) - getTargetDistanceMeters(b, { x: 0, y: 0, z: 0 }),
  )[0];
  const rangeId = findDistanceRange(
    getTargetDistanceMeters(nearest, { x: 0, y: 0, z: 0 }),
    lidarLearningContent.distance.ranges,
  );
  if (nearest.id !== round.correctNearestTargetId || rangeId !== round.correctRangeId)
    throw new Error(`教学距离与答案不一致：${round.id}`);
}


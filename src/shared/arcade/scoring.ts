import type { ArcadeRunConfig, ArcadeScore, ObjectiveProgress } from './types';
import { ARCADE_DURATION_MS, ARCADE_TARGET_MS, ARCADE_TOTAL_WEIGHT } from './constants';
import { nonnegative, parseProgress } from './validation';
export function calculateArcadeScore(
  objectives: readonly ObjectiveProgress[],
  elapsedMs: number,
  durationMs: number,
): ArcadeScore {
  const progressItems = parseProgress(objectives);
  nonnegative(elapsedMs);
  if (durationMs !== ARCADE_DURATION_MS || elapsedMs > durationMs)
    throw new RangeError('Invalid contest time');
  const completedWeight = progressItems.reduce((sum, o) => sum + (o.completed ? o.weight : 0), 0);
  const firstWeight = progressItems.reduce((sum, o) => sum + (o.firstCorrect ? o.weight : 0), 0);
  const progress = Math.floor((700 * completedWeight) / ARCADE_TOTAL_WEIGHT);
  const quality = Math.floor((200 * firstWeight) / ARCADE_TOTAL_WEIGHT);
  const efficiency =
    completedWeight === ARCADE_TOTAL_WEIGHT
      ? Math.floor(100 * Math.max(0, Math.min(1, (durationMs - elapsedMs) / (durationMs - ARCADE_TARGET_MS))))
      : 0;
  return { progress, quality, efficiency, total: progress + quality + efficiency };
}
/** Identity only: this helper also groups historical labels and practice records. */
export function createComparisonKey(config: ArcadeRunConfig): string {
  return JSON.stringify([
    config.activityId,
    config.challengeCode,
    config.profile,
    config.contentVersion,
    config.scoringVersion,
    config.durationMs,
  ]);
}

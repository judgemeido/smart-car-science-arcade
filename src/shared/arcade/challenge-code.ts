import type { ActivityId, Profile } from './types';
export interface ParsedChallengeCode {
  code: string;
  round: string;
  seed: string;
  profile: Profile;
}
export const CHALLENGE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export function parseChallengeCode(text: string): ParsedChallengeCode | null {
  if (typeof text !== 'string' || text.length > 64) return null;
  const code = text.trim().toUpperCase();
  const match = /^SA1-(R[0-9]{2})-([23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6})-([GS])$/.exec(code);
  if (!match) return null;
  return { code, round: match[1], seed: match[2], profile: match[3] === 'G' ? 'guided' : 'standard' };
}
/** FNV-1a over UTF-8 bytes, with unsigned 32-bit overflow. */
export function fnv1a32(text: string): number {
  let hash = 2166136261;
  for (const byte of new TextEncoder().encode(text)) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
  return hash;
}
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
/** Call once per new level; consume only for domain generation, never animation. */
export function createActivityRandom(seed: string, activityId: ActivityId): () => number {
  if (
    !/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(seed) ||
    !['history-lab', 'structure-lab', 'sensor-lab'].includes(activityId)
  )
    throw new RangeError('Invalid activity seed');
  return mulberry32(fnv1a32(`${seed}:${activityId}`));
}

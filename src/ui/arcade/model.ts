import { parseChallengeCode, type ArcadeRepositorySnapshot, type Profile } from '../../shared/arcade';
export interface ReadySetup { nickname: string; profile: Profile; code: string; manualCode: boolean }
export const defaultChallengeCode = (profile: Profile) => `SA1-R07-7K2M4C-${profile === 'guided' ? 'G' : 'S'}`;
export function createReadySetup(preferences: { nickname: string; profile: Profile; lastChallengeCode: string | null }): ReadySetup {
  const code = preferences.lastChallengeCode ?? defaultChallengeCode(preferences.profile);
  return { nickname: preferences.nickname, profile: preferences.profile, code, manualCode: code !== defaultChallengeCode(preferences.profile) };
}
export function changeReadyProfile(setup: ReadySetup, profile: Profile): ReadySetup { return { ...setup, profile, code: setup.manualCode ? setup.code : defaultChallengeCode(profile) }; }
export function editReadyCode(setup: ReadySetup, code: string): ReadySetup { return { ...setup, code, manualCode: code.trim() !== '' }; }
export function validateReadySetup(setup: ReadySetup) {
  const challenge = parseChallengeCode(setup.code.trim() || defaultChallengeCode(setup.profile));
  if (!challenge) return { ok: false as const, reason: 'invalid-code' as const };
  if (challenge.profile !== setup.profile) return { ok: false as const, reason: 'profile-mismatch' as const };
  return { ok: true as const, challenge };
}
export type RecordAction = 'clear' | 'reset' | 'next-player' | 'recover' | 'delete';
export interface RecordConfirmation { action: RecordAction; revision: number; resultCount: number; lockCount: number; expectedRunId: string | null }
export function createRecordConfirmation(action: RecordAction, snapshot: ArcadeRepositorySnapshot, runId?: string): RecordConfirmation {
  return { action, revision: snapshot.store.revision, resultCount: snapshot.store.results.length, lockCount: snapshot.store.contestLocks.length, expectedRunId: runId ?? snapshot.store.activeDraft?.runId ?? null };
}
export function confirmRecordAction(previous: RecordConfirmation | null, current: RecordConfirmation) {
  return previous !== null && previous.action === current.action && previous.revision === current.revision && previous.expectedRunId === current.expectedRunId;
}

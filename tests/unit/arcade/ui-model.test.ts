import { expect, it } from 'vitest';
import { createReadySetup, changeReadyProfile, editReadyCode, validateReadySetup, createRecordConfirmation, confirmRecordAction } from '../../../src/ui/arcade/model';
import { createArcadeRepository } from '../../../src/shared/arcade';

it('default practice is valid for both profiles but never rewrites manual code', () => {
  const ready = createReadySetup({ profile: 'guided', lastChallengeCode: null, nickname: '实验员' });
  expect(validateReadySetup(ready).ok).toBe(true);
  const standard = changeReadyProfile(ready, 'standard');
  expect(standard.code).toBe('SA1-R07-7K2M4C-S');
  expect(validateReadySetup(standard).ok).toBe(true);
  const manual = editReadyCode(ready, ' sa1-r08-7k2m4c-g ');
  const mismatched = changeReadyProfile(manual, 'standard');
  expect(mismatched.code).toBe(manual.code);
  expect(validateReadySetup(mismatched)).toMatchObject({ ok: false, reason: 'profile-mismatch' });
});
it('invalid manual teacher codes stay invalid', () => {
  const ready = createReadySetup({ profile: 'guided', lastChallengeCode: 'bad', nickname: '实验员' });
  expect(validateReadySetup(ready)).toMatchObject({ ok: false, reason: 'invalid-code' });
});
it('record confirmations require a second identical action and preserve counts', () => {
  const repository = createArcadeRepository({ storage: null });
  const confirmation = createRecordConfirmation('clear', repository.read());
  expect(confirmation.resultCount).toBe(0);
  expect(confirmRecordAction(null, confirmation)).toBe(false);
  expect(confirmRecordAction(confirmation, { ...confirmation, action: 'reset' })).toBe(false);
  expect(confirmRecordAction(confirmation, confirmation)).toBe(true);
  repository.dispose();
});

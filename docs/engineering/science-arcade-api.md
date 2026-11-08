# Shared science arcade consumer API

Import public exports from `src/shared/arcade/index.ts`. UI code belongs to `src/ui/arcade` and the activity controllers. The fixed public run/result/session types are in `types.ts` and match section 6 of the independent-games plan.

## Versions and deterministic content

`ARCADE_CONTENT_VERSION = 'science-arcade-content-1'`, `ARCADE_SCORING_VERSION = 'science-arcade-score-1'`, `ARCADE_DATA_VERSION = 'science-arcade-1'`, `ARCADE_SCHEMA_VERSION = 1`, `ARCADE_DURATION_MS = 360000`, `ARCADE_TARGET_MS = 180000`, and `ARCADE_TOTAL_WEIGHT = 1000` are central exports. The activity identity is exactly `history-lab | structure-lab | sensor-lab`; it is independent of navigation routes.

```ts
const challenge = parseChallengeCode('  sa1-r07-7k2m4c-g ');
// { code: 'SA1-R07-7K2M4C-G', round: 'R07', seed: '7K2M4C', profile: 'guided' }
// Invalid/unknown grammar returns null; it never generates a fallback scenario.
if (!challenge) throw new Error('Show an invalid-code message');
const random = createActivityRandom(challenge.seed, 'sensor-lab');
const deterministicChoice = Math.floor(random() * candidates.length);
```

`parseChallengeCode(text): ParsedChallengeCode | null` accepts `SA1-Rdd-xxxxxx-G/S`, two round digits and six characters from exported `CHALLENGE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'`. It trims and uppercases. `fnv1a32(text): number` hashes UTF-8 bytes with unsigned 32-bit arithmetic. `mulberry32(seed): () => number` returns values in `[0, 1)`. `createActivityRandom(seed, activityId): () => number` validates both inputs and hashes `${seed}:${activityId}`. Create a fresh generator for each rebuilt level; consume it only during domain generation, in a fixed order. Neither identifiers, clock, date, animation frames nor clicks seed scenarios.

`createComparisonKey(config): string` returns the ordered JSON tuple `[activityId, challengeCode, profile, contentVersion, scoringVersion, durationMs]`. It is an identity helper, including for historical/practice grouping; admission validation occurs at `session.start`. Only eligible contest results of the same key are comparable.

`calculateArcadeScore(objectives, elapsedMs, durationMs): ArcadeScore` validates unique positive integer weights totaling 1000, progress invariants, finite time in `[0, 360000]`, and duration 360000. Invalid input throws `RangeError`. It calculates `floor(700*E/1000)`, `floor(200*F/1000)`, and at most 100 completion/time points. It does not calculate practice or interruption scores. Current-version stored scores are recomputed. Historical version labels are preserved; an unfamiliar scoring version receives structural/range validation without applying the current formula to its original score.

## Repository construction and read model

```ts
const repository = createArcadeRepository(); // browser localStorage; no network
const initial = repository.read();
const preferences = initial.store.preferences;
const unsubscribeRecords = repository.subscribe((snapshot) => {
  renderLocalHistory(snapshot.store.results);
  renderPersistence(snapshot.persistence, snapshot.issue, snapshot.droppedResults);
  renderUnfinishedChallenge(snapshot.store.activeDraft);
});
```

Factory options are `{ storage?: Storage | null, nowEpochMs?: () => number, eventTarget?: EventTarget | null, createId?: () => string }`. `storage: null` explicitly selects page memory. Defaults use browser `localStorage`, `window` storage events, `Date.now`, and random local IDs. Import/construction without `window` is safe and uses memory. IDs are opaque local identifiers and do not seed levels. An injected `createId` must return fresh bounded IDs. The sole persisted key is exported `ARCADE_STORAGE_KEY = 'science-arcade:local:v1'`.

`read(): ArcadeRepositorySnapshot` returns an independent copy:

```ts
interface ArcadeRepositorySnapshot {
  store: ArcadeLocalStoreV1;
  persistence: 'saved' | 'memory-only' | 'read-only';
  issue: null | 'storage-unavailable' | 'write-failed' | 'corrupt-data' | 'future-schema' | 'invalid-results';
  droppedResults: number;
}
interface ArcadePreferences {
  slotId: string;
  nickname: string;
  profile: 'guided' | 'standard';
  lastChallengeCode: string | null;
  soundEnabled: boolean;
}
```

The store contains `schemaVersion`, `dataVersion`, `revision`, `preferences`, `activeDraft`, `contestLocks`, and `results`. Results use the complete fixed `ArcadeResult` type. A draft contains `runId`, `slotId`, `comparisonKey`, complete `config`, `objectives`, `elapsedMs`, `startedEpochMs`, and `savedEpochMs`. A lock contains `slotId`, `comparisonKey`, `runId`, and `createdEpochMs`. Read/subscribe never resume, clear or recover an active draft, and read alone does not persist defaults. Unknown fields/free-text payloads are omitted from canonical persisted objects.

`saved` describes the repository's current persisted data. `memory-only` means local writes are unavailable or protected corrupt raw data is being retained. `read-only` means a future schema remains untouched while temporary page memory can still support play. Display this distinction on the start screen and results; a successful method's boolean does not itself claim disk persistence. A dropped invalid result is counted while its valid lock remains. Invalid top-level invariants preserve the raw key until explicit clear/reset. Failed writes preserve the last successfully written string.

## Preferences, history and explicit recovery

| Method                        | Return and behavior                                                                                                                                                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `updatePreferences(patch)`    | `ArcadePreferences`; takes partial nickname/profile/lastChallengeCode/soundEnabled, never slotId. Nicknames are trimmed, control/format characters removed, and capped at 12 Unicode code points; empty becomes 实验员. Valid codes normalize. Invalid optional fields are ignored. Unknown fields are omitted. Rename keeps the slot and locks. |
| `createPlayerSlot(nickname?)` | `ArcadePreferences`; fresh slot, optional sanitized nickname, preserves other preferences and previous locks/results. Does not terminate an active draft.                                                                                                                                                                                        |
| `deleteResult(runId)`         | `boolean`; true if a result was deleted; its contest lock remains.                                                                                                                                                                                                                                                                               |
| `clearRecords()`              | `void`; clears results, locks and active draft, preserves preferences. Explicitly permits replacing protected corrupt/future raw data. UI owns the two-click confirmation and active-run warning.                                                                                                                                                |
| `reset()`                     | `void`; clears records and creates default anonymous preferences with sound off. Explicitly permits replacing protected raw data.                                                                                                                                                                                                                |
| `subscribe(listener)`         | unsubscribe function; initial callback synchronous, updates coalesced into a post-method microtask, copies per listener. Refreshes on relevant storage events.                                                                                                                                                                                   |
| `dispose()`                   | `void`; idempotent; removes storage listener/subscriptions. Does not clear records or recover a draft. Further mutations are ignored/rejected.                                                                                                                                                                                                   |

```ts
repository.updatePreferences({
  nickname: nicknameInput.value,
  profile: 'guided',
  lastChallengeCode: 'SA1-R07-7K2M4C-G',
  soundEnabled: false,
});
// Render nickname with textContent, never innerHTML.
repository.createPlayerSlot('下一位'); // after the current run ends
repository.deleteResult(selectedResult.runId); // keeps first-attempt lock

const observed = repository.read().store.activeDraft;
if (observed && userExplicitlyConfirmedEndingThisRun) {
  const ended = recoverInterruptedArcadeDraft(repository, observed.runId);
  // ArcadeResult | null. null means the ID changed, was cleared, or save was rejected.
  // Re-read and explain the current state; never retry against an unconfirmed new ID.
}
```

`recoverInterruptedArcadeDraft(repository, expectedRunId): ArcadeResult | null` checks the latest draft again through `save`, creates one null-score, ineligible `interrupted` result, and retains the first-attempt lock. It uses the last checkpoint's elapsed/domain/date metadata and does not account for cross-document time. Bootstrap may report the draft, but must never call recovery automatically.

Retention is 30 days, at most 200 results and 200 locks. Cleanup runs during mutations, never an automatic recovery. An active draft keeps its own lock. Date rollback suspends date-based deletion. Record deletion/capacity eviction never releases an unexpired first-attempt lock; full unexpired lock capacity rejects a new contest with `capacity-full`. Practice remains available. Clear/reset touch only this product key.

## Controller-owned session

Prepare the initial domain state before subscribing. Pass the same explicit repository to session and shared UI so persistence/preferences/history have one source. The session owns an interval for time snapshots and deadlines, and owns the repository only when it created the default repository itself.

```ts
const session = createArcadeSession({ repository });
let domainState = makeReadyDomainState();
const unsubscribeSession = session.subscribe((snapshot) => {
  renderShell(snapshot); // idle / running / finished, score/result, remainingMs, persistence
  if (snapshot.phase === 'finished') freezeInputAndShowEvidence(snapshot.result!);
});

function startRun(mode: 'practice' | 'contest') {
  const preferences = repository.read().store.preferences;
  const parsed = parseChallengeCode(preferences.lastChallengeCode ?? 'SA1-R07-7K2M4C-G');
  if (!parsed || parsed.profile !== preferences.profile) return showCodeProfileError();
  const level = buildLevel(createActivityRandom(parsed.seed, 'sensor-lab'), preferences.profile);
  const started = session.start({
    activityId: 'sensor-lab',
    mode,
    profile: preferences.profile,
    challengeCode: parsed.code,
    contentVersion: ARCADE_CONTENT_VERSION,
    scoringVersion: ARCADE_SCORING_VERSION,
    durationMs: mode === 'contest' ? ARCADE_DURATION_MS : null,
    slotId: preferences.slotId,
    nickname: preferences.nickname,
    objectives: level.objectives, // unique IDs, positive integer weights totaling 1000
  });
  if (!started.ok) return showStartFailure(started.reason);
  domainState = makeInitialDomainState(level); // rebuild only after successful start
}

function act(action: DomainAction) {
  const candidate = reduceDomain(domainState, action);
  // Facts: { objectiveId, revision, verdict: 'correct'|'incorrect', usedHint }[].
  // Empty facts also guard edits, incomplete input, hints and pure browsing.
  if (session.record(candidate.facts)) {
    domainState = candidate.state;
    renderDomain(domainState);
  }
}

function restartPractice() {
  session.finish('abandoned'); // no-op if already terminal
  startRun('practice');
}
function disposeController() {
  session.dispose(); // interrupts a running run exactly once, cancels timer
  unsubscribeSession();
  unsubscribeRecords();
  repository.dispose(); // explicit injected repository is consumer-owned
}
```

`createArcadeSession({ clock?, repository?, nowEpochMs?, createId? })` accepts `{ nowMs(): number }` for deterministic monotonic testing. Production scoring uses `performance.now`. Optional epoch date/ID injections affect metadata/identifiers only. Contest config must use the current content/scoring versions, a valid normalized challenge matching profile, duration 360000, and validated bounded identity/target fields. Practice requires duration null and still uses a valid seed/code.

`start(config): StartResult` is exactly `{ ok: true, runId }` or `{ ok: false, reason: 'invalid-config' | 'already-running' | 'attempt-used' | 'other-run-active' | 'capacity-full' }`. Running sessions cannot restart directly. Other-run/attempt/capacity failures leave the existing state unchanged; the UI should offer the appropriate practice/explicit cleanup action. A successful contest begin writes the lock and initial complete draft in one best-effort localStorage update. Practice does not claim the contest draft and can proceed alongside another contest.

`record(facts): boolean` validates the entire transaction before applying any objective facts. Distinct objectives in one transaction are allowed; duplicate objective entries, unknown IDs, invalid revision/verdict/hint fields reject the transaction. Same/stale objective revisions are admitted as harmless no-ops and cannot turn the first wrong into first-correct. Actual editable-answer changes increment revision in the game reducer. Completed objectives remain immutable. Hint flags lock before completion. The last valid success returns true and completes afterward through a microtask notification, allowing the controller to commit its candidate state first. At elapsed 360000, timeout wins and record returns false.

`finish(reason): ArcadeResult | null` is idempotent and returns a defensive copy of an existing result after a terminal run. `completed` requires all goals; early `completed` or early `timeout` requests return null. Deadline expiry is settled first, including on explicit finish/dispose. Practice elapsed/remaining/score are null. Abandoned/interrupted results have score null and eligible false. A contest completion/timeout has score and eligibility; persistence still separately describes whether the local attempt lock was saved.

`setActive(false)` blocks admissions without pausing the contest budget; `setActive(true)` settles the clock before input. The session timer also runs independently of animation. Bootstrap owns pagehide/navigation/BFCache handling and calls the controller's `dispose`; no page lifecycle listeners live in the core. Ownership loss interrupts the local run without saving over a different owner's draft, including a detected final-save race.

## Lower-level repository writes

Most consumers call the session. These methods are public for deterministic tests and explicit recovery:

| Method                           | Return and behavior                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `begin(draft: ArcadeDraft)`      | `StartResult`; only an initial current-version contest draft with zero elapsed/uncompleted progress. Rejects existing origin draft, retained identity attempt, reused run ID or lock capacity. Writes draft + lock together; true also permits in-memory admission when storage is unavailable.                                                                                                                |
| `checkpoint(draft: ArcadeDraft)` | `boolean`; rejects lost ownership, changed config/start identity, backwards elapsed/date, removed hints or changed completed goals. Updates current page memory; persists at most every 5000 ms of contest elapsed.                                                                                                                                                                                            |
| `save(result: ArcadeResult)`     | `boolean`; validates progress/status/formula. A contest result must own the current draft and corresponding first-attempt lock. Clears only its matching draft, adds one result, and retains the lock. Identical repeated saves return true without rewriting; conflicting repeats return false. True means repository admission, so inspect persistence separately. Practice is saved only at terminal state. |

The repository is a best-effort local origin guard. localStorage has no atomic compare-and-swap across adversarial simultaneous tabs. This API makes no anti-cheating or distributed-lock guarantee, and never sends data to other computers.

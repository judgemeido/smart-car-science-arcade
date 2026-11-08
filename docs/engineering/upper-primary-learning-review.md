# 01–04 学习内容：独立审查及最终修正

四章均完成章内规范与质量审查。下方保留最终广泛审查、一次集中修正报告及一次范围限定复审。初次 REQUEST CHANGES 已由最后的 APPROVE 解决；完整检查和实际 Git SHA 见 upper-primary-learning-progress.md。

---
# Final review — 01–04 upper-primary learning

Reviewed on 2026-11-08 against saved pre-implementation checkpoint `adb994636e3bbab55196fd4767385ee3bf65635f`, using `final-review-brief.md` and `final-review.diff` plus the changed files where bounded diff output omitted context.

## Verdicts

- **Specification compliance: REQUEST CHANGES.** The four requested learning packages are implemented and the chapter contracts are preserved, but returning from the LiDAR teaching scene does not reliably preserve the saved original view when teaching input still has inertia. The final full browser acceptance gate also has one unresolved failure.
- **Code quality: REQUEST CHANGES.** One newly established Important runtime defect, no Critical findings and no additional Minor findings. Correct the camera handoff with a focused real-controls regression; resolve the separately reported explore camera E2E failure before recording full acceptance.
- **Ready to integrate: With fixes and the required final verification.** This is not an approval to claim `npm run check` passed.

Finding counts: **Critical 0 / Important 1 / Minor 0**. The already known failing E2E is recorded separately as an outstanding acceptance gate, rather than counted again as a new or inferred runtime defect.

## Scope and evidence

Reviewed the changed runtime modules for all four chapters, shared choice assessment, their content and model/scene mappings, new views/styles, new unit/browser tests, and maintenance documentation. Consulted prior chapter review reports and their scoped fix appendices to avoid repeating resolved findings. Narrow unchanged-source inspection was limited to the concrete camera-restoration risk: the LiDAR scene's OrbitControls configuration and the installed OrbitControls implementation. Existing controller context was read only to trace the changed handoffs into focus, filters, timers, rendering and disposal.

No source, test, dependency or Git mutations were performed; this report is the sole written artifact. No subagents, build, unit-suite or browser-suite reruns were performed. One small read-only Node execution was justified by the new, specific residual-damping doubt: it imported the real new LiDAR camera helper and installed Three.js OrbitControls, reproduced the issue below, and exited without writing files.

Root's latest actual-workspace evidence is **187 unit tests passed, build passed, 61/62 E2E passed**. The sole failing case is `tests/e2e/explore-learning.spec.ts:79`; its preserved failure evidence is under `validation/final-check-failure/`. Root reports the history teardown/BFCache, route and LiDAR delayed-success tests passed, and reports manual inspection of the final desktop/mobile screenshots. These are accepted root-supplied execution results, not executions or visual inspections performed by this reviewer. Root also reports Git approval has recovered and S0 was saved as `0b6fff7`; source review does not certify the remaining integration commits.

## Strengths

- **Chapter boundaries and original behavior are retained.** Chapter identifiers/navigation, the 14 history exhibits, three original explore tasks, original LiDAR experiment and original eight-scenario score remain separate from the new learning state. Original timing reducers were not replaced. New feedback requires a student action.
- **Rules and content have clear ownership.** Typed chapter content no longer loads reference JSON at runtime. Shared assessment validates empty/unknown choice IDs before correctness. History validates order and open-expression bounds; explore requires both a real allowed target or labelled diagram selection and a correct function answer; LiDAR grades meter coordinates; traffic carries both phase and scenario identity on continue events.
- **The model and learning representation are generally honest.** Explore uses nearest permitted ancestor matching and requires suspension plus brakes, with a separate teaching-only millimeter-wave hotspot. LiDAR uses the same meter data for display and grading, preserves boundary inclusion, and labels point clouds/weather as illustrations. Traffic's assumptions explicitly distinguish clear passage, conflict, unknown adjacent space and unreliable sensing.
- **Input and resource work is substantial.** New student text is rendered as text, native button alternatives cover non-drag operation, and scope-owned scene objects are detached and disposed. Tests exercise real Three.js geometry and authored GLB names, keyboard paths, late models, retry, BFCache and original-score preservation. The traffic phase-specific duplicate-continue checks and history explicit-disposal fix address real integration behavior.

## Findings

### Important I1 — Clear teaching inertia before restoring the original LiDAR camera

**Primary location:** `src/chapters/lidar/learning-camera.ts:33`–`48`, especially the restoration at lines 38–47.

**Call path and coverage:** `src/chapters/lidar/controller.ts:118` restores the snapshot when closing learning or returning to the guide; `controller.ts:495` then calls `controls.update()` every active frame. The original scene enables damping with factor `0.07` at `src/chapters/lidar/scene.ts:37`–`38`. `tests/unit/lidar/learning-camera.test.ts:20`–`37` substitutes a controls object whose update only performs `lookAt`, so it cannot expose retained OrbitControls inertia.

**Trigger:** Open the four-target, distance or weather teaching scene, drag/orbit or pan its camera, then immediately close the teaching scene or select the guide while motion is still easing. Closing after an immediate chapter pause/return or a persisted page exit can encounter the same residual motion.

**Actual behavior:** `restoreLidarCamera` assigns the saved position, target and constraints and updates the camera matrices, but does not clear the real controls' retained spherical/pan deltas. The next normal `controls.update()` applies those teaching deltas to the restored original view. Once those deltas have decayed, the original camera remains at a different position; it is not merely one transient frame. The explicit `lookAt` comment avoids a second damping step during the helper call but cannot prevent all subsequent render-loop steps.

**Concrete reproduction:** A read-only Node command imported `src/chapters/lidar/learning-camera.ts` directly and instantiated real `OrbitControls(camera, null)` with the chapter's damping value and bounds. After saving a valid original view and entering the teaching view, it used the installed controls' `_rotateLeft(0.5)` path (the same method called by rotate pointer movement), ran one controls update, restored the original snapshot, then ran the ordinary updates. Measured position error against the saved original was:

| Time | Position error in scene units |
| --- | ---: |
| Immediately after helper restoration | 0 |
| After the next normal controls update | 0.1774078281 |
| After another 120 controls updates | 2.5113578557 |

The result follows the installed OrbitControls implementation: it adds retained spherical deltas and pan offsets on update, then multiplies them by `1 - dampingFactor` rather than removing them immediately. The reproduction does not change application state, inject a fake restoration result, or use a browser timing tolerance.

**Impact and requirement:** Students lose their original radar observation after interacting with the added teaching scene. This violates the new learning-mode restoration behavior in the chapter plan and the promise at `docs/development/lidar-content.md:17`. It is a new handoff defect. The separate documented, pre-existing behavior of the original `controls.reset()` button while original-scene inertia is active is outside this fix; this finding does not request changing that old control.

**Focused correction:** At the transition that relinquishes the teaching camera, consume/reset the temporary controls motion before applying the saved original snapshot, then restore the intended damping/constraints and render from that snapshot. The explore camera helper already demonstrates a public-controls approach using a temporary no-damping/no-auto-rotate update before snapshot application. Treat the late-model installation transaction separately if preserving teaching inertia there is intentional; do not accidentally consume unrelated motion while fitting the hidden original model. Keep the corrected original snapshot and near/far/zoom handling from the earlier late-load fix.

**Focused verification:** Add a regression using actual OrbitControls with a pending rotate and pan delta, restore through the production handoff, call `controls.update()` and refresh the camera matrix, and assert that subsequent frames preserve the saved position and target. Exercise both close and return-to-guide through the controller/browser integration. Retain the existing delayed-success camera tests so the fix does not reintroduce model-fitting ownership problems. Root owns the browser execution and final full check.

### Critical

None.

### Minor

None independently worth adding to this correction wave.

## Known outstanding acceptance gate — explore camera E2E

`tests/e2e/explore-learning.spec.ts:79` failed in root's final run. Root's trace reports expected `-2.10154433057`, received `-2.10323337598`, an absolute difference of about `0.001689045`, at precision 3. The test waits a fixed 1100 ms after real orbit/pan/wheel input (`:65`), samples `before` (`:67`), and then performs a native entry click (`:68`); it samples again after cancellation and explicit launcher-focus confirmation (`:77`–`79`).

There can be ordinary animation frames and the existing delayed auto-rotation behavior between those sampling boundaries. The test therefore does not by itself establish whether the restoration differs from the actual snapshot captured by the controller at entry, or whether the original pose changed between the test's earlier sample and that entry. The current explore helper explicitly flushes temporary damping and restores the full camera/target/constraints; static review found no additional concrete defect there. **The failure's cause remains unresolved in this review.** It is not evidence for attributing the separately reproduced LiDAR defect to explore.

Root's final fix investigation should obtain the real pose at the actual entry boundary, or otherwise establish a genuinely stable observed precondition and account for the rotation timer, while preserving the native user interaction and focus assertion. Do not simply widen the tolerance, remove the custom-view case, or record the current 61/62 result as passing. A focused diagnostic is sufficient to decide whether runtime code or the test's observation timing needs correction.

## Requirements assessment

| Area | Review result |
| --- | --- |
| Four existing chapter IDs, navigation, mount/load/setActive/dispose surface | Preserved by the scoped change; no new chapter or global learning service |
| 01 original exhibits, five themes, ordering, three matching questions, future reason and knowledge card | Present; invalid IDs and real edits cannot retain an invalid completed card; Unicode and composition handling are explicit |
| 02 original three tasks/story, three reviews, 13 grouped tasks and source reporting | Present; original pick path is bypassed during learning, teaching-only target cannot be reported as a model find |
| 02 four-step assembly return and old explosion ownership | Present; the real rig override suppresses competing position updates, cancellation restores retained explosion progress, completion returns the old underlying progress to closed |
| 03 old experiment plus guide/cards, three coordinate-based distance rounds, fixed weather scenes and record | Present; exact target measurements appear after submission, ranges include 10 and 20 once, weather switching grants no mastery; camera exit has I1 |
| 04 eight-question review, five independent observe/decide/feedback/summarize tasks | Present; source-choice feedback mappings are retained, mastery requires both manual continuation stages, original eight-point score is independent |
| Async loading, fallback, disposal and scene ownership | Late-model LiDAR ownership and explore degraded learning are explicitly handled; new GPU resources have a defined scope; I1 affects shared controls state during view restoration |
| Ordinary navigation versus page exit | New state survives normal chapter suspension; BFCache handlers reset the new state; root reports the relevant browser cases passed |
| Mouse/keyboard/touch and text rendering | Native alternatives and scoped text rendering are present; root reports narrow layout and route checks passed; no additional concrete input blocker found |
| Content/runtime dependencies and documentation | Typed content ownership is consistent; no added framework/backend/login/storage/dependency; final progress/commit records still need root's final evidence updates |
| Final acceptance | Units/build passed; 61/62 E2E means the whole-task gate is not yet passed |

## Declined to judge / limits

- The documented original LiDAR reset-button behavior with unsettled original-scene damping is pre-existing. Only the new teaching-to-original handoff is raised as I1.
- Real vehicle sensing performance, legal driving advice and validation of all historical source claims were not re-researched: the scope is implementation of the approved content pack and retention of original exhibits, not a new subject-matter/legal audit. No new unsupported performance metric was found in the teaching implementation.
- Persistent accounts/storage, new chapters 05/06, random curricula, 100-point scoring and unrelated pre-implementation refactors are outside the explicit task. None was requested as a correction.
- Actual OS IME behavior, physical-device touch behavior, visual legibility and renderer-level browser behavior are not claimed from static review. The root's actual checks are recorded as reported evidence; the new inertia case specifically requires the focused regression above.
- Final Git staging/commit completeness and the final factual progress ledger are the integration owner's tasks. This review does not mutate or certify them.

## Recommended final correction wave

Fix I1, resolve the observed explore camera-test failure based on its actual sample/entry timing, run focused regressions for those corrections plus retained delayed-model behavior, then complete root's required final validation and factual progress records. No broader refactor, new content work or repetition of already settled chapter reviews is recommended.

---
# Consolidated final camera correction report

Status: **DONE** for this correction wave. Root still owns the final full `npm run check`, integration records and single scoped re-review. No Git commands/mutations or subagents were used.

## I1: LiDAR teaching inertia

The saved position, target, near/far/zoom and distance constraints were correct, but the old `restoreLidarCamera` left OrbitControls' private spherical and pan deltas pending. The production loop's next damped update applied those teaching deltas to the original view. Merely restoring the matrices could not stop subsequent drift.

`restoreLidarCamera` now temporarily turns off damping and auto-rotation, calls the real public `controls.update()` to consume pending motion, restores the previous flags in `finally`, and then applies the original snapshot. Damping factor and polar constraints are untouched; distance constraints and clipping/zoom still come from the saved snapshot. No private controls state is mutated by production code.

The snapshot application is a separate private function used by `installWithLearningCamera`. Late model installation is still a temporary camera transaction, rather than a teaching exit: applying its original/teaching snapshots does not introduce a controls update or discard teaching motion. The existing model fitting/reset snapshot and installation-failure behavior remain intact. A new real-controls comparison with an uninterrupted teaching camera covers this distinction, including original bounds and fitted near/far/zoom.

The existing controller close and guide paths already call `restoreLidarCamera`, so no controller change was needed. Tests exercise all six world/distance/weather × close/guide combinations with real native orbit and right-button pan input, observe immediate restoration, then compare the actual rendered matrix and target in each of 121 ensuing frames. The original three delayed-success model cases remain and passed.

## Explore acceptance failure diagnosis

The runtime restoration was correct. The test's fixed 1100 ms wait did not establish a settled precondition: damping can still move the camera between its earlier sample and the subsequent native launcher click. The controller saves at the click, so the earlier sample is the wrong expected pose. The original 2500 ms inactivity timer can also resume auto-rotation; a sample taken after cancellation can legitimately differ from the restored pose once normal frames resume.

A diagnostic run retained the old sample/comparison and observed the real camera at the native entry and cancellation boundaries through the existing Three renderer probe. It reproduced the failure:

| Observation | Camera X |
| --- | ---: |
| Earlier test sample | -2.1085453449899436 |
| Native entry, before controller save | -2.109634047592986 |
| Cancellation, after controller restoration | -2.109634047592986 |
| Live camera after launcher-focus assertion | -2.109634047592986 |

Entry/cancellation/post-focus matrices, positions and targets were exactly equal in that run; the old comparison failed with **0.0010887026030421687** X difference. The earlier target was `[-0.2295146463284802, 0.6062834117218489, -0.11053035485721437]`; entry/cancellation/post-focus target was `[-0.2297104635487599, 0.6063911686181632, -0.1106324146258484]`. This establishes continued damping before entry rather than a restoration defect. It is consistent with root's independently preserved 0.001689045 failure, whose magnitude depends on how many frames occur before entry.

The test now records cloned real camera/target values in document capture immediately before the controller's delegated save handler, and in document bubble immediately after the restoration handler. No animation frame can intervene within those synchronous boundaries. Assertions retrieve the observed cancellation result after confirming native launcher focus. They retain custom pose and orbit-target restoration, native orbit/pan/wheel interactions, actual teaching framing/assembly movement, and original explosion state. Custom position and target movement are now explicitly required. Matrix/target precision was strengthened from 3 to **10**, not widened. No camera, controls behavior, mission state, hit result or restoration result is replaced.

There are two timing cases: immediate pending damping, and the original auto-rotation resumed after its 2500 ms timer (2700 ms wait followed by a real camera-motion condition). Each exercises challenge and assembly cancellation. All production explore files are unchanged. Temporary diagnostic console/global evidence code was removed; only the bounded observation probe remains.

## Edited files

- `src/chapters/lidar/learning-camera.ts`
- `tests/unit/lidar/learning-camera.test.ts`
- `tests/e2e/lidar-learning.spec.ts`
- `tests/e2e/explore-learning.spec.ts`
- This report.

No content, dependency, chapter lifecycle, original activity/timing or unrelated scene files changed. Build regenerated `dist` only as required for actual preview verification. Root's existing preview on 4173 was reused; no server was started/stopped.

## Exact RED/GREEN evidence

All shell commands used PowerShell with `login:false`; test commands removed `Env:NO_COLOR`. Root's existing failure trace/screenshot/context was verified present under `validation/final-check-failure` before the first browser run. `validation/final-fix-base` was read only and remains unmodified.

1. **LiDAR unit RED**, 2026-11-08 15:13:31 local:
   `npm run test:unit -- tests/unit/lidar/learning-camera.test.ts`
   Exit 1; **3 failed / 2 passed**. Pending rotate, pending pan and combined rotate/pan cases failed on the first ordinary update after restoration, with position errors **0.16274281534382434**, **0.052080000000000036**, and **0.214817590177842**, respectively (required `< 1e-10`). An earlier fixture run at 15:13:19 masked these assertions with `dispose()` on null-DOM controls; the test fixture was corrected because such controls never attach listeners, then the actual behavior RED above was obtained before the runtime change.
2. **Explore diagnostic RED**:
   `npm run test:e2e -- tests/e2e/explore-learning.spec.ts -g "actual custom camera"`
   Exit 1; **1 failed**, old precision-3 assertion. Diagnostic entry/cancel/live evidence above showed the difference existed entirely before the controller saved its view.
3. **LiDAR unit GREEN**, 15:14:22:
   `npm run test:unit -- tests/unit/lidar/learning-camera.test.ts`
   Exit 0; **5 passed** after the public-controls handoff fix, including retained real-model fitting and failed-install restoration tests.
4. **Explore observation-boundary GREEN**:
   `npm run test:e2e -- tests/e2e/explore-learning.spec.ts -g "actual custom camera"`
   Exit 0; **1 passed** after correcting the observation boundaries and strengthening precision. This preliminary run preceded adding the separate resumed-auto-rotation case.
5. **LiDAR browser RED against still-pre-fix built production**, before rebuilding:
   `npm run test:e2e -- tests/e2e/lidar-learning.spec.ts -g "world teaching camera"`
   Exit 1; **2 failed** (close and guide). Immediate restoration matched but the ensuing rendered frames differed: first asserted matrix error **0.07842004674401315**, precision 10. The preview was deliberately still serving the unchanged pre-fix build, so this proves the new browser regression detects the actual old handoff defect rather than just the unit fixture.
6. **Complete owned chapter unit GREEN**, after adding the model-transaction continuation case, 15:16:24:
   `npm run test:unit -- tests/unit/explore tests/unit/lidar`
   Exit 0; **19 files / 83 tests passed**.
7. **Actual-workspace build GREEN**:
   `npm run build`
   Exit 0; TypeScript build and Vite production build passed (79 modules).
8. **Final focused browser GREEN against that new build**:
   `npm run test:e2e -- tests/e2e/explore-learning.spec.ts tests/e2e/lidar-learning.spec.ts -g "actual custom camera|teaching camera clears|delayed successful model"`
   Exit 0; **11 passed (44.9 s)**. Two explore timing cases each cover both challenge/assembly; six LiDAR camera handoffs cover both exit paths and all three teaching tabs; three retained LiDAR delayed-success model cases cover camera/clipping/zoom and original reset after fitting.
9. **Formatting GREEN**, after final self-review:
   `npx prettier --check src/chapters/lidar/learning-camera.ts tests/unit/lidar/learning-camera.test.ts tests/e2e/lidar-learning.spec.ts tests/e2e/explore-learning.spec.ts`
   Exit 0; all four files conform.

## Fresh author self-review

Re-read the complete final helper, observation probes, regressions, original controller save/restore paths and model-normalization controls calls; checked the scope against `final-fix-base` file inventory. The teaching-exit controls update precedes snapshot application, flags are restored, and model transactions use snapshot-only application. Original snapshot cloning, near/far/zoom, fitted reset view, distance/polar limits, and damping factor are preserved. Real-controls tests assert each subsequent update, not merely the synchronous helper result. The test-only delta producers invoke installed OrbitControls methods; production uses only its public update/flags.

Explore's observation boundaries follow the actual capture/restore ownership contract and permit legitimate original auto-rotation after the boundary. Its focus, custom-input, framing/assembly and explosion assertions remain. Real native entry/cancel events execute application handlers; the probes only observe camera values. The preserved delayed-success tests passed unchanged in their assertions. No timer, lifecycle, BFCache, old reset, model fallback or original activity behavior was altered.

No remaining known correction-wave failure. Full acceptance, original domain/lifecycle regression coverage and independent scoped re-review remain root-owned; this report does not claim the final full check has passed.

---
- **Important I1 — LiDAR restoration retained teaching rotate/pan inertia** — **ADDRESSED**. `src/chapters/lidar/learning-camera.ts:43` temporarily disables damping and auto-rotation, consumes pending motion through the public `update()`, restores both flags in `finally`, then applies the saved snapshot at `:53`. The installed OrbitControls implementation clears spherical and pan deltas when damping is disabled. Snapshot application at `:61` preserves position, target, distance bounds, near/far/zoom and updates the projection/world matrices; damping factor and polar bounds are untouched. Model installation uses the separate snapshot-only application at `:86` and `:93`, preserving the earlier transaction behavior rather than invoking the new teaching-exit flush. `tests/unit/lidar/learning-camera.test.ts:14` uses actual OrbitControls for rotate, pan and combined pending motion, checks 121 subsequent updates and retained flags/bounds, while `:66` compares transaction continuation with an uninterrupted real-controls fixture. `tests/e2e/lidar-learning.spec.ts:108` covers all six world/distance/weather × close/guide native handoffs, immediate matrix/target/clipping/zoom restoration, and 121 ensuing rendered-frame observations. Both controller exit paths still reach the helper through `src/chapters/lidar/controller.ts:118`.
- **Known acceptance failure — explore custom-camera cancellation observation** — **ADDRESSED**. `tests/e2e/explore-learning.spec.ts:34` captures cloned real camera values in document capture before the host's delegated save handler; `:44` captures after restoration in document bubble. This matches the actual synchronous entry/cancellation ownership boundaries (`src/chapters/explore/controller.ts:672`, `:692`, `:764`) and avoids comparing an earlier still-damping pose or a later legitimately rotating pose. The diagnostic RED reported earlier X `-2.1085453449899436`, entry X `-2.109634047592986`, and identical entry/cancellation/post-focus observations: the old expected pose differed before the controller saved it. The revised cases at `tests/e2e/explore-learning.spec.ts:86` retain native orbit/pan/wheel, challenge and assembly cancellation, launcher focus, custom position/target movement, framing/assembly actions and original explosion assertions. Matrix and target comparison at `:137` is strengthened from precision 3 to 10. The second timing case waits for the existing inactivity timer and then requires observed camera motion at `:105`; production explore behavior is unchanged. This resolves the identified observation defect; completion of the root-owned full acceptance run remains a separate gate.

### New Breakage in the Fix Diff

- **Critical/Important:** None. The four-file correction diff introduces no new blocking runtime or test defect.

### Covering-Test Claims Checked Against the Diff

- **LiDAR RED/GREEN coverage:** The implementer's report names the focused camera unit command and records 3 failed / 2 passed before the fix, with first-frame rotate/pan/combined errors, followed by 5 passed after the fix. Those cases correspond to the real-controls regressions at `tests/unit/lidar/learning-camera.test.ts:14`; the later transaction case at `:66` is covered by the reported final owned-chapter run, 19 files / 83 tests passed.
- **Browser regression coverage:** The report records the old built LiDAR world handoff failing both close/guide cases after immediate restoration, followed by the rebuilt focused browser command yielding 11 passed. Its filter selects exactly two explore timing cases, six LiDAR handoffs and three retained delayed-success model cases at `tests/e2e/lidar-learning.spec.ts:348`. The new frame comparisons detect the original residual-inertia symptom rather than merely checking synchronous restoration.
- **Explore diagnostic coverage:** The reported precision-3 diagnostic failure and native boundary values support the causal explanation. The final tests observe application events and camera values; they do not substitute camera restoration, controls state, mission state or hit results.
- **Build/format claims:** The report records `npm run build` exit 0 and Prettier exit 0 for all four changed files. Root separately reports its current full-check units (191) and build passed, with browser validation still in progress at review dispatch. These are supplied execution results checked for relevance against the diff, not reviewer executions or a claim that the full gate passed.
- **Reviewer checks:** Read the supplied fix diff once and inspected bounded helper, controller event-order, regression and installed-controls context. No concrete uncovered doubt justified repeating successful tests; no tests, Git commands, source/index/branch mutations or subagents were used. This report is the sole written artifact.

### Out-of-Scope Observations

- None.

### Verdict

- **Specification compliance:** APPROVE for this scoped correction wave; both findings are addressed.
- **Code quality:** APPROVE for this scoped correction wave; no new Critical/Important breakage.
- **Fix round:** All findings addressed, no new Critical/Important breakage. No additional review wave is required. Root must record the actual final full acceptance result before claiming whole-task completion or integration readiness.

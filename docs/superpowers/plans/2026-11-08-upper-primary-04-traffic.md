# 04 安全决策 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 保留原八题和 8 分体验，增加复习及五题进阶挑战，让学生按观察、决策、反馈和总结学习。

**Architecture:** 原 data/rules/simulation/presentation 继续负责八题；learning-data 维护复习引用与进阶题，practice-state 负责新阶段，practice-scene 展示新情境，learning-view 展示反馈。controller 切换模式，不混用新旧答题事件。

**Tech Stack:** 沿用 TypeScript、Three.js、原生 DOM、Vitest 与 Playwright，不新增依赖。

**Spec:** [新设计第 7 节](../specs/2026-11-08-upper-primary-learning-design.md#7-04-安全决策)。

## Global Constraints

[总 Plan 的全部约束](./2026-11-08-upper-primary-learning-plan.md#global-constraints) 逐条适用。原八题不替换、不加门禁，不改 8 分和原计时；新挑战不记入原分数。

## Review Focus

- 原选择显示顺序变化后，复习仍按 sourceChoiceId 对应正确解释。
- 学生未观察、答错或未总结时不能越过相应阶段；重复操作不跳题。
- 新情境画面必须满足题面安全条件，不能暗示未确认的绕行空间。
- 进阶入口不打断旧反馈计时；退出恢复场景、相机和旧分数。
- 模型失败时仍可理解情境，后台/重建不重复登记进阶掌握。

## Task T1 / P1：原八题复习

**Files:** Create `src/chapters/traffic/learning-data.ts`、`learning-view.ts`、`tests/unit/traffic/learning-data.test.ts`、`tests/e2e/traffic-learning.spec.ts`；Modify `src/chapters/traffic/view.ts`、`controller.ts`、`styles.css`、`docs/development/traffic-content.md`。

**Interfaces:** Consumes 原 `scenarios: Scenario[]` 与 S0 `ChoiceQuestion`。Produces `trafficReviewAnnotations: readonly TrafficReviewAnnotation[]`（sourceScenarioId、choiceFeedback[{sourceChoiceId,copy}]、observationClue、knowledgeSummary、reflection）与 `trafficPracticeScenarios: readonly TrafficPracticeScenario[]`；后者含 id/title/sceneAssumptions/observation/question/summary/sceneKind。

Produces `renderTrafficReview(host: HTMLElement, scenarios: readonly Scenario[], annotations: readonly TrafficReviewAnnotation[]): void`。原题正确答案从原 options.correct 读取，不复制到注释；复习显示全部选项解释，不假装有原状态未保存的八题个人答题历史。

- [ ] 写映射测试：8 个注释与原场景一一对应，24 个 sourceChoiceId 都能找到原选项；打乱选项显示顺序仍按 ID 对应解释；五道进阶题 ID 独立于原场景。
- [ ] 添加 E2E：原八题结束后可打开复习；关闭回到原成绩；重复打开不叠加处理器。运行 `npm run test:unit -- tests/unit/traffic/learning-data.test.ts` 和构建后的 `npm run test:e2e -- tests/e2e/traffic-learning.spec.ts`，确认新接口尚不存在时失败。
- [ ] 转换 [04 内容包](../../content/2026-11-08-upper-primary/04-traffic.json)，建立原题注释与独立五题；原 rules、stopZ 与计时保持不动。
- [ ] 接入结束后的复习入口，按 sourceScenarioId/sourceChoiceId 显示观察与解释，讨论题不自动评理由。只用当前真实原分数，不编造个人错题列表。
- [ ] 重跑映射单元、构建及 traffic 新旧 E2E，通过后更新指南与记录。

## Task T2 / P2：五题观察—决策—反馈—总结

**Files:** Create `src/chapters/traffic/practice-state.ts`、`practice-scene.ts`、`tests/unit/traffic/practice-state.test.ts`、`practice-scene.test.ts`；Modify learning-data/learning-view/controller/styles.css 与 `tests/e2e/traffic-learning.spec.ts`。

**Interfaces:**

- Consumes `trafficPracticeScenarios`、S0 `evaluateChoice` 和原 `ChapterController` 生命周期。
- Produces `TrafficPracticePhase = 'ready' | 'observe' | 'decide' | 'feedback' | 'summarize' | 'complete'`、`TrafficPracticeState`（phase/scenarioIndex/choiceId/verdict/masteredScenarioIds）。
- Produces `createTrafficPracticeState(): TrafficPracticeState` 与 `reduceTrafficPractice(state: TrafficPracticeState, event: TrafficPracticeEvent, scenarios: readonly TrafficPracticeScenario[]): TrafficPracticeState`。
- event 为 `start`、`observed`、`answer {choiceId}`、`retry`、`continue {fromPhase,scenarioId}`、`reset`；fromPhase 仅为 feedback/summarize，且必须与当前 phase/题 ID 一致。start 进入 observe，observed 进入 decide，answer 进入 feedback，答错可 retry，答对 continue 进入 summarize，再由总结按钮发送新的 continue 才进入下一题 observe 或 complete。
- Produces `createTrafficPracticeScene(parent: THREE.Group, scope: ReturnType<typeof createScope>): TrafficPracticeScene`；返回 `show(scenario: TrafficPracticeScenario): void`、`showDecision(verdict: 'correct' | 'incorrect'): void`、`update(deltaSeconds: number): void`、`hide(): void`。
- Produces `renderTrafficPractice(host: HTMLElement, state: TrafficPracticeState, scenarios: readonly TrafficPracticeScenario[]): void`；场景与界面读取同一题 ID 和状态。

- [ ] 写失败测试：ready 阶段不能 answer；未 observed 不能 answer；未知 ID 不变；答错不能进入 summarize，retry 回到 decide；答对后需要两次有阶段意义的 continue 才进入下一题；重复发送同一 fromPhase/scenarioId 的 continue 不跳过总结，旧题事件不推进新题。
- [ ] 增加测试：五题各掌握一次才 complete；重复提交不重复登记；reset 只清进阶状态，`expect(originalTrafficState.score).toBe(8)` 仍成立；阶段机不导入原 reduceTraffic。
- [ ] 运行 `npm run test:unit -- tests/unit/traffic/practice-state.test.ts`，确认接口未实现导致失败。
- [ ] 实现新纯阶段机。反馈与总结主动继续，按钮携带生成时的阶段和题 ID，消费后立即禁用原按钮；阶段上下文不匹配的重复事件忽略。不派发旧 `schedule-continue` 效果，不启用 100 分或首答计分。
- [ ] 在独立场景组制作五种教学情境：绿灯且无人冲突；给定停车空间的横穿行人；邻道安全未知的障碍；雨/湿滑/低视线；感知不可靠提示。正确行动与风险解释匹配给定条件，不以随机动画决定安全。
- [ ] 写场景测试：show/hide 后不改变原场景对象变换，切题只显示一题的道具；scope 销毁释放新几何/材质。接入当前 renderer，使用独立组和现有 animation loop，不增加第二套驾驶引擎。
- [ ] controller 只在原 ready/complete 阶段开放进阶入口，保存原场景可见性与相机姿态；活动时停旧道路更新，退出恢复并保持原成绩。新动画受 setActive 控制，重建时创建新的进阶状态。
- [ ] 增加 E2E：错误后重试、总结后继续、五题完成；原八题 8 分不变；切章暂停/返回、退出视角恢复、模型失败文字情境可用、重复开启没有重复提交。
- [ ] 运行 practice 单元、`npm run build`、`npm run test:e2e -- tests/e2e/traffic-learning.spec.ts tests/e2e/traffic-domain.spec.ts`，通过后更新真实记录。

## 04 完成条件

- [ ] 原八题、8 分、计时与过街机制仍可完整使用。
- [ ] 进阶五题有清楚的观察条件、解释和主动继续，完成数不冒充原分数。
- [ ] 场景表现与题目条件一致，退出后恢复原玩法并清理资源。

本计划只实施 04；公共文件归集成负责人。未获得实施指令前保持任务未勾选，不自动提交。

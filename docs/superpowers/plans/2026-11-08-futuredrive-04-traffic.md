# 04 Traffic：安全决策挑战 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将八个道路题升级为递进的观察、决策、结果、总结四步挑战，记录首答成绩和最终安全理解。

**Architecture:** 场景定义和安全动作评估使用稳定 ID，3D 场景执行评估结果；章节状态机推进四步交互。计分和成绩提交通过公共档案，取消索引特判和自动跳题。

**Tech Stack:** Three.js、GLTFLoader、原生 DOM、TypeScript、Vitest 和可暂停的场景动画。

**Spec:** [设计稿第 7 节及全局要求](C:/Codex/citygame01/docs/superpowers/specs/2026-11-08-futuredrive-learning-route-design.md)；[公共接口](C:/Codex/citygame01/docs/superpowers/plans/2026-11-08-futuredrive-plan.md)。

## Global Constraints

- 只编辑 `C:/Codex/citygame01/src/chapters/traffic/` 和 `tests/chapters/traffic/`；复用原车辆与道路，不改其他模块。
- 主路线八关满分 100；前述设计稿中的逐关分值固定。
- 首答计分，答错可重试但不改首答；最终选择安全做法并完成知识总结才推进。
- 不把激光雷达缺失直接当作“无法识别行人”；反馈由场景与动作计算。
- 结果/总结由学生确认后继续；去除现有 2.3 秒自动跳题与 scenarioIndex 1/4 特判。
- 所有计时、动画和任务记录遵守公共模式、暂停、销毁与存储要求。

## Review Focus

1. 八关顺序改变：行人、雨天等行为根据稳定 ID/场景类型工作，不被数组索引改变。
2. 数据存在多个安全选项：展示和判分不能仍假设仅第一个 correct 为真。
3. 首答错、重试对、重复点击：只首次计分，仍可最终掌握，不跳过总结。
4. 结果动画中退出：暂停回调与计时，返回停留原步骤，不进入下一题。
5. 感知异常、绿灯、暴雨：反馈解释场景条件，不能一律“越慢/一直停车就是最高分”。

## 文件与接口

S0 已迁移 traffic-scene.ts，创建 view.ts/index.ts。04 创建 scenarios.ts、decision.ts、chapter.css；测试 decision.test.ts、flow.test.ts、scoring.test.ts。

scenarios.ts 定义：

- `ScenarioScene = { kind: string; stopZ: number; weather: 'clear' | 'rain'; perception: 'reliable' | 'uncertain' }`；kind 使用设计稿八个 ID，stopZ 与实际道路和道具布局一同配置。
- `DecisionChoice = { id: string; label: string; action: DrivingAction }`。
- `ScenarioDefinition = { id: string; prompt: string; description: string; score: 10 | 15; scene: ScenarioScene; choices: DecisionChoice[]; safeActions: DrivingAction[]; summary: string[] }`。

decision.ts 定义 `DecisionOutcome = { safe: boolean; action: DrivingAction; risk: 'none' | 'signal-violation' | 'pedestrian-conflict' | 'collision-risk' | 'low-visibility-risk' | 'uncertain-perception'; explanation: string }`，导出 `evaluateDecision(scenario: ScenarioDefinition, action: DrivingAction): DecisionOutcome` 和 `assessDecision(scenario: ScenarioDefinition, action: DrivingAction): TaskAssessment`。

traffic-scene.ts 导出 `TrafficSceneController extends ChapterController`，另提供 `loadScenario(scene: ScenarioScene)`、`playObservation(onComplete: () => void)`、`playOutcome(outcome: DecisionOutcome, onComplete: () => void)`、`reset()`；callbacks 在暂停时不得完成，dispose 后不得触发。

index.ts 的状态类型为 `ready | observe | decide | outcome | summary | complete`，额外用 stable scenarioId、是否已首次提交和最终 mastered 表达题目状态，不再让多个 running/finished/answered 布尔值互相矛盾。

必做 taskId 为 `traffic.` + `red-light / green-light / pedestrian-crossing / sudden-pedestrian / construction / obstacle / heavy-rain / sensor-uncertain`。report artifact 保存逐题首答、首答分、最后掌握、风险说明与 `ruleHints: { condition: string; action: DrivingAction; reason: string }[]`。

## Task T1：八关数据与安全决策规则

**Files:** Create scenarios.ts、decision.ts、tests/chapters/traffic/decision.test.ts；Modify view.ts。

**Interfaces:** Consumes DrivingAction、TaskAssessment；Produces 八条 ScenarioDefinition、evaluateDecision 和 assessDecision。

- [ ] 先写失败测试：八关分值之和 100；红灯继续行驶为 signal-violation；绿灯道路安全时 proceed-cautiously 正确；横穿行人继续行驶为 pedestrian-conflict；暴雨未降速或未保持距离为风险；感知异常 safe-stop-alert 正确。
- [ ] 补测试：重排题库不影响 ID 评估；两个声明安全动作均被接受；未知动作拒绝；无激光雷达配置不是本模块行人判定的失败条件。
- [ ] 运行 `npm.cmd run test -- tests/chapters/traffic/decision.test.ts`，确认评估接口尚未实现。
- [ ] 实现数据驱动规则和文案，safeActions 由场景安全条件明确声明，不按“选最慢按钮”推断。旧黄灯、学校、排队、救护车数据移至同文件的扩展题数组，不纳入主线分母。
- [ ] 测试绿；生成基于稳定 choiceId 的选项展示，去除 correctSlots 单正确项抽取；提交规则任务。

## Task T2：可解释的场景观察与结果

**Files:** Modify traffic-scene.ts、view.ts、chapter.css；Create tests/chapters/traffic/flow.test.ts。

**Interfaces:** Consumes ScenarioScene、DecisionOutcome；Produces 场景控制器四个播放接口及生命周期。

- [ ] 写失败状态测试：暂停时 observation/outcome 回调不结束；恢复只触发一次；dispose 后无回调；不同场景 ID 不走相同的行人特判。
- [ ] 复用信号灯和礼让行人，新增突然横穿、障碍物、暴雨和感知异常的低复杂度道具/覆盖层；检查 stopZ、制动位置与道具位置同属一个场景配置。
- [ ] 安全动作播放停车、减速、礼让或谨慎通过；风险动作在接触前停画面并显示冲突点、原因和安全做法，各风险不能共用一个与动作无关的片段。
- [ ] 替换原 2.3 秒自动继续与按索引行人处理；暂停保留剩余动画进度，不在恢复时一次补跑所有时间。
- [ ] 测试绿；浏览器逐关检查观察和至少一安全/风险结果，确认行人、障碍与雨天反馈；提交场景任务。

## Task T3：四步流程、首答成绩与安全报告

**Files:** Modify index.ts、decision.ts、view.ts、chapter.css；Create tests/chapters/traffic/scoring.test.ts。

**Interfaces:** Consumes T1/T2 和 ChapterContext；Produces setupTrafficChapter(host, ctx): ChapterController 与交通挑战 ChapterResult。

- [ ] 先写失败测试：八关首次全对 100；red-light 首错后纠正，其题 firstScore 仍 0、最终可掌握；同题重复点击不刷分；跳过 outcome/summary 不能进入下一关；浏览模式不改正式档案。
- [ ] 实现 ready→observe→decide→outcome→summary；风险反馈后允许重试，只有安全答案的结果和总结完成后才把该 task 记录为 mastered 并开放下一关。
- [ ] 每次实际作答调用 recordAttempt，correct 表示所选动作是否安全；首次答案与 firstScore 当场保存，但尚未完成知识总结时不标掌握。安全结果与总结完成后调用 markTaskMastered，不再制造一次作答，不改变 firstScore。
- [ ] 成果 score 为八题 firstScore 之和，maxScore 100；保存规则建议和风险解释，授予“安全驾驶挑战者”；所有题 mastered 后允许进入研发档案查看成果，未来 05 仍标未开放。
- [ ] 刷新恢复已提交成绩；未完成总结的题回到可继续观察/决策的步骤，不假定动画已播完。重开用于复习，正式成绩保留。
- [ ] 运行 `npm.cmd run test -- tests/chapters/traffic`、`npm.cmd run build`，桌面/触屏走完八关、错题重试、暂停退出和恢复；交付八个必做 ID 与报告字段给公共负责人。

## 模块交付标准

八关四步流程完整；安全/风险反馈与动作一致；首答成绩与掌握分离；暂停和复习正确；报告可以支撑未来驾驶规则卡，但不宣称已具备真实自动驾驶测试能力。

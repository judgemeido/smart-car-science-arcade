# 02 拆解汽车 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 保留原三步拆解，增加功能复习、13 项结构挑战与探索报告，本次包含分组归位。

**Architecture:** 教学内容与模型目标映射分开；learning-state 判定任务命中与问答，learning-view 显示过程。controller 在原玩法与结构挑战之间分发输入，vehicle-rig 仅负责模型动作。

**Tech Stack:** 沿用 TypeScript、Three.js、原生 DOM、Vitest 与 Playwright，不新增依赖。

**Spec:** [新设计第 5 节](../specs/2026-11-08-upper-primary-learning-design.md#5-02-拆解汽车)。

**Status:** 本章已实现并通过章内独立审查；最终视角修正的针对性单元、构建和浏览器已通过，整体检查与最后复审状态见 [实施记录](../../engineering/upper-primary-learning-progress.md)。浏览器用例先编写，由负责人串行验收 GREEN，本次省略浏览器 RED；最终相机回归另外取得了真实浏览器 RED/GREEN。

## Global Constraints

[总 Plan 的全部约束](./2026-11-08-upper-primary-learning-plan.md#global-constraints) 逐条适用。原 BatteryPack→ADAS→Cabin、分类、聚焦、开合、灯光与五秒动力故事保持可用。P3 不阻塞 P2 交付。

## Review Focus

- 网格命中需要识别正确祖先子节点，不能全部归到 ADAS。
- 两处悬架不能替代制动；重复点同一处不能增加不同目标数。
- 只有找到目标和理解功能都满足时才进入下一项。
- 毫米波和模型失败替代活动要标注学习方式，不能冒充真实模型命中。
- 归位取消后恢复旧状态，不能与原爆炸动画同时改同一位置。

## Task X1 / P1：原三任务功能复习

**Files:** Create `src/chapters/explore/learning-data.ts`、`learning-view.ts`、`tests/e2e/explore-learning.spec.ts`；Modify `src/chapters/explore/data.ts`、`view.ts`、`controller.ts`、`styles.css`、`docs/development/explore-content.md`。

**Interfaces:** Consumes S0 `ChoiceQuestion/evaluateChoice`。Produces `exploreReviewQuestions` 与 `exploreLearningTasks: readonly ExploreLearningTask[]`；每项含 `id/title/hint/targetKey/question`。Produces `renderExploreReview(host: HTMLElement, answers: Readonly<Record<string,string>>): void`。原三任务复习电池题直接引用同一任务的 question 对象，不复制答案。

- [x] 增加 E2E：原三步完成后可打开复习，三题错误显示解释、可纠正，关闭后仍能操作原模型；复习不推进 `mission-state`。
- 浏览器入口 RED 本次省略：并行章节不共用构建输出，最终由负责人串行构建和验收；相机恢复的诊断与边界修正另有 RED/GREEN 证据。
- [x] 转换 [02 内容包](../../content/2026-11-08-upper-primary/02-explore.json)，接入复习卡；所有选择经 S0 判断，未知选择不登记结果。
- [x] 修正 `powerflowStages[3].copy` 为“摄像头接收道路图像，雷达和激光雷达主动探测；不同设备把信息交给计算系统。”；其时间参数不变。
- [x] 重跑构建、新 E2E 及原 `explore-domain.spec.ts`，通过后更新指南与记录。

## Task X2 / P2：13 项部件识别与报告

**Files:** Create `src/chapters/explore/learning-targets.ts`、`learning-state.ts`、`tests/unit/explore/learning-targets.test.ts`、`learning-state.test.ts`；Modify learning-data/learning-view/controller/styles.css 与 `tests/e2e/explore-learning.spec.ts`。

**Interfaces:**

- Consumes `exploreLearningTasks`、S0 `evaluateChoice`，原模型网格的祖先名称链。
- Produces `ExploreTargetDefinition`（`kind/names/minDistinctTargets/requiredTargetGroups?/hotspotId?`）与 `exploreLearningTargets: Readonly<Record<string,ExploreTargetDefinition>>`，键为任务 targetKey。
- Produces `resolveLearningTargetName(ancestorNames: readonly string[], target: ExploreTargetDefinition): string | null`、`hasRequiredTargets(target: ExploreTargetDefinition, found: readonly string[]): boolean`；名称链从命中网格向根排列。
- Produces `ExploreLearningState`：当前任务索引、去重命中、选择记录、完成任务 ID、每项学习方式 `model | diagram`；`createExploreLearningState(): ExploreLearningState` 与 `reduceExploreLearning(state: ExploreLearningState, action: ExploreLearningAction, tasks: readonly ExploreLearningTask[], targets: Readonly<Record<string,ExploreTargetDefinition>>): ExploreLearningState`。
- action 为 `start/reset`、`pick {targetName,source}`、`answer {choiceId}`、`continue`；continue 仅在命中条件与正确回答都满足时生效。图文替代的 source 为 diagram。
- Produces `renderExploreLearning(host: HTMLElement, state: ExploreLearningState): void`，报告读取已完成 ID 与学习方式。

- [x] 写失败测试：前向镜头祖先链命中 `Front_camera_optic`；错误链返回 null；最近允许祖先优先。`found=[FrontSuspension,RearSuspension]` 不满足底盘，加入 Brakes 才满足；同一节点重复只算一次。
- [x] 测试未找到目标不能继续、答错不能继续、答对与目标齐备才完成、未知选择不变、连续 continue 不越过下一题；13 项分组无重复遗漏，真实节点映射存在，毫米波只对应教学热点。
- [x] 运行 `npm run test:unit -- tests/unit/explore/learning-targets.test.ts tests/unit/explore/learning-state.test.ts`，确认缺少新接口时失败。
- [x] 实现纯映射和状态接口；保留原拾取路径，只有结构挑战活动时走新的子节点匹配。挑战中抑制侧栏提前揭示目标名称，确认后再显示。
- [x] 提供键盘/触屏可选择的部件示意热点；毫米波用明确教学卡，不虚构 GLB 节点。模型失败时显示图文替代，报告标明来源；恢复模型不能再次增加完成数。
- [x] 增加 E2E：完成一组再切章返回；取消挑战后原分类/聚焦可用；原三任务状态不被新挑战修改；键盘替代与模型失败均能学习，报告正确区分方式。
- [x] 运行该单元测试、`npm run build`、`npm run test:e2e -- tests/e2e/explore-learning.spec.ts tests/e2e/explore-domain.spec.ts`，通过后记录交付。P2 完成报告不等待 X3。

## Task X3 / P3 可选：四步教学归位

**Files:** Create `src/chapters/explore/assembly-state.ts`、`tests/unit/explore/assembly-state.test.ts`；Modify learning-data/learning-view/controller/vehicle-rig 与 `tests/e2e/explore-learning.spec.ts`。

**Interfaces:** Produces `AssemblyGroupId = 'chassis' | 'power' | 'body' | 'sensors'`、有序 `teachingAssemblyGroups` 和 `AssemblyReturnState`（已归位组、当前动画组、进度）。Produces `createAssemblyReturnState(): AssemblyReturnState`、`reduceAssemblyReturn(state: AssemblyReturnState, action: 'next' | 'cancel' | 'reset'): AssemblyReturnState`、`stepAssemblyReturn(state: AssemblyReturnState, deltaSeconds: number): AssemblyReturnState`；每组动画 1 秒。

vehicle-rig 增加 `setTeachingAssemblyProgress(state: AssemblyReturnState): void` 和 `clearTeachingAssembly(): void`。开始时保存原爆炸状态，归位模式内暂停原全局爆炸变换写入；clear 只清理临时变换覆盖。取消时 controller 恢复进入前的爆炸状态，四组全部完成时将原爆炸状态设为合拢，完成后的车保持组装状态。

- [x] 写失败测试：必须按四组顺序，动画期间重复 next 无效；0.5 秒为半程、累计 1 秒归位；完成/取消后不再推进，负数/非有限时间拒绝。
- [x] 运行 `npm run test:unit -- tests/unit/explore/assembly-state.test.ts`，确认新接口尚未实现导致失败。
- [x] 从真实顶层装配建立四组映射，每个被演示装配只归属一组；完成映射核查后实现状态与 rig 展示，不新增精确拖放或工厂流程断言。
- [x] 增加 E2E：暂停/切章保留动画进度；取消后模型与进入前状态一致；完成后保持合拢，重新打开旧爆炸图仍可用；退出后无残留位置和重复事件。沿用 scope/animation loop，不另开未清理的 timer。
- [x] 运行单元测试、构建及 explore 新旧 E2E，通过后单独登记 P3，不合并进核心挑战计分。

## 02 完成条件

- [x] 原三任务可完整执行，13 项判定与报告按唯一状态生成。
- [x] 真实目标、组合目标、教学热点与降级图文分别验证。
- [x] 后续改题改 learning-data，改模型映射改 learning-targets，维护指南明确区分。

本计划只实施 02；用户已授权包含 P3 分组归位的实施与逐章本地提交，公共文件和 Git 索引归集成负责人。

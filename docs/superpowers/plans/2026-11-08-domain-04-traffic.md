# A04：道路游戏规则与表现分离 Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans。本计划只保留当前八题八分游戏。

**Goal:** 将答题、计分、关卡推进和道路运动独立，保留现有用户体验，并通过清晰的内部边界与开发文档让题库和小游戏更容易修改。

**Architecture:** data 管现有题库，rules 管纯状态与效果指令，simulation 管本章原运动，scenario-scene/presentation 管现有画面；控制器连接规则、场景、UI 与计时器。

**Tech Stack:** TypeScript、Three.js、Vitest、Playwright。

**Spec:** [当前范围设计](C:/Codex/citygame01/docs/superpowers/specs/2026-11-08-domain-learning-expansion-design.md)。

## Global Constraints

本轮只整理内部代码和开发文档，保留现有页面、内容、玩法、操作顺序、动画节奏与重置行为。全局不新增05/06、学习档案、门禁、新课程、开发者界面或用户内容编辑页面；不增加任务、题目或情境。原100分课程仅作为后续参考，不构成本计划的依赖或验收条件。

执行范围仅限 src/chapters/traffic、对应测试与 docs/development/traffic-content.md。八个现有 ID、顺序、stopZ、题目与反馈文案、正确答案、选项排列和每题1分不变；普通反馈2300ms、过街4.8s、过街后550ms不变；保留现有开始、继续、结算与重置流程。

## Review Focus

重复回答不加分；手动/定时继续不推进两次；只有两个既有行人场景答对进入过街；暂停保留剩余时间；最后一题正确结算。R1/R2 固定这些行为。

## Task R1：纯答题与流程

**Files:** Create rules.ts、tests/unit/traffic/rules.test.ts；Modify data.ts、controller.ts。

**Interfaces:** 每个选项增加稳定 choiceId，在排序前由情境 ID 和原始选项位置生成；保留 orderOptions 的视觉顺序。TrafficState 含 phase、scenarioIndex、score；phase 为 ready/driving/question/feedback/crossing/complete。`createTrafficState()`、`reduceTraffic(state, event, scenarios): { state; effects }`；event 为 start/arrive/answer/continue/crossing-complete/reset，answer 携带 choiceId；effects 为 schedule-continue(delayMs)、start-crossing(scenarioId)、show-result。未知 choiceId 拒绝且不消耗作答。

- [x] 写失败测试：八题全对8分；错误回答0分且仍能继续；未知答案不消费；重复回答只计一次；反馈/手动继续竞态只前进一次；最后一题进入complete；reset清零。
- [x] 写行人分支测试：pedestrians/green-pedestrians 答对→crossing；答错与其他题→feedback/2300ms；crossing-complete→feedback/550ms，重复完成不重复排程。
- [x] `npm run test:unit -- tests/unit/traffic/rules.test.ts` 先 FAIL，再实现最小状态/效果函数。
- [x] 测试 PASS；按钮只提供 choiceId，不再把 dataset.correct 当规则输入。

## Task R2：道路运动与展示

**Files:** Create simulation.ts、scenario-scene.ts、presentation.ts、tests/unit/traffic/simulation.test.ts；Modify controller.ts；保留 scene.ts/primitives.ts。

**Interfaces:** WorldState 在 simulation.ts 定义车辆位置、环境时间、两组过街进度与状态；`stepWorld(state, deltaSeconds, scenario): WorldState` 复制当前运动公式。`createScenarioPresentation(scene)` 提供 `apply(scenarioId)`；`renderTrafficUI(host, state, scenario, feedback)` 更新控件。控制器执行 R1 effects，使用既有 createPausableTimer。

- [x] 写失败测试：零 delta 不推进；过街累计4.8s完成；未处于过街不改变进度；负/非有限 delta 拒绝；车辆按当前公式到停点后不穿越停点。
- [x] 对应 test:unit 先 FAIL；原样抽出运动公式、道具按 ID 设置和题目/结算展示，避免规则状态与 UI 双份维护。
- [x] 测试 PASS，`npm run build` 通过；隐藏时不执行 stepWorld，计时器保留剩余时间。

## Task R3：完整八题与生命周期验收

**Files:** Create tests/e2e/traffic-domain.spec.ts。

- [x] 走完八题结算，包含答错、重复点选、两个行人情境、手动继续与自动继续交错；全对显示8/8。
- [x] 反馈和过街中切页再返回，不跳题、不补跑；缺 GLB 示意车可继续。
- [x] `npm run test:unit -- tests/unit/traffic`、`npm run build`、`npm run test:e2e -- traffic-domain` 通过，交付规则与场景边界。

## Task R4：道路题库与小游戏修改指引

**Files:** Create docs/development/traffic-content.md；文档反映 R1/R2 整理后的实际文件、导出名与字段，不新增产品入口。

- [x] 列出题库修改位置：src/chapters/traffic/data.ts 中八个既有情境的 ID、顺序、题目、选项、正确答案、反馈内容和 stopZ；说明 choiceId 与答案判断、orderOptions 与显示顺序的关系。以一个现有题目说明字段如何对应界面，整理期间不实际改题或增题。
- [x] 列出反馈与结算的修改位置：data.ts 中随题目变化的文本，以及 presentation.ts 中反馈/结算模板和显示格式；若固定文案仍在既有文件，指向真实位置，避免文档虚构字段或要求另做配置系统。
- [x] 列出场景道具和运动的修改位置：scenario-scene.ts 中按既有情境 ID 配置道具，scene.ts/primitives.ts 中现有场景与基础形状，simulation.ts 中车辆运动、停止与两组行人过街。说明题库 ID、道具映射与停点的对应关系，保留现有模型与降级行为。
- [x] 列出计分和流程规则的位置：rules.ts 中每题1分、错题0分、重复回答防护、八题结算与重置；普通反馈2300ms、过街后550ms的排程，以及 simulation.ts 的4.8s过街进度。记录整理后实际常量名、单位与调用位置，保持当前数值、玩法与节奏。
- [x] 写明修改后的检查路径：规则单元测试、八题8/8结算、答错与重复回答、两个既有行人情境、手动/自动继续竞态、暂停恢复和重置。复用 R1–R3 验收，不增加新任务或情境；对照最终代码核对文档路径和示例。

原100分课程仅保留为后续参考；当前交付与验收只面向既有八题八分小游戏，不依赖课程数据、学习档案、门禁或新章节。

# A02：结构任务与模型动作分离 Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans。遵守本章所有权和主计划依赖。

**Goal:** 将三步拆解任务、动力故事和模型动作从大型控制器拆出，保留现有玩法。

**Architecture:** mission-state 和 powerflow-state 为纯状态；vehicle-rig 与 powerflow-scene 管 Three；mission 管面板，controller 负责连接。

**Tech Stack:** TypeScript、Three.js、Vitest、Playwright。

**Spec:** [当前内部整理设计第 2–4 节](C:/Codex/citygame01/docs/superpowers/specs/2026-11-08-domain-learning-expansion-design.md)。

## Global Constraints

仅修改 chapters/explore、tests/unit/explore、独立 E2E与docs/development/explore-content.md；不改模型资产或公共 app/shared。用户体验保持原样，任务仍为 BatteryPack、ADAS、Cabin 三步，任务顺序、文案、参观路径、界面、开门、尾门、车灯、分类、爆炸、聚焦与动力展示不变。本轮仅整理内部代码并明确维护位置，不新增学习任务、玩法、计分、05/06、学习档案、门禁、新课程、最终用户编辑面板或开发者界面。

## 开发文档：内容修改位置与职责边界

以下作为维护者编辑源码时的定位指引，本轮保留现有资料、任务与时序，不增加产品内编辑入口。

| 后续维护内容 | 具体文件与数据 | 本轮保持的边界 |
|---|---|---|
| 现有三任务的目标和文案 | src/chapters/explore/data.ts 的 disassemblyTasks；target/label/title/copy | target 必须匹配 EV_SUV 下顶层装配名；label/title/copy 只改变显示文字。本轮仍为 BatteryPack → ADAS → Cabin |
| 系统介绍、零件说明和分类 | data.ts 的 focusCopy、assemblyInfo、partCategoryLabels、partCategoryMap；focus.ts 的模型分类辅助函数 | 内容数据不保存任务进度；任务是否匹配由 mission-state.ts 判断，mission.ts 只渲染状态及既有文案 |
| 模型资源和节点映射 | 当前 controller.ts 的 loadModel()/prepareExplosionRigs()，X2 提取后的 vehicle-rig.ts；data.ts 的 fallbackExplodeVectors；模型路径 /assets/yaojing-s9-optimized.glb | 保留 EV_SUV、Door_FL/RL/FR/RR、Tailgate 等节点约定及原拆解向量；本轮不替换模型或改变布局 |
| 动力故事文案和阶段时间 | data.ts 的 powerflowStages；X2 新建的 powerflow-state.ts | 阶段仍在 0/1.2/2.55/3.45 秒切换，整体 5 秒；纯状态决定阶段，powerflow-scene.ts 只更新画面 |
| 自动旋转恢复与离开行为 | controller.ts 的既有 shared 可暂停计时器及 X2 的 deactivate 动作 | 恢复间隔仍为 2500ms；离开时结束正在播放的动力故事并标记已播放，不改变暂停、重试或重播体验 |
| 页面布局、按钮与任务面板 | view.ts、styles.css、mission.ts；controller.ts 负责接线 | UI 不自行判定任务正确性，不定义任务 target 或动力时序；本轮不增加编辑控件 |

## Review Focus

误点/重复拾取/未开始/完成后不越界；关闭爆炸图退出任务；离开章节结束正在播放的动力故事；模型失败可重试；2500ms 自动旋转恢复仍受暂停控制。

## Task X1：三任务纯状态

**Files:** Create mission-state.ts、tests/unit/explore/mission-state.test.ts；Modify controller.ts、mission.ts（必要类型接线）；沿用 data.ts 的 DisassemblyTask。

**Interfaces:** `MissionState = { index: number; active: boolean }`；MissionAction 为 start/pick/exit/reset/close-exploded，pick 携带 assemblyName。导出 `createMissionState(): MissionState`、`reduceMission(state, action, tasks: readonly DisassemblyTask[]): { state: MissionState; verdict: 'none' | 'correct' | 'incorrect' | 'complete' }`。

- [x] 写失败测试：按三个 target 完成；ADAS 在首题不推进；未开始点选无效；同一目标重复不推进；最终 index=3 后点选不越界；exit/reset/close-exploded 清零。
- [x] `npm run test:unit -- tests/unit/explore/mission-state.test.ts` 应因缺接口 FAIL。
- [x] 实现状态函数；拾取层仅传装配名，面板消费状态，不自行判断正确性。
- [x] 同命令 PASS，保留现有 data 导出与任务面板文案。

## Task X2：动力故事和车辆动作

**Files:** Create powerflow-state.ts、powerflow-scene.ts、vehicle-rig.ts、tests/unit/explore/powerflow-state.test.ts；Modify controller.ts；Read scene.ts/data.ts。

**Interfaces:** PowerflowState 含 playing/played/elapsedSeconds/stageIndex；`createPowerflowState()`、`reducePowerflow(state, action, stages)`；action 为 start/replay/skip/deactivate/tick，tick 含 deltaSeconds。`createVehicleRig(scene: ReturnType<typeof createScene>, scope)` 管开合、灯光、爆炸和更新；`createPowerflowScene(scene, scope)` 消费动力状态更新效果。具体阶段边界复制当前 powerflowStages，整体 5 秒。

- [x] 写失败测试：阶段在0/1.2/2.55/3.45秒切换；5秒完成；skip立即结束；replay从头；deactivate结束并played=true；非有限/负delta拒绝。
- [x] 运行对应 test:unit，先 FAIL，再实现状态函数；把已有 Three 动作原样抽取，不重算模型布局。
- [x] 同测试 PASS；旋转恢复继续使用 shared 可暂停计时器，2500ms 不变。
- [x] `npm run build` 通过，controller 保留装配职责、资源失败重试和 host 范围。

## Task X3：原功能与完整任务验收

**Files:** Create tests/e2e/explore-domain.spec.ts、docs/development/explore-content.md；保留既有故障注入 E2E。

- [x] 核对开门/尾门/灯光、分类、聚焦、爆炸、重置、动力 skip/replay，以及离开结束动力故事。
- [x] 三步任务全部完成一次；误点、退出、关闭爆炸图、重新开始均与当前一致。纯状态全路径由 X1 自动测试固定；真实模型点选另做浏览器验收。
- [x] `npm run test:unit -- tests/unit/explore`、`npm run build`、`npm run test:e2e -- explore-domain` 通过。
- [x] 将上方修改位置表按最终实际文件核对后写入docs/development/explore-content.md，交付规则、动作、控制器边界和验证证据；指引只说明源码修改位置，不形成产品内编辑功能或新增玩法，不修改全局样式导入。

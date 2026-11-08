# A03：雷达实验状态与画面分离 Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans。仅执行结构与现有实验拆分。

**Goal:** 独立测量和扫描状态，保留现有用户体验，并通过清晰的内部边界与开发文档让雷达内容和实验参数更容易修改。

**Architecture:** measurement/experiment-state 纯计算，interaction 管输入，model-rig/scan-animation 将状态映射到现有场景。

**Tech Stack:** TypeScript、Three.js、Vitest、Playwright。

**Spec:** [当前范围设计](C:/Codex/citygame01/docs/superpowers/specs/2026-11-08-domain-learning-expansion-design.md)。

## Global Constraints

本轮只整理内部代码和开发文档，保留现有页面、内容、玩法、操作顺序、动画节奏与重置行为。全局不新增05/06、学习档案、门禁、新课程、开发者界面或用户内容编辑页面；不增加任务、情境、挑战或天气测验。原100分课程仅作为后续参考，不构成本计划的依赖或验收条件。

执行范围仅限 src/chapters/lidar、对应测试与 docs/development/lidar-content.md；保留 8 部件、4 步说明、5–80m 滑块、720 点演示、三个真实 DAE 与许可。重置保留当前所选距离和滑块值，恢复 assembly 模式、关闭扫描、回到第一步、清空零件选择并恢复初始相机视角；默认距离只用于首次创建实验状态。旧 setupLidarExplorer 兼容由集成负责人保留。

## Review Focus

自动步骤 1.3 秒边界；手选步骤保持；重启扫描从第一步开始；60m → reset → 距离与滑块仍为 60m；后台不补跑；缺 DAE 的降级提示持续，概念演示可用。

## Task L1：测量和实验纯状态

**Files:** Create measurement.ts、experiment-state.ts、tests/unit/lidar/{measurement,experiment-state}.test.ts；Modify controller.ts。

**Interfaces:** `roundTripNanoseconds(distanceMeters: number): number` 使用光速 299792458m/s；ExperimentState 含 mode、scanActive、stepIndex、stepElapsedSeconds、manualStepSelection、distanceMeters、selectedPartId。`createExperimentState()`、`reduceExperiment(state, action): ExperimentState`；action 为 mode/scan/step/distance/select-part/reset/tick；静态步骤与部件仍从 data.ts 获取。reset 保留输入状态的 distanceMeters，将 mode 设为 assembly、scanActive 设为 false、stepIndex 与 stepElapsedSeconds 设为 0、manualStepSelection 设为 false、selectedPartId 设为 null；相机恢复由 L2 表现层执行。

- [x] 写失败测试：60m 往返时间约 400.277ns；负/非有限距离拒绝；距离动作只接受现有 5–80m；自动步骤在 1.3s 进入下一步，第四步回第一步；手选后 tick 不切步骤；关闭再启动扫描从第一步开始。
- [x] 补 reset 单元用例：先选择 60m、切换模式、开启扫描并手选步骤与零件，再派发 reset；断言 distanceMeters 仍为 60，mode=assembly、scanActive=false、stepIndex=0、stepElapsedSeconds=0、manualStepSelection=false、selectedPartId=null，测量仍约 400.277ns；不得通过重新调用 createExperimentState() 将距离恢复到默认值。
- [x] `npm run test:unit -- tests/unit/lidar`，确认新接口缺失 FAIL。
- [x] 实现纯函数并将原测量/步骤状态替换为单一状态来源；生命周期仅控制 tick 是否执行。
- [x] 同测试 PASS；保持界面显示格式、滑块与部件信息。

## Task L2：输入、模型与扫描表现

**Files:** Create interaction.ts、model-rig.ts、scan-animation.ts；Modify controller.ts；保留 model.ts/scene.ts/concept.ts/scan-scene.ts。

**Interfaces:** `bindLidarInteraction(host, scene, dispatch, scope): void` 将控件和拾取转换为 L1 action；`createModelRig(scene, scope)` 提供 `apply(state)` 与 `resetCamera(): void`，后者保持现有 `controls.reset()` 行为；`createScanAnimation(scene, scanObjects)` 提供 `update(state, deltaSeconds)`。state 类型只来自 L1；所有清理归入既有 scope。

- [x] 原样提取模式、热点、拆解偏移、相机策略及扫描几何更新，控制器不再保存第二份实验状态。
- [x] reset 输入在应用 L1 重置状态后调用 model-rig.resetCamera()；滑块和距离文案继续读取保留的 distanceMeters，不覆盖当前滑块值。
- [x] 保留模型加载版本保护、取消与迟到资源释放；assetStatus 独立于实验文案，不被模式切换覆盖。
- [x] `npm run build` 通过，DOM 查询仅在 host 内；旧返回类型和可调用 disposer 由兼容测试保护。

## Task L3：浏览器接线与恢复

**Files:** Create tests/e2e/lidar-domain.spec.ts；复用既有 chapters.spec.ts 故障/暂停检查。

- [x] 验证三个模式、部件选择、滑块60m显示约400ns、手选步骤与扫描重启。
- [x] 浏览器验收 60m → reset → 仍为 60m：把滑块设为 60m，切换结构模式、开启扫描、手选步骤与零件并调整相机后点击重置；断言滑块 value 为 "60"、距离文案仍显示 60m、往返时间仍约 400ns，assembly 按钮选中、扫描关闭、第一步选中、零件选择清空，且相机恢复初始视角。
- [x] 扫描中切 history 再返回，步骤不补跑；缺 DAE 后模式/扫描操作保留降级提示。
- [x] `npm run test:unit -- tests/unit/lidar`、`npm run build`、`npm run test:e2e -- lidar-domain` 通过。
- [x] 交付纯实验、输入、场景效果的边界与检查证据。

## Task L4：雷达内容修改指引

**Files:** Create docs/development/lidar-content.md；文档反映 L1/L2 整理后的实际文件、导出名与字段，不新增产品入口。

- [x] 列出内容修改位置：src/chapters/lidar/data.ts 的四步说明、部件名称与说明；固定控件文案指向实际 view/controller 中保留的模板位置。用一个现有步骤或部件演示如何修改文字，保持现有内容与部件数量不变。
- [x] 列出部件配置与表现的对应关系：data.ts 中部件 ID/内容，model-rig.ts 中热点、拆解偏移与拾取映射，以及既有 model.ts/scene.ts 中真实模型加载位置；说明 ID 必须一致，模型与许可引用保持有效。
- [x] 列出测量与演示参数的位置、单位和当前值：measurement.ts 的往返时间公式与光速常量；experiment-state.ts 的距离范围、首次默认距离、1.3s 步骤节奏及重置保留距离规则；scan-animation.ts/scan-scene.ts 中实际承载的扫描表现参数与720点配置。区分物理量与视觉参数，整理时不改数值或显示格式。
- [x] 写明修改后的检查路径：纯测量与状态测试、60m往返时间显示、扫描/手选步骤、60m重置保留距离及模型降级检查；复用 L1–L3 的验收，不为文档另增游戏任务或测试情境。
- [x] 对照最终代码核对所有路径、字段和示例；该指引供开发者改文件使用，不制作编辑页面，不要求任何后续课程功能才能使用。

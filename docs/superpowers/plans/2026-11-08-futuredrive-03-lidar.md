# 03 LiDAR：智能感知实验 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有激光雷达展品扩展为扫描、测距和局限三个实验，产生可复习的传感器实验记录。

**Architecture:** 保留硬件展品和原理演示，把目标位置、距离与天气示意放进同一数据模型。实验规则独立测试，章节控制器负责开始/暂停、答题和档案。

**Tech Stack:** Three.js、ColladaLoader、OrbitControls、原生 DOM、TypeScript、Vitest。

**Spec:** [设计稿第 6 节及全局要求](C:/Codex/citygame01/docs/superpowers/specs/2026-11-08-futuredrive-learning-route-design.md)；[公共接口](C:/Codex/citygame01/docs/superpowers/plans/2026-11-08-futuredrive-plan.md)。

## Global Constraints

- 只编辑 `C:/Codex/citygame01/src/chapters/lidar/` 和 `tests/chapters/lidar/`；保留原 DAE、许可、部件说明和结构视图。
- 点云是教学示意，环境退化不是实测识别率；不能把 GNSS 当障碍物探测器。
- 新测距任务用统一物理坐标，渲染缩放不改变显示距离。
- 本模块不新增数值总分；报告以实验完成和正确测量记录为主。
- 遵守公共任务、模式、生命周期和存储要求。

## Review Focus

1. 目标视觉缩放或侧向移动：距离必须从真实演示坐标重算，不能沿用旧滑块值。
2. 距离恰好 10/20 m：区间边界一致，不能两个选项都正确。
3. 随机轮次、重试和刷新：同一个 seed/轮次重现同一题，不在重试时换题。
4. 暂停扫描或切页：保留已生成点云，不清空目标或继续推进。
5. 天气对比、点云目标点选与知识卡：正确标示不确定、教学参数和传感器分工。

## 文件与接口

S0 已搬迁 lidar-explorer.ts 并创建 view.ts/index.ts。03 创建 data.ts、experiments.ts、chapter.css；测试 measurement.test.ts、distance-round.test.ts、completion.test.ts。

data.ts 定义 `DemoTarget = { id: string; kind: 'car' | 'pedestrian' | 'tree' | 'barrier'; position: [number, number, number] }`，物理坐标单位 m；传感器位置同样为三维米坐标。天气类型为 `WeatherId = 'clear' | 'rain' | 'fog'`。

experiments.ts 导出：

- `measureDistance(origin: [number, number, number], target: DemoTarget): number`：欧氏距离。
- `classifyDistance(meters: number): 'near' | 'middle' | 'far'`：`[0,10)` / `[10,20)` / `[20,40]`，非有限或超出演示范围输入拒绝。
- `createDistanceRound(seed: number, roundIndex: number): DistanceRound`：从 5/8/12/16/20/30 m 选三个不同距离的目标，有种子、可重现；DistanceRound 含 seed、roundIndex、targets 和 nearestTargetId。
- `assessDistanceAnswer(round: DistanceRound, targetId: string, intervalId: string): TaskAssessment`：最近目标和所属区间同时正确才 correct，score/maxScore 为 0/0。
- `assessLimits(seenWeather: WeatherId[], answers: Record<string, string>): TaskAssessment`：看过三种天气且三问全对才 correct。

硬件/演示控制器增加 `setScanPaused(paused: boolean)`、`setTargets(targets: DemoTarget[])`、`setWeather(weather: WeatherId)`、`setDistanceAnswersVisible(visible: boolean)` 和 `onTargetSelect(handler: (target: DemoTarget) => void): () => void`；已有 setMode、setScan 和部件选择保留。暂停冻结扫描推进，不等同于 setScan(false) 清除演示层。

必做 ID：`lidar.scan`、`lidar.distance.1`、`lidar.distance.2`、`lidar.distance.3`、`lidar.limits`。报告把三个 distance 记录聚合为一个实验，页面进度为实验 0/3–3/3。

## Task L1：四目标扫描与真实演示距离

**Files:** Modify lidar-explorer.ts、view.ts；Create data.ts、experiments.ts、tests/chapters/lidar/measurement.test.ts。

**Interfaces:** Consumes DemoTarget；Produces measureDistance、classifyDistance 和目标/暂停接口。

- [ ] 先写失败测试：坐标 3/4/0 得距离 5；10 m 属于 middle、20 m 属于 far；NaN、负距离和超出 40 的挑战区间输入拒绝；缩放显示对象不改变物理计算。
- [ ] 运行 `npm.cmd run test -- tests/chapters/lidar/measurement.test.ts`，确认尚未实现的接口导致失败。
- [ ] 生成汽车、行人、树、路障的低复杂度模型和对应点云；目标 metadata 与点云均关联 targetId，避免只能拾取硬件部件。
- [ ] 实现扫描、暂停/恢复、旋转、目标选择和距离展示；硬件展品和距离滑块自由实验继续可用，新增目标实验采用目标自身坐标。
- [ ] 测试绿；浏览器确认点云逐渐形成、暂停保留结果、各目标距离一致；提交本任务。

## Task L2：三个可重复测距挑战

**Files:** Modify experiments.ts、index.ts、view.ts、chapter.css；Create tests/chapters/lidar/distance-round.test.ts。

**Interfaces:** Produces createDistanceRound、assessDistanceAnswer；Consumes ChapterContext 和 L1。

- [ ] 先写失败测试：相同 seed/index 得同题；三距离互异且最近目标唯一；相邻轮次记录独立；正确最近目标但区间错不能掌握；重试不换题。
- [ ] 实现 5/12/20 m 教学例和三轮变化题，初次生成 seed 后持久化在任务 evidence；已提交轮次刷新后从 evidence 恢复，不重新随机出题。
- [ ] 题目模式只选目标、不显示距离，提交后再展示测量值与解释；连击只显示鼓励，纠错允许继续且不记录额外积分。
- [ ] 三轮各写对应必做 taskId，正确答案记录后 markTaskMastered；实验视图按三轮最终正确判完成，浏览模式只练习。
- [ ] 测试绿并构建通过；触屏完成目标与区间选择，验证 10/20 m 边界和中途刷新；提交本任务。

## Task L3：天气局限、知识卡和实验记录

**Files:** Modify data.ts、experiments.ts、lidar-explorer.ts、index.ts、view.ts、chapter.css；Create tests/chapters/lidar/completion.test.ts。

**Interfaces:** Consumes 公共 SensorId；Produces assessLimits 与包含环境观察、seed、测量值、正确记录和传感器分工的 ChapterResult。

- [ ] 先写失败测试：只看两种天气不完成；三问任一未正确不完成；五个必做 taskId 全掌握才完整报告；重复提交不新增成果。
- [ ] 生成确定性的三种天气示意点云，可调整示意采样和噪声，但显式标注为教学模型；不显示未经来源支持的“真实准确率”。
- [ ] 显示六类传感器卡，说明定位与环境测量的区别；三问覆盖天气影响、异常时安全停车/降速的场景判断、多传感器配合。
- [ ] 完成扫描操作和观察提交后记录 lidar.scan 并 markTaskMastered；三种天气与三问正确提交后记录 lidar.limits 并 markTaskMastered；满足所有任务后生成“传感器实验记录”，score/maxScore 为 0/0。
- [ ] 扫描/天气/挑战中切页暂停并恢复，dispose 清理订阅；运行 `npm.cmd run test -- tests/chapters/lidar`、`npm.cmd run build`，复核原硬件各视图和许可入口。
- [ ] 交付源代码、测试和五个必做 ID，由公共负责人接入 04 解锁。

## 模块交付标准

三个实验可完整操作和纠错；画面与距离一致；目标和天气可复现；报告可恢复；原 LiDAR 结构展品、许可和示意说明保留。

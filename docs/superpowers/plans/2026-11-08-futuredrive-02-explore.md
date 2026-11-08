# 02 Explore：汽车结构任务 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把现有三步装配点击升级成三个任务组、13 项结构识别和一份探索报告，并增加可选引导组装。

**Architecture:** 保留搬迁后的 3D 模型控制器，任务用稳定 targetId 与真实节点/祖先集合匹配。模型提供点选事实，任务规则决定是否正确，统一档案记录成果。

**Tech Stack:** Three.js、GLTFLoader、OrbitControls、原生 DOM、TypeScript、Vitest。

**Spec:** [设计稿第 5 节及全局要求](C:/Codex/citygame01/docs/superpowers/specs/2026-11-08-futuredrive-learning-route-design.md)；[公共接口](C:/Codex/citygame01/docs/superpowers/plans/2026-11-08-futuredrive-plan.md)。

## Global Constraints

- 只编辑 `C:/Codex/citygame01/src/chapters/explore/` 和 `tests/chapters/explore/`；读取当前优化 GLB，不覆盖原模型文件。
- 保留开门、尾门、车灯、聚焦、分类、动力演示、爆炸图和自由观察。
- 三组共 13 个必做目标；原有 3/3 文案和进度改为由数据生成。
- 毫米波雷达新增可点选教学示意件/热点，明确标注，不称为原模型真实配置。
- 组装是可选增强任务，不阻塞 13 项识别后的解锁。
- 全部遵守公共模式、存储、生命周期和报告接口。

## Review Focus

1. 命中部件内部网格而不是顶层装配：能识别电机、传动与单个摄像头。
2. 指定节点缺失：给出说明/可用教学示意，不能让任务永久无法完成。
3. 任务中已有信息卡和悬浮名称：在选择正确前不泄露答案。
4. 拆解时筛选隐藏目标或切换观察模式：开始任务恢复可完成的目标集合。
5. 分类/退出/重试和重复拾取：报告不重复记录，原功能恢复，任务数不写死。

## 文件与接口

S0 已搬迁 model-explorer.ts，创建 view.ts/index.ts。02 创建 targets.ts、tasks.ts、chapter.css；测试 matcher.test.ts、progress.test.ts、assembly.test.ts。

`PartSelection` 定义在 model-explorer.ts：`{ nodeName: string; assemblyName: string; ancestorNames: string[] }`。模型控制器除公共生命周期外提供 `setExploded(open: boolean)`、`reset()`、`setAnswerVisibility(visible: boolean)`、`setLearningTargets(targetIds: string[])`、`onPartSelect(handler: (pick: PartSelection) => void): () => void`。

targets.ts 定义 `PartTarget`：`id`、`group: 'power' | 'structure' | 'sensor'`、中文名称、功能、提示、`nodeNames: string[]`、`nodePrefixes: string[]`、可选 `sensorId: SensorId`、`isTeachingProxy: boolean`。匹配检查叶节点及其祖先，前缀匹配必须是对应目标声明的前缀。

| 目标 ID 后缀 | 对应模型节点/集合 | 题型 |
|---|---|---|
| power.battery | BatteryPack | 点击后选择储能/供电作用 |
| power.motor | FrontEaxle_Motor / RearEaxle_Motor | 点击后选择电能转成转动 |
| power.wheel | Wheel_FL/FR/RL/RR | 点击后选择轮胎与路面作用 |
| power.transmission | FrontEaxle_ReductionDifferential / RearEaxle_ReductionDifferential | 点击后选择传递/调整驱动力 |
| structure.body | BodyStructure | 点选结构后揭示 |
| structure.chassis | Brakes + FrontSuspension + RearSuspension + Wheel_* 的底盘集合 | 点选组合中的结构后揭示，说明它不是单一部件 |
| structure.suspension | FrontSuspension / RearSuspension | 点选后揭示 |
| structure.wheel | Wheel_FL/FR/RL/RR | 独立结构任务记录 |
| sensor.front-camera | Front_camera_optic | 功能提示找设备 |
| sensor.surround-camera | Left_camera_optic / Right_camera_optic / Rear_camera_optic | 功能提示找设备 |
| sensor.lidar | Roof_lidar_housing / Lidar_optical_window | 功能提示找设备 |
| sensor.radar | 新增 `Teaching_mmwave_radar`，位于车辆前部并标注教学示意 | 功能提示找设备 |
| sensor.ultrasonic | Ultrasonic_F_ 前缀 | 功能提示找设备 |

13 个必做 taskId 为 `explore.` + 上表后缀；可选 taskId 为 `explore.assembly`。tasks.ts 导出 `matchesPart(target: PartTarget, pick: PartSelection): boolean`、`assessPartTask(targetId: string, pick: PartSelection, functionChoiceId?: string): TaskAssessment`。识别记录 score/maxScore 均为 0，correct 表示完成；动力组必须功能题也正确。

## Task E1：节点级拾取与目标规则

**Files:** Modify model-explorer.ts；Create targets.ts、tasks.ts、tests/chapters/explore/matcher.test.ts。

**Interfaces:** Consumes PartSelection、TaskAssessment、SensorId；Produces 模型点选接口、目标目录和两个判定函数。

- [ ] 先写失败测试：电机内部 mesh 的祖先能匹配 motor；选 ADAS 内摄像头不能当 lidar；未知节点不正确；超声波前缀匹配；动力功能题答错不完成；教学雷达仅匹配自身声明节点。
- [ ] 运行 `npm.cmd run test -- tests/chapters/explore/matcher.test.ts`，确认目标匹配接口尚未实现。
- [ ] 实现目标目录与拾取回调，保留 leaf/ancestor 信息；在原模型上添加有说明的毫米波示意热点，不改 GLB；加载后核对目标集合可用性。
- [ ] 任务模式隐藏答案名称和旧信息卡；正确后才展示功能。缺节点显示可用替代示意/说明，不能无提示卡住。
- [ ] 测试绿；浏览器核对 13 项可选中、原装配信息卡仍在自由观察可用；提交目标与模型变更。

## Task E2：三个任务组与探索报告

**Files:** Modify index.ts、view.ts、tasks.ts、chapter.css；Create tests/chapters/explore/progress.test.ts。

**Interfaces:** Consumes E1、ChapterContext；Produces `setupExploreChapter(host, ctx): ChapterController` 和包含 13 项名称/功能/示意标记/完成记录的 ChapterResult。

- [ ] 先写失败测试：只有旧三组点击不能完成本阶段；13 个必做项目全部完成才通过；重复拾取不重复新增报告；不同任务中的 wheel 独立记录；误点与错误功能答案不能推进。
- [ ] 实现当前任务组、目标提示、功能题、动态进度和纠错；实际作答记录 recordAttempt，满足该目标的点选/功能题要求后 markTaskMastered。开始任务恢复全部所需部件，退出后恢复自由观察。
- [ ] 所有必做 taskId mastered 后写“汽车结构探索报告”，score/maxScore 为 0/0，由公共 UI 显示完成数量；记录教学雷达身份。
- [ ] 确保 setActive 暂停模型和任务动画，dispose 清除点选订阅；返回从已提交任务恢复。
- [ ] 运行 `npm.cmd run test -- tests/chapters/explore`、`npm.cmd run build`；桌面与触屏完成三组任务，验证不泄露答案及各旧交互功能。
- [ ] 提交并交公共负责人登记 13 个必做 ID，不改公共文件。

## Task E3：可选引导式重新组装

**Files:** Modify tasks.ts、model-explorer.ts、view.ts、index.ts、chapter.css；Create tests/chapters/explore/assembly.test.ts。

**Interfaces:** Produces `nextAssemblyStep(completed: string[], selected: string): { accepted: boolean; nextIndex: number }`，组 ID 固定为 `chassis, power, body, sensors`；模型提供按组归位动画。

- [ ] 先写失败测试：只能按四组顺序推进；重复已完成组不推进；错误组不推进；完成可选任务不改变 13 项必做判定。
- [ ] 实现四步选择与归位动画，正确组归位后才允许下一组；暂停/退出不遗留动画回调。
- [ ] 四步完成后记录 `explore.assembly` 并 markTaskMastered，由公共负责人登记为可选 ID；已生成正式报告继续保留原成绩，新增组装信息可在可选成果视图读取，不替换首答记录。
- [ ] 测试绿并构建通过；验证触屏选择、误选、重开和中途离开，提交增强任务。

## 模块交付标准

13 项识别与功能题可完成，结构报告可恢复且标注示意；旧模型交互保留；可选组装可独立验收，不阻塞主路线。

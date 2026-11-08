# 03 感知世界 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让学生通过距离比较、多目标点云和天气对比理解激光测距与传感器局限。

**Architecture:** 保留旧 experiment-state/measurement/scan-animation；新教学数据、米制目标与学习状态独立。learning-world 用相同米制数据画目标和点云，learning-view 显示题目，controller 连接并管理生命周期。

**Tech Stack:** 沿用 TypeScript、Three.js、原生 DOM、Vitest 与 Playwright，不新增依赖。

**Spec:** [新设计第 6 节](../specs/2026-11-08-upper-primary-learning-design.md#6-03-感知世界)。

## Global Constraints

[总 Plan 的全部约束](./2026-11-08-upper-primary-learning-plan.md#global-constraints) 逐条适用。保留原三模式、四步、1.3 秒节奏、5–80 米滑块和重置保留距离。新目标、距离和雨雾都是教学示意。

## Review Focus

- 目标大小/场景缩放不改变米制答案；10 米与 20 米只落入一档。
- 提交前题面、辅助文字与标签不泄露精确距离。
- 点云示意不被描述为真实识别结果，天气不显示虚构性能指标。
- 同一布局切换天气，不靠换目标位置制造感知差异。
- 切章、重置与模型失败不影响旧雷达状态，不遗留新 GPU 资源。

## Task L1 / P1：原理引导与传感器卡

**Files:** Create `src/chapters/lidar/learning-data.ts`、`learning-view.ts`、`tests/e2e/lidar-learning.spec.ts`；Modify `src/chapters/lidar/data.ts`、`view.ts`、`controller.ts`、`styles.css`、`docs/development/lidar-content.md`。

**Interfaces:** Consumes S0 `ChoiceQuestion` 和现有 `roundTripNanoseconds(distanceMeters: number): number`。Produces `lidarLearningContent: LidarLearningContent`（步骤/部件文案、引导、距离轮次、天气内容、传感器卡）、`renderLidarLearningGuide(host: HTMLElement, content: LidarLearningContent): void`。

- [ ] 添加 E2E：学生可打开实验引导与传感器卡；设置 20/60 米分别显示约 133.4/400.3 ns；60 米时原重置仍保留距离；GNSS 卡说明定位不能识别行人。
- [ ] 构建并运行 `npm run test:e2e -- tests/e2e/lidar-learning.spec.ts`，确认新学习区尚不存在时失败。
- [ ] 从 [03 内容包](../../content/2026-11-08-upper-primary/03-lidar.json) 转换有类型的数据；低龄化说明保留原 part ID、mode 与时间参数，显示值继续调用旧测距函数。
- [ ] 接入学习入口、引导和卡片，使用原风格及清晰字号；不让“扫描四目标”文案提前宣称尚未实现的能力。
- [ ] 重跑构建、新 E2E 和 `lidar-domain.spec.ts`，通过后更新指南与记录。

## Task L2 / P2：多目标与三轮距离挑战

**Files:** Create `src/chapters/lidar/learning-measurement.ts`、`learning-state.ts`、`learning-world.ts`、`tests/unit/lidar/learning-measurement.test.ts`、`learning-state.test.ts`；Modify learning-data/learning-view/controller/styles.css 与 `tests/e2e/lidar-learning.spec.ts`。

**Interfaces:**

- learning-data 定义 `PreparedDistanceRound`（id、目标 id/label/distanceMeters、正确目标/区间 ID）、`DistanceRange`（id/minMeters/maxMeters/maxInclusive）；保留内容包三轮数值与全局唯一目标 ID。
- learning-measurement 生产 `MeterPoint = {x:number;y:number;z:number}`、`MeterTarget = {id:string;label:string;positionMeters:MeterPoint}`、`createDistanceTargets(round: PreparedDistanceRound): readonly MeterTarget[]`、`getTargetDistanceMeters(target: MeterTarget, origin: MeterPoint): number`、`findDistanceRange(value: number, ranges: readonly DistanceRange[]): string | null`。
- 三轮目标按 -20/0/+20 度放置，传感器参考原点为 `{x:0,y:0,z:0}`，从准备距离生成米制位置；画面和答案都读取这些生成位置，不再次按画面比例计算。
- learning-state 生产 `LidarLearningState`（roundIndex、所选目标/区间、提交结果、已掌握轮次、所选知识卡 ID）、`createLidarLearningState(): LidarLearningState` 与 `reduceLidarLearning(state: LidarLearningState, action: LidarLearningAction, content: LidarLearningContent): LidarLearningState`；action 为 `select-target {id}`、`select-range {id}`、`select-sensor {id}`、`submit`、`continue`、`reset`。未知知识卡 ID 不改变记录。
- learning-world 生产 `createLidarLearningWorld(parent: THREE.Group, scope: ReturnType<typeof createScope>): LidarLearningWorld`；返回接口含 `setTargets(targets: readonly MeterTarget[]): void`、`setVisible(value: boolean): void`、`setScanRunning(value: boolean): void`、`update(deltaSeconds: number): void`。DOM 列表选择与场景拾取都发送同一个 target ID。

- [ ] 写失败测试：第一轮实际距离接近 5/12/20 米，最近为 A；三轮分别为 A/B/C。区间 9.999/10/19.999/20/40 米归属正确，负数/NaN/Infinity 拒绝；改变显示缩放不影响测距输入与输出。
- [ ] 测试无效/不完整选择不能提交；答错不能继续，纠正后可继续；连续点击不跳过下一轮；状态重置不调用旧 experiment-state。运行 `npm run test:unit -- tests/unit/lidar/learning-measurement.test.ts tests/unit/lidar/learning-state.test.ts` 确认缺少接口时失败。
- [ ] 实现米制转换和纯状态；测距使用三维直线距离。正确区间从计算距离判定，内容包答案只做一致性校验，不按固定按钮位置判分。
- [ ] 建立汽车、行人、树、路障教学几何及其点云；旧 720 点示意保留，新实验使用独立场景组并复用现有渲染循环。点云与目标引用同一份几何和位置，不宣称算法识别。
- [ ] 接入先判断后揭示的界面：提交前只显示目标标签和区间选项，提交后才显示实际距离；键盘和触屏均可通过列表选择目标。完成三轮后生成实验记录中的距离部分。
- [ ] 增加 E2E：提交前可见/辅助文字无精确答案；提交后结果与米制计算一致；扫描暂停、旋转、切章返回、再次重置均正确；模型失败仍能用教学几何和文字学习。
- [ ] 运行上述单元、`npm run build`、`npm run test:e2e -- tests/e2e/lidar-learning.spec.ts tests/e2e/lidar-domain.spec.ts`；通过后登记四目标和三轮实测为“教学模型验证”。

## Task L3 / P2：正常、雨、雾对比与局限题

**Files:** Create `src/chapters/lidar/weather-state.ts`、`tests/unit/lidar/weather-state.test.ts`；Modify learning-data/learning-world/learning-view/controller 与 `tests/e2e/lidar-learning.spec.ts`。

**Interfaces:** Produces `LearningWeather = 'normal' | 'rain' | 'fog'`、`WeatherLearningState`（环境、选择记录、已掌握题 ID）、`createWeatherLearningState(): WeatherLearningState`、`reduceWeatherLearning(state: WeatherLearningState, action: WeatherLearningAction, questions: readonly ChoiceQuestion[]): WeatherLearningState`。action 为 `set-weather {weather}`、`answer {questionId,choiceId}`、`reset`。判题消费 S0。

L2 的 `LidarLearningWorld` 新增 `setWeather(weather: LearningWeather): void`，只改变天气/回波示意，不改变米制目标位置。效果使用固定种子/固定素材保持可复现，不把视觉参数转成设备性能数据。

- [ ] 写失败测试：三种环境有效，未知环境不改变状态；未知题/选项不登记；三题纠错后各掌握一次，切天气不清掉已掌握题；重置只作用本天气活动。
- [ ] 运行 `npm run test:unit -- tests/unit/lidar/weather-state.test.ts`，确认新接口未实现导致失败。
- [ ] 实现状态与同布局定性对比：雨的额外回波、雾的远处轮廓变化均标为教学示意；传感器位置、原理距离和答案保持不变。
- [ ] 接入三题解释与主动继续；实验记录读取 L2/L3 的实际选择与结果，显示 20/60 米原理对照及所选知识卡，不生成学生未输入的个人理由。天气安全建议标明对应题目解释，不将切换天气本身当作掌握。完成说明强调感知、计算与行动配合。
- [ ] 增加 E2E：切雨/雾后目标布局不变、说明可读；无虚构识别率；后台暂停与恢复；关闭学习模式恢复旧雷达；退出页面清理新几何/材质/事件。
- [ ] 运行天气单元、构建、lidar 新旧 E2E，通过后更新指南和记录。随机位置与连胜奖励继续后置。

## 03 完成条件

- [ ] 原实验可用；新四目标、三轮测距和天气题能够完整操作。
- [ ] 距离数据、场景缩放、标签揭示及区间边界一致。
- [ ] 学生能说出设备作用和局限，界面明确教学示意与记录生命周期。

本计划只实施 03；公共文件归集成负责人。未获得实施指令前保持任务未勾选，不自动提交。

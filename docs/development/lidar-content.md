# 03 激光雷达内容与实验维护

本章保留八个部件、三种观察模式、四步说明、5–80 m 滑块、720 点扫描示意以及三个真实 DAE 模型。修改入口是源码；现有页面没有新增配置或编辑功能。

## 内容与固定文案

- `src/chapters/lidar/data.ts`：`partCatalog` 的 `id`、`name`、`copy`、`fact` 是部件资料；`partById` 由该数组建立。`lessonSteps` 的 `title`、`copy`、`partId` 是四步说明及其关联部件。
- `src/chapters/lidar/view.ts`：固定 HTML 模板 `view` 承载标题、模式按钮、滑块及刻度、步骤按钮的短名称、交互提示、设备参数与许可链接。步骤按钮的“发射 / 反射 / 接收 / 成点云”与 `lessonSteps.title` 是不同位置的文案。
- `src/chapters/lidar/controller.ts`：`announcePart` 的未选中说明、`showMode` / `showScan` / `showLessonStatus` / `showScanStatus` 的动态状态、`setStatus` 的加载或降级前缀及 `updateMeasurement` 的测量格式。模型状态由独立的 `assetStatus` 保留，切换模式或扫描不清除降级前缀。

例如要修改已有“收回回波”步骤的解释，仅在 `data.ts` 中编辑现有对象的 `copy`：

```ts
{
  title: '收回回波',
  copy: '接收器捕捉返回的光，测距电路计算光的往返时间，再换算出目标距离。',
  partId: 'lidar_tof_board',
}
```

修改时保留这个步骤的顺序、`partId` 与总共四步的结构。部件名称或描述也在现有 `partCatalog` 项中修改，无需编辑扫描几何。

## 部件、模型与拾取

`src/chapters/lidar/model-rig.ts` 的 `createModelRig(context, scope)` 返回 `apply(state)`、`update(state, delta)`、`resetCamera()`、`installLicensedParts(parts)`、`pickCandidates(state)` 和供扫描表现使用的 `scanParts`。

| 内容 ID               | 模型或表现的对应位置                                                     |
| --------------------- | ------------------------------------------------------------------------ |
| `VLP16_base_1`        | `installLicensedParts` 的安装底座；拆解偏移为 `-0.18 / modelScaleFactor` |
| `VLP16_base_2`        | 上盖；拆解偏移为 `0.18 / modelScaleFactor`                               |
| `VLP16_scan`          | 扫描组件；拆解偏移为 0                                                   |
| `lidar_io`            | `concept.ts` 的供电与数据接口；拆解偏移 -0.018                           |
| `lidar_tof_board`     | 回波与测距电路；拆解偏移 -0.008                                          |
| `lidar_encoder`       | 方位编码器；拆解偏移 0.01                                                |
| `lidar_motor`         | 旋转电机与轴承；拆解偏移 0.022                                           |
| `lidar_optical_array` | 16 通道光学阵列；拆解偏移 0.04                                           |

后五项的偏移使用概念组局部坐标，不能当作实际产品尺寸；真实部件的 0.18 表示归一化展品中使用的视觉间距。`model-rig.ts` 按 `partCatalog` 建立热点，用 `placeHotspots(state)` 将热点放到部件包围盒上方。真实模型的 `userData.partId` 在安装时传播到子对象，概念模型由 `concept.ts` 的 `tagPart` 设置；所有 ID 必须与 `data.ts`、步骤的 `partId` 一致。

`interaction.ts` 的 `bindLidarInteraction(host, scene, dispatch, scope)` 把当前 host 内控件与拾取转换为 `ExperimentAction`。点击位移超过 6 px 按拖动处理；射线优先选择 `lidar_` 概念部件，点云拾取阈值为 0.075。未关联部件的模拟回波只更新原有状态提示。

真实模型由 `controller.ts` 的 `load` 请求 `public/assets/lidar/VLP16_base_1.dae`、`VLP16_base_2.dae` 与 `VLP16_scan.dae`。`model.ts` 的 `loadDae(path, signal)` 保留资源路径处理、取消与 Collada 解析；`scene.ts` 的 `createScene(canvas, scope)` 创建模型组、概念组、相机、底座和扫描组。归一化、热点、拆解以及相机策略在 `model-rig.ts` 中。加载仍要求三个部件全部成功，部分失败时释放已成功的资源；卸载后迟到的资源也会释放。

模型来源与 BSD-3-Clause 许可链接位于 `view.ts`，许可全文位于 `public/assets/lidar/LICENSE`。修改模型引用时必须保持来源与许可有效。内部概念模型仍标注为原理示意。

## 物理量、状态与视觉参数

| 位置                                                      | 当前值、单位与职责                                                                                                                   |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `measurement.ts` / `roundTripNanoseconds(distanceMeters)` | 距离单位 m；`SPEED_OF_LIGHT_METERS_PER_SECOND = 299_792_458` m/s；公式 `2 × distanceMeters / c × 1e9`，返回 ns，拒绝负数和非有限距离 |
| `experiment-state.ts`                                     | `MIN_DISTANCE_METERS = 5`、`MAX_DISTANCE_METERS = 80`、`DEFAULT_DISTANCE_METERS = 20`；距离动作只接受范围内有限数值                  |
| `experiment-state.ts` / `STEP_DURATION_SECONDS`           | 每步 1.3 s，自动第四步回第一步；与物理光传播时间无关                                                                                 |
| `scan-animation.ts`                                       | 5–80 m 映射到视觉半径 0.42–2.05；点云以 20 m 为缩放基准；水平转速 2.1 rad/s，通道亮灯节奏 5.5/s                                      |
| `scan-animation.ts`                                       | 扫描环呼吸参数 0.985、0.015、2.4；射线方位偏移系数 0.18、透明度随视觉时间变化；脉冲进度取当前步骤经过时间 / 1.3 s，限制在 0–1        |
| `scan-scene.ts` / `createScanScene`                       | 720 点、22 条射线；点大小 0.022，点云透明度 0.86；点分布、目标框、回波线和扫描脉冲几何在此创建                                       |
| `scene.ts`                                                | 扫描组横向缩放 1.55；与距离计算无关                                                                                                  |
| `model-rig.ts`                                            | 部件偏移阻尼 8；拆解视距在宽度低于 760 px 时为 5.35，否则 4.35；保持进入/离开拆解的相机策略                                          |

`createExperimentState()` 仅提供首次默认状态。`reduceExperiment(state, action)` 处理 `mode`、`scan`、`step`、`distance`、`select-part`、`reset` 和 `tick`，不读 DOM 或 Three.js。状态字段是 `mode`、`scanActive`、`stepIndex`、`stepElapsedSeconds`、`manualStepSelection`、`distanceMeters`、`selectedPartId`。

手选步骤会开启扫描并保持该步骤；停扫后重新开启从第一步开始。重置保留输入状态的 `distanceMeters`，恢复 assembly、关闭扫描、归零步骤和经过时间、关闭手选标记并清空部件选择。控制器再调用 `rig.resetCamera()`，保持既有 `controls.reset()` 行为，不写回滑块默认值。60 m → 重置后仍是 60 m。

相机重置沿用原OrbitControls行为：拖动惯性尚未结束时立即重置，残留阻尼仍会影响视角；惯性稳定后重置回到保存的初始视角。该边界已对照本轮快照确认，整理期间未改变。相机验收用实际矩阵连续稳定作为前置条件。

`tick` 保留原控制器每帧最多推进一步并丢弃越界余量的规则。既有生命周期暂停时不派发 tick，恢复后的首帧 delta 为 0，不补跑后台时间。画面时间和扫描角度留在表现模块，业务步骤仅从 `ExperimentState` 读取。

测量显示格式留在 `controller.ts`：回波距离保留一位小数、滑块距离为整数、往返时间为 `约 … ns` 且保留一位小数；60 m 显示 `60.0 m` 和 `约 400.3 ns`。上述物理量、视觉参数和格式在这次整理中保持原值。

## 修改后的检查

1. `npm run test:unit -- tests/unit/lidar` 验证测量、范围、1.3 s 边界、手选保持、扫描重启和重置保留距离，并验证输入和真实 Three.js 场景映射。
2. 集成时运行 `npm run build`，再运行 `npm run test:e2e -- lidar-domain`。独立 spec 是 `tests/e2e/lidar-domain.spec.ts`，覆盖模式、模型拾取、60 m / 400.3 ns、手选与扫描重启、重置清空选择并恢复实际渲染相机矩阵、切 history 暂停和缺 DAE 的持续降级提示。相机通过Three原有devtools事件观察，避免依赖可能被着色器优化掉的uniform。
3. 既有 `tests/e2e/chapters.spec.ts` 与兼容测试继续验证导航、后台绘制停止、资源释放、重试与旧可调用 disposer。完整检查由集成负责人统一执行，章内实施不并行运行共享构建或浏览器测试。

不需要新增任务、课程或游戏情境来使用该指引。

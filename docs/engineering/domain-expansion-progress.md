# 执行记录 — plan: docs/superpowers/plans/2026-11-08-domain-learning-expansion-plan.md

## 范围与基线

- 用户授权开始执行：保留现有用户体验，仅整理01–04内部代码。
- 当前分支：codex/modular-reliability；无提交、推送或发布步骤。
- 本轮源码快照：.refactor-backup/domain-maintenance-20261108/src 与 tests；不得使用更早的翻新前备份覆盖当前源码。
- 基线命令：npm run check退出0，23单元、11浏览器与生产构建通过。
- Windows预览服务清理曾延迟测试退出；停止本轮启动的两个预览服务进程后，命令正常返回11 passed。最终验证将预览服务单独启动并在测试后显式清理，不修改产品行为或测试配置。

## 预检与决策

| 工作包 | 接口与边界 | 结果 |
| --- | --- | --- |
| A0→01–04 | mount(host)、setActive/dispose、load(host,signal?) | 保留公共签名 |
| H1→H2 | renderTimeline/renderArchive→history控制器 | 原HTML抽取，数据不变 |
| X1→X2/X3 | mission-state、powerflow-state→模型与面板 | 单一任务/动力状态来源 |
| L1→L2/L3 | ExperimentState→输入/模型/扫描 | reset保留距离；相机另复位 |
| R1→R2/R3 | TrafficState与effects→运动/展示/计时器 | 保留data-correct兼容属性，判断使用choiceId |
| 四章→A5/A6 | 各章独立源/测试/指南→公共回归与索引 | 构建和浏览器测试由集成负责人串行运行 |

Ruling: 继续在当前codex分支和工作目录执行，并为本轮保存源码快照 — 当前用户要求修改现有项目，Git元数据只读且当前包含已完成的未提交结构翻新；避免新检出遗漏这些基线 — 风险由文件快照和限定修改范围控制，不进行Git写入。

Ruling: 按四章工作包协作，章内步骤顺序执行 — 用户已要求01–04分开协作，子任务只写独立目录/测试/指南，公共构建和浏览器测试串行 — 若边界遗漏会造成接线冲突，由集成回归与审查验证。

Ruling: Windows环境使用本记录与独立文件报告替代依赖提交区间的bash工作台脚本 — 当前Git只读，实施计划也不要求提交 — 审查对照本轮源码快照和真实文件，不把旧HEAD当作此次基线。

## 进度

- A0: complete，基线退出0、接口和快照完成。
- A01: complete，4项章内单元测试、2项独立浏览器验收通过，指南与接口已核对。
- A02: complete，19项章内单元测试、3项独立浏览器验收通过，指南与接口已核对。
- A03: complete，24项章内单元测试、4项独立浏览器验收通过，指南与接口已核对。
- A04: complete，28项章内单元测试、3项独立浏览器验收通过，指南与接口已核对。
- A5: complete，最终npm run check退出0，98项单元、23项浏览器及生产构建通过，稳定布局对照一致，独立只读审查通过。
- A6: complete，四章指南、内容索引、README、实际架构图和计划状态已核对与更新。

## 验证与审查

章节实现/红绿/自审证据位于本轮快照目录的02-explore-report.md、03-lidar-report.md、04-traffic-report.md。01由集成负责人实施：原HTML提取为renderTimeline/renderArchive，4项测试保护14展品、target、占位与不变输入。

2026-11-08 13:14，npm run check首轮：17个单元测试文件、98项通过；tsc -b与Vite生产构建通过。浏览器及最终审查结果在实际结束后登记。

源码和测试与本轮快照逐文件字节比较：修改仅在四章指定职责文件，新增四章独立测试；app/shared、既有view、CSS、资源和既有回归测试未变。

Ruling: 02自然完成保留elapsedSeconds=5作为最后一帧输入，skip/deactivate清零，重播从0开始 — 隐藏后的内部时间与原控制器不同，不改变可见阶段、画面或时序 — 独立浏览器流程与基线对照负责核验。

Ruling: 03每帧最多推进一步并丢弃超出的步骤时间 — 复制原控制器节奏，不引入后台补跑或余量推进 — 单元边界、切章浏览器验收与既有后台绘制测试共同保护。

Ruling: 04纯运动零delta不推进 — 符合子计划和暂停首帧语义，正常帧保留原停点公式 — 本章运动单元测试与全程道路验收负责核验。

首轮完整浏览器：21通过、2失败，按命令输出与03原始trace调查。03相机测试读取的viewMatrix被当前着色器优化掉，实际只上传projectionMatrix/modelViewMatrix；改为通过Three原有devtools事件观察真实renderer使用的camera.matrixWorldInverse。04时长测试在驱动操作间让模拟时钟继续走动，消耗剩余时间；改为install后pauseAt，只用runFor推进。04聚焦暂停/过街测试已通过。

Ruling: 保留03原controls.reset()的拖动阻尼边界 — 在独立快照构建（4174）和当前构建（4173）用同一相机探针验证：立即reset最大矩阵偏差分别0.707441451/0.707441444，惯性稳定后分别2.12e-7/2.45e-7；迁移未改变原行为，L2明确保持controls.reset — 验收改为实际矩阵连续稳定后重置，仍保留1e-4初始视角断言；此边界写入指南，不附带行为修改。

## 最终验收与交付

2026-11-08 13:26开始的最终`npm run check`退出0：17个单元文件、98项测试；TypeScript与生产构建；23项浏览器验收全部通过（2.3m）。保留原23单元/11浏览器，新增75单元/12浏览器。修改测试观察方式后没有改变产品源码。

覆盖：01首尾/重复年份和销毁；02真实模型三目标拾取、误点/重复/重开、开合/灯光/分类/聚焦/爆炸、动力四阶段和离开结束；03模式/真实拾取/60m/400.3ns/手选保持/扫描重启/重置/切章暂停/缺DAE；04全对8/8、混合错题6/8、两个过街、重复作答/继续、定时/手动继续、暂停剩余时间和缺GLB。原导航、后台绘制停止、GPU释放、代码分片失败、资源重试与WebGL重建全部通过。

第一次严格布局对照捕获了入场及弹层退出动画中0.01–0.20px的采样差异。保留原before/after产物，未改期望或CSS；另用本轮真实源码快照独立构建，等待字体及有限CSS动画结束，得到before-stable/after-stable。八组1440×900/390×844的标题、控件文案和矩形精确一致；桌面02、手机03截图另做目视对照。三维动画像素不作逐像素相等断言。

独立审查见[domain-maintenance-review.md](domain-maintenance-review.md)：逐章符合计划，Critical/Important/Minor均无未解决项；原相机阻尼和明确排除的旧driving/后续课程保留边界。

格式验证：本轮修改和新增的TypeScript文件全部通过Prettier --check。交付前18份维护文档和执行计划共42个本地Markdown链接检查通过。git diff --check退出0，仅旧tracked文件的Windows换行提示。

临时预览进程36732（快照对照）及32072（集成验证）均已停止，生成的baseline-dist已清理；保留源码快照、报告、原始03trace、前后截图和可复现的对照脚本。没有提交、推送或发布。

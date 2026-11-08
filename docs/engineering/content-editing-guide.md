# 内容与小游戏修改地图

网页面向最终用户，维护者在源码中修改内容。四章资料、规则/状态、界面和三维表现分别维护，通过控制器连接。

| 模块 | 只改内容 | 改规则或状态 | 改界面或场景 | 详细指南 |
| --- | --- | --- | --- | --- |
| 01历史 | history/data.ts 原展品；learning-data.ts 新主题、排序、问答和未来选择 | learning-state；原定位交互在 controller | learning-view、render/view 与 gallery.css | [01指南](../development/history-content.md) |
| 02结构 | explore/data.ts 原部件；learning-data/learning-targets 新任务与目标 | mission-state、powerflow-state、learning-state、assembly-state | learning-view、vehicle-rig、powerflow-scene | [02指南](../development/explore-content.md) |
| 03雷达 | lidar/data.ts 原原理；learning-data.ts 新设备卡与实验题 | 原 measurement/experiment-state；新 learning-measurement/learning-state/weather-state | 原扫描与新 learning-world/learning-view | [03指南](../development/lidar-content.md) |
| 04道路 | traffic/data.ts 原八题；learning-data.ts 原题复习引用和进阶五题 | 原 rules/simulation；新 practice-state | 原 presentation/scenario-scene；新 learning-view/practice-scene | [04指南](../development/traffic-content.md) |

上述源码均位于 src/chapters/。完整实际结构见[项目架构](../../PROJECT_ARCHITECTURE.md)。

## 修改时如何选择文件

- 只修改文字：在data中修改展品正文、任务copy或情境feedback；固定面板文字在view/presentation。无需同时修改模型加载和渲染循环。
- 修改任务目标：02的target关联GLB装配名；需要同步核对部件映射。中文label是展示文字，不能代替模型名称。
- 修改实验计算：03的measurement负责SI单位和往返时间；experiment-state负责步骤与模式。视觉缩放和点云布局由扫描表现负责。
- 修改答案和计分：04的题库声明正确选项，rules负责判断、去重和阶段推进。按钮携带choiceId，data-correct保留为兼容属性。
- 修改道路情境：题库id和stopZ必须与scenario-scene的道具设置关联；负Z方向的停点按行驶顺序递减。更换模型或新增道具需要场景配合。

新任务的运行内容以各章有类型的 learning-data.ts 为唯一来源，docs/content 中 JSON 是准备稿。新增或调整题目时同步稳定 ID、答案、反馈、目标/情境关联与章内验收；共用 learning-assessment.ts 只按 ID 判定单选，不维护完成进度。

01 的未来理由只验证去掉首尾空白后的 Unicode 字符数（10–120），不自动评价观点；02 目标区分真实节点、教学热点与图文替代；03 距离读取米制数据，画面缩放不参与计算，10 米/20 米分别进入第二/第三档，天气不表示真实性能比例；04 复习读取原题答案，进阶题不增减原 8 分。

学习成果与未提交草稿只存在当前控制器内存，普通切章保留，刷新、页面退出或故障重建后重置。调整成果时同时检查确认撤销、重复提交和重试行为。产品中展示学生内容，维护说明只留仓库。

## 检查路径

先运行本章单元测试，例如npm run test:unit -- tests/unit/traffic；构建后运行对应浏览器验证，例如npm run test:e2e -- traffic-domain。完整验证使用npm run check，保留导航、资源故障、暂停、重建和GPU清理检查。

公共app/shared、根兼容入口和styles.css由集成负责人维护。各章拥有独立目录、测试和指南，减少多人同时修改公共文件。

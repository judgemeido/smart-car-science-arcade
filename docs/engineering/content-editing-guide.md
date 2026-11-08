# 内容与小游戏修改地图

网页面向最终用户，维护者在源码中修改内容。四章资料、规则/状态、界面和三维表现分别维护，通过控制器连接。

| 模块 | 只改内容 | 改规则或状态 | 改界面或场景 | 详细指南 |
| --- | --- | --- | --- | --- |
| 01历史 | history/data.ts：展品、年份、图片映射 | 当前没有测验计分；定位交互在controller | render/view与原CSS | [01指南](C:/Codex/citygame01/docs/development/history-content.md) |
| 02结构 | explore/data.ts：部件说明、分类、任务target、动力流程 | mission-state、powerflow-state | mission、vehicle-rig、powerflow-scene、view/scene | [02指南](C:/Codex/citygame01/docs/development/explore-content.md) |
| 03雷达 | lidar/data.ts：部件、四步原理 | measurement、experiment-state | interaction、model-rig、scan-animation、concept/scan-scene | [03指南](C:/Codex/citygame01/docs/development/lidar-content.md) |
| 04道路 | traffic/data.ts：题目、选项、答案、反馈和stopZ | rules；simulation负责原道路运动 | presentation、scenario-scene、scene/primitives | [04指南](C:/Codex/citygame01/docs/development/traffic-content.md) |

上述源码均位于src/chapters/。完整实际结构见[项目架构](C:/Codex/citygame01/PROJECT_ARCHITECTURE.md)。

## 修改时如何选择文件

- 只修改文字：在data中修改展品正文、任务copy或情境feedback；固定面板文字在view/presentation。无需同时修改模型加载和渲染循环。
- 修改任务目标：02的target关联GLB装配名；需要同步核对部件映射。中文label是展示文字，不能代替模型名称。
- 修改实验计算：03的measurement负责SI单位和往返时间；experiment-state负责步骤与模式。视觉缩放和点云布局由扫描表现负责。
- 修改答案和计分：04的题库声明正确选项，rules负责判断、去重和阶段推进。按钮携带choiceId，data-correct保留为兼容属性。
- 修改道路情境：题库id和stopZ必须与scenario-scene的道具设置关联；负Z方向的停点按行驶顺序递减。更换模型或新增道具需要场景配合。

本轮保留全部内容、操作和计分。将来有意增加内容或改变玩法时，同时更新对应数量、答案或流程的验收；不要只让页面数量变动而遗漏关卡状态或场景关联。

## 检查路径

先运行本章单元测试，例如npm run test:unit -- tests/unit/traffic；构建后运行对应浏览器验证，例如npm run test:e2e -- traffic-domain。完整验证使用npm run check，保留导航、资源故障、暂停、重建和GPU清理检查。

公共app/shared、根兼容入口和styles.css由集成负责人维护。各章拥有独立目录、测试和指南，减少多人同时修改公共文件。

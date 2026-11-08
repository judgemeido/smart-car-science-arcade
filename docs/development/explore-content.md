# 02 结构展厅内容维护

本章保留现有 BatteryPack → ADAS → Cabin 三步找部件、分类、聚焦、爆炸图、车辆开合、灯光与五秒动力故事。以下位置供维护者编辑源码，不对应产品内的编辑页面。

| 修改内容                     | 源码位置与数据                                                                                                                                          | 职责与关联                                                                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 三步任务目标、标题和提示     | `src/chapters/explore/data.ts`：`disassemblyTasks` 的 `target`、`label`、`title`、`copy`                                                                | `target` 必须匹配 GLB 的 `EV_SUV` 下顶层装配名。现有顺序是 BatteryPack、ADAS、Cabin；显示文案由面板使用，目标匹配由 `mission-state.ts` 判断。                                        |
| 系统介绍与零件说明           | `data.ts`：`focusCopy`、`assemblyInfo`、`humanizeNodeName`                                                                                              | 内容数据不保存任务进度。系统介绍由控制器接到既有 DOM，零件说明用于拾取信息卡和任务误点提示。                                                                                         |
| 分类标签与节点映射           | `data.ts`：`partCategoryLabels`、`partCategoryMap`、`partCategoryForName`；`focus.ts`：聚焦分类辅助函数                                                 | `vehicle-rig.ts` 按装配名筛选可见性；`focus.ts` 判断聚焦时的背景、车灯与系统网格。修改模型节点时应一并核对映射。                                                                     |
| 三任务推进与退出             | `mission-state.ts`：`createMissionState`、`reduceMission`                                                                                               | 纯规则仅接受状态、动作和任务数组；不读 DOM 或 Three。未开始拾取无效，误点和重复目标不推进，完成后不越界；exit、reset、close-exploded 清零。                                          |
| 任务面板与误点反馈           | `mission.ts`：`renderDisassemblyPanel`；`view.ts`、`styles.css`                                                                                         | 面板消费状态和 verdict，保留现有完成/误点文案，不自行判断装配是否正确。进行中再次开始保留进度，完成后重新开始回到首题。                                                              |
| 模型加载、重试与节点注册     | `controller.ts`：`loadModel`；`vehicle-rig.ts`：`prepareModel`                                                                                          | 路径仍为 `/assets/yaojing-s9-optimized.glb`。加载/取消/故障重试由控制器和既有 shared 资源工具处理；rig 负责原有黑色漆面、尺寸归一与道路贴合。                                        |
| 车辆开合、灯光和爆炸向量     | `vehicle-rig.ts`：`toggleDoors`、`toggleTailgate`、`toggleLights`、`prepareExplosionRigs`、`setExploded`、`update`；`data.ts`：`fallbackExplodeVectors` | 保留 EV_SUV、Door_FL/RL/FR/RR、Tailgate 等节点约定，车门 0.72、尾门 0.95 弧度和原 damping。爆炸使用 `explode_vector_blender_m`，再按原七轮包围盒修正计算；不替换资源或重算布局策略。 |
| 动力故事文案与阶段起点       | `data.ts`：`powerflowStages`；`powerflow-state.ts`：`reducePowerflow`、`powerflowDurationSeconds`                                                       | 阶段仍在 0、1.2、2.55、3.45 秒切换，总长 5 秒。状态决定阶段、播放完成、skip/replay/deactivate；负数或非有限 tick 不改变状态。                                                        |
| 动力路径、粒子、亮环与雷达波 | `powerflow-scene.ts`：`prepareModel`、`update`、`updateRadarWaves`                                                                                      | 效果消费动力状态和当前聚焦。路径、传感器锚点与视觉淡出沿用现有参数；不保存第二份播放进度。效果网格挂在车辆下，由既有 scene scope 清理 GPU 资源。                                     |
| 按钮、聚焦、相机与生命周期   | `controller.ts`，布局在 `view.ts` 和 `styles.css`                                                                                                       | 控制器限定本章 host，连接输入、状态、面板与场景。自动旋转恢复继续使用 shared 可暂停计时器，间隔 2500ms。离开章节结束当前动力故事并标记已播放，返回时不自动续播。                     |

动力状态自然完成时保留最后的五秒位置，以便界面显示 `05.0 / 05.0 SEC`；skip/deactivate 清零，replay 从零开始。播放结束时面板隐藏，雷达恢复到当前 ADAS 聚焦状态。模型动作与任务状态相互独立，关闭爆炸图的输入会显式发送 close-exploded 并隐藏任务面板。

验证规则和场景迁移使用 `npm run test:unit -- tests/unit/explore`。其中 mission-state 固定三任务全路径，powerflow-state 固定四阶段和五秒边界；vehicle-rig 与 powerflow-scene 使用真实 Three 对象检查开合/灯光/爆炸变换与效果显隐。

浏览器验收使用 `npm run test:e2e -- explore-domain`：保留实际 GLB 和 DOM 鼠标拾取，完成三步、误点、重复点选、重开，并检查开合、分类、聚焦、退出、爆炸重置以及动力 skip/replay/离开。测试通过 Three 原有 devtools 观察真实 renderer，仅用模型三角形投影定位可点击部件，不替换命中结果或写入任务状态。既有 `chapters.spec.ts` 中的模型失败重试、上下文故障和章节暂停测试继续保留。

本轮章内单元测试已经运行；共享构建和上述浏览器验收由集成负责人统一运行，不能将尚未执行的命令视为通过。后续如确实调整任务数量、节点名或时序，应同步规则测试、真实模型拾取验收和相关内容映射。

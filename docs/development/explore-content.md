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

## 五六年级学习活动

原三步任务完成后出现“复习三组系统的功能”。`learning-data.ts` 的 `exploreReviewQuestions` 使用同一份电池功能题对象，另加感知与座舱两题。选择通过 shared `evaluateChoice` 按稳定 ID 判断，可纠错，不写入原 `mission-state`。

独立结构挑战按动力 4 项、结构 4 项、感知 5 项执行。问题、选项、解释、功能提示和分组在 `learning-data.ts`；模型名称及要求在 `learning-targets.ts`。本轮内容从 `docs/content/2026-11-08-upper-primary/02-explore.json` 转换而来，运行时不加载文档目录。改题请编辑 `learning-data.ts`；换模型或节点请编辑 `learning-targets.ts` 并运行 GLB 名称核查测试。`learning-state.ts` 是命中去重、问答和完成报告的唯一规则来源。

新模型拾取从真实命中网格沿祖先链向根匹配当前目标，返回最近允许节点，独立于原顶层装配拾取。底盘要求至少一处悬架和 Brakes；两处悬架不能替代制动。挑战时原名称侧栏隐藏，当前目标满足后才揭示名称、展示功能问题。只有目标齐备且当前回答正确才可主动继续。连续点击继续不会跳过下一项。

`learning-view.ts` 内 `diagramLocations` 是键盘、触屏可选择的简化部件位置示意，所有部件有位置描述。它不冒充真实网格命中。模型失败时同样可继续图文学习；恢复模型不重置成果。没有独立模型节点的毫米波雷达仅通过 `teaching-millimeter-radar` 教学卡学习，不能用 `source: model` 登记。报告按任务标明“模型探索”或“图文学习”；一项采用混合方式时标明图文学习。报告的研究问题是学生可选输入，按 textarea 文本保存，不插入 HTML。

学习状态、复习选择与可选研究问题保存在控制器内，普通切章保留，刷新或销毁控制器后重置。退出挑战只返回自由观察，保留新任务进度。重置结构挑战只清空新学习活动；原拆解重置不影响新成果。进入挑战或归位时保存原分类、聚焦、爆炸开关与自动旋转状态，退出后恢复；学习拾取不发送原三任务 pick。

浏览器 `pagehide`（包括进入 BFCache 的 `persisted=true`）清空新挑战、归位、复习答案和研究问题，并退出教学模式、恢复进入前观察设置；原三步任务、分类和聚焦不清空。监听使用 scope 与 capture，在普通页面退出的全局销毁前执行。章节切换和 `visibilitychange` 继续走暂停语义，不清空学习草稿。

观察恢复包含 `camera-observation.ts` 保存的真实相机位置、朝向、缩放、OrbitControls 观察中心与约束，并保存控制器内部的距离限制。它在分类、材质、爆炸状态恢复后应用，避免再次聚焦覆盖学生自定义旋转、平移与缩放。恢复前清空临时交互产生的阻尼偏移，随后普通渲染不会漂离恢复位置。归位全部完成仍保持合拢，并应用原合拢视角的地面限制。

有些爆炸装配会移到原合拢视野之外。挑战按钮“调整视角，观察提示区域”按当前题允许节点所在的真实顶层装配计算包围盒并框选相机，不命中目标、不写入报告。它只在新挑战中使用；原自由观察的镜头、聚焦与重置路径保持原行为。真实摄像头测试会先通过此按钮调整视角，然后用真实射线核查和鼠标点击确认子节点。

模型失败和毫米波教学卡没有可框选的模型区域，视角按钮禁用，并指向可完成任务的部件示意或教学卡片。恢复模型后可框选任务会重新启用该按钮。

## 四步教学归位

`assembly-state.ts` 的 `teachingAssemblyGroups` 将实际 EV_SUV 下 24 个顶层装配恰好分为四组：底盘（含 Steering）、动力（含热管理）、车身座舱（含开合件）、智能设备。该分组服务教学演示，不是工厂流程。每组由学生主动点击开始，动画 1 秒，期间重复 next 无效；沿用当前 animation loop，切章和页面后台暂停。

`vehicle-rig.ts` 的 `setTeachingAssemblyProgress` 暂时覆盖位置，并抑制原全局爆炸动画的位置写入。原爆炸进度在覆盖期间保留，`clearTeachingAssembly` 清除覆盖并恢复该进度。取消时控制器恢复进入前的开关、分类和聚焦；全部完成时先把原进度设为合拢，再清除覆盖，因此不会从旧爆炸位置再次缓慢收拢。完成后原爆炸开关仍可重新打开。归位不加入 13 项挑战完成统计。

验证：`npm run test:unit -- tests/unit/explore` 覆盖原规则与新组合目标、GLB 节点、13 项分组、去重、未知 ID、主动继续、学习方式和归位状态，以及真实 Three 变换恢复。浏览器使用 `npm run test:e2e -- tests/e2e/explore-learning.spec.ts tests/e2e/explore-domain.spec.ts`，检查新旧完整路径、图文键盘输入、原任务完成后复习、真实前向镜头子节点、模型失败重试、切章保留与归位取消/完成。共享构建和浏览器测试仍由集成负责人串行执行。

# 04 道路游戏内容与规则维护

本章保留八个情境、每题1分、最高8分。页面入口、操作、题库、动画节奏、模型和降级行为保持现有实现；维护通过源码完成。

## 题库和选项

题库位于 `src/chapters/traffic/data.ts`，导出 `scenarios`、`Scenario`、`ScenarioOption` 和 `orderOptions`。情境顺序及车辆停点如下：

| 顺序 | ID                | stopZ |
| ---- | ----------------- | ----- |
| 1    | red-light         | -10.4 |
| 2    | pedestrians       | -26.5 |
| 3    | yellow-light      | -49.4 |
| 4    | school-zone       | -68.4 |
| 5    | green-pedestrians | -92.5 |
| 6    | queue             | -113  |
| 7    | construction      | -138  |
| 8    | ambulance         | -163  |

`id` 关联场景道具及行人分支；`title` 对应题目标题；`copy` 对应解释；`tag` 显示在道路状态文字中；`options[].label` 为按钮文字；`options[].correct` 为答案依据；`feedback` 为作答后的安全说明；`stopZ` 为车辆在场景Z轴上的停车坐标。本轮没有修改以上题目或增加情境。

例如 `red-light` 的 `title` 是“前方红灯亮了，应该怎么做？”，其原始第一个选项“停在停止线前，等绿灯”标记为 `correct: true`。回答后显示 `feedback` 中关于停止线和信号允许通行的说明。

选项在原始题库位置生成稳定 `choiceId`，格式为 `${scenario.id}:${index}`，索引从0开始，因此红灯正确答案为 `red-light:0`。这发生在显示排序之前。`orderOptions(scenario, scenarioIndex)` 保留现有正确答案槽位 `[0, 2, 1, 2, 0, 1, 2, 1]`，奇数情境索引反转错误选项的显示顺序，排序不会改变 `choiceId`。更改原始选项位置会改变身份，应同步核对测试和题目映射。

按钮同时保留 `data-correct` 并提供 `data-choice-id`。控制器只向规则发送 `choiceId`；`reduceTraffic` 根据当前情境的选项判断答案，拒绝未知或其他题的选项ID，DOM中的 `data-correct` 不参与计分。A/B/C字母只表示显示位置。

## 反馈与结算

`src/chapters/traffic/presentation.ts` 的 `renderTrafficUI(host, state, scenario, feedback)` 更新现有控件。`TrafficFeedback` 包含所选 `choiceId` 和 `correct`，由控制器从规则状态中的 `answeredChoiceId` 和当前题库推导。

随题目变化的标题、说明、选项、安全反馈在 `data.ts` 修改。固定“答对了！”、“再记住这个安全做法。”、准备/继续/过街状态、结算标题 `安全小队得分：分数 / 题数`、结算说明和“再走一次”等在 `presentation.ts`。最初进入时的“开始体验”及页面框架在 `view.ts`；初始化和模型降级状态提示仍在 `controller.ts`。没有另加配置系统。

展示按规则阶段更新，动画帧不重建题目按钮。正确选项、已选正确/错误选项的类名、禁用按钮、overlay的隐藏及ARIA属性均沿用现有行为。过街及其后的短反馈期间题目面板保持隐藏；普通反馈显示继续按钮。

## 场景与运动

`src/chapters/traffic/scenario-scene.ts` 导出 `createScenarioPresentation(environment)`，参数是 `createScene` 返回的场景对象：

- `apply(scenarioId)` 按八个既有ID设置红/黄/绿信号灯、学校标志、两组行人、排队车辆、锥桶和救护车；切换情境时重置相应演员的可见性与材料。
- `update(world)` 从运动状态设置演员姿态、车辆位置、行人消隐和救护车闪灯，不计分或推进题目。

基础城市道路、信号灯、斑马线、停止线、玩家车在 `scene.ts`，基础形状、人物步态和示意车在 `primitives.ts`。`data.ts` 的 `stopZ` 与这些道具坐标共同决定停车时看到的画面，调整停车位置时需核对场景布局；ID更改也需要核对 `apply` 及规则中的两个行人分支。当前模型 `/assets/yaojing-s9.glb` 的加载、迟到结果清理、示意车降级在 `controller.ts`，继续使用原共享资源生命周期。

`src/chapters/traffic/simulation.ts` 导出 `WorldState`、`createWorldState()` 和 `stepWorld(state, deltaSeconds, scenario)`。状态含玩家车Z位置、环境时间、路过车辆/救护车位置及两组行人的状态和进度。步进不读取DOM或Three.js，返回新状态，拒绝负数/非有限秒数，零步长不推进。

车辆继续使用 `CRUISE_SPEED = 7.2`、`BRAKING_ACCELERATION = 5.5` 的刹停公式，离停点不超过0.08时贴合停点，移动不会越过 `stopZ`。两组行人过街时间为 `CROSSING_DURATION_SECONDS = 4.8` 秒；行走在总进度0.86处完成，消隐从0.84开始，这些姿态公式在 `scenario-scene.ts`。环境行人循环、路过车辆及救护车的既有运动速度也由这两个文件承接。

## 计分、推进与生命周期

`src/chapters/traffic/rules.ts` 导出 `createTrafficState()`、`reduceTraffic(state, event, scenarios)`、`TrafficState`、`TrafficEvent` 和 `TrafficEffect`。阶段为 `ready / driving / question / feedback / crossing / complete`；规则状态是题目索引和分数的唯一来源。

`answer` 只在 `question` 接受有效 `choiceId`，正确加1分，错误加0分，重复作答被拒绝。仅 `pedestrians` 和 `green-pedestrians` 的正确答案产生 `start-crossing`。`continue` 只在 `feedback` 接受一次，八题后进入 `complete` 并产生 `show-result`。`start` 重开本局，`reset` 清零并回到准备页。

时间常量和调用位置：

| 常量                         | 值/单位  | 调用                                         |
| ---------------------------- | -------- | -------------------------------------------- |
| `FEEDBACK_DELAY_MS`          | 2300毫秒 | 普通作答产生 `schedule-continue`             |
| `CROSSING_FEEDBACK_DELAY_MS` | 550毫秒  | `crossing-complete` 产生 `schedule-continue` |
| `CROSSING_DURATION_SECONDS`  | 4.8秒    | `stepWorld` 累计两组行人过街进度             |

`controller.ts` 的 `dispatch` 执行规则效果、连接场景和UI，继续使用 `createPausableTimer`；手动继续先取消定时继续。`WorldState.driving` 是每帧从规则 `phase` 推导的运动输入，不是另一套游戏流程。`setActive(false)` 暂停帧循环和反馈计时，隐藏期间不步进、不补跑；恢复保留剩余时间。重复过街完成不会再次排程。

保留原重置细节：车辆/救护车回到起点，分数清零；环境时间和路过车辆继续；准备页上的情境进度保留原显示，再次开始才显示 `0 / 8`。

## 修改后的检查路径

先运行 `npm run test:unit -- tests/unit/traffic`，覆盖八题8分、错误/未知/重复作答、手动与定时继续竞态、两个行人分支、最后一题结算、重开、重置、车辆停点及过街步进。

集成阶段运行 `npm run build` 和 `npm run test:e2e -- traffic-domain`。独立 `tests/e2e/traffic-domain.spec.ts` 走完8/8及混合错题6/8，交错手动/自动继续，校验重复点选、两组过街、反馈和过街中切页/后台恢复、重开与重置，以及GLB缺失时示意车仍能完成游戏。既有 `tests/e2e/chapters.spec.ts` 继续覆盖跨章兼容性。章节实施者按协作简报不运行共享构建或浏览器测试，由集成负责人统一执行。

当前交付只针对八题八分游戏，原100分课程仅作后续参考，不依赖学习档案、门禁或新章节。

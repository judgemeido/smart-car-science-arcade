# 02 汽车系统维修台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 本文件只交付计划；总负责人拥有架构、合同与审查决策，全部产品实施（含共享模块和旧页迁移）由 GPT-6.1-sol 集成代理承担。

**Goal:** 为小学三至六年级新增独立二维结构游戏页，通过诊断教学剖面、补装部件、连接系统关系，让学生看见汽车的运动、支撑与感知需要不同部件配合。

**Architecture:** 02顶部导航两个同级子按钮：“拆解与交互”→`#explore`、“结构挑战”→`#structure-lab`。点击替换整个主内容，任意时刻恰好一个页面可见且active。结构挑战不是3D左侧+2D右侧、章内手风琴内容、弹窗或模型下方追加区。`src/activities/structure-lab/` 导出 `view: string` / `mount(host: HTMLElement): ChapterController`，独立host不继承explore-workbench/model-canvas、不加载GLB；控制器创建页面拥有的共享ArcadeSession。旧3D页保留自己的交互/归位/复习；新页13主题的图示ID与模型目标分开，运行由共享arcade负责。

**Tech Stack:** TypeScript 5.7、原生 DOM、SVG/CSS、Vite 6、Vitest 4、Playwright 1.56；新页不引入 Three.js、模型资源、联网 AI、后端或额外 UI 框架。

**Spec:** [科学游戏总设计](../specs/2026-11-08-science-arcade-design.md)。既有知识与模型事实依据 `docs/development/explore-content.md`、`docs/superpowers/specs/2026-11-08-upper-primary-learning-design.md`。

**Status:** 计划未实施；内容目录、route、运行接口、计分和生命周期合同已锁定。360 秒为设计默认值，实际儿童可用性评估后再统一调整版本及比较键。

## Global Constraints

- 用户修正优先：02通过顶部两个同级子按钮切换独立页面，标签/路由固定为“拆解与交互”`#explore`、“结构挑战”`#structure-lab`。每次切换整个主内容，只允许1个可见active页面；全局导航/注册实施由GPT-6.1-sol集成代理承担。
- 玩法、教程、HUD、反馈和结果只存在于structure-lab独立host；旧3D主区、aside、弹窗、模型下方均不保留挑战启动器或面板。隐藏的另页必须inert，不能接收鼠标/键盘；缓存其状态不等于一起展示。
- 两个机制足够：二维剖面诊断/装配、系统关系连接；不再新增第三套选择测验、驾驶模拟或经营系统。
- 全部页面正文最小18px；任务、部件功能、资料反馈与结果说明均适用，窄屏通过换行布局适配。
- 比赛默认360秒，教程在计时之外；同样台面可自由练习，练习不计时、不写正式比较记录。时长待真实儿童可用性评估统一调整，当前读取共享配置360000ms。
- `guided`“带提示” / `standard`“标准挑战”分别适合需要更多引导/更独立的学生；不推断年级，不因年龄硬性禁用；相同真值表、操作和权重，比较键包含档位。
- 后台、hidden、导航继续单调比赛时钟；切页保留 mounted run，setActive 只控制输入。刷新与页面退出把 active run 关闭为 interrupted/unranked，不恢复比赛。
- 13 个旧主题全部映射，但结果表述是“教学图示中完成”，不能叫“在实际 GLB 找到 13 个零件”或真实维修能力认证。
- 毫米波雷达没有原 GLB 独立节点，始终标“教学示意”；底盘是组合系统，至少包含悬架和制动，不能画成一个虚构单件。
- 关系图用来解释功能，不是高压接线图、维修手册或特定量产车配置。位置与表现是教学示意，不能据此认定真实车型配置。
- 游戏分只评价已公布的操作规则；提示助手是固定台词，不伪装真实 AI。不得生成假同学/真对手分数、冒充跨电脑实时排行榜。
- 不复制旧 `explore/controller.ts`、rig、scene 或整个 learning controller；不 cross-import sibling controllers。共享内容、共享类型和提取后的纯规则可用。

## Review Focus

- 同一部件连续放置/检查不能刷分，轮胎在动力和抓地两种语义中不得因一个动作自动完成两个主题，见 X2/X3。
- 底盘要同时有悬架和制动；两个悬架不能替代制动，见 X1/X2。
- 能量、转动、支撑、感知信息不能任意互换；装上部件但关系断开时不能显示系统修复成功，见 X3。
- 触屏和键盘没有 hover/精细拖动仍能完整安装连线；同一真值表发同样 facts，见 X4。
- 原模型故障、旧爆炸图/归位/分类/镜头状态不会影响新图示或被新 reset 改动，见 X5。

## 已观察代码与迁移边界

| 证据文件 | 原行为 | 新页使用 / 原页保留 |
| --- | --- | --- |
| `src/chapters/explore/data.ts`、`mission-state.ts`、`mission.ts` | BatteryPack→ADAS→Cabin 三步任务，错误不推进 | 原 3D 展厅原样保留，不作为新比赛前置条件 |
| `learning-data.ts` 的 `exploreLearningTasks/exploreLearningGroups` | 动力 4、结构 4、感知 5 个主题；每个带功能题和准确解释 | 提取 canonical 13 主题与 4+4+5 分组；旧选择题 UI 被操作关卡替代，解释作为确认后知识卡 |
| `learning-targets.ts` 的 `names/kind/requiredTargetGroups` | 最近允许祖先、真实子节点；底盘需悬架与 Brakes | 内容源与模型映射原样保留，新页使用独立 diagram ID，不投递 `source:model` |
| `learning-state.ts` | 找到目标 + 正确回答 + 主动 continue 才完成；diagram/model 区别、去重 | 旧规则保留回归；新 reducer 单独判断安装和连接，不滥用旧 found 字段冒充模型拾取 |
| `learning-view.ts` 的 `diagramLocations` | 文字位置示意，已声明不是真实模型配置；毫米波为 teaching 卡 | 新页重新画 SVG 示意和可聚焦 overlay；共享 part 元信息可提取，不复制旧整套 UI |
| `src/chapters/explore/view.ts` 的 `data-learning-start` / `data-explore-learning` | 当前在旧3D页嵌入挑战启动器和面板，是本轮明确移除的错误基线 | 删除旧view/aside这两个元素和挑战挂载；入口只在02顶部子按钮，旧aside不另留挑战链接 |
| `assembly-state.ts` | 24 个真实顶层装配分 chassis/power/body/sensors，1 秒主动四步归位 | 原 3D sibling 保留，首轮新页不新建归位机制；归位不加入新 13 项完成统计 |
| `vehicle-rig.ts`、`camera-observation.ts`、`controller.ts` | 爆炸、观察恢复、暂停归位；模型真实 raycast | 本计划不改其功能；新活动不加载这些模块 |
| `powerflow-state.ts`、`data.ts` 的 `powerflowStages` | 0、1.2、2.55、3.45 秒四阶段，5 秒原动力故事 | 原故事完整保留；新 SVG 试运行是独立说明，不复用故事时钟 |
| `docs/development/explore-content.md` | 说明 source、节点、pagehide、切章、归位等维护事实 | 追加独立页和 canonical 内容维护说明，继续保留模型维护限制 |

旧`#explore`整页删除13项挑战启动器、面板、输入挂载，包括view.ts的`data-learning-start`、`data-explore-learning`，旧aside不留挑战链接。新游戏只通过02顶部“结构挑战”或直接`#structure-lab`进入；“拆解与交互”返回完整3D页。两者替换主内容，不能一起显示。原三步、复习、四步归位和3D自己的控制保留；复习引用canonical对象，不写比赛事件。旧13项规则测试保留，旧learning E2E调整为独立路由/保留功能回归。

## 三张台面与实际操作

在`#structure-lab`独立host内部，HUD显示三组进度/计时，台面是二维教学剖面，辅助小窗也是二维俯视图，右侧为部件卡/提示，底部“试运行”“连接系统关系”。这段左右布局只属于独立2D游戏，绝不与旧3D模型并排。移动端托盘在图下。02两个页面切换按钮位于主内容之外；新页不含explore-workbench/model-canvas/GLB，教程和结果也只在新host。

### 机制 1：看缺失现象，选择部件并安装

不是模拟真实故障诊断：提示明确“这张教学图缺少几项功能，请补齐”。每组有现象标记，学生点现象可看短动画/静态说明，再选具备相应功能的部件，放到剖面大槽位，按“试运行”检查。轮胎先接触路面、悬架连接车身与车轮、摄像头观察方向等要在台面里看得见；部件卡用外形和功能短句，不是重新包装 radio 选项。

正确安装后固定该部件，播出对应局部功能，如电池出现电能标记、电机转动、悬架缓和路面起伏、摄像头把图像送入信息箱。错误只指出“这个槽需要哪类功能”，保留全部正确件、把错误件留在槽中供替换；不扣拖放动作分，也不把整张图清空。额外“给我一个部件提示”可揭示一个 part↔socket 关系，明确标记该主题已用提示。

| 台面 / 内容 ID | 必须进行的动作与功能证据 | 图示完成含义 |
| --- | --- | --- |
| 动力 `explore-energy-battery` | `part-battery` 放 `socket-power-battery`，试运行看电能从储能盒输出 | 在教学图识别储能，不宣称找到实际 BatteryPack |
| 动力 `explore-energy-motor` | `part-motor` 放 `socket-power-motor`，电能进入后显示转动 | 电机负责转化，不能用电池代替 |
| 动力 `explore-energy-transmission` | `part-transmission` 放 `socket-power-transmission`，齿轮传递转动 | 不把减速/差速机构认作传统车型全部变速箱 |
| 动力 `explore-energy-wheel` | `part-wheel` 放 `socket-power-wheel`，轮胎与路面接触后能显示前进箭头 | 认识动力最终要作用于路面；前进是示意 |
| 结构 `explore-structure-body` | `part-body` 放 `socket-support-body`，提供承载/连接框架 | 不声称车身绝对抗碰撞 |
| 结构 `explore-structure-suspension` | `part-suspension` 放 `socket-support-suspension`，连接车身与轮胎并缓和起伏 | 不声称完全消除颠簸 |
| 结构 `explore-structure-chassis` | 悬架已安装，另将 `part-brakes` 放 `socket-support-brakes`；同时有悬架与制动才可确认底盘主题 | 底盘是多个系统，不能用两个悬架或一个“底盘零件”完成 |
| 结构 `explore-structure-wheel` | 同一个 canonical `part-wheel` 在新的 `socket-support-wheel` 放置；由初始 dry 切至 wet，试运行查看接触关系说明，湿滑观察是此主题确认的第二条件 | 是轮胎/路面主题的新操作，不用动力轮胎动作自动完成；无虚构停车距离 |
| 感知 `explore-sensor-front-camera` | `part-camera-front` 放 `socket-sensor-front`，看前方道路图像进入信息箱 | front 为方向功能，不等同 GLB 命中 |
| 感知 `explore-sensor-surround-camera` | `part-camera-surround` 放 `socket-sensor-surround`，展开侧后方图像窗口 | 不承诺没有盲区，不推断真实摄像头数量 |
| 感知 `explore-sensor-lidar` | `part-lidar` 放 `socket-sensor-lidar`，激光往返出现距离点 | 顶部位置是图示，不取得实际 Roof_lidar_housing |
| 感知 `explore-sensor-millimeter` | `part-millimeter-teaching` 放独立 `socket-sensor-millimeter-teaching` 小框，显示无线电波回波 | 框/卡/成果三处均标“教学示意”，不在真实车型上增设虚构 GLB 部件 |
| 感知 `explore-sensor-ultrasonic` | `part-ultrasonic` 放 `socket-sensor-near`，观察车旁近物的声波回波 | 近距用途，不假称可可靠观察遥远道路 |

每张台面一次“试运行”核验所有已填槽；缺槽只显示未完成，不记错误。已填但功能不符才产生该 objective 的 incorrect fact；正确主题第一次完成发 correct fact 并锁定该主题安装。错误件可任意改；正确件不移走，无须重新刷一遍。结构底盘的 brakes 安装不另建第 14 个任务，归入原 chassis objective。

### 机制 2：连出功能关系，修复整组系统

安装正确后台面出现关系端口，学生“选起点 → 选终点 → 选关系标签”，或拖线后选标签，再按“验证系统”。每组所有必需关系成立才完成该组；错误用文字说明首个错连点，例如“电池提供电能，不能跳过电机直接变成车轮转动”，并把错线标虚线，允许选线删除/重连。图上任何连接都叫功能关系，不伪装维修线束。

| 关系目标 ID | 全部必需边（source→target : relation ID） | 验证后的观察 |
| --- | --- | --- |
| `structure-link-power` | battery→motor:`electric-energy`；motor→transmission:`rotation`；transmission→wheel:`rotation`；wheel→road:`contact-force` | 依次亮起储存→转化→传递→路面作用，补齐前只显示局部已完成步骤 |
| `structure-link-support` | body→suspension:`support`；suspension→wheel:`support`；brakes→wheel:`slow-rotation`；wheel→road:`contact-force` | 干燥/湿滑仅切换说明及接触表现：加速、转弯、减速依赖接触，不能承诺固定制动距离 |
| `structure-link-perception` | front-camera→processor:`image`；surround-camera→processor:`image`；lidar→processor:`laser-distance`；millimeter-teaching→processor:`radio-target`；ultrasonic→processor:`near-distance`；processor→driver-action:`analysis` | 图像与不同回波先收集信息，计算分析后给出提醒/合适行动；“驾驶行动”不自动宣称是完整自动驾驶或绝对安全 |

source/target 的 graph ID 是 `node-*` 前缀，对应以上 canonical part，processor/driver-action/road 是教学步骤卡而非新增需寻找的模型部件。连线有方向、固定关系类别；guided 显示端口类别图标和文字，standard 不显示目标幽灵线，并在当前托盘放 1–2 张已有部件作为干扰。规则不因档位改变。

三组安装 + 连关系的目标操作时间约为动力75秒、支撑75秒、感知90秒，360秒设计默认另外留出反馈阅读和纠错时间；具体可用性需真实儿童测试。第一组完成后主动“下一台”，不自动切走说明；比赛未完成也可看到真实部分结果。最终显示13个主题图示完成状态、3个关系图和一条可选收藏，不追加问答或按表达质量打分。

教程用非正式“台灯电源→灯泡”的二维演示，先完成选件/放槽，再完成选起点/终点/标签；约20秒，不计时/计分、不发 objective facts。开始前只有未计分预览/教程，教程结束再启动练习/比赛 session；主学习操作的有效检查才产生计分事实。共同 `src/ui/arcade/assistant` 从当前 board、错误 ID、hint 次数选择固定台词，不假装理解自由文本。每个局部动画最多600ms，reduced-motion 用静态替代；连对火花只是装饰，不加分。

## 状态机与本地接口

`briefing → tutorial → install(power) → link(power) → group-feedback → install(support) → link(support) → group-feedback → install(perception) → link(perception) → result`。安装错误与连线错误作为同阶段 feedback，读后继续改当前草稿；成功只解锁 next，不自动跳组。公共 timeout 从任何比赛阶段进入 result 并冻结草稿，不自动完成剩余主题。

```ts
type StructureLabBoard = 'power' | 'support' | 'perception';
type StructureLabProfile = 'guided' | 'standard';
interface StructureLabConfig {
  readonly mode: 'practice' | 'contest';
  readonly profile: StructureLabProfile;
  readonly challengeCode: string;
  readonly contentVersion: string;
}
interface StructureObjectiveFact {
  readonly objectiveId: string;
  readonly revision: number;
  readonly verdict: 'correct' | 'incorrect';
  readonly usedHint: boolean;
}
interface StructureLabTransition {
  readonly state: StructureLabState;
  readonly facts: readonly StructureObjectiveFact[];
}
createStructureLabState(config: StructureLabConfig, content: StructureLabContent): StructureLabState;
reduceStructureLab(state: StructureLabState, action: StructureLabAction, content: StructureLabContent): StructureLabTransition;
```

state 包含 config、stage、boardId、installedBySocket、edgesByBoard、selectedPartId/selectedPortId、surface:'dry'|'wet'、feedback、revisionByObjective、lastCheckedRevision、completedObjectiveIds、hintedObjectiveIds、finishReason。总分、时钟、模型状态不在本地 state。actions 为 `start/tutorial-complete`、`select-part {partId}`、`install {socketId,partId}`、`select-port {nodeId}`、`connect {sourceId,targetId,relationId}`、`remove-edge {edgeId}`、`surface {value}`、`check-install`、`check-links`、`hint {objectiveId}`、`continue`、`finish {reason:'completed'|'timeout'|'abandoned'|'interrupted'}`、`reset-practice`。正式 finish/status 和 outcome.finishReason 均使用这四个值。

- check 输出 fact 的边界是一个 semantic objective 的首次有效确认，重复不变检查或 incomplete 检查无 fact、也不递增 revision。空槽/缺边仅提示；已填错功能/错关系才是 incorrect。session.record 内部绑定 runId/seq，草稿 revision 不是运行全局序号。
- 每个 semantic objective revision 只在有效实质草稿编辑时加一；支撑的 chassis revision 取悬架/brakes 依赖的共同 board revision。已正确确认的悬架/制动依赖件锁定，当前run不存在完成后删除依赖再保留旧确认的路径。
- 13 项正确安装分别确认；一个完整关系图另确认一次。全部安装正确前不进入 link，全部 required edges 正确前不进入下组。
- 允许一条 source 多个 target，但禁止完全重复的 `(source,target,relation)` 边；未知端口/类别、同端口自连、跨 board 连线、完成后的编辑无效。
- 比赛与练习的当前run中，已完成目标一律只读，可回看此前反馈；修改已完成件/关系必须开始全新一轮，不提供单目标 uncompletion 或撤回事实。
- `reset-practice` 重置整轮而非本组：若旧practice session仍running，先 `session.finish('abandoned')`，再 `createStructureLabState` 清空所有组的目标/件/关系，调用 `session.start(practice config)` 开始零目标新run。旧session已结束时不重复finish；score/elapsedMs继续为null。正式再赛也必须另开新run。
- reducer 不读 DOM、Three、时间或 localStorage；主关卡输入同时要求页面 active 与 session running。inactive 只停止输入，不暂停比赛时钟；dispose 解除监听和订阅，并调用共享 session.dispose。

## 锁定的权重、计分与诚实结果

13 个现有 task ID 每项权重40，共520；3个 `structure-link-*` 每项权重160，共480；权重和1000。这些数是内容权重，不是每项实际最终分。原 chassis 的制动/悬架两条件共一项，毫米波不额外奖励。显式部件/关系提示作用于一个 objective，其 usedHint 会保留到首次正确 fact，不能隐式影响其他主题。

唯一共享公式为 `score = floor(.7 * earnedWeight) + floor(.2 * firstCorrectWeight) + (completed ? floor(100 * clamp((360000 - elapsedMs) / 180000, 0, 1)) : 0)`，由 `src/shared/arcade/scoring.ts` 实现。纠正后仍可获得完整70%完成贡献；每项第一次有效检查决定首次正确资格，第一次错误或首次正确前使用显式提示均不能进入 `firstCorrectWeight`。缺件/未知输入不属于有效检查；常驻操作引导不是提示。只在全部目标完成时加速度贡献，连对仅装饰火花、不加分；教程、动画等待、字数不计分。全部首次正确且180秒内完成为1000，300秒为933；一项40权重先错再正确、180秒内全完成为992。

公式只适用于正式比赛；练习结果的 `score` 与 `elapsedMs` 均为 `null`，不以0分/0ms冒充练习成绩，练习不进入比较记录。

新页只发 `{objectiveId,revision,verdict,usedHint}` facts，`session.record(facts)` 的公共适配器内部绑定 runId/seq、去重；本地不能设置事件运行 ID 或另存累计分。共享运行模块为 `src/shared/arcade/{types,session,scoring,storage,challenge-code}.ts`，共同 UI 为 `src/ui/arcade/{shell,results,assistant,styles}`。本页 `activityId` 为 `structure-lab`，稳定卡序来自 challenge-code，比较键精确为 `activityId + challengeCode + profile + contentVersion + scoringVersion + durationMs`。

每个控制器通过共享 factory 创建页面拥有的 ArcadeSession，调用 `session.start(config)`、`session.record(facts)`、`session.finish(reason)`、`session.subscribe(listener)`、`session.setActive(active)`、`session.dispose()`；共享拥有时钟、去重与一次 finalize，没有全局 singleton 或第二份 store。教程结束再 start，subscribe 驱动共同 shell 的运行显示。hidden/后台/导航继续单调时钟，mounted run 随导航保留，主关卡输入守卫 active+running。刷新/页面退出关闭并存 interrupted/unranked，下一次挂载从预览开始、不恢复。

共同 results 注明“二维教学图示”；每项状态来源 `diagram`，毫米波再标 teaching。不能生成 model evidence 或维修胜任判断；准确展示本轮核验的安装/关系、真实部分结果和实际本机记录。比较只使用上述完整比较键；现场横向比较靠同学展示真实结果屏，公共说明明确各电脑只有自己的历史。

## 文件所有权

| 文件 | 职责 / 修改边界 |
| --- | --- |
| Create `src/content/structure-learning.ts` | 原样提取 13 主题、分组和复习唯一对象 |
| Create `src/content/structure-targets.ts` | 原模型 target 定义，保持名称、kind、hotspot 和组合条件，不放新 diagram 节点 |
| Create `src/shared/structure-target-rules.ts` | 从原 target 文件提取 `resolveLearningTargetName/hasRequiredTargets` 纯函数 |
| Modify `src/chapters/explore/learning-data.ts`、`learning-targets.ts` | canonical / shared 兼容 re-export，不复制对象 |
| Create `src/activities/structure-lab/content.ts` | 13 topic↔socket 任务、3 board 与 3 graph 的规则和 fixed-copy 提示 |
| Create `src/activities/structure-lab/parts.ts` | 单一 diagram part 定义、功能标签、示意图坐标、对应 source task/target 引用；轮胎只一份定义 |
| Create `src/activities/structure-lab/state.ts` | 安装/连接纯规则、阶段、revision 与 facts |
| Create `src/activities/structure-lab/diagram-view.ts` | SVG 剖面、端口、部件/关系 overlay 按钮，消费纯状态 |
| Create `src/activities/structure-lab/view.ts`、`styles.css` | 页壳、教程、资料、反馈和完成显示 |
| Create `src/activities/structure-lab/controller.ts` | host scope 输入、pointer/键盘等价、active/dispose、公共 runtime 适配 |
| Create `src/activities/structure-lab/index.ts` | 只导出 `view: string` 与 `mount(host: HTMLElement): ChapterController` |
| Modify 原 `explore/controller.ts`、`view.ts`、`learning-view.ts` | GPT-6.1-sol集成代理删除旧13项启动器/面板/挂载以及data-learning-start/data-explore-learning；旧aside不留挑战链接，保留原3步/复习/归位/模型 |
| Create `tests/unit/structure-lab/content.test.ts`、`state.test.ts`，`tests/e2e/structure-lab.spec.ts` | 图示语义、因果关系、去重、完整真实输入与旧页回归 |
| Modify `docs/development/explore-content.md` | canonical 内容与图示规则维护；继续保留 GLB 与归位说明 |

`assembly-state.ts`、rig、scene、camera-observation 和原动力故事不因本新页被复制/提取/改造。canonical targets 继续维护原模型事实，新 parts 只引用它们供出处追溯，不拿模型 targetName 当 diagram completion evidence。公共 app/nav/styles import、`src/shared/arcade/{types,session,scoring,storage,challenge-code}.ts`、`src/ui/arcade/{shell,results,assistant,styles}` 归 GPT-6.1-sol 集成代理，本页只消费合同。

## 实施任务

### X1：唯一知识源与 13 项图示映射

**Files:** canonical content/targets、shared target rules、旧 export shim、parts/content、`tests/unit/structure-lab/content.test.ts`。

**Interfaces:** 旧 `ExploreLearningTask/ExploreTargetDefinition` 与旧 exports 签名不变；新 `DiagramPart { id,label,functionLabel,sourceTargetKeys,teachingOnly }`，`DiagramObjective { id,boardId,requiredSocketParts,sourceTaskId,weight }`。模型名和 diagram ID 使用不同字段。

- [ ] RED 测试 `canonical_exports_are_same_objects`；分组 `[4,4,5]`、13 ID 恰好一次；原 review 电池 question 仍 `toBe` 同对象。新 diagram objective 的 `sourceTaskId` 全部存在且一一覆盖 13 task ID，parts 的轮胎只一个定义。
- [ ] 增加 `chassis_requires_suspension_and_brakes`：原 `hasRequiredTargets` 对两个悬架 false，悬架+Brakes true；新 requiredSocketParts 也要求两种功能。`millimeter_is_always_teaching_and_has_no_model_node`：无新 GLB name，parts/result 元信息 teachingOnly true。
- [ ] 运行 `npm run test:unit -- tests/unit/structure-lab/content.test.ts`，确认缺失新 exports FAIL。
- [ ] 移动 canonical 对象与 target pure rules，旧路径 re-export；实现以上 13 表格映射和 3 个 graph 真值表。共享内容无 docs runtime import，不复制原 13 题正文。
- [ ] 运行新内容测试和 `npm run test:unit -- tests/unit/explore/learning-targets.test.ts tests/unit/explore/learning-state.test.ts`，包括现有真实 GLB 名称检查，确认 PASS。

### X2：安装诊断、局部重试与阶段推进

**Files:** activity state、`tests/unit/structure-lab/state.test.ts`。

**Interfaces:** `evaluateDiagramInstall(boardId, installedBySocket, surface:'dry'|'wet', content): readonly { objectiveId, verdict:'correct'|'incorrect'|'incomplete', wrongSocketIds:readonly string[] }[]`；上文 state/reducer/transition。支撑轮胎还需 surface 为 wet；仅 dry 时属于 incomplete，不发错误 fact。用 canonical objective ID 记录，每项40权重仅供共享评分配置读取，不是本地最终分。

- [ ] RED 用例 `correct_install_requires_explicit_check`、`wrong_part_keeps_other_valid_installs`、`empty_sockets_do_not_count_as_wrong`、`chassis_needs_two_functions`、`power_wheel_does_not_autocomplete_surface_wheel`；最后一个用例还断言新台面默认 dry、安装后仍 incomplete、切 wet 再 check 才完成。
- [ ] 运行 `npm run test:unit -- tests/unit/structure-lab/state.test.ts`，观察缺失接口 FAIL。
- [ ] 实现每板安装/check 状态。check 正确项锁定、错项留待替换、缺项提示；全安装正确才显式进入 link。修复同一项只发一次 correct fact。
- [ ] 补 `repeated_check_and_unknown_ids_are_noops`、`explicit_hint_targets_only_one_objective`、`timeout_during_install_is_partial_and_frozen`、`completed_objective_is_read_only_in_both_modes`、`practice_restart_starts_new_run_without_stale_objectives`；重练清空全部组而非仅当前板，不生成撤回fact，运行至 PASS。

### X3：有类型的系统关系与全部完成

**Files:** content/state、state test。

**Interfaces:** `evaluateDiagramGraph(boardId, edges, content): { verdict:'correct'|'incorrect'|'incomplete'; wrongEdgeIds:readonly string[]; missingRelationIds:readonly string[] }`；edge 类型 `{id,sourceId,targetId,relationId}`。`getStructureLabOutcome(state, content)` 返回13图示 topic 状态、3 graph 状态、finishReason、`source:'diagram'`，不自行返回学习能力或持久分数。

- [ ] RED `power_graph_requires_conversion_transmission_and_contact`：battery→wheel 的电能边 wrong；四个必需边 correct。`support_graph_requires_suspension_brakes_and_contact` 和 `perception_graph_requires_five_inputs_then_analysis` 按上述真值表逐边断言。
- [ ] 增加 `wrong_label_direction_and_cross_board_are_rejected`、`duplicate_edge_does_not_advance_revision`、`missing_edge_is_incomplete`、`same_revision_cannot_emit_second_fact`、`continue_waits_for_whole_group`、`partial_outcome_never_reports_model_find`。
- [ ] 运行 state test，确认 graph 接口未实现 FAIL。
- [ ] 实现 connect/remove/check-links 和主动推进；完整 graph 每组只发一次 correct objective fact，该目标权重160，最终分只由共享 scorer计算。支持独立删除错线，不清空已正确安装；最终 result 从 actual state 派生。
- [ ] 运行 content/state 测试至 PASS，13×40+3×160 的配置和为1000；选项/卡片重排不影响真值。

### X4：剖面视图、等价操作与公共比赛适配

**Files:** activity index/diagram-view/view/controller/styles、`tests/e2e/structure-lab.spec.ts`；集成代理将02顶部“结构挑战”注册到`#structure-lab` index view/mount，“拆解与交互”注册到`#explore`。

**Interfaces:** `export const view: string`；`export function mount(host: HTMLElement): ChapterController`；`renderStructureDiagram(host,state,content): void` 只消费判定。controller 由共享 session.ts factory 创建页面拥有的 ArcadeSession，消费共同 shell/results/assistant，subscribe 运行显示，将 facts 一次交 `session.record(facts)`，不创建本地 store。

- [ ] 先写 E2E `keyboard_finishes_install_and_all_three_graphs`、`touch_select_install_connect_is_complete`、`feedback_keeps_valid_parts_and_wrong_edge_can_be_repaired`、`guided_and_standard_share_truth_rules`、`millimeter_is_teaching_everywhere`；同时断言 `practice_score_and_elapsed_are_null`、正式finish/status只取四个统一值、`body_copy_is_at_least_18px`。
- [ ] GPT-6.1-sol 集成代理 route 接入后串行 `npm run build`、`npm run test:e2e -- tests/e2e/structure-lab.spec.ts`，确认旧缺失界面 FAIL 后再实现。
- [ ] SVG 配 DOM button overlay；每 part/socket/port/edge 有名称、方向、功能说明和 focus。鼠标/触屏可 click-select/place/connect，不强制拖动；Tab、Enter/Space 操作，Escape 取消选中，Delete 或明确“移除此关系”按钮等价删线。目标至少44×44，缩小屏幕也保持可点击尺寸。
- [ ] 试运行动画消费已确认状态，600ms 内完成，reduced-motion 静态替代；拖放不计错，关系标签用文字+图标，错误使用 role=status。焦点在局部 render 后保留当前件/下一槽。
- [ ] 接 session.start/record/finish/subscribe/setActive/dispose，scope清理监听/订阅；共同shell/results/assistant显示，不创建第二计时器/store。重练按 finish abandoned（仅旧run仍running）→整轮domain清空→start practice 执行。一般教程无facts，主学习输入守卫active+running。追加 `inactive_and_disposed_input_is_ignored`、`public_timeout_freezes_without_autofill`、`replay_has_new_run_without_duplicate_old_facts`、`practice_restart_finishes_old_run_before_new_start`、`hint_excludes_first_correct_but_keeps_repaired_completion_weight`、`shared_scoring_returns_1000_933_and_992`；重练断言新runId、全部目标零、score/elapsedMs null、旧fact不撤回；分数用共同scorer断言。
- [ ] 在1440×900、768×1024、390×844运行触屏/键盘与reduced-motion；添加`direct_structure_deep_link_loads_no_3d`：新context直接打开`/#structure-lab`，无GLB/旧3D请求、无explore-workbench/model-canvas，游戏教程/HUD/results只在独立host。通过真实UI操作，不直接写状态，运行至PASS。

### X5：旧展厅入口迁移与互不污染回归

**Files:** GPT-6.1-sol 集成代理 协调原 explore controller/view/learning-view 与导航；本计划更新指南和新/旧 E2E 回归。

**Interfaces:** 02顶部“拆解与交互”`#explore` / “结构挑战”`#structure-lab`两个同级子按钮，替换整个主内容，恰好1个可见active页；新controller只拥有独立host，reset不分发原mission/powerflow/assembly action。

- [ ] 写`old_exhibit_retains_original_three_steps_review_and_assembly`、`new_diagram_runs_when_glb_fails`、`new_reset_does_not_change_old_observation_or_mission`、`navigation_and_hidden_continue_monotonic_contest_clock`、`refresh_records_interrupted_unranked_and_never_resumes`、`page_exit_finalizes_once`。追加`top_child_buttons_replace_entire_page`、`back_forward_keeps_exactly_one_visible_page`、`explore_has_no_learning_panel_or_launcher`、`hidden_other_page_is_inert`；旧3D页断言`[data-learning-start]`和`[data-explore-learning]`不存在。双向切按钮/前进后退均恰好1个可见active页，隐藏另页不能输入。旧raycast仍检查真实模型。
- [ ] 集成代理删除旧view/aside的13项启动器、面板和输入，不留下challenge route链接；只由02顶部子按钮/直接route进入新独立页。保留原3步、复习、四步归位、分类/聚焦/开合/灯光/镜头恢复和5秒故事。新host不继承workbench/model-canvas；隐藏另页inert，两页不同时显示。
- [ ] 更新 `docs/development/explore-content.md`：列出单一 canonical、13 topic/图示/模型目标的区别、三个 graph、档位和正式分含义；保留原真实 GLB 与归位事实限制。
- [ ] 运行 `npm run test:unit -- tests/unit/explore tests/unit/structure-lab`；GPT-6.1-sol 集成代理 串行运行 `npm run build`、`npm run test:e2e -- tests/e2e/structure-lab.spec.ts tests/e2e/explore-domain.spec.ts tests/e2e/chapters.spec.ts`，以及调整后的旧学习保留功能用例。
- [ ] 检查新依赖图只指向共享内容/类型/纯规则与 arcade 模块/UI，不加载 old controller/rig/scene/Three。结果每项 source 均 diagram、没有第14个制动任务、没有第二套旧13项运行状态；比较键含活动/challengeCode/profile/contentVersion/scoringVersion/durationMs，刷新中断不排名，记录实际验证输出再交付。

## 交付验收与已锁定的公共依赖

交付先核验整页分离：02顶部两按钮切`#explore`/`#structure-lab`的整个主内容，恰好1个可见active页，隐藏另页inert；旧3D无挑战启动器/面板，新深链不加载3D，教程/HUD/results只在独立host。再核验13主题来源、键盘/触屏完整操作、局部纠错/主动确认、各系统关系、旧3D控制/复习/归位保留及真实本机结果，无虚构模型命中或能力评级。

依赖 GPT-6.1-sol 集成代理 交付共享 arcade 五个运行模块、共同四类 UI、`#structure-lab` 注册和已锁定的 session/view/mount 合同。本页不建立替代公共服务，也不扩大到经营、驾驶或新的3D归位游戏。文档完成一次自查：13主题+3图的1000权重、唯一共享公式、360秒默认、导航继续计时、刷新 interrupted/unranked、双档比较键、旧3步/复习/归位保留和单一13项面板一致；儿童可用性评估后只统一修订时长与版本。

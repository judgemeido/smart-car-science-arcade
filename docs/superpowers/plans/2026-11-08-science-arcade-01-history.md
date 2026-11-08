# 01 汽车进化修复站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 本文件只交付计划；总负责人拥有架构、合同与审查决策，全部产品实施（含共享模块和旧页迁移）由 GPT-6.1-sol 集成代理承担。

**Goal:** 为小学三至六年级新增独立的二维汽车历史游戏页，让学生修复时间轨道、组装需求解决方案、制作未来汽车说明卡，完成一次可复盘的现场挑战。

**Architecture:** `#history-lab` 由 `src/activities/history-lab/` 导出 `view: string` 与 `mount(host: HTMLElement): ChapterController`。每个页面控制器通过共享 factory 创建自己持有的 ArcadeSession，使用公共 UI shell；不导入历史展厅控制器、不使用全局 singleton。历史展厅的 14 件展品保留为同级入口；教学数据提取为唯一共享来源，旧路径 re-export。纯 reducer 判断关卡，共享 session/scoring/storage 负责运行。

**Tech Stack:** 当前项目 TypeScript 5.7、原生 DOM、SVG/CSS、Vite 6、Vitest 4、Playwright 1.56；不增加框架、Three.js、模型、联网 AI 或后端。

**Spec:** [科学游戏总设计](../specs/2026-11-08-science-arcade-design.md)。已有内容依据 `docs/development/history-content.md` 与 `docs/superpowers/specs/2026-11-08-upper-primary-learning-design.md`，旧文档的“五六年级”和“章内学习”设定被本轮“三至六年级、独立活动页”覆盖。

**Status:** 计划未执行；目录、route、运行接口、计分与生命周期合同已锁定。360 秒是设计默认值，正式儿童可用性评估后再统一修订版本和比较键。

## Global Constraints

- 01 手风琴下新增 `#history-lab`“进化修复站”子入口，旧“历史展厅”作为同级子入口保留；公共导航文件不属于本计划所有权。
- 首轮最多三个机制：时间轨道修复、需求方案组装、未来说明卡。主题卡是随操作展开的资料，不新增测验或第四套游戏。
- 比赛默认 360 秒，教程在比赛计时之外；自由练习不计时、不写正式比较记录。时长待真实儿童可用性评估统一调整，当前实现读取共享配置的 360000ms。比赛只比较本浏览器实际保存的记录，不假称跨电脑排行榜。
- 选择 `guided`“带提示” / `standard`“标准挑战”，不默认年级、不采集出生年级。两档使用相同事实、规则、目标和权重；提示密度和干扰项不同，比较键包含档位。
- 比赛后台、hidden、切导航继续使用单调时间；离开入口保留已挂载 run，不能靠切页暂停。刷新和页面退出把 active run 关闭为 interrupted/unranked，不恢复比赛。
- 游戏分只代表本轮操作表现。脚本助手标为“提示助手”；不声称实时大模型、真实学习测评或真实对手，不生成冒充他人的分数。
- 所有学生输入使用 `textContent` / `textarea.value`；开放理由不做质量评分，不因词数、关键词、观点优劣获得游戏分。
- 全部页面正文最小18px；档案资料、任务反馈和结果说明同样适用，不能靠缩字适配窄屏。
- 新页不复制 `src/chapters/history/controller.ts` 或其 DOM；不能 cross-import sibling controllers。共享内容、共享类型和已提取纯规则可以引用。
- 不改现有展品年份、来源、图片说明、授权、占位策略；五张排序卡是中国新能源主题片段，不能标作完整世界汽车史。

## Review Focus

- 未选择、非法 ID、重复卡、越界位置和连续点击提交不会污染有效状态或重复得分，见 H2/H3。
- 键盘、触屏完成同一操作得到同样事件和分数；不能把拖动速度当能力，见 H5。
- 任意当前 run 的已完成目标均只读，可查看旧反馈；修改已完成的槽卡必须重新练习并开启全新 run，不提供单目标撤销完成，见 H2/H4/H5。
- 输入法、表情符号、HTML 字符串不会造成提前提交或脚本执行；理由不阻塞比赛完成，见 H4/H5。
- 切子页、后台、刷新和结束边界遵守公共运行政策；旧展厅的年份位置不被新活动 reset 改动，见 H5/H6。

## 本地证据与保留映射

| 已观察文件 / 当前行为 | 新活动决策 | 保留内容 |
| --- | --- | --- |
| `src/chapters/history/data.ts` 的 `historyExhibits`、`archiveAssets`；`render.ts` 生成时间线和档案 | 只按 `sourceExhibitId` 读取资料摘要，不复制展品数组和图片映射 | 14 件旧展品、年份定位、图片与来源完整保留 |
| `learning-data.ts` 的 5 个 `contextCards` | 改为可点击的资料抽屉和关卡内提示卡 | origin/production/energy/sensing/future 的稳定 ID 和准确限定语 |
| `orderActivity` ID `history-event-order`；五事件初始顺序 2020、2001、2026.03、2009、2015—2016 | 替代旧表单为可修复的五节时间轨道 | 2001、2009、2015—2016、2020、2026.03 的 ID、正确顺序、展品引用 |
| `matchQuestions` 的 `history-efficiency`、`history-cleaner-energy`、`history-complex-road` | 三个方案组装回合，旧选择题 UI 移除 | 题目主题、解释、正确性依据保留；不把旧选项复制成新的题库 |
| `futureActivity` 的四个 `future-*` 选择；原理由 10–120 字，只确认写完 | 变为“人/问题 → 技术能力 → 使用条件”的说明卡；自由理由可选 | 四种价值选择均被接受，不排名；原 sample 可作资料示例 |
| `learning-state.ts` 明确检查有效排列、撤销已改的确认、Unicode 计数 | 提取顺序和文本的纯函数，旧 reducer 保持回归兼容 | 不沿用 `masteredQuestionIds` 作为学习能力标签 |
| `controller.ts` 的普通切章保留、pagehide/dispose 清空学习；`docs/development/history-content.md` 的生命周期说明 | 新活动使用公共比赛生命周期；旧展厅保留自身观察生命周期 | 新页 reset 不操作旧年份；原 scope 清理模式保留 |

旧展厅中整套“主题阅读/三个学习任务”面板迁移到新活动，旧入口替换为指向 `#history-lab` 的链接。旧展厅和新页不能各挂载一套学习运行状态；资料抽屉也由新页持有。旧教学 data 路径只兼容导出，不保存第二份对象；旧纯规则可留给回归测试，但旧学习交互 DOM 不继续运行。

## 具体画面与操作循环

固定顶部显示本站、档位、比赛剩余时间或“自由练习”、三站进度。中间 65% 为大幅二维台面，右侧/移动端底部为资料和脚本助手，操作按钮固定在台面下。颜色采用深蓝工作台、明亮能量色和纸白资料，反馈同时有文字、图标和颜色；部件不是普通表单里的 radio 按钮。

### 机制 1：修复时间轨道，建议约 65 秒

五辆“事件货车”带年份和一句事件摘要，停在错乱的轨道上。学生选一辆，再点“放到第 n 站”，或拖到五个大槽位；移入时其他卡顺移，最后按“检查轨道”。正确顺序开动一辆小车逐站经过，年份、事件和一条资料解释同步出现，仍须主动点击“下一站”。

检查错误时停在第一对时间倒置处，指出具体两张年份的先后，不将错卡扔回起点。资料抽屉可查看关联展品；“给我一个位置提示”显式揭示下一张应移动的卡和目标位置。修好后显示“研究、示范、环境感知与补能建设可以相互支持；不是一种技术消失，另一种才出现”。不要求凭记忆背五个年份，也不把简单日期排序当完整历史理解。

### 机制 2：把需求变成方案，三回合建议约 100 秒

台面切换为工厂/补能站/校门口三幅静态场景，需求和结果可见；每回合都使用相同规则“选模块 → 放入关系槽 → 试运行”，不是选一个答案后读对错。

| objective ID | 操作与接受的关系 | 试运行反馈 |
| --- | --- | --- |
| `history-efficiency` | 将“分步骤加工 → 连续工序配合”模块放在生产流程两个槽，建立方向；带提示只有这两张和车灯/颜色干扰，标准档增加“每人独自从头做完” | 正确时半成品沿工位流动；错误时指出选中的模块改变外观或缺少工序配合，不宣称虚构真实产量倍数 |
| `history-cleaner-energy` | 在纯电、混合动力、氢燃料电池三个可切换教学方案中任选一条，在“来源/转化/运动”三槽补齐方案；具体模块见下表，切换方案不重新得分 | 路径显示“储存/转化/运动”，明确多方案并存；完成后固定说明还需考虑能源来源、制造和使用条件，不产生虚构排放百分比 |
| `history-complex-road` | 摄像头或雷达输入→计算分析→合适行动，三个槽；需将已有“观察设备与计算系统配合”概念拆成实际步骤 | 正确时道路信息传入分析区，再出现“提醒/减速”；仅接观察设备不会直接使车自动安全，不承诺零事故 |

三回合的角色、卡片和条件由内容表定义；能量方案的分支是同一组装机制，不新建驾驶/经营模拟。错误保留已装模块，指出首个不成立的关系和原因，学生只需替换相关槽。试运行是提交边界，拖放过程中不扣分；每回合正确后读反馈，再主动继续。

能量回合三个槽固定为 `energy-source/energy-conversion/energy-motion`，接受以下完整路径，不要求画出未教学的内部线束或全部混动架构：

| plan ID | source module | conversion module | motion module |
| --- | --- | --- | --- |
| `energy-plan-battery` | `energy-source-battery`：电池里的电能 | `energy-convert-motor`：电机把电能变成转动 | `energy-motion-wheel`：传动配合车轮运动 |
| `energy-plan-hybrid` | `energy-source-hybrid`：燃油与电池的电能 | `energy-convert-hybrid`：发动机与电机按方案配合 | 同一 `energy-motion-wheel` |
| `energy-plan-hydrogen` | `energy-source-hydrogen`：氢与氧参与反应 | `energy-convert-fuelcell`：燃料电池发电，再由电机转动 | 同一 `energy-motion-wheel` |

三种 plan 的卡不是三道单选题。学生选一种要探索的方案，亲手把来源、转化和运动连贯放进三个槽；只有该方案完整一致才确认，同一个 `history-cleaner-energy` objective 不因切换或探索全部方案多得分。混动模块标“组合示意，不代表所有混动车型的同一种内部结构”。

### 机制 3：造一张能解释的未来汽车卡，建议约 55 秒

学生在小车侧面选择能力徽章，再挑“帮助谁/解决什么问题”情境与“还需要什么条件”卡；三槽同时展示一句可读解释。四组基础合法关系：`future-safety`→学校附近行人/可靠探测与合适行动；`future-energy`→补能不便的出行者/补能设施与能源条件；`future-accessibility`→不同乘坐需要的人/适合的入口与人机界面；`future-comfort`→乘坐者/路况与悬架座舱等配合。每组两张情境写法可选，能力之间不排名。

按“保存说明卡”只核验三张选卡属于已公布的合法关系。错误例如把“补能方便”配成“所有道路风险消失”，显示关系为何不成立，并保留选择供替换。成功显示三槽说明和“这是你的设计选择，游戏没有评价你的观点优劣”。开放理由 0–120 Unicode 字可选，空白也完成；超过 120 字保留原文并提示精简/不附理由，不能因此卡住比赛。标准档鼓励写“因为…还需要…”，但分数和完成条件相同。

共享 `src/ui/arcade/assistant` 只根据当前 stage、首个错误和 hint 次数选择固定台词，不假装理解自由文本。教程约 20 秒，提供一张与正式事件不同的练习卡让学生完成“选卡→放槽→检查”；一般教程反馈不计时、不计分、不发 objective facts。主学习关卡的检查才产生计分事实；教程结束再启动练习或比赛 session。随时可看操作说明，连对效果只产生装饰火花，不加分。

## 状态机与接口

本地阶段：`briefing → tutorial → timeline → timeline-feedback → needs(0..2) → needs-feedback → future → result`。错误反馈是对应阶段的子状态，关闭反馈回到同一草稿；正确反馈只由主动 `continue` 推进。公共 timeout 可从任意比赛阶段进入只读 result，未完成项写“未完成”；不能自动补齐未来卡。

```ts
type HistoryLabProfile = 'guided' | 'standard';
type HistoryLabMode = 'practice' | 'contest';
type HistoryLabStage = 'briefing' | 'tutorial' | 'timeline' | 'needs' | 'future' | 'result';
interface HistoryLabConfig {
  readonly mode: HistoryLabMode;
  readonly profile: HistoryLabProfile;
  readonly challengeCode: string;
  readonly contentVersion: string;
}
interface HistoryObjectiveFact {
  readonly objectiveId: string;
  readonly revision: number;
  readonly verdict: 'correct' | 'incorrect';
  readonly usedHint: boolean;
}
interface HistoryLabTransition {
  readonly state: HistoryLabState;
  readonly facts: readonly HistoryObjectiveFact[];
}
createHistoryLabState(config: HistoryLabConfig, content: HistoryLabContent): HistoryLabState;
reduceHistoryLab(state: HistoryLabState, action: HistoryLabAction, content: HistoryLabContent): HistoryLabTransition;
```

`HistoryLabState` 只包含 config、stage、feedback、timelineOrder、needsRoundIndex、slotsByObjective、futureChoiceId/claimSlots/reason、revisionByObjective、lastCheckedRevision、completedObjectiveIds、hintedObjectiveIds。所有完成状态由有效确认派生，不再保存另一份总分或“知识掌握”。`HistoryLabAction` 是 `start/tutorial-complete`、`move-event {cardId,toIndex}`、`place-module {objectiveId,slotId,moduleId}`、`select-energy-plan {planId}`、`choose-future {choiceId}`、`place-claim {slotId,cardId}`、`edit-reason {value}`、`check`、`hint`、`continue`、`finish {reason:'completed'|'timeout'|'abandoned'|'interrupted'}`、`reset-practice`。正式 finish/status 名称统一为这四个值。

- 只有有效实质草稿编辑递增该 objective revision；未知 ID、同位置移动、重复不变的检查和 incomplete 检查不递增 revision、不发 fact。session.record 内部绑定 runId/seq，草稿 revision 不能充当全局序号。
- 错误 `check` 产出 incorrect fact；成功第一次产出 correct fact。同一 objective 在比赛和练习的当前 run 中完成后均锁定；只能回看反馈，不能单项撤回确认或删除共享事实。
- 未完成的未来草稿修改能力选择时清空对应情境/条件槽与检查反馈；四种选择的合法关系都同等接受。完成后的槽卡只读。未来自由理由不改变关系、不产生 fact；当前结果屏显示最后原始理由，理由只属于内存 outcome，不写共同分数历史，下一轮或刷新清空。
- `reset-practice` 重置的是整轮：若旧练习 session 仍 running，先 `session.finish('abandoned')`；再用 `createHistoryLabState` 清空全部目标/草稿/理由，调用 `session.start(practice config)` 开始零目标的新 run。已结束的旧 session 不重复 finish。不提供单目标 uncompletion API，练习 `score/elapsedMs` 始终为 null。
- result 中不再接受 gameplay action；主关卡输入同时要求页面 active 与 session running。开始前只显示未计分预览/教程，不向 recorder 写事实。切页 inactive 不分发输入但比赛时钟继续；纯 reducer 不读取时间/DOM/localStorage。

## 锁定的权重、计分与公共运行合同

五个 objective 权重：`history-event-order` 400；三个 `history-*` 需求各 100；`history-future-choice` 300，总计 1000。这些数是内容权重，不是每项最终分。只对主关卡有效检查发事实，不对阅读、拖动次数、文本、教程或动画得分。

共享 `src/shared/arcade/scoring.ts` 使用唯一公式：`score = floor(.7 * earnedWeight) + floor(.2 * firstCorrectWeight) + (completed ? floor(100 * clamp((360000 - elapsedMs) / 180000, 0, 1)) : 0)`。`earnedWeight` 是最终正确完成的目标权重，纠错仍可获得完整 70% 贡献；每项第一次有效检查决定首次正确资格，首次错误或首次正确前使用显式提示均不进入 `firstCorrectWeight`。常驻操作说明不是提示。连对只有装饰火花，不加分；完成前没有速度奖励。全部首次正确且180秒内完成为1000分，300秒完成为933分；400权重的时间轨道先错后纠正且180秒内全完成为920分。

上述公式只用于正式比赛；练习结果的 `score` 与 `elapsedMs` 均为 `null`，不能把0分或0ms伪装成练习成绩，练习不进入比较记录。

`HistoryObjectiveFact` 保持 `{objectiveId,revision,verdict,usedHint}`；`session.record(facts)` 的公共适配器内部绑定 runId/seq 并去重，页面不设置运行事件 ID。提示使用保留在该 objective 的 `usedHint` 中，修复后正确 fact 仍带该值。不把 nickname、reason 或字数传入计分器。

运行与比较使用 `src/shared/arcade/{types,session,scoring,storage,challenge-code}.ts`，界面使用 `src/ui/arcade/{shell,results,assistant,styles}`。`challenge-code` 决定稳定卡序，比较键精确为 `activityId + challengeCode + profile + contentVersion + scoringVersion + durationMs`。本页 `activityId` 为 `history-lab`。每个控制器由共享 factory 创建一个页面拥有的 session，调用 `session.start(config)`、`session.record(facts)`、`session.finish(reason)`、`session.subscribe(listener)`、`session.setActive(active)`、`session.dispose()`；共享拥有时钟、去重和一次性 finalize，没有全局 singleton 或第二份 store。

session.start 在教程结束、选择练习/比赛后调用；session.subscribe 驱动共同 shell 的时间和结果。后台、hidden、导航切换继续单调时钟，setActive 只控制主关卡输入；已挂载 run 随导航保留。刷新/页面退出记 interrupted/unranked，下一次挂载从预览开始、不恢复比赛。超时保留真实部分结果，未完整的说明卡不冒充完成；结果由共同 results 显示五项状态、实际分、用时、档位、说明卡、再练/再赛/返回展厅与真实本机历史。每台电脑只能见自己的记录，现场同学展示实际结果屏供人工比较。

## 文件所有权

| 文件 | 职责 / 修改边界 |
| --- | --- |
| Create `src/content/history-learning.ts` | 从旧 learning-data 原样提取 canonical 教学对象和类型 |
| Modify `src/chapters/history/learning-data.ts` | 仅 re-export canonical exports |
| Create `src/shared/history-learning-rules.ts` | 提取排列验证/移动/比较和 Unicode 计数，不依赖 DOM |
| Modify `src/chapters/history/learning-state.ts` | 使用提取规则，保持旧签名和原回归测试 |
| Create `src/activities/history-lab/content.ts` | 组装链/合法说明关系/教程与档位，引用 canonical ID 与反馈，不复制史料 |
| Create `src/activities/history-lab/state.ts` | 唯一游戏 reducer 与 fact，完整状态机 |
| Create `src/activities/history-lab/view.ts`、`styles.css` | 静态页壳、局部状态 render、SVG 台面与文本资料 |
| Create `src/activities/history-lab/controller.ts` | host scope 输入、焦点、pointer 与键盘等价适配、公共运行接口 |
| Create `src/activities/history-lab/index.ts` | 只导出 `view: string` 和 `mount(host: HTMLElement): ChapterController` 供活动加载 |
| Modify `src/chapters/history/controller.ts`、`view.ts`、`learning-view.ts` | GPT-6.1-sol 集成代理移除旧学习挂载/替换 route 链接；保留 gallery 控制路径，不由新活动文件引用 |
| Create `tests/unit/history-lab/content.test.ts`、`state.test.ts`；`tests/e2e/history-lab.spec.ts` | 本地规则、真实输入和旧页保留回归 |
| Modify `docs/development/history-content.md` | 唯一内容源、独立入口、计分性质与档位维护说明 |

公共 `src/app/*`、全局样式导入、导航、活动注册、`src/shared/arcade/{types,session,scoring,storage,challenge-code}.ts` 与 `src/ui/arcade/{shell,results,assistant,styles}` 的架构、合同和审查由总负责人决策，产品实施全部由 GPT-6.1-sol 集成代理承担。本活动只消费共享合同，不写第二份运行、计分、store 或通用结果/助手组件。

## 实施任务

### H1：提取唯一内容与可复用规则

**Files:** canonical history content、共享纯规则、旧 data/state shim，`tests/unit/history-lab/content.test.ts`。

**Interfaces:** `historyLearningContent: HistoryLearningContent` 保持当前结构；共享导出 `isValidHistoryOrder(order,cardIds): boolean`、`moveHistoryOrder(order,cardId,toIndex): readonly string[]`、`hasCorrectHistoryOrder(order,correctOrder): boolean`、`countReasonCharacters(value): number`。数组输入只读，非法移动返回原数组。

- [ ] 添加 RED 测试：旧路径和 canonical 对象 `toBe` 相同；5 卡 ID/年份/正确序列及 exhibit 引用不变；全部 14 个展品仍存在。顺序函数拒绝重复、缺卡、unknown、-1、5、1.5、NaN；`汽车🚗` 计数为 3。
- [ ] 运行 `npm run test:unit -- tests/unit/history-lab/content.test.ts`，确认新导出缺失产生 FAIL。
- [ ] 移动唯一教学对象，旧路径 re-export；提取纯函数后让旧 reducer 消费，不能复制正文或改原完成判定。
- [ ] 运行新测试和 `npm run test:unit -- tests/unit/history`；两者通过后由负责人保存变更。

### H2：时间轨道与主动推进

**Files:** activity content/state、`tests/unit/history-lab/state.test.ts`。

**Interfaces:** 上述 `createHistoryLabState/reduceHistoryLab`；`HistoryLabContent` 记录 stable objective/slot/module ID 与版本；H2 先支持 tutorial/timeline/check/hint/continue/finish。

- [ ] 写 RED 用例 `timeline_requires_check_and_continue`：五卡移至正确顺序前不完成，check 发一次 `history-event-order` correct fact，stage 仍 timeline；continue 才进入 needs。`invalid_and_repeated_actions_are_noops` 覆盖非法位置/ID、同 revision check；`timeout_freezes_partial_state` 覆盖任何阶段结果冻结。
- [ ] 运行 `npm run test:unit -- tests/unit/history-lab/state.test.ts`，观察缺失接口 FAIL。
- [ ] 实现 reducer，固定旧五卡 ID 和原初始错序；共享 challenge-code 只固定干扰卡显示顺序，不改变答案。错误反馈带第一对倒置 card ID，不提前正确确认。
- [ ] 同文件补 `practice_restart_starts_new_run_without_stale_objectives`、`completed_objective_is_read_only_in_both_modes` 与正确后连点 continue 不跳过下一回合的断言；reset-practice 清空整轮目标和理由，不生成撤回 fact，运行至 PASS。

### H3：需求方案台的关系表与试运行

**Files:** activity content/state/view/styles，state test。

**Interfaces:** `evaluateHistoryArrangement(objectiveId, slots, content): { verdict:'correct'|'incorrect'|'incomplete'; invalidRelationId?:string }`；合法方案按稳定 plan/module/slot ID 校验，展示顺序不参与正确性。

- [ ] RED 测试 `production_requires_ordered_cooperation`、`three_energy_plans_each_have_valid_complete_path`、`perception_cannot_skip_analysis_or_action`，每组断言错误关系 ID 与修复后 correct；不完整输入仅提示，不生成 incorrect fact。
- [ ] 运行 state test，确认新评价函数缺失 FAIL。
- [ ] 内容表实现三个需求关系和固定因果说明；燃料分支最多三种明确教学链，不加入额外经营数值。state 支持 place/select/check/continue，正确后一次 fact、一次主动推进。
- [ ] 实现三幅台面与局部试运行表现；render 消费判定结果，不自己判答案；reduced-motion 直接显示静态箭头和说明。
- [ ] 补重复 check、错误后仅换一槽、未完成时改变能量方案清空草稿反馈、完成后方案只读、未知 slot/module、干扰项显示重排等测试，运行至 PASS。

### H4：未来说明卡与真实完成结果

**Files:** activity content/state/view、state test。

**Interfaces:** `evaluateFutureClaim(choiceId, claimSlots, content): 'correct'|'incorrect'|'incomplete'`；四种能力关系都可合法完成。`getHistoryLabOutcome(state, content): { completedObjectiveIds:readonly string[]; futureClaim:readonly string[]|null; reason:string; finishReason:'completed'|'timeout'|'abandoned'|'interrupted' }` 不返回“学习能力”结论或本地总分。

- [ ] RED 测试 `all_four_values_can_finish_with_compatible_claims`、`claim_mismatch_has_retry_without_erasing_draft`、`empty_reason_does_not_block_completion`、`reason_never_changes_objective_facts`、`partial_outcome_never_claims_completed_card`。
- [ ] 运行 state test，确认缺失接口 FAIL。
- [ ] 实现三槽、可选原始理由与 fixed-copy 助手；保留120字提示但不截断、不因未附理由扣分。完成/超时成果读取内存 outcome；当前结果屏显示理由，共同分数历史不保存理由，新一轮或刷新清空。
- [ ] outcome 测试通过；`<img onerror=...>`、emoji、组合输入的真实 DOM 用例归 H5。

### H5：独立页面、三种输入与运行事件适配

**Files:** activity index/view/controller/styles、`tests/e2e/history-lab.spec.ts`；活动注册由 GPT-6.1-sol 集成代理 将 `#history-lab` 接到 index 的 view/mount。

**Interfaces:** `export const view: string`；`export function mount(host: HTMLElement): ChapterController`。controller 使用共享 session.ts 的 factory 创建页面拥有的 ArcadeSession，使用共同 shell/results/assistant，subscribe 读取运行状态，将 reducer facts 一次交给 `session.record(facts)`；不自行操作 localStorage。

- [ ] 先写 E2E `keyboard_finishes_all_three_mechanics`、`touch_select_then_place_matches_pointer`、`tutorial_does_not_start_clock_or_score`、`readable_feedback_waits_for_continue`、`inactive_input_and_disposed_listeners_are_ignored`；同时断言 `practice_score_and_elapsed_are_null`、正式finish/status只取四个统一值、`body_copy_is_at_least_18px`。
- [ ] 公共路由接入后运行 `npm run build` 与 `npm run test:e2e -- tests/e2e/history-lab.spec.ts`，确认未实现界面 FAIL；构建调度由 GPT-6.1-sol 集成代理 串行安排。
- [ ] pointer 拖放和 click-select/drop 都产生同一 action。键盘 Tab 选卡/槽、Enter/Space 操作、Escape 取消选择；选卡后播报卡名与目标位置，移动后焦点保留。目标最小 44×44，移动端单列，不用颜色或 hover 单独传意。
- [ ] 接 session.start/record/finish/subscribe/setActive/dispose 与共同结果；scope 清理全部监听和订阅，无自建比赛 tick/store。重新练习按 finish abandoned（仅旧run仍running）→整轮domain清空→start practice 顺序执行，不能删除单项共享事实。预览/教程无计分事实，主关卡输入守卫 active+running。组合输入期间不触发表单提交；理由用 value，当前结果用 textContent。
- [ ] 补 `ime_and_html_reason_are_safe`、`both_profiles_have_identical_objectives_and_truth_rules`、`hint_excludes_first_correct_but_correction_keeps_completion_weight`、`shared_scoring_returns_1000_933_and_920`、`replay_cannot_duplicate_score`、`practice_restart_finishes_old_run_before_new_start`、`reason_is_not_in_common_history_and_clears_on_new_run_or_refresh`；重练断言新runId、零目标、score/elapsedMs null，旧fact不撤回。分数断言消费共同 scorer。检查1440×900、768×1024、390×844与 reduced-motion，运行至 PASS。

### H6：迁移旧学习入口并回归旧展厅

**Files:** GPT-6.1-sol 集成代理 协调旧 controller/view/learning-view 和导航；本计划拥有开发指南与 history-lab E2E 保留断言。

**Interfaces:** `#history-lab` 和原历史展厅同级 route；旧 gallery 只保留自身状态，新页没有 old controller 引用。

- [ ] 先添加 `old_gallery_retains_fourteen_exhibits_and_year_selection`、`new_reset_does_not_change_gallery_selection`、`only_one_learning_surface_is_mounted`、`navigation_and_hidden_continue_monotonic_contest_clock`、`refresh_records_interrupted_unranked_and_never_resumes`、`page_exit_finalizes_once`；切页返回保留 mounted run，不能用 setActive 暂停时钟，刷新后的历史记录不排名。
- [ ] GPT-6.1-sol 集成代理 移除整套旧主题阅读/学习面板及其挂载，旧入口变 `#history-lab` 链接；保留展品 render、图片处理和原 scroll/year listeners。更新历史指南至三至六年级及新文件维护映射。
- [ ] 运行 `npm run test:unit -- tests/unit/history tests/unit/history-lab`；GPT-6.1-sol 集成代理 再运行 `npm run build`、`npm run test:e2e -- tests/e2e/history-lab.spec.ts tests/e2e/history-domain.spec.ts tests/e2e/chapters.spec.ts`。迁移后的旧 learning E2E 只保留内容/规则覆盖或调整为新 route，不继续验收已移除的旧 UI。
- [ ] 核对新活动依赖图没有 Three、旧 controller 或 docs runtime import；所有 objective 权重累计1000，比较键含活动/challengeCode/profile/contentVersion/scoringVersion/durationMs，比较记录只来自实际 session storage。通过证据写入交付记录，不把计划命令当已通过。

## 交付验收与已锁定的公共依赖

完成标准是：三个机制全程真实可操作；错误能看懂并局部重试；两档同一规则；键盘/触屏可完成；五项实际确认只计一次；未来观点不做质量评分；旧 14 展品仍可进入；新页和旧页没有重复学习运行实例。

依赖 GPT-6.1-sol 集成代理 交付共享 arcade 五个运行模块、共同四类 UI、`#history-lab` 导航注册，以及已锁定的 session/view/mount 合同。本计划不提供替代实现。文档已完成一次自查：权重/公式、360秒默认、导航继续计时、刷新 interrupted/unranked、双档比较键、单一学习面板和全部状态接口一致；后续真实儿童测试只统一修订默认时长和版本，不在单页擅改计分。

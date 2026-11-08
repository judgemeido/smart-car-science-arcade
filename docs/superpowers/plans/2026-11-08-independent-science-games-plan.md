# 01–03 独立科普游戏页面改造 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. root只负责核心方案、接口与验收；产品实现由GPT-6.1-sol完成。本轮交付Plan，不开始产品代码。

**Goal:** 将01主题卡、02结构挑战、03传感器实验室改为三款有独立HTML入口的二维科学游戏，学生点击顶部导航按钮后跳转到新页面操作。

**Architecture:** Vite多页面构建：原主站保留四个展厅；三个游戏有各自HTML/main入口。纯导航元数据与共同游戏能力复用，页面运行实例互相独立。游戏知识、规则、画面与存储分离。

**Tech Stack:** 现有TypeScript/Vite，HTML/CSS、SVG为主，局部Canvas；Vitest与Playwright。暂不增加Phaser、UI框架、后端或在线AI依赖。

**Spec:** 本文件第1–6节即当前设计规范，替代已从工作区删除的旧总Plan/设计稿。既有三个详细游戏子计划继续使用，本版的独立HTML入口和跨页面生命周期优先于旧hash活动方案。

## Global Constraints

- 面向三至六年级；每人一台电脑，本地记录，同题挑战码与真实成绩卡供现场比较。
- 三个按钮分别跳转三个独立HTML页面，当前标签页导航，不在原展厅内嵌游戏、弹窗或同时显示两个工作台。
- 原主站四章仍为01–04；手风琴仅组织顶部入口。01、02、03各两项；04保留原道路体验。
- 正式局360000ms；练习不限时；默认时长和档位需真实儿童试玩验证。
- UI正文/按钮至少18px、操作目标至少44×44px，拖动有点击/键盘等效操作。
- root不接管游戏产品实现；共享文件由一位6.1-sol集成智能体负责，三个游戏可并行实现。

## Review Focus

- 点击游戏入口确实发生文档导航；独立刷新成功；原3D资源不进入游戏依赖（任务A、E）。
- 重复提交、空槽、提示后纠错、输入法不能导致刷分或丢失有效操作（任务B、D）。
- 浏览器隐藏继续正式计时；跳到另一HTML/退出/刷新终止本局；回退不恢复正式局（任务B、E）。
- 本地存储不可用/损坏/第二标签页出现时仍可玩，不自动中断另一窗口，不假称已保存（任务B、E）。
- 显示的图示关系、距离刻度和判分来自同一状态；旧展厅原交互仍可使用（任务D、E）。

## 1. 页面和导航

以下为站点根路径示例；部署在子目录时统一通过BASE_URL生成链接，不能散落硬编码。

| 顶部章节 | 按钮一：原展厅 | 按钮二：独立游戏 |
| --- | --- | --- |
| 01 发展历史 | `index.html#history`：发展历史 | `games/history/index.html`：主题卡 |
| 02 结构展厅 | `index.html#explore`：拆解与交互 | `games/structure/index.html`：结构挑战 |
| 03 激光雷达 | `index.html#lidar`：感知原理互动展 | `games/sensor/index.html`：传感器实验室 |
| 04 安全上路 | `index.html#traffic`：道路规则体验 | 无新增游戏 |

顶部四组手风琴的组头只展开/收起入口按钮；子项为按钮外观的真实链接，浏览器正常导航。当前所属组自动展开，当前项高亮；移动端纵向展开，支持Tab/Enter/Escape与明确焦点。总章数仍显示04。

每个游戏HTML只加载本游戏入口、共同导航、共同UI及规则/记录服务。不得调用原主站bootstrap，也不得把三个游戏view同时插入原index.html后隐藏切换。各游戏含自己的开始、教程、完整操作台、反馈、结算与“返回展厅”。旧展厅的新增学习面板及其输入分支移除；尤其02删除原aside里的13项挑战启动器与面板，原模型控制/复习/归位留在原展厅。

## 2. 三款游戏

| 游戏 | 操作循环 | 必须可见的反馈 | 保留的科普内容 |
| --- | --- | --- | --- |
| 01 进化修复站 | 排回五节历史时间轨道 → 在工厂/补能/道路场景组装需求与技术关系 → 拼未来汽车的用途/能力/条件说明卡 | 事件车沿修好轨道运行；正确连通后显示生产/能量/信息流；错项局部修正 | 五主题卡、历史顺序、需求驱动与多种技术并存；开放理由不评优劣 |
| 02 系统维修台 | 在动力/支撑/感知三张二维剖面中补装部件 → 连接带方向和语义的功能关系 → 试运行 | 电机/齿轮转动、悬架活动、轮胎接触路面、传感器证据进入分析区；错件错线可单独替换 | 原13个主题全部映射；辨认部件与解释配合；毫米波等图示不冒充真实模型节点 |
| 03 回波侦探 | 转发射器并接收回波 → 扫描形成轮廓并移动距离尺 → 雨雾中配合传感器证据与观察行动 | 发射/回波路径、距离/往返光程、扫描轮廓、天气导致的证据缺失可见 | 光程与距离、点组成轮廓、不同传感器作用与局限；六张设备卡进入资料抽屉 |

每页两至三个核心机制；关卡循环统一为“短目标→操作对象→试运行→看到原因→修正→主动继续”。成功由排列、装配、连线或测量状态决定；点击一个选项后直接显示对错不算完成游戏化。失败保留正确部分，提示下一步可修正动作。

guided（引导，建议三四年级）与standard（标准，建议五六年级）保留同一科学事实，改变提示密度、干扰项和已公布的输入容差，分别比较。教程在正式计时外；练习不限时。初步目标为每款约3–6分钟，需试玩调整。

详细方案：[01](2026-11-08-science-arcade-01-history.md)、[02](2026-11-08-science-arcade-02-structure.md)、[03](2026-11-08-science-arcade-03-sensor.md)。它们负责具体内容ID、游戏reducer、图形对象和关卡验收，本文件控制接入与共同边界。

## 3. 高品质二维UI方向

采用“彩色科学游乐场＋插画实验桌”：纸白/浅蓝背景、深蓝文字、钴蓝主操作、青绿成功、橙黄能量与奖励。原创SVG绘制可辨认的汽车、零件、仪器，统一描边、形状、层次和有限阴影；主体具有真实操作对象的形态。

屏幕中央约60–70%给游戏舞台，顶部是一句任务和精简进度/计时，下方工具托盘；长科普说明放资料抽屉。01呈轨道与卡牌，02呈汽车剖面与接口，03呈测试场与测量仪表，三页不套同一种卡片网格。1366×768、1440×900能看见主操作；窄屏分区堆叠。

落位、连通、回波、纠错和完成才触发重点动效；声音默认关闭且可主动开启。脚本角色称“提示助手”，根据本局状态给短反馈；可做徽章和连对动画，但不伪称真实AI或生成虚构同学成绩。减少动画模式保留静态因果反馈。

先做03的一个真实可玩片段，以初始/错误/成功/结算截图与实际操作确定质感，再按同一视觉规范扩展三页。

## 4. 采用的GitHub SKILL

技能正文已读取并用于本次规划；frontend-design在本地可用，Game Studio技能尚未安装。实施者按固定来源读取工作流。SKILL是开发指引，不是给儿童展示的功能或产品依赖。

| 技能与固定GitHub来源 | 本方案中的用途 |
| --- | --- |
| [frontend-design](https://github.com/anthropics/skills/blob/2c5958ecac7cee2b583967a2c4981d0f4a75c579/skills/frontend-design/SKILL.md) | 原创视觉语言、排版、配色、构图与完成度 |
| [web-game-foundations](https://github.com/openai/plugins/blob/d420d13051bffe4543ed39e30fa46b87148e47dd/plugins/game-studio/skills/web-game-foundations/SKILL.md) | 玩家动作、规则/渲染分离、输入映射、保存与生命周期边界 |
| [game-ui-frontend](https://github.com/openai/plugins/blob/d420d13051bffe4543ed39e30fa46b87148e47dd/plugins/game-studio/skills/game-ui-frontend/SKILL.md) | 游戏舞台、HUD、工具托盘、开始/结算与有意义的动效 |
| [game-playtest](https://github.com/openai/plugins/blob/d420d13051bffe4543ed39e30fa46b87148e47dd/plugins/game-studio/skills/game-playtest/SKILL.md) | 真实操作、错误修复、截图观察、浏览器交互验收 |
| [phaser-2d-game](https://github.com/openai/plugins/blob/d420d13051bffe4543ed39e30fa46b87148e47dd/plugins/game-studio/skills/phaser-2d-game/SKILL.md)（备选） | 仅在连续角色移动/大量精灵/碰撞玩法证明需要引擎时启用 |

本期选DOM/SVG＋局部Canvas，是针对摆放、连线、测量和可访问性作出的项目选择；覆盖Game Studio对一般2D游戏的Phaser默认，不把此选择冒充技能原文。完整来源、许可证核验与选型依据在[技能附录](../../engineering/2026-11-08-science-arcade-skills.md)。

## 5. 本地比赛与生命周期

每款满分1000：完成贡献最多700，首次正确最多200，全部完成后的时间奖励最多100；纠错仍得完成贡献，提示前后分项可解释。权重E/F分别为完成/无答案提示且首次确认正确的权重，总权重1000：`floor(.7*E)+floor(.2*F)+(全部完成?floor(100*clamp((360000-t)/180000,0,1)):0)`。练习score/elapsedMs为null。详见[计分附录](../../engineering/2026-11-08-science-arcade-scoring.md)。

各电脑输入同一挑战码，同游戏/档位/内容版本/评分版本/时长才可比。展示实际成绩、分项、挑战码与用时，存本机历史，现场人工核对；不做自动班级联网榜。首次正式尝试保留，重新练习不覆盖正式成绩；老师换轮次码再赛。没有真实学业评价或防作弊认证承诺。

**本版独立HTML会发生文档离开：** 同一游戏页面内隐藏浏览器/暂停动效，正式计时继续；点击导航去展厅/其他游戏、刷新或pagehide（含BFCache）时，该局记interrupted且不作为有效竞赛成绩。界面在开始前说明“离开游戏页面会结束本次挑战”。回退/重新访问进入准备页，不恢复正式局；已完成成绩已存本地。旧四展厅自身hash导航仍保留原语义。

localStorage键仍为`science-arcade:local:v1`，同origin可共享三个游戏的本机历史。不同电脑不同步；不同浏览器/主机/端口隔离。保存失败仍展示当前成绩并标未保存。新文档启动只报告已有activeDraft，不自动杀掉另一标签页；明确点击“结束未完成挑战”才按expectedRunId处理。删除只作用本键。

## 6. 核心技术合同与目录

```text
index.html                         原四展厅
games/{history,structure,sensor}/index.html  三个独立HTML
src/app/navigation-items.ts        纯导航元数据，四组七个链接
src/ui/chapter-navigation.ts       共同手风琴，仅操作导航
src/activities/bootstrap.ts        独立游戏装配与page生命周期
src/activities/{history-lab,structure-lab,sensor-lab}/
  main.ts / index.ts / view.ts / controller.ts / state.ts / content.ts / styles.css
src/shared/arcade/                 types/session/scoring/storage/challenge-code
src/ui/arcade/                     shell/results/assistant/styles
src/content/                      唯一教学内容来源
```

`src/app/chapters.ts`仍只注册旧四个展厅及其runtime。`navigation-items.ts`只含number/title/label/相对href，不导入任意controller/view。`vite.config.ts`配置四个HTML构建入口；所有游戏HTML从自己的main启动，不调用旧app/bootstrap。共享bundle可以复用，但没有跨文档运行实例共享。

新游戏链接不用原主站的`data-go`路由事件标记；采用真实href和独立导航选择器，旧click代理不得preventDefault后把它回退到history。验收必须断言pathname和文档入口已改变，不能仅看到按钮高亮就算跳页成功。

`src/activities/bootstrap.ts`导出`bootstrapActivity(root:HTMLElement,definition:ActivityDefinition):{dispose():void}`；ActivityDefinition包含`activityId,title,galleryHref,view,mount`。它装配本游戏独立host和共同导航、处理pagehide/visibilitychange/pageshow；BFCache恢复把中断局呈现为准备/中断说明，不能复活run。游戏继续导出`view:string`和`mount(host:HTMLElement):ChapterController`，接口`setActive(boolean)/dispose()`保持。业务activityId仍为history-lab/structure-lab/sensor-lab，**不作为路由**。

公共types固定如下；计分附录直接引用，子页不得另定义不兼容版本：

```ts
type ActivityId = 'history-lab'|'structure-lab'|'sensor-lab';
type Profile = 'guided'|'standard';
type FinishReason = 'completed'|'timeout'|'abandoned'|'interrupted';
interface DomainFact { objectiveId:string; revision:number; verdict:'correct'|'incorrect'; usedHint:boolean }
interface ObjectiveProgress { id:string; weight:number; completed:boolean; firstCorrect:boolean; usedHint:boolean }
interface ArcadeRunConfig {
  activityId:ActivityId; mode:'practice'|'contest'; profile:Profile;
  challengeCode:string; contentVersion:string; scoringVersion:string;
  durationMs:360000|null; slotId:string; nickname:string;
  objectives:readonly {id:string;weight:number}[];
}
interface ArcadeScore { progress:number; quality:number; efficiency:number; total:number }
interface ArcadeResult {
  runId:string; config:ArcadeRunConfig; status:FinishReason; eligible:boolean;
  elapsedMs:number|null; objectives:readonly ObjectiveProgress[];
  score:ArcadeScore|null; createdEpochMs:number;
}
interface ArcadeSnapshot {
  phase:'idle'|'running'|'finished'; runId:string|null; config:ArcadeRunConfig|null;
  elapsedMs:number|null; remainingMs:number|null; objectives:readonly ObjectiveProgress[];
  result:ArcadeResult|null; persistence:'saved'|'memory-only'|'read-only';
}
type StartResult = {ok:true;runId:string}|{ok:false;reason:'invalid-config'|'already-running'|'attempt-used'|'other-run-active'|'capacity-full'};
interface ArcadeSession {
  start(config:ArcadeRunConfig):StartResult; record(facts:readonly DomainFact[]):boolean;
  finish(reason:FinishReason):ArcadeResult|null;
  subscribe(listener:(snapshot:ArcadeSnapshot)=>void):()=>void;
  setActive(active:boolean):void; dispose():void;
}
```

factory `createArcadeSession({clock?,repository?})`在本游戏mount创建；默认performance.now。reducer先算候选transition，record检查时间/active/阶段并绑定runId/seq，返回true才提交候选state；空facts也经过守卫。首次subscribe立即通知，之后microtask通知，避免最后一项成功回调抢在领域state之前。revision随实质编辑递增，同草稿不重复评分；未填完整不算错误。全部目标完成自动完成，恰好时间到优先timeout；终局幂等。当前run完成项只读，重练先结束旧练习再start新run。

初版contentVersion=`science-arcade-content-1`、scoringVersion=`science-arcade-score-1`；compare key使用有序元组activityId/challengeCode/profile/contentVersion/scoringVersion/durationMs。挑战码如`SA1-R07-7K2M4C-G`，G/S表示档位；32字符表`23456789ABCDEFGHJKLMNPQRSTUVWXYZ`；确定性子种子由`${seed}:${activityId}`的FNV-1a32初始化Mulberry32，黄金样例测试固定。`createComparisonKey(config)`、`parseChallengeCode(text)`、`calculateArcadeScore(objectives,elapsedMs,durationMs)`归共享模块。

repository拥有read/begin/checkpoint/save/updatePreferences/createPlayerSlot/deleteResult/clearRecords/reset/subscribe/dispose；activeDraft保存config/目标摘要/elapsed/runId/slotId/key/日期，恢复清理只能显式核对expectedRunId。声音默认false，昵称只作文本，01自由理由只在内存展示。结果/偏好字段及校验按计分附录。

## 7. 6.1-sol执行工作包

| 顺序 | 负责人 | 范围与交付 |
| --- | --- | --- |
| A | 集成智能体 | Vite多HTML入口、纯导航元数据、手风琴、独立bootstrap、原展厅入口调整 |
| B | 集成智能体 | session/计分/本地记录/挑战码/结果UI；接口先冻结 |
| C | UI/03智能体 | 原创SVG视觉规范、公共游戏UI、03发射与接收的真实可玩片段 |
| D1/D2/D3 | 01/02/03三个智能体并行 | 各自完整玩法、教学数据与纯规则、页面/测试；详见三个子计划 |
| E | 集成＋独立审查智能体 | 撤出旧学习面板、完整跳转/生命周期/成绩回归、截图和试玩 |

root控制范围、共享接口和阶段验收。公共文件仅集成者写；每页只写分配目录和对应内容/测试。每个可验收工作包分别Git保存；暂存/提交串行执行，不能把其他智能体未完成工作带入提交。

## 8. 实施步骤及验收

- [ ] A0：读当前工作区和Git差异，先保存已授权现有工作；保留用户文件删除/修改，不回退。运行一次基线`npm run check`并记录真实结果。
- [ ] A：写入口/导航验收：从原站三按钮各跳转对应pathname，刷新各游戏200响应，原四hash仍正确、子目录base正确；Vite多页面构建后再接正式入口。游戏根不存在旧model-canvas/其他游戏host，网络与bundle无旧Three/GLB/DAE。
- [ ] B：先写并跑失败测试，再实现共同合同。验证分数1000/950/910/500、提示和重复提交、360000ms边界、record拒绝时domain不前进；跨文档中断、后台继续、回退不恢复；存储禁用/损坏/未来schema/双标签/首局锁/30天200条与只清本键。运行`npm run test:unit -- tests/unit/arcade`及build。
- [ ] C：实现03第一段“发射→故意接错→纠正Rx→成功”的操作小样与共用结算示例，在1366×768/1440×900及窄屏截图观察。root确认对象可辨识、真实因果反馈和操作完整，再放开D并行；不把静态稿冒充已可玩游戏。
- [ ] D：各6.1-sol按子计划实现并跑自己的unit/E2E。01保留五主题与未来说明；02覆盖13项安装及3关系图；03覆盖六目标、原理资料与同坐标测量。使用真实鼠标/键盘/触屏路径，不在E2E直接灌答案state。
- [ ] E：迁移旧学习UI及专属事件/逐帧分支，原历史展品、结构三任务/归位/复习、LiDAR八部件/四步/5–80m滑杆/扫描、04体验回归。共同导航从游戏跳原展厅、游戏互跳、刷新/前进后退均按独立HTML语义；离开进行中正式局后只有interrupted记录。
- [ ] E：两独立浏览器context同码同动作/假时间同结果、本地数据不互传；每游戏截图初始/错误/成功/结算，03另验天气/米尺。独立6.1-sol审查代码与game-playtest实际试玩；修复按所有权回派。
- [ ] E：最终`npm run check`通过后记录真实测试数与退出码并保存Git。交付游戏三个地址、维护说明和实际限制；儿童可用性/六分钟预算列为待课堂验证，不称已经验证适龄。

当前为规划交付：已研究技能并由6.1-sol准备子计划；以上产品实现、测试和试玩均未执行。

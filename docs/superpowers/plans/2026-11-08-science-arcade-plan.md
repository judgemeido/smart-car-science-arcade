# 01–03 独立科学游戏与手风琴导航 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 用户已指定 GPT-6.1-sol 执行细项；root 负责核心设计和整体流程。本轮只交付方案，不开始产品实现。

**Goal:** 为三至六年级提供三个操作型 2D 科学游戏，接入 01–04 手风琴导航，并支持每人一台电脑的本地成绩与现场比较。

**Architecture:** 保留现有 hash/runtime/controller 协议；七个扁平 pages 派生四个 chapterGroups。新活动每页独立 reducer/controller，消费共用 session/scoring/storage/UI；知识内容提取为单一来源，旧展厅的新增学习面板迁移出去。

**Tech Stack:** 仓库现有 TypeScript、Vite、原生 DOM/SVG/CSS、必要的局部 Canvas、Vitest、Playwright；首版不新增框架、Phaser、后端或在线 AI。

**Spec:** [本轮设计](../specs/2026-11-08-science-arcade-design.md)。规则细项见[计分附录](../../engineering/2026-11-08-science-arcade-scoring.md)，技能来源见[GitHub 核验附录](../../engineering/2026-11-08-science-arcade-skills.md)。若子计划存在冲突，以本设计与本总计划的公共合同为准，并在编码前修正文档，不能由各页各自解释。

## Global Constraints

- 七路由：`history/history-lab/explore/structure-lab/lidar/sensor-lab/traffic`；四章节 01–04，总数 04。
- 用户最新校正：通过顶部不同按钮切换**完整独立页面**，任何时刻仅一个主工作台可见。02 的3D展厅和2D挑战不得并排、上下拼接、弹窗嵌入；手风琴只展开导航入口。
- 小学三至六年级；`guided|standard` 两档；每电脑本地存储，人工现场比较真实成绩卡。
- 正式 `durationMs=360000`、时间奖励目标 `180000ms`；练习不计时，`score/elapsedMs=null`。
- 全部评分只在 `shared/arcade/scoring.ts`；1000 权重，700/200/100 分项；正文按钮至少 18px，操作目标至少 44×44px。
- 站内导航/后台只停动画输入，不停正式时钟；pagehide/刷新/退出中断，不能恢复正式局。
- 新活动不可依赖旧 controller/Three/模型；旧知识一份真源；旧模型故障不影响新游戏。
- root 冻结接口、整合方案、审查交付；全部产品代码由 GPT-6.1-sol 完成；共享文件不并行写。
- 用户只要求本轮方案；执行方式已确认，进入实施阶段前按用户下一步指示推进。

## Review Focus

- 新 hash 直接进入、浏览器前进后退、坏 hash、旧链接、加载中切页：只能激活一个页面，编号/焦点/懒加载正确（A1、E1）。
- 输入法/重复点击/拖动取消/空槽：不得当有效错误、重复得分、丢焦点或执行昵称 HTML（A2、C1–C3）。
- hidden/切页/恰好 360000ms/pagehide/BFCache：时间政策明确且不能靠动画停顿刷分（A2、E1）。
- localStorage 配额/禁用/损坏/未来版本/跨页重复挂载：仍可玩，存档不误覆写，旧局不被当崩溃回收（A2）。
- 缺 WebGL/模型失败/不同尺寸输入：新游戏独立可玩，视觉米尺与真值一致，旧展厅仍能降级或重试（B1、C3、E1）。

## 1. 交付文件与依赖

| 工作包 | 主要文件 | 所有者（均为 6.1-sol） |
| --- | --- | --- |
| A1 导航 | `src/app/{types,chapters,shell,navigation,bootstrap}.ts`、`src/styles/navigation.css`、`tests/unit/navigation.test.ts`、`tests/e2e/chapters.spec.ts` | 集成智能体 |
| A2 公共运行 | `src/shared/arcade/{types,session,scoring,storage,challenge-code}.ts`、`tests/unit/arcade/*.test.ts`、`tests/e2e/arcade-competition.spec.ts` | 集成智能体 |
| B1 视觉与可玩片段 | `src/ui/arcade/{shell,results,assistant}.ts`、`styles.css`；03 的第一段操作及初始测试 | UI/03 智能体（顺序执行） |
| C1 历史 | `src/activities/history-lab/*`、`src/content/history-learning.ts`、历史兼容重导出/纯规则、历史新测试和维护文档 | 01 智能体 |
| C2 结构 | `src/activities/structure-lab/*`、`src/content/structure-{learning,targets}.ts`、结构兼容重导出/纯规则、结构新测试和维护文档 | 02 智能体 |
| C3 传感 | `src/activities/sensor-lab/*`、`src/content/sensing/{principles,measurement}.ts`、LiDAR 兼容内容/换算、新测试和维护文档 | 03 智能体 |
| D1 迁移接入 | 原 `history/explore/lidar` 的 controller/view/learning-view、`src/styles.css`、旧学习 E2E、最终 pages 注册 | 集成智能体 |
| E1 验收 | 跨页 E2E、截图和验证记录，必要的缺陷修复按所有者回派 | 独立审查/试玩智能体 |

引用子计划：[01 进化修复站](2026-11-08-science-arcade-01-history.md)、[02 系统维修台](2026-11-08-science-arcade-02-structure.md)、[03 回波侦探](2026-11-08-science-arcade-03-sensor.md)。子计划列出完整内容映射、纯 reducer、图形对象和具体关卡验收。本总计划控制公共合同与交接，避免重复定义三个版本的底座。

## 2. 冻结的公共接口

### 2.1 页面注册

保留 `ChapterDefinition` 的现有字段和 `ChapterController`，避免无必要改 runtime。`types.ts` 新增：

```ts
interface ChapterGroupDefinition {
  number: string;
  title: string;
  subtitle: string;
  pageIds: readonly string[];
}
```

`navigation.ts` 新增 `groupPages(pages: readonly ChapterDefinition[]): readonly ChapterGroupDefinition[]`：按 `number` 首次出现顺序分组，同组第一个（原展厅）提供组标题/副标题，pageIds 按注册顺序；重复 page id 抛配置错误。`chapters.ts` 导出 `pages`、`chapterGroups=groupPages(pages)`，并以 `chapters=pages` 保留兼容导出。每个新游戏 `number` 为对应 01/02/03，`immersive:false`；样式限在 `.arcade-page` 与活动根类内。

`renderShell(root,pages,groups=groupPages(pages))` 返回原 Map；`bootstrap(root,pages=registeredPages,groups=groupPages(pages))` 保持原返回 `{dispose}`，让现有测试注入自定义页面仍成立。原 `resolveChapter(hash,ids)` 和 runtime 不改协议。子项使用 `a[data-go][href]`，组头 `button[data-chapter-group]`，组内容 `id="chapter-group-01"`。扩展导航事件仅处理组切换与焦点，修改键/中键链接维持浏览器原生行为。

每活动 `index.ts` 导出 `view:string` 和 `mount(host:HTMLElement):ChapterController`。注册表静态只导入纯 `view.ts`，动态加载 `index.ts`/controller 后 mount；不能从同时导出 mount 的 index 静态引入 view 导致全页控制器预加载。样式由集成智能体统一引入，view 模块不访问浏览器或读存储。

### 2.2 领域事实、运行与结果

```ts
type ActivityId = 'history-lab' | 'structure-lab' | 'sensor-lab';
type Profile = 'guided' | 'standard';
type FinishReason = 'completed' | 'timeout' | 'abandoned' | 'interrupted';
interface DomainFact {
  objectiveId: string;
  revision: number;
  verdict: 'correct' | 'incorrect';
  usedHint: boolean;
}
interface ArcadeRunConfig {
  activityId: ActivityId;
  mode: 'practice' | 'contest';
  profile: Profile;
  challengeCode: string;
  contentVersion: string; // 初版 science-arcade-content-1
  scoringVersion: string; // 初版 science-arcade-score-1，包含 180s 时间政策
  durationMs: 360000 | null; // null 只适用于练习
  slotId: string;
  nickname: string;
  objectives: readonly { id: string; weight: number }[];
}
interface ObjectiveProgress {
  id: string; weight: number; completed: boolean;
  firstCorrect: boolean; usedHint: boolean;
}
interface ArcadeScore {
  progress: number; quality: number; efficiency: number; total: number;
}
interface ArcadeResult {
  runId: string; config: ArcadeRunConfig; status: FinishReason;
  eligible: boolean; elapsedMs: number | null;
  objectives: readonly ObjectiveProgress[];
  score: ArcadeScore | null;
  createdEpochMs: number;
}
interface ArcadeSnapshot {
  phase: 'idle' | 'running' | 'finished';
  runId: string | null; config: ArcadeRunConfig | null;
  elapsedMs: number | null; remainingMs: number | null;
  objectives: readonly ObjectiveProgress[];
  result: ArcadeResult | null;
  persistence: 'saved' | 'memory-only' | 'read-only';
}
type StartResult = { ok: true; runId: string } | {
  ok: false;
  reason: 'invalid-config' | 'already-running' | 'attempt-used' | 'other-run-active';
  activeActivityId?: ActivityId;
};
interface ArcadeSession {
  start(config: ArcadeRunConfig): StartResult;
  record(facts: readonly DomainFact[]): boolean;
  finish(reason: FinishReason): ArcadeResult | null;
  subscribe(listener: (snapshot: ArcadeSnapshot) => void): () => void;
  setActive(active: boolean): void;
  dispose(): void;
}
```

`createArcadeSession(options?: {clock?:()=>number; repository?:ArcadeRepository}):ArcadeSession`。默认时钟为 performance.now；默认 repository 为同一 origin 本地键的适配器。factory 在 mount 内调用，每页持有自己的 session。`subscribe` 首次立即回调，后续状态通知在本次方法返回后以microtask合并发布，取消函数幂等且取消后不调用。domain reducer 返回 `{state,facts}`，controller 先计算 transition，不立即提交；将原样 facts 交 record，返回true才提交领域state，false则保持上一有效state并依快照显示终局。每个运行中的游戏操作（包括零facts的拖动/继续）都经过record进行时间/输入守卫；开始前的教程独立处理。**runId/seq 由 session 内部绑定**。revision 是该目标草稿版本，实质修改递增；同草稿重复确认无 fact，缺输入/未知 ID 无 fact，提示在 domain state 锁定并随后续 fact 传入。当前正式或练习run的已完成目标只读，纯 UI/渲染不产生事实。

`record` 在接纳事实前同步检查时钟、active、阶段、ID/revision，并按 `objectiveId+revision` 去重；同目标首次有效事实锁定 firstCorrect 资格。active且running的合法操作返回true，空facts合法且不计分；inactive、已终局、超时或非法批次返回false，不提交领域transition。全部目标完成后自动 finish('completed')，最后合法操作仍返回true，controller 提交state后依快照冻结输入，反馈内容仍可读。未全完成的 completed 请求拒绝；达到预算优先 timeout；timeout 不允许在预算前手动制造。`finish`/`dispose` 幂等。dispose 中进行 interrupted 终局并释放订阅/定时器；无 running 局则仅清理。

“重新练习”开始整轮新run：旧练习仍running时先finish('abandoned')，重建空领域state，再session.start新练习config。允许只读回看已完成阶段，不提供单目标撤回完成状态的第二套API。01未来说明与自由理由只留当前页面内存展示，重练/刷新清空；本地通用成绩历史不持久化这些文本。

session 的周期通知只用于 UI 刷新/保存检查点，不能用帧数或 interval 次数计时。setActive 仅守卫输入/绘制，返回激活时先结算时间。session 自己监听 pagehide（包括 persisted）中断新正式局；应用原 runtime 的 BFCache 策略保留。一次超时/中断只持久化一个终局。开始、终局和最多每5秒检查点写入；完整 activeDraft 需要保存 config、目标摘要、elapsed、runId/slotId、最近检查点日期以供中断记录，不保存运行对象或逐帧状态。

scoring 导出 `calculateArcadeScore(objectives:readonly ObjectiveProgress[],elapsedMs:number,durationMs:360000):ArcadeScore`，严格使用设计公式。无效配置/权重合计不为1000/重复ID必须在 start 拒绝。practice 结果与 abandoned/interrupted 的 score=null；contest completed/timeout 的 eligible=true，保存失败仍能显示内存成绩并标记未保存。首次尝试锁是否可持久保存与分数有效性分开说明。

### 2.3 挑战码、存储与共享 UI

`parseChallengeCode(value:string)` 返回 `{ok:true,code,round,seed,profile}` 或 `{ok:false,error}`；去首尾空格并转大写，格式 `SA1-R00-XXXXXX-G` 至 `R99`，G/S 档位。种子字符表 `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`（32个字符的自定义Base32）。非法码不给随机后备。`createChallengeRandom(seed:string):()=>number` 使用固定FNV-1a 32位字符串哈希初始化Mulberry32，并以黄金样例测试；01/02/03 分别使用 `${seed}:${activityId}` 派生的稳定子种子。正式档位以码为准，切换档位要求相符码；练习可不输入码，使用内置练习样例。

`createComparisonKey(config:ArcadeRunConfig):string` 用有序 JSON 元组 `[activityId,challengeCode,profile,contentVersion,scoringVersion,durationMs]`，避免拼接碰撞。新内容/规则变化升级对应版本，旧记录不以新规则重算。

`storage.ts` 导出 `createArcadeRepository(storage?:Storage):ArcadeRepository` 与 `recoverInterruptedArcadeDraft(repository:ArcadeRepository,expectedRunId:string):boolean`。repository 接口包含 `read():ArcadeLocalStoreV1`、`begin(config,runId):StartResult`、`checkpoint(resultDraft):void`、`save(result):void`、`updatePreferences(patch:Partial<ArcadePreferences>):void`、`createPlayerSlot(nickname?:string):string`、`deleteResult(runId):void`、`clearRecords():void`、`reset():void`、`subscribe(listener):()=>void`、`dispose():void`。ArcadePreferences包含slotId、nickname、profile、lastChallengeCode及soundEnabled（默认false）；改名不改slotId，换玩家才创建新slot。`resultDraft` 为未终局的 `config/runId/elapsedMs/objectives` 完整摘要，加comparisonKey/savedEpochMs；写操作通知 persistence 状态而不向页面抛存储异常。具体存档字段见计分附录；公共types与结果只有一套。UI通过repository.read/subscribe读取偏好和历史，通过updatePreferences保存，不建第二套存储。

`bootstrap` 只读取/显示已有activeDraft冲突，**不自动结束它**，因为另一个标签页可能仍在使用。mount与hash切页也不回收草稿。正常pagehide由所属session结束自己；崩溃残留或用户想结束其他窗口的旧局时，明确点击“结束未完成挑战”，告知这也会结束仍在游玩的旧窗口，再调用recoverInterruptedArcadeDraft(repository,expectedRunId)。只有当前键仍匹配该runId才转interrupted且写一次终局；比赛次数锁仍保留。常规storage事件使旧session同步中断，不能再出有效成绩。repository从键的最新值合并本次改动；无原子事务，不作安全承诺。开始另一活动正式局返回other-run-active，并提供原游戏入口/结束旧局操作，不偷偷清锁。存储失败转内存继续，明确本次锁只在当前页面有效。

UI 的三个公开 factory：`mountArcadeShell(host,options):ArcadeShellHandle`、`mountArcadeResults(host,options):ArcadeResultsHandle`、`mountArcadeAssistant(host,options):ArcadeAssistantHandle`；handle 都有 `update(model):void` 与 `dispose():void`。A2/B1 实现时在 `src/ui/arcade/shell.ts` 导出统一 options/model/handle 类型并提交再交接：shell model 只含 snapshot、当前短任务、stageIndex/stageCount；事件 onStart(config)、onHint、onReplayPractice、onReturnToGallery、onSoundChange。results model 使用 ArcadeResult 与 persistence，不自行计算分；assistant model 使用活动/阶段/反馈ID与确定性 copy，不读取任意自由文评估。具体对象排版归各活动 view，公共组件不导入 activity reducer。

## 3. 执行步骤与 Git 关口

### A0：实施开始前的基线保存

- [ ] 集成智能体先读本设计、总计划、技能原文与工作区状态，使用已授权的当前分支/适合的隔离工作树；不回退用户已有工作。
- [ ] 检查 `git status --short`、`git diff` 与最近提交；存在未提交工作先检查并保存本地 checkpoint，没有变化则记录当前 HEAD，不造空提交。明确排除凭据、依赖和生成缓存。
- [ ] 基线执行 `npm run check`，保存真实退出码；旧记录的191单测/69E2E只是历史证据，不能当本轮已跑。失败先定位是否现有基线，再决定工作边界。

### A1：分组导航与路由兼容（一次可验收提交）

**Files:** 上表 A1；单元测试可新增 `tests/unit/navigation.test.ts`；E2E 继续原 `chapters.spec.ts`。

- [ ] 写测试 `groups_keep_four_numbers_with_seven_pages`：七个测试 fixture 按 01/02/03/04 分为 `[2,2,2,1]`，总数04；`custom_bootstrap_pages_still_work`、重复ID拒绝、旧/新/非法hash解析。
- [ ] 执行 `npm run test:unit -- tests/unit/navigation.test.ts`，确认新增断言在改动前失败。
- [ ] 按2.1实现分组/展开/真实子链接/焦点；正式注册先用已存在四页，测试 fixture 覆盖七页。不得发布不存在 view 的空游戏入口。
- [ ] E2E验证组头不导航、子链接才导航、深链展开所属组、移动 Escape、旧下一章与后退、总数04；执行目标测试及 build 后提交 `feat: add accordion chapter navigation`。
- [ ] 用七页fixture验证顶部02“拆解与交互”/“结构挑战”按钮切换整个内容区：始终只有一个可见 `[data-page]`，另一页 hidden且inert；后退/前进同样成立。子项为按钮外观的真实hash链接，不在导航内渲染游戏面板。

### A2：公共游戏运行、计分和本地记录（一次可验收提交）

- [ ] 新建上述五个 shared 文件与 tests/unit/arcade；先用测试固定950/910/500示例、重复事实、提示资格、非法权重和360000ms边界。practice为空分；未全部完成无时间奖励。
- [ ] session测试注入单调时钟：已玩60s后隐藏300s返回超时、切活动仍运行、后退时钟不减少耗时、重复finish一次记录、打开第二标签页不结束第一局、明确清理同runId才中断、BFCache新局中断；超时动作record返回false且领域state不前进；重练新run没有旧目标，旧模型runtime无行为更改。
- [ ] storage测试覆盖首局锁/改名/原局冲突、坏JSON/单条坏记录/未来schema、禁用/配额、最多200/30天、删除成绩不解锁、只清本键、昵称作为文本、普通双标签接管。challenge-code固定正规化、码档位不符拒绝、确定种子黄金样例。
- [ ] 先执行 `npm run test:unit -- tests/unit/arcade` 确認失败，再按2.2/2.3实现；编译/单测通过后提交 `feat: add local science arcade sessions and scoring`。记录公共签名；所有子页必须引用该提交，不能自建临时第二套接口。

### B1：共同视觉语言及03第一段真实可玩片段（一次可验收提交）

- [ ] UI/03智能体阅读 frontend-design、game-ui-frontend、web-game-foundations，先做公共 CSS token、开始/HUD/提示助手/结果 factory，并完成03发射—接收段的真实 reducer和SVG输入。此步取得03相关文件独占，C3随后继续同一实现。
- [ ] 添加真实输入测试：转方向并发射、故意接错、纠正到Rx、重复发射不刷分、键盘等价；截图覆盖初始/错误/成功和公共结算组件的明确测试fixture。产品中没有冒充已完成整局的演示成绩。
- [ ] 用1366×768和1440×900实际打开：辨认对象、短目标、工具托盘、44px点击、18px正文、减少动画、静音默认、任务不被导航挤出；确认操作改变场景，不是按钮变色后读答案。
- [ ] 独立6.1-sol视觉/玩法审查，root按设计验收。若质感或操作不成立，回修本片段再并行扩展；无须为每个配色小选择请求用户批准。测试/build通过后提交 `feat: establish science arcade visual gameplay`。

### C1 / C2 / C3：三页并行完成（分别测试、分别提交）

- [ ] 公共合同冻结且B1验收后同时派三个6.1-sol，分别执行链接的01/02/03子计划；03接续B1文件，01/02消费公共UI。root不承担产品实现。
- [ ] 每个实现者只写分配文件；知识提取、兼容重导出、自己纯规则/视图/控制器/测试/维护说明归自己。旧大controller拆面板与全局样式/注册交给D1，不能跨界并行修改。
- [ ] 每页交付完整练习和正式局、可读错误与修正、统一事实/结果、无Three直入，以及子计划列出的知识映射。运行 `npm run test:unit -- tests/unit/history-lab`（对应其他页替换目录）和相应旧领域unit回归，记录结果。
- [ ] 集成者在临时本地接入点或受控注册中为E2E验证每页完整流程；未完成入口不合并到可交付注册。每页经独立审查通过，由集成者串行暂存该页明确文件并分别提交 `feat: add history evolution game`、`feat: add structure systems game`、`feat: add sensor echo game`。禁止三个子智能体同时git add/commit，禁止 `git add .` 捎带另页工作。

### D1：七页正式接入与旧面板迁移（一次可验收提交）

- [ ] 集成智能体接入七个pages与CSS，原四路由不变；顶部各章的两个按钮承担完整独立页面切换，旧学习入口按设计移除或替换为导航链接。逐项按设计第5节迁移，03六传感器卡与20/60m教学例进入新页资料/练习，原5–80m展品滑杆保留。
- [ ] 02专门检查：删除explore右侧的 `data-learning-start`、`data-explore-learning` 和专属输入挂载，以顶部02的两个按钮作为完整页面入口。`#explore` 不包含挑战教程/HUD/结果；`#structure-lab` 不包含旧explore-workbench/model-canvas，直入无需GLB或Three。原3D复习/归位/模型操作仍在原页。
- [ ] 撤出旧学习DOM、专属事件、第二套学习运行状态和不再使用的逐帧/相机分支；历史展品、结构原三项/复习/归位、LiDAR原八部件/四步骤/扫描、04均保留。未使用纯规则只按真实消费者决定保留/删除，避免无关大重构。
- [ ] 把 `history-learning/explore-learning/lidar-learning.spec.ts` 中迁移项的行为覆盖转到新路由测试；旧展厅仍需保留相应领域回归。不能只删失败断言。更新维护文档的唯一来源、内容新增方法和新入口。
- [ ] 执行三个新页E2E与全部旧chapters/domain/traffic-learning回归、unit与build，检查直入新页的请求/构建依赖不含Three/GLB/DAE。通过后提交 `refactor: move learning activities into independent game pages`。

### E1：独立整体验收与交付（验证记录提交）

- [ ] 独立6.1-sol审查完整差异，另由6.1-sol按game-playtest试玩。满员时串行派审查，不创建用户侧新chat，不把产品实现交root。
- [ ] 两个独立浏览器context输入同码：任务一致、同动作/假时间同分、记录不互相出现。每页完成至少一次错误修正和一次完整正式局；跨页未完成→返回、后台超时、刷新中断、存储失败仍出成绩卡。测试用假时钟不能出现在儿童界面。
- [ ] 截图每页初始/错误/成功/结果，另取手风琴宽窄屏与03天气/测距证据；实际查看截图，不能只凭DOM通过判视觉成功。控制台无新错误，热切页/重复进入无重复监听或持续后台动画。
- [ ] 最终执行 `npm run check` 并记录真实命令/退出码/测试数；提交验证和维护记录 `docs: record science arcade integration verification`。有缺陷按文件所有者修复，再只重跑受影响测试及必要最终检查。
- [ ] 向用户交付运行入口、三页变化、本地比较方式、实际验证与局限；六分钟/档位/儿童理解度列为待现场试用参数，不声称已做儿童试验。每个work package对应一个可回退提交，代码保持可继续添加内容的独立数据与规则边界。

## 4. 本轮规划交付核对

- [x] 用户人群、电脑/本地存储和分工要求已纳入。
- [x] 三份子计划由 GPT-6.1-sol 并行完成，主负责人统一导航、计分、生命周期与内容迁移合同。
- [x] GitHub SKILL.md 来源与固定提交已核验；采用/未安装/按需技能已区分。
- [ ] 产品实施、运行测试和现场儿童试玩：留待执行阶段，当前不标完成。

本轮只修改本设计、总计划、三个子计划、计分与技能附录。文档检查不能代替未来的代码验收。

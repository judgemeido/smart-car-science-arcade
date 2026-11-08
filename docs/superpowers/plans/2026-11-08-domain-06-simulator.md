# D：06 确定性仿真与设计比较 Implementation Plan（后续参考，不在本轮执行范围）

> **For agentic workers:** 本文件是后续参考，本轮不要执行。当前只执行01–04内部整理总计划和四章子计划。

**状态：** 用户最新确认保留现有用户体验，仅整理内部代码。以下学习/新增页面要求均移出本轮，不是当前依赖、验收条件或预建接口的依据。

**Goal:** 读取05提交版本，在三个道路场景中计算设备和规则带来的差异，生成可比较的报告。

**Architecture:** simulation为无DOM/Three的纯引擎；chapters/simulator负责2D轨迹播放、场景选择和报告展示。

**Tech Stack:** TypeScript、Canvas 2D、Vitest、Playwright、版本化localStorage。

**Spec:** [融合设计第 7 节](C:/Codex/citygame01/docs/superpowers/specs/2026-11-08-future-learning-expansion-reference.md)；Consumes C1 DesignRevision。

## Global Constraints

固定步长0.05s、最多1200步、SI单位、modelVersion/evaluationVersion='teaching-v1'。没有需干预的已感知条件时基础行驶，不记录missing-rule；观察到需干预条件却未配置对应规则时，记录missing-rule并继续基础行驶。safe-stop-alert只发起制动；停稳且全程没有碰撞/违规才为safe，过迟停车或已有风险仍为unsafe，不能被最后的停车动作覆盖。该动作结束时missionCompleted=false、passed=false；其他流程只有安全且完成才passed。报告必须绑定完整设计/场景快照和版本，不能随草稿变化。

app/services.ts按(profileId, mode)持有学习、设计和报告三类store，同一页面会话跨章节、runtime/WebGL重建和模式切换复用对应实例；06只使用注入服务。learn模式持久化，失败退回内存；browse三类store全部独立内存，硬刷新丢弃且提前说明可用JSON导出保留。learn硬刷新仅恢复已成功保存的数据。

## Review Focus

未知设计/场景/报告版本、准确revision路由、缺设备/规则、正常行驶不误报缺规则、雨天不确定、制动过迟与既有风险、无穷停车/超时、存储失败后跨章与重建、渲染暂停、不同输入报告混比。D1/D2/D3固定这些行为。

## Task D1：三个场景、感知与决策

**Files:** Create src/simulation/{types,scenarios,perception,decision-engine}.ts、tests/unit/simulation/{perception,decision}.test.ts。

**Interfaces:** SimulationScenario含id/version/weather/初始速度/道路长度/目标和信号时序；PerceptionState区分目标语义、距离线索、uncertain和当前需干预的已感知条件。`perceive(design, scenario, world): PerceptionState`、`decide(design, perception, scenario): { action: DrivingAction; ruleCondition?: string; reasons: string[] }`。固定优先级来自05；基础行驶使用既有DrivingAction的proceed-cautiously，不引入新action ID。无需干预时基础行驶且不报告missing-rule，需干预条件缺对应规则时才报告missing-rule并基础行驶。decide只产生动作及原因，安全结论交D2根据完整轨迹判定。

- [ ] 写失败测试：晴天摄像头可提供行人线索；雨天只有摄像头→uncertain；雨天不确定且配置异常停车规则时选择safe-stop-alert动作，此层不直接断言safe；GNSS单独不提供行人/灯色；灯色需要摄像头；规则多条件命中时按既定优先级。
- [ ] 写条件分支测试：没有需干预条件时基础行驶且无missing-rule；已观察到行人但缺对应规则时才记录missing-rule；红灯命中stop规则，转绿且道路安全后基础行驶，无missing-rule。
- [ ] `npm run test:unit -- tests/unit/simulation`先 FAIL；实现明确的教学线索矩阵和三个场景。毫米波/激光的距离线索不等同于灯色识别，未知语义应保留uncertain；不按“缺激光雷达”直接失败。
- [ ] 将起点、目标位置、过街与灯色时序、检测范围、制动参数写成版本数据与测试，不从Canvas缩放推导物理距离。第一版不加随机噪声；seed记录为输入，后续噪声只允许使用此seed。
- [ ] 测试 PASS，发布参数说明与接口给D2。

## Task D2：固定步轨迹、结果和报告

**Files:** Create src/simulation/{scenario-engine,result-report,report-store}.ts、tests/unit/simulation/{engine,report-store}.test.ts。ChapterContext的reports字段与src/app/services.ts的实例管理由集成负责人接入。

**Interfaces:** `simulate({ design: DesignRevision, scenario: SimulationScenario, seed: number, modelVersion: 'teaching-v1' }): SimulationResult`；Result包含frames/events/reasons、safety、missionCompleted、passed、termination及输入快照。`compareResults(a,b)`仅在同scenario快照/seed/model/evaluation版本时返回指标差异，否则返回不可比较原因。`createReportStore(storage: StoragePort | null, profileId: string): ReportStore`保存/读取/导出报告，最小接口如下：

```ts
interface ReportStore {
  saveReport(result: SimulationResult): void;
  getReports(): readonly SimulationResult[];
  exportJson(): string;
  getStorageStatus(): { persisted: boolean; issue?: string };
}
```

saveReport先校验输入版本、快照和当前profileId，再保存副本；getReports仅返回当前profile的独立快照，按写入先后排列，最多保留最近30条。exportJson包含schema和完整报告快照；getStorageStatus说明当前内存集合是否已成功持久化以及读取/写入问题。ChapterContext增加`reports?: ReportStore`；app/services.ts创建并注入，06使用context.design中的准确提交快照与context.reports，不自行创建store。

- [ ] 写失败测试：同完整输入深度相等；未知版本/非有限参数拒绝；无设备/需干预却缺规则产生对应原因；最多1200步结束；红灯正确等待转绿后到终点才passed，正常继续不产生missing-rule。
- [ ] 写停车结果测试：safe-stop-alert只发起制动；足够制动距离、停稳且全程无风险才safety='safe'；过迟制动发生碰撞时为unsafe；已有碰撞/违规不会因之后停车被擦除。异常停车结束的missionCompleted与passed均为false。
- [ ] 写配置差异测试：同场景/seed，摄像头+正确行人规则与缺规则得到不同结果；雨天摄像头配置提示不确定，增加可靠距离线索或异常停车规则改变决策原因；报告不伪称停止即完成。
- [ ] 对应test:unit先 FAIL；实现运动、事件、风险判定与报告，由同一WorldState产生画面位置和指标；制动期间继续检查风险，安全判定汇总全程事件，不能由动作名称或独立评分逻辑覆盖轨迹。
- [ ] 存储测试：修改草稿/新revision不改旧报告；错误profile不成为当前报告；损坏JSON、未知schema/model/evaluation版本与非法输入快照拒绝进入当前报告或比较，显示可恢复提示且不白屏；相同输入可比较、不同条件明确不可直接比较；最近30条，第31条淘汰最早；读取抛错或配额失败仍可用内存+JSON导出。
- [ ] 与集成负责人验证同一(profileId, mode)的ReportStore与DesignStore跨章节、runtime/WebGL重建和模式切换仍复用；browse全部使用独立内存，新建profile不读取其他档案报告。learn只有存储成功的数据可在硬刷新后恢复，browse硬刷新丢弃记录。
- [ ] 全部PASS，`npm run build`；报告键futuredrive.simulation.v1，schemaVersion=1，保存完整设计和场景快照。

## Task D3：2D播放、报告比较与05联动

**Files:** Create src/chapters/simulator/{view,controller,playback,report-view}.ts、styles.css、tests/unit/simulation/playback.test.ts、tests/e2e/simulator.spec.ts；公共RouteTarget、ChapterContext、app/services.ts、注册与样式导入交集成负责人。

**Interfaces:** `createPlayback(frames)`提供setActive/play/pause/seek/getFrame/dispose；只读取D2轨迹，不再执行simulate或评分。mount遵守ChapterController，使用C3统一的RouteTarget与ChapterContext.navigate(target: ChapterId | RouteTarget)/getRoute()。从`context.getRoute()`的simulator目标读取designId/revision，并用`context.design.getRevision(designId, revision)`取本profile准确版本；URL为`#simulator?designId=...&revision=...`。app的parseRoute返回RouteResolution并保留invalid-design-reference提示，非法引用仍显示06。无引用时可列出已提交版本或去05；0、小数、不安全整数、重复字段、非法编码、不存在或异档案版本，以及缺少注入服务时均不运行，不能退回最新版本或草稿。保存报告只用context.reports.saveReport。

- [ ] 写失败播放测试：同elapsed在30/60fps取得相同插值位置；pause不推进；后台恢复不累计间隔；dispose后无回调；首尾seek合法且不改结果。
- [ ] 对应test:unit先 FAIL；实现道路、车辆、目标、检测和决策步骤的2D显示，以及安全/任务/风险报告。异常停车按实际轨迹结果显示“安全停车，任务未完成”或“停车过程中发生碰撞/违规，任务未完成”，并列出既有风险及发生时刻。
- [ ] 浏览器走05提交revision1→06选场景→测试→回05修改revision2→同场景/seed重测→比较；两个报告保留自己的配置，组名与原因按文本显示。
- [ ] 验证revision1的直接URL、learn成功保存后的刷新和前后退仍读取revision1；无引用时列出已提交版本或去05，非法引用保留06并说明问题。0、小数、不安全整数、重复字段、非法编码、不存在或异档案revision不调用simulate，不读取最新版本或草稿。
- [ ] 浏览器联调：拒绝存储→05提交内存revision→06仿真并保存内存报告→runtime/WebGL重建→旧revision/报告仍可读；切换browse后练习不改learn记录，再切回learn仍可读取原结果。硬刷新丢弃browse记录，learn仅恢复成功保存内容；提前提示JSON导出可保留未持久化记录。
- [ ] 测损坏/未知版本报告、后台/切页暂停、触屏操作与导出；`npm run test:unit -- tests/unit/simulation`、`npm run build`、`npm run test:e2e -- simulator.spec.ts`通过。
- [ ] 三个场景和联动验收后才注册06，启用05测试入口；保持核心学习课程分母4，章节导航总数随已发布页面更新。

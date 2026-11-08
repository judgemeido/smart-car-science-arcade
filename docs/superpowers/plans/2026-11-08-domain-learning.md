# B：学习底座与新课程接入 Implementation Plan（后续参考，不在本轮执行范围）

> **For agentic workers:** 本文件是后续参考，本轮不要执行。当前只执行01–04内部整理总计划和四章子计划。

**状态：** 用户最新确认保留现有用户体验，仅整理内部代码。以下学习/新增页面要求均移出本轮，不是当前依赖、验收条件或预建接口的依据。

**Goal:** 建立首答、掌握、成果与版本化存储，并接入已有 01–04 教学方案。

**Architecture:** learning 管纯课程/评分/档案与存储端口；app 注入 ChapterContext 并统一进入检查；章节保留自己的任务与场景状态。

**Tech Stack:** 当前 TypeScript/Vitest/Playwright，localStorage 与内存适配。

**Spec:** [融合设计第 5 节](C:/Codex/citygame01/docs/superpowers/specs/2026-11-08-future-learning-expansion-reference.md)、[旧课程设计第 3–8 节](C:/Codex/citygame01/docs/superpowers/specs/2026-11-08-futuredrive-learning-route-design.md)。

## Global Constraints

- 正式课程 schemaVersion=1、courseVersion='01-04-v1'、键 futuredrive.learning.v1；profileId 在新建档案时生成。
- 必做任务沿用旧四章计划：01三项、02十三项、03五项、04八项；02另有可选组装，不影响解锁。
- 01上限15、04上限100、02/03无数值分；总分从任务推导，不信任 UI 传入总分。
- 旧8分游戏不迁移为新100分课程。新任务未全部可用前不启用正式学习门禁。
- 组名1–20字；无效输入不记录首答；正确作答和完成活动分开；浏览数据不可写回正式档案。
- 正式模式持久化失败退页面会话内存；浏览模式的学习/设计/报告全部独立内存，硬刷新丢弃，设计/报告可JSON导出。
- app持有按(profileId,mode)复用的服务，章节/runtime重建不重新创建；05/06使用带设计版本路由，核心门禁只约束前四章。

## Review Focus

重复提交/纠错、伪造完成、损坏数据、存储读写抛错、跨模式迟到事件、锁定深链/后退，以及05/06版本路由不被核心门禁覆盖。测试分别归 B1/B2/B3；设计/报告服务降级的完整联调归C2/D3/E。

## Task B1：公共类型、评分与存储

**Files:** Create src/learning/{types,course,scoring,student-progress,storage}.ts、src/shared/{sensors,driving}.ts、tests/unit/learning/{progress,storage,scoring}.test.ts。

**Interfaces:** types 定义旧 TaskAssessment/TaskAttemptInput/TaskProgress/ChapterResult/LearningProfile/LearningStore，增加 profileId；CoreChapterId 为前四章。StoragePort 为 getItem/setItem/removeItem。导出 `createMemoryLearningStore(initial?: LearningProfile): LearningStore`、`createLearningStore(storage: StoragePort | null): LearningStore`、`deriveChapterAssessment(profile, chapterId): { score: number; maxScore: number; mastered: number; required: number; complete: boolean }`。

course 只含稳定任务 ID、必做/可选、分值与前置关系，不导入控制器。传感器/动作 ID 严格沿用旧课程；共享目录不放评分状态。

- [ ] 写失败测试：首次红灯错误→纠正仍firstScore=0；recordAttempt正确但未mark不完成；mark不增次数；重复complete不重复结果；缺必做拒绝complete；快照修改不改变store。
- [ ] 写存储测试：JSON损坏、未知schema/course、未知任务、NaN/负/超出上限成绩拒绝；读取和写入抛错转内存；当前8分记录不按ID转换；合法旧schema1/同course记录经完整验证后可补profileId，不改成绩。
- [ ] `npm run test:unit -- tests/unit/learning` 应因未实现接口 FAIL；实现最小纯领域与校验、内存/浏览器适配。
- [ ] 同测试 PASS；无成绩的02/03输出完成数量，UI不得显示0/0。

## Task B2：服务注入、模式与导航

**Files:** Modify src/app/{types,chapters,bootstrap,navigation}.ts、src/chapters/*/controller.ts（公共签名接线）；Create src/app/services.ts、src/learning/{navigation,route-view,learning}.ts、src/learning/learning.css、tests/unit/app/routes.test.ts、tests/unit/learning/navigation.test.ts、tests/e2e/learning-navigation.spec.ts；styles.css 由集成负责人追加。

**Interfaces:** ChapterId 放 app/types，包含四章及design/simulator；ChapterDefinition.load(host, signal?, context?)、章节mount(host, context?)。定义 `RouteTarget = { chapter: Exclude<ChapterId, 'simulator'> } | { chapter: 'simulator'; design?: { designId: string; revision: number } }`、`RouteResolution = { target: RouteTarget; issue?: 'unknown-chapter' | 'invalid-design-reference' }`。app/navigation导出 `parseRoute(hash: string, published: readonly ChapterId[]): RouteResolution`、`serializeRoute(target: RouteTarget): string`；learning/navigation导出 `canEnterCoreChapter(profile: LearningProfile, chapterId: CoreChapterId, mode: 'learn' | 'browse'): boolean`、`resolveLearningRoute(target: RouteTarget, profile: LearningProfile, mode: 'learn' | 'browse'): RouteTarget`。锁定核心章返回课程目录中最远的可进入章；已发布05/06保留原target。

ChapterContext保留progress/getMode，navigate扩展为`navigate(target: ChapterId | RouteTarget): boolean`，增加`getRoute(): RouteTarget`。简单章名规范化为对象。B2的app/services持有按(profileId,mode)分开的LearningStore；C2/D2在业务存储就绪时分别扩展可选`design?: DesignStore`/`reports?: ReportStore`并注入，不提前依赖未创建业务文件。

- [ ] 写失败测试：学习模式锁定traffic深链回到可进入章，未知或未发布hash回history；push/pop/hash/data-next共用进入检查；浏览模式不改变正式快照；无context的旧入口仍可浏览且不写正式记录。
- [ ] 写路由失败测试：URLSearchParams编码/解码designId；#simulator?designId=...&revision=1完整往返；05/06不被核心门禁改成history；引用缺项、空ID、0/负数/小数/非安全整数、重复字段或非法编码拒绝；无引用simulator保留为配置选择页。C2/D3补不存在/异档案版本和真正刷新/后退/前进的联调。
- [ ] 实现parseRoute/serializeRoute与resolveLearningRoute，先解析章节和查询，再按published及核心门禁处理；版本字段按十进制正整数校验，不使用parseInt截断小数。非法引用保留06并附issue，不自动读取最新版本。
- [ ] 按load链注入context，runtime保持load/activate/dispose职责；app/services在同页面会话内跨章节、runtime/WebGL重建保留实例。模式切换销毁旧runtime和控制器、重建视图，复用目标(profileId,mode)的实例；迟到结果由原runtime清理，不进入新模式。测试往返模式保留各自快照且互不写入，新档案使用新profile实例。
- [ ] 浏览/学习模式、组名、成果列表、存储状态与新建档案确认接入；用户输入通过textContent。05/06与核心课程分母分开，06无引用时显示已提交版本选择或去设计入口，非法/不可读引用显示原因且不运行，不能使用默认伪造配置。
- [ ] 显示模式存储政策：正式模式成功保存可刷新恢复；保存失败显示会话内存状态；浏览模式明确硬刷新丢弃且不写三个正式键，设计/报告上线时提供JSON导出。硬刷新丢失会话数据不伪称已恢复。
- [ ] 单元测试与浏览器测试 PASS，`npm run build` 通过；保留当前资源重试、HMR和兼容入口测试。

## Task B3：旧教学计划适配并逐章接入

**Files:** Update docs/superpowers/plans/2026-11-08-futuredrive-{plan,01-history,02-explore,03-lidar,04-traffic}.md；实现文件按各旧计划的课程要求和 A 后真实目录分配；测试放 tests/unit/{history,explore,lidar,traffic}/learning-*.test.ts 与独立 E2E。

**接口/路径适配：** 旧index.ts/setupX(host,ctx)→当前controller.ts/mount(host,ctx)；renderX→当前view或新任务view；旧model-explorer→A02 vehicle-rig/controller；旧lidar-explorer→A03 model-rig/experiment-state；旧traffic-scene→A04 scene/scenario-scene；test命令→test:unit与test:e2e。不得重新创建已有app文件、删兼容入口或装Vitest3。

- [ ] 在旧计划标明A结构已完成，按上述映射更新路径、接口和命令；本版B承担原公共学习S1，旧S0学习适配内容归B1/B2。
- [ ] 四章原浏览体验继续保留；正式学习或明确选择“新课程练习”才启动新增任务。旧14展品/3拆解/扫描/8分题库相关导出与测试继续消费legacy数据；新任务用各章独立tasks/experiments/course-scenarios，不混用同名记录。
- [ ] 01按旧H1/H2接入三任务与知识卡；02按E1/E2接入13项识别，E3组装可独立后做；03按L1–L3接入五个记录/三个实验；各模块先红→绿验证规则，再接服务。
- [ ] 04新课程数据另存course-scenarios.ts，保留legacy-scenarios.ts的原8分游戏。新学习模式用新八关100分/四步流程；浏览模式默认保留原体验，并可显式选择新课程练习，不写正式成绩。
- [ ] 新课程逐章验收首答、最终掌握、成果、刷新与误选；未就绪课程继续维持默认浏览，不用虚构完成记录解锁后章。
- [ ] 四章29个必做记录全部有真实交互消费者后启用学习模式；新档案完成01→04一次，总成绩上限115，02/03按掌握数量展示。
- [ ] `npm run check` 通过；交付学习底座及课程接入证据，再发布正式路线。05/06开发可在B1/B2接口冻结后独立推进。

# C：05 汽车设计工坊 Implementation Plan（后续参考，不在本轮执行范围）

> **For agentic workers:** 本文件是后续参考，本轮不要执行。当前只执行01–04内部整理总计划和四章子计划。

**状态：** 用户最新确认保留现有用户体验，仅整理内部代码。以下学习/新增页面要求均移出本轮，不是当前依赖、验收条件或预建接口的依据。

**Goal:** 让小组在100点教学预算内选择车型、能源、设备和规则，提交可供06读取的设计版本。

**Architecture:** 纯配置/校验/版本存储与视图分开；草稿可修改，提交版本不可变；章节遵守统一生命周期。

**Tech Stack:** TypeScript、原生DOM、现有车辆或2D示意、Vitest/Playwright、localStorage。

**Spec:** [融合设计第 6 节](C:/Codex/citygame01/docs/superpowers/specs/2026-11-08-future-learning-expansion-reference.md)。

## Global Constraints

四车型、三能源、预算100、六设备费用10/15/30/25/10/10和规则优先级均按spec。预算为教学点数；车型/能源仅记录，不实现续航模型。不制作四套新3D资产；至少一条规则才能提交，无设备配置允许提交。旧学习成绩不得用于预算加成。

设计store由app/services.ts按(profileId, mode)持有并注入，同一页面会话跨章节、runtime/WebGL重建和模式切换复用对应实例，控制器不自建store。learn模式持久化，存储失败保留内存记录；browse的学习、设计和报告三类store全部使用独立内存，不写正式档案。browse硬刷新会丢弃记录，页面提前说明可用JSON导出保留；learn硬刷新仅恢复已成功保存的数据。

## Review Focus

预算100/超预算、重复/未知设备、规则冲突/非法动作、草稿改变历史版本、存储失败后的跨章与重建、模式/profile档案隔离、指定revision的导航与刷新。C1/C2/C3负责。

## Task C1：目录、配置契约与预算规则

**Files:** Create src/chapters/design/{types,vehicle-data,sensor-data,rule-cards,config}.ts、tests/unit/design/config.test.ts；Read src/shared/{sensors,driving}.ts。

**Interfaces:** DesignDraft含vehicleId、energyId、sensorIds、rules、groupName；DriverRule含condition/action；DesignRevision另含profileId/designId/revision/designVersion=1、budgetUsed、createdAt。SensorCosts为`Readonly<Record<SensorId, number>>`；`calculateBudget(sensorIds: readonly SensorId[], costs?: SensorCosts): number`、`validateDesign(draft: DesignDraft, costs?: SensorCosts): { valid: true; value: DesignDraft; budgetUsed: number } | { valid: false; issues: string[] }`。costs缺省使用sensor-data的产品目录；测试可注入目录。校验规范化后返回副本。

- [ ] 写失败测试：六设备总100；移除雷达为75；重复/未知设备拒绝；同条件两规则拒绝；非法条件/动作拒绝；没有规则拒绝；无传感器但合法规则有效；组名1–20字。
- [ ] `npm run test:unit -- tests/unit/design/config.test.ts` 先 FAIL；实现目录与纯规则，费用从目录算。提交输入即使附加伪造预算，也不采用。
- [ ] 测试 PASS，`npm run build`；给06发布只读DesignRevision契约，禁止06导入design/controller。

注：现有六设备全部唯一选择时最多100点，正常UI不会产生101点组合。上限算法另用测试目录将lidar费用改成31、其余不变，六设备总101，验证拒绝；产品仍使用原100点目录，不能为了边界测试新增无需求设备。

## Task C2：草稿、提交版本与存储

**Files:** Create src/chapters/design/design-store.ts、tests/unit/design/design-store.test.ts。ChapterContext的design字段与src/app/services.ts的实例管理由集成负责人接入。

**Interfaces:** `createDesignStore(storage: StoragePort | null, profileId: string): DesignStore`；DesignStore提供getDraft/setDraft、commitDesign(draft): DesignRevision、getRevisions，以及`getRevision(designId: string, revision: number): DesignRevision | undefined`，仅查找本profile下的准确提交版本。ChapterContext增加`design?: DesignStore`；app/services.ts负责创建并注入，05和06消费同一(profileId, mode)实例。键futuredrive.design.v1，schemaVersion=1；同一designId提交revision单调递增，读写返回快照。

- [ ] 写失败测试：草稿修改不改变revision1；第二次提交为revision2；非法草稿不能提交；learn成功保存后刷新恢复草稿/版本；损坏JSON或未知schema/designVersion拒绝；旧profile记录不作为新profile当前设计；读写抛错仍使用内存版本并暴露保存状态。
- [ ] 与集成负责人补服务生命周期测试：05/06共享对应实例；跨章节、runtime/WebGL重建与learn→browse→learn切换后仍能读取原learn版本；browse修改不影响learn，新建profile使用独立store。硬刷新时browse不恢复，learn仅恢复存储成功的内容。
- [ ] 对应test:unit先 FAIL，实现最小版本存储；提交再次执行C1校验，输入和存储快照不共享引用。
- [ ] 测试 PASS，支持导出包含完整设计快照的JSON，不做未经验证的导入。

## Task C3：四步配置与设计卡

**Files:** Create src/chapters/design/{view,controller}.ts、styles.css、tests/e2e/design.spec.ts；app/types.ts、app/services.ts、app/chapters.ts、公共路由与styles.css仅由集成负责人负责。

**Interfaces:** `mount(host, context?): ChapterController`；view导出字符串。页面消费context.design与只读learning组名/profileId，不自行创建store；缺少注入服务时不提交或进入测试。统一路由契约由app/types.ts定义：

```ts
type RouteTarget =
  | { chapter: Exclude<ChapterId, 'simulator'> }
  | { chapter: 'simulator'; design?: { designId: string; revision: number } };
// ChapterContext
navigate(target: ChapterId | RouteTarget): boolean;
getRoute(): RouteTarget;
```

提交成功后调用`context.navigate({ chapter: 'simulator', design: { designId, revision } })`；app的serializeRoute将准确版本编码为`#simulator?designId=...&revision=...`，parseRoute/resolveLearningRoute统一处理直达、刷新和前后退，课程门禁只检查CoreChapterId。06读取getRoute指定的提交版本，不能替换为最新版本或草稿。

- [ ] 制作车型→能源→设备预算→条件/动作四步面板；点击/键盘选择均可，不强制拖拽。合法提交生成设计卡与revision，提示保存状态；browse及learn保存失败时提前说明刷新会丢失未保存记录，并提供JSON导出。
- [ ] 浏览器验证100点配置、未知/重复输入拒绝、规则可不配齐但至少一条、修改草稿后旧卡不变、learn成功保存后的刷新恢复和JSON导出。HTML式组名按文本显示。
- [ ] D联调时验证revision1提交后再提交revision2，打开revision1测试入口、直接访问其URL以及前后退仍使用revision1；无引用时06可列出已提交版本或去05；非法引用保留06并说明问题，0、小数、不安全整数、重复字段、非法编码、不存在或异档案版本均不退回最新版本/草稿，不运行仿真。
- [ ] 与D3共同验证存储拒绝→05内存提交→06仿真→runtime/WebGL重建，旧revision和报告仍可读；browse三类记录隔离且硬刷新丢弃，导出文件保留完整提交快照。
- [ ] `npm run test:unit -- tests/unit/design`、`npm run build`、`npm run test:e2e -- design.spec.ts`通过，再将05注册。
- [ ] 06尚未上线时显示设计已保存，不产生指向空页面的“开始测试”；D联调后启用携带提交版本的入口。

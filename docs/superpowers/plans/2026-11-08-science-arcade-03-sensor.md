# 03 2D 传感器实验室 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 本轮仅交付方案；按用户已选择的GPT-6.1-sol执行，总负责人拥有公共契约，Sol集成代理修改公共文件。

**Goal:** 为三至六年级新增独立的 2D 传感器科学游戏，用发射、接收、扫描、测距和信息配合的直接操作完成一场约 3–6 分钟的挑战。

**Architecture:** 新游戏模块放在src/activities/sensor-lab/，真实页面为/games/sensor/index.html；旧展品为/index.html#lidar。使用Vite多页构建，新HTML具有独立main/bootstrap/nav，只挂载本游戏，不导入旧应用runtime或旧展厅controller。activityId='sensor-lab'仅是业务标识，不是hash路由。纯内容与光程函数共享，竞赛/计分/存储沿用新总计划公共契约。

顶栏游戏按钮使用真实页面链接，点击导航到/games/sensor/index.html并切换整个文档，不做原SPA内子页切换。游戏独立完整host，不与旧展厅并排挂载或叠双屏；返回展厅链接为/index.html#lidar。

**Tech Stack:** 现有 TypeScript、Vite、SVG/HTML/CSS、Vitest、Playwright；不新增框架、3D 依赖、后台、账号或在线 AI 请求。

**Spec:** docs/superpowers/plans/2026-11-08-independent-science-games-plan.md包含设计、Vite多页架构与公共契约；评分细则见docs/engineering/2026-11-08-science-arcade-scoring.md。旧总计划/设计的删除保持原样。本轮仅方案，尚未实施。

## Global Constraints

- 新游戏真实地址/games/sensor/index.html；旧/index.html#lidar保留八部件、四步、整机/爆炸/剖视、5–80m基础滑杆、扫描/暂停、模型降级和兼容入口。旧新增guide/world/distance/weather学习面板迁往新游戏，不再挂载。
- 主要体验是 2D 操作舞台，最多三个玩法；提示短而具体，不能换成三组选择题卡或自动播放课件。
- `guided`（引导，建议三四年级）与 `standard`（标准，建议五六年级）档位分开比较，不采集年龄、生日、学校或真实姓名。
- 一场包含三个顺序实验、六个唯一得分目标；正式预算360s、目标180s，练习不计时。以上默认值待真实儿童试用，不能宣称已验证适龄或时长。
- 教学反射点是唯一米制依据；图示标记、测量距离、最近目标判断、纳秒和计分均来自该点的坐标，不另算图标中心或外边界。演示动画放慢与现实光程分开标注。
- 允许教学模拟；可数回波、可见目标和已确认信息是游戏证据，不能写成真实性能、识别准确率、AI 置信度或汽车安全认证。
- 用户本轮本地结果要求覆盖此前无存储限制，仅新增游戏结果持久化；存储按浏览器origin隔离，同电脑不同端口也不同。昵称可自行配置、无需登录；旧教学状态和04原分数保持原样。
- 键盘、触屏、鼠标有同等有效操作和同一容差；拖动必须有按钮/范围输入替代，不把手速或精细触控作为科学能力。
- 新内容仍以运行时 TypeScript 为真源，不能依赖部署外的 `docs/content/*.json`；纯教学文案只维护一处。
- 本轮只交付方案，不执行产品代码、安装、Git 或部署。

## Review Focus

1. 相同挑战码在不同分辨率、帧率与输入设备上必须生成相同米制目标、返回证据和评分。
2. 连续扫描同一角度、双击发射、重复接线或动画结束不能重复完成目标；错误或提示后重试能获探索完成分，但不获该目标首次验证分。
3. 正式暂停/浏览器隐藏继续单调预算；真实页面导航、刷新、pagehide含BFCache记interrupted。返回游戏为ready，不能恢复正式局；练习无预算，不借用旧3D生命周期。
4. 缺 WebGL、缺旧 DAE/GLB、旧章迟到加载、docs JSON 不存在时，新 2D 游戏仍可进入和完成。
5. 显示的距离、样点缺失、干扰点和反馈必须来自本次 snapshot；不能把未确认的空白显示成前方安全或把多装传感器说成总是可靠。

---

## 已检查的现状与内容边界

src/chapters/lidar/learning-data.ts是现有文案真源，包含发光/碰到物体/回波/点云四步、纳秒词汇、三组距离题、正常/雨/雾说明和六类传感器说明。learning-measurement.ts按米制坐标判最近目标和10/20m区间边界；measurement.ts的roundTripNanoseconds使用原光速299792458m/s。learning-state/weather-state属于待迁出的旧学习流程，不作为新游戏运行状态。

learning-world.ts依赖Three.js，用固定示意样点表现雨天额外回波、雾中远目标缺点，没有真实可靠率或竞赛分数；迁移后旧world、三轮距离题、天气问答及相机/逐帧专属分支不再挂载。shared/learning-assessment仅提供单选判定，不能代替操作评分。新游戏使用独立状态，只共享纯内容与物理換算。

原guide、词汇和六张sensorCards全部移入新页资料抽屉/自由练习，共享纯authoring来源。20m/60m光程比较在新练习中用同一教学反射点及原换算承接，不添正式目标。六卡中的GNSS卫星定位及惯导/IMU扩展说明留在抽屉，明确定位与运动信息不等于识别行人；IMU是资料条目，不新增第七个正式目标或第四个玩法。六张现有卡内容不因新增IMU说明被替换，GNSS也不复制成另一张重复卡。旧专用引导中“在现有展品上选择”的操作句改为新练习指令，科学解释仍只维护一份。

## 玩法与一局流程

推荐名称“回波侦探”。准备页显示档位/练习正式/挑战码/六目标；独立页内部含工作台、米制舞台和证据板，各实验主动继续不自动跳关。正式种子只来自挑战码。开始前说明“暂停或后台时倒计时继续；跳转其他页面、刷新会中断本次正式挑战，返回不能恢复”。

### 玩法一：把光送出去，再接回来

孩子旋转发射方向，并按“发射一次”。每个目标有标为“教学反射点”的固定米制标记，教学光束是带宽度的方向区域，包含该点时产生回波；不把图标的外壳当成另一个测距边界。屏幕依次展示设备到该点的发射路径、部分反射、返回设备的回波，不画成所有光都原路返回的镜面反射规律。命中解锁接收目标；孩子将接收器接线头连接到 Rx 插口，再发射一次来接住回波。Tx/Rx 有图形与中文标签，“选中线头→选插口→连接”是拖动的等效操作。

第一目标 `pulse-hit`：首个目标被实际射线命中。第二目标 `echo-received`：第一目标完成后，首次有效接收测试在命中目标且接收器正确接入 Rx 时完成。第二目标未解锁时的第一发射不评价接收首次表现；避免初次教学动作直接罚孩子。没有接线的接收提交是不完整，不记首次；接错 Tx 后发射属于有效错误，有因果反馈。“脉冲没碰到目标”“回波到了设备，但接收器接错插口”分别指出可修正动作。

每次命中从同一教学反射点坐标求 `d`，显示单程 `d m`、往返 `2d m`、`roundTripNanoseconds(d).toFixed(1) ns`，动画旁写“光程动画已放慢”。guided只要求比较远近，standard可展开“往返要除以二”的数轴，均不强制纳秒心算。

### 玩法二：扫描点组成轮廓，再标记最近距离

俯视场景有三个相同大小的参考目标图标，其教学反射点坐标由种子确定，轮廓开始隐藏。孩子转扫描方向旋钮、逐次采样或拖动扫过一段方向；固定角度槽位每个只记录一次，包含反射点的各次教学光束获得同一目标的方向证据，逐步补出轮廓示意。图注写“轮廓为教学示意”；装饰轮廓没有独立测距和评分边界。重复扫同一槽位仍显示回波动画，但不增添新证据。按“确认轮廓”时，三个目标每个都至少两槽才发outline-evidence的correct事实；只出现一条回波或任一目标不足两槽始终facts=[]，没有一条回波就算incorrect的分支，不把早看进度算错答。

然后点选一个已测目标，把米制标记尺移到该目标距离，按“确认最近目标”。`nearest-mark` 要求选择实际最近目标且标尺误差处于档位容差内。舞台地图有距离刻度，测量证据板始终显示已经得到的距离，孩子通过读证据、比较和移动标尺解决，不能靠物体画得更大来判断。反馈示例：“你标在 12m，最近目标回波是 8m，把标尺向设备移 4m。”

### 玩法三：天气改变证据，传感器一起工作

测试道固定有近处路障与远处移动目标。guided是雨，standard是雾；天气是本轮条件，正式挑战中不能切换成晴天降低难度。练习可切换并比较。每目标六个预定教学样点：雨保留四个并添加三个固定干扰点；雾近目标保留四个、远目标保留两个并添加两个干扰点。种子决定被保留的样点ID和干扰位置；这些整数及装饰点云是教学参数，不是设备在现实天气下的准确率，目标的测距和纳秒仍统一对应教学反射点。

孩子把激光雷达、毫米波雷达、摄像头中的两个接线头插入证据板的两个槽，观察不同信息叠加。此场景配置：激光雷达提供近路障的距离证据，毫米波雷达提供远目标距离/相对运动证据，摄像头在本轮提供不足以解决两项任务的图像。sensor-evidence要求接入激光雷达+毫米波雷达并确认两条目标证据；两个槽均接入不同传感器后“核对证据”才是有效提交，摄像头组合属于有效错误，少一根或空连接只呈现不完整状态且facts=[]。未供信息标“未确认”，不能标“没有目标”。场景只说明此条件下的配合，不推广成任何天气固定优劣。

最后孩子操作测试车的“继续/慢行/停下”档位杆，并打开提示灯，按“应用观察方案”。本轮封闭测试道的 8m 处有路障，4m 处标出游戏观察线；`risk-response` 要求停在观察线并提示，明确文字“这是游戏观察位置，不是现实制动距离”。错误继续时只演示计划路径进入未允许区域，不制造碰撞恐吓；反馈“前方路障已确认，先在观察线停下并提示”。若证据尚不足，继续同样不给通行结论。六目标完成后给分项卡和一条引用本局证据的观察总结。

### 难度、舞台和输入

guided发射角步长4°、教学光束半角6°、距离尺步长1m、标尺容差±1m；standard发射角步长2°、教学光束半角4°、距离尺步长0.5m、容差±0.5m。光束角是游戏输入容差，不是真实设备参数。扫描采样角固定-40°到+40°、每4°一个槽，两档相同；输入从一槽跳到另一槽时消费经过的每个槽，键盘和触屏得到相同采样，不按采样事件密度给分。standard有更多待核对点和较少默认说明展开；固定六目标和同档位共同标准不变。

常驻操作引导不影响首次验证分；主动答案提示通过公共assistant明确说明“此目标仍可获得探索分，首次验证分不再获得”，先锁定该目标domain state的usedHint，后续合法评分事实携带true；提示动作本身不发评分事实。提示、纠正都不扣探索完成分。公共assistant仅根据本局状态给确定性短反馈，不调用在线AI、不评分孩子的自由文本。连胜动画仅为装饰。

桌面参考舞台viewBox="0 0 1200 720"；手机按区域纵向排列，不缩小整个页面到不可点击。核心操作目标至少44×44px，正文和按钮至少18px、辅助标签至少16px，焦点可见。舞台线条、路径方向、插口和有效/待核对证据有文字与形状提示，颜色不是唯一含义。用原生范围输入/button/fieldset，键盘左右调方向/尺、Enter/Space发射与提交；连线通过选择按钮完成。SVG为图示，证据同时有可访问DOM列表；aria-live=polite只播报提交结论与阶段变化，不逐帧播回波。减少动画仍有静态等价结果。

同一练习局已完成目标只读，不撤销或再计一次；仅修正未完成草稿。“再练一遍”若session仍running先finish('abandoned')，再session.start(newPracticeConfig)，仅start返回ok才重建domain state；已终局则直接start。新runId、提示锁、revision与样点集合重建，不提供retraction API。

## 文件与接口地图

| 文件 | 责任 |
| --- | --- |
| `src/content/sensing/principles.ts`（新） | 共享纯四步、术语、天气因果说明、传感器说明；独立类型，保留旧 sourcePartId |
| `src/content/sensing/measurement.ts`（新） | 原光速常数与往返纳秒函数，无 DOM 或 Three.js |
| `src/chapters/lidar/measurement.ts`（修改） | 从共享 measurement 重导出原 API |
| `src/chapters/lidar/learning-data.ts`（修改） | 兼容导出共享纯文字及旧题目数据；旧学习UI/state/world撤挂由集成任务D1负责 |
| `src/activities/sensor-lab/types.ts`（新） | 场景、证据、目标、动作及 snapshot 类型 |
| `src/activities/sensor-lab/content.ts`（新） | 新游戏短指令、反馈、六目标及档位；引用共享原理，不复制旧文案 |
| `src/activities/sensor-lab/scenario.ts`（新） | 同挑战种子生成米制位置、天气样点、目标与固定信息覆盖表 |
| `src/activities/sensor-lab/measurement.ts`（新） | 教学光束包含反射点的判定、同点单程距离、采样槽与证据计算 |
| `src/activities/sensor-lab/state.ts`（新） | 三实验顺序 reducer、输入校验、重试、唯一目标解算 |
| `src/activities/sensor-lab/view.ts`（新） | 2D SVG 和可访问 DOM 更新，只从 snapshot 读取 |
| `src/activities/sensor-lab/controller.ts`（新） | 挂载、输入转动作、共享 run 事件、生命周期 |
| `src/activities/sensor-lab/styles.css`（新） | 以 `.sensor-lab` 为作用域的桌面/触屏布局与反馈动画 |
| `games/sensor/index.html`与独立main/bootstrap/nav（主计划） | Vite真实多页入口，游戏按钮导航到该HTML，独立挂载sensor模块；不注册原SPA七页 |
| `src/shared/arcade/{types,session,scoring,storage,challenge-code}.ts`（主计划） | 统一session、挑战码、规则、计时与origin内记录 |
| `src/ui/arcade/{shell,results,assistant}.ts` 与 `styles.css`（主计划） | 公共开始页、结果卡、确定性提示与UI样式 |

确定接口：`createSensorScenario(setup:{seed:string;profile:'guided'|'standard';contentVersion:string}):SensorScenario`；`createSensorState(scenario:SensorScenario):SensorState`；`reduceSensorLab(state:SensorState,action:SensorAction,scenario:SensorScenario):SensorTransition`；`getSensorSnapshot(state,scenario):SensorSnapshot`。

SensorTransition={state,facts}，DomainFact={objectiveId,revision,verdict:'correct'|'incorrect',usedHint}。真实编辑递增revision，不完整/重复检查不发事实；每个running操作先算候选再record(candidate.facts):boolean，仅true才提交state，空facts仍过守卫。session绑定runId/seq，record返回后microtask通知；首次subscribe立即，初始state先准备。模块导出view:string和mount(host):ChapterController，由独立HTML bootstrap调用，factory创建本页session，不挂载旧app。暂停/隐藏继续预算，页面导航/pagehide含BFCache/dispose中断；返回游戏显示ready，不恢复正式局。独立bootstrap只报告activeDraft；明确“结束未完成挑战”才按expectedRunId清理，说明会结束对应其他窗口的局。mount不恢复草稿。

SensorSnapshot至少提供stage、ray、measuredTargets[{id,reflectivePoint,distanceMeters,roundTripNanoseconds,uniqueSampleIds}]、weatherEvidence[{targetId,visibleSampleIds,noiseSampleIds,confirmedFields}]、feedback。所有图示反射点、米数、纳秒及给分证据从这些字段读取。初版contentVersion='science-arcade-content-1'，公共scoringVersion拥有700/200/100公式与targetMs=180000，正式durationMs=360000。六个目标权重总和1000：pulse-hit:150、echo-received:100、outline-evidence:150、nearest-mark:200、sensor-evidence:200、risk-response:200；权重不是直接得分。结果status/reason仅completed|timeout|abandoned|interrupted。

## Task S1：提取纯原理并生成确定性实验场景

**Files:** Create content/sensing 两文件、sensor-lab `types.ts`、`content.ts`、`scenario.ts`、`measurement.ts`；Modify 旧 `lidar/measurement.ts`、`learning-data.ts`；Test `tests/unit/sensor-lab/scenario.test.ts`、`measurement.test.ts`、现有 lidar measurement/content portability。

**Interfaces:** Produces上述场景接口及 `getDistanceMeters(point:{x:number;y:number}):number`、`hitReflectiveMarker(origin,directionDegrees,target,halfAngleDegrees):RayHit|null`、`getScanSlotsBetween(previousDegrees,nextDegrees):readonly number[]`。每目标有唯一 `reflectivePoint:{x,y}`；光束方向与该点bearing差不超过halfAngle即返回这个固定点。目标图标、装饰轮廓没有独立命中/测距边界。`RayHit`提供该点、单程距离和同距离的纳秒值。

- [ ] 固定测试种子7K2M4C的三个教学反射点距离[8,16,28]m、方向[-20,0,20]°；同种子对象深相等，不同种子只在预设可解模板选取。所有目标bearing在±32°以内，guided与standard均至少有两个可达扫描槽；每模板检查不存在重叠、平距并列及不可完成目标。所有模板近反射点8m，初版只置换图标/名称与三条bearing配对；新增模板须升级内容版本。
- [ ] 测试方向0°、反射点(0,16)：返回单程16m、往返32m、106.7ns，图示点、显示米数、纳秒与评分都使用这个点；装饰外壳改变不影响结果。guided标尺误差1m通过、1.01m失败，standard 0.5m通过、0.51m失败；沿用原光速299792458m/s，30m显示200.1ns、60m显示400.3ns、负值仍抛RangeError，不为游戏另造3e8常数。
- [ ] 运行 `npm run test:unit -- tests/unit/sensor-lab/scenario.test.ts tests/unit/sensor-lab/measurement.test.ts`，确认新增接口缺失而失败。
- [ ] 提取文案和原物理函数，保持旧导出与旧内容对象值相同；生成有稳定样点ID的可解模板，天气遮点只改变证据，不改变教学反射点真值。
- [ ] 重跑上述测试及现有lidar measurement/content portability，确认缺docs JSON仍运行；20m/60m练习沿用原换算，抽屉六张现有卡及GNSS/IMU资料齐全且不计分。运行npm run build。

## Task S2：三个玩法的独立状态与证据解算

**Files:** Create `src/activities/sensor-lab/state.ts`；Test `tests/unit/sensor-lab/state.test.ts`、`evidence.test.ts`。

**Interfaces:** Consumes S1场景/几何；Produces `createSensorState`、`reduceSensorLab`、`getSensorSnapshot` 及六目标DomainFact。共享session拥有首次结果、提示锁和分数，游戏reducer只报告合法操作事实。

- [ ] 测试光束未包含反射点失败、真实改变方向后成功，接收目标未解锁不被首次发射评价；Rx成功、Tx失败、未接线只呈现不完整状态且facts=[]；真实编辑递增草稿revision，同草稿重复检查及成功后动作不发新fact，session去重。
- [ ] 测试扫描21槽按顺序和一次跳过角度得到同一unique集合，重复扫描不增加点；零点、一点、任一目标不足两槽时facts=[]，三个目标均两槽时仅发一次correct事实。尺与最近选择共同判定，错误可真实编辑重试，成功后继续最多一实验；练习完成目标只读，整局replay结束旧run再创建新run，不撤回已完成目标。
- [ ] 测试天气有效/干扰ID固定且互斥；已测米数与显示反馈一致；激光+毫米波覆盖本轮两项，填满两槽的摄像头组合发incorrect，少一槽/空连接facts=[]；“未确认”不被当无目标；停车+提示成功，慢行/继续不通过封闭测试道目标。
- [ ] 运行 `npm run test:unit -- tests/unit/sensor-lab/state.test.ts tests/unit/sensor-lab/evidence.test.ts` 确认失败，然后实现 reducer；阶段前置条件和首次提交时机必须按上述决策，不按动画推进。
- [ ] 重跑S1/S2测试，断言六权重总和1000，同样操作序列生成相同证据与facts；点击答案提示只锁状态且facts=[]，随后合法正确事实usedHint=true，常驻引导不锁提示；不同模拟帧率不影响结果。

## Task S3：可操作的 2D 舞台与独立子路线

**Files:** Create sensor-lab view/controller/styles；Sol集成者接入games/sensor/index.html的独立main/bootstrap/nav和Vite多页输入，不注册原SPA七页；Test tests/e2e/sensor-lab.spec.ts、tests/unit/sensor-lab/controller.test.ts。

**Interfaces:** Consumes S2 snapshot及公共session factory/shell；Producesview:string与mount(host):ChapterController。controller算候选、record boolean为true才提交领域状态，空facts仍过守卫；session绑定runId/seq、延后microtask通知、评分/计时/保存。公共文件由Sol集成代理修改。

- [ ] E2E 先写真实鼠标/键盘两条完成路线、390×844触屏路线，分别操作方向、Rx连接、扫描旋钮、距离尺、两传感器接线、档位杆与提示灯；断言六目标和最终证据，不直接向 reducer 灌答案。
- [ ] 测试record true才提交候选、false保留原状态、空facts守卫、postreturn microtask无竞态。独立HTML直入和顶栏按钮跳页均挂本游戏，旧app/controller从未挂载；重复active/dispose无重复监听。隐藏继续预算，真实页面导航/pagehide含BFCache中断，返回ready无正式恢复。bootstrap只报告、开B不结束A、显式expectedRunId才清理；缺WebGL/DAE/GLB仍可完成。
- [ ] 运行 `npm run test:e2e -- tests/e2e/sensor-lab.spec.ts` 和 controller 单元确认新页面缺失导致失败。
- [ ] 实现三实验舞台与原生输入等效操作，接入独立路线；减少动画、非颜色提示和证据 DOM 列表一起交付。所有 hover 说明须可聚焦或点击展开。
- [ ] 实际查看1440×900和390×844截图，验证18px正文、舞台标签、分项卡、接线替代控件、错误/重试无截断；运行构建、S1–S3与lidar-domain回归。迁移后的lidar-learning/learning-route测试把学习行为移至sensor-lab，不保留旧学习面板仍挂载的断言。

## Task S4：练习/竞赛结果与回归验收

**Files:** Modify sensor-lab controller/content 的共用服务集成；Test `tests/e2e/sensor-lab-competition.spec.ts`、共用 arcade scoring/storage 测试；Documentation update `docs/development/lidar-content.md` 的双入口与共享文案维护说明。

**Interfaces:** Consumes计分提案的挑战码、六目标、首次锁、单调时钟及本地结果服务；Produces本游戏有效结果，`activityId='sensor-lab'`，原旧LiDAR教学reducer不参与。

- [ ] 两独立 browser context 输入同码、相同操作和假时钟，目标/证据/分项相同，而本地历史互不出现；不同档位分组，练习明确标记，正式重玩不能替换首轮记录。
- [ ] 权重200目标首次错后修正或提示后首次成功、270s完成仍910；重复/连胜不改分。隐藏/暂停至360s超时；180s真实导航离开游戏产生一次interrupted且score=null，返回ready不能恢复该正式局。刷新/pagehide含BFCache同样中断；旧展品暂停按原语义。
- [ ] 测试storage配额或禁用时分数卡可读且显示未保存，损坏键不白屏。回到旧LiDAR验证原5–80m基础滑杆、整机/爆炸/剖视、八部件、四步展示与扫描/暂停保持；旧新增learning-world、距离轮次和天气学习状态/事件不再挂载或更新。新练习抽屉承接guide、六卡和20/60m例；重开新游戏不重置旧基础展品控件。
- [ ] 运行 `npm run test:unit -- tests/unit/sensor-lab tests/unit/arcade`、`npm run build` 及上述新旧E2E；通过后更新开发文档的共享 authoring 真源、版本参数、教学示意说明和完成证据。此方案阶段不声称这些测试已经运行。

## 实施依赖与范围外

公共依赖由新独立游戏总计划锁定：Vite多页HTML/main/bootstrap/nav、/games/sensor/index.html、共享arcade和UI、DomainFact/session契约。S1/S2规则不改变，S3/S4接入独立文档；不新增原SPA七页注册，不依赖旧展品controller，不恢复已删除旧计划。

本期不添加在线AI、多电脑自动榜、虚构班级排名、跨活动总分、打印/导出、教师聚合/导入、摄像头采集、真实传感器接口、任意地形编辑器、3D复刻、物理制动模拟或另一组天气题卡。各电脑显示同码同档位分数卡已满足比较；打印/导出单卡只属未来可选。真实儿童试用、档位容差和时长观察留给后续课堂验证，当前方案没有该证据。

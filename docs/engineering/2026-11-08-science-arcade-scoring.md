# 01–03 科学游戏：本地竞赛与计分提案

状态：本轮仅制定方案；没有实现存储、排行榜、产品代码或部署。配套实施计划见 `docs/superpowers/plans/2026-11-08-science-arcade-plan.md` 和三个游戏子计划。本文已按主计划锁定共用接口和规则；默认时长与档位仍需真实儿童试用，不是经过课堂实验验证的结论。

## 目的和授权边界

面向三至六年级，每名孩子使用自己的电脑。成绩用于比较一次科学游戏挑战的表现，不是考试成绩、真实车辆性能、真实 AI 置信度或个人学习能力评价。可采用教学模拟及确定性的游戏评分，结果必须能从实际操作和显示的证据解释。

用户这轮明确要求本地记录，**覆盖此前“无持久存储”的限制，仅适用于新增01–03游戏结果**。原展厅基础交互、3D雷达原八部件/四步/5–80m滑杆/模式/扫描及04原分数和重置保持；后来新增的旧学习面板迁往独立游戏，不继续挂载旧学习状态。旧答题日志不迁入新成绩。

`localStorage` 属于当前浏览器、设备和站点 origin（协议、主机、端口共同确定来源）。不同电脑不会自动共享数据；同一电脑从 `localhost:5173` 换到 `localhost:4173` 也会使用另一份存储。换浏览器、无痕窗口或清除站点数据可能看不到原记录。没有登录、后台服务、自动班级榜或网络传输。

## 可比较的同一场挑战

默认方式：老师公布同一个挑战码，所有孩子在各自电脑输入，完成后并排查看分数卡。本期不做打印、导出、跨活动总分、教师聚合、JSON导入、人工录分界面、班级排名或模拟的其他孩子成绩。

挑战码格式为 `SA1-R07-7K2M4C-G`：`SA1` 是码格式版本，`R07` 是老师自定义的本轮编号，六位不含易混淆字符的 Base32 值是场景种子，`G/S` 分别表示 `guided/standard` 档位。字符表固定为 `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`，输入去首尾空格、转大写，拒绝错误段数及未知版本，不静默换成随机场景。相同码与游戏包版本生成完全相同的目标、干扰项、天气、任务顺序和输入容差；动画帧率不影响答案。正式种子只能来自这个公布的挑战码，不能使用本机日期或时钟随机生成一个号称可比较的场景。

分数可比较的完整键：`{activityId,challengeCode,profile,contentVersion,scoringVersion,durationMs}`。activityId固定为 `history-lab|structure-lab|sensor-lab`，与活动route使用同一身份；只有mode='contest'且eligible的实际结果用于比较。单独比较01、02或03，不合成跨游戏总分。不同档位、内容版本、评分版本、时长、练习与竞赛分组显示；版本变更保留旧结果的原标签，不重算成新规则。

两档为 `guided`（引导，建议三四年级）和 `standard`（标准，建议五六年级）。这是可自行选择的支持程度，不要求年龄、生日、学校或真实年级资料。两个档位有独立比较键。同一班统一档位、统一可用练习机会、统一提示规则及挑战时长；设备大小、鼠标、触屏和键盘不改变命中容差、题目数和评分权重。建议适龄范围仍待真实儿童试用。

## 练习、竞赛和重复挑战

练习不计时，允许任意重试、提示、暂停和重开，结果明显标为“练习记录”；显示完成目标和观察证据，不生成竞赛总分或时间奖励。正式开始前展示挑战码、档位、版本、规则、预计3–6分钟及“游戏分数”说明；准备页面不计时。正式统一durationMs=360000，目标奖励时长targetMs=180000属于同一个scoringVersion的规则，不另设时长版本。界面明确写“暂停、切页和后台时，挑战倒计时仍继续”。

练习中已完成目标只读，仍可浏览证据，不能撤回或再计一次；仅修正未完成草稿。整局重玩若当前running，先session.finish('abandoned')，再session.start(newPracticeConfig)；已终局则直接start。只有start成功后重建全部domain state，创建新runId、提示锁与revision，不提供retraction API。

正式挑战在“开始挑战”时记录本地参赛锁。每个本地昵称槽位、每个比较键只有第一次正式尝试可以产生可比较成绩。正式完成和时间到均保留这个锁；重复点击开始、刷新或重开不能抹掉第一次表现。再次游玩显示“重玩练习”，不替换正式记录。新一轮由老师换 `Rxx`，所有孩子获得同样的新机会。昵称更改仍属于同一槽位；“换下一位玩家”才创建新槽位，不用姓名作身份键。

普通站内hash导航保留已挂载页面的局，暂停该页输入与绘制，正式倒计时继续。手动结束当前局记abandoned；本页pagehide（含BFCache）记interrupted。bootstrap仅一次检查并报告activeDraft，绝不自动终止，因为另一窗口可能仍在玩；活动mount不检查/恢复草稿。UI“结束未完成挑战”明确说明也会结束其他窗口的对应局，用户点击后调用recoverInterruptedArcadeDraft(repository,expectedRunId)，核对最新draft仍为该run后只终局一次，生成interrupted记录而非恢复比赛。ID不符或已终局则不操作。退出记录不生成有效竞赛总分；老师换轮次码再组织新局。本地规则用于诚实课堂操作，不提供防作弊认证。

## 显式计分公式

每游戏目标权重总和固定为 `W=1000`，权重不是可直接领取的分数。某目标首次完成只领取一次权重。目标可被纠正后完成，但第一次**有效的实质提交**是否正确单独锁定；不完整输入、未知 ID、重复 DOM 事件、动画结束事件都不构成新提交。每游戏明确哪些动作是实质提交，拖动过程及纯浏览不给分。目标首次完成前使用显式答案提示，会失去该目标的首次验证权重；常驻操作说明和档位默认引导不属于答案提示。

令 `E` 为已完成的唯一目标权重和，`F` 为首次实质提交就正确且完成前未用答案提示的目标权重和，`t` 为正式挑战耗时，`B=360000ms`、`T=180000ms`：

```text
探索完成分 P = floor(700 × E / 1000)
首次验证分 Q = floor(200 × F / 1000)
时间奖励   H = 全部目标完成
               ? floor(100 × clamp((B - t) / (B - T), 0, 1))
               : 0
游戏总分   S = P + Q + H，范围 0–1000
```

时间奖励最多占 10%，连胜只作装饰，不设置帧数积分或点击次数积分。孩子先看见因果反馈，再重试，仍能取得全部探索完成分；失败不随机扣分。`F` 按目标权重累加，不按重试次数处罚；重试不增加或减小其他目标分。提示前后都能获得该目标的探索完成分；成功后查看说明不追溯扣分。显示分项及“纠正后完成也能获得探索分”，不只给一个总数。

| 场景（B=360s，T=180s） | E | F | t | P/Q/H | 总分 |
| --- | ---: | ---: | ---: | --- | ---: |
| 全部首次正确，180s 完成 | 1000 | 1000 | 180s | 700/200/100 | 1000 |
| 全部首次正确，270s 完成 | 1000 | 1000 | 270s | 700/200/50 | 950 |
| 权重 200 的目标首次错误后纠正，270s 完成 | 1000 | 800 | 270s | 700/160/50 | 910 |
| 权重 200 的目标完成前看答案提示，再首次正确，270s 完成 | 1000 | 800 | 270s | 700/160/50 | 910 |
| 时间到，仅完成权重 600，其中首次正确 400 | 600 | 400 | 360s | 420/80/0 | 500 |
| 3 次同一成功事件、重复继续按钮 | 1000 | 800 | 270s | 仍为 700/160/50 | 910 |
| 手动结束、刷新或页面退出 | 任意 | 任意 | 任意 | 显示观察记录 | 无有效总分 |

终局reason与结果status统一为completed|timeout|abandoned|interrupted。timeout有效且显示“时间到，完成x/n”，completed为成功。本期只并排核对真实成绩卡，不创建排序榜或虚构同学。总分及各分项、原始耗时均展示，相同表现可标并列，不用昵称、保存时间或随机值制造差异。

## 事件归属、计时和冻结

游戏reducer产出领域事实 `DomainFact {objectiveId,revision,verdict:'correct'|'incorrect',usedHint:boolean}`，不自行产出分数。revision是该目标可编辑草稿的版本：真实编辑改变答案时递增，重复检查同一草稿不递增且不重复发事实；不完整输入、无效ID、纯浏览和重复无变化事件不发评分事实。显式答案提示只锁domain state中的提示标记，后续合法事实携带usedHint=true，不假造correct/incorrect事实。controller仅调用session.record(facts)，由session自身绑定当前runId和单调seq，检查目标ID、runId、seq及objectiveId+revision。共享session保留首次有效提交、完成目标和提示影响。后续正确可以完成目标，不能改变首次错误或提示影响；双击、长按、键盘合成点击及重复扫描不能重复领取。

record(facts):boolean是每个running玩法操作的提交门：controller先计算候选transition，调用record(candidate.facts)，只有true才提交candidate.state；false则保留原状态。空facts可用于纯编辑/提示/不完整输入的时间与active守卫，不代表得分。session通知在record返回后以microtask发送，避免最后目标自动结束时订阅回调抢先冻结候选状态；仅subscribe初次立即回调。controller须先准备初始state再订阅，不在回调中重入提交。

共享时钟提供 `nowMs(): number`，生产使用 `performance.now()`，测试使用可推进的单调假时钟。`elapsedMs=max(previousElapsedMs, nowMs()-startedAtMs)`，不使用动画 delta 累加，不用 `Date.now()`、设备时区或存档日期计算成绩。终止时先结算时钟再消费动作；恰好到 `B` 时，时间到优先于该时刻的新提交。完成时冻结真实 `elapsedMs`（限于 B），重复完成回调不再改变分数。

练习没有预算时钟，暂停只冻结动画与操作。竞赛暂停、隐藏或切到另一站内页面冻结动画、遮住证据、禁用输入，但预算时钟继续；session 在未激活时仍可到期，回到已挂载页面先结算时间，超时直接显示结果。提示首次进入正式挑战前统一说明。旧 3D controller 不参与此时钟。页面刷新/卸载不追算跨会话单调时间：草稿标为 `interrupted`，显示最后检查点且不参与比较，不恢复正式挑战。

同一浏览器、同一origin通过repository尽力限制一个未终局正式挑战。切到另一活动后开始正式局，返回other-run-active并提供原局链接，不静默清除它。打开窗口B只报告A的activeDraft，绝不结束A；显式“结束未完成挑战”才按expectedRunId清理对应局。repository核对所有权，storage事件发现确实被其他窗口接管时原局中断。localStorage无原子事务，不保证恶意竞争安全；bootstrap只检查报告一次，不执行终局恢复。

## 本地数据契约

唯一新增键 `science-arcade:local:v1`，不读取、改写或清除任何旧章节键。共享实现文件固定为 `src/shared/arcade/{types,session,scoring,storage,challenge-code}.ts`，UI固定为 `src/ui/arcade/{shell,results,assistant}.ts` 与 `styles.css`。以传入存储适配器和时钟测试，不在模块加载时访问浏览器。每个活动导出 `view:string` 和 `mount(host):ChapterController`，挂载时通过共用 factory 创建页面session；session 的 `start/record/finish/subscribe/setActive/dispose` 分别负责开始、事实、终局、视图订阅、显示激活和清理。

```ts
interface ArcadeLocalStoreV1 {
  schemaVersion: 1;
  dataVersion: 'science-arcade-1';
  revision: number;
  preferences: { slotId: string; nickname: string; profile: 'guided'|'standard';
    lastChallengeCode: string|null; soundEnabled: boolean }; // default false
  activeDraft: null | { runId: string; slotId: string; comparisonKey: string;
    config: ArcadeRunConfig; objectives: readonly ObjectiveProgress[];
    elapsedMs: number; startedEpochMs: number; savedEpochMs: number };
  contestLocks: { slotId: string; comparisonKey: string; runId: string; createdEpochMs: number }[];
  results: ArcadeResult[];
}
```

ArcadeRunConfig、ObjectiveProgress、ArcadeResult直接引用master2.2的公共types，不另建扁平结果类型。完整config含activityId/mode/profile/challengeCode/contentVersion/scoringVersion/durationMs/slotId/nickname/目标定义；activeDraft只存正式局，config.slotId与外层slotId一致，comparisonKey由config生成。完整目标进度和elapsedMs足以在显式清理时生成同runId的interrupted记录，score=null、eligible=false、createdEpochMs取startedEpochMs；savedEpochMs只管理检查点，绝不用于跨加载恢复计时。成功保存终局后清同run draft，重复清理或ID变化不得写第二条。

新建匿名槽位默认昵称“实验员”；昵称可选，显示最多 12 个 Unicode 字符，输入去首尾空格、过滤控制字符，用 `textContent` 渲染，不允许富文本。提醒用代号，无姓名、头像、邮箱、身份证、位置、学生 ID 或第三方统计。`slotId/runId` 是设备内随机标识，不能解析出人身资料。结果保存昵称快照，改名不改历史署名。

repository.updatePreferences(partial)保存昵称/档位/挑战码/声音偏好，soundEnabled默认false。repository.createPlayerSlot(nickname?)供“换下一位玩家”创建新槽位，不以改昵称释放当前槽位的正式锁。01开放理由原文只在当前页内存展示，不写config、结果、草稿或preferences。

保存正式开始的完整config/目标摘要草稿与锁、终局结果和显式偏好；最多每5s检查点更新elapsedMs/objectives/savedEpochMs，不存帧、轨迹、按键原文、开放理由、截图或指纹。练习仅终局保存。成绩卡读当前内存校验结果，保存失败不会改变分数。

保留最近 30 天、最多 200 条终局记录和 200 条锁；开始页显示保留规则。先清除过期项，再按时间淘汰最旧记录，锁与对应正式记录一起保留。相同比较键的锁在保留窗口内不因“删除这条成绩”解除。锁容量满且未过期时，允许练习并提示清理或换设备，不能静默删除锁以接受重复正式成绩。过期按 `Date.now()` 只管理保留，不影响评分；检测当前日期早于存档日期时暂不做时间删除，继续容量限制。

“重玩”按整局finish/start创建新练习，不撤回旧目标；“换下一位玩家”调用createPlayerSlot；“删除这条记录”保留正式锁；“清除本机游戏记录”明确展示删除数量与活动局影响、二次点击后清本键结果/锁/草稿而保留偏好；“恢复本机游戏初始状态”才恢复匿名与静音默认。绝不localStorage.clear()；删除后无法核验旧参赛次数，如实说明，老师可换轮次码。

## 解析、迁移与失败

读取/写入/删除均捕获 `SecurityError`、`QuotaExceededError` 和 JSON 错误。不可用时使用本页内存记录，持续显示“本次成绩可查看，本机未保存”；不禁用学习、不发送数据、不伪装保存成功。正式挑战在只读/禁用存储条件下可玩，但显示“本页临时挑战：刷新会丢失记录”，只参与人工核对，不宣称本地次数锁可靠。写失败不覆盖最后一份有效字符串。

解析器逐字段验证版本、枚举、字符串长度、正式durationMs=360000及有限非负elapsedMs、练习durationMs/elapsedMs为null、目标唯一性、权重总和、firstCorrect⇒completed&&!usedHint、分项公式和总分范围；存档显示可据合法目标摘要重算同版本分数，不信任外来total。练习、abandoned与interrupted的score为null且eligible=false，只有首轮正式completed/timeout可eligible。格式损坏则退回空内存并提示，保留原始键供显式清除，不自动覆写。单条结果损坏时丢弃该条并报告条数，保留其锁与合法记录。未知较新schema只读保留并提示版本不兼容，不降级覆写。

首版无历史新游戏schema，因此不虚构迁移。后续升级使用纯函数migrateArcadeStore(raw,targetVersion)：只接受已知旧版，补缺省字段、保留原contentVersion/scoringVersion/durationMs及旧分数；完整验证后一次写新键，写失败留旧键。旧章节transient状态没有迁移路径。

对照当前显示的成绩卡足以完成本轮比较。打印/导出单卡及教师汇总均属后续可选范围，不进入本期文件或验收。

## 实施验收

1. `tests/unit/arcade/scoring.test.ts` 固定验证上表、0/1000边界、非法权重、同revision重复检查、首次错后真实编辑纠正、完成前提示/完成后说明、重复终局、先超时后提交、不同档位/版本/时长不能比较；连胜不改分。
2. `tests/unit/arcade/session.test.ts` 验证record boolean守卫与空facts、拒绝不提交domain state、session绑定runId/seq、通知postreturn microtask/首次订阅立即、练习已完成只读与整局重玩；暂停/隐藏/hash导航继续正式时间，预算边界优先，pagehide含BFCache中断。
3. `tests/unit/arcade/storage.test.ts` 验证完整config/目标摘要草稿重载、开B不结束A、显式expectedRunId清理中断一次/ID不符不操作、bootstrap只报告/mount不检查；偏好静音默认/updatePreferences/新玩家槽位/改名不解锁；配额禁用/损坏/未来schema/保留清除/容量/常规所有权。01理由原文从所有序列化对象排除；迁移新增须旧版固定样本。
4. `tests/e2e/arcade-competition.spec.ts` 两独立context同码同动作/时间同分、记录互不出现，不同origin/端口隔离；同origin开B不结束A，明确清理后A对应局才中断。练习正式分组、改名不解锁、重玩不替换、hash返回保留局且时间继续、隐藏超时/pagehide中断/存储失败仍可玩；旧基础展厅与04原分数回归。
5. `npm run test:unit -- tests/unit/arcade`、`npm run build`、相关新旧 E2E 通过后才记录为实现完成。此文的测试与公式示例是待实现验收，并非当前已执行的产品验证。

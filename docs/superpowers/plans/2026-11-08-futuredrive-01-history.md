# 01 History：汽车进化任务 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有历史图文上增加三项学习任务，生成汽车进化知识卡并解锁 02。

**Architecture:** 图文展品和题目数据独立存放，纯规则计算成绩，章节控制器管理交互和报告。通过统一 ChapterContext 写入档案，模块不直接访问 localStorage 或修改全局导航。

**Tech Stack:** 原生 DOM、TypeScript、现有图文资源、Vitest 纯逻辑测试。

**Spec:** [设计稿第 4 节及全局要求](C:/Codex/citygame01/docs/superpowers/specs/2026-11-08-futuredrive-learning-route-design.md)；[公共接口与执行顺序](C:/Codex/citygame01/docs/superpowers/plans/2026-11-08-futuredrive-plan.md)。

## Global Constraints

- 只编辑 `C:/Codex/citygame01/src/chapters/history/` 和 `tests/chapters/history/`；其他变更由公共负责人整合。
- 保留现有 14 件中国新能源展品和年代跳转；新增五个主题，不修改其他展厅或共享资源。
- 三任务共 15 分：A 5、B 5、C 5；C 是参与分，不判观点正确性。
- 使用公共首答计分与掌握规则，浏览模式只产生临时练习记录。
- 全部遵守设计稿和总计划的版本、模式、生命周期与输入显示要求。

## Review Focus

1. 时间线同一卡片重复放置或未知卡片：不能刷分或被算作完整时间线。
2. 触屏和键盘没有拖动能力：可通过选择卡片和阶段完成同一任务。
3. 未来理由只有空白或包含 HTML：前者无效，后者只显示原文本。
4. 年代导览与任务主题同时存在：原 14 展品仍能按唯一 ID 跳转。
5. 重试和刷新：首答不覆盖，已掌握任务恢复，预测参与分不重复累加。

## 文件与接口

S0 已创建 view.ts/index.ts。01 创建 data.ts、rules.ts、chapter.css；测试为 tests/chapters/history/rules.test.ts 和 completion.test.ts。

data.ts 导出 `historyExhibits`、`archiveAssets`、`timelineCards`、`technologyQuestions`、`predictionOptions`。五主题 ID 为 `birth | mass-production | new-energy | smart-assistance | future`；时间线每主题一张代表卡。

rules.ts 导出：

- `scoreTimeline(placements: Record<string, string>): TaskAssessment`：五张卡每正确位置 1 分，五张合法且全部正确才 correct。
- `scoreTechnologyMatches(answers: Record<string, string>): TaskAssessment`：固定三题，`Math.round(5 * correctCount / 3 * 10) / 10`，三题全对才 correct。
- `assessPrediction(technologyIds: string[], reason: string): TaskAssessment`：1–2 个不重复的已知技术；`Array.from(reason.replace(/\s/g, '')).length` 为 10–200；有效则 5 分，否则 0 分。

必做 ID：`history.timeline`、`history.technology`、`history.prediction`，由公共负责人登记。产出 `renderHistoryChapter(): string`、`setupHistoryChapter(host: HTMLElement, ctx: ChapterContext): ChapterController` 和 history 的 ChapterResult。

## Task H1：三项任务的题库与规则

**Files:** Create data.ts、rules.ts、tests/chapters/history/rules.test.ts；Modify view.ts。

**Interfaces:** Consumes 公共 TaskAssessment；Produces 本节三个评估函数及任务数据。

- [ ] 先写失败测试：五正确位置得 5；三正确位置得 3 且未掌握；重复/未知卡不构成完整提交；技术三题全对 5、两题正确 3.3；有效预测 5、空白/9字/201字/重复技术/未知技术 0。
- [ ] 运行 `npm.cmd run test -- tests/chapters/history/rules.test.ts`，确认失败来自尚未实现的规则。
- [ ] 实现纯规则和题库；保留现有展品映射，新增阶段主题时核对每个图片来源和图注，未来预测优先复用可合法使用的科普示意图。
- [ ] 测试变绿；修改 view.ts 加入任务面板，阶段/卡片/问题/选项全部使用数据 ID，不依赖按钮排序。
- [ ] 浏览器核对原年代跳转、图片和新主题互不覆盖；提交此任务文件。

## Task H2：可操作任务、知识卡与档案

**Files:** Modify index.ts、view.ts、chapter.css；Create tests/chapters/history/completion.test.ts。

**Interfaces:** Consumes 三个评估函数、ChapterContext；Produces history 的 ChapterResult，其 artifact 保存首答分项、最终掌握、预测技术和理由。

- [ ] 用公共内存适配器写失败测试：缺一任务不能完成；错答→纠正后掌握但 firstScore 保持；三任务完成后满分上限 15；重复提交不增加总分；浏览练习不改变正式档案。
- [ ] 实现拖动和等价的“选卡片→选阶段”操作、键盘选择、提交/纠正/反馈；输入理由用 textContent 展示。不完整时间线、未知/重复卡片、无效预测只显示校验提示，不调用 recordAttempt；完整但顺序错误的时间线才记录首答，不在只是放置卡片时记成绩。
- [ ] 每次提交调用 recordAttempt，正确且活动完成后调用 markTaskMastered；三任务最终 mastered 后生成“汽车进化知识卡”。score 为三任务 firstScore 之和，maxScore 为 15，summary 清楚标记参与分；写 ChapterResult 后显示进入 02 的按钮。
- [ ] 控制器激活时恢复已提交记录，退出时解绑临时交互/动画；复习不擦除原档案。
- [ ] 运行 `npm.cmd run test -- tests/chapters/history`、`npm.cmd run build`；桌面、触屏和键盘各走完一遍，验证 HTML 文本、焦点、错误提示和知识卡。
- [ ] 提交模块变更，交公共负责人登记三个必做 ID；不自行修改 main.ts。

## 模块交付标准

三任务可完整过关；原历史资料保留；知识卡和实际提交一致；刷新可恢复；无拖动鼠标也能完成；源码、规则测试和浏览器验收结果一并交付。

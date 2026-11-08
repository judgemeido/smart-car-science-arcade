# 01 认识汽车 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在历史展厅增加主题阅读、年代排序、技术匹配与未来表达，形成汽车进化知识卡。

**Architecture:** 原 data/render 继续维护 14 展品；learning-data 维护教学内容，learning-state 负责提交判定，learning-view 显示卡片，controller 负责输入与生命周期。

**Tech Stack:** 沿用项目 TypeScript、原生 DOM、Vitest 与 Playwright，不新增依赖。

**Spec:** [新设计第 4 节](../specs/2026-11-08-upper-primary-learning-design.md#4-01-认识汽车)。

## Global Constraints

[总 Plan 的全部约束](./2026-11-08-upper-primary-learning-plan.md#global-constraints) 逐条适用；01 不改展品史料、图片授权和原年份定位。任务结果仅在当前控制器内存中保留。

## Review Focus

- 排序重复卡、未知 ID、越界位置不能改变有效状态。
- 输入法未结束时不提交；理由按字符计数，不能当 HTML 执行。
- 修改已提交理由或排序后要重新确认，不能显示过时的完成结果。
- 学生用键盘/触屏完成排序，原展品仍能访问。

## Task H1 / P1：主题卡与学习入口

**Files:** Create `src/chapters/history/learning-data.ts`、`learning-view.ts`、`tests/e2e/history-learning.spec.ts`；Modify `src/chapters/history/view.ts`、`controller.ts`、`gallery.css`、`docs/development/history-content.md`。

**Interfaces:** Consumes S0 的 `ChoiceQuestion`。Produces `historyLearningContent: HistoryLearningContent` 与 `renderHistoryReading(host: HTMLElement, content: HistoryLearningContent): void`。内容类型含 `studentCopy/contextCards/orderActivity/matchQuestions/futureActivity`，按 [01 内容包](../../content/2026-11-08-upper-primary/01-history.json) 转换，展品用 `sourceExhibitId` 引用原数据。

- [ ] 在浏览器测试添加学习入口开关及焦点断言：打开后能读主题卡，关闭后焦点返回入口；`expect(page.locator('[data-archive-article]')).toHaveCount(14)` 仍通过。
- [ ] 构建并运行 `npm run test:e2e -- tests/e2e/history-learning.spec.ts`，确认新入口尚不存在时失败。
- [ ] 建立有类型的教学数据与阅读区；保留原展厅版式，新增区域沿用原样式与字号规则，不往学生页放维护文档。
- [ ] 使用 host 内查询和 scope 绑定开关，接入章首/过渡文案；普通切章保持阅读状态。
- [ ] 重跑构建及该 E2E，确认通过；核对原 `history-domain.spec.ts`，更新章内指南与实施记录。

## Task H2 / P2：三个任务与知识卡

**Files:** Create `src/chapters/history/learning-state.ts`、`tests/unit/history/learning-state.test.ts`；Modify H1 的 learning-data/learning-view/controller/gallery.css 与 `tests/e2e/history-learning.spec.ts`。

**Interfaces:**

- Consumes `historyLearningContent`、S0 `evaluateChoice`。
- Produces `HistoryLearningState`，含当前卡片顺序、排序确认标记、题目选择、已掌握题 ID、未来选择、原始理由与理由确认标记。
- Produces `createHistoryLearningState(content: HistoryLearningContent): HistoryLearningState`、`reduceHistoryLearning(state: HistoryLearningState, action: HistoryLearningAction, content: HistoryLearningContent): HistoryLearningState`、`isHistoryLearningComplete(state: HistoryLearningState, content: HistoryLearningContent): boolean`。
- `HistoryLearningAction` 为 `move {cardId,toIndex}`、`submit-order`、`answer {questionId,choiceId}`、`choose-future {choiceId}`、`edit-reason {value}`、`submit-future`、`reset`。
- Produces `countReasonCharacters(value: string): number` 与 `renderHistoryLearning(host: HTMLElement, state: HistoryLearningState, content: HistoryLearningContent): void`；界面不另外维护是否完成。

- [ ] 写失败测试：完整正确顺序接受；重复卡/未知卡/负位置不接受；未提交不能完成。断言 `expect(countReasonCharacters('  汽车🚗  ')).toBe(3)`，9/121 字拒绝，10/120 字接受；无效未来 ID 拒绝。
- [ ] 增加测试：三题纠错后各记录一次掌握；重复提交不重复完成；编辑已确认理由/排序撤销对应确认；未来任一有效选择都可完成，不对观点评分。
- [ ] 运行 `npm run test:unit -- tests/unit/history/learning-state.test.ts`，确认新接口未实现导致失败。
- [ ] 实现上述纯状态接口。固定初始顺序为 2020、2001、2026.03、2009、2015—2016，使用各卡 ID 表达；不让活动初始状态已经正确排好。排序判定读取内容的 correctOrder。
- [ ] 在学习区接入拖动与“选卡片→选位置”操作，题目提交、纠错与主动继续；理由在组合输入结束后提交，输出用 textContent。成果卡读取已确认状态，原年份按钮仍有效。
- [ ] 追加 E2E：键盘排序；移动端选择位置；输入 `<img src=x onerror=alert(1)>` 只显示文本；普通切章返回草稿保留；刷新重置；重置学习任务不改变展品位置。未知 ID 与连续点击不越过未完成任务。
- [ ] 运行该单元测试，`npm run build`，`npm run test:e2e -- tests/e2e/history-learning.spec.ts tests/e2e/history-domain.spec.ts`；确认新任务与旧展品都通过，再记录交付。

## 01 完成条件

- [ ] 原 14 展品与图片说明完整，所有教学展品引用存在。
- [ ] 三个新任务可用键盘和触屏完成，未满足条件时不显示完成卡。
- [ ] 教学文案、规则、界面位置已写入 history 指南，修改题目无需改原模型或导航。

本计划只实施 01；公共文件归集成负责人。未获得实施指令前保持所有任务未勾选，不自动提交。

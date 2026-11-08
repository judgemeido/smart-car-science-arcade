# A01：历史模块职责细化 Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans。仅执行本模块工作包，复选框用于真实进度。

**Goal:** 保留 14 件展品和年份跳转，将内容渲染从控制器独立出来。

**Architecture:** data 管资料，render 管 HTML 生成，controller 管输入和生命周期；view 保留展厅外壳。

**Tech Stack:** TypeScript、原生 DOM、现有 Vitest/Playwright。

**Spec:** [当前内部整理设计第 2–4 节](C:/Codex/citygame01/docs/superpowers/specs/2026-11-08-domain-learning-expansion-design.md)。

## Global Constraints

只修改 src/chapters/history、对应测试与 docs/development/history-content.md；用户体验保持原样，14 展品、素材、顺序、ID、文案、视觉、导航与年份跳转不变。本轮仅整理内部代码并明确维护位置，不新增 05/06、学习档案、门禁、新课程、最终用户编辑面板或开发者界面。当前没有测验，不新增学习任务、空规则或计分文件。公共文件变更交集成负责人。

## 开发文档：内容修改位置与职责边界

以下作为维护者编辑源码时的定位指引，本轮不修改资料内容，也不增加产品内编辑入口。

| 后续维护内容 | 具体文件与数据 | 本轮保持的边界 |
|---|---|---|
| 展品年份、标题、正文、标签、顺序 | src/chapters/history/data.ts 的 historyExhibits；字段 year/title/detail/story/badge/track/id | 数组顺序决定展示顺序，ID 连接年份按钮与展品；本轮保留现有 14 件与原顺序 |
| 历史图片、图片说明与映射 | data.ts 的 archiveAssets；historyExhibits.imageTitle 对应映射键；图片位于 public/assets/history/ | render.ts 消费映射，保留原缺图占位；eventTitles 当前不参与可见正文渲染 |
| 展厅外壳与欢迎文案 | src/chapters/history/view.ts | 保留原模板、文案与布局 |
| 年份按钮及展品 HTML | H1 新建的 src/chapters/history/render.ts | 只将数据转换为原有 HTML，不保存浏览状态或判定学习结果 |
| 年代点选、滚动和监听清理 | src/chapters/history/controller.ts | 只连接数据渲染与现有 DOM 交互，不承担资料定义；本章没有测验规则层 |

## Review Focus

年份跳转必须指向正确展品；缺少档案图继续使用原占位；首次进入不加载 Three；销毁后监听器解绑。验证归属 H1/H2。

## Task H1：纯渲染函数

**Files:** Create src/chapters/history/render.ts、tests/unit/history/render.test.ts；Modify src/chapters/history/controller.ts；Read src/chapters/history/data.ts。

**Interfaces:** 从 data 消费 HistoryExhibit、ArchiveMeta；导出 `renderTimeline(exhibits: readonly HistoryExhibit[]): string`、`renderArchive(exhibits: readonly HistoryExhibit[], assets: Readonly<Record<string, ArchiveMeta>>): string`。

- [x] 写失败测试：14 个展品按数据顺序输出唯一 ID；年份按钮 target 对应展品；缺 imageTitle 显示原占位；数据输入不被修改。
- [x] 运行 `npm run test:unit -- tests/unit/history/render.test.ts`，确认尚无 render 接口而失败。
- [x] 原样抽取两个 HTML 生成函数；controller 只负责填充容器、年代交互和 scope。
- [x] 重跑测试为 PASS，运行 `npm run build`。

## Task H2：接线与浏览器回归

**Files:** Create tests/e2e/history-domain.spec.ts、docs/development/history-content.md；Modify 本章 controller.ts（仅必要接线）。

- [x] 浏览器验证首尾年份定位、重复选择年份、14 展品仍在，缺图占位与原来一致。
- [x] 验证 history 首次进入无 Three/GLB/DAE 请求，切页/销毁不增加事件响应。
- [x] 运行 `npm run test:e2e -- history-domain`，原有 chapters.spec.ts 由集成阶段统一复核。
- [x] 将上方修改位置表按最终实际文件核对后写入docs/development/history-content.md，交付模块差异与检查证据，保持 mount(host): ChapterController；指引说明源码位置，不形成产品内编辑功能或新增学习任务。

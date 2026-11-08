# 模块化与运行可靠性 Implementation Plan

> For agentic workers: use executing-plans inline, then one independent final review. Steps use checkboxes for tracking.

**Goal:** 翻新整个前端组织结构，确保 01–04 独立维护、故障隔离和后续 05 易于接入。

**Architecture:** app 负责注册、导航和章节运行时；chapters 按展厅管理视图、数据、场景和交互；shared 仅放已有多个使用者的生命周期和资源工具。

**Tech Stack:** TypeScript、Vite 6、Three.js、Vitest 4.1.12、Playwright 1.56.1。

**Spec:** ../specs/2026-11-08-modular-reliability.md

## Global Constraints

- 当前工作文件为基线；不重置已有修改，不自动提交或推送。
- 保留当前课程和视觉。03/04 降级展示保留。
- 共享接口 `ChapterController { setActive(active: boolean): void; dispose(): void }`。
- 各章只查询自身 host；纯内容/规则不导入 Three.js。
- CSS 级联顺序与原文件一致。

## Review Focus

- 快速切换时，晚到初始化结果不得启动隐藏章节。
- 单章加载失败时，其余章节和导航保持可用。
- 模型请求超时或页面销毁时，不泄漏资源或留下无限等待。
- 后退、未知 hash、初始深链均正确显示和更新菜单。
- 热更新、后台切换、重复进入不增加渲染循环或重复监听器。

## Task 1: 运行时、导航和验证网

**Files:** src/app/{types,runtime,navigation}.ts、src/shared/{lifecycle,assets,three-resources}.ts、tests/unit/*、package.json。

**Interfaces:** ChapterDefinition 的 load(host) 返回 ChapterController；运行时 `activate(id)`、`setVisible(visible)`、`retry(id)`、`dispose()`；导航纯函数解析注册表中的 hash。

- [x] 写出快速切换、去重、错误重试、后台暂停、销毁后迟到结果和未知 hash 的失败测试。
- [x] 运行 `npm run test:unit`，确认新增接口尚不存在而失败。
- [x] 实现最小接口及可暂停计时器、可取消资源获取；失败不跨章节传播。
- [x] 运行相同测试，应全部通过。

## Task 2: 拆分 01–04 并接入

**Files:** src/main.ts、src/app/{chapters,shell}.ts、src/chapters/{history,explore,lidar,traffic,driving}/**、src/styles/**。

**Interfaces:** 章节实现 Task 1 的 ChapterController；registry 提供 view 和动态 import；遗留公开入口保留兼容转导出。

- [x] 提取当前模板和内容，生成四个独立目录；移出未使用历史数组；小游戏规则和场景定义就近存放。
- [x] 02/03/04 改为启动时 inactive，统一 setActive；04 反馈倒计时暂停与恢复；所有 dispose 完整清理。
- [x] 模型请求加入超时/取消及迟到资源处理；启动或模型失败提供可见反馈。
- [x] 按原顺序拆 CSS；`npm run build` 应通过且首页不预载三个 Three 控制器。

## Task 3: 浏览器验证、独立审查与文档

**Files:** tests/e2e/*、playwright.config.ts、README.md、PROJECT_ARCHITECTURE.md、docs/engineering/*。

- [x] 验证四章、原有任务、导航前后退、错误注入与恢复、缺失资源降级、反复切换。
- [x] 检查生产构建实际拆分；运行 `npm run test:unit`、`npm run build`、`npm run test:e2e`。
- [x] 独立审查未提交的最终改动，修复实质性问题并重新验证。
- [x] 更新架构图与 05 接入步骤，交付实际结果和 GitHub skill 来源。

## 完成验证

`npm run check` 已通过：23 个单元测试、11 个生产浏览器测试、TypeScript 检查和 Vite 构建。最终入口 JS 45.44 kB；原始工作基线为 784.28 kB。独立审查的三个实质问题全部修复，详见 [审查记录](../../engineering/review-findings.md)。

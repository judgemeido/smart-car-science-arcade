# 执行记录 — 2026-11-08-modular-reliability

- 当前基线 build 通过；JS 784.28 kB，13 modules，存在 chunk 大小警告。
- 原始 src、package、tsconfig 已复制到 git-ignored `.refactor-backup/`。工作分支 `codex/modular-reliability`。
- Ruling: 在当前目录和新分支执行，保持用户的开发服务器及未提交资源可用；不为此移动工作目录。
- Ruling: 最新用户请求已授权整体结构翻新，计划后直接执行；本次仅实现结构与可靠性，不实现未批准的完整教学新功能。
- Pre-flight: registry→runtime→controller 使用统一 ChapterController；导航仅消费 registry metadata。CSS 必须以原顺序拆分，避免隐性视觉变更。
- Task 1: complete — 先观察到测试失败，再实现运行时；去重/晚到加载/取消/超时/后台暂停/渲染失败均 RED→GREEN，17 个单元测试已通过。
- Task 2: complete — 四个章节和驾驶旧引擎分目录；03 概念模型与点云几何进一步拆分；02 任务面板与聚焦策略独立；资源请求超时 30 秒。原有 CSS 521 个顶层节点（509 个规则/at-rule、12 个注释）经 PostCSS 对比顺序与内容一致，恢复原始格式并排除 CSS 自动格式化。
- Task 2: build — 44 modules，最终入口 JS 45.44 kB，Three core 235.93 kB、renderer 324.40 kB；构建无 chunk 大小警告。
- Ruling: Vitest 3.2.4 安装后审计发现漏洞；改用兼容 Vite 6 的 Vitest 4.1.12，npm audit 已为 0 vulnerabilities。
- Ruling: 保留 legacy driving 引擎原有玩法和公开 API，仅做结构抽取；当前四章运行时不加载它。接入新注册表时需使用生命周期适配器。
- Task 3: complete — 生产预览浏览器验证发现 03 降级状态被原有 setMode 覆盖；已保留持续降级提示。移动端验证采用现有四个可见标签，保留原导航布局。
- Final review: 独立只读审查发现 3 个 Important、0 个 Critical；三个问题均复现为失败测试，再完成一轮修复：销毁前控制器所有权窗口、GPU 清理遗漏及顺序、旧公开入口生命周期兼容。完整结论见 review-findings.md。
- Final verification: `npm run check` exit 0；23 项单元测试、11 项生产浏览器测试通过，TypeScript 与生产构建通过。GPU 检查依次加载 02/03/04 后验证实例缓冲、阴影目标释放与三个上下文销毁。
- Final audit: npm audit 为 0 vulnerabilities。GitHub Actions 配置已添加，尚未在远端运行。开发服务 5173 HTTP 200。
- Delivery: PROJECT_ARCHITECTURE.md 已更新，翻新前文档归档；01–04 修改地图、小游戏构成与 05 注册步骤已写明。保留用户原有未提交资源和代码，不自动提交/推送。

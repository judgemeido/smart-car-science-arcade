# 模块化翻新独立审查输入

本次请求：翻新整个代码结构，提高可靠性与可维护性，并在 GitHub 搜索相关 skills。

Spec: `docs/superpowers/specs/2026-11-08-modular-reliability.md`。
Plan: `docs/superpowers/plans/2026-11-08-modular-reliability.md`。
Ledger: `docs/engineering/refactor-progress.md`。

审查当前未提交文件。Git HEAD 不是本次改造基线：用户开始时已有大量未提交功能和资源。原始代码保存在 git-ignored `.refactor-backup/src/`，package/tsconfig 同样有快照；以此比较此次变化。不要重置、提交或修改用户文件。

已实现：app 注册表/导航/运行时；01–04 view/data/controller/scene 分离；02 mission/focus，03 concept/scan-scene，04 plain scenario data；迟到/取消/超时/后台暂停/反馈计时暂停；资源失败重试或降级；上下文丢失/渲染异常的章节边界；CSS 原有 521 个顶层节点次序不变（509 个规则/at-rule、12 个注释）。

截至本文件写入：17 单元测试、7 生产浏览器测试通过，build 通过，无 chunk 警告。正在追加实际渲染暂停、移动端菜单和代码分片失败恢复测试；主代理正在更新文档。

Review Focus（逐项检查）：

- 快速切换时，晚到初始化结果不得启动隐藏章节。
- 单章加载失败时，其余章节和导航保持可用。
- 模型请求超时或页面销毁时，不泄漏资源或留下无限等待。
- 后退、未知 hash、初始深链均正确显示和更新菜单。
- 热更新、后台切换、重复进入不增加渲染循环或重复监听器。

保留的 driving engine 只抽取结构和保持旧 API，不在当前注册表中；其玩法不是此次变化。FutureDrive 新课程功能没有实施。

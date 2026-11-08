# GitHub skill 调研与采用

调研日期：2026-11-08。实际通过 GitHub repository search 搜索 `agent skills refactoring`，再读取仓库树、SKILL.md 和它要求的 mini 规则；未向全局技能目录安装第三方代码。

| 来源 | 用途 | 本项目采用方式 |
| --- | --- | --- |
| [Refactoring](https://github.com/ciembor/agent-rules-books/blob/main/refactoring/SKILL.md) | 小步、保留行为、先建立验证网 | 以当前工作文件为基线，抽取模板、内容和控制器；不顺带改课程内容 |
| [Clean Architecture](https://github.com/ciembor/agent-rules-books/blob/main/clean-architecture/SKILL.md) | 按业务能力组织、明确依赖方向 | chapters 按 01–04 分目录；数据和规则不依赖 Three.js；app 负责装配 |
| [Release It!](https://github.com/ciembor/agent-rules-books/blob/main/release-it/SKILL.md) | 超时、隔离、确定性清理和恢复 | 每章独立加载；失败提供重试；模型加载有超时/取消；页面离开和后台时暂停资源 |
| [Brooks Health](https://github.com/hyhmrright/brooks-lint/blob/main/skills/brooks-health/SKILL.md) | 整体健康评估 | 已检查入口说明，当前不采用整套评分流程：这次目标是具体改造与验证 |

前三项来自 MIT 仓库 `ciembor/agent-rules-books`。同时读取了相邻的 `refactoring.mini.md`、`clean-architecture.mini.md`、`release-it.mini.md`。这些是工程决策参考，不是生产运行依赖。

“高可用性”在当前纯前端项目中落实为：章节故障隔离、按需加载、取消和超时、资源回收、后台暂停、路由稳定及可测试性。服务端多副本、CDN 容灾、部署 SLA 需要部署环境另行设计。

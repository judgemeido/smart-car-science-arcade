# 模块翻新：最终审查与验证

2026-11-08。基线为开始翻新时的工作文件，保存在本机 git-ignored `.refactor-backup/`；不以 Git HEAD 覆盖用户既有修改。

独立审查发现 3 个 Important、0 个 Critical。已按实际影响复核，三个问题均通过回归测试观察到失败，再完成修复。没有遗留阻断交付的问题。

| 发现 | 复现证据 | 最终修复 | 回归验证 |
| --- | --- | --- | --- |
| 初始化完成与控制器交付之间销毁，可能失去资源所有权 | activate 后等待 4 个微任务再 dispose，清理次数为 0，仍发送 ready | runtime 在最终接管控制器前再次检查销毁/取消；立即清理迟到结果 | 单元测试逐一覆盖 0–8 个微任务边界，清理恰好一次，无销毁后的 ready |
| 实例缓冲和灯光阴影遗漏，renderer 先销毁导致纹理映射不可用 | 依次载入 02/03/04 后 pagehide：5380 个 buffer 仅删除 5372 个 | 去重释放 InstancedMesh 与 LightShadow；场景先于 renderer 清理；最终 forceContextLoss 释放渲染器内部资源 | 真实 WebGL 调用计数验证所有 buffer、深度 renderbuffer 释放，阴影 framebuffer 与纹理删除，三个上下文均销毁 |
| 旧 setup API 失去原有生命周期 | 直接调用旧 LiDAR setup 后画布无绘制；traffic 不再响应 chapter:change | LiDAR setup 自动激活并保留可调用 disposer；traffic 保留旧导航订阅并在销毁时解绑；缺少旧 DOM 时保持无操作返回 | 兼容单元测试验证初始状态、导航切换、重复销毁及解绑；新 registry 仍直接加载 inactive mount |

Three.js 0.180 会创建内部占位纹理及三个 scratch framebuffer，它的 renderer.dispose 不逐一删除这些内部对象。测试没有把这些内部对象误当成场景泄漏：先检查场景资源显式释放，再验证上下文最终失效。BFCache 暂存页面仅暂停，不销毁上下文，恢复后继续绘制。

## 最终检查

`npm run check` 返回 exit 0。

- 23 项单元测试：运行时并发与销毁、故障重试、后台暂停、倒计时、帧时间、HTTP 超时/取消、内容完整性、兼容入口与资源清理。
- 11 项生产浏览器测试：四章交互、移动端导航、前进后退、未知 hash、代码分片失败恢复、02 模型重试、03 缺失外壳降级、WebGL 故障重建、04 计分与反馈暂停、绘制暂停与 GPU 清理。
- TypeScript 检查、Vite 生产构建通过。44 modules；入口 JS 45.44 kB，原始工作基线为 784.28 kB；01 初次进入不请求 Three 或三维模型。
- npm audit：0 vulnerabilities。
- CSS 对照原始快照：521 个顶层节点（509 个规则/at-rule、12 个注释）在 12 个拆分文件中保持内容与次序。
- GitHub Actions 已配置 Node 24、安装 Chromium、完整检查和失败产物上传；远端运行尚未执行。

本地使用 Node 24.14.0 和已安装 Google Chrome。浏览器测试启动生产 preview 4173；日常开发服务位于 5173。

## 范围

01–04 保留原有内容与主要交互，修改组织结构和可靠性。原 FutureDrive 新课程计划、05 的实际功能以及未注册 driving 引擎的新生命周期改造仍为后续工作。当前架构与添加内容的位置见 [PROJECT_ARCHITECTURE.md](../../PROJECT_ARCHITECTURE.md)。

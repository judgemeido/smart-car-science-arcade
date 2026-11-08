# 智驾博物馆

中国新能源汽车、车辆结构、激光雷达和道路安全四个互动展厅。TypeScript + Vite 6 + Three.js，纯前端静态应用。

## 启动和检查

建议使用 Node.js 24，本次验证版本 24.14.0。

```sh
npm ci
npm run dev
```

```sh
npm run test:unit   # 章节规则、生命周期、请求和内容完整性
npm run build       # TypeScript 检查与生产构建
npm run test:e2e    # 生产浏览器交互与故障恢复验证
npm run check       # 自动串联以上三项
```

本机测试默认使用已安装的 Google Chrome，预览端口 4173。使用 Playwright 自带 Chromium 时，先运行 npx playwright install chromium，再设置 PLAYWRIGHT_CHANNEL=chromium。GitHub Actions 已配置相同安装和检查流程。单独运行浏览器测试前需要构建 dist；npm run check 会自动构建。

npm run format 格式化源码和测试。部署产物在 dist；图片与模型从 public/assets 复制。子路径托管可通过 Vite --base 指定基路径。

## 修改内容

| 展厅 | 目录 | 主要修改位置 |
| --- | --- | --- |
| 01 发展历史 | src/chapters/history | data.ts 改展品；render.ts 改档案和时间线 HTML |
| 02 结构展厅 | src/chapters/explore | data.ts 改装配和任务；mission-state/powerflow-state 改流程；vehicle-rig 改动作 |
| 03 激光雷达 | src/chapters/lidar | data.ts 改部件和步骤；measurement/experiment-state 改计算和状态；scan-animation 改动画 |
| 04 道路安全 | src/chapters/traffic | data.ts 改题目；rules 改答题计分；simulation/scenario-scene 改运动和道具 |

完整架构图、小游戏构成和内容修改位置见 [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)。这些说明是仓库维护文档，网页继续面向最终用户提供四个互动展厅。

四章已分离内容、规则/状态、输入和场景，controller 负责连接。任务推进、雷达实验和答题计分可以独立验证，内容修改路径见 [内容与小游戏修改地图](docs/engineering/content-editing-guide.md)，各章有详细指南。实施范围与验证记录见 [01–04 内部结构整理计划](docs/superpowers/plans/2026-11-08-domain-learning-expansion-plan.md) 和 [执行记录](docs/engineering/domain-expansion-progress.md)。学习底座、05/06 和新课程仍为后续参考。

面向小学五至六年级的 [01–04 教学内容准备稿](docs/content/2026-11-08-upper-primary/README.md) 包含分章文案、小游戏题目、素材缺口与接入说明。四份内容数据目前尚未接入页面，可按章独立审阅和修改。

根据最新课程材料生成的 [01–04 闯关式学习新 Plan](docs/superpowers/plans/2026-11-08-upper-primary-learning-plan.md) 列出两批实施范围、四章独立任务、资源需求和验收；02 分组归位为可选第三批，05/06 留作后续方向。当前仅生成计划，尚未实施新课程。

四章控制器实现 setActive 与 dispose，DOM 查询限定于章节 host。三维章节按需加载，离开和进入后台时暂停，资源和绘图故障在本章内恢复。旧驾驶小游戏在 src/chapters/driving，当前未注册。

GitHub skill 来源和采用方法见 [调研记录](docs/engineering/skill-research.md)。第三方模型许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

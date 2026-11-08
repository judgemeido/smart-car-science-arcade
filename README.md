# 智驾博物馆

中国新能源汽车、车辆结构、激光雷达和道路安全四个互动展厅。TypeScript + Vite 6 + Three.js，纯前端静态应用。

## 当前开发快照（2026-11-08）

正在改造为面向三至六年级的独立二维科普游戏。四组手风琴导航、三个独立 HTML 入口以及公共计分/本机记录已完成；03“回波侦探”的发射与接收实验已可玩，01、02 完整游戏和后续迁移仍在开发中。

本次存档通过 264 项单元测试、生产构建及 7 项导航/回波实验浏览器测试。完整浏览器回归尚待旧测试迁移。详情与继续开发位置见 [阶段存档](docs/engineering/2026-11-08-public-checkpoint.md)；下方旧展厅说明仍作为现有功能与历史维护参考。

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
| 01 发展历史 | src/chapters/history | data.ts 改展品；learning-data.ts 改主题、排序、匹配和未来选择；learning-state.ts 改任务规则 |
| 02 结构展厅 | src/chapters/explore | data.ts 改原装配任务；learning-data/learning-targets 改复习和 13 项挑战；assembly-state/vehicle-rig 改分组归位 |
| 03 激光雷达 | src/chapters/lidar | data.ts 改原部件和步骤；learning-data 改传感器卡与题目；learning-measurement/learning-world/weather-state 改新实验 |
| 04 道路安全 | src/chapters/traffic | data.ts 改原八题；learning-data 改复习和进阶五题；practice-state/practice-scene 改新阶段与场景 |

完整架构图、小游戏构成和内容修改位置见 [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)。这些说明是仓库维护文档，网页继续面向最终用户提供四个互动展厅。

四章已分离内容、规则/状态、输入和场景，controller 负责连接。任务推进、雷达实验和答题计分可以独立验证，内容修改路径见 [内容与小游戏修改地图](docs/engineering/content-editing-guide.md)，各章有详细指南。前轮内部整理的记录见 [执行记录](docs/engineering/domain-expansion-progress.md)。本轮新教学内容的实现、验证与逐章 Git 提交见 [学习路线实施记录](docs/engineering/upper-primary-learning-progress.md)。

面向小学五至六年级的 [01–04 教学内容准备稿](docs/content/2026-11-08-upper-primary/README.md) 保留为内容参考。页面运行内容以各章有类型的 learning-data.ts 为唯一来源；修改题目时同时维护稳定 ID、答案、反馈与章内测试。

本轮按照 [01–04 闯关式学习 Plan](docs/superpowers/plans/2026-11-08-upper-primary-learning-plan.md) 分章实施，包含 02 分组归位。原浏览、三任务、雷达演示及道路八题/8 分保留；新挑战在原四个展厅内进入。学习草稿与成果仅保存在已挂载控制器内，普通切章保留，刷新、页面退出（包括浏览器缓存返回）或故障重建后重置。05/06 留作后续方向。

四章控制器实现 setActive 与 dispose，DOM 查询限定于章节 host。三维章节按需加载，离开和进入后台时暂停，资源和绘图故障在本章内恢复。旧驾驶小游戏在 src/chapters/driving，当前未注册。

GitHub skill 来源和采用方法见 [调研记录](docs/engineering/skill-research.md)。第三方模型许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

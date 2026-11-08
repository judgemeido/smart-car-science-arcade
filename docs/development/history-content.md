# 01 发展历史内容修改指南

当前页面仍是14件展品、时间线和档案图。以下是源码维护位置，不是产品内编辑功能。

| 要修改的内容 | 文件与字段 | 关联 |
| --- | --- | --- |
| 年份、标题、正文、标签、顺序 | [data.ts](C:/Codex/citygame01/src/chapters/history/data.ts) 的historyExhibits：year/title/detail/story/badge/track | 数组顺序决定按钮与展品顺序；id连接两者 |
| 图片、替代文本和图片说明 | 同文件的archiveAssets：image/imageAlt/caption | 展品imageTitle匹配映射键；图片放public/assets/history/ |
| 时间线与档案HTML | [render.ts](C:/Codex/citygame01/src/chapters/history/render.ts) 的renderTimeline/renderArchive | 只生成HTML，无DOM、浏览状态或学习成绩 |
| 年份点选、滚动定位和监听清理 | [controller.ts](C:/Codex/citygame01/src/chapters/history/controller.ts) | 在本章host内连接按钮与文章，scope负责清理 |
| 展厅外壳和样式 | [view.ts](C:/Codex/citygame01/src/chapters/history/view.ts)、viewport.css/gallery.css | styles.css的公共导入顺序保持稳定 |

例如，只改某件展品的故事，修改该条historyExhibits.story即可；替换图片则修改对应archiveAssets.image及imageAlt/caption。不要把显示标题当作展品id。缺映射或缺image时仍显示现有“未来展望”占位；没有imageAlt时使用展品title。

本章没有小游戏计分。eventTitles当前不参与可见正文生成。需要新交互时再明确其行为，不能通过内容字段自动判定用户已掌握。

验证：npm run test:unit -- tests/unit/history；npm run build后执行npm run test:e2e -- history-domain。原导航、缺图和首次不加载3D依赖的验证也保留在chapters.spec.ts。有意改变展品数量或交互时，应同步检查内容完整性与浏览器验收中的数量要求；本轮保持现有内容。

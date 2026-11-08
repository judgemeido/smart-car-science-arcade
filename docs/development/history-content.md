# 01 发展历史内容修改指南

当前页面保留14件展品、时间线和档案图，并加入面向小学五至六年级的主题阅读与三个学习任务。以下是源码维护位置，不是产品内编辑功能。

| 要修改的内容 | 文件与字段 | 关联 |
| --- | --- | --- |
| 年份、标题、正文、标签、顺序 | [data.ts](C:/Codex/citygame01/src/chapters/history/data.ts) 的historyExhibits：year/title/detail/story/badge/track | 数组顺序决定按钮与展品顺序；id连接两者 |
| 图片、替代文本和图片说明 | 同文件的archiveAssets：image/imageAlt/caption | 展品imageTitle匹配映射键；图片放public/assets/history/ |
| 时间线与档案HTML | [render.ts](C:/Codex/citygame01/src/chapters/history/render.ts) 的renderTimeline/renderArchive | 只生成HTML，无DOM、浏览状态或学习成绩 |
| 年份点选、滚动定位和监听清理 | [controller.ts](C:/Codex/citygame01/src/chapters/history/controller.ts) | 在本章host内连接按钮与文章，scope负责清理 |
| 展厅外壳和样式 | [view.ts](C:/Codex/citygame01/src/chapters/history/view.ts)、viewport.css/gallery.css | styles.css的公共导入顺序保持稳定 |
| 主题卡、任务、反馈和成果卡文案 | [learning-data.ts](C:/Codex/citygame01/src/chapters/history/learning-data.ts) 的historyLearningContent | 从01内容包转换；sourceExhibitId/sourceExhibitIds引用原展品，不复制展品史料或图片 |
| 排序确认、理解记录、开放表达规则 | [learning-state.ts](C:/Codex/citygame01/src/chapters/history/learning-state.ts) | 纯规则，不依赖DOM；选择题使用shared/learning-assessment的稳定ID判定 |
| 阅读卡、任务表单和知识卡 | [learning-view.ts](C:/Codex/citygame01/src/chapters/history/learning-view.ts) | 文案和学生理由使用textContent；textarea使用value |

例如，只改某件展品的故事，修改该条historyExhibits.story即可；替换图片则修改对应archiveAssets.image及imageAlt/caption。不要把显示标题当作展品id。缺映射或缺image时仍显示现有“未来展望”占位；没有imageAlt时使用展品title。

学习入口位于章首报头后、原展厅导览前。打开后聚焦主题阅读标题，收起后聚焦入口；主题卡中的早期动力与生产是补充阅读，不能把中国新能源馆藏写成完整世界汽车史。入口与阅读状态在普通切章时保留。eventTitles仍不参与可见正文生成。

任务A用五张练习卡排序，初始顺序为2020、2001、2026.03、2009、2015—2016。initialOrder决定初始卡片位置，correctOrder决定正确答案；id连接cards和原展品sourceExhibitId。学生可拖动，也可用鼠标、触屏或键盘先选择卡片、再点击“放到第n位”。确认后才判断排序；移动已确认卡片会撤销排序确认。未知卡片、重复卡片状态或越界位置不更新有效状态。练习卡不会替代现有14件展品或改动原年份定位。

任务B逐题选择并提交，错误可重选；每题正确理解只记录一次。正确反馈保持到学生主动点击继续，不使用自动计时切题。改题只需维护matchQuestions的稳定id、选项id、correctChoiceId和两种反馈，无需修改模型、公共导航或评分。选项数组调整展示顺序不改变正确性。

任务C任一有效未来技术选择都可完成。理由保留原始输入，去除首尾空白后按Unicode字符计数（例如汽车🚗是3个字符），范围10–120。这里只确认写完，不自动评价观点或理由质量。组合输入未结束时不能提交。修改已确认理由或未来选择后必须再次确认，旧成果卡立即撤下。

汽车进化知识卡同时要求：五事件排序正确且已确认、三题已正确理解、有效未来选择与理由已确认。界面只读取纯状态派生完成条件，没有另外维护成绩、分数或完成副本。新学习重置仅清空排序、理解和未来草稿，不改变原展品的选中年份。当前任务只在已挂载控制器的内存中保存；普通切章保留，刷新、退出页面或控制器重建后清空。章节scope的pagehide处理器清空新学习并关闭学习面板，包括浏览器保留页面缓存的persisted=true退出；dispose本身也会清空并关闭，避免应用退出监听先销毁章节时漏掉重置。普通setActive(false)只暂停输入，不清空学习。返回缓存页面后可重新开始学习，原展品选中年份仍保留。

验证：npm run test:unit -- tests/unit/history；npm run build后执行npm run test:e2e -- tests/e2e/history-learning.spec.ts tests/e2e/history-domain.spec.ts。新浏览器验收覆盖开关焦点、键盘与移动端选择位置、三题纠错与主动继续、理由文本安全及输入法、切章草稿、刷新/学习重置和未知ID。原导航、缺图和首次不加载3D依赖的验证保留在chapters.spec.ts；本轮保持现有14件展品。

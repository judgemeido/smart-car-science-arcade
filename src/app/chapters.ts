import type { ChapterDefinition } from './types';
import { view as historyView } from '../chapters/history/view';
import { view as exploreView } from '../chapters/explore/view';
import { view as lidarView } from '../chapters/lidar/view';
import { view as trafficView } from '../chapters/traffic/view';

export class ChapterImportError extends Error {
  constructor(cause: unknown) {
    super('章节代码加载失败，请重新加载此页', { cause });
  }
}

async function loadChapter(
  importer: () => Promise<{ mount(host: HTMLElement): import('./types').ChapterController }>,
  host: HTMLElement,
  signal?: AbortSignal,
) {
  let module;
  try {
    module = await importer();
  } catch (error) {
    throw new ChapterImportError(error);
  }
  signal?.throwIfAborted();
  return module.mount(host);
}

/** The single registration point for navigation, numbering, views and lazy controllers. */
export const chapters: readonly ChapterDefinition[] = [
  {
    id: 'history',
    number: '01',
    title: '发展历史',
    subtitle: '中国新能源汽车',
    label: '中国新能源发展',
    immersive: false,
    view: historyView,
    load: (host, signal) => loadChapter(() => import('../chapters/history/controller'), host, signal),
  },
  {
    id: 'explore',
    number: '02',
    title: '结构展厅',
    subtitle: '拆解与交互',
    label: '新能源汽车结构',
    immersive: true,
    view: exploreView,
    load: (host, signal) => loadChapter(() => import('../chapters/explore/controller'), host, signal),
  },
  {
    id: 'lidar',
    number: '03',
    title: '激光雷达',
    subtitle: '感知原理互动展',
    label: '激光雷达实验室',
    immersive: true,
    view: lidarView,
    load: (host, signal) => loadChapter(() => import('../chapters/lidar/controller'), host, signal),
  },
  {
    id: 'traffic',
    number: '04',
    title: '安全上路',
    subtitle: '中国道路规则体验',
    label: '道路安全体验',
    immersive: true,
    view: trafficView,
    load: (host, signal) => loadChapter(() => import('../chapters/traffic/controller'), host, signal),
  },
];

/** Destinations only: shared by gallery and independent pages without importing a chapter. */
export const navigationItems = [
  {
    id: 'history',
    number: '01',
    title: '发展历史',
    items: [
      { id: 'history', title: '参观历史展厅', path: 'index.html#history', gallery: true },
      { id: 'topicgame', title: '历史闯关', path: 'games/history/index.html', gallery: false },
    ],
  },
  {
    id: 'explore',
    number: '02',
    title: '车辆结构',
    items: [
      { id: 'explore', title: '参观结构展厅', path: 'index.html#explore', gallery: true },
      { id: 'structuregame', title: '结构闯关', path: 'games/structure/index.html', gallery: false },
    ],
  },
  {
    id: 'lidar',
    number: '03',
    title: '智能感知',
    items: [
      { id: 'lidar', title: '参观雷达展厅', path: 'index.html#lidar', gallery: true },
      { id: 'sensorgame', title: '感知闯关', path: 'games/sensor/index.html', gallery: false },
    ],
  },
  {
    id: 'traffic',
    number: '04',
    title: '安全上路',
    items: [{ id: 'traffic', title: '体验道路安全', path: 'index.html#traffic', gallery: true }],
  },
] as const;

export type NavigationItemId = (typeof navigationItems)[number]['items'][number]['id'];

export function navigationHref(id: string, base = import.meta.env.BASE_URL): string {
  const item = navigationItems.flatMap((group) => [...group.items]).find((item) => item.id === id);
  if (!item) throw new Error(`Unknown navigation destination: ${id}`);
  return `${base.endsWith('/') ? base : `${base}/`}${item.path}`;
}

export function resolveNavigationItem(pathname: string, hash: string): NavigationItemId {
  const items = navigationItems.flatMap((group) => [...group.items]);
  const game = items.find((item) => !item.gallery && pathname.endsWith(`/${item.path}`));
  if (game) return game.id;
  let chapter = '';
  try {
    chapter = decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    /* invalid fragment */
  }
  return items.find((item) => item.gallery && item.id === chapter)?.id ?? 'history';
}

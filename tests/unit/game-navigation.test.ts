import { expect, it } from 'vitest';
import { navigationItems, navigationHref, resolveNavigationItem } from '../../src/app/navigation-items';

it('resolves each independent game document before considering gallery hashes', () => {
  expect(resolveNavigationItem('/museum/games/history/index.html', '#explore')).toBe('topicgame');
  expect(resolveNavigationItem('/museum/games/structure/index.html', '')).toBe('structuregame');
  expect(resolveNavigationItem('/games/sensor/index.html', '#history')).toBe('sensorgame');
  expect(resolveNavigationItem('/museum/index.html', '#lidar')).toBe('lidar');
  expect(resolveNavigationItem('/museum/', '#traffic')).toBe('traffic');
  expect(resolveNavigationItem('/index.html', '#unknown')).toBe('history');
});

it('builds deployable gallery and game hrefs with a subdirectory base', () => {
  expect(navigationHref('history', '/museum/')).toBe('/museum/index.html#history');
  expect(navigationHref('topicgame', '/museum/')).toBe('/museum/games/history/index.html');
  expect(navigationHref('structuregame', '/')).toBe('/games/structure/index.html');
  expect(navigationHref('sensorgame', './')).toBe('./games/sensor/index.html');
  expect(navigationItems.flatMap((group) => group.items.map((item) => item.id))).toEqual([
    'history',
    'topicgame',
    'explore',
    'structuregame',
    'lidar',
    'sensorgame',
    'traffic',
  ]);
});

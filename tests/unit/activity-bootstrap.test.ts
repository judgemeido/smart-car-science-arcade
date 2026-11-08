import { afterEach, expect, it, vi } from 'vitest';
import { bootstrapActivity, type ActivityDefinition } from '../../src/activities/bootstrap';
import type { ChapterController } from '../../src/app/types';

// The DOM boundary is small; bootstrap and its EventTarget lifecycle listeners are real.
class NodeBoundary extends EventTarget {
  innerHTML = '';
  hidden = false;
  inert = false;
  dataset: Record<string, string> = {};
  textContent = '';
  attributes = new Map<string, string>();
  classList = { add() {}, remove() {}, toggle() {} };
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }
  querySelectorAll() {
    return [];
  }
  contains() {
    return false;
  }
  focus() {}
}

function fixture(hidden = false) {
  const windowTarget = new EventTarget();
  const documentTarget = Object.assign(new EventTarget(), {
    visibilityState: hidden ? 'hidden' : 'visible',
    title: '',
  });
  vi.stubGlobal('window', windowTarget);
  vi.stubGlobal('document', documentTarget);
  vi.stubGlobal('location', { pathname: '/games/history/index.html', hash: '' });
  const host = new NodeBoundary();
  const menu = new NodeBoundary();
  const button = new NodeBoundary();
  const root = Object.assign(new NodeBoundary(), {
    querySelector(selector: string) {
      if (selector === '[data-activity-host]') return host;
      if (selector === '[data-chapter-menu]') return menu;
      if (selector === '[data-menu-button]') return button;
      return null;
    },
  });
  const runs: { active: boolean; disposed: number; node: string }[] = [];
  const definition: ActivityDefinition = {
    activityId: 'topicgame',
    title: '历史闯关',
    galleryHref: '/index.html#history',
    view: '<p>准备开始</p>',
    mount(element): ChapterController {
      const run = { active: false, disposed: 0, node: element.innerHTML };
      runs.push(run);
      return {
        setActive(active) {
          run.active = active;
        },
        dispose() {
          run.disposed += 1;
          run.active = false;
        },
      };
    },
  };
  const app = bootstrapActivity(root as unknown as HTMLElement, definition);
  return { app, runs, host, documentTarget, windowTarget };
}

const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).forEach((dispose) => dispose());
  vi.unstubAllGlobals();
});
function transition(type: string, persisted: boolean) {
  const event = new Event(type);
  Object.defineProperty(event, 'persisted', { value: persisted });
  return event;
}

it('mounts inactive on a hidden document and follows visibility changes', () => {
  const { app, runs, documentTarget } = fixture(true);
  cleanups.push(app.dispose);
  expect(runs[0]).toEqual({ active: false, disposed: 0, node: '<p>准备开始</p>' });
  documentTarget.visibilityState = 'visible';
  documentTarget.dispatchEvent(new Event('visibilitychange'));
  expect(runs[0].active).toBe(true);
  documentTarget.visibilityState = 'hidden';
  documentTarget.dispatchEvent(new Event('visibilitychange'));
  expect(runs[0].active).toBe(false);
});

it('disposes once on cached exit and replaces the view before a fresh BFCache mount', () => {
  const { app, runs, host, windowTarget, documentTarget } = fixture();
  cleanups.push(app.dispose);
  host.innerHTML = '<p>进行中的游戏</p>';
  windowTarget.dispatchEvent(transition('pagehide', true));
  windowTarget.dispatchEvent(transition('pagehide', true));
  documentTarget.dispatchEvent(new Event('visibilitychange'));
  expect(runs).toEqual([{ active: false, disposed: 1, node: '<p>准备开始</p>' }]);
  windowTarget.dispatchEvent(transition('pageshow', true));
  expect(runs[1]).toEqual({ active: true, disposed: 0, node: '<p>准备开始</p>' });
  windowTarget.dispatchEvent(transition('pageshow', true));
  expect(runs).toHaveLength(2);
  windowTarget.dispatchEvent(transition('pagehide', false));
  windowTarget.dispatchEvent(transition('pageshow', true));
  expect(runs).toHaveLength(2);
  expect(runs.map((run) => run.disposed)).toEqual([1, 1]);
});

it('direct disposal removes all lifecycle listeners and is idempotent', () => {
  const { app, runs, windowTarget, documentTarget } = fixture();
  app.dispose();
  app.dispose();
  documentTarget.visibilityState = 'visible';
  documentTarget.dispatchEvent(new Event('visibilitychange'));
  windowTarget.dispatchEvent(transition('pagehide', true));
  windowTarget.dispatchEvent(transition('pageshow', true));
  expect(runs).toEqual([{ active: false, disposed: 1, node: '<p>准备开始</p>' }]);
});

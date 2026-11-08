import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '../../../src/chapters/history/controller';
import type { ChapterController } from '../../../src/app/types';

/** Minimal optional-shell DOM boundary; real controller and EventTarget listeners are exercised. */
class HistoryHost extends EventTarget {
  readonly panel = { hidden: false };
  readonly toggle = {
    textContent: '收起学习任务',
    attributes: new Map([['aria-expanded', 'true']]),
    setAttribute(name: string, value: string) {
      this.attributes.set(name, value);
    },
    focus() {},
  };
  querySelector(selector: string) {
    if (selector === '[data-history-learning-panel]') return this.panel;
    if (selector === '[data-history-learning-toggle]') return this.toggle;
    return null;
  }
}

const controllers: ChapterController[] = [];
afterEach(() => {
  for (const controller of controllers.splice(0)) controller.dispose();
  vi.unstubAllGlobals();
});

function fixture(bootstrapExitFirst = false) {
  const windowTarget = new EventTarget();
  vi.stubGlobal('window', windowTarget);
  const host = new HistoryHost();
  let controller: ChapterController;
  if (bootstrapExitFirst) {
    // Bootstrap owns an earlier listener and tears down chapter scopes on an uncached exit.
    windowTarget.addEventListener('pagehide', (event) => {
      if (!(event as PageTransitionEvent).persisted) controller.dispose();
    });
  }
  controller = mount(host as unknown as HTMLElement);
  controllers.push(controller);
  return { windowTarget, host, controller };
}

function pageExit(persisted: boolean) {
  const event = new Event('pagehide');
  Object.defineProperty(event, 'persisted', { value: persisted });
  return event;
}

describe('history page exit lifecycle', () => {
  it.each([true, false])('closes new learning on page exit (persisted=%s)', (persisted) => {
    const { windowTarget, host, controller } = fixture();
    controller.setActive(false);
    expect(host.panel.hidden).toBe(false);
    windowTarget.dispatchEvent(pageExit(persisted));
    expect(host.panel.hidden).toBe(true);
    expect(host.toggle.attributes.get('aria-expanded')).toBe('false');
    expect(host.toggle.textContent).toBe('打开学习任务');
  });

  it('keeps the learning panel open during ordinary inactive/active chapter transitions', () => {
    const { host, controller } = fixture();
    controller.setActive(false);
    controller.setActive(true);
    expect(host.panel.hidden).toBe(false);
    expect(host.toggle.attributes.get('aria-expanded')).toBe('true');
  });

  it('clears learning when the earlier bootstrap pagehide listener disposes its scope first', () => {
    const { windowTarget, host } = fixture(true);
    windowTarget.dispatchEvent(pageExit(false));
    expect(host.panel.hidden).toBe(true);
    expect(host.toggle.attributes.get('aria-expanded')).toBe('false');
    expect(host.toggle.textContent).toBe('打开学习任务');
  });

  it('closes learning during direct controller disposal', () => {
    const { host, controller } = fixture();
    controller.dispose();
    expect(host.panel.hidden).toBe(true);
    expect(host.toggle.attributes.get('aria-expanded')).toBe('false');
  });

  it('removes its page-exit listener when disposed', () => {
    const { windowTarget, host, controller } = fixture();
    controller.dispose();
    // Deliberately change the detached shell to detect any lingering pagehide listener.
    host.panel.hidden = false;
    host.toggle.attributes.set('aria-expanded', 'true');
    windowTarget.dispatchEvent(pageExit(true));
    expect(host.panel.hidden).toBe(false);
    expect(host.toggle.attributes.get('aria-expanded')).toBe('true');
  });
});

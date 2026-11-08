import { afterEach, expect, it, vi } from 'vitest';
import { mount } from '../../src/chapters/lidar/controller';
import { mount as mountTraffic } from '../../src/chapters/traffic/controller';
import { setupLidarExplorer } from '../../src/lidar-explorer';
import { setupTrafficChapter } from '../../src/traffic-chapter';

vi.mock('../../src/chapters/lidar/controller', () => ({ mount: vi.fn() }));
vi.mock('../../src/chapters/traffic/controller', () => ({ mount: vi.fn() }));
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

const makeHost = (active = false) =>
  ({
    classList: { contains: () => active },
    querySelector: (selector: string) => (selector === '.lidar-stage' ? null : {}),
  }) as unknown as HTMLElement;

it('keeps the legacy lidar setup immediately active and returns its callable disposer', () => {
  const dispose = vi.fn();
  const controller = Object.assign(dispose, { dispose, setActive: vi.fn() });
  vi.mocked(mount).mockReturnValue(controller);
  const host = makeHost();
  const result = setupLidarExplorer(host);
  expect(mount).toHaveBeenCalledWith(host);
  expect(controller.setActive).toHaveBeenCalledWith(true);
  expect(result).toBe(controller);
  result();
  expect(dispose).toHaveBeenCalledTimes(1);
});

it('keeps legacy traffic navigation subscriptions until its disposer is called', () => {
  const target = new EventTarget();
  vi.stubGlobal('window', target);
  for (const active of [false, true]) {
    const controller = { dispose: vi.fn(), setActive: vi.fn() };
    vi.mocked(mountTraffic).mockReturnValue(controller);
    const dispose = setupTrafficChapter(makeHost(active));
    expect(controller.setActive).toHaveBeenLastCalledWith(active);
    target.dispatchEvent(new CustomEvent('chapter:change', { detail: { page: 'traffic' } }));
    expect(controller.setActive).toHaveBeenLastCalledWith(true);
    target.dispatchEvent(new CustomEvent('chapter:change', { detail: { page: 'history' } }));
    expect(controller.setActive).toHaveBeenLastCalledWith(false);
    dispose();
    dispose();
    controller.setActive.mockClear();
    target.dispatchEvent(new CustomEvent('chapter:change', { detail: { page: 'traffic' } }));
    expect(controller.setActive).not.toHaveBeenCalled();
    expect(controller.dispose).toHaveBeenCalledTimes(1);
  }
});

it('keeps legacy setup calls harmless when their host lacks the old required markup', () => {
  const host = { querySelector: () => null } as unknown as HTMLElement;
  expect(() => setupLidarExplorer(host)()).not.toThrow();
  expect(() => setupTrafficChapter(host)()).not.toThrow();
  expect(mount).not.toHaveBeenCalled();
  expect(mountTraffic).not.toHaveBeenCalled();
});

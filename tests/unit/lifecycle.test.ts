import { afterEach, expect, it, vi } from 'vitest';
import { createPausableTimer, createAnimationLoop, createScope } from '../../src/shared/lifecycle';
import { fetchAsset } from '../../src/shared/assets';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('keeps the remaining feedback time while the chapter is hidden', () => {
  vi.useFakeTimers();
  const timer = createPausableTimer();
  const callback = vi.fn();
  timer.setActive(true);
  timer.schedule(callback, 2300);
  vi.advanceTimersByTime(1000);
  timer.setActive(false);
  vi.advanceTimersByTime(10000);
  expect(callback).not.toHaveBeenCalled();
  timer.setActive(true);
  vi.advanceTimersByTime(1299);
  expect(callback).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(callback).toHaveBeenCalledTimes(1);
  timer.schedule(callback, 550);
  timer.dispose();
  vi.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalledTimes(1);
});

it('computes frame delta from timestamps and resets it on resume', () => {
  let callback: ((time: number) => void) | null = null;
  const renderer = {
    setAnimationLoop: (value: typeof callback) => {
      callback = value;
    },
  };
  const deltas: number[] = [];
  const loop = createAnimationLoop(renderer, (delta) => deltas.push(delta));
  loop.setActive(true);
  callback!(1000);
  callback!(1016);
  expect(deltas).toEqual([0, 0.016]);
  loop.setActive(false);
  expect(callback).toBeNull();
  loop.setActive(true);
  callback!(50000);
  callback!(51000);
  expect(deltas.slice(-2)).toEqual([0, 0.05]);
  loop.dispose();
  expect(callback).toBeNull();
  loop.setActive(true);
  expect(callback).toBeNull();
});

it('stops a broken render loop and reports failure to its chapter', () => {
  let callback: ((time: number) => void) | null = null;
  const renderer = {
    setAnimationLoop: (value: typeof callback) => {
      callback = value;
    },
  };
  const error = new Error('render failed');
  const report = vi.fn();
  const loop = createAnimationLoop(
    renderer,
    () => {
      throw error;
    },
    report,
  );
  loop.setActive(true);
  expect(() => callback!(1000)).not.toThrow();
  expect(callback).toBeNull();
  expect(report).toHaveBeenCalledWith(error);
});

it('removes scoped event handlers and continues cleanup after an exception', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const scope = createScope();
  const target = new EventTarget();
  const handler = vi.fn();
  const cleanup = vi.fn();
  scope.listen(target, 'ping', handler);
  scope.add(cleanup);
  scope.add(() => {
    throw new Error('broken cleanup');
  });
  target.dispatchEvent(new Event('ping'));
  expect(handler).toHaveBeenCalledTimes(1);
  scope.dispose();
  scope.dispose();
  target.dispatchEvent(new Event('ping'));
  expect(handler).toHaveBeenCalledTimes(1);
  expect(cleanup).toHaveBeenCalledTimes(1);
  expect(scope.signal.aborted).toBe(true);
});

it('aborts stalled asset requests and reports HTTP failures', async () => {
  vi.useFakeTimers();
  let signal: AbortSignal | undefined;
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          signal = options.signal;
          signal!.addEventListener('abort', () => reject(signal!.reason), { once: true });
        }),
    ),
  );
  const pending = fetchAsset('/car.glb', { timeoutMs: 100 });
  const failure = expect(pending).rejects.toThrow(/超时/);
  await vi.advanceTimersByTimeAsync(100);
  await failure;
  expect(signal!.aborted).toBe(true);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('', { status: 404 })),
  );
  await expect(fetchAsset('/missing.glb')).rejects.toThrow(/404/);
});

it('cancels asset work when its chapter is disposed', async () => {
  const aborter = new AbortController();
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true });
        }),
    ),
  );
  const pending = fetchAsset('/car.glb', { signal: aborter.signal });
  const failure = expect(pending).rejects.toThrow();
  aborter.abort();
  await failure;
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createChapterRuntime } from '../../src/app/runtime';
import { resolveChapter } from '../../src/app/navigation';
import type { ChapterController } from '../../src/app/types';

const controller = (): ChapterController => ({ setActive: vi.fn(), dispose: vi.fn() });
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('chapter runtime', () => {
  it('keeps ownership through every microtask boundary between loading and publication', async () => {
    for (let microtasks = 0; microtasks <= 8; microtasks += 1) {
      const a = controller();
      let disposed = false;
      const lateReady = vi.fn();
      const runtime = createChapterRuntime([{ id: 'a', load: async () => a }], (_id, status) => {
        if (disposed && status === 'ready') lateReady();
      });
      const loading = runtime.activate('a');
      for (let step = 0; step < microtasks; step += 1) await Promise.resolve();
      disposed = true;
      runtime.dispose();
      await loading;
      expect(a.dispose, `dispose after ${microtasks} microtasks`).toHaveBeenCalledTimes(1);
      expect(lateReady, `ready after ${microtasks} microtasks`).not.toHaveBeenCalled();
    }
  });

  it('bounds startup time and disposes a timed-out result without activating it', async () => {
    vi.useFakeTimers();
    const pending = deferred<ChapterController>();
    const a = controller();
    const statuses: string[] = [];
    const runtime = createChapterRuntime(
      [{ id: 'a', load: () => pending.promise }],
      (_id, status) => statuses.push(status),
      { loadTimeoutMs: 100 },
    );
    const loading = runtime.activate('a');
    await vi.advanceTimersByTimeAsync(100);
    await loading;
    expect(statuses).toContain('error');
    pending.resolve(a);
    await Promise.resolve();
    await Promise.resolve();
    expect(a.dispose).toHaveBeenCalledTimes(1);
    expect(a.setActive).not.toHaveBeenCalledWith(true);
    runtime.dispose();
  });

  it('recovers from an async scene failure and constructs a fresh controller', async () => {
    const a = controller();
    const fresh = controller();
    const load = vi.fn().mockResolvedValueOnce(a).mockResolvedValue(fresh);
    const runtime = createChapterRuntime([{ id: 'a', load }]);
    await runtime.activate('a');
    runtime.fail('a', new Error('WebGL context lost'));
    expect(a.dispose).toHaveBeenCalledTimes(1);
    await runtime.retry('a');
    expect(fresh.setActive).toHaveBeenLastCalledWith(true);
    runtime.dispose();
  });
  it('deduplicates loads and never activates a late hidden chapter', async () => {
    const pending = deferred<ChapterController>();
    const a = controller();
    const b = controller();
    const load = vi.fn(() => pending.promise);
    const runtime = createChapterRuntime([
      { id: 'a', load },
      { id: 'b', load: async () => b },
    ]);
    const first = runtime.activate('a');
    const second = runtime.activate('a');
    await runtime.activate('b');
    pending.resolve(a);
    await Promise.all([first, second]);
    expect(load).toHaveBeenCalledTimes(1);
    expect(a.setActive).not.toHaveBeenCalledWith(true);
    expect(b.setActive).toHaveBeenLastCalledWith(true);
    await runtime.activate('a');
    expect(load).toHaveBeenCalledTimes(1);
    expect(a.setActive).toHaveBeenLastCalledWith(true);
    expect(b.setActive).toHaveBeenLastCalledWith(false);
    runtime.dispose();
  });

  it('isolates a failed chapter and retries explicitly', async () => {
    const a = controller();
    const b = controller();
    const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(a);
    const statuses: string[] = [];
    const runtime = createChapterRuntime(
      [
        { id: 'a', load },
        { id: 'b', load: async () => b },
      ],
      (id, status) => statuses.push(`${id}:${status}`),
    );
    await runtime.activate('a');
    expect(statuses).toContain('a:error');
    await runtime.activate('b');
    expect(b.setActive).toHaveBeenLastCalledWith(true);
    await runtime.activate('a');
    expect(load).toHaveBeenCalledTimes(1);
    await runtime.retry('a');
    expect(load).toHaveBeenCalledTimes(2);
    expect(a.setActive).toHaveBeenLastCalledWith(true);
    runtime.dispose();
  });

  it('pauses in the background and resumes only the current chapter', async () => {
    const a = controller();
    const b = controller();
    const runtime = createChapterRuntime([
      { id: 'a', load: async () => a },
      { id: 'b', load: async () => b },
    ]);
    await runtime.activate('a');
    runtime.setVisible(false);
    expect(a.setActive).toHaveBeenLastCalledWith(false);
    await runtime.activate('b');
    expect(b.setActive).not.toHaveBeenCalledWith(true);
    runtime.setVisible(true);
    expect(b.setActive).toHaveBeenLastCalledWith(true);
    expect(a.setActive).toHaveBeenLastCalledWith(false);
    runtime.dispose();
  });

  it('disposes a late load exactly once after teardown', async () => {
    const pending = deferred<ChapterController>();
    const a = controller();
    const runtime = createChapterRuntime([{ id: 'a', load: () => pending.promise }]);
    const loading = runtime.activate('a');
    runtime.dispose();
    runtime.dispose();
    pending.resolve(a);
    await loading;
    expect(a.dispose).toHaveBeenCalledTimes(1);
    expect(a.setActive).not.toHaveBeenCalledWith(true);
  });

  it('isolates activation exceptions and continues disposing other chapters', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const bad = {
      setActive: vi.fn(() => {
        throw new Error('context lost');
      }),
      dispose: vi.fn(() => {
        throw new Error('cleanup');
      }),
    };
    const good = controller();
    const runtime = createChapterRuntime([
      { id: 'bad', load: async () => bad },
      { id: 'good', load: async () => good },
    ]);
    await runtime.activate('bad');
    await runtime.activate('good');
    expect(good.setActive).toHaveBeenLastCalledWith(true);
    expect(() => runtime.dispose()).not.toThrow();
    expect(good.dispose).toHaveBeenCalledTimes(1);
  });
});

it('resolves registered deep links, including a future 05, and rejects malformed hashes', () => {
  const ids = ['history', 'explore', 'lidar', 'traffic', 'design'];
  expect(resolveChapter('#design', ids)).toBe('design');
  expect(resolveChapter('#explore', ids)).toBe('explore');
  expect(resolveChapter('#%E0%A4%A', ids)).toBe('history');
  expect(resolveChapter('#constructor', ids)).toBe('history');
  expect(resolveChapter('', ids)).toBe('history');
});

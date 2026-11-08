import type { ChapterController } from './types';

export type ChapterStatus = 'idle' | 'loading' | 'ready' | 'error';
interface Entry {
  id: string;
  load(signal: AbortSignal): Promise<ChapterController>;
}

/** Owns chapter state; controllers are constructed inactive and activated here. */
export function createChapterRuntime(
  entries: Entry[],
  onStatus: (id: string, status: ChapterStatus, error?: unknown) => void = () => {},
  options: { loadTimeoutMs?: number } = {},
) {
  const states = new Map(
    entries.map((entry) => [
      entry.id,
      {
        entry,
        status: 'idle' as ChapterStatus,
        controller: undefined as ChapterController | undefined,
        pending: undefined as Promise<void> | undefined,
        active: false,
        aborter: undefined as AbortController | undefined,
      },
    ]),
  );
  let current: string | undefined;
  let visible = true;
  let disposed = false;

  function cleanup(controller: ChapterController) {
    try {
      controller.dispose();
    } catch (error) {
      console.error('Chapter cleanup failed', error);
    }
  }

  function fail(id: string, error: unknown) {
    const state = states.get(id);
    if (!state || disposed) return;
    if (state.controller) cleanup(state.controller);
    state.controller = undefined;
    state.active = false;
    state.status = 'error';
    onStatus(id, 'error', error);
  }

  function sync() {
    for (const [id, state] of states) {
      const active = !disposed && visible && id === current;
      if (!state.controller || state.active === active) continue;
      try {
        state.controller.setActive(active);
        state.active = active;
      } catch (error) {
        fail(id, error);
      }
    }
  }

  async function ensureLoaded(id: string) {
    const state = states.get(id);
    if (!state || disposed || state.status === 'error') return;
    if (state.pending) return state.pending;
    if (state.controller) {
      sync();
      return;
    }
    state.status = 'loading';
    onStatus(id, 'loading');
    const aborter = new AbortController();
    state.aborter = aborter;
    const timer = setTimeout(
      () => aborter.abort(new Error('展厅初始化超时，请重试')),
      options.loadTimeoutMs ?? 30000,
    );
    const loading = Promise.resolve()
      .then(() => state.entry.load(aborter.signal))
      .then((controller) => {
        if (disposed || aborter.signal.aborted) {
          cleanup(controller);
          throw aborter.signal.reason;
        }
        return controller;
      });
    let onAbort: () => void;
    const cancelled = new Promise<never>((_resolve, reject) => {
      onAbort = () => reject(aborter.signal.reason);
      aborter.signal.addEventListener('abort', onAbort, { once: true });
    });
    state.pending = Promise.race([loading, cancelled])
      .then((controller) => {
        // Teardown may run after loading resolves but before this handler owns the result.
        if (disposed || aborter.signal.aborted) {
          cleanup(controller);
          throw aborter.signal.reason;
        }
        state.controller = controller;
        state.status = 'ready';
        onStatus(id, 'ready');
        sync();
      })
      .catch((error: unknown) => {
        if (disposed) return;
        fail(id, error);
      })
      .finally(() => {
        clearTimeout(timer);
        aborter.signal.removeEventListener('abort', onAbort);
        state.pending = undefined;
        state.aborter = undefined;
      });
    return state.pending;
  }

  return {
    fail,
    async activate(id: string) {
      if (!states.has(id) || disposed) return;
      current = id;
      sync();
      await ensureLoaded(id);
    },
    setVisible(value: boolean) {
      visible = value;
      sync();
    },
    async retry(id: string) {
      const state = states.get(id);
      if (!state || disposed || state.pending || state.status !== 'error') return;
      state.status = 'idle';
      await ensureLoaded(id);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const state of states.values()) {
        state.aborter?.abort();
        if (state.controller) cleanup(state.controller);
        state.controller = undefined;
        state.active = false;
      }
    },
  };
}

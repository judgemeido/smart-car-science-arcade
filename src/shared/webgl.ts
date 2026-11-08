import type { createScope } from './lifecycle';

export function reportChapterError(host: HTMLElement, error: unknown) {
  host.dispatchEvent(new CustomEvent('chapter:error', { bubbles: true, detail: error }));
}

/** Route context loss through the chapter boundary. Retry replaces the canvas. */
export function watchWebglContext(
  canvas: HTMLCanvasElement,
  scope: ReturnType<typeof createScope>,
  host: HTMLElement,
) {
  scope.listen(canvas, 'webglcontextlost', (event) => {
    event.preventDefault();
    reportChapterError(host, new Error('三维绘图上下文已丢失，请重试展厅'));
  });
}

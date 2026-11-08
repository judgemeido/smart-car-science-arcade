export interface AssetOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

/** Reads the body under the same deadline as the request, not just the headers. */
export async function fetchAsset(path: string, options: AssetOptions = {}): Promise<ArrayBuffer> {
  const aborter = new AbortController();
  const abort = () => aborter.abort(options.signal?.reason);
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(
    () => aborter.abort(new Error(`资源加载超时：${path}`)),
    options.timeoutMs ?? 30000,
  );
  try {
    const response = await fetch(path, { signal: aborter.signal });
    if (!response.ok) throw new Error(`资源加载失败 (${response.status})：${path}`);
    return await response.arrayBuffer();
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
}

export function resolveChapter(hash: string, ids: readonly string[]): string {
  let candidate = '';
  try {
    candidate = decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    /* invalid URL fragment */
  }
  return ids.includes(candidate) ? candidate : ids[0];
}

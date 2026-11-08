import type { ChapterDefinition } from './types';
import { renderChapterNavigation } from '../ui/chapter-navigation';

export function renderShell(root: HTMLElement, chapters: readonly ChapterDefinition[]) {
  root.innerHTML = `
    <main class="site-shell">
      <div class="grain" aria-hidden="true"></div>
      ${renderChapterNavigation(chapters[0].id)}
      ${chapters.map((chapter) => `<section class="chapter chapter--${chapter.id}" id="${chapter.id}" data-page="${chapter.id}" aria-hidden="true" inert>${chapter.view}</section>`).join('')}
    </main>`;
  return new Map(
    chapters.map((chapter) => [chapter.id, root.querySelector<HTMLElement>(`[data-page="${chapter.id}"]`)!]),
  );
}

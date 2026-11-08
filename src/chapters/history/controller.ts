import { archiveAssets, historyExhibits } from './data';
import { renderArchive, renderTimeline } from './render';
import { createScope } from '../../shared/lifecycle';
import type { ChapterController } from '../../app/types';
export function mount(host: HTMLElement): ChapterController {
  const scope = createScope();
  const timeline = host.querySelector<HTMLDivElement>('[data-history-timeline]');
  if (timeline) timeline.innerHTML = renderTimeline(historyExhibits);
  const archive = host.querySelector<HTMLDivElement>('[data-history-archive-list]');
  if (archive) archive.innerHTML = renderArchive(historyExhibits, archiveAssets);
  scope.listen(host, 'click', (event: MouseEvent) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-timeline-target]');
    if (!button || !host.contains(button)) return;
    host
      .querySelectorAll('[data-timeline-target]')
      .forEach((item) => item.classList.toggle('is-selected', item === button));
    const article = [...host.querySelectorAll<HTMLElement>('[data-archive-article]')].find(
      (item) => item.id === button.dataset.timelineTarget,
    );
    article?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  return { setActive() {}, dispose: () => scope.dispose() };
}

import type { ChapterController } from '../app/types';
import { createScope } from '../shared/lifecycle';
import { mountChapterNavigation, renderChapterNavigation } from '../ui/chapter-navigation';
import { activityNavigationItems, type GameActivityId } from '../app/navigation-items';
export interface ActivityDefinition {
  activityId: GameActivityId;
  title: string;
  galleryHref: string;
  view: string;
  mount(host: HTMLElement): ChapterController;
}
/** A page owns exactly one activity; BFCache returns always start from a fresh ready view. */
export function bootstrapActivity(root: HTMLElement, definition: ActivityDefinition) {
  const scope = createScope();
  const navigationItem = activityNavigationItems[definition.activityId];
  document.title = `${definition.title} / 智驾博物馆`;
  root.innerHTML = `<div class="site-shell activity-shell">
    ${renderChapterNavigation(navigationItem)}
    <main class="activity-main" data-activity-host data-activity="${definition.activityId}"></main>
    <a class="activity-back" href="${definition.galleryHref}">返回对应展厅</a>
  </div>`;
  const navigation = mountChapterNavigation(root, navigationItem);
  scope.add(navigation.dispose);
  const host = root.querySelector<HTMLElement>('[data-activity-host]')!;
  let controller: ChapterController | undefined;
  let disposed = false;

  function mountFresh() {
    if (disposed || controller) return;
    host.innerHTML = definition.view;
    controller = definition.mount(host);
    controller.setActive(document.visibilityState !== 'hidden');
  }
  function releaseController() {
    const previous = controller;
    controller = undefined;
    if (previous) {
      try {
        previous.setActive(false);
      } finally {
        previous.dispose();
      }
    }
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    try {
      releaseController();
    } finally {
      scope.dispose();
    }
  }
  scope.listen(document, 'visibilitychange', () =>
    controller?.setActive(document.visibilityState !== 'hidden'),
  );
  scope.listen(window, 'pagehide', (event: PageTransitionEvent) => {
    navigation.close();
    if (event.persisted) releaseController();
    else dispose();
  });
  scope.listen(window, 'pageshow', (event: PageTransitionEvent) => {
    if (event.persisted) mountFresh();
  });
  mountFresh();
  return { dispose };
}

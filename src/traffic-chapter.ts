import { mount } from './chapters/traffic/controller';
import { createScope } from './shared/lifecycle';
// Compatibility with the previous disposer-function API.
export function setupTrafficChapter(host: HTMLElement) {
  if (
    !host.querySelector('[data-traffic-canvas]') ||
    !host.querySelector('[data-traffic-overlay]') ||
    !host.querySelector('[data-traffic-options]')
  )
    return () => {};
  const controller = mount(host);
  const scope = createScope();
  scope.add(() => controller.dispose());
  try {
    controller.setActive(host.classList.contains('is-active'));
    scope.listen(window, 'chapter:change', (event: CustomEvent<{ page?: string }>) => {
      controller.setActive(event.detail?.page === 'traffic');
    });
    return () => scope.dispose();
  } catch (error) {
    scope.dispose();
    throw error;
  }
}

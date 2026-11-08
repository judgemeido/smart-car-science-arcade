import { navigationItems, navigationHref } from '../app/navigation-items';
import { createScope } from '../shared/lifecycle';

/** Same native-link navigation in every HTML entry. Only gallery links carry legacy data-go. */
export function renderChapterNavigation(currentId: string) {
  const group =
    navigationItems.find((group) => group.items.some((item) => item.id === currentId)) ?? navigationItems[0];
  return `
    <header class="topbar">
      <a class="brand" href="${navigationHref('history')}" aria-label="返回历史展厅"><span class="brand-mark">YS9</span><span class="brand-name">智驾博物馆</span></a>
      <div class="chapter-indicator" aria-label="当前章节">
        <span class="chapter-indicator__active" data-chapter-number>${group.number}</span>
        <span class="chapter-indicator__slash">/</span><span data-chapter-total>04</span>
        <span class="chapter-indicator__label" data-chapter-label>${group.title}</span>
      </div>
      <button class="menu-button" type="button" aria-label="打开章节菜单" aria-controls="chapter-menu" aria-expanded="false" data-menu-button><span></span><span></span></button>
    </header>
    <nav id="chapter-menu" class="chapter-menu" aria-label="章节导航" data-chapter-menu hidden inert>
      ${navigationItems
        .map((entry) => {
          const open = entry.id === group.id;
          return `<div class="chapter-menu__group" data-chapter-group="${entry.id}">
          <button class="chapter-menu__group-toggle" type="button" data-group-toggle="${entry.id}" aria-expanded="${open}" aria-controls="chapter-links-${entry.id}"><span>${entry.number}</span><strong>${entry.title}</strong><span class="chapter-menu__chevron" aria-hidden="true">⌄</span></button>
          <div class="chapter-menu__links" id="chapter-links-${entry.id}" ${open ? '' : 'hidden'}>
            ${entry.items.map((item) => `<a class="chapter-menu__link" href="${navigationHref(item.id)}" data-navigation-item="${item.id}" ${item.gallery ? `data-go="${item.id}"` : ''} ${item.id === currentId ? 'aria-current="page"' : ''}>${item.title}</a>`).join('')}
          </div>
        </div>`;
        })
        .join('')}
    </nav>`;
}

export function mountChapterNavigation(root: HTMLElement, currentId: string) {
  const scope = createScope();
  const menu = root.querySelector<HTMLElement>('[data-chapter-menu]')!;
  const menuButton = root.querySelector<HTMLButtonElement>('[data-menu-button]')!;

  function setOpen(open: boolean, restoreFocus = false) {
    menu.hidden = !open;
    menu.inert = !open;
    menu.classList.toggle('is-open', open);
    menuButton.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? '关闭章节菜单' : '打开章节菜单');
    if (restoreFocus) menuButton.focus();
  }
  function close(restoreFocus = false) {
    setOpen(false, restoreFocus);
  }
  function setCurrent(id: string) {
    const group = navigationItems.find((group) => group.items.some((item) => item.id === id));
    menu.querySelectorAll<HTMLAnchorElement>('[data-navigation-item]').forEach((link) => {
      const active = link.dataset.navigationItem === id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (!group) return;
    menu.querySelectorAll<HTMLButtonElement>('[data-group-toggle]').forEach((button) => {
      const open = button.dataset.groupToggle === group.id;
      button.setAttribute('aria-expanded', String(open));
      menu.querySelector<HTMLElement>(`#chapter-links-${button.dataset.groupToggle}`)!.hidden = !open;
    });
  }
  scope.listen(menuButton, 'click', () => setOpen(menu.hidden));
  scope.listen(menu, 'click', (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const toggle = event.target.closest<HTMLButtonElement>('[data-group-toggle]');
    if (toggle && menu.contains(toggle)) {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      menu.querySelector<HTMLElement>(`#chapter-links-${toggle.dataset.groupToggle}`)!.hidden = !open;
    } else if (
      event.target.closest('a') &&
      !(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
    ) {
      close();
    }
  });
  scope.listen(window, 'keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !menu.hidden) {
      event.preventDefault();
      close(true);
    }
  });
  scope.listen(document, 'click', (event: MouseEvent) => {
    if (
      event.target instanceof Node &&
      !menu.hidden &&
      !menu.contains(event.target) &&
      !menuButton.contains(event.target)
    )
      close();
  });
  setCurrent(currentId);
  setOpen(false);
  return { close, setCurrent, dispose: () => scope.dispose() };
}

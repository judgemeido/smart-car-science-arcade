import type { ArchiveMeta, HistoryExhibit } from './data';

export function renderTimeline(exhibits: readonly HistoryExhibit[]): string {
  return exhibits
    .map(
      (exhibit) => `
    <button class="timeline-event" type="button" data-timeline-target="${exhibit.id}">
      <span class="event-year">${exhibit.year}</span>
      <span class="event-title">${exhibit.title}</span>
    </button>
  `,
    )
    .join('');
}

export function renderArchive(
  exhibits: readonly HistoryExhibit[],
  assets: Readonly<Record<string, ArchiveMeta>>,
): string {
  return exhibits
    .map((exhibit) => {
      const archive = exhibit.imageTitle ? assets[exhibit.imageTitle] : undefined;
      const imageMarkup = archive?.image
        ? `<figure class="archive-article__media"><img src="${archive.image}" alt="${archive.imageAlt ?? exhibit.title}" loading="lazy" draggable="false" /><figcaption>${archive.caption ?? ''}</figcaption></figure>`
        : `<div class="archive-article__media archive-article__media--empty"><span>ARCHIVE NOTE</span><strong>未来展望</strong><small>智能系统与人的监督一起守护出行安全。</small></div>`;
      return `
      <article class="archive-article archive-article--${exhibit.track}" id="${exhibit.id}" data-archive-article>
        <div class="archive-article__body">
          <div class="archive-article__heading"><span class="archive-article__year">${exhibit.year}</span><h3>${exhibit.title}</h3>${exhibit.badge ? `<span class="archive-article__badge">${exhibit.badge}</span>` : ''}</div>
          <div class="archive-article__grid">
            ${imageMarkup}
            <div class="archive-article__copy">
              <p class="archive-article__detail">${exhibit.detail}</p>
              <p class="archive-article__story">${exhibit.story}</p>
            </div>
          </div>
        </div>
      </article>`;
    })
    .join('');
}

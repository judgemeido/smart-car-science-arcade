import { afterEach, expect, it, vi } from 'vitest';
import { renderArcadeResult } from '../../../src/ui/arcade/results';
import { result } from './fixtures';

// Small DOM boundary: the result renderer itself runs; raw HTML writes are forbidden.
class TextNode {
  children: TextNode[] = []; ownText = ''; className = ''; classList = { add() {} };
  constructor(readonly tag = 'div') {}
  set textContent(value: string) { this.ownText = value; this.children = []; }
  get textContent(): string { return this.ownText + this.children.map(child => child.textContent).join('\n'); }
  set innerHTML(_value: string) { throw new Error('Unsafe HTML rendering'); }
  append(...children: TextNode[]) { this.children.push(...children); }
  replaceChildren() { this.children = []; this.ownText = ''; }
}
afterEach(() => vi.unstubAllGlobals());
it('renders original real breakdown, profile and version without treating nickname as markup', () => {
  vi.stubGlobal('document', { createElement: (tag: string) => new TextNode(tag) });
  const host = new TextNode(); const actual = result('stored-example', { score: { progress: 700, quality: 110, efficiency: 100, total: 910 }, status: 'completed' });
  actual.config.nickname = '<img src=x>'; actual.config.scoringVersion = 'science-arcade-score-older';
  renderArcadeResult(host as unknown as HTMLElement, actual, 'memory-only');
  expect(host.textContent).toContain('910 分');
  expect(host.textContent).toContain('110 / 200');
  expect(host.textContent).toContain('<img src=x>');
  expect(host.textContent).toContain('science-arcade-score-older');
  expect(host.textContent).toContain('SA1-R07-7K2M4C-G');
  expect(host.textContent).toContain('未保存');
});

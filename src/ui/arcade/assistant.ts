import { createScope } from '../../shared/lifecycle';
/** General instructions are free; an explicit answer hint needs two deliberate clicks. */
export function mountArcadeAssistant(button: HTMLButtonElement, feedback: HTMLElement, onHint: () => void) {
  const scope = createScope(); let confirmed = false;
  scope.listen(button, 'click', () => {
    if (!confirmed) { confirmed = true; button.textContent = '确认使用提示'; feedback.textContent = '此目标仍可获得探索分，但首次验证分不再获得。再点一次才显示答案提示。'; return; }
    confirmed = false; button.textContent = '答案提示'; onHint();
  });
  return { reset() { confirmed = false; button.textContent = '答案提示'; }, dispose: scope.dispose };
}

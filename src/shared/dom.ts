export const setText = (host: HTMLElement, selector: string, value: string) => {
  const element = host.querySelector<HTMLElement>(selector);
  if (element) element.textContent = value;
};

export const setTextAll = (host: HTMLElement, selector: string, value: string) => {
  host.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    element.textContent = value;
  });
};

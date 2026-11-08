export interface ChapterController {
  setActive(active: boolean): void;
  dispose(): void;
}

export interface ChapterDefinition {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  label: string;
  immersive: boolean;
  view: string;
  load(host: HTMLElement, signal?: AbortSignal): Promise<ChapterController>;
}

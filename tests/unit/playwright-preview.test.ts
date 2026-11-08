import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it.each([
  [undefined, undefined, false],
  ['4176', undefined, false],
  ['4176', '1', true],
])('requires explicit preview reuse with port=%s and opt-in=%s', async (port, optIn, expected) => {
  vi.stubEnv('PLAYWRIGHT_PORT', port);
  vi.stubEnv('PLAYWRIGHT_BASE_URL', undefined);
  vi.stubEnv('PLAYWRIGHT_REUSE_EXISTING_SERVER', optIn);
  vi.resetModules();
  const { default: config } = await import('../../playwright.config');
  expect(config.webServer).toMatchObject({
    reuseExistingServer: expected,
    url: `http://127.0.0.1:${port ?? '4173'}`,
  });
});

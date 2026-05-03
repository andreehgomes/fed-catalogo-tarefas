import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração mínima do Playwright para o smoke test da Release 1.
 *
 * - Sobe o `ng serve` automaticamente em `localhost:4200` se não estiver
 *   rodando (CI / desenvolvedor distraído).
 * - Roda apenas Chromium para encurtar o tempo do smoke (Release 2 deve
 *   adicionar Firefox/WebKit se for relevante).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});

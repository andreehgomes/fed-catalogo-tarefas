import { expect, test } from '@playwright/test';

test.describe('Smoke — Release 1 (Core)', () => {
  test('renderiza o shell da aplicação e a página de tarefas', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Minhas tarefas|fed-catalogo-tarefas-app/i);

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(/fed-catalogo-tarefas-app/i);

    await expect(
      page.getByRole('heading', { level: 2, name: /Minhas tarefas/i }),
    ).toBeVisible();
  });
});

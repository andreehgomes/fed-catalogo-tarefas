import { expect, test } from '@playwright/test';

test.describe('Smoke — render básico', () => {
  test('redireciona / para /login quando não há usuário', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login(\?|$)/);
    await expect(
      page.getByRole('heading', { level: 2, name: /Entrar/i }),
    ).toBeVisible();
  });

  test('header global exibe o nome do projeto', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      /fed-catalogo-tarefas/i,
    );
  });
});

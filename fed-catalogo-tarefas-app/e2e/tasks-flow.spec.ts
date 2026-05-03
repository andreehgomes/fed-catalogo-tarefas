import { AxeBuilder } from '@axe-core/playwright';
import { Page, expect, test } from '@playwright/test';

/**
 * Fluxo E2E principal — Release 2.
 *
 * Cria um usuário descartável a cada execução, autentica via UI, depois
 * executa criar → editar → excluir e valida acessibilidade na página de
 * tarefas com axe-core.
 *
 * O usuário e suas tarefas ficam no Firebase Auth/Firestore reais. As
 * regras de Firestore garantem que ele não vê dados de outros usuários,
 * então a poluição é isolada e baixa custo. Caso queira limpar, há um
 * stub de Cloud Function de limpeza no roadmap (Release 3).
 */

interface TestUser {
  email: string;
  password: string;
}

function buildTestUser(): TestUser {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return {
    email: `e2e-${ts}-${rand}@example.com`,
    password: 'pass-1234',
  };
}

async function signUp(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  // Garante que estamos no modo de cadastro.
  await page.getByRole('button', { name: /Cadastre-se/i }).click();
  await page.getByLabel(/E-mail/i).fill(user.email);
  await page.getByLabel(/Senha/i).fill(user.password);
  await page.getByRole('button', { name: /Cadastrar/i }).click();
  await expect(page).toHaveURL('/');
}

test.describe('Fluxo de tarefas — login → criar → editar → excluir', () => {
  test('usuário autenticado consegue gerenciar suas tarefas', async ({ page }) => {
    const user = buildTestUser();
    await signUp(page, user);

    // Estado inicial — usuário recém-criado, lista vazia.
    await expect(page.getByText(/Nenhuma tarefa cadastrada/i)).toBeVisible();

    // Criar uma tarefa.
    await page.getByLabel(/Título/i).first().fill('Estudar Angular Signals');
    await page.getByLabel(/Descrição/i).first().fill('Cobrir computed e effect');
    await page.getByLabel(/Prioridade/i).first().selectOption('high');
    await page.getByRole('button', { name: /Criar tarefa/i }).click();

    const item = page.locator('.tasks__item', { hasText: 'Estudar Angular Signals' });
    await expect(item).toBeVisible({ timeout: 10_000 });

    // Editar a tarefa criada.
    await item.getByRole('button', { name: /Editar tarefa/i }).click();

    const editTitle = page.locator('input[name="edit-title"]');
    await editTitle.fill('Estudar Angular Signals — revisão');
    await page.locator('select[name="edit-status"]').selectOption('in_progress');
    await page.getByRole('button', { name: /Salvar/i }).click();

    const editedItem = page.locator('.tasks__item', {
      hasText: 'Estudar Angular Signals — revisão',
    });
    await expect(editedItem).toBeVisible();
    await expect(editedItem).toContainText('Status: in_progress');

    // Excluir.
    await editedItem.getByRole('button', { name: /Excluir tarefa/i }).click();
    await expect(editedItem).toHaveCount(0);

    // Encerra a sessão para deixar o ambiente neutro.
    await page.getByRole('button', { name: /^Sair$/ }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('a página de tarefas não tem violações de acessibilidade graves', async ({ page }) => {
    const user = buildTestUser();
    await signUp(page, user);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Falha apenas em violações sérias ou críticas — alertas menores
    // (best-practice, etc.) são cobertos no Lighthouse manual.
    const blocking = results.violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? ''),
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
});

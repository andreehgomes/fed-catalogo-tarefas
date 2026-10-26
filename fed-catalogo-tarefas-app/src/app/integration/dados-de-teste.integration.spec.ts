import { ZodError } from 'zod';

import { TaskPriority, TaskStatus } from '../models/task';
import { FakeAuth, FakeFirestore } from './fakes/firestore.fake';
import { IntegrationTaskService } from './harness/integration-task-service';

/**
 * Casos CI-09 a CI-14 — dados de teste gerados pelo prompt Tipo B (P-105).
 * Ver `docs/pos-ia/forum-testes-integracao/prompts/02-dados-de-teste.md`.
 *
 * Todos atravessam F1 (payload da UI → validação zod) e, quando o dado é
 * válido, seguem até F3 (gravação). Os códigos de erro esperados abaixo são
 * os do **zod 4** — a LLM os gerou com a nomenclatura do zod 3
 * (`invalid_enum_value`), e a correção só apareceu ao executar.
 */
describe('Integração — dados de teste e fronteiras (Tipo B)', () => {
  let db: FakeFirestore;
  let service: IntegrationTaskService;

  beforeEach(() => {
    db = new FakeFirestore();
    service = new IntegrationTaskService(db, new FakeAuth({ uid: 'user-1' }));
  });

  /** Extrai o primeiro issue do ZodError, para asserções sobre código e path. */
  async function captureZodIssue(action: () => Promise<unknown>) {
    try {
      await action();
      return null;
    } catch (error) {
      if (error instanceof ZodError) {
        return error.issues[0];
      }
      throw error;
    }
  }

  describe('CI-09 — title nos limites de tamanho', () => {
    it('aceita exatamente 120 caracteres', async () => {
      const id = await service.create({ title: 'a'.repeat(120) } as never);
      expect((db.raw('tasks', id)!['title'] as string).length).toBe(120);
    });

    it('rejeita 121 caracteres com too_big, sem gravar nada', async () => {
      const issue = await captureZodIssue(() =>
        service.create({ title: 'a'.repeat(121) } as never),
      );

      expect(issue?.code).toBe('too_big');
      expect(issue?.path).toEqual(['title']);
      expect(db.count('tasks')).toBe(0);
    });
  });

  it('CI-10 — title só com espaços é rejeitado: .trim() roda antes do .min(1)', async () => {
    const issue = await captureZodIssue(() => service.create({ title: '   ' } as never));

    // '   '.length === 3, mas após o trim é 0 — o trim vence.
    expect(issue?.code).toBe('too_small');
    expect(issue?.message).toBe('Título é obrigatório');
    expect(db.count('tasks')).toBe(0);
  });

  it('CI-10b — title com espaços em volta é gravado já trimado', async () => {
    const id = await service.create({ title: '  Tarefa espaçada  ' } as never);
    expect(db.raw('tasks', id)!['title']).toBe('Tarefa espaçada');
  });

  describe('CI-11 — priority: null vs. undefined', () => {
    it('undefined cai no .default() e grava medium', async () => {
      const id = await service.create({ title: 'ok', priority: undefined } as never);
      expect(db.raw('tasks', id)!['priority']).toBe(TaskPriority.MEDIUM);
    });

    it('null é rejeitado com invalid_value — .default() só cobre undefined', async () => {
      // Relevante porque formulários Angular emitem null em campo não preenchido.
      const issue = await captureZodIssue(() =>
        service.create({ title: 'ok', priority: null } as never),
      );

      expect(issue?.code).toBe('invalid_value');
      expect(issue?.path).toEqual(['priority']);
      expect(db.count('tasks')).toBe(0);
    });
  });

  it('CI-12 — status fora do enum é rejeitado com invalid_value', async () => {
    const issue = await captureZodIssue(() =>
      service.create({ title: 'ok', status: 'archived' } as never),
    );

    expect(issue?.code).toBe('invalid_value');
    expect(issue?.path).toEqual(['status']);
  });

  describe('CI-13 — description multibyte na fronteira (⚠️ comportamento indesejado)', () => {
    it('aceita 1000 emojis porque max(2000) conta unidades UTF-16', async () => {
      const mil = '🙂'.repeat(1000);

      // O usuário digitou 1000 caracteres; o JS conta 2000.
      expect(mil.length).toBe(2000);
      expect([...mil].length).toBe(1000);

      const id = await service.create({ title: 'ok', description: mil } as never);

      // Passa raspando no limite. Documentado, não corrigido — backlog item 4:
      // o limite percebido pelo usuário é metade do declarado.
      expect(db.raw('tasks', id)!['description']).toBe(mil);
    });

    it('rejeita 1001 emojis (2002 unidades) com too_big', async () => {
      const issue = await captureZodIssue(() =>
        service.create({ title: 'ok', description: '🙂'.repeat(1001) } as never),
      );

      expect(issue?.code).toBe('too_big');
      expect(issue?.path).toEqual(['description']);
    });
  });

  describe('CI-14 — update parcial', () => {
    it('rejeita objeto vazio pelo .refine(), com code custom', async () => {
      const id = await service.create({ title: 'Base' } as never);

      const issue = await captureZodIssue(() => service.update(id, {}));

      expect(issue?.code).toBe('custom');
      expect(issue?.message).toBe(
        'Pelo menos um campo deve ser informado para atualização',
      );
    });

    it('aceita um único campo e preserva os demais', async () => {
      const id = await service.create({ title: 'Base', description: 'mantida' } as never);

      await service.update(id, { status: TaskStatus.DONE });

      const stored = db.raw('tasks', id)!;
      expect(stored['status']).toBe(TaskStatus.DONE);
      expect(stored['title']).toBe('Base');
      expect(stored['description']).toBe('mantida');
    });
  });
});

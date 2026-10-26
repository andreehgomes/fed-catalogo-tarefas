import { Timestamp } from '@angular/fire/firestore';
import { ZodError } from 'zod';

import { NotAuthenticatedError } from '../errors/not-authenticated.error';
import { TaskNotFoundError } from '../errors/task-not-found.error';
import { TaskPriority, TaskStatus } from '../models/task';
import { FakeAuth, FakeFirestore, FakeFirestoreNotFoundError } from './fakes/firestore.fake';
import { IntegrationTaskService } from './harness/integration-task-service';

/**
 * Casos CI-15 a CI-22 — falhas de integração encontradas pelo prompt
 * adversarial Tipo C (P-107). Ver
 * `docs/pos-ia/forum-testes-integracao/prompts/03-casos-de-erro.md`.
 *
 * Os casos marcados ⚠️ **passam** e documentam comportamento indesejado: são
 * bugs reais, registrados no backlog, não corrigidos nesta entrega. Deixá-los
 * falhando poluiria o sinal da suíte; deixá-los sem teste perderia o achado.
 */
describe('Integração — casos de erro adversariais (Tipo C)', () => {
  const OWNER = 'user-owner';

  let db: FakeFirestore;
  let auth: FakeAuth;
  let service: IntegrationTaskService;

  /** Semeia um documento completo e válido, com os campos sob controle do teste. */
  function seedTask(id: string, overrides: Record<string, unknown> = {}): void {
    db.seed('tasks', id, {
      title: 'Tarefa semeada',
      description: 'desc',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.OPEN,
      userId: OWNER,
      createdAt: Timestamp.fromDate(new Date('2026-10-20T10:00:00Z')),
      updatedAt: Timestamp.fromDate(new Date('2026-10-20T10:00:00Z')),
      ...overrides,
    });
  }

  beforeEach(() => {
    db = new FakeFirestore();
    auth = new FakeAuth({ uid: OWNER });
    service = new IntegrationTaskService(db, auth);
  });

  it('CI-15 ⚠️ — createdAt pendente vira 1970-01-01, não estado "pendente"', async () => {
    // Gatilho: latency compensation. Entre o addDoc e a confirmação do
    // servidor, o listener local emite o documento com serverTimestamp() nulo.
    seedTask('pendente', { createdAt: null, updatedAt: null });

    const task = await service.getById('pendente');

    // O `?? new Date(0)` não quebra, mas mente: a tarefa recém-criada recebe
    // a data mais antiga possível. Com orderBy('createdAt','desc') ela vai
    // para o fim da lista e depois salta para o topo.
    // Backlog item 2: expor o estado pendente em vez de mascará-lo.
    expect(task.createdAt.getTime()).toBe(0);
    expect(task.createdAt.getUTCFullYear()).toBe(1970);
  });

  it('CI-16 — operação após expiração da sessão lança NotAuthenticatedError', async () => {
    const id = await service.create({ title: 'Antes do logout' } as never);

    auth.signOut();

    await expectAsync(service.getById(id)).toBeRejectedWithError(NotAuthenticatedError);
    await expectAsync(
      service.update(id, { status: TaskStatus.DONE }),
    ).toBeRejectedWithError(NotAuthenticatedError);
    await expectAsync(service.delete(id)).toBeRejectedWithError(NotAuthenticatedError);
  });

  it('CI-17 ⚠️ — delete concorrente durante update vaza FirebaseError cru, não TaskNotFoundError', async () => {
    const id = await service.create({ title: 'Disputada' } as never);

    let jaDeletou = false;
    db.onAfterGet = async () => {
      if (!jaDeletou) {
        jaDeletou = true;
        await db.deleteDoc('tasks', id);
      }
    };

    // As checagens de existência e ownership já passaram com o snapshot
    // anterior à deleção. A falha vem do `updateDoc`, com código `not-found`,
    // e NÃO é convertida em `TaskNotFoundError` — então a UI, que trata as
    // classes de erro do domínio, recebe um erro que não reconhece.
    // Backlog item 6: capturar `not-found` na escrita e reclassificar.
    await expectAsync(
      service.update(id, { priority: TaskPriority.URGENT }),
    ).toBeRejectedWithError(FakeFirestoreNotFoundError);

    // O documento segue deletado — nenhuma escrita fantasma.
    expect(db.raw('tasks', id)).toBeNull();
  });

  it('CI-18 — getById de documento inexistente lança TaskNotFoundError com o id', async () => {
    try {
      await service.getById('nao-existe');
      fail('deveria ter lançado');
    } catch (error) {
      expect(error instanceof TaskNotFoundError).toBeTrue();
      expect((error as TaskNotFoundError).taskId).toBe('nao-existe');
    }
  });

  it('CI-19 — documento legado sem description é lido com string vazia', async () => {
    // Dado gravado antes de o campo existir no schema.
    seedTask('legado');
    const bruto = db.raw('tasks', 'legado')!;
    delete bruto['description'];
    db.seed('tasks', 'legado-sem-desc', bruto);

    const task = await service.getById('legado-sem-desc');

    expect(task.description).toBe('');
  });

  it('CI-20 ⚠️ — priority inválida no banco derruba a listagem inteira, não só a tarefa ruim', async () => {
    seedTask('boa-1', { title: 'Válida 1' });
    seedTask('corrompida', { title: 'Corrompida', priority: 'critical' });
    seedTask('boa-2', { title: 'Válida 2' });

    // mapSnapshot roda TaskOutSchema.parse por documento: um valor ruim
    // impede o usuário de ver as outras duas tarefas, que estão íntegras.
    // Backlog item 3: safeParse + descarte do documento inválido.
    await expectAsync(service.listOnce()).toBeRejectedWith(
      jasmine.any(ZodError),
    );

    // Prova de que as outras duas estão válidas: lidas isoladamente, funcionam.
    await expectAsync(service.getById('boa-1')).toBeResolved();
    await expectAsync(service.getById('boa-2')).toBeResolved();
  });

  it('CI-23 ⚠️ (parcial) — documento sem createdAt é omitido da query ordenada', async () => {
    seedTask('com-data', { title: 'Com data' });

    const semData = db.raw('tasks', 'com-data')!;
    delete semData['createdAt'];
    db.seed('tasks', 'sem-data', { ...semData, title: 'Sem data' });

    const lista = await service.listOnce();

    // Conforme a documentação do Firestore, orderBy filtra por existência do
    // campo: "O conjunto de resultados não incluirá documentos que não
    // contenham os campos fornecidos."
    // O fake reproduz o campo AUSENTE; não reproduz o campo presente com
    // valor null (que é o caso real da latency compensation) — ver limitações.
    expect(lista.map((t) => t.title)).toEqual(['Com data']);
  });
});

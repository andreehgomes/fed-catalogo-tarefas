import { Timestamp } from '@angular/fire/firestore';

import { UnauthorizedTaskAccessError } from '../errors/unauthorized-task-access.error';
import { TaskPriority, TaskStatus } from '../models/task';
import { FakeAuth, FakeFirestore, FakeFirestoreNotFoundError } from './fakes/firestore.fake';
import { IntegrationTaskService } from './harness/integration-task-service';

/**
 * Casos CI-01 a CI-07 — cenários de integração gerados pelo prompt Tipo A
 * (P-103). Ver `docs/pos-ia/forum-testes-integracao/prompts/01-cenarios-integracao.md`.
 *
 * Cada `it` atravessa no mínimo duas fronteiras do sistema; a fronteira e o
 * invariante protegido estão nomeados no título e no comentário de cada caso.
 */
describe('Integração — cenários (Tipo A)', () => {
  const OWNER = 'user-owner';
  const OTHER = 'user-other';

  let db: FakeFirestore;
  let auth: FakeAuth;
  let service: IntegrationTaskService;

  beforeEach(() => {
    db = new FakeFirestore();
    auth = new FakeAuth({ uid: OWNER });
    service = new IntegrationTaskService(db, auth);
  });

  it('CI-01 — F1→F2→F3: create grava userId e timestamps vindos do serviço', async () => {
    const id = await service.create({
      title: 'Estudar Angular Signals',
      description: 'Ler a documentação de toSignal',
      priority: TaskPriority.HIGH,
      status: TaskStatus.OPEN,
    });

    const stored = db.raw('tasks', id);

    // Invariante: userId e datas são do serviço, nunca do chamador.
    expect(stored).not.toBeNull();
    expect(stored!['userId']).toBe(OWNER);
    expect(stored!['createdAt'] instanceof Timestamp).toBeTrue();
    expect(stored!['updatedAt'] instanceof Timestamp).toBeTrue();
    expect(stored!['title']).toBe('Estudar Angular Signals');
  });

  it('CI-02 — F1→F3: defaults do zod chegam ao banco como valores concretos', async () => {
    // Só o título é informado; os demais campos têm .default() no schema.
    const id = await service.create({ title: 'Só título' } as never);

    const stored = db.raw('tasks', id)!;

    // Invariante: campo opcional omitido nunca chega ao Firestore como undefined.
    expect(stored['description']).toBe('');
    expect(stored['priority']).toBe(TaskPriority.MEDIUM);
    expect(stored['status']).toBe(TaskStatus.OPEN);
    expect(Object.values(stored).includes(undefined as never)).toBeFalse();
  });

  it('CI-03 — F2→F3: getById converte Timestamp em Date na borda do serviço', async () => {
    const id = await service.create({ title: 'Tarefa com data' } as never);

    const task = await service.getById(id);

    // Invariante: a UI recebe Date, nunca Timestamp do Firestore.
    expect(task.createdAt instanceof Date).toBeTrue();
    expect(task.updatedAt instanceof Date).toBeTrue();
    expect(task.id).toBe(id);
    expect(task.userId).toBe(OWNER);
  });

  it('CI-04 — F2→F3: update em tarefa de outro usuário é bloqueado e não escreve', async () => {
    db.seed('tasks', 'alheia', {
      title: 'Tarefa do outro',
      description: '',
      priority: TaskPriority.LOW,
      status: TaskStatus.OPEN,
      userId: OTHER,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });

    await expectAsync(
      service.update('alheia', { status: TaskStatus.DONE }),
    ).toBeRejectedWithError(UnauthorizedTaskAccessError);

    // Invariante: ownership é checado ANTES de qualquer escrita.
    expect(db.raw('tasks', 'alheia')!['status']).toBe(TaskStatus.OPEN);
  });

  it('CI-05 — F2→F3: delete em tarefa de outro usuário é bloqueado e não remove', async () => {
    db.seed('tasks', 'alheia', {
      title: 'Tarefa do outro',
      description: '',
      priority: TaskPriority.LOW,
      status: TaskStatus.OPEN,
      userId: OTHER,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });

    await expectAsync(service.delete('alheia')).toBeRejectedWithError(
      UnauthorizedTaskAccessError,
    );

    // Invariante: ownership é checado ANTES da deleção.
    expect(db.raw('tasks', 'alheia')).not.toBeNull();
    expect(db.count('tasks')).toBe(1);
  });

  it('CI-06 — F2→F3: listagem devolve só as tarefas do usuário corrente', async () => {
    await service.create({ title: 'Minha A' } as never);
    await service.create({ title: 'Minha B' } as never);

    auth.signIn(OTHER);
    await service.create({ title: 'Do outro' } as never);

    auth.signIn(OWNER);
    const minhas = await service.listOnce();

    // Invariante: o filtro where('userId','==',uid) nunca é omitido.
    expect(minhas.length).toBe(2);
    expect(minhas.every((t) => t.userId === OWNER)).toBeTrue();
    expect(minhas.map((t) => t.title).sort()).toEqual(['Minha A', 'Minha B']);
  });

  it('CI-07 ⚠️ — F3: tarefa deletada entre o getDoc e o updateDoc falha no SDK, sem escrita fantasma', async () => {
    const id = await service.create({ title: 'Vai ser deletada' } as never);

    // Simula a outra aba: deleta na janela entre a leitura e a escrita.
    let disparado = false;
    db.onAfterGet = async () => {
      if (!disparado) {
        disparado = true;
        await db.deleteDoc('tasks', id);
      }
    };

    // O serviço já passou pelas checagens de existência e ownership com o
    // snapshot antigo; a falha vem do próprio `updateDoc`, com `not-found`.
    // Ou seja: o usuário recebe um FirebaseError cru, não um
    // `TaskNotFoundError` tratado — ver CI-17 e o backlog item 6.
    await expectAsync(
      service.update(id, { title: 'Novo título' }),
    ).toBeRejectedWithError(FakeFirestoreNotFoundError);

    // Invariante: operação não atômica falha em erro, nunca recria o documento.
    expect(db.raw('tasks', id)).toBeNull();
    expect(db.count('tasks')).toBe(0);
  });
});

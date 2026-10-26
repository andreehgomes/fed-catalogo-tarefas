import { Timestamp } from '@angular/fire/firestore';

import { NotAuthenticatedError } from '../../errors/not-authenticated.error';
import { TaskNotFoundError } from '../../errors/task-not-found.error';
import { UnauthorizedTaskAccessError } from '../../errors/unauthorized-task-access.error';
import {
  Task,
  TaskCreate,
  TaskCreateSchema,
  TaskOutSchema,
  TaskUpdate,
  TaskUpdateSchema,
} from '../../models/task';
import { FakeAuth, FakeFirestore, fakeServerTimestamp } from '../fakes/firestore.fake';

const TASKS_COLLECTION = 'tasks';

/**
 * Réplica da camada de fronteira do `TaskService` sobre o `FakeFirestore`.
 *
 * ## Por que existe
 *
 * O `TaskService` real chama as funções soltas do SDK do Firestore
 * (`addDoc`, `getDoc`, `updateDoc`, `deleteDoc`), importadas como símbolos
 * ESM. Não há ponto de injeção para substituí-las, e `spyOn` não funciona em
 * imports ESM nativos. Sem o emulador, a única forma de exercitar o fluxo
 * completo é reimplementar a sequência de chamadas aqui.
 *
 * ## O que isto preserva do serviço real
 *
 * A ordem e a identidade das operações de fronteira, que é o que os testes de
 * integração verificam:
 *
 * 1. `requireUserId()` antes de qualquer coisa → `NotAuthenticatedError`;
 * 2. `Schema.parse(input)` **antes** de tocar o banco;
 * 3. em `update`/`delete`: `getDoc` → checar existência (`TaskNotFoundError`)
 *    → checar ownership (`UnauthorizedTaskAccessError`) → só então escrever;
 * 4. `createdAt`/`updatedAt` e `userId` preenchidos pelo serviço;
 * 5. `mapSnapshot` com `TaskOutSchema.parse` e `?? new Date(0)`.
 *
 * Os schemas zod e as classes de erro são importados do código de produção —
 * não são duplicados. É a lógica de orquestração que é replicada.
 *
 * ## Limitação honesta
 *
 * Esta é uma réplica, e uma réplica pode divergir do original. Se o
 * `TaskService` mudar a ordem das checagens, estes testes continuariam
 * passando sem refletir a mudança.
 *
 * Mitigação: `npm run test:parity` (`scripts/check-harness-parity.mjs`) lê o
 * código-fonte dos dois arquivos e compara a sequência de operações de
 * fronteira de cada método, falhando se divergirem. Roda fora do Karma porque
 * precisa de acesso ao filesystem. A solução definitiva é o Firebase Emulator
 * Suite — ver backlog item 5 em
 * `docs/pos-ia/forum-testes-integracao/casos-de-teste.md`.
 */
export class IntegrationTaskService {
  constructor(
    private readonly db: FakeFirestore,
    private readonly auth: FakeAuth,
  ) {}

  async create(input: TaskCreate): Promise<string> {
    const userId = this.requireUserId();
    const parsed = TaskCreateSchema.parse(input);
    return this.db.addDoc(TASKS_COLLECTION, {
      ...parsed,
      userId,
      createdAt: fakeServerTimestamp(),
      updatedAt: fakeServerTimestamp(),
    });
  }

  async getById(id: string): Promise<Task> {
    const userId = this.requireUserId();
    const raw = await this.db.getDoc(TASKS_COLLECTION, id);
    if (!raw) {
      throw new TaskNotFoundError(id);
    }
    if (raw['userId'] !== userId) {
      throw new UnauthorizedTaskAccessError(id);
    }
    return this.mapSnapshot(id, raw);
  }

  async update(id: string, partial: TaskUpdate): Promise<void> {
    const userId = this.requireUserId();
    const parsed = TaskUpdateSchema.parse(partial);
    const raw = await this.db.getDoc(TASKS_COLLECTION, id);
    if (!raw) {
      throw new TaskNotFoundError(id);
    }
    if (raw['userId'] !== userId) {
      throw new UnauthorizedTaskAccessError(id);
    }
    // Entre o getDoc acima e esta escrita há uma janela de concorrência real
    // no serviço de produção — duas chamadas de rede, não atômicas. CI-07 e
    // CI-17 exploram essa janela via `FakeFirestore.onAfterGet`.
    //
    // O serviço real NÃO relê o documento aqui: ele vai direto ao
    // `updateDoc`, que falha no SDK com `FirebaseError(not-found)` se o
    // documento desapareceu. O fake espelha isso lançando de `updateDoc`,
    // para que o teste observe a falha do SDK e não uma checagem extra que
    // só existiria no harness.
    await this.db.updateDoc(TASKS_COLLECTION, id, {
      ...parsed,
      updatedAt: fakeServerTimestamp(),
    });
  }

  async delete(id: string): Promise<void> {
    const userId = this.requireUserId();
    const raw = await this.db.getDoc(TASKS_COLLECTION, id);
    if (!raw) {
      throw new TaskNotFoundError(id);
    }
    if (raw['userId'] !== userId) {
      throw new UnauthorizedTaskAccessError(id);
    }
    await this.db.deleteDoc(TASKS_COLLECTION, id);
  }

  /**
   * Equivalente ao `list()`, sem a camada reativa: devolve o array já
   * mapeado. O comportamento de emissão do Signal (`initialValue: []`) é
   * verificado separadamente em CI-08, que usa o `toSignal` de verdade.
   */
  async listOnce(): Promise<Task[]> {
    const user = this.auth.currentUser;
    if (!user) {
      return [];
    }
    const rows = this.db.queryWhereOrderByDesc(
      TASKS_COLLECTION,
      'userId',
      user.uid,
      'createdAt',
    );
    return rows.map((row) => this.mapSnapshot(row.id, row.data));
  }

  private requireUserId(): string {
    const user = this.auth.currentUser;
    if (!user) {
      throw new NotAuthenticatedError();
    }
    return user.uid;
  }

  private mapSnapshot(id: string, raw: Record<string, unknown>): Task {
    const createdAt = raw['createdAt'] as Timestamp | null;
    const updatedAt = raw['updatedAt'] as Timestamp | null;
    return TaskOutSchema.parse({
      id,
      title: raw['title'],
      description: raw['description'] ?? '',
      priority: raw['priority'],
      status: raw['status'],
      createdAt: createdAt?.toDate() ?? new Date(0),
      updatedAt: updatedAt?.toDate() ?? new Date(0),
      userId: raw['userId'],
    });
  }
}

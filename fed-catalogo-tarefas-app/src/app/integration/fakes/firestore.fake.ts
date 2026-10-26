import { Timestamp } from '@angular/fire/firestore';

/**
 * Fakes in-memory de Firestore e Auth usados pelos testes de integração.
 *
 * Por que fakes e não o emulador: ver
 * `docs/pos-ia/forum-testes-integracao/casos-de-teste.md#limitações-conhecidas`.
 * Em resumo — o `firebase.json` do projeto já configura os emuladores, mas
 * rodá-los exige um JDK instalado. Os fakes preservam o que importa aqui (as
 * fronteiras entre a lógica do `TaskService`, zod e Auth são atravessadas de
 * verdade), as lacunas estão declaradas, e `npm run test:parity` garante que
 * o harness não divirja do serviço real.
 *
 * O `TaskService` consome o Firestore apenas através das funções soltas do
 * SDK (`addDoc`, `getDoc`, …), que recebem a referência como primeiro
 * argumento. Os testes de integração não conseguem interceptar essas funções
 * (são imports ESM), então o `TaskService` real não é usado nos specs: o
 * `FakeFirestore` abaixo serve de backend para o `IntegrationTaskService`
 * (`../harness/integration-task-service.ts`), que replica a lógica de
 * fronteira do serviço real — validação zod, ownership, conversão de
 * timestamps — chamando este fake no lugar do SDK.
 */

/**
 * Equivalente ao `FirebaseError` com `code: 'firestore/not-found'` que o SDK
 * lança quando `updateDoc` atinge um documento que não existe mais.
 */
export class FakeFirestoreNotFoundError extends Error {
  readonly code = 'not-found';

  constructor(public readonly docId: string) {
    super(`fake-firestore: documento "${docId}" não existe (not-found)`);
    this.name = 'FakeFirestoreNotFoundError';
  }
}

export interface FakeDoc {
  [key: string]: unknown;
}

/** Documento guardado no fake, já com o id atribuído. */
interface StoredDoc {
  id: string;
  data: FakeDoc;
}

/**
 * Store in-memory com a semântica mínima do Firestore usada pelo projeto:
 * `addDoc` com id gerado, `getDoc`, `updateDoc` com merge raso, `deleteDoc`
 * e consulta com filtro de igualdade + ordenação.
 */
export class FakeFirestore {
  private readonly collections = new Map<string, StoredDoc[]>();
  private idCounter = 0;

  /**
   * Hook de concorrência: quando definido, é chamado (e aguardado) logo após
   * cada `getDoc`, antes de a operação seguir para a escrita. É o que permite
   * reproduzir CI-07 — deletar o documento na janela entre o `getDoc` e o
   * `updateDoc` do `TaskService`.
   */
  onAfterGet: (() => void | Promise<void>) | null = null;

  private bucket(collectionName: string): StoredDoc[] {
    const existing = this.collections.get(collectionName);
    if (existing) {
      return existing;
    }
    const created: StoredDoc[] = [];
    this.collections.set(collectionName, created);
    return created;
  }

  /** Insere um documento com id gerado e devolve o id, como `addDoc`. */
  async addDoc(collectionName: string, data: FakeDoc): Promise<string> {
    const id = `fake-${++this.idCounter}`;
    this.bucket(collectionName).push({ id, data: { ...data } });
    return id;
  }

  /**
   * Insere um documento com id e conteúdo controlados, sem passar por
   * validação. É o que permite montar o estado de partida dos testes —
   * inclusive estados que o serviço nunca produziria, como um documento com
   * `priority` fora do enum (CI-20) ou `createdAt: null` (CI-15).
   */
  seed(collectionName: string, id: string, data: FakeDoc): void {
    this.bucket(collectionName).push({ id, data: { ...data } });
  }

  async getDoc(collectionName: string, id: string): Promise<FakeDoc | null> {
    const found = this.bucket(collectionName).find((row) => row.id === id);
    const snapshot = found ? { ...found.data } : null;
    if (this.onAfterGet) {
      await this.onAfterGet();
    }
    return snapshot;
  }

  async updateDoc(collectionName: string, id: string, partial: FakeDoc): Promise<void> {
    const found = this.bucket(collectionName).find((row) => row.id === id);
    if (!found) {
      // Espelha o SDK: `updateDoc` em documento inexistente rejeita com
      // `FirebaseError` de código `not-found`. É o que o `TaskService` real
      // enfrenta quando o documento é deletado entre o `getDoc` e a escrita.
      throw new FakeFirestoreNotFoundError(id);
    }
    found.data = { ...found.data, ...partial };
  }

  async deleteDoc(collectionName: string, id: string): Promise<void> {
    const rows = this.bucket(collectionName);
    const index = rows.findIndex((row) => row.id === id);
    if (index >= 0) {
      rows.splice(index, 1);
    }
  }

  /**
   * Equivalente a `query(col, where(field,'==',value), orderBy(orderField,'desc'))`.
   *
   * Reproduz deliberadamente a exclusão de documentos que não contêm o campo
   * do `orderBy`, conforme a documentação do Firestore. Note que isso cobre o
   * campo **ausente**, não o campo presente com valor `null` — ver CI-23 nas
   * limitações.
   */
  queryWhereOrderByDesc(
    collectionName: string,
    field: string,
    value: unknown,
    orderField: string,
  ): Array<{ id: string; data: FakeDoc }> {
    return this.bucket(collectionName)
      .filter((row) => row.data[field] === value)
      .filter((row) => orderField in row.data)
      .map((row) => ({ id: row.id, data: { ...row.data } }))
      .sort((a, b) => toMillis(b.data[orderField]) - toMillis(a.data[orderField]));
  }

  /** Conteúdo bruto de um documento, para asserções diretas no estado. */
  raw(collectionName: string, id: string): FakeDoc | null {
    const found = this.bucket(collectionName).find((row) => row.id === id);
    return found ? { ...found.data } : null;
  }

  count(collectionName: string): number {
    return this.bucket(collectionName).length;
  }
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  return 0;
}

/**
 * Equivalente ao `serverTimestamp()`: no Firestore real o valor só existe
 * depois da confirmação do servidor. Aqui resolvemos para um `Timestamp`
 * imediato, exceto quando o teste quer justamente o estado pendente — nesse
 * caso o documento é semeado com `createdAt: null` via `seed()`.
 */
export function fakeServerTimestamp(): Timestamp {
  return Timestamp.fromDate(new Date());
}

/** Auth fake: expõe apenas o `currentUser` que o `TaskService` consulta. */
export class FakeAuth {
  constructor(public currentUser: { uid: string } | null) {}

  signIn(uid: string): void {
    this.currentUser = { uid };
  }

  signOut(): void {
    this.currentUser = null;
  }
}

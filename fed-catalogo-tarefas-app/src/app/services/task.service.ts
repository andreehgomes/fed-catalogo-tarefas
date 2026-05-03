import { Injectable, Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  CollectionReference,
  DocumentData,
  Firestore,
  Timestamp,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from '@angular/fire/firestore';
import { map } from 'rxjs/operators';

import { TaskNotFoundError } from '../errors/task-not-found.error';
import {
  Task,
  TaskCreate,
  TaskCreateSchema,
  TaskOutSchema,
  TaskUpdate,
  TaskUpdateSchema,
} from '../models/task';

const TASKS_COLLECTION = 'tasks';

/**
 * Forma bruta de uma tarefa como gravada no Firestore. Datas são `Timestamp`
 * do SDK; `id` é opcional pois só existe após o `collectionData` injetar
 * via `idField`, não no momento da escrita.
 */
interface TaskRaw extends DocumentData {
  id?: string;
  title: string;
  description: string;
  priority: Task['priority'];
  status: Task['status'];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  userId?: string;
}

/**
 * Camada de persistência reativa para a coleção `tasks` no Firestore.
 *
 * Convenções:
 * - Toda entrada é validada com zod antes de tocar o Firestore.
 * - `createdAt` e `updatedAt` são gerenciados aqui, nunca pelo chamador.
 * - `list()` devolve um Signal já convertido a partir do Observable do
 *   AngularFire — RxJS fica restrito ao limite com a SDK, conforme decidido
 *   em DEC-003.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly firestore = inject(Firestore);

  private readonly tasksRef = collection(
    this.firestore,
    TASKS_COLLECTION,
  ) as CollectionReference<TaskRaw>;

  /**
   * Lista reativa de tarefas. O Signal atualiza automaticamente quando o
   * Firestore notifica mudanças.
   */
  list(): Signal<Task[]> {
    const data$ = collectionData<TaskRaw>(this.tasksRef, { idField: 'id' }).pipe(
      map((rows) => rows.map((row) => this.mapSnapshot(row.id ?? '', row))),
    );
    return toSignal(data$, { initialValue: [] });
  }

  /**
   * Lê uma tarefa específica por id. Lança `TaskNotFoundError` se o
   * documento não existir.
   */
  async getById(id: string): Promise<Task> {
    const ref = doc(this.firestore, TASKS_COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new TaskNotFoundError(id);
    }
    return this.mapSnapshot(id, snap.data() as TaskRaw);
  }

  /**
   * Cria uma nova tarefa. `createdAt` e `updatedAt` são preenchidos pelo
   * Firestore via `serverTimestamp()`. `userId` será preenchido a partir do
   * usuário autenticado na Release 2 — por ora fica indefinido.
   */
  async create(input: TaskCreate): Promise<string> {
    const parsed = TaskCreateSchema.parse(input);
    const ref = await addDoc(this.tasksRef, {
      ...parsed,
      createdAt: serverTimestamp() as unknown as Timestamp,
      updatedAt: serverTimestamp() as unknown as Timestamp,
    });
    return ref.id;
  }

  /**
   * Atualiza parcialmente uma tarefa. Os campos não informados ficam
   * inalterados; `updatedAt` é refrescado a cada chamada.
   */
  async update(id: string, partial: TaskUpdate): Promise<void> {
    const parsed = TaskUpdateSchema.parse(partial);
    const ref = doc(this.firestore, TASKS_COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new TaskNotFoundError(id);
    }
    await updateDoc(ref, {
      ...parsed,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Remove uma tarefa pelo id. Lança `TaskNotFoundError` se o documento já
   * não existir, para que a UI possa diferenciar de falhas reais.
   */
  async delete(id: string): Promise<void> {
    const ref = doc(this.firestore, TASKS_COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new TaskNotFoundError(id);
    }
    await deleteDoc(ref);
  }

  private mapSnapshot(id: string, raw: TaskRaw): Task {
    return TaskOutSchema.parse({
      id,
      title: raw.title,
      description: raw.description ?? '',
      priority: raw.priority,
      status: raw.status,
      createdAt: raw.createdAt?.toDate() ?? new Date(0),
      updatedAt: raw.updatedAt?.toDate() ?? new Date(0),
      userId: raw.userId,
    });
  }
}

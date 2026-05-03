import { Injectable, Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, authState } from '@angular/fire/auth';
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
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { NotAuthenticatedError } from '../errors/not-authenticated.error';
import { TaskNotFoundError } from '../errors/task-not-found.error';
import { UnauthorizedTaskAccessError } from '../errors/unauthorized-task-access.error';
import {
  Task,
  TaskCreate,
  TaskCreateSchema,
  TaskOutSchema,
  TaskUpdate,
  TaskUpdateSchema,
} from '../models/task';

const TASKS_COLLECTION = 'tasks';

interface TaskRaw extends DocumentData {
  id?: string;
  title: string;
  description: string;
  priority: Task['priority'];
  status: Task['status'];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  userId: string;
}

/**
 * Camada de persistência reativa para a coleção `tasks` no Firestore.
 *
 * Convenções:
 * - Todas as operações exigem usuário autenticado; sem ele, lança
 *   `NotAuthenticatedError`.
 * - Toda entrada é validada com zod antes de tocar o Firestore.
 * - `createdAt` e `updatedAt` são gerenciados aqui, nunca pelo chamador.
 * - `userId` é preenchido automaticamente a partir do usuário autenticado.
 * - `update()` e `delete()` validam ownership antes de mutar — defesa em
 *   profundidade contra cenários onde as rules ainda não estejam publicadas.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);

  private _tasksRef: CollectionReference<TaskRaw> | null = null;
  private get tasksRef(): CollectionReference<TaskRaw> {
    if (!this._tasksRef) {
      this._tasksRef = collection(
        this.firestore,
        TASKS_COLLECTION,
      ) as CollectionReference<TaskRaw>;
    }
    return this._tasksRef;
  }

  /**
   * Lista reativa das tarefas do usuário corrente, ordenadas por data de
   * criação (mais recentes primeiro). Quando não há usuário, devolve uma
   * lista vazia — não lança erro: o componente já é protegido pelo
   * `authGuard` e o estado vazio é o comportamento esperado durante o
   * intervalo entre logout e redirect.
   */
  list(): Signal<Task[]> {
    const data$: Observable<Task[]> = authState(this.auth).pipe(
      switchMap((user) => {
        if (!user) {
          return of<Task[]>([]);
        }
        const q = query(
          this.tasksRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
        );
        return collectionData<TaskRaw>(q, { idField: 'id' }).pipe(
          map((rows) => rows.map((row) => this.mapSnapshot(row.id ?? '', row))),
        );
      }),
    );
    return toSignal(data$, { initialValue: [] });
  }

  async getById(id: string): Promise<Task> {
    const userId = this.requireUserId();
    const ref = doc(this.firestore, TASKS_COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new TaskNotFoundError(id);
    }
    const raw = snap.data() as TaskRaw;
    if (raw.userId !== userId) {
      throw new UnauthorizedTaskAccessError(id);
    }
    return this.mapSnapshot(id, raw);
  }

  async create(input: TaskCreate): Promise<string> {
    const userId = this.requireUserId();
    const parsed = TaskCreateSchema.parse(input);
    const ref = await addDoc(this.tasksRef, {
      ...parsed,
      userId,
      createdAt: serverTimestamp() as unknown as Timestamp,
      updatedAt: serverTimestamp() as unknown as Timestamp,
    });
    return ref.id;
  }

  async update(id: string, partial: TaskUpdate): Promise<void> {
    const userId = this.requireUserId();
    const parsed = TaskUpdateSchema.parse(partial);
    const ref = doc(this.firestore, TASKS_COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new TaskNotFoundError(id);
    }
    if ((snap.data() as TaskRaw).userId !== userId) {
      throw new UnauthorizedTaskAccessError(id);
    }
    await updateDoc(ref, {
      ...parsed,
      updatedAt: serverTimestamp(),
    });
  }

  async delete(id: string): Promise<void> {
    const userId = this.requireUserId();
    const ref = doc(this.firestore, TASKS_COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new TaskNotFoundError(id);
    }
    if ((snap.data() as TaskRaw).userId !== userId) {
      throw new UnauthorizedTaskAccessError(id);
    }
    await deleteDoc(ref);
  }

  private requireUserId(): string {
    const user = this.auth.currentUser;
    if (!user) {
      throw new NotAuthenticatedError();
    }
    return user.uid;
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

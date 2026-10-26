import { Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';

import { Task, TaskPriority, TaskStatus } from '../models/task';

/**
 * Caso CI-08 — o contrato de emissão do Signal devolvido por `TaskService.list()`.
 *
 * Usa o `toSignal` real do Angular, não um fake: o que está sob teste é
 * justamente a semântica de emissão da biblioteca, que a LLM errou ao gerar
 * o caso (supôs emissão imediata dos dados). Ver
 * `docs/pos-ia/forum-testes-integracao/prompts/01-cenarios-integracao.md`,
 * ajuste 2 de P-103.
 */
describe('Integração — contrato reativo do list() (CI-08)', () => {
  function makeTask(title: string): Task {
    return {
      id: `id-${title}`,
      title,
      description: '',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.OPEN,
      createdAt: new Date('2026-10-20T10:00:00Z'),
      updatedAt: new Date('2026-10-20T10:00:00Z'),
      userId: 'user-1',
    };
  }

  it('emite [] como initialValue antes de os dados do Firestore chegarem', () => {
    const source = new Subject<Task[]>();

    const tasks: Signal<Task[]> = TestBed.runInInjectionContext(() =>
      toSignal(source, { initialValue: [] as Task[] }),
    );

    // Invariante: a UI tem um estado inicial definido — nunca undefined.
    expect(tasks()).toEqual([]);

    source.next([makeTask('Primeira')]);
    expect(tasks().length).toBe(1);
    expect(tasks()[0].title).toBe('Primeira');

    // Emissões subsequentes do listener do Firestore substituem o valor.
    source.next([makeTask('Primeira'), makeTask('Segunda')]);
    expect(tasks().length).toBe(2);
  });

  it('mantém o último valor emitido após o complete do stream', () => {
    const source = new Subject<Task[]>();
    const tasks = TestBed.runInInjectionContext(() =>
      toSignal(source, { initialValue: [] as Task[] }),
    );

    source.next([makeTask('Única')]);
    source.complete();

    expect(tasks().length).toBe(1);
  });
});

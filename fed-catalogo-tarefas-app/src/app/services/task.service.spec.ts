import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

import { NotAuthenticatedError } from '../errors/not-authenticated.error';
import { TaskPriority, TaskStatus } from '../models/task';
import { TaskService } from './task.service';

/**
 * Testes unitários do `TaskService` focados na fronteira pública SEM
 * tocar o Firestore real: mockamos `Auth` como sem usuário e validamos
 * que as operações que requerem auth lançam `NotAuthenticatedError`.
 *
 * Os testes do caminho feliz com Firestore vivem no E2E Playwright
 * (`e2e/tasks-flow.spec.ts`), que roda contra o projeto real.
 */
describe('TaskService — fronteira de autenticação', () => {
  let service: TaskService;

  beforeEach(() => {
    const authStub = { currentUser: null } as unknown as Auth;
    const firestoreStub = {} as unknown as Firestore;

    TestBed.configureTestingModule({
      providers: [
        TaskService,
        { provide: Auth, useValue: authStub },
        { provide: Firestore, useValue: firestoreStub },
      ],
    });
    service = TestBed.inject(TaskService);
  });

  it('create() lança NotAuthenticatedError quando não há usuário', async () => {
    await expectAsync(
      service.create({
        title: 'x',
        description: '',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.OPEN,
      }),
    ).toBeRejectedWithError(NotAuthenticatedError);
  });

  it('update() lança NotAuthenticatedError quando não há usuário', async () => {
    await expectAsync(
      service.update('any-id', { title: 'x' }),
    ).toBeRejectedWithError(NotAuthenticatedError);
  });

  it('delete() lança NotAuthenticatedError quando não há usuário', async () => {
    await expectAsync(service.delete('any-id')).toBeRejectedWithError(NotAuthenticatedError);
  });

  it('getById() lança NotAuthenticatedError quando não há usuário', async () => {
    await expectAsync(service.getById('any-id')).toBeRejectedWithError(NotAuthenticatedError);
  });
});

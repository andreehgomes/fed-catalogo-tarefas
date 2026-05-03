import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { publicOnlyGuard } from './guards/public-only.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/tasks/tasks.component').then((m) => m.TasksComponent),
    title: 'Minhas tarefas',
  },
  {
    path: 'login',
    canActivate: [publicOnlyGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
    title: 'Entrar',
  },
  { path: '**', redirectTo: '' },
];
